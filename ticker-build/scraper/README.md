# Gate Closing scraper (gc-scraper/1)

A scheduled job (`.github/workflows/gate-closing-scraper.yml`) runs 4 times a day. It works through `sources.json`:

1. It fetches each **CLEARED** source.
2. It stores the raw bytes.
3. It hashes the normalized text.
4. It appends to the live ledger only when something actually changed.

## What it will never do

- **Promote anything.** Auto events are always `PROPOSED`, `kind: observation`, `direction: open`, with no state transition. This is hard-coded in three places:
  - `lib.js` `assertAutoEventShape`
  - the engine validator
  - `guard.js`, which runs in CI before any commit

  Rob's adjudication is the only write path to POSTED.
- **Guess a date.** Auto events carry `date: null` plus the flag `NEEDS_HUMAN_DATE`. Dates found in a page (meta tags, "Last updated", PDF ModDate) go in `date_candidates` as *document dates*. They are never treated as the date the event happened. (Mixing those up caused the IngramSpark and Stable Audio dating errors.)
- **Treat a 200 as proof.** Each fetch gets a health classification first. These all emit nothing:
  - soft-404 (checked against a known-bad URL probed once per domain)
  - redirect to the homepage or to another site
  - "page moved" banners
  - truncated bodies or feeds
  - Cloudflare or JS-only walls
  - empty pages
  - robots.txt blocks

  After `dark_threshold` consecutive bad fetches, the source raises a **SOURCE_DARK** review item, because a vanishing source is itself a signal.

## Where things go

| Situation | Goes to |
|---|---|
| First good fetch | baseline, nothing emitted |
| Hash unchanged | nothing |
| Small clean text change on a specific page | **PROPOSED event on the live board** (date null) |
| Only a document date changed | review queue |
| Large rewrite (>50% of lines), shrink, redirect, PDF change, flapping page, broad feed | review queue |
| Source dark N times in a row | review queue (SOURCE_DARK, once per streak) |
| robots.txt disallows | review queue (once) |

## Files

- `data/manifest.jsonl` is append-only and hash-chained (`prev_row_hash` → `row_hash`). Every fetch writes one row with:
  - `fetch_id`, URL, HTTP status, `fetched_at` (UTC)
  - `content_sha256`, `normalized_sha256`, `extractor_version`
  - raw and normalized snapshot paths, `parser_warnings`
  - the redirect chain, the robots verdict, and the outcome

  Other row types: `SEED`, `EXTERNAL_APPEND` (human journal changes, captured verbatim), `ROBOTS`, `PROBE`, `REVIEW_RESOLUTION`.
- `data/snapshots/` is content-addressed. Files are never modified or deleted, and CI enforces this.
- `data/review-queue.json`, `data/status.json` and `data/digests/<day>.md` are **derived**. You can delete them and rebuild them.

## Commands

```
node ticker-build/scraper/replay.js --wipe-test           # rebuild everything from manifest + snapshots, compare byte-for-byte
node ticker-build/scraper/replay.js --to FETCH-000123     # exact ticker state as of that row → <out>/ticker-state.json
node ticker-build/scraper/review.js list
node ticker-build/scraper/review.js resolve REV-000004 dismiss --by "Rob"
node ticker-build/scraper/review.js resolve REV-000004 emit    --by "Rob"   # still PROPOSED, still date null
bash ticker-build/scraper/test/e2e.sh                      # full test against a local fake web (no network)
```

Every live run replays the whole manifest first. It refuses to append if anything fails to reproduce.

## Turning sources on

A source is fetched only if both of these are true:
- `enabled: true`
- `tos.status: "CLEARED"`

The terms-of-service check from 2026-10-30 is recorded per source in `sources.json`:
- **BLOCKED:** Suno and Stability AI. Their terms prohibit scraping.
- **NEEDS_ROB:** KDP, KDP Community, ACX, IngramSpark PDF, CourtListener.
- **UNREVIEWED:** Udio.

robots.txt is still checked again on every run.

**Kill switch:** `"enabled": false` in `config.json`.
