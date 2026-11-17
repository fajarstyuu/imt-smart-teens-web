# CMS usability — completed source implementation

- Date (Asia/Jakarta): 2026-11-17
- Status: completed (source implementation; not deployed)
- Branch: feat/cms-usability in both repositories; worktrees .worktrees/cms-usability.
- Owner/native implementor: Mochi, gpt-6.1-sol; reasoning effort unknown. Luna routing was not available in the supplied tool schema. The owner's earlier executing-plans method was preserved, not silently described as Luna delegation.
- Independent reviewer: inherited gpt-6.1-sol (reported), effort unknown; deleg_05f2205a / sa-0-ac5c3526. One read-only whole-feature review; no per-task reviewers or second independent review.
- Integration bases: backend5219179 / frontendf1bac5b (global-admin closure), not older main.
- Material source commits: backend671485e +authentication/contract15dc0e1; frontendd427812 +layout4b58b51 +review correction34475b4. Final documentation commits may follow without changing application behavior.

## Approved scope and actual result

The owner inspected the CMS v2 mockup and explicitly requested implementation. The real React UI uses the approved light-sidebar workspace, not the standalone demo HTML or its sample data. CMS headings/functional controls intentionally follow that newer approved design; student design stays unchanged.

- Clear lesson title +one body by default; optional subchapter settings preserve existing section IDs, custom headings, all bodies and required flags. Saving a new unnamed default section derives only its title from the lesson title. Draft/preview/archive/revision conflict and unsaved navigation safeguards remain real.
- Bounded lesson/question catalogs, separate order controls, bank tabs and question editing. Per-object publication controls are removed from the normal UI; human-readable version history remains secondary.
- Dedicated /admin/publikasi reviews the exact path lesson order/content and complete active question catalogs with paginated total/dedup checks, then confirms one server transaction. Path/bank/lesson revisions and membership are checked under consistent root locks, all drafts validated, and existing immutable writers/admission/audits reused. Failure publishes nothing; old enrollment/assessment snapshots remain pinned. Success is verified by publication-ID readback; unknown acknowledgments require explicit fresh review before another POST.
- Student summaries use bounded name/school/stage filtering, nullable pre/post scores and last recorded activity, with secondary date/assessment filters. Details separate summary, answers, lesson events and measurements. Historical answers stay question-version-specific. Corrected detail state is keyed by student+enrollment and only current-result attempt IDs may be requested/rendered.
- Calendar dates are Indonesian day/month/year; admin timestamps stop at hour/minute and explicitly name WIB. Storage/API retain UTC precision. datetime-local filter input converts from WIB explicitly and validates round trips; form dates do not shift timezone.
- Calculator measurement history is hidden from student UI only. Real browser/API verification confirmed records remain; admin measurement access remains.
- No new dependencies, migration, public ingress, production fixture data, Nginx/portfolio or production deployment changes. Adolescent clinical categories are intentionally separate, not replaced with adult thresholds.

## Contracts and entry points

- Backend docs/cms-publication.md documents POST /api/v1/admin/learning-path/release and GET /api/v1/admin/students additions.
- Release body: expected_revision, ordered lessons [{id,expected_revision}], exactly configured banks [{id,expected_revision}]. Authentication/CSRF, stale409, invalid422 and duplicate-review rejection remain server-authoritative.
- Student summaries add pre_test_score/post_test_score integer|null and latest_activity_at; optional q is literal case-insensitive substring (max200). No browser per-student N+1 bootstrap.
- Backend: modules/learning/admin/{application/release.rs,application/publication.rs,infrastructure/publication.rs,presentation.rs}; assessment/admin immutable connection writers; reporting application/presentation/projection. AuditActor only gains Clone for one verified actor across transaction audit writes.
- Frontend: components/{TeacherShell,LessonContentEditor,ContentEditors,ReportSchoolFilter,AdminControls}; pages/{TeacherContentPages,TeacherPublicationPage,TeacherResultsPage,CalculatorPage}; services/{admin,dto,publication}; presentation/dates.ts; styles/cms-workspace.css; App routing. Other UI remains scoped.

## Verification (executed, not inferred)

- Backend: cargo test --all-targets --locked, cargo fmt --all --check, cargo clippy --all-targets --all-features --locked -- -D warnings, cargo build --locked, python3 -m unittest discover -s tests/infra -v: **78 Rust +24 infrastructure**, all passed. Log /home/ubuntu/.hermes/cache/scratch/cms-final-backend.log. One build job/test thread and no debug info limited shared-host memory. A real debug backend binary was served against the owned synthetic DB at4181; no release-image build claim.
- Frontend after correction: npm test and npm run build: **59 Vitest +6 legacy**, all passed. Log /home/ubuntu/.hermes/cache/scratch/cms-after-review-suite.log.
- Real Rust/PostgreSQL browser after correction: npm run test:api with E2E_ORIGIN=http://127.0.0.1:5184, VITE_DEV_PORT=5184, RUST_API_ORIGIN=http://127.0.0.1:4181 and private E2E environment: **9 passed3.9m**. Log /home/ubuntu/.hermes/cache/scratch/cms-after-review-browser.log. Existing unknown-ack, frozen-publication/student readback, enrollment recovery, dirty navigation/Back/Forward/logout, archive-conflict, global-school and storage/keyboard checks remain active.
- Native Chrome200% gate: **1 passed**, chrome.tabs.setZoom/getZoom automatic per-tab, layout720, DPR2, visualScale1, CSS/body zoom1,8 captured zoom=2 records and zero page errors. Log cms-zoom-final.log; this layout gate preceded the enrollment-identity-only correction (no layout/style change in that correction). No CSS zoom or viewport/DPR emulation substitution.
- Actual loaded CMS screens: **16 captures** across360/768/1024/1440, no document horizontal overflow, minute-only displayed timestamps and zero page exceptions. Real geometry regression caught inherited full-row school filtering (RED233.98px vertical spread -> GREEN<2px); retained in real browser test.
- Durable evidence outside every Playwright cleanup root: /home/ubuntu/imt-smart-teens/evidence/cms-usability/{browser,native-zoom,screens}. Browser contains final-run PNGs; screens/cms-visual-verification.json enumerates16 captures; native-zoom/metrics.json verifies8 native zoom records. Parent read back these targets after another full Playwright run. Earlier in-repo artifacts were deleted by default runner cleanup, then honestly regenerated/preserved, not falsely cited as still present.
- Two pre-existing React Router bundling directive warnings remain. The exactly identified development /favicon.ico404 qualification remains narrow; other API/page exceptions are not exempted.

## Review and one bounded correction

Original independent assessment:0 Critical /1 Important /2 Minor, With fixes; see backend docs/reviews/2026-11-17-cms-usability.md. Parent accepted I1 as Important, reproduced it with two actual-component tests (loaded old answers and a delayed old response); both RED with previous enrollment answers under the new enrollment. Keyed student+enrollment identity and current-result attempt membership made both GREEN. Full59 frontend tests +6legacy/build and the9 real-backend browser suite then passed. Parent accepts source implementation based on that evidence; no second reviewer/post-fix independent approval is claimed.

### Deferred minors (not fixed silently)

- CMS M1: refreshed/shared Quiz question-report URLs do not persist bank context. Answers stay version-specific; picker/history context can fall back to the other bank. Future change should persist/resolve owning bank and cover archived/off-page reports.
- CMS M2: latest_activity_at omits assessment_attempts.created_at and learning_section_visits.first_visited_at. Current value covers enrollment, submissions/answers, lesson open/completion and measurements; a future projection/label refinement must cover the omitted events.

## Rulings I made

- **R1: Build on the completed global-admin closure, not stale main.** Why: The redesign depends on the already-deployed global authorization contract. Cost if wrong: Integration must carry that dependency; cherry-picking onto stale main is not accepted.
- **R2: Execute natively with one fresh independent Sol review.** Why: The owner previously selected executing-plans; available tools do not expose Luna/effort routing. Cost if wrong: Less implementation/reviewer model diversity; no Luna delegation is claimed.
- **R3: Use named Asia/Jakarta/WIB display and control conversion.** Why: It matches the shown mockup and removes ambiguous raw UTC fields while preserving wire precision. Cost if wrong: Another owner-preferred timezone requires a presentation/control conversion change.
- **R4: Keep adolescent BMI categorization outside this approved CMS scope.** Why: Validated age/sex inputs/reference rules are absent; adult categories are not an acceptable shortcut. Cost if wrong: Numerical BMI remains without a clinical category until a separately validated change.
- **R5: Do not perform production/image/operational rollout or new backup/restore acceptance.** Why: Authorization is source implementation, and the shared host has2GB RAM. Cost if wrong: Packaging, live deployment, restart/rollback and operational acceptance remain separate gates.
- **R6: Apply the newer light-sidebar/sans treatment only to CMS.** Why: Owner explicitly approved that mockup over the older CMS visual prescription. Cost if wrong: Student presentation is not redesigned; changing it requires separate scope.
- **R7: Retain lower-level publication APIs for compatibility.** Why: Normal UI is centralized without silently breaking existing integrations. Cost if wrong: Those admin APIs remain available until explicit deprecation work.
- **R8: Keep unrelated pre-existing minors outside this correction pass.** Why: The review/implementation scope is the approved redesign. Cost if wrong: The prior backlog is not closed by this task.
- **R9: Do not certify production-scale performance without a load test.** Why: Query structure and correctness were inspected; no benchmark was run. Cost if wrong: Large-population capacity remains unmeasured.
- **R10: Parent owns visual/reflow acceptance from durable captures and native zoom evidence.** Why: Independent reviewer could not inspect the earlier files after Playwright cleaned its output root; parent regenerated/preserved/read the exact targets. Cost if wrong: There is no second independent visual sign-off; no such approval is claimed.

## Declined-to-judge disposition

Every reviewer-declined item was considered:1->R6 (approved CMS visuals),2->R4 (clinical category),3->R7 (API compatibility),4->R1 (global-admin base),5->R2 (native/Luna),6->R3 (timezone preference),7->R8 (old minors),8->R5 (production/ops/backup scope),9->R9 (load certification),10->R10 (visual review limits). These references reuse the identical existing ruling rather than create duplicate or hidden decisions.

## Integration / next action

No merge, push or deployment was performed. Main and the retained production runtime pins were read back unchanged; all3 existing production containers remained healthy. Deployment must build/test both backend and frontend together because the old backend has no release endpoint; preserve guarded release manifests, persistent PostgreSQL, prior backups and portfolio routing. Packaging/live HTTP, operational rollback and independent off-host access acceptance require separate authorization and evidence. Next owner is the user for integration/deployment choice; no missing implementation task is disguised as deployment.
