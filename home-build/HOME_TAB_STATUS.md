# HOME TAB BUILDOUT — STATUS

Branch target: `home-tab-buildout`

## Scope of this pass
- Home / landing surface only.
- Exact assigned Forge Council composition is the single tab hero.
- Exact assigned candidate image is used as profile/identity art, not as a second hero.
- Full Spectrum Independent identity is explicit.
- Dual-Partisan / The Weld doctrine and requested air-quote line are visible.
- Old/deep surfaces remain visible in the navigation rail.
- Unbuilt surfaces are labeled `queued` instead of pointing to fake or broken routes.
- Current `main/index.html` is not replaced in this pass.

## Asset transport note
The branch preview uses a heavily compressed copy of the exact Forge Council hero so the image can be moved safely through the current repository connector. The full-resolution source remains the authority and must replace the transport preview before any production merge. Candidate profile art uses the assigned image in a web-optimized copy.

## QA state
- HTML structure parse: PASS.
- Single tab hero rule: PASS.
- Candidate profile kept separate from hero: PASS.
- Local asset references: PASS.
- Inline JavaScript syntax: PASS.
- Full headless-browser visual QA: NOT YET PASSED; the local Chromium screenshot run stalled in the container.

## Freeze rule
Do not merge this branch into `main` until the Home visual/layout/wording is approved, the full-resolution hero is in place, and browser/mobile QA is complete.

## Next tab after Home is approved
Blueprint.
