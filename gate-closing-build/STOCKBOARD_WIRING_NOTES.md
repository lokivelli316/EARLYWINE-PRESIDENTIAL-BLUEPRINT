# Gate Closing Stockboard Wiring Pass

This pass preserves the shipped terminal and adds a surgical page/data boundary.

## Files
- `gate-evidence-terminal.html` — enhanced sibling stockboard page.
- `gate-evidence-terminal.css` — terminal styling separated for safer maintenance.
- `gate-evidence-terminal-core.js` — schema normalization and source ingestion.
- `gate-evidence-terminal-ui.js` — ticker, A/R-A/P book, ledger, drilldown and layout behavior.
- `sample-daily-update.json` — canonical stable JSON feed; fixes the shipped hash-prefixed filename mismatch.

## Added without bulldozing
- first-class Gate page rail (Gate Main / Stockboard / Frozen Protocol / Evidence JSON);
- explicit Gate state (`WATCH / AR / AP / POSTED / ASH / REOPEN`) separate from supportive/counter direction;
- A/R and A/P book derived from Gate state rather than evidence direction;
- backwards-compatible schema normalization;
- append-only transition-history display;
- provenance/counterevidence/receipt/prediction drill-down fields;
- herding/replication dimension separated from receipt counting;
- ticker uses internal GC symbols and Gate states, never securities prices.

## Important boundary
Existing records do not contain enough historical evidence to retroactively award AP/ASH/REOPEN. They import conservatively as WATCH unless an opening is explicitly represented. No missing evidence was invented.

## Review-branch status
This is a federated first pass for review, not final acceptance. It does not mutate canonical evidence from the browser. The static GitHub Pages board reads JSON and preserves lineage fields; durable append-only writes, human settlement workflow, prediction aging, graveyard, and full add/transition persistence require the next backend/storage pass.

The existing `gate-closing-preview.html` is intentionally not overwritten in this branch pass. The new stockboard links back to Gate Main; promotion should add the one-line bridge into Gate Main only after review.
