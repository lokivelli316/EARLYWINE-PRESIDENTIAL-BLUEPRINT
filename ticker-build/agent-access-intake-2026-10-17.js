/* Gate Closing / Pincer — additive 30-day intake overlay, 2026-10-17.
   Never edits the frozen August 13 prediction, sealed journal, engine or posted ledger.
   Model-suggested evidence, NOT adjudicated receipts. */
(function () {
  'use strict';
  const entries = [
    {
      id:'GC26-01', date:'2026-09-20', type:'restriction', stage:2,
      title:'Amazon blocks Meta Muse shopping access',
      mechanism:'Distribution / platform access', domino:'7 — Trusted Door',
      detail:'Amazon blocked Muse from shopping on behalf of customers, citing lack of authorization and agent security concerns. A named access refusal; not proof of coordinated exclusion.',
      caveat:'The platform also raised credential, disclosure and order-liability concerns.',
      source:'GeekWire, September 20', url:'https://www.geekwire.com/2026/Amazon-blocks-metas-muse-ai-assistant-in-new-standoff-over-agentic-shopping/'
    },
    {
      id:'GC26-02', date:'2026-09-30', type:'control', stage:2,
      title:'Cloudflare launches Monetization Gateway beta',
      mechanism:'Metering / billing', domino:'7 — Trusted Door',
      detail:'Website operators can charge identified agents for access to sites, APIs, tools and datasets. Infrastructure makes price-gated access possible, but launching it does not establish a new denial for a particular agent.',
      caveat:'It can also create new lawful paid routes for independent publishers and developers.',
      source:'Cloudflare primary announcement', url:'https://blog.cloudflare.com/monetization-gateway-beta/'
    },
    {
      id:'GC26-03', date:'2026-10-09', type:'opening', stage:2,
      title:'Personal Agent Protocol draft 0.1 (Poppy)',
      mechanism:'Identity / authentication', domino:'7 — Trusted Door; 33 — Temporary Gate',
      detail:'An open specification describes agent identification, delegated user permissions and service-selected routes. Potential interoperability opening, dependent on adoption and business permission.',
      caveat:'Open specification does not require a company to admit every agent. Not yet evidence of durable unrestricted access.',
      source:'Personal Agent Protocol spec', url:'https://personalagentprotocol.org/docs/introduction'
    },
    {
      id:'GC26-04', date:'2026-10-13', type:'opening', stage:3,
      title:'Shopify Shop MCP opens search and checkout to agents',
      mechanism:'API access / authenticated commerce', domino:'7 — Trusted Door',
      detail:'Shop MCP allows MCP-compatible agents to search products, build carts, and conduct confirmed checkout through its published interface. This is a real functional opening.',
      caveat:'Requires human payment confirmation; long-term durability has not yet been established. Candidate A/R, NOT automatic A/P.',
      source:'Shopify developer changelog', url:'https://shopify.dev/changelog/posts/add-shopping-and-shop-pay-checkout-to-any-agent-with-shop-mcp'
    },
    {
      id:'GC26-05', date:'2026-10-15', type:'opening', stage:1,
      title:'Cloudflare and OpenAI report expanded AI discovery pilot',
      mechanism:'Discovery controls / interoperability', domino:'23 — Locked Model (analogy only)',
      detail:'Cloudflare and OpenAI reported a research pilot making more previously undiscovered pages available to AI search. An opening on discovery, within a participating cohort.',
      caveat:'Pilot coverage is limited; metadata signaling does not grant access to protected website content.',
      source:'Cloudflare and OpenAI joint post', url:'https://blog.cloudflare.com/cloudflare-openai-discovery-agentic-web/'
    },
    {
      id:'GC26-06', date:'2026-10-16', type:'control', stage:3,
      title:'Cloudflare adds continuous accountability for verified bots',
      mechanism:'Identity / ongoing compliance', domino:'7 — Trusted Door; 33 — Temporary Gate',
      detail:'Cloudflare described monitoring whether verified bots honor website preferences and behavioral limits. This expands control after initial identity verification.',
      caveat:'Can reduce abuse and keep responsible agents admitted. Not evidence of a universal agent ban.',
      source:'Cloudflare primary announcement', url:'https://blog.cloudflare.com/verified-bots-accountability/'
    },
    {
      id:'GC26-07', date:'2026-10-17', type:'context', stage:3,
      title:'The Verge surveys blocked AI agents across industries',
      mechanism:'Synthesis / secondary reporting', domino:'7 — Trusted Door; 23 — Locked Model',
      detail:'Reports disputes and access restrictions across commerce, travel, finance and publisher licensing. Useful cross-sector context, not a separate underlying enforcement action.',
      caveat:'Do NOT count this overview as another receipt for the same Amazon event.',
      source:'The Verge October 17', url:'https://www.theverge.com/ai-artificial-intelligence/1013195/ai-agents-blocked-web'
    }
  ];
  const host = document.createElement('section');
  host.id = 'pincer-intake-20261017';
  host.setAttribute('aria-label', 'Thirty-day Gate Closing pincer intake');
  host.innerHTML = [
    '<div class="pf-wrap">',
    '<div class="pf-top"><span>RESEARCH TERMINAL / ADDITIVE INTAKE</span><span>17 SEP — 17 OCT 2026</span></div>',
    '<div class="pf-header"><div><div class="pf-eyebrow">AUG 13 FREEZE / OCT 17 CROSS-CHECK</div>',
    '<h2>THE PINCER <em>KEEPS MOVING</em></h2>',
    '<p>Two jaws: the advertised opening and the governed economic lane. New developments match parts of the frozen mechanism, but the original prediction was centered on AI music, not a dated forecast of every agent-access restriction.</p></div>',
    '<a class="pf-freeze" href="../gate-closing-build/gate-closing-preview.html#prediction">INSPECT ORIGINAL FREEZE ↗</a></div>',
    '<blockquote>“The gates will not close all at once. They will remain open just long enough to teach the crowd the road. Then the tolls will rise, the keys will change hands, and permission will masquerade as progress.”</blockquote>',
    '<div class="pf-jaws"><div><b>JAW A · PUBLIC OPENING</b><span>AI assistance, discoverability, user convenience, API availability</span></div>',
    '<div><b>JAW B · CONTROL PLANE</b><span>Identity, permission, metering, checkout conditions, denial and licensing</span></div></div>',
    '<div class="pf-runway"><span>01 · ONRAMP</span><span>02 · IDENTIFY / METER</span><span>03 · CONTROL TRANSACTION</span></div>',
    '<div class="pf-counts" id="pf-counts" aria-live="polite"></div>',
    '<div class="pf-filters" role="group" aria-label="Filter evidence proposals">',
    '<button type="button" data-pf="all" aria-pressed="true">ALL</button>',
    '<button type="button" data-pf="restriction">DIRECT REFUSAL</button>',
    '<button type="button" data-pf="control">CONTROL SYSTEM</button>',
    '<button type="button" data-pf="opening">OPENINGS / A-R</button>',
    '<button type="button" data-pf="context">CONTEXT</button></div>',
    '<div class="pf-records" id="pf-records"></div>',
    '<div class="pf-inspect" id="pf-inspect" aria-live="polite"></div>',
    '<div class="pf-hold"><strong>AUTHORITY GATE: HOLD.</strong> All seven records are research intake, not ledger POSTED events. Models may propose; operator adjudicates. The August 13 source and hash-chained journal remain unchanged. An AR opening is not an AP durable opening. No new ASH or prediction victory is awarded by this panel.</div>',
    '<div class="pf-footer"><span>DOMINO LINKS ARE HYPOTHESES: #7 Trusted Door · #23 Locked Model · #33 Temporary Gate</span><span>ONE REPORT ≠ ONE NEW ENFORCEMENT EVENT</span></div>',
    '</div>'
  ].join('');
  const css = document.createElement('style');
  css.textContent = [
    '#pincer-intake-20261017{color:#f2e9d6;background:#090d0f;border-top:1px solid #7b623c;border-bottom:1px solid #7b623c;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}',
    '#pincer-intake-20261017 *{box-sizing:border-box}',
    '#pincer-intake-20261017 .pf-wrap{width:min(calc(100% - 26px),1500px);margin:auto;padding:22px 0 27px}',
    '#pincer-intake-20261017 .pf-top{display:flex;justify-content:space-between;flex-wrap:wrap;gap:7px;padding:7px 0;border-top:2px solid #b99054;color:#bba98c;font:700 11px ui-monospace,monospace}',
    '#pincer-intake-20261017 .pf-header{display:flex;align-items:end;justify-content:space-between;gap:20px;flex-wrap:wrap}',
    '#pincer-intake-20261017 .pf-eyebrow{color:#77d4b6;font:800 12px ui-monospace,monospace;letter-spacing:.08em;margin:13px 0}',
    '#pincer-intake-20261017 h2{font:900 clamp(27px,5vw,54px)/1 Georgia,serif;margin:0;letter-spacing:-.03em}',
    '#pincer-intake-20261017 h2 em{color:#dfb36a;font-style:normal}',
    '#pincer-intake-20261017 p{color:#c7cfc9;line-height:1.6;max-width:940px;font-size:14px}',
    '#pincer-intake-20261017 .pf-freeze{border:1px solid #e6bd7a;padding:12px 15px;color:#efcf97;font:800 12px ui-monospace,monospace;text-decoration:none}',
    '#pincer-intake-20261017 blockquote{border-left:3px solid #efc67c;margin:20px 0;padding:10px 12px;color:#f6e2bc;background:#20190f;font:clamp(17px,2.1vw,25px)/1.35 Georgia,serif}',
    '#pincer-intake-20261017 .pf-jaws{display:grid;grid-template-columns:1fr 1fr;gap:9px}',
    '#pincer-intake-20261017 .pf-jaws div{padding:14px;background:#111a19;border:1px solid #36504b;min-width:0}',
    '#pincer-intake-20261017 .pf-jaws b{display:block;color:#e9ba74;font:800 13px ui-monospace,monospace;margin-bottom:8px}',
    '#pincer-intake-20261017 .pf-jaws span{color:#d7e0d7;font-size:14px;line-height:1.5}',
    '#pincer-intake-20261017 .pf-runway{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:13px 0}',
    '#pincer-intake-20261017 .pf-runway span{border-top:3px solid #7cd0bf;padding:10px 4px 4px;font:800 11px ui-monospace,monospace;color:#b4e5d6;text-align:center}',
    '#pincer-intake-20261017 .pf-counts{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}',
    '#pincer-intake-20261017 .pf-counts span{background:#15191c;border:1px solid #4f5048;padding:9px 10px;color:#e8e1d3;font:750 12px ui-monospace,monospace}',
    '#pincer-intake-20261017 .pf-counts b{font-size:20px;color:#f0ca84;margin-right:5px}',
    '#pincer-intake-20261017 .pf-filters{display:flex;gap:5px;flex-wrap:wrap;margin:15px 0}',
    '#pincer-intake-20261017 button{cursor:pointer}',
    '#pincer-intake-20261017 .pf-filters button{border:1px solid #6b6553;background:#141c1d;color:#e6dccb;padding:10px 9px;font:800 11px ui-monospace,monospace}',
    '#pincer-intake-20261017 .pf-filters button[aria-pressed=true]{background:#ddaf69;color:#100f0d;border-color:#f5d5a2}',
    '#pincer-intake-20261017 .pf-records{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:8px}',
    '#pincer-intake-20261017 .pf-record{width:100%;min-width:0;text-align:left;color:#e7e6e0;background:#101617;border:1px solid #405353;padding:12px;min-height:112px}',
    '#pincer-intake-20261017 .pf-record[aria-pressed=true]{border-color:#ecbb76;background:#1c2421;box-shadow:inset 4px 0 #ecbb76}',
    '#pincer-intake-20261017 .pf-record small{display:block;font:700 11px ui-monospace,monospace;color:#a8d6c8;margin-bottom:8px}',
    '#pincer-intake-20261017 .pf-record strong{display:block;font-size:15px;line-height:1.3;margin-bottom:8px}',
    '#pincer-intake-20261017 .pf-record span{font:800 10px ui-monospace,monospace;color:#e8b97f}',
    '#pincer-intake-20261017 .pf-inspect{border:1px solid #63604d;background:#172022;padding:16px;margin:10px 0;min-height:140px;line-height:1.55}',
    '#pincer-intake-20261017 .pf-inspect h3{color:#f4d49e;font-size:18px;margin:2px 0 9px}',
    '#pincer-intake-20261017 .pf-inspect p{margin:8px 0;color:#e2e5dd}',
    '#pincer-intake-20261017 .pf-inspect a{color:#82e1cd;font-weight:800;overflow-wrap:anywhere}',
    '#pincer-intake-20261017 .pf-hold{padding:12px;border-left:3px solid #e7bd7c;background:#221c16;color:#e9dcc8;font-size:13px;line-height:1.6}',
    '#pincer-intake-20261017 .pf-footer{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:12px 0;color:#9fb6ad;font:700 10px ui-monospace,monospace}',
    '@media(max-width:520px){#pincer-intake-20261017 .pf-wrap{width:calc(100% - 20px)}#pincer-intake-20261017 .pf-jaws{grid-template-columns:1fr}#pincer-intake-20261017 .pf-runway span{font-size:9px}#pincer-intake-20261017 .pf-filters button{font-size:10px;padding:9px 6px}}'
  ].join('\n');
  document.head.appendChild(css);
  const intro = document.querySelector('main#top .intro');
  if (intro) intro.insertAdjacentElement('afterend', host);
  else document.querySelector('main').prepend(host);

  const recordBox = host.querySelector('#pf-records'), inspect = host.querySelector('#pf-inspect'), countBox = host.querySelector('#pf-counts');
  let filter = 'all', selected = 'GC26-01';
  const types = {restriction:'DIRECT REFUSAL',control:'CONTROL INFRASTRUCTURE',opening:'OPENING CANDIDATE',context:'SYNTHESIS ONLY'};
  function enc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function counts() {
    const cnt = t => entries.filter(x=>x.type===t).length;
    countBox.innerHTML = '<span><b>'+entries.length+'</b> INTAKE</span><span><b>'+cnt('restriction')+'</b> DIRECT REFUSAL</span><span><b>'+cnt('control')+'</b> CONTROL</span><span><b>'+cnt('opening')+'</b> OPENINGS</span><span><b>0</b> NEW POSTED</span>';
  }
  function details() {
    const r = entries.find(x => x.id === selected);
    if (!r) return;
    inspect.innerHTML = '<small>'+enc(r.id)+' · '+enc(r.date)+' · STAGE '+r.stage+' · MODEL-PROPOSED</small>'+
      '<h3>'+enc(r.title)+'</h3><p>'+enc(r.detail)+'</p>'+
      '<p><strong>COUNTERCASE:</strong> '+enc(r.caveat)+'</p>'+
      '<p><strong>MECHANISM:</strong> '+enc(r.mechanism)+'<br><strong>DOMINO CANDIDATE:</strong> '+enc(r.domino)+'</p>'+
      '<a href="'+enc(r.url)+'" target="_blank" rel="noopener noreferrer">INSPECT SOURCE · '+enc(r.source)+' ↗</a>';
  }
  function render() {
    host.querySelectorAll('[data-pf]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pf===filter)));
    const visible = entries.filter(e=>filter==='all'||e.type===filter);
    if (!visible.some(e=>e.id===selected)) selected=visible[0].id;
    recordBox.replaceChildren();
    visible.forEach(r=>{
      const b=document.createElement('button');
      b.type='button'; b.className='pf-record'; b.setAttribute('aria-pressed', String(selected===r.id));
      b.innerHTML='<small>'+enc(r.date)+' · '+enc(r.id)+'</small><strong>'+enc(r.title)+'</strong><span>'+enc(types[r.type])+' / PROPOSED</span>';
      b.onclick=function(){selected=r.id;render();};
      recordBox.appendChild(b);
    });
    details();
  }
  host.querySelectorAll('[data-pf]').forEach(b=>b.addEventListener('click',function(){filter=this.dataset.pf;render();}));
  counts();render();
})();
