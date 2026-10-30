# Gate Closing — 90-Day A/R·A/P Hunt (2026-08-01 → 2026-10-30)

**Receipt type:** research report + ledger batch receipt
**Seat:** Claude (research seat, session 2026-10-30)
**Ledger batch:** EVT-0039 … EVT-0056, appended to `ticker-build/gate-closing-journal.js` / `.json` by `ticker-build/tools/append-hunt-2026-10-30.js`
**Chain after append:** 56 events, head `2edd3945b7976c09f02ef92dc84c6d95a703bcb5aa0b0fa16d054ee33c65176b`, INTACT
**Audit status of every new event:** PROPOSED. Weight 0 on the tape until Rob adjudicates. No lane state changed. No transition events added.
**RULE-11:** this document does not self-certify. It is model research output for human adjudication.

**Corpus:** `LOKIVELLI_GATE_CLOSING_FULL_RECOVERY_2026-10-30.zip` (87 files, 3 zero-byte lyric files). "A/R · A/P" here is the ledger's AR-AP-v2 semantics, not invoices. The public site was not used as a source.

---

## Bottom line

The hunt **corroborates every music- and publishing-side restriction the ledger expected** and adds three new ones:
- Spotify's AI Persona badges are live.
- Suno's download meters took effect 2026-09-03.
- KDP (2 titles per format per week from 2026-09-21) and arXiv (2 submissions per month from 2026-10-01) both cut volume hard.

**The thesis still doesn't win outright:**
- The arXiv and KDP cuts are explained at least as well by the CLM-NULL-VOLUME null.
- None of the three A/R→A/P openings has been withdrawn.
- The majors' 2026-08-25 equity in Stability AI is *minority*, so it does not meet PRED-001-R1's "controlling" bar.

The pattern holds as **convergence**; nothing found points to coordination. The adjacent categories (SEO, pay-per-crawl, agentic payments, PaaS) were **not hunted**. That is an explicit gap.

## Per-signal results

| Signal | Result | Key facts (as sourced) | Confidence |
|---|---|---|---|
| Spotify M-5 (AI Persona) | **Corroborated** | Newsroom 2026-10-20: "Thousands of AI Personas are now labeled… excluded from editorial or algorithmic recommendations by default, unless a listener follows an AI Persona." TBIJ 2026-10-15: badges "rolling out over the last few weeks". Listener reporting is ANNOUNCED-NOT-YET-EFFECTIVE. | High |
| Spotify EVT-0020 correction | **Contradicted** | "Likely AI Persona" is secondary-sourced (DMN, RouteNote, Electronic Groove, iMusician). Primary badge text not captured. | Medium |
| Suno EVT-0017/0018 | **Corroborated** | Effective 2026-09-03 and retroactive. Free ≤7 lifetime, Pro 20/mo, Premier 60/mo, Studio exports uncapped. Unchanged through v6. | High on terms (secondary quotes) |
| Udio M-3/EVT-0005 | **Corroborated (still closed)** | Downloads of audio, video and stems disabled; rechecked 2026-09-25. UMG platform not launched. 10-05 → 10-30 unconfirmed. | Medium-high |
| Stability M-4/EVT-0010 | **Opening persists** | Weights on Hugging Face; no withdrawal ~5.3 months. Community License is revocable and ends above $1M revenue. Release date is 2026-05-20, not 05-26. | Medium |
| Stability / PRED-001-R1 | **Not triggered** | $76M Series B (2026-08-25). UMG, Sony and WMG hold minority equity; catalogs licensed for training. | High on facts |
| KDP P-2 / PRED-003 | **New restriction; PRED-003 no footprint** | 10 → 2 titles per format per week from 2026-09-21. Submissions also capped from 2026-10-05. AI disclosure not shown to shoppers. | High |
| ACX P-3/EVT-0014 | **Opening persists, narrow** | Human narration required "unless otherwise authorized". Voice Replica beta and Virtual Voice still running. New pooled royalty model; legacy model ends 2026-12-31. | Medium |
| IngramSpark EVT-0036 | **Contradicted on date** | Setup fee removed 2023 → 1% → 1.5% (2025-04-01) → 1.875% (2026-02-01). 2026-08-24 is the User Guide v3.3 document date. | Medium |
| arXiv S-1 | **New restriction** | 2 new submissions per month plus a cap of 3 active, from 2026-10-01. 40,363 submissions in September 2026. | High |
| Zenodo S-2 | **No footprint** | FAQ (2026-04-27) rule continuing. No new change in the window. | High |
| EU AI Act C-1 | **Corroborated with nuance** | Digital Omnibus (Reg. (EU) 2026/1744) in force 2026-07-27. Art. 50(2) marking for legacy systems moves to 2026-12-02. FPF disagrees on scope. | High |
| Anthropic C-2 | **Filing corroborated; docket gap** | Sony MP + Warner Chappell filed 2026-08-28. New suit: Elvis rights holders, 2026-10-23 (274 works, ~$41.1M, §1202). No rulings found. | High on filings |
| Deezer (new) | **New** | Search-level AI toggle, 2026-10-13. Global by end-2026 is ANNOUNCED-NOT-YET-EFFECTIVE. | Medium |
| Diamond OA EVT-0015 | **Not hunted** | — | — |

## CLM-NULL-VOLUME scorecard

The null **explains intake-side quotas** and **fails on export, ownership and monetization gates**.

| Explained by the null | Not explained by the null |
|---|---|
| arXiv, KDP, Deezer, Spotify M-1, most of Zenodo; partially Spotify M-5 (identity, not rate) | Suno/Udio export (licensing-settlement driven), Stability equity, ACX pooling, EU Art. 50 (statutory) |

**[Inference]** Narrow the thesis to export, ownership and monetization lanes, where the null has no purchase.

## Predictions

- **PRED-001 / R1:** not triggered. "Exclusive-license dependency" needs a measurable definition before Rob rules on the Stability facts.
- **PRED-002:** strongest new candidate is KDP. The limit went 3/day → 10 per format per week (2025-11-01) → 2 per format per week (2026-09-21). With no window and loose wording, PRED-002 confirms cheaply. Add a window and a falsifier.
- **PRED-003:** no footprint. The KDP gate moved on volume, not discoverability. **[Inference]** Discoverability gating is arriving at streaming services first.

## Contradictions (ledger vs external)

1. **Udio window:** downloads were disabled 2025-10-29/30, and the window ran 2025-11-03 → 11-05. The ledger has 11-01 / 11-03. → EVT-0055
2. **Stable Audio 3.0 release date:** 2026-05-20. The ledger's 05-26 is the MarkTechPost article date. → EVT-0056
3. **IngramSpark EVT-0036:** the date belongs to a document, not an event. → EVT-0052
4. **EVT-0020:** overstates the claim; the wording is secondary-sourced, not unsourced. → EVT-0040
5. **C-1:** Art. 50(2) is deferred to 2026-12-02 for legacy systems. → EVT-0049
6. **Thesis-level:** the arXiv and KDP cuts should not count as independent support beyond the null.

## Recommendations (for Rob's ruling)

- **Study:**
  - Rule on the date corrections first (EVT-0052, -0055, -0056); they change durability clocks.
  - Define the "exclusive-license dependency" prong of PRED-001-R1.
  - Add a window and a falsifier to PRED-002.
- **Build:**
  - Add a "null-explained" flag column.
  - Split mechanisms into intake / identity / export / ownership / monetization.
  - Schedule checks for:
    - 2026-11-20: Stability weights at 6 months
    - 2026-12-02: Art. 50(2) legacy marking
    - 2026-12-31: ACX legacy royalty model ends
- **Ship:**
  - Highest-confidence proposals: EVT-0039, -0041, -0045.
  - Corrections: EVT-0040, -0052.
  - A/P book: "EMPTY, 3 live candidates, none withdrawn". Do not mark them failed.
  - Run a dedicated hunt on the 2026-09-03 addendum categories before extending convergence claims beyond media and publishing.

## Coverage gaps (stopping rationale)

**Not hunted:**
- Diamond OA and scholarly APCs.
- The 2026-09-03 addendum categories: SEO/generative search, pay-per-crawl and bot permissions, agent identity, agentic payments, SaaS/agentic pricing, PaaS, search-data licensing, X API meters.
- YouTube, TuneCore, CD Baby, D2D, Apple Books, Google Play Books.
- Anthropic docket entries.

**Primary captures still needed:**
- Suno help page
- Udio Help Centre
- Hugging Face Stable Audio 3 model pages
- KDP Community notice
- arXiv rate-limit blog post
- Live Spotify badge screenshot
- CourtListener dockets

**Drift log:** results drifted toward AI music (vendor blogs dominate) and were forced back into the publishing, scholarly, regulatory and litigation lanes. Non-music adjacent categories remain under-covered; this is the single largest bias.

## Sources

Every source the ledger batch uses is recorded with its URL, type, retrieval date and captured quote in the journal (`sources[]`, ids `SRC-*` added 2026-10-30). Source types are weighted by the engine (`primary-*` 3, `secondary-press` 2, `secondary-blog` 1). Vendor and competitor blogs are typed `secondary-blog` and flagged in their notes.
