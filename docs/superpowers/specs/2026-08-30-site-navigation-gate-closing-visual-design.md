# Earlywine Site Navigation + Gate Closing Visual Design

Date: 2026-08-30
Status: USER-DIRECTION CAPTURED / DESIGN FREEZE CANDIDATE
Branch: `gate-closing-nav-visuals-spec`

## Purpose

Make the current site understandable to navigate while the temporary presidential/home front door is still evolving. The user must be able to see what pages exist, what state each page is in, enter every real page directly, and understand where Gate Closing sits in the larger site without hunting through repository folders or staged URLs.

The Gate Closing sub-tab should be visually heavy, interactive, and additive. Existing evidence, economics, adjudication, counter-evidence, and source-integrity material remains. New imagery and the hard-dated AI Pincer record are added around it rather than replacing it.

## Non-Negotiable Build Rules

- ADDITIVE ONLY: preserve existing Gate Closing content, controls, charts, evidence states, scenarios, and lineage.
- No generated replacement artwork. Use the user-supplied images already provided in the conversation.
- Navigation must expose the whole site, not a shortened subset.
- Pages that are not ready may remain visibly marked STAGED / REVIEW / EXPERIMENTAL / OPEN / QUEUED, but real routes must be clickable.
- No fake links.
- The current presidential page is a temporary home/front door and is not treated as the final information architecture.
- Imagery is a first-class part of the interface, not decoration to be removed for cleanliness.
- Interactivity should help orientation: drawers, status labels, local section jumps, tabs, filters, and existing Gate Closing tools remain usable.

## Global Navigation Contract

Create one shared full-site navigation manifest sourced from the existing route registry or a successor registry. The hamburger/drawer must show all known surfaces, including at minimum:

- Candidate / temporary Home
- Blueprint
- Explorers
- White Papers
- Gate Closing / Research
- Labs / Physics where routed
- Receipts / Source Integrity
- Rights After Conviction / Voting Rights
- Presidential Address
- Tracks / media surfaces when present
- Data / Gates when present
- Participate

Each item shows its state badge (LIVE, STAGED, REVIEW, EXPERIMENTAL, OPEN, SOURCE PACK PENDING, QUEUED, or equivalent). Real pages are direct links. Unbuilt pages remain visible with honest status rather than disappearing.

The hamburger must be available from the temporary home and deep pages. It is designed to survive later migration to the final landing page.

## Gate Closing Sub-Tab

The existing `gate-closing-build/gate-closing-preview.html` remains the base. Preserve all current sections and functionality:

- Adjudication
- Economic Lab
- Evidence Ledger
- Counter-Evidence
- Source Integrity
- Charts
- Scenario controls
- Filters
- Evidence-state distinctions
- Existing ASH / HOLDS / NARROWED findings

Add a local sticky section navigator for rapid movement within Gate Closing. Minimum jump targets:

- Top
- Adjudication
- AI Pincer / Hard-Dated Prediction
- Economics
- Evidence Ledger
- Counter-Evidence
- Source Integrity
- Closing visual

## Image Hierarchy

Use the user-supplied images exactly as assets.

1. `65487.jpg` — upper hero-scale image.
2. `64899.jpg` — primary Gate Closing identity image / main thematic hero inside the page.
3. `65486.jpg` — lower hero-scale closing image.
4. The last accidental mockup image generated in-chat may be used only because the user explicitly said to include that last one; place it as a wide middle breaker between dense evidence sections. It does not replace any of the three user-supplied images.

The three user-supplied images should also appear as smaller picture-tile panels within the Gate Closing flow to reinforce the visual thesis. Stagger them with text so the page alternates visual weight and avoids one continuous wall of panels. Suggested alignment rhythm:

- first supporting image tile: right-weighted
- second supporting image tile: centered
- third supporting image tile: left-weighted

Do not remove existing content to make room; extend the page.

## Hard-Dated AI Pincer Section

Add a highly emphasized section for `GATE_CLOSING_PINCER_PREDICTION_HARD_DATE_2026-08-13_WITH_ART.docx` or the current approved hard-dated DOCX artifact.

Show visibly:

- Original freeze date: August 13, 2026
- Audit/update date: August 30, 2026
- Short explanation that the document preserves the prediction record and falsification framework
- Open/download control
- Clear distinction between pre-freeze evidence and forward predictions

This section is part of the Gate Closing sub-tab and should be visually prominent enough to break up the evidence flow.

## Interaction and Orientation

The page should tell the user where they are and what exists.

- Global hamburger = whole-site navigation.
- Route state badges = build/status orientation.
- Gate Closing sticky/local nav = within-page orientation.
- Existing Gate Closing tab controls remain functional.
- Visual tiles should be clickable for lightbox/enlarge or section focus if practical without adding a framework.
- On mobile, hamburger and local Gate Closing navigation must remain usable without horizontal page overflow.

## Existing Contracts Superseded by Current User Direction

The prior Home freeze said no more than one hero per tab. Current user direction explicitly supersedes that for Gate Closing. Gate Closing may use upper and lower hero-scale imagery plus the main identity image and middle breaker.

The Home tab is not considered final, so navigation work should prioritize a durable site manifest over preserving the current Home-only presentation contract.

## Files Expected to Change During Implementation

Likely existing files:

- `assets/js/data-registry.js` — expand/normalize full route manifest.
- `assets/js/site-shell.js` — render shared hamburger/full drawer if this remains the shared shell entrypoint.
- `assets/css/site.css` — global drawer/status styling as needed.
- `index.html` — ensure temporary front door exposes full hamburger.
- `home-build/home-preview.html` — expose shared/full navigation if preview remains active.
- `gate-closing-build/gate-closing-preview.html` — additive visual and hard-dated Pincer sections; local section navigation.
- `gate-closing-build/GATE_CLOSING_TAB_STATUS.md` — update receipt and explicitly record additive imagery exception.

New asset paths should live under a Gate Closing-specific asset directory rather than scattering image files across unrelated folders.

## Acceptance Criteria

A build passes when:

1. From the temporary home, one hamburger reveals every known site surface with status.
2. From Gate Closing, the same whole-site navigation is available.
3. Gate Closing is directly reachable from navigation.
4. Existing Gate Closing interactive sections still work.
5. `65487.jpg`, `64899.jpg`, and `65486.jpg` are all visibly used in the requested hierarchy.
6. The approved last mockup appears only as a middle breaker and does not replace user artwork.
7. The hard-dated AI Pincer DOCX is prominently linked with August 13, 2026 freeze metadata.
8. Existing evidence/counter-evidence/economics content has not been deleted or flattened.
9. Desktop and mobile navigation are both usable.
10. No duplicate IDs, broken local anchors, dead real-route links, or JavaScript syntax errors are introduced.

## Design Principle

The immediate problem is orientation, not final polish. The user should be able to open the site, see the imagery, navigate every real surface, understand status at a glance, and know where the hell they are. Final landing-page detachment can happen later without throwing away this navigation contract.
