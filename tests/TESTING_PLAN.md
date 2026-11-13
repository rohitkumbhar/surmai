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

### PR 7: TypeScript API layer and forms

- `lib/api/pocketbase/*`: the filters, expands and payloads sent to a mocked PocketBase client.
- Forms: transportation forms, expense form and splits, lodging and activity forms,
  settings forms (SMTP, OpenAI, OAuth2), `useCurrentUser`.
- Page composition is left to the e2e suite.

Target after PR 7: 55–60% overall.

### PR 8: Playwright foundation

- Every run starts with an empty, temporary PocketBase data directory.
- Seed data through the REST API with a superuser token rather than through the UI.
  Load a small fixture places dataset instead of the full one.
- Fixtures: `adminApi`, a `user` factory (unique user per test), a `trip` factory, and
  `asUser(page, user)` to sign a page in as a given user, so tests can use several users.
- A mock HTTP server, started by Playwright, stands in for FlightAware, adsbdb, currency rates
  and the OpenAI endpoint, whose base URLs become configurable.
- Web-first assertions instead of `waitForTimeout`.
- `reuseExistingServer` locally, Chromium and Firefox projects, and an updated `tests/e2e/README.md`.

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
| Collaboration         | invite, accept as a second user, edit as collaborator, remove; unrelated user is denied    |
| Invitations           | trip invitations (exists), account invitation → sign up                                   |
| Traveller profiles    | create, manage, add as trip traveller                                                      |
| Travel Board          | statistics for seeded trips                                                                |
| Admin settings        | invite user, user list, impersonate, announcements, datasets, SMTP/OpenAI test buttons     |
| Assistant             | booking import with a stubbed LLM; IMAP path optional (needs Docker)                       |
| Profile, notifications | edit profile, read/dismiss notifications, change language                                 |
