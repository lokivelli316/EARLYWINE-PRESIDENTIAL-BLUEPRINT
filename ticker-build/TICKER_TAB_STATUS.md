# GREENFIELD TICKER TAB — BUILD RECEIPT

Status: BUILDING / NOT FROZEN
Date: 2026-09-06 (live feed wired 2026-10-30)
Seat: Grok, by operator instruction to wire the hamburger · Claude, live journal feed 2026-10-30

## Placement
Sibling tab to Gate Closing. Not folded into Gate Closing. Not a Friday avatar strip.

## Wired
- Home hamburger: `assets/js/data-registry.js` route `data` now has href `ticker-build/ticker-preview.html`
- Home desktop nav: Ticker link after Gate Closing
- Gate Closing hamburger: Data / Gates un-queued, points at the ticker page
- Ticker page hamburger: same whole-site drawer
- **Live journal feed (2026-10-30).** The board polls `gate-closing-journal.json` every 60 s and when the tab regains focus. It accepts an update only if the hash chain verifies, the frozen predictions verify, and the update is an append-only extension (no existing event hash changed). New events re-render the tape, book, wire and ledger without a reload, and their tickers pulse green. A tampered or rewritten feed is rejected and the board keeps the last good journal (status turns STALE). Opened from disk, it falls back to the sealed `gate-closing-journal.js` (status OFFLINE).
- **The feed is the first real feed.** It is the Gate Closing evidence journal itself. To post to the live board, append through the engine (see `tools/append-hunt-2026-10-30.js` as the pattern), regenerate `.js` + `.json`, and push. Every open board picks it up within about a minute.

- **Scheduled scraper (2026-10-30).** `.github/workflows/gate-closing-scraper.yml` runs 4×/day and appends to the journal through `ticker-build/scraper/`. Auto events are PROPOSED only, with date null and the flag NEEDS_HUMAN_DATE. Anything ambiguous goes to the review queue, not the board. The integrity panel shows the daily digest. See `ticker-build/scraper/README.md`.

## Not wired
- live polls (audience polling)
- live markets / Kalshi
- donation counters
- any number presented as observed fact

## Ledger batches
- 2026-10-30: HUNT-2026-10-30, EVT-0039 … EVT-0056. All PROPOSED, weight 0, awaiting Rob. Receipt: `gate-closing-build/receipts/2026-10-30_90-day-ar-ap-hunt.md`

## Next gate
Rob adjudicates EVT-0039 … EVT-0056. Corrections first (EVT-0040, -0052, -0055, -0056).
