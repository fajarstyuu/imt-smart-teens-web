# Approved CMS usability redesign

Approved by the owner after inspecting the self-contained CMS v2 mockup: “Bagus! Implementasi”. Reference: /home/ubuntu/imt-smart-teens/design-prototypes/cms-v2/index.html and screenshots. This document records that approved description, not a new unapproved redesign.

## Intent and acceptance
An ordinary global admin can inspect a student, edit a lesson, edit quiz/paired questions, and publish future learning without understanding metadata/revisions. Rebuild the real React UI, never embed demo HTML/data.
- Use the approved light sidebar workspace, restrained forest/ivory palette, clear functional sans-serif CMS headings. This explicit approved CMS treatment supersedes older green-header/serif CMS styling only; student identity stays unchanged.
- Results default to student summaries: searchable name, school/stage filters, pre/post scores with null distinct from zero, latest available activity. Date filters are secondary. Details separate assessment scores/answers, lesson events and measurements. Historical question selection stays version-specific and bounded.
- Display calendar dates in Indonesian day/month/year; timestamps stop at hour/minute, with explicit WIB (Asia/Jakarta). Storage/API remain UTC and retain precision. Use datetime-local controls converted explicitly from WIB, not browser timezone or RFC3339 text fields. Preserve URL filters and enrollment identity.
- One lesson title; one body by default, optional subchapters. Preserve existing section IDs/titles/required flags and all bodies. For a new one-body lesson only, derive its hidden section title from the lesson title to meet the existing backend contract; never flatten existing sections or override a custom section title.
- Draft save/edit/archive/preview remain real, concurrency-aware and unsaved-change guarded. Remove per-object publish controls from the normal editors/catalogs. Keep version history secondary and human-readable.
- Dedicated /admin/publikasi reviews exact draft lesson order/content and bank question content, then confirms one publication. It publishes the reviewed drafts and immutable path atomically on the server, rejecting any changed revision or membership. Failed validation/concurrency must publish nothing; preserve the last active path and old enrollment snapshots. Existing lower-level APIs remain compatible, not exposed in the normal UI.
- Remove measurement history from the student calculator UI only; preserve records and admin access. No adolescent BMI categories in this CMS scope: validated age/sex inputs/rules are not present, and no adult-cutoff shortcut is authorized.

## Architecture and constraints
React 19/TypeScript/Vite, Rust/Axum, PostgreSQL as already pinned. No new dependencies, migration, secrets, public ports or infrastructure modifications. Branch from completed global-admin feature closure (not stale main), preserve both production runtime checkouts and main. No merge, push or deploy in this authorization.
Native execution follows the owner's earlier executing-plans method. This tool surface has no collaboration.spawn_agent or model/effort override, so Luna routing is unavailable; do not claim Luna delegation. One fresh inherited Sol-family read-only review at the end, not per-task implementer/reviewer churn.
Backend cross-context transaction composition stays in infrastructure; core contracts own reviewed revisions/authorization/validation. Reuse existing immutable publication persistence, audit and admission ports rather than inventing parallel snapshot tables.

## Verification
TDD for meaningful behavior. Real PostgreSQL transaction rollback/stale/concurrency/auth/CSRF tests. Full Rust/infra/fmt/Clippy and frontend tests/build. Owned synthetic backend + frontend browser acceptance: create/edit/save/reload, exact reviewed publication, enrollment pinning, student reports/answer inspection, human timestamp formatting, 360/768/1024/1440 widths and keyboard/dialog/200% reflow checks. No production student fixtures.
