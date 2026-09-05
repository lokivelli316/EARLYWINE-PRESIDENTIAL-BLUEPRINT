/* GATE CLOSING — LEDGER ENGINE  (gc-engine/1)
 * Pure derivation layer. No DOM. Works in browser (window.GCEngine) and Node (module.exports).
 *
 * Principles enforced here (not in the UI):
 *   - Current state is DERIVED from an append-only event journal. Nothing sets state directly.
 *   - Every number decomposes into named components with named events.
 *   - ASH is hard to earn; REOPEN must link back to the closure it reopens.
 *   - Models propose. Humans adjudicate. A model cannot POST its own proposal.
 *   - Frozen predictions are content-hashed; edits are detected, descendants are the only path.
 *   - Replication at another entity strengthens the MECHANISM, never the original entity's receipt count.
 *   - Time travel (asOf) filters by posted_at — what the ledger KNEW, not what later turned out true.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GCEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STATES = ['WATCH', 'AR', 'AP', 'POSTED', 'ASH', 'REOPEN'];
  const AUDIT = ['PROPOSED', 'REVIEWED', 'ADJUDICATED', 'POSTED'];
  const SETTLED_AUDIT = new Set(['ADJUDICATED', 'POSTED']);
  const EVENT_KINDS = ['observation', 'transition', 'evidence', 'adjudication', 'correction', 'replication',
    'prediction-freeze', 'prediction-resolution', 'prediction-extension', 'lineage', 'counterpart'];
  const AGING = ['DRAFT', 'NEW', 'ACTIVE', 'NEAR MATURITY', 'MATURED', 'OVERDUE', 'PARTIAL', 'RECEIVED',
    'MISSED', 'FALSIFIED', 'EXTENSION PROPOSED', 'CLOSED', 'NO WINDOW STATED'];
  const CLAIM_STATUS = ['SURVIVING', 'WEAKENED', 'UNDER PRESSURE', 'PARTIALLY FALSIFIED', 'FALSIFIED',
    'REVISED DESCENDANT EXISTS', 'UNRESOLVED', 'NOT ESTABLISHED'];

  // Provisional scoring weights. v0. NOT validated against historical cases. Displayed as such.
  const WEIGHTS = {
    version: 'v0-provisional-2026-09-05',
    bySourceType: { 'primary-law': 3, 'primary-corporate': 3, 'primary-institutional': 3, 'court-filing': 3,
      'primary-internal': 1, 'observed-url': 2, 'secondary-press': 2, 'secondary-blog': 1, 'derived': 1, 'unknown': 0 },
    predictionHit: 2, predictionMiss: -2, replicationToMechanism: 1, proposed: 0
  };

  /* ---------- canonical JSON + SHA-256 (sync, dependency-free; reproducible with sha256sum) ---------- */
  function canonical(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map(canonical).join(',') + ']';
    return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k) + ':' + canonical(obj[k])).join(',') + '}';
  }
  function sha256(str) {
    const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const enc = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(str) : Buffer.from(str, 'utf8');
    const l = enc.length, withOne = ((l + 8) >> 6 << 4) + 15, words = new Uint32Array(withOne + 1);
    for (let i = 0; i < l; i++) words[i >> 2] |= enc[i] << (24 - (i % 4) * 8);
    words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    words[withOne] = l * 8;
    let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const W = new Uint32Array(64), rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let j = 0; j < words.length; j += 16) {
      let [a,b,c,d,e,f,g,h] = H;
      for (let i = 0; i < 64; i++) {
        if (i < 16) W[i] = words[j + i]; else {
          const s0 = rotr(W[i-15],7) ^ rotr(W[i-15],18) ^ (W[i-15] >>> 3);
          const s1 = rotr(W[i-2],17) ^ rotr(W[i-2],19) ^ (W[i-2] >>> 10);
          W[i] = (W[i-16] + s0 + W[i-7] + s1) | 0;
        }
        const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25), ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + W[i]) | 0;
        const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22), maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = H.map((v, i) => (v + [a,b,c,d,e,f,g,h][i]) | 0);
    }
    return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }

  /* ---------- helpers ---------- */
  const byId = (arr, key = 'id') => Object.fromEntries((arr || []).map(x => [x[key], x]));
  const laneKey = (e, m) => e + '×' + (m || '*');
  const dateOf = s => (s ? new Date(s.length === 10 ? s + 'T12:00:00Z' : s) : null);
  const isSettled = ev => SETTLED_AUDIT.has(ev.audit_status);
  const clone = o => JSON.parse(JSON.stringify(o));

  function eventHashInput(ev, prevHash) {
    const c = clone(ev); delete c.content_hash; delete c.prev_hash; delete c.derived;
    return canonical({ prev: prevHash || null, event: c });
  }
  const PRED_FROZEN_FIELDS = ['prediction_id', 'exact_claim', 'entity', 'market', 'mechanism', 'created_at', 'frozen_at',
    'prediction_horizon', 'expected_window', 'initial_confidence', 'success_condition', 'falsification_condition',
    'known_evidence_at_freeze', 'source_refs', 'author', 'parent'];
  function predictionHashInput(p) {
    const o = {}; PRED_FROZEN_FIELDS.forEach(k => { o[k] = p[k] === undefined ? null : p[k]; });
    return canonical(o);
  }

  /* ---------- normalization of legacy (daily-board-v1) records ---------- */
  const LEGACY_DIR = { supports: 'supports', weakens: 'weakens', open: 'open', mixed: 'open' };
  function normalizeLegacy(rec) {
    return {
      id: rec.id, market: rec.market, mechanism: rec.mechanism, claim: rec.claim, date: rec.date,
      direction: LEGACY_DIR[rec.direction || rec.dir] || 'open', state: rec.state || rec.evidence || 'unknown', note: rec.note,
      entity: rec.entity || null, evidence: rec.evidence || null, magnitude: rec.mag || rec.magnitude || null,
      source_refs: rec.source_refs || [], frozen_prediction_ref: rec.frozen_prediction_ref || null,
      audit_status: rec.audit_status || 'unknown', created_at: rec.created_at || null, updated_at: rec.updated_at || null,
      schema: rec.schema || 'daily-board-v1', semantics: rec.semantics || 'legacy', derived: true
    };
  }

  /* ---------- validation ---------- */
  function validateEvent(journal, ev, opts = {}) {
    const errors = [], warnings = [];
    const entities = byId(journal.entities), mechanisms = byId(journal.mechanisms), sources = byId(journal.sources);
    const preds = byId(journal.predictions, 'prediction_id');
    const events = journal.events || [];
    const evById = byId(events, 'event_id');
    const req = (cond, msg) => { if (!cond) errors.push(msg); };

    req(ev && typeof ev === 'object', 'event must be an object');
    if (!ev) return { ok: false, errors, warnings };
    req(ev.event_id && !evById[ev.event_id], 'event_id missing or already exists (journal is append-only; ids are never reused)');
    req(EVENT_KINDS.includes(ev.kind), 'kind must be one of ' + EVENT_KINDS.join('|'));
    req(AUDIT.includes(ev.audit_status), 'audit_status must be one of ' + AUDIT.join('|'));
    req(ev.proposed_by && ev.proposed_by.actor && ['model', 'human'].includes(ev.proposed_by.role), 'proposed_by {actor, role:model|human} required');
    req(ev.date, 'date (event date) required');
    req(ev.posted_at, 'posted_at required');
    if (ev.entity_id) req(entities[ev.entity_id], 'unknown entity_id ' + ev.entity_id);
    if (ev.mechanism_id) req(mechanisms[ev.mechanism_id], 'unknown mechanism_id ' + ev.mechanism_id);
    (ev.source_refs || []).forEach(s => req(sources[s], 'unknown source_ref ' + s));
    (ev.counterevidence_refs || []).forEach(s => req(sources[s] || evById[s], 'unknown counterevidence_ref ' + s));
    (ev.prediction_refs || []).forEach(p => req(preds[p], 'unknown prediction_ref ' + p));
    if (ev.parent_event_id) req(evById[ev.parent_event_id], 'unknown parent_event_id ' + ev.parent_event_id);
    if (ev.supersedes) req(evById[ev.supersedes], 'supersedes references unknown event ' + ev.supersedes);
    if (ev.replication_of) {
      const orig = evById[ev.replication_of];
      req(orig, 'replication_of references unknown event');
      if (orig) req(orig.entity_id !== ev.entity_id, 'replication_of must point to an event at a DIFFERENT entity (same-entity repeats are not replication)');
      req(ev.causal_link, 'replication requires causal_link: shared-cause|independent-adoption|copied-policy|regulatory-common-cause|unknown');
    }

    // Human authority: a model may not settle its own proposal.
    if (SETTLED_AUDIT.has(ev.audit_status)) {
      req(ev.adjudicated_by && ev.adjudicated_by.actor, 'ADJUDICATED/POSTED requires adjudicated_by');
      if (ev.adjudicated_by) req(ev.adjudicated_by.role === 'human', 'MODEL SELF-SETTLEMENT BLOCKED: adjudicated_by.role must be human');
    }

    // Transitions
    if (ev.kind === 'transition' || ev.new_state) {
      req(STATES.includes(ev.new_state), 'new_state must be one of ' + STATES.join('|'));
      req(ev.entity_id, 'transition requires entity_id');
      const view = derive(journal, { asOf: null, includeInternal: true });
      const lane = view.lanes[laneKey(ev.entity_id, ev.mechanism_id)];
      const current = lane ? lane.state : 'WATCH';
      // A proposal may chain on the tail of an earlier unsettled proposal (adjudicate in order), or on the settled state.
      const pendingTail = lane && lane.pending.length ? lane.pending[lane.pending.length - 1].to : null;
      const acceptable = [current].concat(pendingTail ? [pendingTail] : []);
      req(acceptable.includes(ev.previous_state), `BAD TRANSITION: previous_state "${ev.previous_state}" does not match derived current state "${current}"${pendingTail ? ` (or pending proposal tail "${pendingTail}")` : ''} for lane ${laneKey(ev.entity_id, ev.mechanism_id)}`);
      if (SETTLED_AUDIT.has(ev.audit_status)) req(ev.previous_state === current, `SETTLED transition must start from the SETTLED state "${current}", not from an unsettled proposal`);
      if (ev.new_state === 'AP' && ev.previous_state === 'WATCH') warnings.push('WATCH → AP skips AR: acceptable only for a long-standing opening; durability_evidence must say so');
      req(ev.transition_reason, 'transition_reason required');
      if (['AR', 'AP', 'ASH', 'REOPEN', 'POSTED'].includes(ev.new_state)) req((ev.source_refs || []).length > 0, `${ev.new_state} requires at least one source_ref (no unexplained arrows)`);
      if (ev.new_state === 'AP') req(ev.durability_evidence, 'AP requires durability_evidence (a release alone stays AR)');
      if (ev.new_state === 'ASH') {
        const sc = ev.scope || {};
        ['technical_lane', 'geographic', 'platform', 'user', 'temporal'].forEach(k => req(sc[k], 'ASH requires scope.' + k));
        req(Array.isArray(ev.known_workarounds), 'ASH requires known_workarounds[] (may be empty, must be declared)');
        req(Array.isArray(ev.known_exceptions), 'ASH requires known_exceptions[] (may be empty, must be declared)');
        req(Array.isArray(ev.counterevidence_refs), 'ASH requires counterevidence_refs[] (declare what was considered)');
        if (Array.isArray(ev.known_workarounds) && ev.known_workarounds.length) errors.push('ASH REFUSED: relevant openings/workarounds remain (' + ev.known_workarounds.join('; ') + '). Use a narrower state.');
        if (Array.isArray(ev.known_exceptions) && ev.known_exceptions.length) errors.push('ASH REFUSED: exceptions remain (' + ev.known_exceptions.join('; ') + '). Use a narrower state.');
      }
      if (ev.new_state === 'REOPEN') {
        const p = ev.parent_event_id && evById[ev.parent_event_id];
        req(p && p.new_state === 'ASH' && p.entity_id === ev.entity_id, 'REOPEN must link parent_event_id to the ASH event it reopens (same entity)');
        req(ev.previous_state === 'ASH', 'REOPEN only follows ASH');
      }
    }

    // Duplicate receipts: same lane + same kind + identical source set + same direction.
    const sig = x => canonical({ e: x.entity_id || null, m: x.mechanism_id || null, k: x.kind, d: x.direction || null, s: [...(x.source_refs || [])].sort(), c: [...(x.claim_refs || [])].sort(), p: [...(x.prediction_refs || [])].sort() });
    if ((ev.source_refs || []).length && !ev.replication_of && !ev.supersedes && ['evidence', 'observation', 'counterpart', 'replication'].includes(ev.kind)) {
      const dup = events.find(x => sig(x) === sig(ev));
      if (dup) errors.push('DUPLICATE RECEIPT: identical lane/kind/direction/source set already posted as ' + dup.event_id + '. Link it (parent_event_id / replication_of) instead of re-counting.');
    }

    // Predictions
    if (ev.kind === 'prediction-freeze') {
      (ev.prediction_refs || []).forEach(pid => {
        const already = events.some(x => x.kind === 'prediction-freeze' && (x.prediction_refs || []).includes(pid));
        req(!already, `PREDICTION ${pid} IS ALREADY FROZEN. Post-hoc re-freeze refused; create a descendant (${pid}-R1).`);
      });
    }
    if (ev.kind === 'prediction-resolution') {
      req((ev.prediction_refs || []).length === 1, 'prediction-resolution must reference exactly one prediction');
      req(['RECEIVED', 'PARTIAL', 'MISSED', 'FALSIFIED', 'CLOSED'].includes(ev.resolution), 'resolution must be RECEIVED|PARTIAL|MISSED|FALSIFIED|CLOSED');
      const pid = (ev.prediction_refs || [])[0], p = preds[pid];
      if (p) {
        req(p.frozen_at, 'cannot resolve an unfrozen prediction');
        if (p.content_hash) req(sha256(predictionHashInput(p)) === p.content_hash, `PREDICTION ${pid} CONTENT HASH MISMATCH — prediction text was altered after freeze; refuse to settle`);
        // hindsight guard: evidence used must post-date the freeze
        (ev.source_refs || []).forEach(s => { const src = sources[s]; if (src && src.published && p.frozen_at && dateOf(src.published) < dateOf(p.frozen_at)) warnings.push(`source ${s} predates the freeze of ${pid} — pre-freeze evidence cannot score a prediction`); });
      }
    }
    if (ev.kind === 'prediction-extension') {
      req((ev.prediction_refs || []).length === 1 && ev.new_expected_window, 'extension requires prediction_refs[1] + new_expected_window; the original window is never rewritten');
    }
    return { ok: errors.length === 0, errors, warnings };
  }

  function validatePrediction(journal, p) {
    const errors = [];
    if (!p.prediction_id) errors.push('prediction_id required');
    if ((journal.predictions || []).some(x => x.prediction_id === p.prediction_id)) errors.push('prediction_id exists; predictions are immutable — create ' + p.prediction_id + '-R1');
    if (!p.exact_claim) errors.push('exact_claim required');
    if (!p.success_condition || !p.falsification_condition) errors.push('success_condition and falsification_condition both required (a prediction that cannot miss is rhetoric)');
    if (!p.author) errors.push('author required');
    return { ok: errors.length === 0, errors };
  }

  /* ---------- append (returns NEW journal; input untouched) ---------- */
  function appendEvent(journal, ev, opts = {}) {
    const v = validateEvent(journal, ev, opts);
    if (!v.ok && !opts.force) { const err = new Error('REJECTED: ' + v.errors.join(' | ')); err.errors = v.errors; err.warnings = v.warnings; throw err; }
    const next = clone(journal);
    const prev = next.events.length ? next.events[next.events.length - 1] : null;
    const e = clone(ev);
    e.seq = (prev ? prev.seq : 0) + 1;
    e.prev_hash = prev ? prev.content_hash : null;
    e.content_hash = sha256(eventHashInput(e, e.prev_hash));
    if (opts.force) e.forced_past_validation = v.errors;
    next.events.push(e);
    return { journal: next, event: e, warnings: v.warnings };
  }
  function freezePrediction(journal, p, opts = {}) {
    const v = validatePrediction(journal, p);
    if (!v.ok) { const err = new Error('REJECTED: ' + v.errors.join(' | ')); err.errors = v.errors; throw err; }
    const next = clone(journal), q = clone(p);
    q.frozen_at = q.frozen_at || opts.now || new Date().toISOString().slice(0, 10);
    q.content_hash = sha256(predictionHashInput(q));
    next.predictions.push(q);
    return { journal: next, prediction: q };
  }
  function sealJournal(journal) { // (re)compute chain for a seed journal authored by hand
    const next = clone(journal); let prev = null;
    next.events.forEach((e, i) => { e.seq = i + 1; e.prev_hash = prev; e.content_hash = sha256(eventHashInput(e, prev)); prev = e.content_hash; });
    next.predictions.forEach(p => { if (p.frozen_at) p.content_hash = sha256(predictionHashInput(p)); });
    return next;
  }
  function verifyChain(journal) {
    const problems = []; let prev = null;
    (journal.events || []).forEach((e, i) => {
      if (e.seq !== i + 1) problems.push(`${e.event_id}: seq ${e.seq} ≠ ${i + 1}`);
      if ((e.prev_hash || null) !== prev) problems.push(`${e.event_id}: prev_hash broken`);
      const h = sha256(eventHashInput(e, prev));
      if (h !== e.content_hash) problems.push(`${e.event_id}: content_hash mismatch (event was modified after posting)`);
      prev = e.content_hash;
    });
    return { ok: problems.length === 0, problems };
  }
  function verifyPredictions(journal) {
    return (journal.predictions || []).filter(p => p.frozen_at).map(p => ({ prediction_id: p.prediction_id, ok: sha256(predictionHashInput(p)) === p.content_hash }))
      .filter(x => !x.ok);
  }

  /* ---------- prediction aging ---------- */
  function agePrediction(p, events, asOf) {
    const now = dateOf(asOf) || new Date();
    const res = events.filter(e => e.kind === 'prediction-resolution' && isSettled(e) && (e.prediction_refs || []).includes(p.prediction_id) && (!asOf || dateOf(e.posted_at) <= now)).pop();
    const ext = events.filter(e => e.kind === 'prediction-extension' && (e.prediction_refs || []).includes(p.prediction_id) && (!asOf || dateOf(e.posted_at) <= now));
    if (!p.frozen_at) return { status: 'DRAFT', detail: 'not frozen — no content hash, not scoreable' };
    if (dateOf(p.frozen_at) > now) return { status: 'DRAFT', detail: 'frozen after asOf' };
    if (res) return { status: res.resolution, detail: 'resolved by ' + res.event_id + ' (' + res.posted_at + ')', resolvedBy: res.event_id };
    const w = p.expected_window;
    if (!w || !w.end) return { status: 'NO WINDOW STATED', detail: 'cannot age; cannot miss; recommend a dated descendant', extensions: ext.map(e => e.event_id) };
    const start = dateOf(w.start || p.frozen_at), end = dateOf(w.end);
    const frac = (now - start) / (end - start);
    let status = frac < 0.1 ? 'NEW' : frac < 0.75 ? 'ACTIVE' : frac < 1 ? 'NEAR MATURITY' : (now - end) / 864e5 <= 90 ? 'MATURED' : 'OVERDUE';
    if (ext.length && frac >= 1) status = 'EXTENSION PROPOSED';
    return { status, detail: `window ${w.start || p.frozen_at} → ${w.end}; ${Math.round(frac * 100)}% elapsed`, elapsed: frac, extensions: ext.map(e => e.event_id) };
  }

  /* ---------- derivation ---------- */
  function derive(journal, opts = {}) {
    const asOf = opts.asOf ? dateOf(opts.asOf) : null;
    const includeInternal = !!opts.includeInternal;
    const entities = byId(journal.entities), mechanisms = byId(journal.mechanisms), sources = byId(journal.sources);
    const preds = journal.predictions || [];
    const allEvents = (journal.events || []).slice().sort((a, b) => a.seq - b.seq);
    const events = allEvents.filter(e => (!asOf || dateOf(e.posted_at) <= asOf) && (includeInternal || e.visibility !== 'internal'));
    const evById = byId(events, 'event_id');
    const supersededBy = {}; events.forEach(e => { if (e.supersedes) supersededBy[e.supersedes] = e.event_id; });
    const childrenOf = {}; events.forEach(e => { if (e.parent_event_id) (childrenOf[e.parent_event_id] = childrenOf[e.parent_event_id] || []).push(e.event_id); });
    const correctionsOf = {}; events.forEach(e => { if (e.kind === 'correction' && (e.parent_event_id || e.supersedes)) { const t = e.parent_event_id || e.supersedes; (correctionsOf[t] = correctionsOf[t] || []).push(e.event_id); } });
    const replicationsOf = {}; events.forEach(e => { if (e.replication_of) (replicationsOf[e.replication_of] = replicationsOf[e.replication_of] || []).push(e.event_id); });

    // lanes: entity×mechanism state from settled transitions
    const lanes = {};
    const laneOf = (eid, mid) => { const k = laneKey(eid, mid); return lanes[k] || (lanes[k] = { key: k, entity_id: eid, mechanism_id: mid || null, state: 'WATCH', history: [], pending: [], evidence: [] }); };
    events.forEach(e => {
      if (!e.entity_id) return;
      const lane = laneOf(e.entity_id, e.mechanism_id);
      if (e.new_state) {
        if (isSettled(e)) { lane.history.push({ event_id: e.event_id, from: e.previous_state, to: e.new_state, date: e.date, posted_at: e.posted_at, reason: e.transition_reason, by: e.adjudicated_by }); lane.state = e.new_state; }
        else lane.pending.push({ event_id: e.event_id, from: e.previous_state, to: e.new_state, by: e.proposed_by, audit_status: e.audit_status });
      }
      if (e.direction) lane.evidence.push(e.event_id);
    });

    // scoring: per event component
    const srcWeight = e => { const ts = (e.source_refs || []).map(s => (sources[s] || {}).type || 'unknown'); if (!ts.length) return 0; return Math.max(...ts.map(t => WEIGHTS.bySourceType[t] ?? 0)); };
    const componentOf = e => {
      if (!isSettled(e)) return { event_id: e.event_id, value: WEIGHTS.proposed, why: 'PROPOSED — not counted', pending: true };
      if (e.kind === 'prediction-resolution') return { event_id: e.event_id, value: e.resolution === 'RECEIVED' ? WEIGHTS.predictionHit : e.resolution === 'PARTIAL' ? WEIGHTS.predictionHit / 2 : ['MISSED', 'FALSIFIED'].includes(e.resolution) ? WEIGHTS.predictionMiss : 0, why: 'prediction ' + e.resolution };
      if (!e.direction || e.direction === 'open') return { event_id: e.event_id, value: 0, why: 'open / no direction' };
      const w = srcWeight(e), sign = e.direction === 'supports' ? 1 : -1;
      return { event_id: e.event_id, value: sign * w, why: `${e.direction} × strongest source weight ${w}` + (e.replication_of ? ' (replication: counts to MECHANISM only)' : '') };
    };

    const entityViews = {};
    Object.values(entities).forEach(ent => {
      if (!includeInternal && ent.visibility === 'internal') return;
      const evs = events.filter(e => e.entity_id === ent.id);
      const comps = evs.filter(e => e.direction || e.kind === 'prediction-resolution').map(e => ({ ...componentOf(e), replication: !!e.replication_of }));
      // replication events do not add to the original entity; they DO count for the replicating entity's own lane, but are flagged
      const total = comps.filter(c => !c.pending).reduce((a, c) => a + c.value, 0);
      const entLanes = Object.values(lanes).filter(l => l.entity_id === ent.id);
      const lastSettled = [...evs].reverse().find(e => isSettled(e) && (e.new_state || e.direction));
      const state = entLanes.map(l => l.history[l.history.length - 1]).filter(Boolean).sort((a, b) => (evById[a.event_id].seq - evById[b.event_id].seq)).pop();
      const lastMove = [...evs].reverse().find(e => isSettled(e) && e.direction && e.direction !== 'open');
      entityViews[ent.id] = {
        ...ent, state: state ? state.to : 'WATCH', stateEvent: state ? state.event_id : null,
        lanes: entLanes, score: { total, components: comps, weights: WEIGHTS.version },
        movement: lastMove ? (lastMove.direction === 'supports' ? 'up' : 'down') : 'flat', movementEvent: lastMove ? lastMove.event_id : null,
        pending: entLanes.flatMap(l => l.pending), events: evs.map(e => e.event_id), lastPosted: lastSettled ? lastSettled.posted_at : null
      };
    });

    // mechanism aggregates (replication counts here)
    const mechanismViews = {};
    Object.values(mechanisms).forEach(m => {
      const evs = events.filter(e => e.mechanism_id === m.id && isSettled(e) && e.direction);
      const comps = evs.map(e => ({ ...componentOf(e), entity_id: e.entity_id, replication: !!e.replication_of, value: componentOf(e).value + (e.replication_of ? WEIGHTS.replicationToMechanism : 0), why: componentOf(e).why + (e.replication_of ? ` + replication bonus ${WEIGHTS.replicationToMechanism} (${e.causal_link})` : '') }));
      const ents = [...new Set(evs.map(e => e.entity_id))];
      mechanismViews[m.id] = { ...m, entities: ents, score: { total: comps.reduce((a, c) => a + c.value, 0), components: comps, weights: WEIGHTS.version }, independentAdoptions: evs.filter(e => e.replication_of && e.causal_link === 'independent-adoption').length, commonCause: evs.filter(e => e.replication_of && ['regulatory-common-cause', 'copied-policy', 'shared-cause'].includes(e.causal_link)).length };
    });

    // indices (reversible)
    const indices = (journal.indices || []).map(ix => {
      const members = ix.entity_ids ? ix.entity_ids.filter(id => entityViews[id]) : Object.keys(entityViews).filter(id => entityViews[id].market === ix.market);
      const comps = members.map(id => ({ entity_id: id, symbol: entityViews[id].symbol, value: entityViews[id].score.total }));
      return { ...ix, members, score: { total: comps.reduce((a, c) => a + c.value, 0), components: comps } };
    });

    // books
    const arBook = Object.values(lanes).filter(l => l.state === 'AR' && entityViews[l.entity_id]).map(l => ({ ...l, entity: entityViews[l.entity_id] }));
    const apBook = Object.values(lanes).filter(l => l.state === 'AP' && entityViews[l.entity_id]).map(l => ({ ...l, entity: entityViews[l.entity_id] }));
    const apCandidates = Object.values(lanes).filter(l => l.pending.some(p => p.to === 'AP') && entityViews[l.entity_id]).map(l => ({ ...l, entity: entityViews[l.entity_id] }));
    const arCandidates = Object.values(lanes).filter(l => l.pending.some(p => p.to === 'AR') && entityViews[l.entity_id]).map(l => ({ ...l, entity: entityViews[l.entity_id] }));

    // predictions
    const predictionViews = preds.filter(p => includeInternal || p.visibility !== 'internal').map(p => {
      const linked = events.filter(e => (e.prediction_refs || []).includes(p.prediction_id));
      const hashOk = p.frozen_at ? sha256(predictionHashInput(p)) === p.content_hash : null;
      const cur = [...linked].reverse().find(e => e.current_confidence != null);
      return { ...p, aging: agePrediction(p, events, opts.asOf), linkedEvents: linked.map(e => e.event_id), hashOk, current_confidence: cur ? cur.current_confidence : null, descendants: preds.filter(q => q.parent === p.prediction_id).map(q => q.prediction_id) };
    });

    // claims
    const claimViews = (journal.claims || []).map(c => {
      const linked = events.filter(e => (e.claim_refs || []).includes(c.id));
      const support = linked.filter(e => isSettled(e) && e.direction === 'supports').map(e => e.event_id);
      const counter = linked.filter(e => isSettled(e) && e.direction === 'weakens').map(e => e.event_id);
      const open = linked.filter(e => !isSettled(e) || e.direction === 'open').map(e => e.event_id);
      const adj = [...linked].reverse().find(e => e.kind === 'adjudication' && isSettled(e) && e.claim_status);
      const predIds = predictionViews.filter(p => (p.claim_refs || []).includes(c.id)).map(p => p.prediction_id);
      const hits = predictionViews.filter(p => predIds.includes(p.prediction_id) && ['RECEIVED', 'PARTIAL'].includes(p.aging.status)).length;
      const misses = predictionViews.filter(p => predIds.includes(p.prediction_id) && ['MISSED', 'FALSIFIED'].includes(p.aging.status)).length;
      const derivedStatus = adj ? adj.claim_status : (counter.length && !support.length ? 'UNDER PRESSURE' : counter.length ? 'WEAKENED' : support.length ? 'SURVIVING' : 'UNRESOLVED');
      const ageDays = c.created_at ? Math.round(((asOf || new Date()) - dateOf(c.created_at)) / 864e5) : null;
      return { ...c, support, counter, open, predictions: predIds, hits, misses, ageDays, status: derivedStatus, statusSource: adj ? 'ADJUDICATED by ' + (adj.adjudicated_by || {}).actor + ' (' + adj.event_id + ')' : 'DERIVED from counts (no human adjudication yet)', descendants: (journal.claims || []).filter(d => d.parent === c.id).map(d => d.id) };
    });

    // graveyard
    const graveyard = [
      ...predictionViews.filter(p => ['MISSED', 'FALSIFIED'].includes(p.aging.status)).map(p => ({ kind: 'prediction', id: p.prediction_id, label: p.exact_claim, status: p.aging.status, ref: p.aging.resolvedBy })),
      ...claimViews.filter(c => ['FALSIFIED', 'PARTIALLY FALSIFIED', 'NOT ESTABLISHED'].includes(c.status)).map(c => ({ kind: 'claim', id: c.id, label: c.text, status: c.status, ref: c.statusSource })),
      ...Object.values(lanes).filter(l => l.history.some(h => h.to === 'ASH')).map(l => ({ kind: 'lane-closure', id: l.key, label: 'ASH recorded on ' + l.key, status: l.state === 'ASH' ? 'ASH (current)' : 'ASH → ' + l.state + ' (historical closure retained)', ref: l.history.filter(h => h.to === 'ASH').map(h => h.event_id).join(',') })),
      ...events.filter(e => supersededBy[e.event_id]).map(e => ({ kind: 'superseded-event', id: e.event_id, label: e.title || e.kind, status: 'superseded by ' + supersededBy[e.event_id] + ' (original retained)', ref: supersededBy[e.event_id] }))
    ];

    // wire
    const wire = [...events].sort((a, b) => (dateOf(b.posted_at) - dateOf(a.posted_at)) || (b.seq - a.seq)).map(e => ({ event_id: e.event_id, posted_at: e.posted_at, date: e.date, symbol: e.entity_id ? (entities[e.entity_id] || {}).symbol : (e.mechanism_id ? (mechanisms[e.mechanism_id] || {}).symbol : 'GC:LEDGER'), headline: e.title || (e.new_state ? `${e.previous_state} → ${e.new_state}` : e.kind.toUpperCase()), kind: e.kind, direction: e.direction || null, audit_status: e.audit_status, transition: e.new_state ? `${e.previous_state} → ${e.new_state}` : null, visibility: e.visibility || 'public' }));

    // matrix entity × mechanism
    const matrix = {};
    Object.values(lanes).forEach(l => { if (!l.mechanism_id || !entityViews[l.entity_id]) return; (matrix[l.entity_id] = matrix[l.entity_id] || {})[l.mechanism_id] = { state: l.state, evidence: l.evidence.length, pending: l.pending.length, supports: l.evidence.filter(id => evById[id].direction === 'supports' && isSettled(evById[id])).length, weakens: l.evidence.filter(id => evById[id].direction === 'weakens' && isSettled(evById[id])).length }; });

    const legacy = (journal.legacy_records || []).map(normalizeLegacy);
    const chain = verifyChain(journal), tampered = verifyPredictions(journal);
    const validation = { chain, tamperedPredictions: tampered, warnings: [] };
    if (!apBook.length) validation.warnings.push('A/P BOOK IS EMPTY: no adjudicated durable opening. Either the world has produced none (unlikely) or the ledger is under-recording openings (§17 risk).');
    predictionViews.filter(p => p.aging.status === 'NO WINDOW STATED').forEach(p => validation.warnings.push(`${p.prediction_id} has no expected_window — it cannot miss. Recommend a dated descendant.`));

    return { asOf: opts.asOf || null, includeInternal, entities: entityViews, mechanisms: mechanismViews, indices, lanes, arBook, apBook, arCandidates, apCandidates, predictions: predictionViews, claims: claimViews, graveyard, wire, matrix, legacy, events: evById, allEvents: events, sources, supersededBy, childrenOf, correctionsOf, replicationsOf, validation, weights: WEIGHTS };
  }

  function thenVsNow(journal, thenDate, opts = {}) {
    const a = derive(journal, { ...opts, asOf: thenDate }), b = derive(journal, { ...opts, asOf: opts.nowDate || null });
    const rows = Object.keys(b.entities).map(id => ({ entity_id: id, symbol: b.entities[id].symbol, then: a.entities[id] ? a.entities[id].state : '—', now: b.entities[id].state, thenScore: a.entities[id] ? a.entities[id].score.total : null, nowScore: b.entities[id].score.total, changed: !a.entities[id] || a.entities[id].state !== b.entities[id].state || a.entities[id].score.total !== b.entities[id].score.total }));
    return { then: a, now: b, rows };
  }

  /* ---------- legacy adapter: daily-board-v1 JSON → journal-compatible overlay (never mutates the input) ---------- */
  function adaptDailyBoard(data) {
    return { legacy_records: (data.records || []).map(r => ({ ...r, schema: 'daily-board-v1', semantics: 'legacy: state=VERIFIED/OPEN evidence label; direction=supports/weakens/open' })),
      legacy_receipts: (data.receipts || []).map(r => ({ ...r, schema: 'daily-board-v1', semantics: 'legacy: ACCOUNTS RECEIVABLE = live prediction (main-page meaning), NOT the AR-AP-v2 meaning' })), meta: data.meta || {} };
  }

  return { STATES, AUDIT, EVENT_KINDS, AGING, CLAIM_STATUS, WEIGHTS, canonical, sha256, validateEvent, validatePrediction, appendEvent, freezePrediction, sealJournal, verifyChain, verifyPredictions, agePrediction, derive, thenVsNow, adaptDailyBoard, normalizeLegacy, predictionHashInput, eventHashInput, laneKey };
});
