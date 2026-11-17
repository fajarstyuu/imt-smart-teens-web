# Transparent measurement artwork

- Date (Asia/Jakarta): 2026-11-17
- Status: completed; exact transparent PNG and public HTTPS UI verified.
- Request: remove the black background from the newly supplied scale illustration. This supersedes only the previous preserve-background choice.
- Owner / implementor / reviewer: parent Sol, gpt-6.1-sol, effort unknown. Native tiny artwork correction and parent review; no Luna routing or new independent reviewer verdict is claimed. Canonical frontend/engineering/delegation/handoff rules and the preceding illustration release remain applicable; no product behavior or API changes.

## Changes and image contract

- `public/assets/illustrations/measurement-scale-transparent-d78be1ff.png` and matching generated `assets/illustrations/` publishing copy: true RGBA PNG,1280×767, SHA256 `d78be1fff98fc1f6a525b8f18d92ce7fd6b21fcf6a626563f6acedbb61d8a07c`.
- Derived from the retained original JPEG, SHA256 `0da8acfb48031c5b516eef62636211f5ef050afdfa461d8bd17fa29eb17462d2`. Original and previous stock assets remain for compatibility/provenance.
- Remove only edge-connected near-black exterior, preserving enclosed text/markings, green decorations, pale oval artwork and tape. A narrow anti-aliased boundary is decontaminated from the black matte; opaque interior samples are byte-identical. All four image corners have alpha0 and interior samples alpha255. Matting report and ivory/yellow composites are in `/home/ubuntu/imt-smart-teens/evidence/scale-transparent/`.
- Shared `MeasurementPhoto.tsx` now refers to the cache-distinct PNG. Existing aspect ratio, `contain`, alt text, caption, responsive visibility and eager priority remain unchanged. Printed52.3kg remains artwork, not application data.
- Component/static tests verify updated source, PNG signature/dimensions/RGBA/hash, identical generated publishing copy, original JPEG provenance and optional caption. Generated `index.html` changes with the production build. No dependency/package/CSS/API changes.

## Source verification (historical pre-rollout checkpoint)

- New isolated-worktree baseline:62Vitest+6legacy passed. First exploratory baseline ran in the preceding worktree; the clean baseline was repeated in this actual worktree before changes.
- Observed RED against old JPEG source and absent transparent derivative; corrected a static-URL test-path transformation so original JPEG provenance remains a meaningful passing control, then confirmed exactly2expected failures and2controls passing.
- After substitution:63Vitest+6legacy, frontend build and whitespace check passed.
- Parent artwork review: yellow-background composite shows complete undistorted subject and no obvious black border; RGB interior samples preserved. Public live delivery, actual browser alpha checks and frontend-only rollback/readback remain pending.

## Completed delivery

- Frozen source `07b08d2603e01b7b95050ffdaff649a8491bbff8`, image `sha256:ca5cd2d5f47e46d6c0011e6914208344cbb4d1fe3fd8f90ad041c89ccd1a1113`, matching source label. Clean merged-main63Vitest+6legacy, production build and full-range whitespace passed; Git and GitHub API ref readbacks matched the pushed source.
- Compiled-image acceptance:12captures across student/admin sign-in and learning home at360/768/1024/1440px, zero page exceptions/overflow. Only a synthetic smoke enrollment completed its required pre-test to enter the learning home; no production fixture or guard bypass.
- Actual browser canvas tests verified four image-corner alpha values0 and an opaque interior alpha255, not a painted page-colored background. Decoded dimensions1280×767, MIME `image/png` and complete derivative SHA matched in candidate and public HTTPS.
- Production:8anonymous sign-in captures across four viewport widths, zero page exceptions/overflow. Existing responsive visibility is unchanged. Candidate yellow-panel artwork was visually inspected; black rectangle is gone and complete scale/tape/details remain. Pale oval/decorations are intentionally retained as part of the artwork.
- Only frontend was recreated using private `scale-transparent-20261117-images.json`. Previous source `aa163ba875c887cbc12aa79b0d552230916908c3` and image `sha256:58cf86abc11797a467d091ae1fffc69ef4e0cf53986af6cc46832af8b6ea67ef` remain rollback targets; no rollback was required.
- Backend/PostgreSQL exact container IDs, settings, secret bytes/metadata and all27 durable business-table snapshots matched pre-switch state. No backend rebuild/restart, database migration/reset, credential rotation, live enrollment or content publication occurred.
- Existing public script passed TLS/SANs/redirects, exact image HTML/JS/CSS, SPA/API, IPv6 loopback routing, direct API403, cookie/CORS/CSRF/body-limit checks and unchanged portfolio. These probes originated on the VPS, not an independent off-host audit.
- Evidence: `/home/ubuntu/imt-smart-teens/evidence/scale-transparent/` includes original/derivative matting metadata, ivory/yellow composites and `{candidate,production}/verification.json` plus captures. Scratch logs use `scale-transparent-*.log`. Owned smoke containers are stopped after acceptance, retaining volume/secrets/evidence; runtime and feature worktrees remain.
- Runtime frontend stays detached at the frozen source above. A following closeout advances main by documentation only. No full student browser-suite, native200%zoom or capacity certification is newly claimed. Parent acceptance is based on actual image/alpha/source/compiled/HTTPS evidence, not a new independent reviewer verdict.

Next owner: user may refresh the revised site. Future releases require a fresh approved checkpoint, not replay of the one-shot private operator.
