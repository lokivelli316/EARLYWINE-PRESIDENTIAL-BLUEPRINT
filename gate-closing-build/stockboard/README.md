# GATE CLOSING — STOCKBOARD TICKER + DUAL LEDGER (federated build)

**Status: FEDERATED · TESTED · NOT PROMOTED.** Nothing in the repository was modified. Nothing in the wire-up pack was modified. This build sits *beside* the existing board so it can be evaluated, then promoted — or discarded — on evidence.

`FEDERATE → TEST → MEND → PROMOTE`, not `FUSE → CLEAN → REWRITE`.

## Files

| File | Role |
|---|---|
| `gate-closing-engine.js` | **Derivation + validation layer.** No DOM. Runs in the browser and in Node. Everything the spec calls a rule lives here as a refusal, not as a convention. |
| `tools/journal-source.js` | **The thing you edit.** Entities, mechanisms, sources, claims, predictions, events, and the legacy records preserved verbatim. Hand-authored, readable, commented. |
| `tools/seal-journal.js` | Replays `journal-source.js` through the engine's own validators one event at a time, then writes the sealed file. **If the seed violates its own rules, sealing fails.** |
| `gate-closing-journal.js` | **Generated. Never edit by hand.** The sealed journal with `seq`, `prev_hash`, `content_hash` on every event and content hashes on every frozen prediction. |
| `gate-closing-stockboard.html` | The board shell. Consumes state; it is not the evidence store. |
| `tests/adversarial.test.js` | 50 tests that try to make the ledger lie. |
| `tests/headless.spec.js` | 20 browser checks including the full §34 acceptance flow. |
| `tools/seal-report.txt` | What sealing validated, event by event, with warnings. |

**Daily workflow:** append to `tools/journal-source.js` → `node tools/seal-journal.js` → `node tests/adversarial.test.js` → commit both files. The board picks it up with no code change.

## What was preserved

The G2b prototype's board grammar is inherited, not replaced: the same tokens, cmdbar, marquee tape, preset filters, EDIT/drag reorder, collapse/maximize, `localStorage` layout, `/` search, ESC-closes-inspector, `RESET`, responsive breakpoints, reduced-motion handling, and the Indiana clock. The Daily Board's shell/data separation is inherited too — it was the right idea and it is now the architecture. The 12 legacy `daily-board-v1` records are carried **verbatim** in a dedicated widget, unmigrated, each mapped to its new event by `legacy_ref`; `LOAD DAILY-BOARD JSON` still previews an old-schema file.

Two things were fixed rather than kept: the survival percentages and status-strip counts, which were hardcoded literals with no derivation (§31), and the four `main` receipts that the 2026-09-04 data file had dropped — restored as events with `legacy_ref` back to `main`.

## The state machine

`WATCH → AR → AP → POSTED → ASH → REOPEN`, oscillating freely. **State is never set. It is derived** from settled transition events, so a state cannot change without history — there is no setter to call.

- **AR** — something opened; durability unproven. A release by itself lands here and stays.
- **AP** — a durable opening was adjudicated. **Every entry in A/P is a lane that did not close.** The board says so on the panel. An empty A/P book raises a standing warning, because the likeliest explanation is under-recording openings, not a closing world.
- **POSTED** — adjudicated evidence on the ledger; supporting *or* counter.
- **ASH** — refused unless all five scope fields are declared *and* `known_workarounds` and `known_exceptions` are both empty. Declaring one workaround refuses the ASH with the workaround named.
- **REOPEN** — must link `parent_event_id` to the ASH it reopens; the ASH event is untouched, stays in lane history, and stays in the graveyard as a retained historical closure.

## What the engine refuses (each one has a test)

Bad transitions · missing sources on any state change · AP without durability evidence · duplicate receipts (same lane + kind + direction + source set + claims) · replication pointing at the same entity · replication crediting the original entity · ASH without scope · ASH with a surviving workaround or exception · REOPEN without a parent closure · editing a frozen prediction (hash mismatch, and resolution is then blocked) · re-freezing a prediction · a prediction with no falsification condition · a model adjudicating its own proposal · reusing an event id · editing or deleting a posted event (chain break). Pre-freeze evidence used to score a prediction produces a warning, not a silent pass.

`PROPOSED` events contribute **0** to every score. Only a human named in `adjudicated_by` can settle one.

## Numbers

Every displayed number is a sum of listed components, each naming its event and its reason, and each component opens. Weights are `v0-provisional-2026-09-05` and are labeled that way on the board: source-type weight × direction, ±2 for a prediction hit/miss, +1 to the **mechanism** for a replication. They are not validated against historical cases and should not be treated as calibrated. Indices are reversible — clicking one lists its constituents and their contributions.

## Replication

`replication_of` + `causal_link` (`independent-adoption` | `copied-policy` | `shared-cause` | `regulatory-common-cause` | `unknown`). The replicating event scores on its **own** entity and adds mechanism confidence; it never adds a receipt to the original. Seeded example: Suno's 2026-09-03 export metering is a replication of Udio's export closure with `causal_link: independent-adoption` — Udio's was settlement-driven, Suno's is ToS-driven — so `GC:EXPORT` gains and `GC:UDIO` does not.

## Time travel

`NOW` · `AT FREEZE` (2026-08-13) · `AT PROTOCOL` (2026-08-30) · any date · `THEN vs NOW`. Filtering is by `posted_at`, so the board shows what the ledger *knew* on that date, not what later turned out to be true.

## Internal records

`INTERNAL` is off by default and hides the Suno/MusicFlow hunch freeze and its entity, per the receipt's own "not approved for placement on the public Gate Closing page." Do not publish a view with it on.

## The propose panel

Adds entities, events, transitions, scoped-ASH attempts and predictions through the same validators. Accepted proposals go to an append-only **local** journal in the browser and appear immediately on the tape, in the book and on the wire — as `PROPOSED`, which moves nothing until a human is named. Export them and append to `tools/journal-source.js` to make them canonical. **The page cannot modify the sealed journal.**

## Verification run 2026-09-05

- `node tools/seal-journal.js` — 38 events, 7 predictions sealed; chain head `76c1f156…`; 2 warnings surfaced, not suppressed.
- `node tests/adversarial.test.js` — **50/50**.
- `node tests/headless.spec.js` — **20/20**, zero console/page errors, no mobile overflow at 390px.

## Known gaps (stated, not hidden)

1. **Weights are unvalidated.** v0. Do not cite a total as a finding.
2. **Two seeded AP candidates rest on thin sourcing** — Diamond OA has no primary count captured; ACX has no primary re-fetch. Both are `PROPOSED`.
3. **Udio's 48-hour window has no confirmed dates** — Billboard paywalled (HTTP 402). `EVT-0004`/`EVT-0005` carry `date_precision: unknown-within-Nov-2025`.
4. **P-2 (KDP) rests on a secondary source** citing the primary help page. Primary snapshot pending.
5. **`SRC-KDP-HELP-G201857950`, `SRC-ARXIV-20251210`, `SRC-SUNO-HELP-13614785` and the six legacy `main` sources are cited, not captured** — the provenance inspector says "NOT RETRIEVED — cited, not captured" on each.
6. **The score treats a supporting and a weakening event as symmetric** at equal source weight. That is an assumption, not a finding.
7. **No base rate.** See A-1 in the delta audit. The board cannot tell you whether gating is unusual, only what was recorded.
