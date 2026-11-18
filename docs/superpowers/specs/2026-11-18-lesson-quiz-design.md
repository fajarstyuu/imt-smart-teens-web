# Lesson-linked A/B quizzes — approved product requirements

Date: 2026-11-18. Owner requested implementation after agreeing the following behavior. Technical architecture below is the orchestrator's call, not additional product requirements.

## Intent and scope

Replace the separate end-of-lessons quiz with one mastery check after each lesson. The owner explicitly reset all non-admin production data; do not implement parallel old/new enrollment journeys or restore old records. Implement in isolated source worktrees; no production changes, merge, push or deployment under this implementation request.

- Login → unchanged pre-test → (read lesson → exactly one single-choice A/B question → correct answer) repeated in published lesson order → IMT calculator → unchanged paired post-test → summary.
- Each lesson has exactly one question, exactly two ordered options labeled A/B, and exactly one correct option. Reject malformed direct API writes/publication, not just hide editor controls. Never apply the two-option/single-question restriction to pre/post-test.
- A wrong answer stays on that question and shows red feedback plus the exact text: “jawablah dengan benar untuk melanjutkan materi selanjutnya”. Retries have no configured maximum. Text/accessibility must communicate the error without color alone.
- Reading completion does not unlock the next lesson. Only a committed correct answer does; the last lesson's correct answer is required for calculator queries AND measurement commands. Refresh, direct URLs and legacy global quiz endpoints must not bypass this.
- Student detail ONLY shows lesson/question, first answer, attempt count and final state (Belum dikerjakan / Belum benar / Selesai). Do not add quiz columns or per-lesson history to the main results table.
- Preserve first answers, all accepted retries and immutable content attribution by enrollment + pinned path/lesson version. CMS edits never alter active students' question/options/key or historical answers.
- Preserve the existing admin identity/password, global-admin semantics, atomic reviewed publication, minute-only Asia/Jakarta presentation, calculator-history UI removal, transparent scale artwork, security and ownership boundaries.

## Technical calls and shared contract

Use the existing Rust/Axum/SQLx/PostgreSQL modular monolith and React/TypeScript UI. Add a focused assessment-owned lesson-quiz model and append-only migration(s). Embed a typed quiz draft in the lesson editor model; freeze the quiz with each published lesson version. A missing/incomplete quiz may remain a draft but cannot publish; any supplied options must have exactly two distinct stable option IDs and at most one selected key while editing, exactly one at publication. No global random assignment or position-only association.

Suggested wire interface, to be finalized consistently in runtime-contract.md before frontend work:
- LessonDraft.quiz: {text, options:[{id,text},{id,text}], correct_option_id:string|null} | null.
- GET /api/v1/student/lessons/{lesson_id}/quiz: answer-key-free immutable question plus current attempt_count/revision, last selection and status; require completed required reading first.
- POST /api/v1/student/lessons/{lesson_id}/quiz/answers: {option_id,expected_revision}; existing CSRF + enrollment ownership + Idempotency-Key discipline. Return committed quiz result/correctness and fresh progress. Wrong answer is a successful graded result, not a lost save.
- StudentResults.lesson_quizzes: ordered detail records derived from the enrollment's pinned lesson versions, even for not-started lessons; first answer, count, final status and relevant server timestamps.

Serialize answer checks/inserts/unlocking through the enrollment transaction/lock. Expected revision conflicts and replayed operation keys must not double-count retries or replace the first answer; invalid/out-of-snapshot options never count. Reject changes after mastery except safe idempotent replay. Keep stable ordering and prevent response races from unlocking the wrong lesson or leaking another enrollment's detail. No answer key in student DTOs, bundle or browser storage.

Retire the independent quiz stage from the actual journey/navigation; do not satisfy its legacy submitted predicate with fake assessment rows. Legacy schema/types can remain where historical storage compatibility requires it, but new students must use only the lesson-linked flow. It is acceptable to make legacy quiz-bank manifest references nullable via additive/forward migrations and adapt publication coherently; do not keep an extra mandatory global question bank in the new admin publishing flow.

## Empty CMS initialization

Production is literally empty except one admin and the migration ledger. Existing initialize_development rejects production, and missing draft/bank roots block authoring. Implement an explicit production-safe private operational empty-bootstrap command/use case. Keep the old development guard intact; do not switch APP_ENV, auto-run a seeder on serve, add demo content/accounts or reset data. Repeated initialization preserves existing content/root identities/admin hashes. Only blank structural roots required by the new flow are allowed. Test production-like initialization and authoring/publication on an owned synthetic DB; do not run it against live production in this source-only task.

## Acceptance

Real PostgreSQL tests: invalid quiz cardinality/key/type; publish refusal and transaction rollback; reading-before-quiz; wrong/retry/right; first-answer/count integrity; concurrency/revision/idempotent replay; next/final-gate direct API denial; ownership; new CMS publication while an enrollment retains immutable quiz; pre/post paired snapshot unchanged; safe idempotent empty bootstrap.

Actual component tests: exactly two radios and exact feedback; wrong remains, correct updates navigation from committed progress; refresh/resume and stale/late response protection; editor embedded quiz controls without type/count knobs; missing quiz blocks reviewed release; lesson quiz detail absent from main table. Real-backend browser flow through two lessons, failed answer + refresh/direct URL, then calculator/post-test, detail report and empty CMS bootstrap. Responsive widths 360/768/1024/1440, keyboard and 200% zoom. Preserve evidence outside Playwright's cleanup root.
