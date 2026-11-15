# Frontend Standard — Imt Smart Teens / Editorial Campus

This document defines the frontend design and behavior standards. Use it alongside the visual reference `01-editorial-campus-v2-timbangan.png` in the same folder. The approved reference is **Editorial Campus with weighing-scale photography**, not Bold Workbook or Quiet Botanical.

This specification is written in English. **The application's user-facing copy must remain in Indonesian**, including the labels and messages quoted below. IMT stands for _Indeks Massa Tubuh_, the Indonesian term for BMI.

Imt Smart Teens is the product name. Student names, schools, dates, scores, lesson titles, and the number of lessons in the mockup are sample content. Use application data; do not hardcode these examples into components.

## 1. Design direction and priorities

- Character: academic, warm, calm, orderly, and trustworthy; like an educational journal translated into a website.
- Core identity: forest green, golden yellow, ivory backgrounds, serif headings, functional sans-serif interfaces, thin dividers, and realistic photography.
- Photography focuses on weighing scales, body-weight/height measurement, and IMT. Do not use food photography as the main visual.
- Priorities: readability → clarity of the learning sequence → fidelity to the reference → decoration.
- When a detail is not visible in the reference, follow this document. Preserve the project's existing stack, router, and component patterns.
- Let content determine component structure. Do not turn the entire page into a collection of cards.

**Important:** the reference is a concept board containing three screens. Implement the student, login/pre-test, and teacher/CMS screens as separate pages or application areas. The “01 / EDITORIAL CAMPUS” title, palette swatches, and board labels “SISWA” and “GURU / CMS” are not part of the product UI.

## 2. Color design tokens

The following are canonical implementation values normalized from the image. Do not treat every pixel variation in the photograph/mockup as a new design color.

| Token              | HEX       | Usage                                                             |
| ------------------ | --------- | ----------------------------------------------------------------- |
| `primary`          | `#0C3E28` | Sidebar, CMS header, branding, links, important lines/icons       |
| `primary-hover`    | `#174E35` | Hover state for controls with green backgrounds                   |
| `primary-active`   | `#082F1E` | Pressed state for green controls                                  |
| `primary-soft`     | `#E4EBDD` | Completed states and soft green badges                            |
| `secondary`        | `#F6BC20` | Main action buttons, active menu items, current-stage indicators  |
| `secondary-hover`  | `#E8AC12` | Hover state for yellow buttons                                    |
| `secondary-active` | `#D79A08` | Pressed state for yellow buttons                                  |
| `secondary-soft`   | `#FFF0C8` | Active lesson rows, selected student answers, introductory panels |
| `canvas`           | `#F7F3EC` | Main application background                                       |
| `surface`          | `#FCFAF6` | Forms, panels, tables, and content surfaces                       |
| `surface-muted`    | `#ECEAE1` | Progress tracks and locked/disabled areas                         |
| `text`             | `#123225` | Headings and primary text                                         |
| `text-muted`       | `#686D60` | Secondary descriptions and metadata                               |
| `text-inverse`     | `#FFFFFF` | Text on dark green                                                |
| `border`           | `#D5D1C5` | Dividers and panel/table borders                                  |
| `border-strong`    | `#82867B` | Clearly visible input and control boundaries                      |
| `success`          | `#456F36` | Success icons/checkmarks and messages                             |
| `success-soft`     | `#E4EBDD` | Success message backgrounds                                       |
| `warning`          | `#7A570E` | Warning text                                                      |
| `warning-soft`     | `#FFF0C8` | Warning backgrounds                                               |
| `danger`           | `#A3372D` | Validation errors and delete actions                              |
| `danger-soft`      | `#FBEAE5` | Error message backgrounds                                         |

Primary is the green brand color. **Main action buttons use the yellow secondary color** with dark green text, matching the reference. Color token names do not determine component variant names.

Usage rules:

- Ivory/surface dominates the content area; green establishes structure; yellow draws attention to actions or the current position.
- Use at most one dominant yellow button per action group.
- Active sidebar item: solid yellow with dark green text/icons. Other items: white text/icons on green.
- Active lesson: `secondary-soft` with a yellow left accent; do not make every lesson yellow.
- Text on yellow buttons must use `text`; **never white**. White on yellow has a contrast ratio of only about 1.73:1.
- Canonical contrast pairs: primary text/yellow ≈8.04:1; white/green ≈12.10:1; secondary text/ivory ≈4.81:1.
- Communicate status with labels and/or icons, not color alone.
- Avoid blue/purple as additional accent colors. Reserve red for errors and destructive actions.
- Use solid colors in the UI. Natural light and tonal gradients may appear in photography, not as decorative interface effects.

```css
:root {
  --color-primary: #0c3e28;
  --color-primary-hover: #174e35;
  --color-primary-active: #082f1e;
  --color-primary-soft: #e4ebdd;
  --color-secondary: #f6bc20;
  --color-secondary-hover: #e8ac12;
  --color-secondary-active: #d79a08;
  --color-secondary-soft: #fff0c8;
  --color-canvas: #f7f3ec;
  --color-surface: #fcfaf6;
  --color-surface-muted: #eceae1;
  --color-text: #123225;
  --color-text-muted: #686d60;
  --color-text-inverse: #ffffff;
  --color-border: #d5d1c5;
  --color-border-strong: #82867b;
  --color-success: #456f36;
  --color-success-soft: #e4ebdd;
  --color-warning: #7a570e;
  --color-warning-soft: #fff0c8;
  --color-danger: #a3372d;
  --color-danger-soft: #fbeae5;

  --font-editorial: Georgia, "Times New Roman", serif;
  --font-ui: Arial, Helvetica, sans-serif;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --radius-control: 4px;
  --radius-panel: 6px;
  --shadow-panel: 0 2px 6px rgb(18 50 37 / 5%);
  --sidebar-width: 216px;
  --content-max: 1440px;
  --duration-fast: 140ms;
  --duration-normal: 200ms;
}
```

If using Tailwind or another token system, map these same values into the project theme. Do not scatter arbitrary HEX values or dimensions throughout components.

## 3. Typography

| Role                                    | Font      | Desktop size | Weight / line-height |
| --------------------------------------- | --------- | ------------ | -------------------- |
| Brand                                   | Editorial | 26–28px      | 700 / 1.15           |
| Main dashboard H1                       | Editorial | 48–56px      | 700 / 1.08–1.15      |
| Standard page H1                        | Editorial | 36–40px      | 700 / 1.15           |
| H2                                      | Editorial | 28–32px      | 700 / 1.2            |
| H3 / panel heading                      | Editorial | 20–24px      | 700 / 1.3            |
| Lesson body / editorial introduction    | Editorial | 17–18px      | 400 / 1.6            |
| Navigation, forms, buttons, CMS content | UI        | 14–16px      | 400–600 / 1.45–1.6   |
| Metadata / small labels                 | UI        | 12–14px      | 400–600 / 1.4        |
| Lesson sequence numbers                 | Editorial | 40–48px      | 400, italic / 1      |

- Do not use serif for entire tables/forms. Editorial headings use serif; functional controls and data use sans-serif.
- The main H1 may use `clamp(2rem, 3.8vw, 3.5rem)`. Target 32–36px on mobile instead of shrinking the entire desktop page.
- Use one H1 per page. Do not choose heading elements solely for their font size.
- Reserve uppercase and 0.08–0.12em letter spacing for short labels such as `MATERI 01`.
- Limit reading paragraphs to approximately 60–70 characters per line. Left-align; do not justify.
- Do not truncate lesson text, answers, or important titles with ellipses. Allow wrapping.
- Let H1 line breaks follow the available space; do not insert `<br>` elements that cause mobile overflow.
- Use `font-variant-numeric: tabular-nums` for table/progress numbers where available.

## 4. Spacing, shapes, and surfaces

- Use the spacing token scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, and 64px.
- Page padding: 32px on desktop, 24px on tablet, and 16px on mobile.
- Main section gaps: 32–40px; label-to-input gaps: 8px; form group gaps: 20–24px.
- Standard border: 1px solid `border`. Use dividers as the primary separator; do not rely on shadows.
- Control radius: 4px; panel radius: 6px. Do not make all components pills or use 20–32px radii everywhere.
- Use only very subtle shadows for raised panels, dropdowns, and dialogs. Regular content may have no shadow.
- Avoid layers of nested cards. For example, a lesson list only needs rows and dividers.
- Touch targets must be at least 44×44px, including clickable padding. The visible icon may be 18–20px.

## 5. Student application layout

### Desktop, 1200px and above

- The shell fills the viewport with a 216px left sidebar and a flexible content area.
- The sidebar is dark green and at least viewport height; logo at the top, menu in the middle, help at the bottom. It may be sticky with internal scrolling when content is long.
- Menu labels: `Beranda`, `Materi`, `Quiz`, `Kalkulator IMT`, `Post-test`. Use one outline icon style.
- Keep the content ivory. Do not add a marketing navbar or signup hero CTA.
- The content header shows the greeting/student name and school; the right side shows learning progress.
- Below the header, show a horizontal stepper: `Pre-test → Materi → Quiz → Kalkulator IMT → Post-test`.
- The main area uses two columns: approximately 70% for current content and 30% for the lesson list, with a 32px gap. Give the lesson list enough width for readable titles, approximately 280–320px on wide screens.
- Within the current-content area, place the heading/text/button beside the photograph. Give the photograph its own space; it must not cover text.
- Do not force three columns when there is insufficient width. Switch to tablet layout rules earlier if needed.
- On very wide screens, cap the content area beside the sidebar at `max-width: 1440px`; add reasonable whitespace rather than stretching paragraphs/photos indefinitely.

### Tablet, 768–1199px

- Replace the permanent sidebar with a compact header and drawer navigation. Do not make an unlabeled icon rail the only navigation.
- Move the lesson list below the main content when two columns are no longer readable.
- Keep the heading and photograph side by side only when both have sufficient space; otherwise stack them vertically.
- The stepper may become a horizontally scrollable list within its own region, keeping the current stage visible.

### Mobile, below 768px

- Use one column, 16px padding, a compact header, and an accessibly labeled menu button.
- Order: compact identity → progress/current stage → current lesson and CTA → photograph → lesson list → subsequent stages.
- The stepper may show `Tahap 2 dari 5 · Materi`, compact progress, and a button to view the complete sequence.
- The main CTA may fill the container width. Keep controls at least 44px tall; do not shrink fonts to fit the desktop layout.
- The sidebar becomes a dismissible drawer with Escape support and focus restoration.
- The page must not overflow horizontally at 360px. CMS tables are a local exception described in the CMS section.
- Sticky elements must respect safe areas and must not cover buttons, lesson content, or the input keyboard.

## 6. Component rules

### Buttons and links

- Primary action: yellow `secondary` background, `text` foreground, 44–48px height, 20–24px horizontal padding, 4px radius, and 16px/600 font.
- Supporting action: transparent/surface background, green border, green text. Tertiary action: a text link, underlined when used inside a paragraph.
- Green buttons with white text may be used in secondary contexts without competing with the dominant yellow CTA in the same area.
- Use a right-arrow icon only for clear forward navigation. Do not add icons to every button.
- Hover/pressed states follow the tokens. Avoid scale animations, bouncing, or floating buttons.
- Loading shows an indicator and a label such as `Menyimpan…`; prevent duplicate submissions. Disabled controls must have a visible explanation nearby.
- Use `<button>` for actions and links/router links for navigation.

### Navigation and stepper

- The active menu item has a solid yellow background and `aria-current="page"`.
- Completed stage: green circle and checkmark, accompanied by `Selesai`.
- Current stage: numbered yellow circle and a prominent label.
- Locked stage: lock icon, muted background, `Terkunci` label, and a reason readable without hovering.
- Do not give unavailable stages the pointer/hover behavior of active links.
- Progress must come from actual status. Login is not counted as a learning stage in this five-stage stepper.
- Lessons have their own nested progress, such as `Materi 1 dari 3`; the count comes from the CMS.

### Lesson list

- Each row has a serif number, title, status, and action/status icon.
- Current lesson: soft yellow background and a 4px yellow left border/accent.
- Completed lesson: checkmark and `Selesai`; students may reopen it.
- Locked lesson: lock icon and `Selesaikan materi sebelumnya untuk melanjutkan.`
- Prefer horizontal dividers over separate shadowed cards.

### Forms and messages

- Labels always remain visible above inputs. Placeholders do not replace labels.
- Input height: 44–48px; `border-strong` border; surface background; 4px radius. Mobile input text must be at least 16px.
- Focus: 2px green outline with a 2px offset; on green backgrounds, use a yellow outline with a clearly visible separation/offset.
- Error: danger border, a specific message beneath the input, and an `aria-describedby` association. Preserve entered values.
- The login form contains `Nama lengkap`, `Asal sekolah`, `Tanggal pengisian`, and the `Mulai pre-test` CTA.
- All fields are required; reject whitespace-only input. Do not impose arbitrary one-word/two-word name rules or unreasonable school-name lengths.
- The date may default to the user's local date while following project data rules. Store dates as `YYYY-MM-DD`; display them in Indonesian format. Do not use the mockup's sample date.
- Place network errors near the action with `Coba lagi`; do not rely solely on a quickly disappearing toast.
- Use toasts only for brief, noncritical messages. Errors and learning prerequisites remain visible inline.

### Dialogs

- Use dialogs for submission confirmations or short messages. Long lessons are better presented on a detail page with clear navigation.
- Dialogs use an ivory surface, serif title, thin border, and 6px radius; use a translucent dark overlay without blur/glassmorphism.
- Provide an accessible title, close button, focus trap, Escape support, and focus restoration to the trigger.
- On mobile, long dialogs must scroll and their buttons must remain reachable.
- Closing a lesson dialog does not automatically mark the lesson complete.

### Icons and illustrations

- Choose one existing outline icon library; use approximately 1.5–2px strokes and 18–20px sizes.
- Do not mix emoji, filled icons, 3D icons, and outline icons.
- Decorative icons use `aria-hidden`; icon buttons have accessible names and tooltips when useful.
- Keep the book/leaf logo if its asset is available. Do not replace it with a mascot or a new generic logo.

## 7. Photography and assets

- Visual reference: glass/ivory/sage weighing scales, yellow measuring tape, height-measurement equipment, warm natural light, neutral ivory backgrounds, and soft shadows.
- Photography should feel editorial and realistic; do not replace it with cartoon illustrations or shiny 3D objects.
- Place the main photograph in its own column; target a roughly 1:1 or 4:5 ratio depending on the space. `object-fit: cover` is acceptable if the weighing scale and tape remain recognizable.
- The login panel uses a coordinated crop that matches the main photograph and soft yellow palette.
- Do not use food photographs in the hero or login panel for this revision.
- Do not add “ideal” body shapes, before/after photographs, target kilograms, IMT classifications, or health claims as decoration.
- Numbers and lettering that happen to appear in photographs are not application data. Display user values as HTML text from data.
- Use `alt=""` for purely decorative photographs. For photographs explaining lesson content, provide concise alt text that describes the actual content.
- The mockup is not a full-page background asset. Rebuild the UI with components and semantic HTML. Prepare separate photographic assets from available sources; use neutral placeholders only during development.
- Use project-appropriate formats/assets, explicit dimensions, and responsive variants. Do not lazy-load the main hero; below-the-fold images may be lazy-loaded.

## 8. Student flow and required states

Product sequence: **Login → Pre-test → Sequential lessons → Quiz → IMT calculator → Post-test → Summary.**

| Stage              | Prerequisite              | Frontend behavior                                                      |
| ------------------ | ------------------------- | ---------------------------------------------------------------------- |
| Login              | No student session        | Collect name, school, and date                                         |
| Pre-test           | Identity saved            | Must appear before lesson content becomes accessible                   |
| First lesson       | Pre-test submitted        | First lesson active; subsequent lessons locked                         |
| Subsequent lessons | Previous lesson complete  | Unlock the next lesson in sequence; retain access to completed lessons |
| Quiz               | All lessons complete      | Show questions, save answers, show score after submission              |
| IMT calculator     | Quiz submitted            | Appears after the quiz and before the post-test                        |
| Post-test          | Calculator stage complete | Use the same questions as that student's pre-test                      |
| Summary            | Post-test submitted       | Show final status and results permitted by the system                  |

- After login, redirect directly to the pre-test. Do not expose lesson previews, educational hero content, or lesson bodies before pre-test completion.
- Locked buttons/menus cannot be the only protection. Route guards must check state on direct URL access, refresh, and Back navigation; the server must still validate access/submissions.
- Progress must be saved and recoverable. Distinguish `belum dimulai` (not started), `sedang dikerjakan` (in progress), `selesai` (complete), and `terkunci` (locked); do not infer progress solely from clicked pages.
- Record lesson opening and completion as separate events. Opening a lesson does not automatically complete it.
- Lessons end with a `Selesai & lanjut` action. If a lesson contains multiple required sections, all must have been displayed/traversed. For media, follow the completion rules defined by the content.
- Scrolling, dwell time, and clicks indicate interaction only; do not claim they prove that students read or understood the lesson.
- Do not introduce forced timers without an agreed requirement. Lesson counts and per-section rules come from content/CMS, not a hardcoded three-lesson assumption.
- Revisiting completed lessons must not delete assessment results or move progress backward.
- Locked views still explain their prerequisites. Do not send restricted lesson content/answer keys to the client merely to hide them with CSS.

### Pre-test, quiz, and post-test

- Distinguish the assessment title/type, question number, progress, unanswered answers, saved answers, saving, save failure, and submitted states.
- Use complete answer labels; make the entire option clickable with a target at least 44px tall. Single-choice questions use radios; multiple-choice questions use checkboxes according to the CMS question type.
- Support question types actually available in the backend. Do not invent essay/upload support if it does not exist.
- Save answers with stable identifiers: session/student, assessment type, attempt, question ID, question version, and option ID/answer value. A/B/C labels alone are insufficient.
- Pre-test and post-test must preserve the same question, option, and scoring-rule snapshots for that student. Mid-session CMS edits must not silently change their paired assessments.
- The quiz has a separate question bank. Teachers must be able to inspect answers to every question, not just total scores.
- Save on answer changes or the next action according to the API; always show saving status. Do not claim an answer is saved before server confirmation.
- Final submission must clearly handle unanswered required questions and final confirmation. After success, prevent duplicate submissions; answer changes follow the backend's attempt policy.
- By default, to preserve the evaluation process, do not reveal pre-test answer keys/explanations before post-test completion. The quiz still shows its score after submission, as required.
- Reloading must restore the active attempt and saved answers. Page navigation must not silently discard data.

### IMT calculator

- Use the labels `Berat badan (kg)` and `Tinggi badan (cm)`, with units always visible.
- Use decimal inputs suitable for mobile keyboards; normalize comma/period decimal formats with clear validation.
- Weight and height must be positive, finite numbers, and height must not be zero. Prevent `NaN`/`Infinity` results; show errors beside the relevant field.
- Calculation: weight in kilograms divided by squared height in meters. Preserve calculation precision; format the displayed result to one decimal place.
- `Hitung IMT` shows the numerical result; `Lanjut ke post-test` becomes available after a valid calculation is recorded.
- Save inputs, results, and activity timestamps through the API so teachers can monitor them. Backend verification of frontend calculations is required for assessment/recordkeeping data.
- Do not apply adult categories or “ideal/not ideal” labels by default to students. Interpretations, age ranges, and health copy must come from validated content appropriate for the intended users.

## 9. Login/pre-test screen

- This is a separate page without accessible lesson navigation.
- Desktop: a soft yellow introductory panel with branding and measurement photography on the left; a tidy form on the right. Use a thin border and a very subtle shadow.
- A comfortable maximum width is approximately 880–960px. Do not copy the miniature dimensions shown on the concept board.
- Mobile: one column; compact branding/introduction → form → optional photograph. Prioritize the form in the initial viewport.
- Show `Selesaikan pre-test sebelum membuka materi.` near the CTA.
- Once identity is saved, show the actual assessment; do not stop at a mock login button.

## 10. Teacher/CMS and monitoring

The CMS follows the same visual language, with an emphasis on clear data presentation. Teacher access requires separate authentication and authorization; student name/school login must not grant CMS access.

### Structure

- Green header with branding, teacher-area label, account identity, and account menu.
- Main sections: `Hasil siswa`, `Materi`, `Bank soal`. The quiz and shared pre/post bank may use explicit subtabs.
- Page headings use serif; filters/actions/forms/tables use sans-serif.
- Do not pack the entire editor and every dataset onto one crowded screen. Use detail pages or focused panels.

### Student results

- Allow filtering the student list by school, submission date, progress status, and assessment type according to the available data/API.
- Student details include identity, lesson history/progress, pre-test results, quiz results, IMT calculator activity/results, and post-test results.
- Provide **answers to a question across students**: select an assessment type and question, then show students, schools, full answers, scores, and timestamps when available.
- Also provide **answers by student**: show all questions and that student's answers within one attempt.
- Teachers must be able to read the question text and selected option/answer text, not just the letter B or a total score.
- Distinguish `Belum dijawab`, `Belum mengerjakan`, `Salah`, and `Benar`; missing scores are not automatically zero.
- Show attempt numbers and question versions when relevant to interpreting results.
- Tables: green header/white text, surface-colored body, subtle dividers; selected rows use soft yellow. Avoid high-contrast zebra stripes or vertical lines around every cell.
- Allow answer text to wrap. `Lihat jawaban` opens structured details rather than truncating the content.
- Pagination, filters, and empty/error/loading states must be clear. Preserve filters when returning from details where possible.
- On mobile, tables may scroll horizontally within a clearly labeled container or become summary lists with details. Do not shrink an entire table into unreadable text.
- Student/result data is not public content. Do not send all data to student browsers or rely on hiding menus.

### Lesson management

- Support listing, adding, editing, previewing, ordering, and draft/published status according to the backend.
- Core fields: title, content/media blocks, order, and completion rules where applicable.
- Content order determines student access order. Changes during active sessions follow backend versions/snapshots; do not disrupt saved progress.
- The editor and preview must use the same reading styles as the student pages.
- Sanitize rich text/media according to the project system. Do not render untrusted HTML directly.

### Question banks

- Clearly distinguish `Quiz` from `Pre-test / Post-test`.
- Pre-test and post-test use a shared bank. Show `Pre-test & post-test memakai bank soal yang sama.`
- The editor includes question text, type, options where applicable, correct answer/scoring rules, order, and publication status.
- Validate empty options, empty questions, and invalid answer keys before saving/publishing.
- Answer keys and editing functions are available only in the authorized teacher area.
- Once a question has responses, use backend versioning/archiving; do not erase historical questions/answers.
- Provide clear UI for draft saving, save failure, unsaved changes, successful publication, and delete confirmation.

## 11. Language, accessibility, and feedback

- The interface language is Indonesian. Use consistent terms: `Pre-test`, `Quiz`, `Post-test`, `Kalkulator IMT`, `Materi`, `Hasil siswa`, `Bank soal`.
- Keep copy short and concrete: `Buka materi`, `Simpan perubahan`, `Jawaban tersimpan`, `Selesaikan materi sebelumnya untuk melanjutkan.`
- Do not add unprovided slogans, testimonials, success metrics, or partner logos.
- Use `header`, `nav`, `main`, and `aside` landmarks and a heading hierarchy that matches the structure.
- All functionality must work with the keyboard; provide a skip link and visible focus.
- Content must remain readable at 200% zoom without losing important buttons/text.
- Use labels, fieldset/legend for choice groups, and accessible names for icon controls.
- Use appropriate live announcements for save status and calculation results; do not interrupt screen readers on every minor change.
- Animation is limited to 140–200ms color/opacity transitions; respect `prefers-reduced-motion`.
- No autoplay media with sound, parallax, scroll hijacking, confetti, or entrance animations on every element.

## 12. Implementation rules for agents

1. Read this document and open the reference image before building the UI. Treat the student shell, login/assessment pages, and CMS as separate contexts.
2. Use global tokens and reusable components: Button, InputField, StatusBadge, LearningStepper, LessonRow, AssessmentQuestion, DataTable, EmptyState, ErrorState, and Dialog as appropriate for the stack.
3. Separate UI state from persisted learning/attempt status. Integrate with the actual backend model; do not rely only on local state that disappears on refresh.
4. Use sample data only in fixtures/development. State clearly when an API/backend is unavailable; do not present simulations as real persistence or access protection.
5. Do not place secrets or answer keys in public bundles, URLs, or student browser storage.
6. Preserve the UI after save failures and provide a retry path. Avoid resetting forms/answers when requests fail.
7. Do not introduce large dependencies, design systems, fonts, or animation libraries when the existing stack can meet the requirement.
8. Preserve state context through refresh/navigation according to project routing and APIs; do not use `localStorage` as the sole source of truth for scores/progress.
9. All progress numbers, scores, names, schools, dates, and lesson counts come from data. Do not hardcode `1 dari 5`, three lessons, or the mockup's 2025 examples.
10. Separate photography/brand assets from markup. Do not substitute a mockup screenshot for an implemented website.

## 13. Visual prohibitions

- Do not use the Bold Workbook style: checkerboards, thick green borders on every element, vivid lime, or oversized sans-serif throughout the page.
- Do not use glassmorphism, neon, purple/blue gradients, glow, decorative blobs, 3D illustrations, navigation emoji, or excessively rounded cards.
- Do not add an unrequested SaaS landing page, pricing, testimonial carousel, or bento grid.
- Do not use food photography in this revision's hero/login or replace photography with cartoon scales.
- Do not make all text serif, all controls pill-shaped, or all panels shadowed.
- Do not force desktop layouts onto mobile with transform scaling or tiny fonts.
- Do not add decoration that competes with headings, CTAs, progress, or student answers.

## 14. Acceptance checklist

### Visual

- [ ] The design immediately reads as Editorial Campus: forest green, golden yellow, ivory, serif, and weighing-scale photography.
- [ ] Main CTAs are yellow with dark green text; the sidebar is green with yellow active items.
- [ ] The UI does not include the concept-board title, palette, or labels.
- [ ] Main/login photography relates to body-weight/height measurement and does not cover text.
- [ ] Tables/forms use comfortable font sizes, not the mockup's miniature sizes.
- [ ] Layouts have been checked at 360px, 768px, 1024px, and 1440px; no page overflow or clipped text.

### Flow and data

- [ ] After login, students reach the pre-test before reading lessons, including through direct URLs.
- [ ] Subsequent lessons stay locked until the previous lesson is complete; opening and completion are distinct states.
- [ ] The quiz unlocks after all lessons; its score appears after submission.
- [ ] The calculator appears after the quiz and before the post-test; teachers can monitor its inputs/results.
- [ ] Post-test questions use the same snapshot as that student's pre-test.
- [ ] Answers are saved per question and visible to teachers in the correct question/student/attempt/version context.
- [ ] The CMS manages lessons, quiz questions, and the shared pre/post bank according to backend capabilities.
- [ ] Refresh restores saved progress/answers; save failures and duplicate submissions are handled.
- [ ] Teacher/student access is separated and validated on the server, not merely through display conditions.

### Interaction quality

- [ ] Each screen has relevant loading, empty, error, success, and locked states.
- [ ] Keyboard access, focus rings, form labels, dialogs, contrast, and 200% zoom have been checked.
- [ ] Sample data is not treated as real data; mockup dates/names/scores are not production values.
- [ ] The frontend does not invent health claims or IMT categories.

## 15. Short instruction to give an agent

> Implement the frontend according to `frontend.md` and `01-editorial-campus-v2-timbangan.png`. Preserve the Editorial Campus style: primary #0C3E28, secondary #F6BC20, canvas #F7F3EC, Georgia headings, Arial UI, thin dividers, small radii, and photographs of weighing scales and height-measurement equipment. The image is a concept board; build the student, login/pre-test, and teacher/CMS screens as separate pages. Keep user-facing copy in Indonesian. Implement Login → Pre-test → Sequential lessons → Quiz → IMT calculator → Post-test, answer persistence per question, and a CMS for lessons, quiz questions, and the shared pre/post bank. Follow the existing project stack, use real data/APIs, and do not claim the backend is complete if it is still mocked. Verify responsive visuals, accessibility, all locked states, and persistence before declaring completion.
