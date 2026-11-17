# Imt Smart Teens

React + TypeScript frontend for the reviewed Rust v1 API. The Indonesian UI preserves the existing Editorial Campus palette, typography, photography, clean BrowserRouter URLs and legacy hash redirects. Student views use public pinned content only; admin editors and global historical reports are separate views.

## Production containers and domains

The production frontend is a compiled Vite build served by the non-root Nginx `Dockerfile`, not Vite preview. `deploy/nginx.conf` proxies same-origin `/api/v1/` to the private backend. The API repository owns `deploy/compose.production.yaml`, private setup/migration/backup commands and host TLS templates; see its `docs/deployment.md` for the complete operator sequence and rollback.

- Browser origin: `https://imtsmartteens.my.id`; API hostname `https://api.imtsmartteens.my.id` deliberately returns403 for direct application access.
- Only the frontend publishes loopback5180; backend/PostgreSQL stay on private networks. Host Nginx supplies sanitized client IP, preserves Origin and owns TLS. CORS does not make public frontend proxy endpoints inaccessible to HTTP clients; sessions, CSRF and authorization remain required.
- `vite.config.ts` retains loopback development proxying, preserves Origin, verifies upstream TLS and explicitly allows the frontend hostname. `RUST_API_ORIGIN` is development/preview configuration, not a browser-exposed production API secret.
- Run `LD_LIBRARY_PATH=/private/browser/library/path node deploy/verify-public.mjs` when the minimal host needs extracted browser libraries. It verifies the actual HTTPS anonymous desktop/mobile UI with no production account/content mutations; four screenshots and a console report are written to ignored `test-results/deployment-public`.
- Production starts with an empty real school/admin/content setup, not browser fixtures. Authenticated end-to-end/zoom tests belong to the separate synthetic integration environment; do not point them at production.

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

`RUST_API_ORIGIN` changes the **Node-side** dev/preview proxy target; default `http://127.0.0.1:4180`. Do not put credentials or database URLs in `VITE_*` variables. The browser always uses same-origin `/api/v1`. Production hosting must serve `index.html` for extensionless frontend routes, proxy the real API separately, use secure HttpOnly cookies and an explicitly allowlisted frontend Origin. The local preview instructions above do not configure public hosting; production container/domain settings are described in the production section and API deployment guide.

## Sessions, retries and persistence

- Student identity requires an active school UUID selected from a searchable, paginated catalog. The date input stays `YYYY-MM-DD`; it is not converted to a timestamp.
- Rust issues separate opaque student/admin HttpOnly cookies. There are no browser bearer tokens, seeded account hints, name-based recovery or retained legacy teacher roles. `/guru/*` routes redirect to the admin area; historical fixture tokens cannot authenticate to Rust.
- CSRF is fetched explicitly and held only in memory. Login/enrollment rotations replace the token. Reload restores each role independently with its GET endpoint. Target-role logout does not clear the other role.
- One random key and validated payload are retained for an enrollment action. A sessionStorage uncertainty journal contains only its form/key, **never CSRF or credentials**. A current-context retry retains the original CSRF as well. A reloaded unauthenticated journal is blocked: a fresh CSRF GET cannot prove the HttpOnly enrollment context survived. Only authenticated recovery of the **entire** required projection plus explicit CSRF rebind clears the journal. A known-committed POST keeps the original key/form guarded through failed `/me`, progress or attempt reads; retry/reload recovery performs authenticated reads, never another enrollment POST. Profile/progress enrollment/path mismatches and identity changes during reads fail closed. There is no "start again" button that risks a duplicate identity.
- Authenticated attempt/submission/measurement operations retain scoped keys across uncertain retries and reload. Changed payloads are rejected while the old operation is uncertain. These journals are retry metadata, not authoritative progress or grading records.
- Answer saves use snapshot-question IDs and actual answer revisions (initial0). Empty arrays clear answers. Revision409 preserves local input, adopts only the returned committed revision and requires deliberate retry. Pending/in-flight and failed/unknown-acknowledgement answers guard menu navigation, browser history, unload and target-role logout. Cancel keeps the checked input/error/committed revision; explicit discard may abandon it, and confirmed save releases only that mounted owner. There is no durable client answer queue or claim that failed input is persisted. Student keys/correctness are never downloaded.
- Progress, stage locks, scores, immutable content, BMI display and measurements are server results. Zero and null are distinct. Required section visits and lesson completion are distinct writes. The frontend does not calculate persisted scores, progress policy or BMI.
- `progress.active_attempt_ids` contains only in-progress attempts. Known submitted IDs are retained only within the same in-memory enrollment. Reopening a completed assessment/summary discovers its existing attempt through the documented idempotent create-or-return endpoint, then reads the public snapshot; it never treats missing active IDs as an unstarted stage.

## Admin content, schools and reports

- No public default admin account exists. An operator seeds an admin privately in Rust. Every active admin has global school/content/report access, including future and archived schools; legacy booleans/grant rows are not authorization gates. Report school selection uses bounded searchable catalog pages and preserves URL filters.
- Bounded lists and selected detail screens cover lessons, the paired pre/post and quiz banks, schools, enrollment summaries and historical answers. Editors use stable draft section/option UUIDs and expected root revisions. Draft save, lesson/bank publication and path publication are distinct actions. Path order is explicit, archives confirm and preserve history, and revision conflicts retain entered values.
- “Muat revisi terbaru” updates the acknowledged server baseline/revision, not the visible local form. If they differ (even a previously clean form), the lesson is unsaved and publication is disabled until the admin deliberately saves the visible content. Save errors/refresh never erase dirty input; a successful save displays its acknowledged server draft. Each mounted editor owns its own guard, so saving another editor cannot clear it.
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
npm run test:e2e
```

`E2E_PRIVATE_ENV` supplies generated `ADMIN_EMAIL` and `ADMIN_PASSWORD` to the **Node test worker only**. Login is injected with Playwright's Node request context, never browser environment/storage, URLs, committed files or screenshots. Traces/video/automatic screenshots are disabled to avoid authentication artifacts. Explicit screenshots show only post-authentication synthetic data or empty login forms.

The browser suite requires no reporting-grant helper. Its new-school case proves global access in the existing admin session, without grant mutation or re-login.

The browser suite uses the real already-running Rust API/PostgreSQL and one Chromium worker. It authors teaching content through the actual CMS UI, creates a synthetic school, enrolls/completes a student, republishes after enrollment to prove old snapshots, verifies reports against an explicitly selected historical version, exercises response loss/refresh/fail-closed enrollment, role coexistence/ownership/target logout, immediate global access to a newly created school, real revision conflicts and confirmed archive. It checks clean/hash routes, denied localStorage, reduced motion, keyboard forms/dialogs and360/768/1024/1440px layouts. Actual screenshots are written to ignored `test-results/evidence`.

The active Rust suite also covers lost answer acknowledgement -> canceled menu/Back/logout -> actual revision409 -> deliberate retry -> persisted restore; clean/dirty two-editor lesson refresh -> blocked publication -> deliberate save -> pinned published text/sections readback; and dirty lesson/question fragment Back, repeated/multi-step rollback, canceled/accepted logout with session readback, and coherent accepted Back/Forward. Keep the navigation dispatcher registered before BrowserRouter subscribes: Chromium invokes listeners at the window event target in registration order, so adding a capture listener later is insufficient.

The suite deliberately waits for the real per-IP300 requests/60s budget at startup, between the large CMS journey and remaining tests, and before the editor-history scenario. Do not disable rate limiting, auto-retry uncertain writes, run concurrent browser fleets or point the suite at application/production data. Existing synthetic test data is inspected/reused; the suite never wipes the database.

The native browser-zoom gate runs **separately and sequentially** after the main suite:

```sh
E2E_PRIVATE_ENV=/path/to/private/synthetic-runtime.env npm run test:e2e:zoom
```

It uses full bundled Chromium (`channel: 'chromium'`), a private temporary persistent profile, and a permission-free MV3 test extension calling Chrome's native `tabs.setZoom(2)` in **automatic per-tab** mode. `getZoom`/settings readback and real layout/DPR metrics prove browser-owned 200% scaling (not CSS zoom, pinch, narrow viewport or device-scale-only emulation). The profile is deleted and zoom reset to1 on cleanup. Student answer/save/next, editor keyboard-save, historical report details and a real409 confirmation dialog are exercised. Explicit CDP surface screenshots, without a clip/viewport override, and non-auth metrics are saved under ignored `test-results/zoom-evidence`; Playwright full-page clipping is not used for these zoom captures. Primary API/runner references are documented in `tests/zoom.spec.ts`. No standalone screen-reader audit is implied.

On minimal Linux hosts, Chromium may need shared libraries. Without authorization to install host packages, download/extract dependencies to a private scratch directory and set `LD_LIBRARY_PATH` **only for the test command**. Do not use privileged OS installs. The Task4 report records exact execution evidence and any environment-specific paths; they are not portable setup requirements.

`npm test` explicitly labels the six historical Node domain tests as `test:legacy-domain`; the active Vitest tests cover the Rust transport, operation journals, revisioned views and admin adapters. Historical fixture-backed browser/component tests are retained under `tests/legacy/*.fixture.*`, outside active test globs. Neither these legacy files nor `server/` are Rust integration evidence or a runtime fallback.

## Source boundaries and assets

`src/services/dto.ts` declares Rust wire DTOs; `http.ts` owns cookie/CSRF envelopes/errors; `api.ts` composes the current public student view; `admin.ts` declares exact CMS/report commands. Presentation models and route/status mapping live in `src/domain`; UI state is not persisted learning state. Existing tokens/components/styles and measurement photograph are retained.

Photo provenance/license is in `public/assets/stock/credits.json` (copied into built assets). The supplied photograph uses a blue measuring tape; it was not recolored. Local implementation review and the final scoped correction are complete with explicit Minor backlog; see `docs/handoffs/2026-11-16-full-stack-final.md`. Production rollout, infrastructure/TLS/privacy acceptance and any standalone accessibility certification remain separate owner gates.
