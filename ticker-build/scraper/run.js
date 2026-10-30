#!/usr/bin/env node
/* GATE CLOSING SCRAPER — live run.
 * 1. Replays the whole manifest from snapshots and refuses to run if anything does not reproduce.
 * 2. Records any human journal changes since the last run as an EXTERNAL_APPEND row (append-only enforced).
 * 3. For each CLEARED + enabled source: robots.txt → soft-404 probe (once per domain) → polite fetch → raw snapshot →
 *    normalize → hash → applyRow() → append manifest row (hash-chained) → write journal if it changed.
 * 4. Writes derived outputs: review-queue.json, status.json, digests/<day>.md.
 * Nothing here can write POSTED. See lib.js boundaries.
 */
'use strict';
const fs = require('fs');
const L = require('./lib.js');

const P = L.paths();
const ctx = L.loadCtx(P);
const cfg = ctx.config;
const UA = cfg.user_agent;
const ALLOW_HTTP = process.env.GC_ALLOW_HTTP === '1';
const MIN_INTERVAL = Number(process.env.GC_MIN_INTERVAL_MS || cfg.min_domain_interval_ms);
const PROBE_PATH = '/gc-ledger-soft404-probe-7f3a9c2e';
const HEADER_KEEP = ['content-type', 'content-length', 'content-encoding', 'last-modified', 'etag', 'server', 'cf-ray', 'cf-mitigated', 'location', 'retry-after', 'x-robots-tag'];
const now = () => process.env.GC_FAKE_NOW || new Date().toISOString();

function die(msg) { console.error('ABORT: ' + msg); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const lastHit = {};
async function politeWait(host, extraMs) { const gap = Math.max(MIN_INTERVAL, extraMs || 0); const t = lastHit[host] || 0; const wait = t + gap - Date.now(); if (wait > 0) await sleep(wait); lastHit[host] = Date.now(); }

async function fetchFollow(url, { onHop } = {}) {
  const chain = []; let cur = url; const startHost = new URL(url).host;
  for (let hop = 0; hop < 6; hop++) {
    let res;
    try { res = await fetch(cur, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml,application/json,application/pdf;q=0.9,*/*;q=0.5' }, signal: AbortSignal.timeout(cfg.timeout_ms) }); }
    catch (e) { return { error: String(e && e.message || e), redirect_chain: chain, final_url: cur }; }
    const headers = {}; HEADER_KEEP.forEach(k => { const v = res.headers.get(k); if (v != null) headers[k] = v; });
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      const next = new URL(loc, cur).href; chain.push({ url: cur, status: res.status, location: next });
      try { await res.arrayBuffer(); } catch (e) {}
      if (new URL(next).host !== startHost) return { offsite_redirect: true, http_status: res.status, headers, redirect_chain: chain, final_url: next };
      if (onHop) { const v = onHop(next); if (v && !v.allowed) return { robots_block_on_redirect: v, http_status: res.status, headers, redirect_chain: chain, final_url: next }; }
      cur = next; continue;
    }
    if (headers['content-length'] && Number(headers['content-length']) > cfg.max_bytes) return { too_large: true, http_status: res.status, headers, redirect_chain: chain, final_url: cur };
    let buf; try { buf = Buffer.from(await res.arrayBuffer()); } catch (e) { return { error: 'body read failed: ' + e.message, http_status: res.status, headers, redirect_chain: chain, final_url: cur }; }
    if (buf.length > cfg.max_bytes) return { too_large: true, http_status: res.status, headers, redirect_chain: chain, final_url: cur };
    return { http_status: res.status, headers, redirect_chain: chain, final_url: cur, body: buf };
  }
  return { error: 'too many redirects', redirect_chain: chain, final_url: cur };
}

(async function main() {
  if (!cfg.enabled) { console.log('gc-scraper disabled in config.json (kill switch). Nothing fetched.'); return; }
  let rows = L.readManifest(P);
  const { state: S, mismatches } = L.replay(P, ctx, rows);
  if (mismatches.length) die('manifest does not replay to its recorded outcomes — refusing to append to an unreproducible ledger:\n' + mismatches.slice(0, 10).join('\n'));

  const append = (fields) => {
    const row = { fetch_id: 'FETCH-' + String(rows.length + 1).padStart(6, '0'), ...fields };
    if (!row.recorded_at) row.recorded_at = now();
    const before = S.journal ? L.journalStateSha(S.journal) : null;
    const o = L.applyRow(S, row, ctx); // throws on any boundary violation — nothing is written for this row
    row.outcome = { route: o.route, event_id: o.event_id, review_id: o.review_id, health: o.health ?? null, change: o.change ?? null, warnings: o.warnings || [], journal_head_after: o.journal_head_after, journal_state_sha_after: o.journal_state_sha_after };
    L.sealRow(row, rows[rows.length - 1]);
    fs.mkdirSync(P.dataDir, { recursive: true });
    fs.appendFileSync(P.manifest, JSON.stringify(row) + '\n');
    rows.push(row);
    if (S.journal && o.journal_state_sha_after !== before) L.writeJournal(P, S.journal, row);
    return row;
  };

  // --- journal: seed or external appends ---
  const diskJ = JSON.parse(fs.readFileSync(P.journalJson, 'utf8'));
  const diskSha = L.journalStateSha(diskJ);
  if (!S.journal || diskSha !== L.journalStateSha(S.journal)) {
    if (S.journal) { const old = S.journal.events; if (diskJ.events.length < old.length || !old.every((e, i) => diskJ.events[i] && diskJ.events[i].content_hash === e.content_hash)) die('journal on disk is NOT an append-only extension of the replayed journal. Someone rewrote history. Investigate before running.'); }
    const rel = L.storeSnapshot(P, 'snapshots/_journal/' + diskSha + '.json', Buffer.from(JSON.stringify(diskJ)));
    const added = S.journal ? diskJ.events.slice(S.journal.events.length).map(e => e.event_id) : null;
    append({ type: S.journal ? 'EXTERNAL_APPEND' : 'SEED', journal_snapshot_path: rel, journal_state_sha_in: diskSha, added_event_ids: added, note: S.journal ? 'Journal changed outside the scraper (human adjudication / manual append). Captured verbatim so replay stays exact.' : 'Seed: journal as it stood when the scraper was first started.' });
  }

  const sources = ctx.sources.filter(s => s.enabled && s.tos && s.tos.status === 'CLEARED').sort((a, b) => a.id.localeCompare(b.id));
  const skipped = ctx.sources.filter(s => !(s.enabled && s.tos && s.tos.status === 'CLEARED')).map(s => `${s.id} (${s.tos ? s.tos.status : 'no tos'}${s.enabled ? '' : ', disabled'})`);
  const robotsThisRun = {};

  for (const src of sources) {
    const u = new URL(src.url);
    if (u.protocol !== 'https:' && !ALLOW_HTTP) { console.warn('skip non-https ' + src.id); continue; }
    const host = u.host;

    // robots.txt once per host per run
    if (!robotsThisRun[host]) {
      await politeWait(host);
      const r = await fetchFollow(u.origin + '/robots.txt');
      let rel = null, csha = null;
      if (r.body) { csha = L.sha256(r.body); rel = L.storeSnapshot(P, `snapshots/_robots/${host.replace(/[:]/g, '_')}/${csha}.txt`, r.body); }
      robotsThisRun[host] = append({ type: 'ROBOTS', domain: host, url: u.origin + '/robots.txt', http_status: r.http_status ?? null, error: r.error || null, fetched_at: now(), content_sha256: csha, raw_snapshot_path: rel, redirect_chain: r.redirect_chain });
    }
    const verdictFor = url => L.robotsVerdict(S.robots[host], UA, url);

    // soft-404 probe once per host, ever (recorded; re-run by deleting nothing — add a new PROBE row by hand if a site is redesigned)
    if (!S.probes[host] && verdictFor(u.origin + PROBE_PATH).allowed) {
      await politeWait(host, (verdictFor(u.origin + PROBE_PATH).crawl_delay || 0) * 1000);
      const r = await fetchFollow(u.origin + PROBE_PATH, { onHop: verdictFor });
      let rel = null, csha = null;
      if (r.body) { csha = L.sha256(r.body); rel = L.storeSnapshot(P, `snapshots/_probe/${host.replace(/[:]/g, '_')}/${csha}.html`, r.body); }
      append({ type: 'PROBE', domain: host, url: u.origin + PROBE_PATH, http_status: r.http_status ?? null, error: r.error || null, final_url: r.final_url, redirect_chain: r.redirect_chain, fetched_at: now(), content_sha256: csha, raw_snapshot_path: rel, note: 'Known-bad URL fetched once to record what a failure looks like on this domain.' });
    }

    const v = verdictFor(src.url);
    const sourceCfg = { url: src.url, name: src.name, kind: src.kind, entity_id: src.entity_id || null, mechanism_id: src.mechanism_id || null, market: src.market || null, region: src.region || null, ignore_lines: src.ignore_lines || null, json: src.json || null, route_changes: src.route_changes || 'board' };
    const base = { type: 'FETCH', source_id: src.id, url: src.url, kind: src.kind, source_cfg: sourceCfg, user_agent: UA, robots_ref: robotsThisRun[host].fetch_id, robots_verdict: v, extractor_version: L.EXTRACTOR_VERSION };
    if (!v.allowed) { append({ ...base, fetched_at: now(), http_status: null, final_url: src.url, redirect_chain: [], content_sha256: null, normalized_sha256: null, raw_snapshot_path: null, normalized_snapshot_path: null, parser_warnings: ['not fetched: robots.txt ' + v.rule] }); continue; }

    await politeWait(host, Math.max((v.crawl_delay || 0) * 1000, src.min_interval_ms || 0));
    const fetchedAt = now();
    const r = await fetchFollow(src.url, { onHop: verdictFor });
    let rawRel = null, normRel = null, csha = null, nsha = null, warnings = [];
    if (r.robots_block_on_redirect) { append({ ...base, robots_verdict: r.robots_block_on_redirect, fetched_at: fetchedAt, http_status: r.http_status, final_url: r.final_url, redirect_chain: r.redirect_chain, headers: r.headers, content_sha256: null, normalized_sha256: null, raw_snapshot_path: null, normalized_snapshot_path: null, parser_warnings: ['redirect target disallowed by robots.txt'] }); continue; }
    if (r.body) {
      csha = L.sha256(r.body);
      const ext = { html: 'html', rss: 'xml', json: 'json', pdf: 'pdf' }[src.kind] || 'txt';
      rawRel = L.storeSnapshot(P, `snapshots/${src.id}/${csha}.${ext}`, r.body);
      const n = L.normalize(src.kind, r.body, sourceCfg);
      nsha = L.sha256(n.text);
      normRel = L.storeSnapshot(P, `snapshots/${src.id}/${nsha}.norm.txt`, Buffer.from(n.text));
      warnings = [...n.warnings, ...(n.parseError ? [n.parseError] : [])];
    }
    const row = append({ ...base, fetched_at: fetchedAt, http_status: r.http_status ?? null, error: r.error || null, final_url: r.final_url, redirect_chain: r.redirect_chain, headers: r.headers || {}, bytes: r.body ? r.body.length : 0, offsite_redirect: !!r.offsite_redirect, too_large: !!r.too_large, content_sha256: csha, normalized_sha256: nsha, raw_snapshot_path: rawRel, normalized_snapshot_path: normRel, parser_warnings: warnings });
    console.log(`${row.fetch_id} ${src.id} ${row.http_status ?? 'ERR'} ${row.outcome.health} ${row.outcome.change || ''} → ${row.outcome.route}${row.outcome.event_id ? ' ' + row.outcome.event_id : ''}${row.outcome.review_id ? ' ' + row.outcome.review_id : ''}`);
  }

  const st = L.writeDerived(P, S, ctx, rows, now());
  if (st.digest.auto_posted !== 0) die('auto_posted = ' + st.digest.auto_posted + ' — boundary violated');
  console.log(`DIGEST ${st.day}: ${st.digest.sources_checked} sources checked · ${st.digest.changed} changed · ${st.digest.queued_for_review} queued for review · ${st.digest.auto_posted} auto-posted · dark: ${st.digest.dark_sources.join(', ') || 'none'}`);
  if (skipped.length) console.log('Not fetched (ToS/config): ' + skipped.join('; '));
})().catch(e => die(e.stack || e.message));
