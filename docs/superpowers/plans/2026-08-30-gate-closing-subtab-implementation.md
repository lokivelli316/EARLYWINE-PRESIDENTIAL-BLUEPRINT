# Gate Closing Sub-tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Gate Closing sub-tab as an additive illustrated evidence dossier with a global hamburger, local jump navigation, existing economic/evidence interactions, frozen prediction record, receipts ledger, and failure/resurrection protocol.

**Architecture:** Extend `gate-closing-build/gate-closing-preview.html` in place on the isolated Gate Closing feature branch. Preserve the existing evidence/economic/adjudication/counter-evidence/source-integrity mechanisms while adding a site-wide drawer navigation and a narrative visual spine. Treat August 13 prediction text as immutable historical material; August 30 protocol text is a separately dated prospective addendum.

**Tech Stack:** Static HTML5, CSS, vanilla JavaScript, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-30-site-navigation-gate-closing-visual-design.md`

## Global Constraints

- ADDITIVE ONLY: do not delete the existing Gate Closing evidence/economics/adjudication/counter-evidence/source-integrity functions.
- Whole-site hamburger exposes real pages and honest status labels; queued/unrouted pages are visible without fake links.
- Gate Closing remains a sub-tab/deep page, not the final home page.
- Three supplied Gate Closing images are first-class section visuals; missing media falls back visibly rather than breaking layout.
- Local jump navigation covers Top, Adjudication, AI Pincer, Economics, Evidence Ledger, Counter-Evidence, Receipts, Source Integrity, and Closing.
- Prediction scoring preserves contradictions, ashes, revisions, descendants, and resurrections; no post-hoc rewriting.
- Mobile target: no page-level horizontal overflow at 320 CSS px; controls remain tappable.

---

### Task 1: Global navigation drawer

**Files:**
- Modify: `gate-closing-build/gate-closing-preview.html`

**Interfaces:**
- Produces: `#menuToggle`, `#siteDrawer`, `#drawerBackdrop`, `setDrawer(open)`.

- [ ] Add accessible hamburger button and drawer markup with LIVE/STAGED/REVIEW/EXPERIMENTAL/OPEN/QUEUED badges.
- [ ] Wire Escape, backdrop click, close button, and link click behavior.
- [ ] Verify drawer works by click/tap and does not depend on hover.

### Task 2: Illustrated narrative spine

**Files:**
- Modify: `gate-closing-build/gate-closing-preview.html`

**Interfaces:**
- Consumes: relative image targets `media/65487.jpg`, `media/64899.jpg`, `media/65486.jpg`.
- Produces: `.visual-break`, `.image-tile`, and resilient `onerror` fallback behavior.

- [ ] Add upper prediction visual, central Gate Closing identity visual, lower evidence visual, and staggered smaller image tiles.
- [ ] Add responsive figure/caption treatment with meaningful alt text.
- [ ] Verify missing target images fall back to the existing public media asset without broken-image chrome.

### Task 3: Local section navigator + prediction dossier

**Files:**
- Modify: `gate-closing-build/gate-closing-preview.html`

**Interfaces:**
- Produces: sticky `.local-nav`; sections `#prediction`, `#receipts`, `#closing`.

- [ ] Add sticky jump links for the full report flow.
- [ ] Add August 13 frozen prediction panel with explicit prediction-not-fact status.
- [ ] Add August 30 prospective protocol panel with failure condition, resurrection condition, two-receipt rule, and cadence clarification.
- [ ] Keep original and revised/descendant claims visually distinct.

### Task 4: Receipts / Accounts Receivable ledger

**Files:**
- Modify: `gate-closing-build/gate-closing-preview.html`

**Interfaces:**
- Produces: receipt cards/states `RECEIPT POSTED`, `ACCOUNTS RECEIVABLE`, `ASH`, `RESURRECTED`, `MIXED`.

- [ ] Add existing Gate Closing claim statuses including cadence revision and universal-technical-closure descendant treatment.
- [ ] Add Sony/Warner v. Anthropic as a post-freeze receipt classified as consistent/supportive, not proof.
- [ ] Add pressure-release state machine: Receipt A → Accounts Receivable → Receipt B / Resurrection.
- [ ] Preserve contradiction receipts instead of overwriting them.

### Task 5: Preserve and integrate existing interactive audit views

**Files:**
- Modify: `gate-closing-build/gate-closing-preview.html`

**Interfaces:**
- Preserves: adjudication state cards, state chart, economic scenarios, evidence filters/table, counter-evidence, source-integrity details.

- [ ] Keep existing tab switching and scenario controls functional.
- [ ] Keep evidence ledger filters functional.
- [ ] Update cadence wording from fixed six-month periodicity to failed interval estimate + surviving recurrence claim.
- [ ] Keep universal technical closure as failed parent while exposing narrower hosted/governed-lane descendant.

### Task 6: Static verification and branch delivery

**Files:**
- Verify: `gate-closing-build/gate-closing-preview.html`

**Interfaces:**
- Produces: deployable feature-branch page.

- [ ] Verify no duplicate IDs and all internal jump targets exist.
- [ ] Verify every routed hamburger link resolves to an existing repository surface or is rendered as disabled/status-only.
- [ ] Verify JavaScript selectors reference existing nodes.
- [ ] Commit on `gate-closing-nav-visuals-spec` and inspect the resulting diff before merging/publishing.
