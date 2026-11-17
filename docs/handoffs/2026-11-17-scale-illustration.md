# Owner-supplied measurement illustration

- Date (Asia/Jakarta): 2026-11-17
- Status: completed; frontend-only release and public HTTPS artwork verified
- Goal: replace the existing shared weighing-scale photograph with the exact JPEG supplied by the owner. Preserve other UI and behavior.
- Owner / implementor / reviewer: parent Sol (gpt-6.1-sol; effort unknown), native tiny presentation-only correction. No delegated Luna execution or independent second review is claimed; runtime routing is unavailable and the change is a direct asset/alt/framing substitution.
- Specifications read: canonical AGENTS.md, rules.md, frontend.md, delegation.md, handoff.md, previous CMS release handoff. This explicit owner request overrides only the earlier photography-not-illustration requirement.

## Contract and changed files

- `public/assets/illustrations/measurement-scale-0da8acfb.jpg`: exact incoming JPEG, SHA256 `0da8acfb48031c5b516eef62636211f5ef050afdfa461d8bd17fa29eb17462d2`, 1280×767. No recoloring, background removal, cropping, or recompression. Retain the unused stock asset for compatibility.
- `src/components/MeasurementPhoto.tsx`: one shared source updates student/admin sign-in and the learning home; Indonesian alt text describes an illustration. The printed52.3kg is artwork, never application data. Existing optional caption and eager image priority remain.
- `src/styles/student.css`: correct image aspect ratio and `object-fit:contain`; no other layout or responsive policy change.
- `tests/measurement-image.test.tsx`: actual component source/dimensions/alt/caption, exact input hash and absence of a fake textual measurement.
- Generated `index.html` changes only with the production build. `assets/illustrations/measurement-scale-0da8acfb.jpg` is the matching generated root publishing copy, tracked like the existing stock image; it must match the public source bytes. The clean-checkout gate caught this new generated directory before any live mutation; it was retained rather than ignored or silently deleted.

## Verification and acceptance

- Clean baseline: `npm ci --no-audit --no-fund && npm test`:59Vitest+6legacy passed.
- Observed RED: new source/dimensions and missing exact asset assertions failed against the old component; optional caption test passed.
- After substitution, `npm test`:62Vitest+6legacy passed; `npm run build` and `git diff --check` passed. Existing React Router `use client` bundler warnings remain nonfatal; no dependency changes.
- Parent source review: exact shared consumer reuse, true dimensions, unchanged user image bytes, cache-distinct URL, accurate alt text, bounded CSS change and no auth/data/API edits accepted.
- Final merged-result tests: 62 Vitest + 6 legacy and production build passed again; full-range whitespace passed. Source `aa163ba875c887cbc12aa79b0d552230916908c3` was merged/pushed and independently matched Git and GitHub API refs. Image `sha256:58cf86abc11797a467d091ae1fffc69ef4e0cf53986af6cc46832af8b6ea67ef` carries that source label. A later closeout may advance main by documentation only.
- Compiled candidate acceptance: student/admin sign-in and learning home at360/768/1024/1440px, 12 captures, zero page exceptions or page overflow, decoded1280×767 image with `contain`, exact JPEG SHA match. Only an owned smoke enrollment completed pre-test to reach the protected learning home; no guards were bypassed and no production enrollment was created.
- Frontend-only live switch passed exact source/image/health readback. Previous frontend source `0922dfc4cba33cca615d9e5a2059fae881ede5e6` and image `sha256:f3b02ba5cc31c4782ab49d96fdc975f7860c9a9e4e56663928063e3eebb2e315` remain the rollback point. No rollback was required. Before-switch clean-source rejection caused no live mutation and exposed the generated root publishing copy described above.
- Production HTTPS acceptance: 8 student/admin sign-in captures over four viewport widths, zero page exceptions/overflow, exact image/JPEG bytes and dimensions. Existing mobile sign-in hides the decorative image; that responsive policy is unchanged. Compiled synthetic learning-home mobile image was visually inspected and remained complete/undistorted.
- Existing public security script passed TLS/SANs/redirects, exact running-image HTML/JS/CSS, same-origin API, IPv6 loopback routing, deliberate direct API403, secure cookies/CORS/CSRF/body limits and unchanged portfolio. Checks originate on this VPS, not an independent off-host audit.
- Backend and PostgreSQL container IDs, production Compose settings, secret bytes/metadata and all27 durable business-table snapshots matched the immediate pre-switch checkpoint. No backend rebuild/restart, database migration/seed/reset, secret rotation or portfolio edit was performed. Production student/admin records were not used as fixtures.
- Runtime frontend worktree remains `.worktrees/production-deployment`, detached at the frozen image source; Compose uses the private `scale-image-20261117-images.json` pin. Private checkpoint/operator/receipt use the same prefix under the existing production directory; do not replay the one-shot operator. Backend/migrator image pins are unchanged.
- Evidence: `/home/ubuntu/imt-smart-teens/evidence/scale-illustration/{candidate,production}/verification.json` and captures; scratch `scale-image-{red,green,build,merged-test,merged-build,docker}.log`. The owned smoke containers are stopped after acceptance, retaining their volume/secrets. Both runtime and feature worktrees are preserved.
- Scope limits: no new full student browser-suite, native200%zoom or load test is claimed for this static-asset substitution. Existing CMS Minor/clinical-classification backlogs remain unchanged. Parent acceptance is based on exact asset/source/compiled/deployed evidence above, not a new independent reviewer verdict.
- Next owner: user can use the revised site; refresh an already-open page to fetch the new entrypoint.
