# Owner-supplied measurement illustration

- Date (Asia/Jakarta): 2026-11-17
- Status: in_progress (source verified; frontend-only deployment pending)
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
- Remaining: compile candidate frontend image, verify desktop/mobile image delivery and learning-home consumer in owned smoke resources, frontend-only switch with exact rollback, HTTPS image-byte/hash verification and final handoff. No backend rebuild/restart, database migration/seed/reset, secret rotation, or portfolio change is authorized or needed for this image revision.
