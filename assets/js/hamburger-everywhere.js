(() => {
  'use strict';
  const ROOT = '/EARLYWINE-PRESIDENTIAL-BLUEPRINT/';
  const REGISTRY_SRC = ROOT + 'assets/js/data-registry.js';

  /* Legacy Gate Closing artwork fallback. Preserved verbatim in behaviour. */
  const repairGateImages = () => {
    if (!/gate-closing-preview\.html$/.test(location.pathname)) return;
    const RAW = 'https://raw.githubusercontent.com/lokivelli316/EARLYWINE-PRESIDENTIAL-BLUEPRINT/main/gate-closing-build/media/';
    const names = ['65487.jpg', '64899.jpg', '65486.jpg'];
    document.querySelectorAll('img').forEach(img => {
      const name = names.find(n => (img.getAttribute('src') || '').includes(n) || (img.alt || '').toLowerCase().includes(n.replace('.jpg', '')));
      if (!name) return;
      const wanted = RAW + name;
      if (img.src !== wanted) { img.onerror = () => { img.onerror = null; img.src = wanted; }; img.src = wanted; }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', repairGateImages, { once: true });
  else repairGateImages();

  if (document.querySelector('[data-ew-universal-hamburger]')) return;

  const CSS = `.ew-hb{position:fixed;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));z-index:2147483646;width:46px;height:46px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(5,8,12,.94);color:#fff;font:22px system-ui;box-shadow:0 8px 30px #0008;backdrop-filter:blur(14px);cursor:pointer}.ew-hb:focus-visible{outline:2px solid #f3ad45;outline-offset:2px}.ew-hb-dim{display:none;position:fixed;inset:0;z-index:2147483644;background:#000a;backdrop-filter:blur(3px)}.ew-hb-dim[data-open=true]{display:block}.ew-hb-menu{display:none;position:fixed;z-index:2147483645;top:max(66px,calc(env(safe-area-inset-top) + 66px));right:max(10px,env(safe-area-inset-right));left:max(10px,env(safe-area-inset-left));max-width:760px;margin-left:auto;max-height:calc(100dvh - 80px);overflow:auto;padding:10px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(5,8,12,.98);box-shadow:0 24px 80px #000c;color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif}.ew-hb-menu[data-open=true]{display:block}.ew-hb-head{display:flex;justify-content:space-between;align-items:center;padding:8px 10px 12px;color:#f3ad45;font:900 11px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.12)}.ew-hb-menu a,.ew-hb-menu .ew-disabled{display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:46px;padding:13px 10px;border-bottom:1px solid rgba(255,255,255,.07);color:#f3f6f8;text-decoration:none;font-weight:800;font-size:13px}.ew-hb-menu span{color:#aab3ba;font:800 10px ui-monospace,monospace;text-align:right}.ew-hb-menu .ew-disabled{opacity:.58;cursor:not-allowed}.ew-hb-menu a:hover{background:#ffffff0b}.ew-hb-menu a:focus-visible{background:#ffffff14;outline:2px solid #f3ad45;outline-offset:-2px}.ew-hb-menu a[aria-current=page]{background:#f3ad4514;box-shadow:inset 3px 0 0 #f3ad45}.ew-hb-menu a[aria-current=page] b::after{content:' \u2014 you are here';color:#f3ad45;font-weight:800}.ew-hb-menu .ew-note{padding:10px;color:#87939d;font:10px ui-monospace,monospace}.ew-hb-open{overflow:hidden!important}@media(min-width:900px){.ew-hb-menu{left:auto;width:620px}}`;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Resolve a registry href against the deployed site root. */
  const resolve = href => {
    if (!href) return '';
    if (href.startsWith('#') || /^[a-z]+:/i.test(href)) return href;
    return ROOT + href.replace(/^\/+/, '');
  };

  /* Mark the route matching the page we are actually on. */
  const isCurrent = href => {
    if (!href || href.startsWith('#')) return false;
    const a = resolve(href).split('#')[0].replace(/\/index\.html$/, '/');
    const b = location.pathname.replace(/\/index\.html$/, '/');
    return a === b;
  };

  /* Any page may host a route/status rail. It reads the same registry. */
  function renderRails(routes) {
    document.querySelectorAll('[data-ew-route-rail]').forEach(rail => {
      rail.innerHTML = routes.map(r => {
        const label = esc(r.label);
        const state = esc(r.state);
        const cls = 'state-' + String(r.state).toLowerCase().replace(/\s+/g, '-');
        if (!r.href) return `<div aria-disabled="true"><span>${label}</span><b class="${cls}">${state}</b></div>`;
        const cur = isCurrent(r.href) ? ' aria-current="page"' : '';
        return `<a href="${esc(resolve(r.href))}"${cur}><span>${label}</span><b class="${cls}">${state}</b></a>`;
      }).join('');
    });
  }

  function render(routes) {
    renderRails(routes);
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const dim = document.createElement('div');
    dim.className = 'ew-hb-dim';
    dim.dataset.open = 'false';

    const menu = document.createElement('nav');
    menu.className = 'ew-hb-menu';
    menu.dataset.open = 'false';
    menu.setAttribute('aria-label', 'Universal site navigation');
    menu.innerHTML =
      '<div class="ew-hb-head"><b>Site Map</b><span>Every page gets a hamburger.</span></div>' +
      routes.map(r => {
        const label = esc(r.label), state = esc(r.state);
        if (!r.href) return `<div class="ew-disabled" aria-disabled="true"><b>${label}</b><span>${state}</span></div>`;
        const cur = isCurrent(r.href) ? ' aria-current="page"' : '';
        return `<a href="${esc(resolve(r.href))}"${cur}><b>${label}</b><span>${state}</span></a>`;
      }).join('') +
      '<div class="ew-note">Shared navigation only. Each page keeps its own design. Routes and statuses come from data-registry.js.</div>';

    const btn = document.createElement('button');
    btn.className = 'ew-hb';
    btn.dataset.ewUniversalHamburger = 'true';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open site navigation');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'ew-hb-menu');
    menu.id = 'ew-hb-menu';
    btn.textContent = '\u2630';

    const focusables = () => [...menu.querySelectorAll('a[href]')];

    const set = open => {
      menu.dataset.open = dim.dataset.open = String(open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close site navigation' : 'Open site navigation');
      btn.textContent = open ? '\u00d7' : '\u2630';
      document.documentElement.classList.toggle('ew-hb-open', open);
      if (open) {
        const cur = menu.querySelector('a[aria-current=page]') || focusables()[0];
        cur && cur.focus();
      } else {
        btn.focus();
      }
    };

    btn.addEventListener('click', () => set(menu.dataset.open !== 'true'));
    dim.addEventListener('click', () => set(false));
    menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });

    document.addEventListener('keydown', e => {
      if (menu.dataset.open !== 'true') return;
      if (e.key === 'Escape') { e.preventDefault(); set(false); return; }
      if (e.key !== 'Tab') return;
      const items = [btn, ...focusables()];
      const i = items.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      const next = e.shiftKey ? (i - 1 + items.length) % items.length : (i + 1) % items.length;
      items[next].focus();
    });

    document.body.append(dim, menu, btn);
  }

  function boot() {
    const routes = window.EARLYWINE_ROUTES;
    if (Array.isArray(routes) && routes.length) return render(routes);
    /* Registry not present on this page: load it, then render. Never inline a copy. */
    const s = document.createElement('script');
    s.src = REGISTRY_SRC;
    s.onload = () => {
      const r = window.EARLYWINE_ROUTES;
      if (Array.isArray(r) && r.length) render(r);
      else console.error('[ew-hamburger] data-registry.js loaded but EARLYWINE_ROUTES is empty; navigation not rendered.');
    };
    s.onerror = () => console.error('[ew-hamburger] could not load ' + REGISTRY_SRC + '; navigation not rendered.');
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
