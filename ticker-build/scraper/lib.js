/* GATE CLOSING SCRAPER — shared core (gc-scraper/1)
 *
 * One deterministic function, applyRow(), turns a manifest row (+ the snapshots it points at) into ledger state.
 * The live run and the replay both go through it, so "can the board be rebuilt from manifest + snapshots alone"
 * is tested on every run, not just in theory.
 *
 * HARD BOUNDARIES (do not make configurable):
 *   1. Auto events are audit_status PROPOSED, kind observation, direction open, no state transition. Ever.
 *      The only write path to POSTED is a human (Rob) adjudication made outside this pipeline.
 *   2. Auto events carry date: null + flag NEEDS_HUMAN_DATE. Dates found in a document are recorded as
 *      date_candidates (document dates), never promoted to the event date.
 *   3. A fetch only counts as content if its health is OK. Soft-404s, moved pages, walls and truncated bodies
 *      emit nothing; repeated failure raises a SOURCE_DARK review item.
 */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const E = require('../gate-closing-engine.js');

const EXTRACTOR_VERSION = 'gc-extract/1.0.0';
const SCRAPER_ACTOR = 'gc-scraper/1 (automated fetch-hash-diff; not an adjudicator)';
const AUTO_AUDIT_STATUS = 'PROPOSED'; // constant on purpose. See boundary 1.
const BAD_HEALTH_NOT_DARK = new Set(['ROBOTS_DISALLOWED', 'RATE_LIMITED']); // config/politeness problems, not a vanishing source

/* ---------------- hashing ---------------- */
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const canonical = E.canonical;

/* ---------------- paths / io ---------------- */
function paths(env = process.env) {
  const scraperDir = __dirname;
  const dataDir = path.resolve(env.GC_DATA_DIR || path.join(scraperDir, 'data'));
  const journalDir = path.resolve(env.GC_JOURNAL_DIR || path.join(scraperDir, '..'));
  return {
    scraperDir, dataDir, journalDir,
    manifest: path.join(dataDir, 'manifest.jsonl'),
    snapshots: path.join(dataDir, 'snapshots'),
    reviewQueue: path.join(dataDir, 'review-queue.json'),
    status: path.join(dataDir, 'status.json'),
    digests: path.join(dataDir, 'digests'),
    journalJson: path.join(journalDir, 'gate-closing-journal.json'),
    journalJs: path.join(journalDir, 'gate-closing-journal.js'),
    sources: path.resolve(env.GC_SOURCES || path.join(scraperDir, 'sources.json')),
    config: path.resolve(env.GC_CONFIG || path.join(scraperDir, 'config.json'))
  };
}
function readManifest(P) {
  if (!fs.existsSync(P.manifest)) return [];
  return fs.readFileSync(P.manifest, 'utf8').split('\n').filter(Boolean).map((l, i) => { try { return JSON.parse(l) } catch (e) { throw new Error('manifest line ' + (i + 1) + ' is not JSON — manifest corrupted') } });
}
function storeSnapshot(P, rel, buf) { // content-addressed: same bytes → same path, never overwritten with different bytes
  const abs = path.join(P.dataDir, rel);
  if (fs.existsSync(abs)) { if (sha256(fs.readFileSync(abs)) !== sha256(buf)) throw new Error('snapshot collision at ' + rel); return rel; }
  fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, buf); return rel;
}
function readSnapshot(P, rel) { const abs = path.join(P.dataDir, rel); if (!fs.existsSync(abs)) throw new Error('MISSING SNAPSHOT ' + rel + ' — ledger cannot be reconstructed'); return fs.readFileSync(abs); }

/* ---------------- manifest hash chain ---------------- */
function rowHashInput(row) { const r = { ...row }; delete r.row_hash; return canonical(r); }
function sealRow(row, prev) { row.prev_row_hash = prev ? prev.row_hash : null; row.row_hash = sha256(rowHashInput(row)); return row; }
function verifyManifestChain(rows) {
  const problems = []; let prev = null;
  rows.forEach((r, i) => {
    if (r.prev_row_hash !== (prev ? prev.row_hash : null)) problems.push(`${r.fetch_id}: prev_row_hash does not link to row ${i}`);
    if (sha256(rowHashInput(r)) !== r.row_hash) problems.push(`${r.fetch_id}: row_hash mismatch (row edited after write)`);
    const want = 'FETCH-' + String(i + 1).padStart(6, '0'); if (r.fetch_id !== want) problems.push(`${r.fetch_id}: expected ${want} (ids are sequential, never reused)`);
    prev = r;
  });
  return { ok: problems.length === 0, problems };
}

/* ---------------- text normalization ---------------- */
function decodeEntities(s) {
  return s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&rsquo;|&lsquo;/g, "'").replace(/&rdquo;|&ldquo;/g, '"').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&hellip;/g, '…').replace(/&amp;/g, '&');
}
const tidy = s => decodeEntities(String(s || '')).replace(/[\s ]+/g, ' ').trim();
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';
const DATE_TXT = `(\\d{4}-\\d{2}-\\d{2}|(?:${MONTHS})\\.? \\d{1,2},? \\d{4}|\\d{1,2} (?:${MONTHS}) \\d{4})`;
const LABELED_DATE = new RegExp(`\\b(last updated|last modified|last revised|updated|effective(?: date| as of| from| on)?|published|posted|revised|starting)\\b\\s*(?:on|:|-|–)?\\s*${DATE_TXT}`, 'gi');

function documentDates(text, rawStr, kind) { // DOCUMENT dates only. Never an event date. (Boundary 2.)
  const out = [];
  if (kind === 'html') {
    for (const m of rawStr.matchAll(/<meta\b[^>]*>/gi)) {
      const tag = m[0], key = (tag.match(/(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i) || [])[1], val = (tag.match(/content\s*=\s*["']([^"']*)["']/i) || [])[1];
      if (key && val && /^(article:modified_time|article:published_time|og:updated_time|datemodified|datepublished|last-modified|dcterms\.modified|dcterms\.date)$/i.test(key)) out.push({ field: 'meta:' + key.toLowerCase(), value: val.trim(), context: 'HTML meta tag' });
    }
    for (const m of rawStr.matchAll(/"(dateModified|datePublished)"\s*:\s*"([^"]{6,40})"/g)) out.push({ field: 'jsonld:' + m[1], value: m[2], context: 'JSON-LD' });
  }
  if (kind === 'pdf') for (const m of rawStr.matchAll(/\/(ModDate|CreationDate)\s*\(D:(\d{4})(\d{2})(\d{2})/g)) out.push({ field: 'pdf:' + m[1], value: `${m[2]}-${m[3]}-${m[4]}`, context: 'PDF info dictionary' });
  if (text) for (const m of text.matchAll(LABELED_DATE)) { const i = m.index; out.push({ field: 'text:' + m[1].toLowerCase(), value: m[2], context: text.slice(Math.max(0, i - 60), i + m[0].length + 60).replace(/\n/g, ' ⏎ ') }); }
  const seen = new Set();
  return out.filter(d => { const k = d.field + '|' + d.value; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => (a.field + a.value).localeCompare(b.field + b.value));
}
function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }

function normalize(kind, buf, src) {
  const warnings = []; let text = '', title = null, h1 = null, parseError = null;
  const raw = kind === 'pdf' ? buf.toString('latin1') : buf.toString('utf8');
  if (kind === 'html') {
    let t = raw.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1\s*>/gi, ' ');
    title = tidy((t.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1]) || null;
    h1 = tidy(((t.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, ' ')) || null;
    t = t.replace(/<head\b[\s\S]*?<\/head\s*>/i, ' ')
      .replace(/<\/?(br|p|div|li|h[1-6]|tr|section|article|header|footer|ul|ol|table|nav|main|aside|blockquote|pre|dd|dt)\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ');
    let lines = decodeEntities(t).split('\n').map(l => l.replace(/[ \t ]+/g, ' ').trim()).filter(Boolean);
    if (src.region) {
      const a = lines.findIndex(l => l.includes(src.region.start)), b = src.region.end ? lines.findIndex((l, i) => i > a && l.includes(src.region.end)) : -1;
      if (a < 0) warnings.push('REGION_START_NOT_FOUND'); else lines = lines.slice(a, b > a ? b : undefined);
    }
    text = (title ? 'TITLE: ' + title + '\n' : '') + lines.join('\n');
    if (!/<\/html\s*>/i.test(raw)) warnings.push('NO_CLOSING_HTML_TAG');
  } else if (kind === 'rss') {
    const items = [...raw.matchAll(/<(item|entry)\b[\s\S]*?<\/\1\s*>/gi)].map(m => {
      const x = m[0], g = re => tidy(((x.match(re) || [])[1] || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' '));
      const link = g(/<link\b[^>]*>([\s\S]*?)<\/link>/i) || ((x.match(/<link\b[^>]*href=["']([^"']+)["']/i) || [])[1] || '');
      return [g(/<(?:pubDate|published|updated|dc:date)\b[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated|dc:date)>/i), g(/<title\b[^>]*>([\s\S]*?)<\/title>/i), link].join(' | ');
    });
    title = tidy((raw.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1]) || null;
    text = items.join('\n');
    if (!/<\/(rss|feed|rdf:RDF)\s*>/i.test(raw)) parseError = 'feed has no closing </rss>/</feed>';
    if (!items.length) warnings.push('FEED_HAS_NO_ITEMS');
  } else if (kind === 'json') {
    try {
      const j = JSON.parse(raw); const spec = src.json || {}; let arr = spec.array_path ? getPath(j, spec.array_path) : j;
      if (!Array.isArray(arr)) arr = [arr];
      text = arr.map(it => (spec.fields || Object.keys(it).sort()).map(f => { const [p, mod] = f.split('|'); let v = getPath(it, p); if (v != null && typeof v === 'object') v = canonical(v); v = v == null ? '' : String(v); if (mod === 'firstline') v = v.split('\n')[0]; return p + '=' + v; }).join(' | ')).join('\n');
      if (!arr.length) warnings.push('JSON_EMPTY_ARRAY');
    } catch (e) { parseError = 'JSON parse failed: ' + e.message; }
  } else if (kind === 'pdf') {
    text = 'PDF sha256:' + sha256(buf); warnings.push('PDF_BINARY_ONLY');
    if (!/%%EOF\s*$/.test(raw.slice(-2048))) parseError = 'PDF has no trailing %%EOF';
  } else {
    text = buf.toString('utf8').split('\n').map(l => l.trim()).filter(Boolean).join('\n');
  }
  if (src.ignore_lines && kind !== 'pdf') { const res = src.ignore_lines.map(r => new RegExp(r, 'i')); text = text.split('\n').filter(l => !res.some(r => r.test(l))).join('\n'); }
  return { text, title, h1, warnings, parseError, date_fields: documentDates(text, raw, kind) };
}

/* ---------------- health ---------------- */
const SOFT404_TITLE = /\b(404|not found|page not found|doesn'?t exist|does not exist|no longer available|can'?t be found|cannot be found|page unavailable)\b/i;
const MOVED_BANNER = /(this (page|article|content) has (been )?moved|we(?:'|’)ve moved|has been (moved|retired|archived|deprecated)|is no longer (maintained|available|updated|supported)|content has moved|this page is outdated)/i;
const WALL_MARKERS = /(just a moment\.\.\.|attention required! \| cloudflare|cf-browser-verification|challenge-platform|cf_chl_|enable javascript (and cookies )?to continue|please enable (javascript|cookies)|checking your browser|ddos protection by)/i;

function classify(facts, norm, rawStr, probe, prevGood) {
  // facts: {http_status, error, headers, bytes, url, final_url, redirect_chain, robots}
  const warnings = [...(norm ? norm.warnings : [])];
  if (facts.robots && !facts.robots.allowed) return { health: 'ROBOTS_DISALLOWED', warnings };
  if (facts.error) return { health: 'NETWORK_ERROR', warnings };
  if (facts.offsite_redirect) return { health: 'MOVED_REDIRECT_OFFSITE', warnings };
  if (facts.too_large) return { health: 'TOO_LARGE', warnings };
  const h = facts.headers || {}, st = facts.http_status;
  const wallish = !!(h['cf-mitigated'] || (rawStr && WALL_MARKERS.test(rawStr.slice(0, 20000))));
  if (st === 429) return { health: 'RATE_LIMITED', warnings };
  if ([401, 403, 503].includes(st) && wallish) return { health: 'WALL', warnings };
  if (st === 404 || st === 410) return { health: 'GONE', warnings };
  if (st < 200 || st >= 300) return { health: 'HTTP_' + st, warnings };
  if (wallish && (!norm || norm.text.length < 1500)) return { health: 'WALL', warnings };
  if (h['content-length'] && (!h['content-encoding'] || h['content-encoding'] === 'identity') && Number(h['content-length']) !== facts.bytes) return { health: 'TRUNCATED', warnings: [...warnings, `content-length ${h['content-length']} ≠ bytes ${facts.bytes}`] };
  if (norm.parseError) return { health: 'TRUNCATED', warnings: [...warnings, norm.parseError] };
  const origPath = new URL(facts.url).pathname, finalPath = new URL(facts.final_url).pathname;
  if (finalPath.replace(/\/+$/, '') === '' && origPath.replace(/\/+$/, '') !== '') return { health: 'MOVED_REDIRECT_HOME', warnings };
  if (finalPath.replace(/\/+$/, '') !== origPath.replace(/\/+$/, '')) warnings.push('REDIRECTED:' + finalPath);
  if (probe && probe.http_status >= 200 && probe.http_status < 300) {
    if (probe.normalized_sha256 === sha256(norm.text)) return { health: 'SOFT_404', warnings: [...warnings, 'matches domain probe body'] };
    if (probe.title && norm.title && probe.title === norm.title) return { health: 'SOFT_404', warnings: [...warnings, 'matches domain probe title'] };
  }
  if ((norm.title && SOFT404_TITLE.test(norm.title)) || (norm.h1 && SOFT404_TITLE.test(norm.h1))) return { health: 'SOFT_404', warnings: [...warnings, 'not-found title/h1'] };
  if (MOVED_BANNER.test(norm.text.slice(0, 4000))) return { health: 'MOVED_BANNER', warnings };
  if (norm.text.replace(/^TITLE:.*\n?/, '').length < 50) return { health: 'EMPTY', warnings };
  if (prevGood && prevGood.length > 2000 && norm.text.length < prevGood.length * 0.4) warnings.push(`SHRUNK:${norm.text.length}/${prevGood.length}`);
  return { health: 'OK', warnings };
}

/* ---------------- robots.txt (RFC 9309 subset) ---------------- */
function parseRobots(txt) {
  const groups = []; let cur = null, lastAgent = false;
  for (let line of String(txt).split(/\r?\n/)) {
    line = line.replace(/#.*/, '').trim(); if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (!cur || !lastAgent) { cur = { agents: [], rules: [], delay: null }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastAgent = true; continue; }
    lastAgent = false; if (!cur) continue;
    if (k === 'allow' || k === 'disallow') cur.rules.push({ allow: k === 'allow', path: v });
    else if (k === 'crawl-delay') { const n = parseFloat(v); if (!isNaN(n)) cur.delay = n; }
  }
  return groups;
}
function robotsPatternMatch(pat, p) { let re = '^' + pat.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*'); if (re.endsWith('\\$')) re = re.slice(0, -2) + '$'; return new RegExp(re).test(p); }
function robotsVerdict(robots, userAgent, url) {
  // robots: {http_status, text|null, error}
  if (!robots) return { allowed: false, rule: 'robots.txt not fetched', crawl_delay: null };
  if (robots.error || (robots.http_status >= 500)) return { allowed: false, rule: 'robots.txt unreachable → treat as full disallow (RFC 9309 §2.3.1.4)', crawl_delay: null };
  if (robots.http_status >= 400) return { allowed: true, rule: 'robots.txt ' + robots.http_status + ' → no restrictions', crawl_delay: null };
  const groups = parseRobots(robots.text || ''); const tok = userAgent.toLowerCase();
  let g = groups.filter(x => x.agents.some(a => a !== '*' && tok.includes(a))); if (!g.length) g = groups.filter(x => x.agents.includes('*'));
  const u = new URL(url), p = u.pathname + (u.search || '');
  let best = null;
  for (const r of g.flatMap(x => x.rules)) { if (r.path === '') continue; if (robotsPatternMatch(r.path, p) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r; }
  const delay = Math.max(0, ...g.map(x => x.delay || 0));
  return { allowed: !best || best.allow, rule: best ? (best.allow ? 'Allow: ' : 'Disallow: ') + best.path : 'no matching rule', crawl_delay: delay || null };
}

/* ---------------- diff ---------------- */
function lineDiff(oldText, newText) {
  const a = oldText.split('\n'), b = newText.split('\n'); const count = arr => arr.reduce((m, l) => m.set(l, (m.get(l) || 0) + 1), new Map());
  const ca = count(a), cb = count(b), added = [], removed = [];
  const cb2 = new Map(cb); for (const l of a) { if ((cb2.get(l) || 0) > 0) cb2.set(l, cb2.get(l) - 1); else removed.push(l); }
  const ca2 = new Map(ca); for (const l of b) { if ((ca2.get(l) || 0) > 0) ca2.set(l, ca2.get(l) - 1); else added.push(l); }
  return { added, removed, ratio: (added.length + removed.length) / Math.max(1, a.length + b.length) };
}

/* ---------------- state + applyRow (the ONLY place ledger state changes) ---------------- */
function emptyState() { return { journal: null, sources: {}, probes: {}, robots: {}, review: [], reviewSeq: 0, lastRow: null }; }
function srcState(S, id) { return S.sources[id] || (S.sources[id] = { last_good: null, consecutive_bad: 0, dark_alerted: false, recent_changes: [], last_health: null, last_fetch_id: null, last_ok_at: null }); }
function nextEventId(journal) { const n = Math.max(0, ...journal.events.map(e => { const m = /^EVT-(\d+)$/.exec(e.event_id); return m ? Number(m[1]) : 0; })); return 'EVT-' + String(n + 1).padStart(4, '0'); }
function journalStateSha(j) { return sha256(canonical(j)); }

function assertAutoEventShape(ev) { // Boundary 1, enforced in code. Also enforced by guard.js in CI.
  const bad = [];
  if (ev.audit_status !== 'PROPOSED') bad.push('audit_status must be PROPOSED');
  if (ev.kind !== 'observation') bad.push('kind must be observation');
  if (ev.direction !== 'open') bad.push('direction must be open (never SUPPORT/COUNTER)');
  if ('new_state' in ev || 'previous_state' in ev || 'transition_reason' in ev) bad.push('no state transitions');
  if (ev.adjudicated_by) bad.push('no adjudicated_by');
  if (ev.date !== null) bad.push('date must be null (NEEDS_HUMAN_DATE)');
  if (!(ev.flags || []).includes('NEEDS_HUMAN_DATE')) bad.push('flag NEEDS_HUMAN_DATE required');
  if (bad.length) throw new Error('AUTO-EVENT BOUNDARY VIOLATION: ' + bad.join('; '));
}

function openReview(S, row, src, reason, details) {
  // de-duplicate open items with the same source + reason (e.g. one SOURCE_DARK per streak)
  if (S.review.some(r => r.status === 'OPEN' && r.source_id === (src && src.id) && r.reason === reason && ['SOURCE_DARK', 'ROBOTS_DISALLOWED'].includes(reason))) return null;
  S.reviewSeq += 1;
  const item = { review_id: 'REV-' + String(S.reviewSeq).padStart(6, '0'), fetch_id: row.fetch_id, source_id: src ? src.id : null, source_url: src ? src.url : null, entity_id: src ? src.entity_id || null : null, mechanism_id: src ? src.mechanism_id || null : null, reason, created_at: row.fetched_at || row.recorded_at, status: 'OPEN', ...details };
  S.review.push(item); return item.review_id;
}

function buildAutoEvent(S, srcCfg, row, diff, dateFields, proposer) {
  const J = S.journal; const srcId = 'SRC-AUTO-' + row.fetch_id;
  if (!J.sources.some(s => s.id === srcId)) J.sources.push({ id: srcId, type: 'observed-url', title: (srcCfg.name || srcCfg.id) + ' — automated snapshot ' + row.fetch_id, url: row.final_url || row.url, published: null, retrieved: row.fetched_at, retrieved_by: SCRAPER_ACTOR, hash: row.content_sha256, snapshot: row.raw_snapshot_path, note: 'Automated capture. normalized_sha256 ' + row.normalized_sha256 + ' · extractor ' + row.extractor_version + '. Snapshot is in ticker-build/scraper/data/.' });
  const ex = (arr, sign) => arr.slice(0, 8).map(l => sign + ' ' + (l.length > 200 ? l.slice(0, 200) + '…' : l));
  const ev = {
    event_id: nextEventId(J), kind: 'observation',
    title: `AUTO: ${srcCfg.name || srcCfg.id} changed (+${diff.added.length} / −${diff.removed.length} lines)`,
    entity_id: srcCfg.entity_id || null, mechanism_id: srcCfg.mechanism_id || null, market: srcCfg.market || null,
    date: null, date_precision: null, flags: ['NEEDS_HUMAN_DATE', 'AUTO_SCRAPED'],
    observed_at: row.fetched_at, posted_at: row.fetched_at.slice(0, 10),
    direction: 'open', source_refs: [srcId], counterevidence_refs: [], claim_refs: [], prediction_refs: [],
    fetch_id: row.fetch_id, date_candidates: dateFields.map(d => ({ ...d, kind: 'document-date (NOT the event date)' })),
    proposed_by: proposer || { actor: SCRAPER_ACTOR, role: 'model' }, audit_status: AUTO_AUDIT_STATUS,
    note: 'Automated hash change on a watched source. This is NOT evidence of direction and carries no date: a human must read the snapshot, decide what (if anything) happened, and when. Dates found in the document are listed in date_candidates as DOCUMENT dates only.\n' + [...ex(diff.added, '+'), ...ex(diff.removed, '−')].join('\n')
  };
  if (!proposer) assertAutoEventShape(ev); else if (ev.audit_status !== 'PROPOSED') throw new Error('review emits are PROPOSED only');
  const r = E.appendEvent(J, ev); S.journal = r.journal; return ev.event_id;
}

function applyRow(S, row, ctx) {
  // ctx: {P, sourcesById, config, userAgent}. Returns {route, event_id, review_id, health, change, warnings}
  const { P, sourcesById, config } = ctx;
  const out = { route: 'NONE', event_id: null, review_id: null };
  if (row.type === 'SEED' || row.type === 'EXTERNAL_APPEND') {
    const j = JSON.parse(readSnapshot(P, row.journal_snapshot_path).toString('utf8'));
    if (sha256(canonical(j)) !== row.journal_state_sha_in) throw new Error(row.fetch_id + ': journal snapshot hash mismatch');
    if (S.journal) { const old = S.journal.events; if (j.events.length < old.length || !old.every((e, i) => j.events[i].content_hash === e.content_hash)) throw new Error(row.fetch_id + ': external journal is not an append-only extension'); }
    const ch = E.verifyChain(j); if (!ch.ok) throw new Error(row.fetch_id + ': external journal chain broken');
    S.journal = j;
  } else if (row.type === 'ROBOTS') {
    S.robots[row.domain] = { http_status: row.http_status, error: row.error || null, text: row.raw_snapshot_path ? readSnapshot(P, row.raw_snapshot_path).toString('utf8') : null, fetch_id: row.fetch_id };
  } else if (row.type === 'PROBE') {
    let sig = { http_status: row.http_status, final_url: row.final_url, title: null, normalized_sha256: null, normalized_length: 0, fetch_id: row.fetch_id };
    if (row.raw_snapshot_path) { const n = normalize('html', readSnapshot(P, row.raw_snapshot_path), {}); sig.title = n.title; sig.normalized_sha256 = sha256(n.text); sig.normalized_length = n.text.length; }
    S.probes[row.domain] = sig;
  } else if (row.type === 'FETCH') {
    const src = sourcesById[row.source_id] || { id: row.source_id, url: row.url, kind: row.kind, name: row.source_id };
    const cfg = { ...src, ...(row.source_cfg || {}) }; // the row carries the cfg used at fetch time → replay independent of later edits
    const ss = srcState(S, row.source_id);
    let norm = null, rawStr = null;
    if (row.raw_snapshot_path) { const buf = readSnapshot(P, row.raw_snapshot_path); if (sha256(buf) !== row.content_sha256) throw new Error(row.fetch_id + ': raw snapshot hash mismatch'); norm = normalize(cfg.kind, buf, cfg); rawStr = buf.toString(cfg.kind === 'pdf' ? 'latin1' : 'utf8'); if (row.normalized_sha256 && sha256(norm.text) !== row.normalized_sha256) throw new Error(row.fetch_id + `: normalized hash mismatch under ${EXTRACTOR_VERSION} (row says ${row.extractor_version})`); }
    const robots = row.robots_verdict ? row.robots_verdict : null;
    if (robots && !(row.redirect_chain || []).length) { // recompute from the stored robots.txt snapshot — replay does not trust the recorded verdict
      const re = robotsVerdict(S.robots[new URL(row.url).host], row.user_agent || ctx.userAgent, row.url);
      if (re.allowed !== robots.allowed) throw new Error(row.fetch_id + ': robots verdict does not reproduce from the stored robots.txt snapshot');
    }
    const prevGoodText = ss.last_good ? readSnapshot(P, ss.last_good.norm_path).toString('utf8') : null;
    const cl = classify({ ...row, robots }, norm, rawStr, S.probes[new URL(row.url).host], prevGoodText);
    out.health = cl.health; out.warnings = cl.warnings;
    ss.last_health = cl.health; ss.last_fetch_id = row.fetch_id;
    if (cl.health !== 'OK') {
      out.change = 'n/a';
      if (cl.health === 'ROBOTS_DISALLOWED') { out.review_id = openReview(S, row, cfg, 'ROBOTS_DISALLOWED', { details: robots && robots.rule }); out.route = out.review_id ? 'REVIEW' : 'NONE'; }
      else if (!BAD_HEALTH_NOT_DARK.has(cl.health)) {
        ss.consecutive_bad += 1;
        if (ss.consecutive_bad >= config.dark_threshold && !ss.dark_alerted) { ss.dark_alerted = true; out.review_id = openReview(S, row, cfg, 'SOURCE_DARK', { details: `${ss.consecutive_bad} consecutive non-OK fetches; latest ${cl.health}`, last_ok_at: ss.last_ok_at, redirect_chain: row.redirect_chain, signal_note: 'A vanishing source is itself a Gate Closing signal. Human decides whether this is a reorganization or a closure.' }); out.route = 'REVIEW'; }
      }
    } else {
      const wasDark = ss.dark_alerted; ss.consecutive_bad = 0; ss.dark_alerted = false; ss.last_ok_at = row.fetched_at;
      const normPath = row.normalized_snapshot_path;
      const dsig = canonical((norm.date_fields || []).map(d => [d.field, d.value]));
      if (!ss.last_good) { out.change = 'BASELINE'; }
      else if (ss.last_good.norm_sha === row.normalized_sha256) {
        if (ss.last_good.date_sig !== dsig) { out.change = 'DATE_FIELD_CHANGED'; out.review_id = openReview(S, row, cfg, 'DATE_FIELD_CHANGED_ONLY', { before: JSON.parse(ss.last_good.date_sig), after: (norm.date_fields || []).map(d => [d.field, d.value]), date_candidates: norm.date_fields, note: 'Text unchanged; a document date moved. Document date ≠ event date.' }); out.route = 'REVIEW'; }
        else out.change = 'UNCHANGED';
      } else {
        out.change = 'CHANGED';
        const diff = lineDiff(prevGoodText, norm.text);
        const flapping = ss.recent_changes.filter(Boolean).length >= 2;
        const reasons = [];
        if (cl.warnings.length) reasons.push('warnings: ' + cl.warnings.join(', '));
        if (diff.ratio > config.big_change_ratio) reasons.push(`large rewrite (${Math.round(diff.ratio * 100)}% of lines) — redesign or reorganization?`);
        if (flapping) reasons.push('flapping: changed in ≥2 of the last ' + config.flap_window + ' OK fetches');
        if (!cfg.entity_id) reasons.push('source has no entity');
        if (cfg.route_changes === 'review') reasons.push('broad feed: all changes go to human review by config');
        if (wasDark) reasons.push('source just recovered from dark');
        if (reasons.length) { out.review_id = openReview(S, row, cfg, 'CHANGE_NEEDS_REVIEW', { why: reasons, added: diff.added.slice(0, 40), removed: diff.removed.slice(0, 40), ratio: diff.ratio, date_candidates: norm.date_fields }); out.route = 'REVIEW'; }
        else { out.event_id = buildAutoEvent(S, cfg, row, diff, norm.date_fields || [], null); out.route = 'EVENT'; }
      }
      ss.recent_changes = [...ss.recent_changes, out.change === 'CHANGED'].slice(-config.flap_window);
      ss.last_good = { norm_sha: row.normalized_sha256, norm_path: normPath, date_sig: dsig, length: norm.text.length };
    }
  } else if (row.type === 'REVIEW_RESOLUTION') {
    const item = S.review.find(r => r.review_id === row.review_id); if (!item) throw new Error(row.fetch_id + ': unknown review ' + row.review_id);
    if (item.status !== 'OPEN') throw new Error(row.fetch_id + ': review already resolved');
    if (!row.by || row.by.role !== 'human') throw new Error(row.fetch_id + ': only a human resolves review items');
    item.status = row.action === 'emit' ? 'EMITTED' : 'DISMISSED'; item.resolved_by = row.by; item.resolved_at = row.recorded_at; item.resolution_note = row.note || null;
    if (row.action === 'emit') {
      const f = S.lastFetchRows && S.lastFetchRows[item.fetch_id]; if (!f) throw new Error('emit needs the originating FETCH row');
      const cfg = { ...(sourcesById[f.source_id] || {}), ...(f.source_cfg || {}) };
      item.emitted_event_id = buildAutoEvent(S, cfg, { ...f, fetched_at: f.fetched_at }, { added: item.added || [], removed: item.removed || [] }, item.date_candidates || [], { actor: row.by.actor + ' (via review queue)', role: 'human' });
      out.event_id = item.emitted_event_id; out.route = 'EVENT';
    }
  } else throw new Error('unknown row type ' + row.type);
  if (row.type === 'FETCH') { S.lastFetchRows = S.lastFetchRows || {}; S.lastFetchRows[row.fetch_id] = row; }
  S.lastRow = row;
  out.journal_head_after = S.journal ? (S.journal.events.length ? S.journal.events[S.journal.events.length - 1].content_hash : null) : null;
  out.journal_state_sha_after = S.journal ? journalStateSha(S.journal) : null;
  return out;
}

/* ---------------- replay ---------------- */
function loadCtx(P) {
  const config = JSON.parse(fs.readFileSync(P.config, 'utf8'));
  const sources = JSON.parse(fs.readFileSync(P.sources, 'utf8')).sources;
  return { P, config, sources, sourcesById: Object.fromEntries(sources.map(s => [s.id, s])), userAgent: config.user_agent };
}
const OUTCOME_KEYS = ['route', 'event_id', 'review_id', 'health', 'change', 'journal_head_after', 'journal_state_sha_after'];
function replay(P, ctx, rows, opts = {}) {
  const chain = verifyManifestChain(rows); if (!chain.ok) throw new Error('MANIFEST CHAIN BROKEN: ' + chain.problems.slice(0, 5).join(' | '));
  const S = emptyState(); const mismatches = [];
  for (const row of rows) {
    const o = applyRow(S, row, ctx);
    for (const k of OUTCOME_KEYS) if (k in (row.outcome || {}) && canonical(row.outcome[k] ?? null) !== canonical(o[k] ?? null)) mismatches.push(`${row.fetch_id} ${k}: recorded ${JSON.stringify(row.outcome[k])} ≠ replayed ${JSON.stringify(o[k])}`);
    if (opts.stopAt && row.fetch_id === opts.stopAt) break;
  }
  return { state: S, mismatches };
}

/* ---------------- derived outputs ---------------- */
function journalJsText(J, lastRow) {
  const head = J.events.length ? J.events[J.events.length - 1].content_hash : null;
  return `/* GATE CLOSING — SEALED EVIDENCE JOURNAL (gc-journal/1)
 * GENERATED deterministically from the journal JSON. Last scraper row: ${lastRow ? lastRow.fetch_id + ' @ ' + (lastRow.fetched_at || lastRow.recorded_at) : 'n/a'}.
 * DO NOT EDIT BY HAND. Append via the engine (appendEvent). Hash chain: ${J.events.length} events, head ${head}
 * Live feed twin: gate-closing-journal.json (same content; the board polls it).
 * Verify any event: sha256(canonical({prev: prev_hash, event: <event without content_hash/prev_hash>})) — see engine.eventHashInput.
 */
window.GC_JOURNAL = ${JSON.stringify(J, null, 1)};
`;
}
function writeJournal(P, J, lastRow) {
  fs.writeFileSync(P.journalJson, JSON.stringify(J, null, 1) + '\n');
  fs.writeFileSync(P.journalJs, journalJsText(J, lastRow));
}
function autoPostedCount(J) { return J.events.filter(e => (e.proposed_by && /^gc-scraper/.test(e.proposed_by.actor || '')) && e.audit_status !== 'PROPOSED').length; }
function buildStatus(S, ctx, rows, nowIso) {
  const day = nowIso.slice(0, 10);
  const todays = rows.filter(r => r.type === 'FETCH' && (r.fetched_at || '').slice(0, 10) === day);
  const checked = new Set(todays.filter(r => r.outcome.health !== 'ROBOTS_DISALLOWED').map(r => r.source_id));
  const changed = todays.filter(r => ['CHANGED', 'DATE_FIELD_CHANGED'].includes(r.outcome.change));
  const queued = S.review.filter(r => (r.created_at || '').slice(0, 10) === day);
  const dark = Object.entries(S.sources).filter(([, v]) => v.dark_alerted).map(([k]) => k);
  const perSource = ctx.sources.map(s => { const v = S.sources[s.id] || {}; return { id: s.id, name: s.name, enabled: !!s.enabled, tos: s.tos && s.tos.status, last_health: v.last_health || null, last_fetch_id: v.last_fetch_id || null, last_ok_at: v.last_ok_at || null, consecutive_bad: v.consecutive_bad || 0, dark: !!v.dark_alerted }; });
  return {
    schema: 'gc-scraper-status/1', generated_from_row: S.lastRow ? S.lastRow.fetch_id : null, day,
    digest: { sources_checked: checked.size, fetches: todays.length, changed: changed.length, queued_for_review: queued.length, auto_events_proposed: todays.filter(r => r.outcome.route === 'EVENT').length, auto_posted: autoPostedCount(S.journal || { events: [] }), dark_sources: dark },
    open_review: S.review.filter(r => r.status === 'OPEN').length, manifest_rows: rows.length,
    manifest_head: rows.length ? rows[rows.length - 1].row_hash : null, sources: perSource
  };
}
function digestMarkdown(st) {
  const d = st.digest;
  return `# Gate Closing scraper — daily digest ${st.day} (UTC)

- **${d.sources_checked}** sources checked (${d.fetches} fetches)
- **${d.changed}** changed
- **${d.queued_for_review}** queued for review (open total: ${st.open_review})
- **${d.auto_events_proposed}** auto events written as PROPOSED (date null, NEEDS_HUMAN_DATE)
- **${d.auto_posted}** auto-posted ${d.auto_posted === 0 ? '(as required)' : '— BOUNDARY VIOLATION, investigate immediately'}
- Dark sources: ${d.dark_sources.length ? d.dark_sources.join(', ') : 'none'}

| Source | Enabled | ToS | Last health | Last OK | Bad streak |
|---|---|---|---|---|---|
${st.sources.map(s => `| ${s.id} | ${s.enabled ? 'yes' : 'no'} | ${s.tos || '—'} | ${s.last_health || '—'} | ${s.last_ok_at || '—'} | ${s.consecutive_bad}${s.dark ? ' DARK' : ''} |`).join('\n')}

Manifest: ${st.manifest_rows} rows · head \`${st.manifest_head}\` · generated from ${st.generated_from_row}
`;
}
function writeDerived(P, S, ctx, rows, nowIso) {
  fs.mkdirSync(P.digests, { recursive: true });
  fs.writeFileSync(P.reviewQueue, JSON.stringify({ schema: 'gc-review-queue/1', note: 'DERIVED from manifest.jsonl. Resolve with: node ticker-build/scraper/review.js resolve <REV-id> dismiss|emit --by "Rob" [--note ...]. Items here never reach the live board unless a human emits them (and even then only as PROPOSED).', items: S.review }, null, 1) + '\n');
  const st = buildStatus(S, ctx, rows, nowIso);
  fs.writeFileSync(P.status, JSON.stringify(st, null, 1) + '\n');
  fs.writeFileSync(path.join(P.digests, st.day + '.md'), digestMarkdown(st));
  return st;
}

module.exports = { EXTRACTOR_VERSION, SCRAPER_ACTOR, sha256, canonical, paths, readManifest, storeSnapshot, readSnapshot, sealRow, verifyManifestChain, normalize, classify, parseRobots, robotsVerdict, lineDiff, emptyState, applyRow, replay, loadCtx, writeJournal, journalJsText, writeDerived, buildStatus, journalStateSha, assertAutoEventShape, autoPostedCount, documentDates };
