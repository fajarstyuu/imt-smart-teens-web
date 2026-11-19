# Lesson-linked quizzes — production release, 19 November 2026

Status: MERGED, PUSHED AND DEPLOYED. Parent independently restored and verified production after a release-validator interruption. Final public verification completed at approximately 09:21 WIB.

## Frozen deployed source and images
- Backend source/runtime checkout: `7a7eb07157cc7ea8ccf0e4e01bd608fb53d35192` (application unchanged from `6e19fa1c8807f74cfa4ae8a0da8546d56919fd72`).
- Frontend source/runtime checkout: `15cee0671a2674ec0bbee0e91dbfdd61beadd0e4` (corrective application/tests `140c6c4be85d75fbf6e5501915b74f9aab7b653e`).
- Backend image: `sha256:c7569835b8886d8d4643fd5444e53c676c653c7af1035ea40355fbeb86ebff4a`.
- Frontend image: `sha256:fa6300300b289714444284129712ecbbc008728c8d9d3a8b10f5b348d406be64`.
- PostgreSQL container/volume unchanged; API/DB unpublished, frontend only `127.0.0.1:5180`. Existing detached `.worktrees/production-deployment` checkouts now point at the frozen refs. Preserve them: they host Compose/bind dependencies.
- Durable immutable image overlay: `/home/ubuntu/.config/imt-smart-teens/production/lesson-quiz-release-20261119-images.json`. It MUST be the LAST Compose `-f` overlay after the old CMS and transparent-image overlays. Do not run historical release apply helpers; those pin older images.

## Merge and test evidence
Both feature branches were fast-forward merged to root `main`, pushed and read back with `git ls-remote`. Parent reran merged-source fmt/Clippy-Dwarnings, 84 Rust tests, 24 infrastructure tests and backend build, plus 92 Vitest + 6 legacy tests and frontend build: exit 0. Prior actual Rust-backed browser 9/9 and native Chrome 200% zoom 1/1 cover exactly the same accepted application source; not rerun with synthetic content on production. One independent whole-feature review, then parent-verified corrective gates; no second independent approval claimed.

Evidence: `/home/ubuntu/imt-smart-teens/evidence/lesson-quiz-release-20261119/` (`merged-backend.log`, `merged-web.log`, candidate image build logs, `parent-incident-recovery.log`, `parent-final-public-check.log`, production admin desktop/mobile screenshots).

## Backup, migration and preserved data
The release worker actual-restored the custom owner dump into isolated owned PostgreSQL and compared every durable-table fingerprint plus protected admin/migration data. It rehearsed the candidate migrations, empty initializer twice, and old-image health on a restored pre-migration schema. The final quiesced backup was independently actual-restored/compared before migration, then parent restored it again during incident recovery to compare current unchanged rows/admin/session counts and exact migration delta.

Private mode-0600 backups:
- `/home/ubuntu/.config/imt-smart-teens/production/lesson-quiz-release-20261119/imt-lesson-quiz-20261119T015734Z.dump`.
- `/home/ubuntu/.config/imt-smart-teens/production/lesson-quiz-release-20261119/imt-lesson-quiz-final-quiesced-20261119T021442Z.dump`.
Private receipts: `rehearsal.json`, `deployment-receipt.json`, `deployment-checkpoint.json` in the same private directory. Never publish their protected fingerprints or secret settings.

Production has exactly eight successful migrations, including three new exact accepted SHA-384 checksums; prior metadata preserved. Explicit supported `init-empty-content` ran twice, idempotently: one empty paired assessment bank and one blank path; no lessons, student data, publications or sample questions. One existing admin, all columns/password unchanged. Secret and Compose env bytes unchanged. No repeat of the 18 November reset, no synthetic production teaching data, no admin/password changes. No portfolio/TLS/host Nginx changes.

## Incident: transient public 502
Frontend/backend were intentionally stopped for bounded migration maintenance. Migration itself succeeded, but a new release-only validator compared underscore filename descriptions with SQLx ledger descriptions containing spaces. It stopped before empty initialization/restart, leaving host Nginx without its frontend upstream. User reported 502. This was an operational failure: bounded maintenance lacked a prequalified continuation and sufficiently prompt user notification.

Parent reproduced public 502 and refused to restart an old binary on the new schema. Parent paused/stopped the continuing worker to maintain single-writer ownership, verified the parser correction with 5 passing policy tests, restored the final backup into another isolated clone, checked exact data/admin and all eight migration checksums, then executed a guarded continuation WITHOUT replaying migrations or resetting data. Initializer twice, frozen runtime refs and candidate-only application restart succeeded. Parent removed only the owned restore clone and terminated the superseded worker; no live competing writer remains.

At 09:20 WIB parent read back HTTP200 for home/admin/config and all three healthy containers; subsequent full public and browser checks passed. Do not infer exact outage duration solely from this handoff: retained checkpoint/log timestamps establish its observed interval.

## Final production verification
- Parent full public check exit0: real HTTPS/TLS/SANs and HTTP redirects; exact index/JS/CSS byte match against running compiled container; same-origin config/csrf, Secure/HttpOnly/host-only cookies, exact CORS/CSRF and body limit; direct API hostname403; IPv6 loopback routing; portfolio fingerprint unchanged.
- Actual Chromium desktop1440 and mobile360 login render: HTTP200, login button/form present, no page errors. Actual screenshots retained and mobile inspected. Browser helper had missing shared library; fallback used installed Playwright with existing private Chromium-library directory, without package/global runtime changes.
- Exact image IDs read back from live containers; nonroot101/10001, read-only roots, dropped capabilities and no-new-privileges checked. PostgreSQL original container identity/health retained.
- No authenticated production mutation or end-to-end synthetic student journey was used. Full student flow remains certified by isolated QA evidence, not falsely claimed as newly exercised in empty production.

## Rollback qualification and future operations
Old images are retained. Old-image health is qualified ONLY against restored PRE-migration schema/data. Do NOT restart an old image against the new schema because nullable global-quiz references/new enrollment semantics differ. Any rollback must quiesce writers, preserve a fresh current-state dump, assess new writes, then use the verified pre-release restore plus old runtime refs/pins deliberately. After admitting new writes, never silently restore over those writes. No rollback/reset was executed on production.

Use current production compose/env and overlays in this order: base `api/.worktrees/production-deployment/deploy/compose.production.yaml`, `cms-release-20261117-images.json`, `scale-transparent-20261117-images.json`, then `lesson-quiz-release-20261119-images.json` (private production directory). Keep project name `imt-production`. Historical helpers are references, not current apply commands.

## Known limitations
M2: main-report latest activity omits new reading/quiz timestamps. M3: owned measurement-history GET can return empty before final mastery; no write/progression bypass. Both remain disclosed/deferred. No exhaustive accessibility/cross-browser/load certification. Feature worktrees and private backups retained. Subsequent documentation commits do not change deployed application source/image provenance.
