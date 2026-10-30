#!/usr/bin/env node
/* GATE CLOSING SCRAPER — human review queue.
 *   node review.js list                         open items
 *   node review.js show REV-000012              one item in full
 *   node review.js resolve REV-000012 dismiss --by "Rob" [--note "redesign, no policy change"]
 *   node review.js resolve REV-000012 emit    --by "Rob" [--note "..."]   → writes a PROPOSED event (date null, NEEDS_HUMAN_DATE)
 * Resolutions are manifest rows (REVIEW_RESOLUTION), so replay reproduces them. Nothing here can write POSTED;
 * promotion to POSTED is Rob's adjudication on the board, outside this pipeline.
 */
'use strict';
const fs = require('fs');
const L = require('./lib.js');
const [cmd, id, action] = process.argv.slice(2);
const val = k => { const a = process.argv; const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const P = L.paths(); const ctx = L.loadCtx(P); const rows = L.readManifest(P);
const { state: S, mismatches } = L.replay(P, ctx, rows);
if (mismatches.length) { console.error('ABORT: manifest does not replay:\n' + mismatches.slice(0, 10).join('\n')); process.exit(1); }

if (!cmd || cmd === 'list') {
  const open = S.review.filter(r => r.status === 'OPEN');
  if (!open.length) console.log('Review queue empty.');
  open.forEach(r => console.log(`${r.review_id}  ${r.created_at}  ${r.reason.padEnd(24)} ${r.source_id || ''}  ${(r.why || [r.details || r.note || '']).join('; ')}`));
} else if (cmd === 'show') {
  console.log(JSON.stringify(S.review.find(r => r.review_id === id) || null, null, 1));
} else if (cmd === 'resolve') {
  if (!['dismiss', 'emit'].includes(action)) { console.error('action must be dismiss or emit'); process.exit(1); }
  const by = val('--by'); if (!by) { console.error('--by "<human name>" is required'); process.exit(1); }
  const diskJ = JSON.parse(fs.readFileSync(P.journalJson, 'utf8'));
  if (L.journalStateSha(diskJ) !== L.journalStateSha(S.journal)) { console.error('ABORT: journal on disk has changes the manifest has not captured. Run the scraper (or commit and let the next scheduled run capture them) first.'); process.exit(1); }
  const row = { fetch_id: 'FETCH-' + String(rows.length + 1).padStart(6, '0'), type: 'REVIEW_RESOLUTION', review_id: id, action, by: { actor: by, role: 'human' }, note: val('--note') || null, recorded_at: new Date().toISOString() };
  const before = L.journalStateSha(S.journal);
  const o = L.applyRow(S, row, ctx);
  row.outcome = { route: o.route, event_id: o.event_id, review_id: null, health: null, change: null, warnings: [], journal_head_after: o.journal_head_after, journal_state_sha_after: o.journal_state_sha_after };
  L.sealRow(row, rows[rows.length - 1]);
  fs.appendFileSync(P.manifest, JSON.stringify(row) + '\n'); rows.push(row);
  if (o.journal_state_sha_after !== before) L.writeJournal(P, S.journal, row);
  L.writeDerived(P, S, ctx, rows, row.recorded_at);
  console.log(`${id} → ${action.toUpperCase()}${o.event_id ? ' as ' + o.event_id + ' (PROPOSED, date null, NEEDS_HUMAN_DATE)' : ''}. Row ${row.fetch_id}. Commit and push to publish.`);
} else { console.error('usage: list | show <id> | resolve <id> dismiss|emit --by <name>'); process.exit(1); }
