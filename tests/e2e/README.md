# End-to-end tests

Playwright drives the real frontend against the real Go backend. Running the
suite starts everything it needs, so there is nothing to set up by hand:

```bash
pnpm test:e2e
```

The first run downloads the browsers:

```bash
pnpm exec playwright install chromium firefox
```

## What starts

`playwright.config.ts` brings up three servers:

| Server | Address | What it is |
|---|---|---|
| backend | `127.0.0.1:8060` | `go run . serve`, with its data in `backend/pb_test_data` |
| frontend | `localhost:6173` | a production build, served by `vite preview` |
| mock services | `127.0.0.1:8099` | stands in for the APIs the backend calls out to |

Locally these are reused if they are already running, so a second run starts in
seconds. In CI they are always started fresh.

The frontend is built rather than served by the dev server. With several browser
workers at once, on-demand compilation made assertions time out and different
tests failed on each run. Serving a build took the whole suite from a little over
two minutes to about fifty seconds, and it stopped failing intermittently.

Nothing in the suite reaches the internet. `tests/e2e/mock-services/server.mjs`
answers the flight lookup, the assistant's model endpoint and the exchange rate
API, and the setup project points the backend's stored settings at it. If a test
needs a service that is not mocked yet, add a route there rather than calling
the real one.

## How a test gets its data

The `setup` project runs first and prepares the backend once: a few places,
airports, airlines and currency rates for the search fields, the external
services pointed at the mock server, and a signed-in session file for tests that
do not need a user of their own. It is idempotent, so running the suite twice
against the same backend is fine.

Everything else is seeded per test through the REST API, using the fixtures in
`tests/e2e/fixtures/test.ts`:

```ts
import { expect, test } from '../../fixtures/test';

test('a trip belongs to its owner', async ({ page, user, createTrip, signIn }) => {
  const trip = await createTrip({ name: 'Paris in June' });

  await signIn(page, user);
  await page.goto(`/trips/${trip.id}`);

  await expect(page.locator('#app-header').getByText('Paris in June')).toBeVisible();
});
```

| Fixture | What it gives you |
|---|---|
| `user` | a user created for this test alone |
| `createUser(label)` | another user, for sharing and access tests |
| `createTrip(fields, owner)` | a trip owned by `user`, or by whoever you pass |
| `signIn(page, user)` | puts a page into that user's session |
| `api` | the REST API as the superuser, for seeding anything else |
| `apiAs(user)` | the REST API as a given user, for what only they may do |

Because each test makes its own user, tests do not share state and the suite
runs fully parallel. Seed through the API rather than by driving the UI: it is
faster, and a test for one screen then does not break when another changes.

Traveller profile emails are unique across the whole instance, so give seeded
profiles a unique address (`fixtures/api.ts` exports `unique()` for this) or the
second run of a test will fail on the collision.

Dates need care. The trip form sends the picked day's **local** midnight, so
seed trip dates with `storedDay('2026-06-01')` or `isoDay(7)` from
`fixtures/api.ts`. A literal `00:00:00.000Z` shows up as the day before
anywhere west of UTC.

## Waiting

Use web-first assertions, never `waitForTimeout`. After submitting a form, wait
for it to close rather than for a fixed delay:

```ts
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByRole('button', { name: 'Save' })).toBeHidden();
```

Two ordering traps caused most of the flakiness that was here before:

- A `page.route` mock has to be installed **before** the page asks for that
  data. A route added after `goto` never gets a second chance.
- `page.waitForResponse` has to be started **before** the click that triggers
  it, or the response can arrive while nothing is listening:

```ts
const saved = page.waitForResponse(/records/);
await page.getByRole('button', { name: 'Accept' }).click();
await saved;
```

## Projects

| Project | Covers |
|---|---|
| `setup` | seeds the backend, writes the session file |
| `chromium`, `firefox` | the signed-in suite |
| `anonymous` | sign-in and sign-up, which must start signed out |

Run one of them with `--project`:

```bash
pnpm exec playwright test --project=chromium
```

A single file, or a single test by name:

```bash
pnpm exec playwright test tests/e2e/pages/ViewTrip/Lodging.spec.ts
```

```bash
pnpm exec playwright test -g 'should add a hotel lodging'
```

Headed, to watch it work:

```bash
pnpm exec playwright test --project=chromium --headed
```

## When something fails

Failures keep a screenshot, a video and, on a retry, a trace. The HTML report
collects them:

```bash
pnpm exec playwright show-report
```
