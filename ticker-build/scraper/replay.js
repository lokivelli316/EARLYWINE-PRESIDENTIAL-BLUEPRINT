#!/usr/bin/env node
/* GATE CLOSING SCRAPER — replay / recode.
 * Rebuilds ledger state from manifest.jsonl + snapshots ONLY. No network.
 *
 *   node replay.js                          replay everything, verify every row's recorded outcome
 *   node replay.js --to FETCH-000123        stop at that row; write the exact ticker state as of that row
 *   node replay.js --out <dir>              where to write rebuilt files (default: a fresh temp dir)
 *   node replay.js --wipe-test              rebuild into an empty dir and compare byte-for-byte with the committed
 *                                           journal (.json + .js), review-queue.json. Exit 1 on any difference.
 *
 * Output files in <dir>: gate-closing-journal.json, gate-closing-journal.js, review-queue.json, ticker-state.json
 */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const L = require('./lib.js');
const E = require('../gate-closing-engine.js');

const args = process.argv.slice(2); const flag = k => args.includes(k); const val = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const P = L.paths(); const ctx = L.loadCtx(P);
const rows = L.readManifest(P);
if (!rows.length) { console.error('manifest is empty — nothing to replay'); process.exit(1); }
const to = val('--to');
if (to && !rows.some(r => r.fetch_id === to)) { console.error('no such row ' + to); process.exit(1); }
const upto = to ? rows.slice(0, rows.findIndex(r => r.fetch_id === to) + 1) : rows;

const { state: S, mismatches } = L.replay(P, ctx, upto);
const last = upto[upto.length - 1];
const out = path.resolve(val('--out') || fs.mkdtempSync(path.join(os.tmpdir(), 'gc-replay-')));
fs.mkdirSync(out, { recursive: true });
const OP = { ...P, journalJson: path.join(out, 'gate-closing-journal.json'), journalJs: path.join(out, 'gate-closing-journal.js'), reviewQueue: path.join(out, 'review-queue.json'), status: path.join(out, 'status.json'), digests: path.join(out, 'digests') };
L.writeJournal(OP, S.journal, lastJournalRow(upto));
L.writeDerived(OP, S, ctx, upto, last.fetched_at || last.recorded_at);
const view = E.derive(S.journal, {});
fs.writeFileSync(path.join(out, 'ticker-state.json'), JSON.stringify({
  as_of_row: last.fetch_id, as_of_time: last.fetched_at || last.recorded_at, manifest_row_hash: last.row_hash,
  journal_head: S.journal.events[S.journal.events.length - 1].content_hash, journal_state_sha: L.journalStateSha(S.journal), events: S.journal.events.length,
  tape: Object.values(view.entities).map(e => ({ symbol: e.symbol, state: e.state, score: e.score.total, movement: e.movement, pending: e.pending.length })),
  indices: view.indices.map(i => ({ symbol: i.symbol, score: i.score.total })),
  ap_book: view.apBook.length, ar_book: view.arBook.length, open_review: S.review.filter(r => r.status === 'OPEN').length
}, null, 1) + '\n');

console.log(`REPLAYED ${upto.length} rows → ${last.fetch_id} (${last.fetched_at || last.recorded_at})`);
console.log(`manifest chain: OK · journal: ${S.journal.events.length} events, chain ${E.verifyChain(S.journal).ok ? 'INTACT' : 'BROKEN'} · open review: ${S.review.filter(r => r.status === 'OPEN').length}`);
console.log('rebuilt files: ' + out);
if (mismatches.length) { console.error('OUTCOME MISMATCHES (' + mismatches.length + '):\n' + mismatches.slice(0, 20).join('\n')); process.exit(1); }
console.log('every row reproduced its recorded outcome (route, event, review, health, change, journal hash)');

function lastJournalRow(rs) { // the row that last changed the journal — that is the row the live run stamped into the .js header
  let prev = null, hit = rs[0];
  for (const r of rs) { const s = r.outcome && r.outcome.journal_state_sha_after; if (s !== prev) hit = r; prev = s; }
  return hit;
}

if (flag('--wipe-test')) {
  if (to) { console.error('--wipe-test compares against the committed files, so it replays the whole manifest; drop --to'); process.exit(1); }
  const diffs = [];
  const cmp = (a, b, label) => { const A = fs.existsSync(a) ? fs.readFileSync(a) : null, B = fs.existsSync(b) ? fs.readFileSync(b) : null; if (!A || !B || !A.equals(B)) diffs.push(label + (A && B ? ' differs' : ' missing')); };
  const diskJ = JSON.parse(fs.readFileSync(P.journalJson, 'utf8'));
  if (L.journalStateSha(diskJ) !== L.journalStateSha(S.journal)) {
    const extra = diskJ.events.length - S.journal.events.length;
    diffs.push(`journal state differs from the replay${extra > 0 ? ` (disk has ${extra} event(s) not yet captured — a human append since the last run is captured on the next run as EXTERNAL_APPEND)` : ''}`);
  } else {
    cmp(OP.journalJson, P.journalJson, 'gate-closing-journal.json');
    cmp(OP.journalJs, P.journalJs, 'gate-closing-journal.js');
  }
  cmp(OP.reviewQueue, P.reviewQueue, 'review-queue.json');
  if (diffs.length) { console.error('WIPE TEST FAILED:\n- ' + diffs.join('\n- ')); process.exit(1); }
  console.log('WIPE TEST PASSED: derived state wiped and rebuilt from manifest + snapshots alone; journal (.json, .js) and review queue are byte-identical to the committed files.');
}
