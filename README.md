# Imt Smart Teens

Imt Smart Teens is a React + TypeScript learning application implemented according to `frontend.md`. The interface is in Indonesian and uses the specified Editorial Campus palette, Georgia headings, Arial controls, small radii, thin dividers, and realistic measurement photography.

## Run

Requires Node.js 22.12+ and npm.

```sh
npm install
npm run build
npm start
```

Open **http://127.0.0.1:4174**. The built, editable-source-backed website entry is **index.html**. Opening it in Open Design also requires the local data service (`npm start`). The service binds only to the loopback interface and serves the app entry for direct clean browser routes while keeping `/api/*` and `/assets/*` separate.

Production hosts must be configured to serve `index.html` for extensionless application routes such as `/materi/materi-1` and `/guru/hasil`, while continuing to serve real assets and API requests normally. The application uses BrowserRouter and cannot rely on hash URLs for host fallback.

For source development:

```sh
npm run dev
```

Open **http://127.0.0.1:5173/app.html**. `app.html` is the Vite source entry; `npm run build` generates `index.html` and its relative local assets. Do not hand-edit the generated bundle. Edit `src/`, then rebuild.

## Included areas

- Student identity form, pre-test, guarded learning dashboard, sequential lessons, quiz, IMT calculator, post-test, and final summary.
- Autosaved question responses with stable question/option/version/attempt identifiers, save feedback and retry; unanswered-answer checks and confirmed final submission.
- Separate lesson-opening and completion events, required section traversal, completed-lesson revisits, and server-side prerequisite checks in the development service.
- A shared pre/post snapshot per student; CMS edits do not change an existing student's questions, option IDs, grading rules, or lesson order.
- Teacher login, school/date/progress/assessment filters, results pagination, full answers by student and by question, lesson activity and IMT records.
- Lesson creation/editing/preview/reordering, text sections, question creation/editing, single/multiple choice, correct answer validation, draft/publication state, and confirmed archiving. History is retained.

## Development data and teacher account

**No existing backend was supplied.** `server/` is an isolated local development API, not the production backend. The UI identifies it as a development environment with example data. Do not enter real student data into this demonstration deployment.

The sample teacher login is:

- Email: `guru@ruanggizi.local` (preserved seeded teacher login)
- Password: `BelajarGizi2026!`

These intentionally documented demonstration credentials live only in the server development fixture, not in the browser bundle. Override them using `TEACHER_EMAIL` and `TEACHER_PASSWORD` in the server environment. Teacher sessions are separate from student sessions; both use server-issued random tokens. The development API checks roles and prerequisites and never returns teacher datasets or unreleased answer keys to student requests.

Development records persist in `.data/development.json`, including attempts, answers, lesson versions, section visits, timestamps, results, and an event log. The browser stores **only session tokens** with a memory fallback; it does not store answer keys, grades, progress, or student result datasets as the source of truth. Storage restrictions can prevent session recovery across page reloads. The development token lifetime is seven days.

Use a separate `RG_DATA_DIR` for an isolated dataset. To start over, stop the service and remove only its generated `.data/development.json`; it will be reseeded next time. Tests use a separate temporary directory and never alter the normal demonstration dataset.

## Architecture and SOLID

```text
src/
  components/       Shared controls, navigation, tables, question and editor views
  pages/            Student and teacher application areas
  hooks/            App context, assessment saving, navigation, data loading
  domain/           Typed models and learning progression rules
  services/         Student/teacher repository contracts and HTTP implementation
  styles/           Central tokens, global rules, student and teacher layouts
server/
  fixtures.mjs      Development content and example student records (server only)
  domain.mjs        Server validation, guards, calculation, grading, redaction
  development.mjs   Local API and built-site server
```

- **Single responsibility:** rendering, assessment behavior, transport, and domain decisions have separate modules. Application content and example identities are data, not embedded in JSX.
- **Open/closed:** shared controls are extended by composition and props; a new backend can implement the existing service contracts.
- **Liskov substitution:** service implementations must return the same typed models and preserve repository behavior.
- **Interface segregation:** student and teacher repository contracts are distinct; views consume the appropriate interface.
- **Dependency inversion:** `AppProvider` receives `AppServices`; UI hooks depend on that contract rather than calling `fetch` directly.

The local API verifies IMT independently of the frontend, keeps full calculation precision, and stores measurements before unlocking the post-test. The UI displays one decimal and deliberately does not assign adult BMI categories or health interpretations.

## Production integration still required

Set `VITE_API_URL` to your API base URL and rebuild. `src/services/contracts.ts` declares the frontend requirements; `src/services/api.ts` and `server/development.mjs` document the current endpoint contract. Replace the adapter when your backend uses different routes or models.

Production release still requires your actual identity/access system, secure session handling, server-controlled content/versioning, persistent database and migrations, audit/retention/privacy requirements, rate limiting, and production deployment. The supplied local service and sample account do not establish production authentication or data-protection readiness. There is no fabricated connection to a school system.

The local editor supports plain-text content blocks and single/multiple-choice questions. Rich media, external authoring tools, other question types, and backend-specific attempt policies require the corresponding real API capabilities. Lesson content is rendered as text, not untrusted HTML.

## Assets and reference

The referenced concept image `01-editorial-campus-v2-timbangan.png` was not supplied. Styling follows the written specification. The local replacement photograph depicts a glass digital weighing scale and **blue** measuring tape rather than the reference's yellow tape; the photo was not recolored or generated. There is no food photography.

Photography, source, author, and license are retained in `public/assets/stock/credits.json` and the built `assets/stock/credits.json`. The [Pexels License](https://www.pexels.com/license/) permits website use without visible attribution. The unavailable original book/leaf logo is represented with the consistent outline icon family.

## Checks

```sh
npm test
npm run test:api
npx playwright install chromium
npm run test:e2e
```

The test suite covers numeric edge cases, learning guards, grading, response redaction, question snapshots, server role checks, answer retries, question completion, reload recovery, the complete student sequence, teacher editors/results, and horizontal overflow at 360, 768, 1024, and 1440 pixels. Browser tests start their own isolated development API on port 4175.

Implementation references: [React createRoot](https://react.dev/reference/react-dom/client/createRoot), [Vite build and relative base paths](https://vite.dev/guide/build.html).

### Results in this environment

The production build/type check, six domain tests, four React DOM integration tests, and the API integration test passed. The DOM tests exercise real development API requests, including the full student sequence, saved-session recovery, save-error retry, route guards, and teacher authoring/results.

Real-browser tests were attempted but could not run: Chromium was blocked by the execution environment’s process permission boundary. The in-app browser was unavailable, and computer-use access to Brave was not approved. Therefore responsive rendering at the four requested widths, visual layout, real-browser focus trapping, and 200% zoom remain **unverified**, rather than reported as passing. The supplied Playwright tests are ready to run in an environment with browser access.
