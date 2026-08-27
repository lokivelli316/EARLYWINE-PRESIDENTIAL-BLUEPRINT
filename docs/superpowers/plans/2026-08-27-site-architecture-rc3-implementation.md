# Presidential Site RC3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Earlywine Presidential Blueprint from a minimal static shell into a coherent, cinematic, interactive public system while preserving lineage, evidence states, mobile usability, and subsystem identity.

**Architecture:** Keep GitHub Pages static and framework-free. Introduce a small shared shell (`site.css`, `site-shell.js`, `data-registry.js`) for navigation, route status, accessibility, progressive motion, and shared cards while keeping specialized subsystems in their own files. Integrate in slices on `site-architecture-rc3-integration`; `main` remains untouched until final approval.

**Tech Stack:** Static HTML5, CSS3, vanilla JavaScript, Canvas 2D for lightweight ambient effects, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-27-site-architecture-rc3-integration-design.md`

## Global Constraints

- Preserve lineage; never silently delete or overwrite working source artifacts.
- No Mr. Clean pass: serious does not mean sterile, generic, or committee-approved.
- One major hero image per tab maximum unless explicitly approved otherwise.
- Explicit route/content states: `LIVE`, `STAGED`, `OPEN`, `SOURCE PACK PENDING`, `REVIEW`, `EXPERIMENTAL`.
- No unsupported legal, scientific, economic, or engineering claim may be promoted by presentation alone.
- Samsung S24 Ultra class mobile viewport is a primary target.
- `main` remains untouched until cumulative review and explicit approval.
- No framework/build step; GitHub Pages must serve directly from static files.

---

### Task 1: Shared shell and public route registry

**Files:**
- Create: `assets/css/site.css`
- Create: `assets/js/data-registry.js`
- Create: `assets/js/site-shell.js`

**Interfaces:**
- Produces `window.EARLYWINE_ROUTES`, `EarlywineShell.init()`, `EarlywineShell.setStatusRail()`, `EarlywineShell.initSpectrumCanvas()`.
- Consumed by all new first-class pages.

- [ ] Add shared dark Forge/civic tokens, responsive grid, glass/instrument panels, focus states, navigation drawer, status chips, reduced-motion fallbacks, ambient spectrum canvas, reveal/tilt utilities, and hero primitives.
- [ ] Define all first-class routes and their current public state in `data-registry.js`.
- [ ] Implement mobile drawer, active-route detection, keyboard Escape handling, status rail rendering, current-year footer, reveal observer, pointer-tilt opt-out, and lightweight Canvas ambient field in `site-shell.js`.
- [ ] Verify JavaScript with `node --check assets/js/data-registry.js` and `node --check assets/js/site-shell.js`.
- [ ] Commit as `feat: add shared RC3 site shell`.

### Task 2: Root candidate / home experience

**Files:**
- Modify: `index.html`
- Create: `assets/media/home-full-spectrum.png`

**Interfaces:**
- Consumes shared shell and route registry.
- Produces the cumulative public front door and stable links to all major systems.

- [ ] Preserve the approved Full Spectrum / Dual-Partisan candidate visual as the single hero spine.
- [ ] Replace the minimal wireframe hero with a layered cinematic hero: art backdrop, readable identity card, route/status rail, interactive spectrum meter, and clear entrance points to Blueprint, Explore, Research, Rights, Address, and Receipts.
- [ ] Convert the ten pillars from static cards into a keyboard-operable selectable systems constellation with dependency/readiness metadata.
- [ ] Add ecosystem map, research/evidence section, media/address section, participation/public-links section, and explicit open/staged route states.
- [ ] Verify all internal anchors and script syntax.
- [ ] Commit as `feat: rebuild candidate home as interactive systems front door`.

### Task 3: Blueprint + Explore integration

**Files:**
- Create: `blueprint.html`
- Create: `explore.html`
- Create: `assets/js/blueprint.js`
- Create: `assets/js/explore.js`

**Interfaces:**
- Blueprint deep state: `?pillar=<1-10>` plus hash fallback.
- Explore deep state: `?tool=aegis|road|pillars|weld|papers`.

- [ ] Reuse the ten existing pillars without flattening their wording.
- [ ] Build a pillar inspector exposing mechanism, dependency, failure condition, related paper, explorer route, and public status.
- [ ] Build Explore as a federation of AEGIS Explorer, Citizen Road Builder, Pillar Explorer, Weld Explorer, and White Papers instead of a monolith.
- [ ] Ensure back/forward and keyboard navigation work.
- [ ] Commit as `feat: add blueprint and explorer federation`.

### Task 4: Research hub + Gate Closing integration

**Files:**
- Create: `research.html`
- Create: `research/gate-closing.html`
- Create: `assets/js/research.js`
- Preserve lineage copies under `lineage/gate-closing/` when material is promoted.

**Interfaces:**
- Research cards expose `type`, `claimState`, `sourceState`, `status`, `route`.
- Gate Closing retains its own internal interaction model.

- [ ] Restore the exact approved Gate Closing hero.
- [ ] Integrate adjudication, economic scenarios, evidence ledger, counter-evidence, and source-integrity views.
- [ ] Keep the cadence claim ASH and universal technical closure ASH.
- [ ] Never generate a universal Gate Closing score.
- [ ] Commit as `feat: integrate research hub and Gate Closing instrument`.

### Task 5: Source Integrity / Receipts integration

**Files:**
- Create: `source-integrity.html`
- Create: `assets/js/source-integrity.js`

**Interfaces:**
- Receipt records expose `id`, `domain`, `state`, `proves`, `doesNotProve`, `nextGate`.

- [ ] Implement RAW → EXTRACT → DERIVE → SYNTHESIZE → ATTACK → ADJUDICATE → RECEIPT pipeline.
- [ ] Add source ladder, filterable receipt ledger, inspector, correction lineage, publication gates, and missing-evidence states.
- [ ] Explicitly state that hashes prove byte identity, not factual truth.
- [ ] Commit as `feat: integrate source integrity and receipts`.

### Task 6: Rights After Conviction integration

**Files:**
- Create: `rights.html`
- Create: `assets/js/rights.js`
- Create: `assets/media/rights-hero.jpg`
- Create: `assets/media/rights-footer.jpg`

**Interfaces:**
- State deep link: `?state=IN` style two-letter code.
- Every completed legal-right entry requires `authorityUrl`, `asOf`, `lastChecked`, and `limitation`.

- [ ] Promote the existing interactive rights prototype rather than replacing it.
- [ ] Add approved felony/candidate hero and approved vertical footer image.
- [ ] Keep federal baseline rights separate from state overlays.
- [ ] Keep incomplete jurisdictions visibly `SOURCE PACK PENDING`; do not invent laws from memory.
- [ ] Commit as `feat: integrate rights after conviction explorer`.

### Task 7: Presidential Address + high-risk systems

**Files:**
- Create: `address.html`
- Create: `assets/js/address.js`

**Interfaces:**
- Media loads on explicit user action.
- Five address tracks have stable fragment IDs.

- [ ] Preserve the five address tracks and the Weld framing.
- [ ] Use segmented/on-demand media loading rather than preloading the long video.
- [ ] Keep BSL-5/6/7 and Viromimetics visibly labeled as proposed project architecture / source-integrity-sensitive material.
- [ ] Commit as `feat: integrate address and high risk systems annex`.

### Task 8: Labs / Data-Gates entrances

**Files:**
- Create: `labs.html`
- Create: `data.html`
- Create: `assets/js/labs.js`

**Interfaces:**
- Lab cards expose one of `LIVE`, `STAGED`, `EXPERIMENTAL`, `SOURCE PACK PENDING`, `OPEN`.

- [ ] Build a strong interactive lab index instead of dead-link tiles.
- [ ] Route existing staged tools where present; expose unavailable tools honestly.
- [ ] Commit as `feat: add labs and data gates hub`.

### Task 9: Cross-page QA and cumulative review

**Files:**
- Create: `docs/qa/2026-08-27-rc3-cumulative-qa.md`
- Update route statuses only after verified checks.

**Interfaces:**
- QA receipt records exact checks and failures.

- [ ] Check duplicate IDs and internal anchors across first-class pages.
- [ ] Run `node --check` for every JavaScript file.
- [ ] Verify every first-class navigation target exists on the integration branch.
- [ ] Verify mobile menu, keyboard focus, reduced-motion behavior, hero/media resolution, and lazy Address loading.
- [ ] Record failures rather than hiding them.
- [ ] Commit as `test: add RC3 cumulative QA receipt`.

### Task 10: Final cumulative preview / promotion gate

**Files:**
- Create: `RC3_INTEGRATION_STATUS.md`

- [ ] Summarize built, staged, open, and source-pack-pending surfaces.
- [ ] Record rollback commit/ref to current `main`.
- [ ] Do not open or merge a PR until the user explicitly approves the cumulative branch after inspection.
