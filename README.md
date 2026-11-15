# Imt Smart Teens

React + TypeScript frontend for the reviewed Rust v1 API. The Indonesian UI preserves the existing Editorial Campus palette, typography, photography, clean BrowserRouter URLs and legacy hash redirects. Student views use public pinned content only; admin editors and scoped historical reports are separate views.

## Run against Rust

Use the lockfile with Node22.12+ (this integration was exercised with Node26):

```sh
npm ci
# Start the reviewed Rust/PostgreSQL service separately on loopback4180.
# See its docs/runtime-contract.md for operator-owned settings/migration/provisioning.
npm run dev
```

Open `http://127.0.0.1:5173/`. Vite rewrites HTML navigation to the editable `app.html` source entry and proxies `/api/v1` to Rust4180. The dev script checks Rust readiness directly before starting Vite. It never starts or falls back to `server/development.mjs`.

For a built local SPA:

```sh
npm run build
npm start
```

The build type-checks, emits `dist/app.html`, and publishes the SPA entry as `index.html` with generated `assets/app-*` files. `npm start` serves that build through loopback Vite preview5173 and the same Rust proxy. Both services remain separate processes. Stop only processes you started.

`RUST_API_ORIGIN` changes the **Node-side** dev/preview proxy target; default `http://127.0.0.1:4180`. Do not put credentials or database URLs in `VITE_*` variables. The browser always uses same-origin `/api/v1`. Production hosting must serve `index.html` for extensionless frontend routes, proxy the real API separately, use secure HttpOnly cookies and an explicitly allowlisted frontend Origin. Host/nginx/deployment configuration is not changed here.

## Sessions, retries and persistence

- Student identity requires an active school UUID selected from a searchable, paginated catalog. The date input stays `YYYY-MM-DD`; it is not converted to a timestamp.
- Rust issues separate opaque student/admin HttpOnly cookies. There are no browser bearer tokens, seeded account hints, name-based recovery or retained legacy teacher roles. `/guru/*` routes redirect to the admin area; historical fixture tokens cannot authenticate to Rust.
- CSRF is fetched explicitly and held only in memory. Login/enrollment rotations replace the token. Reload restores each role independently with its GET endpoint. Target-role logout does not clear the other role.
- One random key and validated payload are retained for an enrollment action. A sessionStorage uncertainty journal contains only its form/key, **never CSRF or credentials**. A current-context retry retains the original CSRF as well. A reloaded unauthenticated journal is blocked: a fresh CSRF GET cannot prove the HttpOnly enrollment context survived. Only authenticated `student/me` recovery clears the uncertainty and permits safe CSRF rebinding. There is no "start again" button that risks a duplicate identity.
- Authenticated attempt/submission/measurement operations retain scoped keys across uncertain retries and reload. Changed payloads are rejected while the old operation is uncertain. These journals are retry metadata, not authoritative progress or grading records.
- Answer saves use snapshot-question IDs and actual answer revisions (initial0). Empty arrays clear answers. Revision409 preserves local input, adopts only the returned committed revision and requires deliberate retry. Student keys/correctness are never downloaded.
- Progress, stage locks, scores, immutable content, BMI display and measurements are server results. Zero and null are distinct. Required section visits and lesson completion are distinct writes. The frontend does not calculate persisted scores, progress policy or BMI.
- `progress.active_attempt_ids` contains only in-progress attempts. Known submitted IDs are retained only within the same in-memory enrollment. Reopening a completed assessment/summary discovers its existing attempt through the documented idempotent create-or-return endpoint, then reads the public snapshot; it never treats missing active IDs as an unstarted stage.

## Admin content, schools and reports

- No public default admin account exists. An operator provisions an admin privately in Rust and separately assigns school reporting grants. Content and school-catalog permissions do not imply access to student reports.
- Bounded lists and selected detail screens cover lessons, the paired pre/post and quiz banks, schools, enrollment summaries and historical answers. Editors use stable draft section/option UUIDs and expected root revisions. Draft save, lesson/bank publication and path publication are distinct actions. Path order is explicit, archives confirm and preserve history, and revision conflicts retain entered values.
- Published option IDs differ from draft option IDs. Student snapshots remain pinned across subsequent CMS edits/publications/archive. Editorial content is plain text rendered with escaped React text nodes, never HTML injection.
- Reports query authorized summaries first, selected enrollment results next, and bounded answer pages only on demand. Filters use school UUID, date-only form ranges, stage, assessment type and UTC RFC3339 submission bounds. School labels on historical results are enrollment snapshots.
- Per-question reports require a selected immutable `question_version_id`, not a root ID or editor revision. Version selection persists independently of latest draft/history refresh. Pending, cleared, unstarted, correct and incorrect answers remain distinguishable.

## Tests and real browser proof

```sh
npm test
npm run build
npx playwright install chromium
# Paths below are operator-supplied PRIVATE files, not files in this repo:
E2E_PRIVATE_ENV=/path/to/private/synthetic-runtime.env \
E2E_GRANT_HELPER=/path/to/operator/synthetic-school-grant.py \
npm run test:e2e
```

`E2E_PRIVATE_ENV` supplies generated `ADMIN_EMAIL` and `ADMIN_PASSWORD` to the **Node test worker only**. Login is injected with Playwright's Node request context, never browser environment/storage, URLs, committed files or screenshots. Traces/video/automatic screenshots are disabled to avoid authentication artifacts. Explicit screenshots show only post-authentication synthetic data or empty login forms.

`E2E_GRANT_HELPER` is an optional operator-owned Python helper required by the school-creation/reporting test. Its sole argument is the canonical UUID of the new synthetic school. A portable equivalent must be hard-bound to the owned synthetic DB and test admin, assign only that school's reporting grant, and verify the assignment. It must not create teaching data, answers, scores or progress; no public UI calls it. No absolute helper path or secret is committed here.

The browser suite uses the real already-running Rust API/PostgreSQL and one Chromium worker. It authors teaching content through the actual CMS UI, creates a synthetic school, enrolls/completes a student, republishes after enrollment to prove old snapshots, verifies reports against an explicitly selected historical version, exercises response loss/refresh/fail-closed enrollment, role coexistence/ownership/target logout, school scope denial, real revision conflicts and confirmed archive. It checks clean/hash routes, denied localStorage, reduced motion, keyboard forms/dialogs and360/768/1024/1440px layouts. Actual screenshots are written to ignored `test-results/evidence`.

The suite deliberately waits for the real per-IP300 requests/60s budget at startup and between the large CMS journey and remaining tests. Do not disable rate limiting, auto-retry uncertain writes, run concurrent browser fleets or point the suite at application/production data. Existing synthetic test data is inspected/reused; the suite never wipes the database.

On minimal Linux hosts, Chromium may need shared libraries. Without authorization to install host packages, download/extract dependencies to a private scratch directory and set `LD_LIBRARY_PATH` **only for the test command**. Do not use privileged OS installs. The Task4 report records exact execution evidence and any environment-specific paths; they are not portable setup requirements.

`npm test` explicitly labels the six historical Node domain tests as `test:legacy-domain`; the active Vitest tests cover the Rust transport, operation journals, revisioned views and admin adapters. Historical fixture-backed browser/component tests are retained under `tests/legacy/*.fixture.*`, outside active test globs. Neither these legacy files nor `server/` are Rust integration evidence or a runtime fallback.

## Source boundaries and assets

`src/services/dto.ts` declares Rust wire DTOs; `http.ts` owns cookie/CSRF envelopes/errors; `api.ts` composes the current public student view; `admin.ts` declares exact CMS/report commands. Presentation models and route/status mapping live in `src/domain`; UI state is not persisted learning state. Existing tokens/components/styles and measurement photograph are retained.

Photo provenance/license is in `public/assets/stock/credits.json` (copied into built assets). The supplied photograph uses a blue measuring tape; it was not recolored. Production rollout, infrastructure/TLS/privacy acceptance and independent whole-app review remain separate owner gates.
