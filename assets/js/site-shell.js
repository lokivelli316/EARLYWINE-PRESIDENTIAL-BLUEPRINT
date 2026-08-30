(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qs=(s,r=document)=>r.querySelector(s); const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  function stateClass(s){return 'state-'+String(s||'OPEN').toLowerCase().replace(/\s+/g,'-')}
  const legacyRoutes={
    '#blueprint':'blueprint-build/blueprint-preview.html',
    '#ecosystem':'explorers-build/explorers-preview.html',
    '#research':'gate-closing-build/gate-closing-preview.html',
    '#address':'address-build/address-preview.html',
    '#receipts':'source-integrity-build/source-integrity-preview.html'
  };
  function wirePageRoutes(){
    qsa('a').forEach(a=>{const href=a.getAttribute('href');if(legacyRoutes[href])a.setAttribute('href',legacyRoutes[href])});
  }
  function resolveLegacyHash(){
    const target=legacyRoutes[location.hash];
    if(target) location.replace(target);
  }
  function initNav(){
    const button=qs('[data-nav-toggle]'), drawer=qs('[data-nav-drawer]');
    if(!button||!drawer)return;
    if(window.EARLYWINE_ROUTES){
      drawer.innerHTML=window.EARLYWINE_ROUTES.map(r=>{
        const status=`<span>${r.state}</span>`;
        return r.href
          ? `<a href="${r.href}" data-global-route="${r.id}">${r.label} ${status}</a>`
          : `<a aria-disabled="true" title="${r.desc}">${r.label} ${status}</a>`;
      }).join('');
    }
    const close=()=>{drawer.dataset.open='false';button.setAttribute('aria-expanded','false');document.body.classList.remove('nav-open')};
    button.addEventListener('click',()=>{const next=drawer.dataset.open!=='true';drawer.dataset.open=String(next);button.setAttribute('aria-expanded',String(next));document.body.classList.toggle('nav-open',next)});
    qsa('a',drawer).forEach(a=>a.addEventListener('click',e=>{if(a.getAttribute('aria-disabled')==='true')e.preventDefault();close()}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  }
  function setStatusRail(target='[data-status-rail]'){
    const rail=qs(target); if(!rail||!window.EARLYWINE_ROUTES)return;
    rail.innerHTML=window.EARLYWINE_ROUTES.map(r=>`<button class="route-chip ${stateClass(r.state)}" data-route-chip="${r.id}" ${r.href?'':'aria-disabled="true"'}><span>${r.label}</span><b>${r.state}</b></button>`).join('');
    qsa('[data-route-chip]',rail).forEach(btn=>btn.addEventListener('click',()=>{
      const r=window.EARLYWINE_ROUTES.find(x=>x.id===btn.dataset.routeChip); if(!r)return;
      if(r.href){location.href=r.href;return}
      const panel=qs('[data-route-inspector]'); if(panel){panel.innerHTML=`<span class="micro">${r.state}</span><h3>${r.label}</h3><p>${r.desc}</p><p class="muted">This route is visible on purpose but has not yet cleared its integration gate.</p>`;panel.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'nearest'})}
    }));
  }
  function initReveal(){if(reduceMotion)return;qsa('[data-reveal]').forEach(el=>el.classList.add('reveal-pending'));const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('reveal-in');io.unobserve(e.target)}}),{threshold:.12});qsa('[data-reveal]').forEach(el=>io.observe(el))}
  function initTilt(){if(reduceMotion||!matchMedia('(pointer:fine)').matches)return;qsa('[data-tilt]').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty('--rx',`${-y*5}deg`);card.style.setProperty('--ry',`${x*7}deg`);card.style.setProperty('--mx',`${(x+.5)*100}%`);card.style.setProperty('--my',`${(y+.5)*100}%`)});card.addEventListener('pointerleave',()=>{card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg')})})}
  function initSpectrumCanvas(selector='[data-spectrum-canvas]'){
    const c=qs(selector); if(!c||reduceMotion)return; const ctx=c.getContext('2d'); let pts=[],w=0,h=0,dpr=Math.min(devicePixelRatio||1,2),raf;
    function resize(){const r=c.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(95,Math.max(40,Math.floor(w/16)));pts=Array.from({length:count},(_,i)=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.12,vy:(Math.random()-.5)*.12,r:Math.random()*1.7+.45,hue:i/count*240}))}
    function draw(){ctx.clearRect(0,0,w,h);for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`hsla(${p.hue},90%,65%,.55)`;ctx.fill()}for(let i=0;i<pts.length;i++){for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d<105){ctx.strokeStyle=`rgba(130,170,220,${(1-d/105)*.08})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}}raf=requestAnimationFrame(draw)}
    new ResizeObserver(resize).observe(c);resize();draw();document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else draw()});
  }
  function initHomeImages(){
    const hero=qs('.hero-cinematic'), art=qs('.hero-art',hero||document);
    if(!hero||!art)return;

    // HOME_IMAGE_HOTFIX_2026_08_30
    // Promote the preserved Home-build image assets into the live root page.
    // These remain replaceable assets; this hook does not redefine their canon authority.
    art.style.backgroundImage="linear-gradient(90deg,rgba(2,4,7,.80) 0%,rgba(2,4,7,.34) 46%,rgba(2,4,7,.18) 100%),linear-gradient(0deg,#030508 0%,transparent 35%),url('home-build/assets/forge-council-hero.webp')";
    art.style.backgroundPosition='center';
    art.style.backgroundSize='cover';
    art.style.backgroundRepeat='no-repeat';

    if(!qs('[data-candidate-portrait]',hero)){
      const figure=document.createElement('figure');
      figure.className='candidate-portrait-card';
      figure.dataset.candidatePortrait='preserved-home-build';
      figure.innerHTML='<img src="home-build/assets/candidate-profile.webp" alt="Robert M. Earlywine-Lucas candidate portrait"><figcaption>Robert M. Earlywine-Lucas <span>Full Spectrum Independent</span></figcaption>';
      hero.appendChild(figure);
    }

    if(!qs('#home-image-hotfix-styles')){
      const style=document.createElement('style');
      style.id='home-image-hotfix-styles';
      style.textContent=`
        .candidate-portrait-card{position:absolute;right:clamp(18px,3.4vw,58px);top:clamp(76px,10vh,118px);z-index:2;width:clamp(170px,17vw,285px);margin:0;border:1px solid rgba(255,255,255,.28);border-radius:22px;overflow:hidden;background:rgba(5,8,12,.76);box-shadow:0 26px 80px rgba(0,0,0,.52),0 0 0 1px rgba(243,180,76,.12) inset;backdrop-filter:blur(12px);transform:rotate(1.25deg);pointer-events:none}
        .candidate-portrait-card::before{content:"";position:absolute;inset:0;z-index:1;box-shadow:inset 0 0 70px rgba(0,0,0,.34);pointer-events:none}
        .candidate-portrait-card img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;object-position:center top}
        .candidate-portrait-card figcaption{position:absolute;z-index:2;left:0;right:0;bottom:0;padding:28px 12px 11px;background:linear-gradient(transparent,rgba(2,4,7,.94));color:#fff;font:900 10px/1.25 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.06em;text-transform:uppercase}
        .candidate-portrait-card figcaption span{display:block;margin-top:3px;color:#f3b44c;font-size:8px}
        @media(max-width:1080px){.candidate-portrait-card{width:clamp(145px,18vw,210px);right:16px;top:84px;opacity:.95}}
        @media(max-width:760px){.candidate-portrait-card{width:132px;right:12px;top:72px;border-radius:17px;transform:rotate(1deg)}.candidate-portrait-card figcaption{display:none}.hero-copy{padding-right:84px}}
        @media(max-width:470px){.candidate-portrait-card{width:106px;right:10px;top:70px}.hero-copy{padding-right:56px}}
      `;
      document.head.appendChild(style);
    }
  }
  function stampYear(){qsa('[data-year]').forEach(x=>x.textContent=new Date().getFullYear())}
  function init(){wirePageRoutes();initNav();setStatusRail();initHomeImages();initReveal();initTilt();initSpectrumCanvas();stampYear();resolveLegacyHash()}
  window.EarlywineShell={init,setStatusRail,initSpectrumCanvas,wirePageRoutes,initHomeImages};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();