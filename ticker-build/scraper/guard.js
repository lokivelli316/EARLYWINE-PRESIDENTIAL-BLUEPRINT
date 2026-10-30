#!/usr/bin/env node
/* GATE CLOSING SCRAPER — CI guard. Runs after the scraper, before anything is committed.
 *   node guard.js <journal_before.json> <journal_after.json> <manifest_before.jsonl> <manifest_after.jsonl>
 * Fails (exit 1) if the automated run did anything only a human may do:
 *   - any existing event changed or removed (journal is append-only)
 *   - any added event not authored by gc-scraper, or not PROPOSED / observation / open / date-null / NEEDS_HUMAN_DATE
 *   - any state transition or adjudication in an added event
 *   - manifest not a byte-prefix extension of the previous manifest, or its hash chain broken
 *   - hash chain of the journal broken
 */
'use strict';
const fs = require('fs');
const L = require('./lib.js');
const E = require('../gate-closing-engine.js');
const [jb, ja, mb, ma] = process.argv.slice(2);
const fail = []; const read = p => (p && fs.existsSync(p) ? fs.readFileSync(p) : null);

const JB = read(jb) ? JSON.parse(read(jb)) : { events: [] }, JA = JSON.parse(read(ja));
if (!E.verifyChain(JA).ok) fail.push('journal hash chain broken');
JB.events.forEach((e, i) => { if (!JA.events[i] || JA.events[i].content_hash !== e.content_hash) fail.push('existing event changed/removed: ' + e.event_id); });
for (const e of JA.events.slice(JB.events.length)) {
  if (!(e.proposed_by && /^gc-scraper\//.test(e.proposed_by.actor || ''))) { fail.push(e.event_id + ': added by the automated run but not authored by gc-scraper'); continue; }
  try { const c = { ...e }; delete c.seq; delete c.prev_hash; delete c.content_hash; L.assertAutoEventShape(c); } catch (x) { fail.push(e.event_id + ': ' + x.message); }
}
const MB = read(mb) || Buffer.alloc(0), MA = read(ma) || Buffer.alloc(0);
if (MA.length < MB.length || !MA.subarray(0, MB.length).equals(MB)) fail.push('manifest is not append-only (previous bytes changed)');
const rows = MA.toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const ch = L.verifyManifestChain(rows); if (!ch.ok) fail.push('manifest chain: ' + ch.problems.slice(0, 3).join('; '));
const autoPosted = L.autoPostedCount(JA); if (autoPosted) fail.push('auto_posted = ' + autoPosted);

if (fail.length) { console.error('GUARD FAILED — nothing will be committed:\n- ' + fail.join('\n- ')); process.exit(1); }
console.log(`GUARD OK: +${JA.events.length - JB.events.length} auto event(s), all PROPOSED / date-null / NEEDS_HUMAN_DATE; +${rows.length - MB.toString('utf8').split('\n').filter(Boolean).length} manifest row(s); 0 auto-posted.`);
