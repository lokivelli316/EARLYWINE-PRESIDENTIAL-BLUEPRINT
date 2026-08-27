# Presidential Site RC3 Integration Design

**Date:** 2026-08-27
**Branch:** `site-architecture-rc3-integration`
**Status:** Design approved in chat; implementation not yet started

## 1. Goal

Promote the Earlywine Presidential Blueprint site from a minimal landing shell plus disconnected staged pages into a coherent public system without flattening, sanitizing, or deleting the existing work.

The upgrade must improve the whole site, not only the most recent unmerged prototype.

## 2. Core Design Principle

**Promote architecture additively, subsystem by subsystem.**

Do not replace the live site wholesale with an incomplete RC3 bundle. Do not leave the richer RC3 material stranded as disconnected previews. Build a cumulative integration branch that retains working public content, restores missing first-class surfaces, exposes staged/open states honestly, and provides a durable route from the landing page into deeper evidence, research, interactive tools, and public-rights material.

## 3. Non-Negotiable Preservation Rules

1. Preserve lineage. Existing working files, frozen tab builds, receipts, and older implementations are not silently deleted or overwritten.
2. No Mr. Clean pass. Serious does not mean sterile, generic, or committee-approved. Visual personality is a requirement.
3. One major hero image per tab maximum unless explicitly approved otherwise.
4. Interactive systems may serve as the visual spine where stronger than decorative art.
5. No fake completion. Use explicit states such as `LIVE`, `STAGED`, `OPEN`, `SOURCE PACK PENDING`, and `REVIEW`.
6. No unsupported legal, scientific, or economic claims promoted by layout alone.
7. Mobile-first behavior is required. The Samsung S24 Ultra class viewport is a primary target.
8. Main/default branch remains untouched until the cumulative branch is inspected and explicitly approved for promotion.

## 4. Public Information Architecture

The integrated public navigation should expose these first-class surfaces:

- Candidate / Home
- Blueprint
- Explore
- White Papers
- Research
- Labs
- Source Integrity / Receipts
- Voting Rights / Rights After Conviction
- Presidential Address
- Participate

Supporting deep routes may include:

- Gate Closing
- AEGIS Explorer
- Citizen Road Builder
- Pillar Explorer
- Weld Explorer
- White Paper Explorer
- Data / Gates
- Interactive Labs
- High-Risk Systems / BSL proposal material
- Viromimetics source-integrity material
- Publications / DOI / Zenodo links
- Media links

## 5. Home / Candidate Front Door

The root `index.html` becomes the real public front door rather than a minimal shell.

### Home requirements

- Preserve the approved Presidential candidate visual identity and Full Spectrum / Dual-Partisan framing.
- Present the candidate identity, Blueprint thesis, Weld method, major research surfaces, public media, and source-integrity ethos without forcing the visitor through a wall of text.
- Surface all major destinations from the landing page.
- Use clear status badges for incomplete or staged routes.
- Keep the home readable; depth belongs behind it.
- Preserve the line between campaign framing and evidence/legal/reference material.

## 6. Blueprint System

The ten pillars remain intact and become interactive rather than a static card wall.

### Blueprint behavior

- Each pillar is selectable.
- Selection reveals mechanism, objective, dependencies, implementation state, related papers, and related explorer/lab routes.
- Deep links must be deterministic and shareable.
- The public Blueprint is a derivative of the internal master, not a replacement for it.
- Existing frozen Blueprint work should be reused instead of rewritten from scratch.

## 7. Explore Hub

The Explore surface federates the existing interactive systems rather than fusing them into one giant component.

First-class explorer tabs:

- AEGIS Explorer
- Citizen Road Builder
- Pillar Explorer
- Weld Explorer
- White Papers

Each explorer keeps its own state and purpose. Shared navigation and visual language may be unified, but functionality and provenance remain separate.

## 8. Research Hub

Research is distinct from Blueprint advocacy.

### Research requirements

- Gate Closing remains an independent evidence/economics instrument.
- Research entries must expose claim state, source state, and whether the material is a proposal, audit, report, preprint, open question, or public-facing synthesis.
- Research cards route to full reports, datasets, interactive tools, DOI/Zenodo resources, or source-integrity records.
- Counter-evidence and failed claims must remain visible.

## 9. Gate Closing

Gate Closing retains its aggressive visual identity and its adversarial evidence rules.

### Required behavior

- Exact approved Gate Closing hero art restored and retained.
- Interactive adjudication views.
- Economic scenario tools.
- Evidence ledger filters.
- Counter-evidence surface.
- Source-integrity/open-claim surface.
- No universal Gate Closing score.
- No fake six-month cadence.
- No universal technical-closure claim.
- Economic scenarios must separate verified inputs, assumptions, estimates, and open values.

## 10. Source Integrity / Receipts

This is a first-class public system, not a bibliography.

### Required components

- Provenance pipeline: RAW → EXTRACT → DERIVE → SYNTHESIZE → ATTACK → ADJUDICATE → RECEIPT.
- Source hierarchy.
- Filterable receipt ledger.
- Receipt inspector showing what a receipt proves and does not prove.
- Correction/supersession lineage.
- Publication gates.
- Hashes treated as file-integrity receipts, not truth certificates.
- Missing evidence stays missing.

## 11. Voting Rights / Rights After Conviction

The felony-rights surface is a rights-information system, not a how-to-vote tutorial.

### Structure

- Hero: approved felony/candidate campaign visual.
- Federal baseline rights section.
- State overlay navigator covering all 50 states plus D.C.
- Searchable and accessible alphabetical alternative to the map.
- Rights categories may include voting-rights restoration, jury service, public office, occupational licensing, access to courts, speech/petition/association, due process/equal protection, religious exercise, employment/background-check implications, education/federal-aid rules where applicable, federal firearm disabilities, and record-relief/collateral-consequence references.

### Every legal-rights entry must expose

- Plain-English right/restriction summary.
- Status: `RETAINED`, `LIMITED`, `STATE-DEPENDENT`, `RESTORABLE`, or `VERIFY / OPEN`.
- Controlling authority or authoritative official source.
- Direct hyperlink.
- `AS OF` date.
- `LAST CHECKED` date.
- Material limitation or exception.

### Top-page legal framing

The site must tell readers that federal constitutional/statutory law supplies part of the framework, states control many practical restoration rules, and the linked official authority should be checked for the current law.

### Footer

Use the approved vertical campaign image carrying the joke:

> Know your rights. Check the law. Verify your state. Then vote for your convicted candidate Lokivelli at a booth near you.

The campaign footer is visually and semantically separated from the legal-reference material.

## 12. Presidential Address

The Address remains first-class.

### Required behavior

- On-demand or segmented media loading; do not preload the entire long local video.
- Preserve the five address tracks.
- Preserve the Weld / Dual-Partisan political method.
- Keep high-risk systems material clearly separated and labeled as proposed architecture.
- Viromimetics stays attached to highest-risk containment thinking with source-integrity warnings preserved.

## 13. Labs and Data / Gates

Labs expose interactive, experimental, or simulation surfaces without pretending those experiments are settled policy or evidence.

### Lab state model

Every lab must expose one of:

- LIVE
- STAGED
- EXPERIMENTAL
- SOURCE PACK PENDING
- OPEN

No dead links disguised as completed features.

## 14. Shared Runtime / UI Architecture

Use a small shared site runtime instead of duplicating navigation/status logic in every page.

Recommended shared files:

- `assets/css/site.css` — shared visual primitives and responsive layout.
- `assets/js/site-shell.js` — navigation, route state, status badges, small shared interactions.
- `assets/js/data-registry.js` — optional public-safe registry of page metadata/status only.
- Per-subsystem scripts remain local when behavior is specialized.

Do not collapse every existing self-contained page into one monolithic JavaScript bundle.

## 15. Navigation and Deep Linking

- Every first-class page has a consistent public navigation shell.
- Deep states use stable URL fragments or query parameters.
- Back/forward browser behavior must work.
- Mobile navigation uses an intentional drawer or compact instrument-panel pattern, not overflowing horizontal links.
- Internal links must not point to nonexistent routes without a visible staged/open state.

## 16. Visual System

The site should feel like one ecosystem without flattening each subsystem into the same skin.

Shared qualities:

- dark Forge/civic base
- red/blue/full-spectrum energy
- high contrast
- serious research instrumentation
- strong typography
- visible evidence/status language
- cinematic heroes where approved

Subsystems retain their own personality:

- Gate Closing: accusatory / forensic
- Source Integrity: provenance / audit instrument
- Voting Rights: civic/legal rights reference with campaign spine
- Address: speech / doctrine
- Explorers: interactive systems lab
- Blueprint: architecture map

## 17. Performance

- Prefer lazy-loaded media.
- Do not preload large video masters.
- Hero assets should be optimized for web while preserving originals in lineage.
- Avoid unnecessary frameworks and runtime dependencies.
- Primary interactions should remain usable if optional artwork fails to load.

## 18. Accessibility

- Keyboard-operable controls.
- Visible focus states.
- Accessible labels for interactive maps and visual controls.
- State map must have a non-map equivalent.
- Color may reinforce status but cannot be the only status signal.
- Text must remain selectable and readable; do not encode important legal/evidence content only inside images.

## 19. Testing / Acceptance Gates

Before the cumulative branch can be proposed for promotion:

1. No duplicate IDs or broken internal anchors in first-class pages.
2. Inline/external JavaScript passes syntax checks.
3. Navigation works from every first-class page.
4. No first-class nav item silently 404s.
5. Mobile layout manually checked at narrow Android-class widths.
6. Hero/media assets resolve in the deployed path structure.
7. Address media remains lazy/on-demand.
8. Gate Closing calculations identify verified vs assumption/estimate/open inputs.
9. Voting Rights legal entries include source URL + as-of/last-checked state before being labeled complete.
10. Source Integrity distinguishes file integrity from factual verification.
11. Known open/staged areas remain visibly labeled.
12. A rollback path to the current main build exists.

## 20. Integration Strategy

Implementation will proceed in reviewable slices on `site-architecture-rc3-integration`:

1. Shared shell + route/status registry.
2. Root landing page upgrade.
3. Blueprint + Explore integration.
4. Research + Gate Closing integration.
5. Source Integrity integration.
6. Voting Rights / Rights After Conviction integration.
7. Presidential Address/media integration.
8. Labs/Data-Gates entrances and staged-state handling.
9. Cross-page mobile/accessibility/performance QA.
10. Final cumulative preview and promotion decision.

No merge to `main` occurs without explicit human approval after the cumulative preview is reviewed.

## 21. Success Condition

The site should feel materially better because the information architecture, interactivity, visual system, provenance model, and cross-page navigation all improve together. It should not merely look newer.

The final public experience must preserve the project's deliberate contradictions, aggressive visual identity, research depth, jokes, corrections, failed branches, and auditability while making the whole ecosystem navigable by somebody who has never seen the private project history.
