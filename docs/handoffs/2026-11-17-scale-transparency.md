# Transparent measurement artwork

- Date (Asia/Jakarta): 2026-11-17
- Status: in_progress; source/tests verified, frontend-only delivery pending.
- Request: remove the black background from the newly supplied scale illustration. This supersedes only the previous preserve-background choice.
- Owner / implementor / reviewer: parent Sol, gpt-6.1-sol, effort unknown. Native tiny artwork correction and parent review; no Luna routing or new independent reviewer verdict is claimed. Canonical frontend/engineering/delegation/handoff rules and the preceding illustration release remain applicable; no product behavior or API changes.

## Changes and image contract

- `public/assets/illustrations/measurement-scale-transparent-d78be1ff.png` and matching generated `assets/illustrations/` publishing copy: true RGBA PNG,1280×767, SHA256 `d78be1fff98fc1f6a525b8f18d92ce7fd6b21fcf6a626563f6acedbb61d8a07c`.
- Derived from the retained original JPEG, SHA256 `0da8acfb48031c5b516eef62636211f5ef050afdfa461d8bd17fa29eb17462d2`. Original and previous stock assets remain for compatibility/provenance.
- Remove only edge-connected near-black exterior, preserving enclosed text/markings, green decorations, pale oval artwork and tape. A narrow anti-aliased boundary is decontaminated from the black matte; opaque interior samples are byte-identical. All four image corners have alpha0 and interior samples alpha255. Matting report and ivory/yellow composites are in `/home/ubuntu/imt-smart-teens/evidence/scale-transparent/`.
- Shared `MeasurementPhoto.tsx` now refers to the cache-distinct PNG. Existing aspect ratio, `contain`, alt text, caption, responsive visibility and eager priority remain unchanged. Printed52.3kg remains artwork, not application data.
- Component/static tests verify updated source, PNG signature/dimensions/RGBA/hash, identical generated publishing copy, original JPEG provenance and optional caption. Generated `index.html` changes with the production build. No dependency/package/CSS/API changes.

## Verification so far

- New isolated-worktree baseline:62Vitest+6legacy passed. First exploratory baseline ran in the preceding worktree; the clean baseline was repeated in this actual worktree before changes.
- Observed RED against old JPEG source and absent transparent derivative; corrected a static-URL test-path transformation so original JPEG provenance remains a meaningful passing control, then confirmed exactly2expected failures and2controls passing.
- After substitution:63Vitest+6legacy, frontend build and whitespace check passed.
- Parent artwork review: yellow-background composite shows complete undistorted subject and no obvious black border; RGB interior samples preserved. Public live delivery, actual browser alpha checks and frontend-only rollback/readback remain pending.

Next: freeze/build exact image; verify compiled desktop/mobile and owned synthetic learning home; merge/push tested frontend source; recreate only frontend with immutable override; verify PNG alpha/bytes over HTTPS and unchanged backend/PostgreSQL IDs/data/secrets; stop only owned smoke resources and finalize this handoff.
