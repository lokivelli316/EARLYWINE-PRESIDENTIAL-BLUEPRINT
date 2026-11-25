/* ============================================================
   === CONFIG START ===
   Edit this block to retarget the terminal at a different
   project / data sources / brand text. Nothing below the
   marker should need changing.
   ============================================================ */
const BRAND = 'GATE://EVIDENCE TERMINAL';   // visible brand text
const MAIN_PAGE_URL = 'https://lokivelli316.github.io/EARLYWINE-PRESIDENTIAL-BLUEPRINT/gate-closing-build/gate-closing-preview.html'; // linked from receipts
const SOURCES = [
  // Authority order matters: canonical JSON wins duplicate IDs; legacy page is compatibility fallback only.
  { id:'gate-archive', label:'Canonical JSON',   url:'./sample-daily-update.json', type:'json' },
  { id:'gate-json',    label:'Published JSON',   url:'https://lokivelli316.github.io/EARLYWINE-PRESIDENTIAL-BLUEPRINT/gate-closing-build/sample-daily-update.json', type:'json' },
  { id:'gate-main',    label:'Legacy Gate Main', url:'https://lokivelli316.github.io/EARLYWINE-PRESIDENTIAL-BLUEPRINT/gate-closing-build/gate-closing-preview.html', type:'html' }
];
const MARKETS = ['All','Music','Publishing','Scholarly','Cross-cutting'];
const PREF_KEY = 'gate.evidence.terminal.v1';
const CACHE_KEY = 'gate.evidence.terminal.cache.v1';
const CACHE_TTL_MS = 1000 * 60 * 30;   // 30 minutes
/* === CONFIG END === ========================================= */

/* --- 1. Embedded fallback data (used if every source fails) --- */
const FALLBACK_RECORDS = [
  {id:'M-1',market:'Music',mechanism:'Monetization threshold',claim:'Spotify: 1,000 trailing annual streams required for recorded royalty eligibility.',evidence:'VERIFIED',date:'Observed · Apr 2024',mag:'1,000 streams',dir:'supports',note:'Does not establish anti-creator intent; does not affect publishing royalties.'},
  {id:'M-2',market:'Music',mechanism:'Licensed-lane construction',claim:'Spotify + major rights holders announced artist-first generative-AI collaboration under opt-in licensing structures.',evidence:'VERIFIED',date:'Observed · Oct 2025',mag:'Structural',dir:'supports',note:'Direct coordination inside music; not evidence of cross-market command.'},
  {id:'M-3',market:'Music',mechanism:'Export restriction',claim:'Udio downloads remained disabled during the UMG transition.',evidence:'VERIFIED',date:'Confirmed · Feb 2026',mag:'Downloads disabled',dir:'supports',note:'Strong creation-side pincer example.'},
  {id:'M-4',market:'Music',mechanism:'Open technical counter',claim:'Stable Audio 3.0 released open-weight models.',evidence:'VERIFIED',date:'Observed · May 2026',mag:'Open weights',dir:'weakens',note:'Kills universal technical-closure parent claim.'},
  {id:'M-5',market:'Music',mechanism:'Discovery restriction',claim:'Spotify AI Persona / Likely AI Persona profiles announced for default exclusion from recommendations.',evidence:'VERIFIED',date:'Announced · Aug 2026',mag:'Default discovery exclusion',dir:'supports',note:'Targets AI-persona identity, not all AI-assisted music.'},
  {id:'P-1',market:'Publishing',mechanism:'AI disclosure',claim:'KDP requires disclosure of AI-generated text, images or translations; AI-assisted work is exempt.',evidence:'VERIFIED',date:'Since · Sep 2023',mag:'Disclosure gate',dir:'supports',note:'Disclosure is not itself a customer-facing ban.'},
  {id:'P-2',market:'Publishing',mechanism:'Volume gate',claim:'KDP current help limits title creation to 10 titles per book format each week.',evidence:'VERIFIED',date:'Snapshot · Aug 2026',mag:'10/week/format',dir:'supports',note:'Exact revision date from the older 3/day rule is not recovered.'},
  {id:'P-3',market:'Publishing',mechanism:'Authorized AI expansion',claim:'Audible and ACX expand AI narration/voice-replica use inside authorized and labeled channels.',evidence:'VERIFIED',date:'Observed · 2025–2026',mag:'Authorized lane',dir:'weakens',note:'Counterexample to a simple anti-AI ratchet.'},
  {id:'S-1',market:'Scholarly',mechanism:'Verification',claim:'arXiv endorsement requirements increased friction for new/unaffiliated submitters.',evidence:'VERIFIED',date:'Observed · 2025–2026',mag:'Endorsement gate',dir:'supports',note:'Source does not establish generative AI as the cause.'},
  {id:'S-2',market:'Scholarly',mechanism:'Human-basis policy',claim:'Zenodo permits AI as a tool but rejects raw AI-only/bulk AI deposits without verifiable human research basis.',evidence:'VERIFIED',date:'Observed · Apr 2026',mag:'Human basis required',dir:'supports',note:'Tightening with permitted use, not a blanket ban.'},
  {id:'C-1',market:'Cross-cutting',mechanism:'Provenance / transparency',claim:'EU AI Act transparency obligations began applying to covered synthetic media/content.',evidence:'VERIFIED',date:'Observed · Aug 2026',mag:'Transparency gate',dir:'supports',note:'Regulatory pressure; not evidence of private cross-market coordination.'},
  {id:'C-2',market:'Cross-cutting',mechanism:'Acquisition / provenance litigation',claim:'Sony Music Publishing and Warner Chappell sued Anthropic alleging unlawful acquisition of copyrighted works for Claude development.',evidence:'VERIFIED',date:'Filed · Aug 28 2026',mag:'Post-freeze receipt',dir:'supports',note:'Allegations are not a judgment.'}
];
const FALLBACK_RECEIPTS = [
  {state:'RECEIPT POSTED',title:'Hosted / monetized lane',text:'Governed convenient lanes continue to show stronger controls.',kind:'support'},
  {state:'RECEIPT POSTED',title:'Cross-market governed-lane herding',text:'HOLDS — NARROWED. Similar primitives recur; unified command not established.',kind:'support'},
  {state:'ACCOUNTS RECEIVABLE',title:'KDP discoverability descendant',text:'Open prediction. Needs a consequential discovery/provenance gate to cash.',kind:'open'},
  {state:'ASH → DESCENDANT',title:'Universal technical closure',text:'Parent remains ash; hosted-access asymmetry remains live.',kind:'counter'},
  {state:'OPEN SOURCE WATCH',title:'Hugging Face / open model governance',text:'Pressure watch only.',kind:'open'},
  {state:'HIGH SUPPORT',title:'Plan-and-meter control plane',text:'Capability + organizational context increasingly routed through plan, identity, meter and entitlement.',kind:'support'}
];
const FALLBACK_AR = ['KDP discoverability major gate','Open-source governance second-stage restriction','Physical ownership / functional permission gap','Further AI-search eligibility/provenance controls'];
const FALLBACK_AP = ['Universal technical closure — ASH','Stable six-month cadence — FAILED/REVISED','Open source is already closing — contrary/opening evidence','KDP tightening right now — release evidence','Broad unified coordination — unproven'];

/* --- 2. Multi-source ingestion with cache + CORS-safe fallback --- */
function loadCache(){
  try{ const raw=localStorage.getItem(CACHE_KEY); if(!raw) return {}; const parsed=JSON.parse(raw)||{}; return parsed.sources||parsed; }catch{ return {}; }
}
function saveCache(map){
  try{ localStorage.setItem(CACHE_KEY, JSON.stringify({savedAt:Date.now(), sources:map})); }catch{}
}

function cacheFresh(entry){
  if(!entry||!entry.savedAt) return false;
  return (Date.now()-entry.savedAt) < CACHE_TTL_MS;
}
function normalizeRecord(r, sourceId){
  // Backward compatible: legacy records may have only direction/state and no extended lineage fields.
  const dir = r.dir || r.direction || 'open';
  const legacyEvidence = r.evidence || ((r.state && !['WATCH','AR','AP','POSTED','ASH','REOPEN'].includes(String(r.state).toUpperCase())) ? r.state : null) || 'OPEN';
  let gcState = String(r.gc_state || r.gate_state || ((r.state && ['WATCH','AR','AP','POSTED','ASH','REOPEN'].includes(String(r.state).toUpperCase())) ? r.state : '') || '').toUpperCase();
  if(!gcState){
    // Legacy inference is deliberately conservative. Direction is evidence posture, not Gate Closing state.
    gcState = dir==='open' ? 'AR' : 'WATCH';
  }
  const transitions = Array.isArray(r.transitions) ? r.transitions.slice() : [];
  return Object.assign({}, r, {
    dir,
    evidence: legacyEvidence,
    gc_state: gcState,
    entity: r.entity || r.company || r.company_entity || r.market || 'Unknown',
    source_refs: Array.isArray(r.source_refs) ? r.source_refs : [],
    counterevidence_refs: Array.isArray(r.counterevidence_refs) ? r.counterevidence_refs : [],
    receipt_refs: Array.isArray(r.receipt_refs) ? r.receipt_refs : [],
    prediction_refs: Array.isArray(r.prediction_refs) ? r.prediction_refs : (r.frozen_prediction_ref ? [r.frozen_prediction_ref] : []),
    transitions,
    herd_role: r.herd_role || 'UNKNOWN',
    causal_status: r.causal_status || 'UNKNOWN',
    independent_receipt: r.independent_receipt === true,
    audit_status: r.audit_status || 'PROPOSED',
    _src: sourceId
  });
}
function normalizeReceipt(r, sourceId){
  const kind = r.kind || (r.state==='RECEIPT POSTED'?'support':r.state==='ASH → DESCENDANT'?'counter':'open');
  return Object.assign({}, r, { kind, _src: sourceId });
}
async function fetchSource(src){
  const cache = loadCache();
  const cached = cache[src.id];
  if(cached && cacheFresh(cached)){ return Object.assign({ok:true, fromCache:true}, cached.payload); }
  try{
    const res = await fetch(src.url, { cache:'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const text = await res.text();
    let payload;
    if(src.type==='json'){
      const json = JSON.parse(text);
      payload = {
        records: (json.records||[]).map(r=>normalizeRecord(r, src.id)),
        receipts: (json.receipts||[]).map(r=>normalizeReceipt(r, src.id)),
        meta: json.meta || null
      };
    } else {
      // type:'html' — pull the records=[…] literal out of the inline <script>
      const m = text.match(/const\s+records\s*=\s*(\[[\s\S]*?\]);/);
      const records = m ? (eval('('+m[1]+')')||[]) : [];
      const mr = text.match(/const\s+receipts\s*=\s*(\[[\s\S]*?\]);/);
      const receipts = mr ? (eval('('+mr[1]+')')||[]) : [];
      payload = { records: records.map(r=>normalizeRecord(r, src.id)), receipts: receipts.map(r=>normalizeReceipt(r, src.id)), meta:null };
    }
    cache[src.id] = { savedAt: Date.now(), payload };
    saveCache(cache);
    return Object.assign({ok:true, fromCache:false}, payload);
  }catch(err){
    return { ok:false, error: String(err.message||err), fromCache:false };
  }
}
async function ingest(){
  const results = await Promise.all(SOURCES.map(fetchSource));
  const ok = results.filter(r=>r.ok);
  const records = [].concat(...ok.map(r=>r.records||[]));
  const receipts = [].concat(...ok.map(r=>r.receipts||[]));
  // de-dupe by id (first wins)
  const seen = new Set();
  const dedupRecords = records.filter(r=>{ if(!r.id||seen.has(r.id)) return false; seen.add(r.id); return true; });
  const seenR = new Set();
  const dedupReceipts = receipts.filter((r,i)=>{ const k=(r.title||'')+'|'+(r.date||'')+'|'+i; if(seenR.has(k)) return false; seenR.add(k); return true; });
  if(dedupRecords.length === 0){ // total failure — use embedded fallback
    return {
      records: FALLBACK_RECORDS.map(r=>Object.assign({},r,{_src:'fallback'})),
      receipts: FALLBACK_RECEIPTS.map(r=>Object.assign({},r,{_src:'fallback'})),
      ar: FALLBACK_AR.slice(), ap: FALLBACK_AP.slice(),
      sourceResults: results.map((r,i)=>({ id:SOURCES[i].id, label:SOURCES[i].label, ok:r.ok, fromCache:r.fromCache, error:r.error||null })),
      usedFallback: true
    };
  }
  return {
    records: dedupRecords,
    receipts: dedupReceipts,
    ar: dedupRecords.filter(r=>r.gc_state==='AR').slice(0,6).map(r=>r.claim.slice(0,90)+(r.claim.length>90?'…':'')),
    ap: dedupRecords.filter(r=>r.gc_state==='AP').slice(0,6).map(r=>r.claim.slice(0,90)+(r.claim.length>90?'…':'')),
    sourceResults: results.map((r,i)=>({ id:SOURCES[i].id, label:SOURCES[i].label, ok:r.ok, fromCache:r.fromCache, error:r.error||null })),
    usedFallback: false
  };
}
