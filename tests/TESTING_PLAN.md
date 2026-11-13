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

### PR 2: Go access control

Users must only see their own data. `tests.ApiScenario` tables cover every collection
(trips, transportations, lodgings, activities, trip_expenses, trip_attachments,
traveller_profiles, invitations, notifications, settings) for each actor:
owner, collaborator, linked traveller, unrelated user, anonymous and superuser.
Also covers `middleware.RequireTripAccess`, `hooks.AddTripAccessAttribute`,
`hooks.RestrictManagersUpdate` and the superuser-only routes.

### PR 3: Go trip export, import and calendar

- Export → import round trip through `trips/export.go` and `trips/import/zip`,
  including attachments and traveller profiles. Also the JSON importer.
- `routes/generate_ics_data.go`: time zones, all-day trip events, missing dates.
  Its `export*` helpers duplicate `trips/export.go` and are consolidated first.

### PR 4: Go routes, hooks and jobs

- Make outbound HTTP injectable (FlightAware, adsbdb, currency rates, OpenAI) so tests use `httptest`.
- Routes: `save_entity`, account invitations and invited user creation, collaborators,
  flight route lookup, dataset loading, impersonation.
- Hooks: trip collaboration invitations, traveller profile assignment, notifications.
- Jobs: invitation and expired content cleanup, currency sync, demo data import.

### PR 5: Go assistant

- Each booking importer (flight, hotel, car rental, activity, parking, transportation)
  against fixture LLM responses.
- `ai_client` against a stub OpenAI compatible server, `email_processor` with fixture emails.
- `imap_client` stays behind an `integration` build tag.

Target after PR 5: at least 60% overall, 80% for `trips`, `routes`, `hooks` and `middleware`.

### PR 6: TypeScript logic

- `renderWithProviders()` test helper (Mantine, router, i18n, Surmai context).
- Pure logic, target 90%: `useTravelBoardStatistics` (with regression tests for #363, #368, #369),
  expense helpers and `useTripExpenses`, itinerary helpers, `lib/time`, `lib/places`, `lib/image`,
  and the data assembly in `pdfGenerator`.

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
