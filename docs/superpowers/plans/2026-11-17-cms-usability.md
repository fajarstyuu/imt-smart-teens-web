# CMS Usability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement the owner-approved CMS v2 against real persisted data.
**Architecture:** Preserve modular Rust contexts and existing React routing. Add one reviewed atomic release command; reuse existing snapshot persistence inside its transaction. Presentation remains separate from persisted business state.
**Tech Stack:** Existing pinned Rust/Axum/PostgreSQL and React/TypeScript/Vite.
**Spec:** docs/superpowers/specs/2026-11-17-cms-usability-design.md

## Global Constraints
- UI Indonesian; code/comments/docs English. Existing global-admin authorization/CSRF and immutable snapshots remain.
- No production/main modifications, deployment, merge, push, migration or new dependencies.
- WIB minute-only display; UTC wire precision unchanged. No health classification invention.

## Review Focus
- Stale review or changed ordering must never publish unseen content or leave partial versions.
- Existing custom/optional/multiple lesson sections must survive simple-editor saves.
- Slow/error report reads must not expose a previous student's/filter's data as current.
- WIB day boundaries and invalid timestamp input must not shift calendar dates silently.
- Archived/off-page content, version selection and counts must never be inferred from a single catalog page.

### Task 1: Transactional release and report summaries
**Files:** api src/modules/learning/admin/{application,infrastructure,presentation} and assessment/admin infrastructure publication helpers; reporting application/infrastructure/presentation; tests/cms_usability.rs.
**Interfaces:** Produces POST /admin/learning-path/release with {expected_revision,lessons:[{id,expected_revision}],banks:[{id,expected_revision}]} -> existing PathEditor DTO. Lessons ordered exactly as reviewed; banks exactly configured paired/quiz. Adds optional q to student filter and pre_test_score/post_test_score numeric|null plus latest_activity_at to summary.
- [x] Write real HTTP/PostgreSQL tests for success, stale path/lesson/bank, membership mismatch, invalid bank rollback, concurrent replay, auth/CSRF and score/search projection.
- [x] Run failing tests before implementation; reuse helpers under one transaction and validate all revisions before commit.
- [x] Run cargo test --all-targets --locked, fmt and Clippy, commit implementation.

### Task 2: Admin workspace, editors and one publication screen
**Files:** web src/components/{TeacherShell,ContentEditors,AdminControls}, pages/{TeacherContentPages,TeacherPublicationPage}, services/{admin,dto}, App.tsx, styles/teacher.css and focused tests.
**Interfaces:** Consumes Task 1 release endpoint. adminApi.release(review) returns PathEditor; publication read assembles only exact path lesson IDs and configured banks, bounded question pages with total checks. No auto-refresh replacement at confirmation.
- [x] Write failing interaction tests for one-title editor, preserving existing section metadata, hidden publication controls, stale/error/unknown-ack release states.
- [x] Implement sidebar workspace, clear draft state, optional subchapters, separate order management, bank tabs, human history, review/preview/confirmation and pinned post-success readback.
- [x] Run full npm test and npm run build; commit implementation.

### Task 3: Reports and timestamp clarity
**Files:** web src/pages/TeacherResultsPage.tsx and focused reporting components, shared presentation date helper, CalculatorPage.tsx, tests/cms-usability.test.tsx and tests/rust.spec.ts.
**Interfaces:** Consumes Task 1 summary extensions; formatAdminTimestamp(value:string|null):string, formatCalendarDate(value:string):string and WIB datetime-local conversion helpers; unchanged UTC API filters.
- [x] Write failing tests for display/minute precision, WIB boundaries, student/filter isolation, null scores, details tabs and URL restoration.
- [x] Implement progressive-disclosure reports and readable historical answers; hide calculator history without deleting records.
- [x] Run full frontend suite/build and real backend browser suite; commit implementation.

### Task 4: Integration, independent review and handoff
**Files:** both docs/handoffs/2026-11-17-cms-usability.md, evidence under ignored test-results.
- [x] Run exact full gates, real synthetic create/edit/reload/publish/enrollment/report browser flow and responsive screenshots; inspect screenshots.
- [x] One independent read-only whole-branch Sol-family review; one bounded RED/GREEN correction for Critical/Important findings, ledger Minor findings.
- [x] Update handoff/ledger with actual commands and results, commit all source/docs, retain branches without deploying or merging.
