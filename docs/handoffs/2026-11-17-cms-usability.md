# CMS usability — approved implementation

- Date (Asia/Jakarta): 2026-11-17
- Status: ready_for_review
- Objective: implement the approved CMS v2 mockup using real APIs and immutable learning snapshots.
- Owner/implementor: Mochi, native gpt-6.1-sol; reasoning effort unknown. Requested Luna routing is unavailable in the provided tool schema; native executing-plans follows the owner's previously chosen method. No fabricated routing evidence.
- Review: pending; one fresh inherited Sol-family read-only whole-branch review after integration.
- Specs read: rules/AGENTS.md, docs/{rules,backend,frontend,delegation,handoff}.md; previous global-admin closure handoff.
- Branch: feat/cms-usability, isolated worktree .worktrees/cms-usability; base backend 5219179 / frontend f1bac5b. Production runtime and main must not change.
- Approved design and plan: docs/superpowers/{specs/2026-11-17-cms-usability-design.md,plans/2026-11-17-cms-usability.md}.
- Verification: not yet run for this feature; mockup-only checks do not establish implementation acceptance.
- Next: clean baseline, TDD atomic publication/search/score contracts, real UI implementation, full integration tests and independent review.
- Deferred separate requirement: adolescent BMI category rules require validated age/sex inputs/reference; no adult classification shortcut.

## Ready-for-review checkpoint

Implementation commits: backend 671485e +15dc0e1 (base5219179); frontend d427812 +4b58b51 (basef1bac5b). Review scope is only this redesign, not prior deferred global-admin/deployment minors.

- Backend: one reviewed release transaction using existing typed admission and immutable writers; literal bounded student-name search, pre/post score and last-activity projections. No migration.
- Frontend: approved light workspace/sidebar, single-title lesson authoring preserving section identity/title/completion flags, dedicated publication review/confirmation with committed-ID readback, separate bank management, progressive reports/details, human WIB minute timestamps. Student calculator no longer mounts history; real server records/admin read remain.
- Real checks already executed: full Rust suite/fmt/Clippy green before the final authentication assertion-only addition; 5 new PostgreSQL tests green. Frontend full57 Vitest +6legacy and build green. Full9 real Rust browser flows passed in4.1m. Separate native200% Chrome extension gate passed (getZoom=2, layout720, DPR2, visualScale1); no CSS zoom/DPR emulation claim.16 fully loaded screenshots at360/768/1024/1440, zero page exceptions.
- Visual inspection found inherited full-width school-grid placement; actual desktop top-coordinate regression RED233.98px -> GREEN<2px after scoped grid-column override. Dedicated full16-screen capture rerun passed. Browser regression is retained in tests/rust.spec.ts.
- A fresh final full gate run is being recorded; any result still running is pending, not assumed passing. Two existing React Router bundle-directive warnings and the precisely identified development favicon404 qualification remain disclosed.
- Evidence: /home/ubuntu/.hermes/cache/scratch/cms-{frontend-final,browser-integration,zoom}.log; test-results/evidence/cms-implemented-*.png and cms-visual-verification.json; test-results/zoom-evidence/metrics.json. Capture helper /home/ubuntu/.hermes/cache/scratch/capture-implemented-cms.mjs uses private credentials only in Node-side requests and does not print them.
- Implementation routing: native author, because supplied tools cannot select Luna/model effort; inherited Sol-family reviewer will be a separate read-only task. No per-task reviewer churn.
- Release image/build/deploy are separate: host has2GB RAM shared with production; do not run a memory-heavy release/image build concurrently with browser/review gates. Debug Rust binary was actually built and exercised. No claim of new production image/deployment acceptance.

Review focus: stale/membership changes must publish nothing; preserve custom/multiple/optional sections; isolate slow report reads; correct WIB boundaries; never infer complete catalogs from one bounded page. Parent keeps main and both runtime checkouts unchanged and will make one tested correction pass for Critical/Important findings, with Minors recorded.

