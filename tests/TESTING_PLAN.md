# Testing plan

This plan raises unit test coverage for the Go backend and the TypeScript frontend, and
builds a Playwright suite that covers all major functionality and runs locally.

It is delivered as a stack of pull requests. Each PR builds on the previous one and raises the
coverage thresholds that CI enforces, so coverage can only go up.

## Baseline (before this plan)

| Area        | Code                                  | Tests                                                     | Coverage |
|-------------|---------------------------------------|-----------------------------------------------------------|----------|
| Go backend  | ~5,700 lines (excluding migrations)   | none                                                      | 0%       |
| TS frontend | ~18,300 lines                         | 3 files (`time.ts`, `PlacesMultiSelect`, `AirportSelect`) | 3.5%     |
| E2E         | –                                     | 9 specs, ~41 tests                                        | –        |

Problems with the existing e2e suite:

- It shares a persistent `backend/pb_test_data` directory between runs.
- It sleeps with `waitForTimeout`, including a 50 second wait for the places dataset to load.
- It seeds data through the UI, and the admin credentials are hardcoded in several files.
- Nothing runs in CI.

## Running the tests

| Command                       | What it runs                                                             |
|-------------------------------|--------------------------------------------------------------------------|
| `pnpm test`                   | Frontend unit tests (Vitest)                                             |
| `pnpm test:coverage`          | Frontend unit tests with coverage, report in `coverage/`                 |
| `pnpm test:go`                | Go tests                                                                 |
| `pnpm test:go:coverage`       | Go tests with coverage across all packages, report in `backend/coverage.out` |
| `pnpm test:e2e`               | Playwright suite (starts the frontend and backend itself)                |

## Writing Go tests

`backend/testutil` creates a throwaway PocketBase app in a temp directory, runs every Surmai
migration and registers Surmai's routes and hooks on it.

- `testutil.NewApp(t)` returns an app for tests that work with records directly.
- `testutil.AppFactory(seed)` is a `TestAppFactory` for `tests.ApiScenario`. The `seed` function
  runs on each scenario's fresh app before the request.
- `CreateUser`, `CreateTrip`, `CreateRecord`, `AuthHeaders` and `Superuser` seed data and
  authenticate requests.

Tests that use `testutil` must be in an external test package (`package routes_test`), because
`testutil` imports `backend/app`, which imports most other packages.

## The stack

### PR 1: Plan and test infrastructure

- This document.
- `backend/testutil`, with `app.RegisterRoutes`/`app.RegisterEventHooks` split out so routes and
  hooks can be bound to a test app.
- `@vitest/coverage-v8`, coverage scripts and thresholds.
- A `Tests` GitHub workflow running Go and frontend unit tests with coverage on every PR.
- Smoke tests for `/site-settings.json` and the destination time zone hook.

### PR 2: Go access control — done

Users must only see their own data. `tests.ApiScenario` tables cover every collection
(trips, transportations, lodgings, activities, trip_expenses, trip_attachments,
traveller_profiles, invitations, notifications, settings) for each actor:
owner, collaborator, linked traveller, unrelated user, anonymous and superuser.
Also covers `middleware.RequireTripAccess`, `hooks.AddTripAccessAttribute`,
`hooks.RestrictManagersUpdate` and the superuser-only routes.

### PR 3: Go trip export, import and calendar — done

- The per-collection readers that `routes/generate_ics_data.go` kept its own
  copies of now live once in `trips/records.go`, used by both the archive export
  and the calendar route.
- Export → import round trip, including attachments, cover image, expense links
  and traveller profiles, both within one instance and between two.
- Malformed archives, and `routes/generate_ics_data.go`: all-day trip events,
  entry time zones, missing end dates and the `allTimezonesAvailable` flag.

Fixed while writing these tests:

- `getParticipants`/`getDestinations` called `log.Fatal` when a trip's JSON field
  held an unexpected shape, which exits the server process. A client can store a
  string in `participants`, so any user could stop the backend by exporting their
  own trip. The shared readers log and skip the field instead.
- `ImportZip` ignored the error from opening `trip.json` and then dereferenced
  nil, so uploading any zip without that file panicked the request.
- The calendar reported `allTimezonesAvailable` backwards for activities: a trip
  whose activities all had time zones warned that some were missing, and one
  with activities missing them did not.

### PR 4: Go routes, hooks and jobs — done

- The flight providers and the currency job take an optional base URL and HTTP
  client, so nothing reaches the internet in a test. The flight provider address
  can also be set in the stored config, which is how the route test redirects it.
- The jobs take a `core.App` instead of a `*pocketbase.PocketBase`, so they run
  against a test app.
- Routes: `save_entity` for all three kinds, account invitations and invited user
  creation, collaborators, flight lookup and its caching, dataset loading,
  impersonation, export.
- Hooks: collaboration invitations end to end (create, accept, reject, who may
  answer), traveller profile takeover on signup, announcement notifications.
- Jobs: invitation and expired content cleanup, currency sync.

Fixed while writing these tests:

- The `/save-transportation`, `/save-lodging` and `/save-activity` routes took
  `entityId`, `existingExpenseId` and `existingAttachmentIds` from the request
  and never checked they belonged to the trip being saved. Because these routes
  save through the app rather than the collection rules, a signed-in user who
  knew a record id could move another user's record into their own trip, or
  overwrite their expense. All three are now scoped to the trip.
- Both cleanup jobs compared dates by binding a `time.Time`, which formats with
  Go's `String()` rather than the stored layout, so the comparison only worked
  while the server ran in UTC. Expired invitations were never marked and expired
  content was never deleted. An empty expiry also sorted below every date, so
  announcements and notifications that never expire were deleted instead.
- `create_invited_user` and `create_account_invitation` type asserted body
  fields, so a request with, say, a numeric `invitationCode` panicked the
  handler. `create-user` is public. They now validate and return 400.
- The three dataset loaders called `log.Fatal` on a missing or corrupt file,
  which exits the server process; a superuser loading a dataset on a broken
  install would take the backend down. They return the error, and the dataset
  directory is a variable so tests can point at the bundled files.

### PR 5: Go assistant — done

- Every booking importer (flight, hotel, car rental, activity, parking,
  transportation) against fixture model output, including bookings that fall
  outside any trip, belong to another user, or carry dates the model could not read.
- `FuzzyMatchDestination`, which attaches a booking to a trip destination.
- `ai_client` and `email_processor` against a stub Responses API: the structured
  schema it asks for, HTML-only emails, and the failure paths.
- The IMAP client's unconfigured and unreachable paths, which run on a schedule.
- The demo data job.

Fixed while writing these tests:

- The demo data job ran `defer open.Close()` before checking the error from
  `os.Open`, so a missing archive dereferenced nil. It runs from the cron, where
  an unrecovered panic in the goroutine would take the process down.
- Several `slog` calls passed printf placeholders and positional arguments, which
  slog never expands, so the values were logged as malformed key-value pairs.

Go coverage reached 74%, with `flights` at 96%, `middleware` 95%, `settings` 88%,
`hooks` 84%, `jobs` 78%, `trips` 77%, `assistant` 74% and `routes` 73%.

### PR 6: TypeScript logic — done

- `useTravelBoardStatistics` against a mocked API layer, including regression
  tests for #363 (expense conversion), #368 (nights by calendar day) and #369
  (travel time across time zones).
- The expense helpers (currency conversion, totals by currency, colours,
  formatting), the itinerary day indexes and ordering, `lib/places`, and the
  rest of `lib/time`.
- `vitest.setup.ts` extends dayjs with the same plugins as `main.tsx`, since
  anything using `dayjs.tz` fails without them.
- `tests/unit/helpers/queryClient.tsx` wraps hooks under test in a query client
  that does not retry or cache.

The pure logic modules are at or near 100% of statements. Page components are
left to the Playwright suite.

### PR 7: TypeScript API layer — done

`tests/unit/helpers/pocketbase.ts` stands in for the SDK client, recording every
collection call and standing in for the batch used to upload attachments. The api
modules take their collection handles at import time, so it is installed with
`vi.mock` before the module under test is imported.

Covered: trips, expenses, transportations, attachments and the reference data
lists — the filters, sort orders, paging and payloads each one sends, plus the
conversion of stored timestamps back to browser time. Also `useTripExpenses`.

### PR 9: Lint, and the settings forms — done

`pnpm lint` passes with `--max-warnings 0` and runs in CI. It was reporting 78
warnings, none of which were being looked at:

- 78 `import/order` were fixed with `eslint --fix`, along with 3
  `consistent-type-imports`.
- 6 `react-hooks/rules-of-hooks` were false positives: Playwright's fixtures
  take a callback named `use`, which the rule mistook for the `use` hook. The
  rule is now off for `tests/e2e`, where nothing is a React component.
- The generated `coverage/` directory was being linted, which accounted for 6
  more.
- Where a dependency genuinely cannot be declared there is now a scoped disable
  with the reason. Mantine's `useForm` and `useCombobox` both return a new
  object on every render, so declaring either re-runs the effect in a loop.
  Declaring the combobox store was tried first and made the destination and
  airport dropdowns re-render continuously, so they never accepted a click;
  the e2e suite caught it.

The `react-hooks/exhaustive-deps` warnings on the settings forms led to a real
bug: the flight provider, assistant and booking import forms only filled
themselves in when the setting was *enabled*. A setting saved as disabled
showed blank fields, and saving that form wrote the blanks over the stored
endpoint, key and credentials. Covered twice, since both levels are cheap here:
`tests/e2e/pages/Settings/Settings.spec.ts` drives the real screens, and
`tests/unit/components/settings/SettingsForms.test.tsx` asserts the payload each
form submits for a stored-but-disabled setting.

A stray `console.log` in the flight provider form, which printed the submitted
values including the provider API key to the browser console, is gone.

### PR 10: What the entity forms submit — done

The flight, generic transportation, lodging, activity and expense forms all
assemble a payload by hand before saving, and all five share the same traps:

- `fakeAsUtcString` has to turn the picker's local value into an instant, or an
  entry lands a day out for anyone east or west of UTC.
- An expense is only attached when the cost is greater than zero, and its name
  is derived from the entry ("Flight: SFO to LHR", "Lodging: Hotel Bristol").
- `existingExpenseId` has to be dropped when the id is no longer among the
  trip's expenses, or saving writes against an expense that is gone.
- The expense form's splits seed evenly with the rounding remainder on the
  first traveller, and will not save unless they add up to the total.

These are asserted against the mocked `saveTransportation`, `saveLodging`,
`saveActivity`, `createExpense` and `updateExpense`, mostly by opening a form
on an existing record and submitting it, which keeps the date pickers out of
it. The e2e suite already covers filling the forms in by hand.

Frontend coverage is now 25% of statements and 22% of branches, up from 17%
and 11%.

### PR 11: The itinerary pdf — done

`pdfGenerator` builds a pdfmake document by hand from the trip and its
entries. The tests mock `pdfmake` and assert the document definition and the
file name it is handed, which is the data assembly rather than the rendering.

- The full itinerary opens with the trip, its destinations and its travellers,
  leaves those sections out when there are none, orders the entries
  chronologically whatever order they arrive in, and appends the notes on a new
  page converted from their html.
- The daily itinerary gives a header only to days that have something on them,
  starts every day after the first on a new page, repeats a stay on each day it
  covers including the nights with neither end on them, shows an activity only
  on its start day, and shows an overnight journey on both ends.
- A car rental is laid out by pickup and drop off rather than departure and
  arrival, other journeys are headed with their own type, and an entry names
  only the travellers it is for.

`pdfGenerator` is at 65% of statements and 58% of branches; the rest is the
html-to-pdfmake conversion for tags the notes editor does not produce.

Frontend coverage is now 28% of statements and 26% of branches.

### Still to do

- The remaining Playwright areas in the table below.

### PR 8: Playwright foundation — done

- Tests seed through the REST API with `tests/e2e/fixtures/`, not by driving the
  UI. Each test makes its own user, so nothing is shared and the suite runs
  fully parallel.
- Fixtures: `user`, `createUser`, `createTrip`, `signIn(page, user)`, `api` as
  the superuser and `apiAs(user)`. `signIn` writes the session the SDK reads, so
  a page starts signed in without going through the form.
- A small set of places, airports, airlines and currency rates replaces loading
  the real datasets, which took minutes and was waited out with a fixed sleep.
- `tests/e2e/mock-services/server.mjs` stands in for the flight lookup, the
  assistant's model endpoint and the exchange rate API, and the setup project
  points the backend's stored settings at it, so nothing reaches the internet.
- Every `waitForTimeout` is gone, replaced with web-first assertions.
- The frontend is served as a production build rather than by the dev server:
  with several browser workers at once, on-demand compilation made assertions
  time out and a different test failed on each run.
- Servers are reused locally and started fresh in CI. Projects: `setup`,
  `chromium`, `firefox`, and `anonymous` for the screens that must start signed
  out. The suite runs in CI on every pull request.
- 85 tests, three consecutive clean runs at about 50 seconds each.
- `tests/e2e/README.md` rewritten, including the two traps worth knowing: trip
  dates are stored as the picked day's *local* midnight, and traveller profile
  emails are unique instance-wide.

This also fixed the seven specs that were failing before any of this work. The
cause was the Travelers field: the suite looked for a textbox, but it became a
`combobox` over traveller profiles when profiles were introduced, so the old
`beforeAll` hung for 30 seconds and took the first test of each file down with
it. Those specs now seed their trip instead of creating it through that form.

### PR 9 onward: Playwright specs

| Area                  | Specs                                                                                      |
|-----------------------|--------------------------------------------------------------------------------------------|
| Auth                  | sign in/up (exists), sign out, change password, sign up blocked when disabled              |
| Trips                 | create (exists), edit basics and destinations, cover image, delete, My Trips list, export → import, calendar download |
| Transportation        | add flight/train/car (exists), edit, delete, flight lookup (stubbed)                       |
| Lodging, activities   | add (exists), edit, delete                                                                 |
| Attachments           | upload, view and delete from the Attachments tab                                           |
| Notes                 | add (exists), edit                                                                         |
| Itinerary             | ordering across days and time zones, PDF download                                          |
| Expenses              | add, split between participants, mixed currencies, stat cards                              |
| Collaboration         | ✅ invite, accept, reject, unrelated user denied; still to do: edit as collaborator, remove |
| Invitations           | trip invitations (exists), account invitation → sign up                                   |
| Traveller profiles    | create, manage, add as trip traveller                                                      |
| Travel Board          | statistics for seeded trips                                                                |
| Admin settings        | invite user, user list, impersonate, announcements, datasets, SMTP/OpenAI test buttons     |
| Assistant             | booking import with a stubbed LLM; IMAP path optional (needs Docker)                       |
| Profile, notifications | edit profile, read/dismiss notifications, change language                                 |
