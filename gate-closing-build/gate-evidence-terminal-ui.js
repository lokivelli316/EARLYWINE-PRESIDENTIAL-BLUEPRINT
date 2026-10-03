/* --- 3. Render layer --- */
const prefs = (()=>{ try{ return JSON.parse(localStorage.getItem(PREF_KEY))||{}; }catch{ return{}; } })();
let records=[], receipts=[], ar=[], ap=[];
let market = prefs.market || 'All';
let query = '';
let edit = !!prefs.edit;
let sourceResults = [];

function save(){ try{ localStorage.setItem(PREF_KEY, JSON.stringify({market, edit})); }catch{} }

function kind(r){ return r.dir==='supports' ? 'support' : r.dir==='weakens' ? 'counter' : 'open'; }
function stateClass(s){ return String(s||'WATCH').toLowerCase(); }
function stateLabel(r){ return r.gc_state || 'WATCH'; }
function esc(v){ return String(v??'—').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c])); }
function listHtml(xs){ return (Array.isArray(xs)&&xs.length) ? '<ul class="inspect-list">'+xs.map(x=>'<li>'+esc(typeof x==='string'?x:JSON.stringify(x))+'</li>').join('')+'</ul>' : '<span style="color:var(--muted)">—</span>'; }


function renderBrand(){ document.getElementById('brand').firstChild.textContent = BRAND; }
function renderStatus(){
  const counts = ['WATCH','AR','AP','POSTED','ASH','REOPEN'].reduce((acc,state)=>{ acc[state]=records.filter(r=>stateLabel(r)===state).length; return acc; },{});
  const stats = [
    {label:'WATCH',     val: counts.WATCH,  cls:'blue'},
    {label:'A/R',       val: counts.AR,     cls:'amber'},
    {label:'A/P',       val: counts.AP,     cls:'green'},
    {label:'POSTED',    val: counts.POSTED, cls:'green'},
    {label:'ASH',       val: counts.ASH,    cls:'red'},
    {label:'REOPEN',    val: counts.REOPEN, cls:'amber'},
    {label:'SOURCES OK',val: sourceResults.filter(s=>s.ok).length +'/'+ sourceResults.length, cls: sourceResults.every(s=>s.ok)?'green':sourceResults.some(s=>s.ok)?'amber':'red'},
    {label:'RECEIPTS',  val: receipts.length, cls:'blue'}
  ];
  document.getElementById('statusstrip').innerHTML = stats.map(s=>
    `<div class="stat ${s.cls}"><span>${s.label}</span><strong>${s.val}</strong></div>`
  ).join('');
}
function renderSourcePill(){
  const ok = sourceResults.filter(s=>s.ok).length;
  const total = sourceResults.length;
  const pill = document.getElementById('sourcePill');
  pill.classList.remove('ok','warn','bad');
  let cls = 'ok';
  if(ok === 0) cls = 'bad';
  else if(ok < total) cls = 'warn';
  pill.classList.add(cls);
  const cachedNote = sourceResults.some(s=>s.fromCache) ? ' (cached)' : '';
  pill.textContent = `SOURCES ${ok}/${total}${cachedNote}`;
  pill.title = sourceResults.map(s=>`${s.label}: ${s.ok?(s.fromCache?'cached':'ok'):'FAIL '+(s.error||'')}`).join('\n');
}
function renderTicker(){
  const list = records.length ? records.slice(0,18).map(r=>({
    state: (r.symbol||('GC:'+String(r.entity||r.market||r.id).replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,10)))+'  '+stateLabel(r),
    title: (r.mechanism||r.claim||''), kind: kind(r), _record:r
  })) : (receipts.length ? receipts : FALLBACK_RECEIPTS);
  document.getElementById('ticker').innerHTML = list.concat(list).map(r=>
    `<span class="tick" ${r._record?`data-record="${esc(r._record.id)}"`:''}><b>${esc(r.state||r.status||'')}</b> <span class="${r.kind==='support'?'up':r.kind==='counter'?'down':'wait'}">${esc(r.title||r.text||'')}</span></span>`
  ).join('');
  document.querySelectorAll('#ticker [data-record]').forEach(el=>el.onclick=()=>{ const r=records.find(x=>x.id===el.dataset.record); if(r) inspectRecord(r); });
}
function renderHeat(){
  const host = document.getElementById('heatmap');
  host.innerHTML = '';
  if(!records.length){
    host.innerHTML = '<div class="heat open" style="grid-column:1/-1"><b>NO RECORDS</b><span>No sources resolved. Check the SOURCES pill above.</span></div>';
    return;
  }
  records.forEach(r=>{
    const d = document.createElement('div');
    d.className = 'heat '+kind(r);
    d.innerHTML = `<b>${r.id} · ${r.market}</b><span>${r.mechanism}</span><span class="dir">${(r.dir||'open').toUpperCase()}</span><span class="src">↳ ${r._src||'—'}</span>`;
    d.onclick = ()=>inspectRecord(r);
    host.appendChild(d);
  });
}
function renderSurvival(){
  // crude: share of supports per market, capped 0–100
  const byMarket = {};
  records.forEach(r=>{ byMarket[r.market] = byMarket[r.market] || {s:0,t:0}; byMarket[r.market].t++; if(r.dir==='supports') byMarket[r.market].s++; });
  const rows = Object.keys(byMarket).map(m=>({m, pct: byMarket[m].t?Math.round(100*byMarket[m].s/byMarket[m].t):0}));
  rows.sort((a,b)=>b.pct-a.pct);
  document.getElementById('survival').innerHTML = rows.length ? rows.map(v=>{
    const pct = v.pct;
    const color = pct>=60?'var(--green)':pct>=30?'var(--amber)':'var(--red)';
    return `<div class="meter"><div class="row"><span>${v.m}</span><b>${pct}%</b></div><div class="bar"><i style="width:${pct}%;background:${color}"></i></div></div>`;
  }).join('') : '<div class="meter"><div class="row"><span>NO DATA</span><b>—</b></div></div>';
}
function renderTape(){
  const host = document.getElementById('tapelist');
  host.innerHTML = '';
  if(!receipts.length){ host.innerHTML = '<div class="tapeitem open"><div class="k">—</div><div class="v"><b>No receipts</b><br>Pull from SOURCES to populate.</div></div>'; return; }
  receipts.forEach(r=>{
    const d = document.createElement('div');
    d.className = 'tapeitem '+(r.kind||'open');
    d.innerHTML = `<div class="k">${r.state||r.status||''}</div><div class="v"><b>${r.title||''}</b><br>${r.text||r.reading||''}</div>`;
    d.onclick = ()=>inspectReceipt(r);
    host.appendChild(d);
  });
}
function renderBooks(){
  const arRecords = records.filter(r=>stateLabel(r)==='AR');
  const apRecords = records.filter(r=>stateLabel(r)==='AP');
  const renderSide=(xs, hostId, emptyLabel)=>{
    const host=document.getElementById(hostId); host.innerHTML='';
    if(!xs.length){ host.innerHTML=`<div class="bookitem" style="color:var(--muted)">${esc(emptyLabel)}</div>`; return; }
    xs.forEach(r=>{ const d=document.createElement('div'); d.className='bookitem'; d.style.cursor='pointer'; d.innerHTML=`<b>${esc(r.symbol||r.id)}</b> · ${esc(r.entity)}<br><span style="color:var(--muted)">${esc(r.mechanism)}</span>`; d.onclick=()=>inspectRecord(r); host.appendChild(d); });
  };
  renderSide(arRecords,'arbook','No adjudicated A/R opening in the current feed.');
  renderSide(apRecords,'apbook','No adjudicated A/P durable opening in the current feed.');
}
function renderMarkets(){
  const host = document.getElementById('marketTools');
  host.innerHTML = '';
  MARKETS.forEach(m=>{
    const b = document.createElement('button');
    b.textContent = m.toUpperCase();
    b.className = m===market ? 'active' : '';
    b.onclick = ()=>{ market=m; save(); renderMarkets(); renderLedger(); };
    host.appendChild(b);
  });
}
function renderLedger(){
  const rows = records.filter(r=>(market==='All'||r.market===market)&&(!query||[r.id,r.market,r.entity,r.symbol,r.mechanism,r.claim,r.gc_state,r.evidence,r.date,r.mag,r.dir,r.note,r.herd_role,r.audit_status].join(' ').toLowerCase().includes(query)));
  const body = document.getElementById('ledgerBody');
  body.innerHTML = '';
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id||'—'}</td><td>${r.market||'—'}</td><td>${r.mechanism||'—'}</td><td>${r.claim||'—'}</td><td><span class="statepill ${stateClass(stateLabel(r))}">${stateLabel(r)}</span></td><td>${r.evidence||'—'}</td><td>${r.date||'—'}</td><td>${r.mag||'—'}</td><td><span class="pill ${kind(r)}">${r.dir||'open'}</span></td><td style="color:var(--muted)">${r._src||'—'}</td>`;
    tr.onclick = ()=>inspectRecord(r);
    body.appendChild(tr);
  });
  document.getElementById('ledgerMeta').textContent = `${rows.length} / ${records.length} RECORDS`;
}
function inspectRecord(r){
  const i = document.getElementById('inspector');
  document.getElementById('inspectId').textContent = r.id || r.title || '—';
  const transitions = (r.transitions||[]).map(t=>`${t.at||t.timestamp||'—'} · ${t.from||t.previous_state||'—'} → ${t.to||t.new_state||'—'} · ${t.reason||t.transition_reason||'no reason recorded'}`);
  document.getElementById('inspectBody').innerHTML = `
    <div class="inspect-claim">${esc(r.claim||r.text||'—')}</div>
    <dl class="inspect-grid">
      <dt>Symbol</dt><dd>${esc(r.symbol||'GC:'+String(r.entity||r.market||r.id).replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,10))}</dd>
      <dt>Entity</dt><dd>${esc(r.entity)}</dd>
      <dt>Gate state</dt><dd><span class="statepill ${stateClass(stateLabel(r))}">${esc(stateLabel(r))}</span></dd>
      <dt>Audit status</dt><dd>${esc(r.audit_status)}</dd>
      <dt>Source feed</dt><dd>${esc(r._src)}</dd>
      <dt>Market</dt><dd>${esc(r.market)}</dd>
      <dt>Mechanism</dt><dd>${esc(r.mechanism)}</dd>
      <dt>Evidence posture</dt><dd>${esc(r.dir||r.kind)}</dd>
      <dt>Evidence status</dt><dd>${esc(r.evidence)}</dd>
      <dt>Date</dt><dd>${esc(r.date)}</dd>
      <dt>Magnitude</dt><dd>${esc(r.mag)}</dd>
      <dt>Herd role</dt><dd>${esc(r.herd_role)}</dd>
      <dt>Causal status</dt><dd>${esc(r.causal_status)}</dd>
      <dt>Independent receipt</dt><dd>${r.independent_receipt?'YES':'NO / NOT ESTABLISHED'}</dd>
      <dt>Audit note</dt><dd>${esc(r.note)}</dd>
    </dl>
    <div class="inspect-section"><h3>Source references</h3>${listHtml(r.source_refs)}</div>
    <div class="inspect-section"><h3>Counter-evidence</h3>${listHtml(r.counterevidence_refs)}</div>
    <div class="inspect-section"><h3>Receipt links</h3>${listHtml(r.receipt_refs)}</div>
    <div class="inspect-section"><h3>Frozen predictions</h3>${listHtml(r.prediction_refs)}</div>
    <div class="inspect-section"><h3>Append-only transition history</h3>${listHtml(transitions)}</div>
    <p style="margin-top:14px;font-size:11px;color:var(--muted)">Gate main: <a href="${MAIN_PAGE_URL}" target="_blank" rel="noopener" style="color:var(--amber)">${MAIN_PAGE_URL.replace('https://','')}</a></p>
  `;
  i.classList.add('open'); i.setAttribute('aria-hidden','false');
}
function inspectReceipt(r){
  const i = document.getElementById('inspector');
  document.getElementById('inspectId').textContent = r.title || '—';
  document.getElementById('inspectBody').innerHTML = `
    <div class="inspect-claim">${r.title||'—'}</div>
    <dl class="inspect-grid">
      <dt>Source</dt><dd>${r._src||'—'}</dd>
      <dt>State</dt><dd>${r.state||r.status||'—'}</dd>
      <dt>Date</dt><dd>${r.date||'—'}</dd>
      <dt>Reading</dt><dd>${r.text||r.reading||'—'}</dd>
    </dl>
  `;
  i.classList.add('open'); i.setAttribute('aria-hidden','false');
}
function closeInspector(){
  const i = document.getElementById('inspector');
  i.classList.remove('open'); i.setAttribute('aria-hidden','true');
}
function setEdit(v){
  edit = v;
  document.getElementById('workspace').classList.toggle('edit', v);
  document.getElementById('editBtn').classList.toggle('active', v);
  save();
}

/* --- 4. Drag-to-reorder (edit mode) with localStorage persistence --- */
function enableDrag(){
  const ws = document.getElementById('workspace');
  let drag = null;
  ws.querySelectorAll('.widget').forEach(w=>{
    w.querySelector('.widget-head').addEventListener('pointerdown', e=>{
      if(!edit || innerWidth<981) return;
      drag = w; w.classList.add('dragging');
      try{ w.setPointerCapture(e.pointerId); }catch{}
    });
    w.addEventListener('pointermove', e=>{
      if(!drag || drag!==w) return;
      const at = document.elementFromPoint(e.clientX, e.clientY)?.closest('.widget');
      if(at && at!==w && at.parentElement===ws){
        const box = at.getBoundingClientRect();
        ws.insertBefore(w, e.clientY < box.top+box.height/2 ? at : at.nextSibling);
      }
    });
    w.addEventListener('pointerup', ()=>{
      if(!drag) return;
      drag.classList.remove('dragging'); drag = null;
      const ids = [...ws.querySelectorAll('.widget')].map(x=>x.dataset.id);
      try{
        const p = JSON.parse(localStorage.getItem(PREF_KEY)||'{}');
        p.order = ids; localStorage.setItem(PREF_KEY, JSON.stringify(p));
      }catch{}
    });
  });
}
function restoreOrder(){
  const ws = document.getElementById('workspace');
  const order = (prefs.order)||[];
  order.forEach(id=>{ const el = ws.querySelector(`[data-id="${id}"]`); if(el) ws.appendChild(el); });
}

/* --- 5. Wire up events + boot --- */
document.getElementById('search').addEventListener('input', e=>{ query = e.target.value.trim().toLowerCase(); renderLedger(); });
document.getElementById('editBtn').onclick = ()=>setEdit(!edit);
document.getElementById('inspectClose').onclick = closeInspector;
document.querySelectorAll('.navbtn').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.navbtn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  const v = b.dataset.view;
  if(v==='ALL') window.scrollTo({top:0, behavior:'smooth'});
  if(v==='CLAIMS') document.querySelector('[data-id="survival"]')?.scrollIntoView({behavior:'smooth'});
  if(v==='RECEIPTS') document.querySelector('[data-id="tape"]')?.scrollIntoView({behavior:'smooth'});
  if(v==='ECONOMICS') document.querySelector('[data-id="book"]')?.scrollIntoView({behavior:'smooth'});
});
document.addEventListener('keydown', e=>{
  const typing = e.target?.matches?.('input,textarea,select') || e.target?.isContentEditable;
  if(e.key==='Escape'){ closeInspector(); return; }
  if(!typing && e.key==='/'){ e.preventDefault(); document.getElementById('search').focus(); }
  if(!typing && (e.key==='e'||e.key==='E')){ setEdit(!edit); }
});

(async function boot(){
  renderBrand();
  restoreOrder();
  setEdit(edit);
  // initial render with fallback while sources load
  records = FALLBACK_RECORDS.slice();
  receipts = FALLBACK_RECEIPTS.slice();
  ar = FALLBACK_AR.slice();
  ap = FALLBACK_AP.slice();
  sourceResults = SOURCES.map(s=>({id:s.id, label:s.label, ok:false, fromCache:false, error:'loading…'}));
  renderStatus(); renderSourcePill(); renderTicker(); renderHeat(); renderSurvival();
  renderTape(); renderBooks(); renderMarkets(); renderLedger(); enableDrag();
  // pull live sources
  const data = await ingest();
  records = data.records;
  receipts = data.receipts;
  ar = data.ar;
  ap = data.ap;
  sourceResults = data.sourceResults;
  renderStatus(); renderSourcePill(); renderTicker(); renderHeat(); renderSurvival();
  renderTape(); renderBooks(); renderLedger();
})();
