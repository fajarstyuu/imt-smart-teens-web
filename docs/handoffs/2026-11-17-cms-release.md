# CMS usability release — verified production rollout

- Date (Asia/Jakarta): 2026-11-17
- Status: completed
- Authorization: owner requested “Merge, push, deploy”, then “Lanjut”.
- Owner / operator / final acceptance: parent Sol, actual runtime gpt-6.1-sol; reasoning effort unknown. Native operational work reused existing deployment guards. No new application implementation or second independent source approval is claimed.
- Specs read: canonical AGENTS.md, rules.md, backend.md, frontend.md, delegation.md, handoff.md; CMS and global-admin handoffs; actual Dockerfiles, production Compose and release guards.

## Scope and source identity

The reviewed CMS feature and inherited global-admin lineage were fast-forwarded into both clean, freshly fetched main branches. One frontend test-only trailing blank line failed the full-range whitespace gate; it was removed without changing application logic, tested and committed before push.

The application release refs were pushed and independently read back with both `git ls-remote` and GitHub's ref API:

- Backend: `a8b1cc5596989dc3f86a263e0128224c07e271f8`.
- Frontend: `0922dfc4cba33cca615d9e5a2059fae881ede5e6`.
- Exact-SHA GitHub check-runs/statuses each had zero entries. This is no recorded remote CI, not green CI.

The frozen runtime source refs above remain exact even if this documentation-only closeout advances main later. No image rebuild is needed for documentation-only commits.

## Immutable images and runtime ownership

- Backend: `sha256:9299675bf8462769a8ecb51d1b7c74ff04702899ca4091d1b825f3d27cde740d`.
- Frontend: `sha256:f3b02ba5cc31c4782ab49d96fdc975f7860c9a9e4e56663928063e3eebb2e315`.
- Both carry matching OCI source-revision labels and were built sequentially from tested main checkouts. Runtime backend UID10001 and frontend UID101 remain non-root.
- Stable runtime inputs remain `/home/ubuntu/imt-smart-teens/{api,web}/.worktrees/production-deployment`, detached at the approved release refs. These paths and all other worktrees were preserved, not force-cleaned.
- Project `imt-production` uses the established Compose file plus the private `cms-release-20261117-images.json` override, which pins backend/frontend/migrator image IDs. Private `compose.env` now selects the CMS image tag while preserving other settings.
- PostgreSQL's exact container ID and `imt-production_postgres_data` were preserved; no migration, initialization, account seed/reset, credential rotation, fixture import, volume removal, Nginx/TLS change or portfolio edit was performed in production.
- Backend/database still have no host port bindings; frontend publishes only `127.0.0.1:5180`. Three production services are healthy.

## Backup, preconditions and rollback

A fresh private production custom-format dump was catalog-inspected and actually restored into a uniquely owned temporary database. All 27 durable-table counts/fingerprints matched, including the migration ledger and credential-bearing admin records. Only that restore probe was dropped. Hashes, credentials, settings contents and personal records were never printed or committed.

The exact prior source/image/settings/secret metadata and PostgreSQL identity were checkpointed privately. Candidate and prior release guards passed before the first runtime write. A rejected-preflight adapter scenario made zero checkout/settings/container/receipt writes; the existing five release/rollback guard tests passed. A failed switch would restore exact prior source/images/settings and independently verify rollback; it never restores old business data automatically. Successful rollout required post-switch source/image/readiness/settings/data/secret readbacks. No live rollback was needed or destructively rehearsed.

The rollback point is the preceding global-admin release: backend `cf8d9398b03f9ad4a255ecaf64b8b7728599177f` / image `sha256:5b2b02ee2aaec45273f3bdb6ffaa45f466911a8c8709a0b863a0cb4a965b23c2`, frontend `a8cbe29d57d7b6f9ce21e3630a5eb007fa7880c7` / image `sha256:898b7307946638609bbd93f25237b8a8ef21f41e786c260ebce3a654a4ab9034`. Private adapter/checkpoint/approval/receipt and backup paths are under `/home/ubuntu/.config/imt-smart-teens/production/`, prefix `cms-release-20261117` (backup prefix `backups/imt-cms-`). Do not execute the older global-admin account-provisioning operator for this release.

## Actual verification

- Fresh merged backend: `cargo fmt --all --check`, locked all-target/all-feature Clippy with warnings denied, `cargo test --all-targets --locked` — 78 passed, infrastructure unittest — 24 passed, locked debug build. PostgreSQL tests used the foundation loopback55432 environment, never production.
- Fresh merged frontend: `npm ci --no-audit --no-fund`, `npm test` — 59 Vitest + 6 legacy, `npm run build`; full-range `git diff --check` passed after the test-only whitespace correction.
- Both real Docker production builds succeeded, including the locked Rust release build and compiled React/Nginx artifact.
- New owned `imt-cms-release-smoke` project: real migration/empty-root bootstrap, three-service health, production secure host-only cookies, CORS/CSRF, distinct IP rate buckets, actual DDL/ledger denials and committed data/secret persistence through recreation passed. Actual private-stdin admin seed, unchanged-existing-account replay, global legacy-false permissions, login/logout passed only there.
- Compiled-image browser acceptance used a separate no-Vite configuration, exact approved image IDs and isolated smoke data. For loopback browser interaction only, that smoke backend used development HTTP cookie/origin settings after production-security gates. All 9 real Rust/PostgreSQL browser tests passed in 3.6 minutes, including full atomic publication/student flow, immutable snapshots, calculator history hidden while records survive, recovery, ownership, revision conflicts and dirty navigation. No application assertions were weakened.
- Initial browser attempt was interrupted after fixture-dependent failures: the infrastructure persistence probe had a UUID in `normalized_name`, so catalogue search correctly found no matching normalized name. Search was reproduced RED; only that owned smoke school was re-saved through the admin API and search became GREEN. Initial failure logs/error contexts were retained, then the entire original suite passed. The existing probe fixture's direct-SQL normalization caveat remains documented; no production fix/data reset was necessary.
- Public HTTPS script passed TLSv1.3/SANs, HTTP redirects, exact running-image HTML/JS/CSS bytes, SPA/same-origin API, IPv6 loopback host routing, deliberate direct API403, host-only Secure/HttpOnly/SameSite cookies, CORS/CSRF, structured body limit and unchanged portfolio bytes. Invalid-login rate exhaustion was not repeated against production.
- Existing production administrator authenticated without reprovisioning; actual UI logout was followed by server HTTP401. A deliberately stale reviewed-release POST returned HTTP409 and the full learning path readback was unchanged; no live content was republished for testing.
- Actual deployed HTTPS UI: six routes × 360/1440px = 12 screenshots, loaded data-dependent publication UI, no page overflow, zero page exceptions or unexpected console errors. Anonymous student-session HTTP401 entries are expected/classified, not page crashes. Account and student identity/action cells were privacy-masked in retained captures. Desktop results and mobile publication screenshots were visually inspected; displayed activity time is minute-only/WIB.
- Independent post-authentication durable-data and secret-byte/metadata readbacks matched the checkpoint. Session/audit writes from authorized login/logout are intentionally excluded from durable teaching-data comparison.
- Only the new owned smoke project's containers were stopped after acceptance; its separate volume, evidence and private secrets remain. Production and the foundation were retained and rechecked.

## Evidence and remaining scope

Durable evidence: `/home/ubuntu/imt-smart-teens/evidence/cms-release-20261117/`: `progress.md`, `compiled-browser.log`, preserved `compiled-browser-initial-failure.log`, `compiled-browser/` screenshots/error contexts, `production/verification.json` and 12 deployed captures. Merged backend log: `/home/ubuntu/.hermes/cache/scratch/cms-merged-backend.log`; frontend merged gate process `proc_c88bcad6f22c`. Deployment private receipt contains exact accepted identities and invariants, not a substitute for the independent readbacks above.

Public probes/browser ran from this VPS, not an independent off-host audit. No new native 200% zoom rerun or load/capacity certification is claimed. Prior CMS review/correction attribution and its two nonblocking Minor findings remain unchanged: Quiz deep links do not persist the bank in the URL; activity projection omits assessment-start and section-visit timestamps. Older review backlogs remain open. Adolescent IMT classification remains outside this release; numerical calculation is unchanged.

Next owner: product owner may use the deployed CMS. A future release must make a fresh approved source/image/checkpoint rather than replaying this one-shot operator or deleting runtime inputs.
