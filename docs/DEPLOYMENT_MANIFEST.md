# DEPLOYMENT MANIFEST

This integration combines the latest active redesign work identified in the September 2 V3 package with the current production homepage.

## Homepage

- `assets/css/home-keep-top-v3.css`
- `assets/js/home-keep-top-v3.js`
- `HOME_PATCH_SNIPPET.html`

Purpose: keep the current production top, enforce the three locked canonical assets, redesign the two Weld panels, add the new lower systems hero, add page-length molten seams, and preserve slow automatic plus interactive fireworks.

## AEGIS / Explorers

- `explorers-build/explorers-preview.html`

Purpose: replace the obsolete flat AEGIS presentation with the modern systems-lab rebuild.

## Governance

- `docs/PRODUCTION_EDITING_CONTRACT.md`
- `docs/WORK_PRIMER_PROMPT.md`

## Locked assets are intentionally not duplicated

The repository retains:

- `home-build/assets/upper-rally-hero.jpg`
- `home-build/assets/candidate-profile.jpg`
- `home-build/assets/trademark-emblem.jpg`

## Homepage integration

Load `assets/css/home-keep-top-v3.css` after the current embedded presidential CSS.

Load `assets/js/home-keep-top-v3.js` near `</body>`, after current scripts.

## Explorers integration

Replace `explorers-build/explorers-preview.html` with the systems-lab file.

Earlier V2 and experimental DOM-lift artifacts remain excluded from active deployment to reduce version confusion.
