# Three-Page Canonical V2 Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build non-destructive V2 acceptance previews for the Presidential front door, Gate Closing report, and Know Your Rights surface without replacing any existing live route before explicit user acceptance.

**Architecture:** Shared navigation, responsive safeguards, accessibility helpers, DPR-aware canvas primitives, IntersectionObserver visibility handling, and reduced-motion behavior may be reused. Hero composition, image placement, typography hierarchy, page pacing, and animation behavior remain page-specific. V2 candidates are preserved separately from current live files.

**Tech Stack:** Static HTML5, CSS, vanilla JavaScript, CanvasRenderingContext2D, Pointer Events, ResizeObserver, IntersectionObserver, requestAnimationFrame.

**Spec:** Canonical three-page contract approved in conversation on 2026-08-30.

## Global Constraints

- Do not overwrite or delete old/live pages before explicit acceptance.
- Literal build rule: If copy conflicts with artwork, move the copy — never sacrifice the artwork to rescue the typography.
- Presidential celebrates: image-first upper hero, interactive + sparse ambient fireworks, candidate identity, route/status rail, Full Spectrum doctrine, Weld section, lower chapter plate.
- Gate Closing interrogates: Image 4 hero, restrained interactive hero fireworks, bounded thesis, claim survival, Image 2 break, frozen prediction, economic material, staggered audit visuals, Image 3 break, receipts, vulnerable claims, closing rule.
- Know Your Rights informs: protected upper image, title/warning below image, six-step verification flow, official-source routing, authority hierarchy, lower cinematic visual with passive automatic fireworks only.
- Preserve Gate Closing evidence states; do not strengthen OPEN/MIXED/ASH/PREDICTION labels.
- Preserve voting-rights verification warning and nonpartisan information role.
- Every page gets one shared hamburger; page-specific characters/art do not inherit.
- Test responsive behavior at 320, 360, 390, 430, 768, 1024, and 1440+ widths before promotion.

---

### Task 1: Shared preview runtime

**Files:**
- Create: `v2-preview/shared/nav.js`
- Create: `v2-preview/shared/fireworks.js`
- Create: `v2-preview/shared/base.css`

**Interfaces:**
- Produces one hamburger navigation shell, DPR-aware canvas sizing, visibility throttling, reduced-motion handling, shell travel, burst generators, and dead-particle cleanup.

- [ ] Build shared navigation/runtime utilities without changing existing site-shell files.
- [ ] Verify exactly one hamburger is created per V2 page.
- [ ] Verify Canvas remains transparent and hero-relative.
- [ ] Verify offscreen animation work pauses or reduces via IntersectionObserver.

### Task 2: Presidential V2 candidate

**Files:**
- Create: `v2-preview/presidential/index.html`
- Create: `v2-preview/presidential/assets/*`

**Interfaces:**
- Consumes shared runtime.
- Produces the acceptance candidate for the Presidential route.

- [ ] Place assigned upper Presidential artwork as an image-first hero; move mobile copy below the image.
- [ ] Add interactive + sparse ambient fireworks to the hero only.
- [ ] Place assigned candidate square in the identity block.
- [ ] Preserve candidate/architect identity, route rail, Full Spectrum, front-door, Weld, and assigned lower visual chapter plate.
- [ ] Confirm no live Presidential file is modified.

### Task 3: Gate Closing V2 candidate

**Files:**
- Create: `v2-preview/gate-closing/index.html`
- Create: `v2-preview/gate-closing/assets/*`

**Interfaces:**
- Consumes shared runtime.
- Produces the acceptance candidate for the Gate Closing route.

- [ ] Use the clean fraud/loophole artwork as the dominant hero with no giant HTML headline over it.
- [ ] Add restrained interactive + sparse ambient fireworks to the hero only.
- [ ] Put the bounded audit directly below the hero.
- [ ] Preserve claim-survival states, prediction/receipt separation, failure/resurrection logic, counterevidence, and vulnerable claims.
- [ ] Place the hard-dated prediction image and long-form report artwork as separate chapter breaks rather than a gallery.
- [ ] Confirm no live Gate Closing file is modified.

### Task 4: Know Your Rights V2 candidate

**Files:**
- Create: `v2-preview/know-your-rights/index.html`
- Create: `v2-preview/know-your-rights/assets/*`

**Interfaces:**
- Consumes shared runtime.
- Produces the acceptance candidate for the voting-rights route.

- [ ] Put assigned upper artwork in a standalone protected visual section.
- [ ] Put title and eligibility warning below the upper image.
- [ ] Preserve the six-step verification flow and official-source routing.
- [ ] Put assigned lower image in a separate cinematic visual with passive automatic fireworks and `pointer-events:none`.
- [ ] Confirm no live voting-rights file is modified.

### Task 5: Acceptance gate

**Files:**
- Create: `v2-preview/index.html`

**Interfaces:**
- Produces side-by-side access to old/live and V2 candidates.

- [ ] Expose all three V2 previews from one selector without replacing current routes.
- [ ] Run responsive and interaction checks.
- [ ] Present V2 to user for explicit accept/reject.
- [ ] Only after acceptance, prepare a separate promotion change that replaces the accepted old route and retains rollback history.
