# Lesson-linked Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved per-lesson mastery flow, detail-only reporting and safe empty CMS bootstrap without changing pre/post assessments.

**Architecture:** Extend the existing modular monolith and its transaction ports. Pin each embedded lesson quiz to immutable lesson versions and persist accepted retries with enrollment-scoped concurrency/idempotency. Implement both ends of the shared wire contract sequentially in one scoped Luna worker; Sol handles final integration and independent review.

**Tech Stack:** Existing locked Rust/Axum/SQLx/PostgreSQL17 and React/TypeScript/Vite stack; no framework replacement.

**Spec:** docs/superpowers/specs/2026-11-18-lesson-quiz-design.md

## Global Constraints

- Exact error copy: “jawablah dengan benar untuk melanjutkan materi selanjutnya”.
- One single-choice A/B quiz per lesson; never restrict pre/post-test to that shape.
- Admin detail only; no new per-lesson columns/history in the main results table.
- UI Indonesian; identifiers/comments/docs English; reuse minute-only WIB formatter and approved visual tokens/assets.
- No production operations, reset/reseed, shared-branch merge/push, unrelated process cleanup or secret disclosure.
- Source-only work; test only owned synthetic databases via existing foundation loopback55432.

## Review Focus

- Multiple tabs / retry-after-network-loss: no duplicated accepted retries or changed first answer.
- Direct content and measurement calls: no bypass while a lesson quiz is incorrect, including the final lesson.
- Republish/reorder during enrollment: answers and reports still refer to the pinned historical question/options.
- Switch enrollment while a detail request is pending: no stale answer leakage.
- Missing CMS roots after literal reset: explicit empty bootstrap works without development guard bypass or sample data.

### Task 1: Backend contracts, immutable quiz publication and empty bootstrap

**Files:** migrations/new append-only migration(s); src/modules/learning/admin/{application,presentation,infrastructure} and their focused children; src/modules/assessment/new focused lesson_quiz module; src/bootstrap/mod.rs; docs/runtime-contract.md; tests/lesson_quiz.rs and focused existing CMS tests.

**Interfaces:** Consumes LessonDraft/PathPublication/ReviewedRelease and current migration/identity boundaries. Produces the frozen lesson quiz and draft wire contract in the spec, an explicit production-safe private init command, and updated publication invariants. Finalize exact DTOs in runtime-contract.md before Task 3.

- [ ] Run baseline backend suite with the private foundation test environment; record actual results, never print its values.
- [ ] Add tests proving missing/malformed quiz cannot publish, exactly A/B plus one key is accepted, release failure leaves all published roots/revisions unchanged, old published quizzes stay immutable, and empty bootstrap is idempotent without changing admin hashes or adding demo content. Run and record expected RED failures first.
- [ ] Implement typed draft/frozen models, explicit snapshot storage and publication policy, forward-only migration and safe private bootstrap. Preserve layer ownership and explanatory comments.
- [ ] Run focused tests GREEN, then cargo fmt --all --check; cargo clippy --all-targets --all-features --locked -- -D warnings; cargo test --all-targets --locked. Commit cohesive source/tests/docs.

### Task 2: Backend student mastery commands and detail reports

**Files:** src/modules/learning/{domain,application,infrastructure,presentation}; src/modules/assessment/lesson_quiz; src/modules/reporting; tests/lesson_quiz.rs; docs/runtime-contract.md.

**Interfaces:** Consumes Task 1 immutable quiz; produces GET lesson quiz and POST answer contracts from spec, committed progress and StudentResults.lesson_quizzes. Keep reports bounded and enrollment-specific.

- [ ] Write HTTP/real PostgreSQL tests for wrong→retry→right, read gate, next/final direct-URL and measurement denial, legacy endpoint bypass denial, ownership, revision races, replay/no double count, immutable first answer, historical republish, and unchanged pre/post pairing. Record RED.
- [ ] Implement in existing transaction/UOW boundaries, including enrollment lock, stable operation keys, revision checks and atomic mastery/progress. Keep student DTOs answer-key-free.
- [ ] Extend only detail read model; do not add table summary fields. Derive not-started entries from the pinned path, not only recorded responses.
- [ ] Run focused GREEN and full backend/fmt/Clippy/build/infrastructure checks. Commit and checkpoint actual DTOs/evidence before frontend work.

### Task 3: Frontend editor, student flow and detail-only reports

**Files:** src/services/{dto,admin,student,publication}.ts as present; src/pages/{LearningPages,AssessmentPage,TeacherContentPages,TeacherPublicationPage,TeacherResultsPage}.tsx; src/components/{LessonContentEditor,ContentEditors,StudentShell}.tsx and focused new quiz components; styles and tests/lesson-quiz.test.tsx; existing tests affected by the changed actual journey.

**Interfaces:** Consume frozen runtime-contract.md from Tasks 1–2. Produce one embedded A/B quiz editor, per-lesson student quiz and detail-only report with enrollment-safe rendering.

- [ ] Run baseline npm test; write actual component RED tests for fixed two-option editor, exact error message/red state, retry/correct navigation, refresh/late-response protection, missing quiz release refusal and no main-table quiz history. Preserve unrelated regression assertions.
- [ ] Implement reusable focused components; preserve section IDs/content/dirty guards and publication review revision checks. Remove the standalone quiz journey/nav and mandatory global quiz-bank authoring without breaking pre/post editor types.
- [ ] Run npm test and npm run build GREEN, record counts and commit cohesive changes.

### Task 4: Full-stack acceptance and review handoff

**Files:** tests/rust.spec.ts or new focused real-backend browser spec; responsive/zoom acceptance; docs/handoffs/2026-11-18-lesson-quiz.md in both repositories; durable evidence outside test output cleanup.

**Interfaces:** Consume completed backend/frontend. Produce actual synthetic end-to-end proof plus frozen git heads and honest review-ready handoff, not a deployment claim.

- [ ] Start only owned isolated test API/frontend listeners after checking port/process ownership; never replace or restart production or existing shared preview environments.
- [ ] Run real-backend browser two-lesson wrong/refresh/direct-url/retry/correct/final calculator/post-test and detail-report flow. Exercise production-like empty bootstrap, editor/review/publication and pre/post types. Capture widths360/768/1024/1440 and200%zoom with no horizontal page overflow or unexpected exceptions.
- [ ] Run all Rust/backend infrastructure and frontend/component/build/browser gates on the final source. Record exact commands/results and any warnings/deferred scope.
- [ ] Commit owned work and hand off frozen heads, changes, decisions, RED/GREEN logs and remaining issues for parent Sol's one independent whole-feature review. Do not merge, push, deploy or mark independently accepted yourself.
