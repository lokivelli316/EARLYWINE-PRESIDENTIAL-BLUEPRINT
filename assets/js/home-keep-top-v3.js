
"use strict";

/*
  EARLYWINE HOMEPAGE V3
  =====================
  Non-destructive DOM lift for the CURRENT production homepage.

  JavaScript event handling principles:
  - no inline event handlers
  - event delegation where practical
  - MutationObserver for canonical asset protection
  - IntersectionObserver for visibility/current-section state
  - ResizeObserver for canvas sizing
  - requestAnimationFrame for animation
*/

(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // ----------------------------------------------------------
  // VISUAL AUTHORITY PRODUCTION LOCK
  // ----------------------------------------------------------
  const LOCKED_ASSETS = [
    {
      selector: '[data-region="upper-rally-hero"] img',
      src: 'home-build/assets/upper-rally-hero.jpg',
      name: 'Top homepage hero'
    },
    {
      selector: '.candidate-profile img',
      src: 'home-build/assets/candidate-profile.jpg',
      name: 'Middle candidate / identity image'
    },
    {
      selector: '.trademark-emblem img',
      src: 'home-build/assets/trademark-emblem.jpg',
      name: 'Bottom trademark / emblem image'
    }
  ];

  let enforcing = false;

  function enforceLockedAssets() {
    if (enforcing) return;
    enforcing = true;

    for (const lock of LOCKED_ASSETS) {
      const img = $(lock.selector);
      if (!img) continue;

      img.dataset.visualAuthority = "locked";
      img.dataset.visualAuthorityName = lock.name;

      if (img.getAttribute("src") !== lock.src) {
        console.warn(`[EARLYWINE VISUAL AUTHORITY] Restoring locked asset: ${lock.name}`);
        img.setAttribute("src", lock.src);
      }
    }

    enforcing = false;
  }

  function watchLockedAssets() {
    enforceLockedAssets();

    const observer = new MutationObserver(mutations => {
      const relevant = mutations.some(mutation =>
        mutation.type === "attributes" ||
        mutation.type === "childList"
      );

      if (relevant) enforceLockedAssets();
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src"]
    });
  }

  // ----------------------------------------------------------
  // PAGE-LENGTH MOLTEN SEAMS
  // ----------------------------------------------------------
  function addPageSeams() {
    if ($(".ew3-page-seams")) return;

    const seams = document.createElement("div");
    seams.className = "ew3-page-seams";
    seams.setAttribute("aria-hidden", "true");
    seams.innerHTML = `
      <span class="ew3-page-seam left"></span>
      <span class="ew3-page-seam right"></span>
    `;
    document.body.appendChild(seams);
  }

  // ----------------------------------------------------------
  // WELD LOAD-BAY RECOMPOSITION
  // Changes the two panels' presentation, not the locked assets.
  // ----------------------------------------------------------
  function rebuildWeldPanels() {
    const grid = $("#weld .weld-grid");
    if (!grid || grid.dataset.ew3Ready === "true") return;

    const panels = $$(".weld-panel", grid);
    const quote = $(".weld-quote", grid);
    if (panels.length < 2 || !quote) return;

    grid.dataset.ew3Ready = "true";
    grid.classList.add("ew3-weld-grid");

    panels[0].dataset.ew3Index = "A";
    panels[1].dataset.ew3Index = "B";

    const core = document.createElement("div");
    core.className = "ew3-weld-core";
    core.setAttribute("aria-label", "The Weld holds both constraints under load");
    core.innerHTML = `
      <strong>W</strong>
      <span>The Weld</span>
      <small>hold both under load</small>
    `;

    panels[0].after(core);
    grid.appendChild(quote);
  }

  // ----------------------------------------------------------
  // NEW LOWER HERO
  // This is deliberately different from the locked image heroes.
  // It is an animated systems map built entirely in DOM/canvas.
  // ----------------------------------------------------------
  function addLowerHero() {
    if ($("#ew3-lower-hero")) return;

    const trademark = $('[data-region="trademark-emblem"]');
    if (!trademark) return;

    const section = document.createElement("section");
    section.id = "ew3-lower-hero";
    section.className = "ew3-lower-hero";
    section.setAttribute("aria-labelledby", "ew3-lower-title");

    section.innerHTML = `
      <canvas class="ew3-system-canvas" aria-hidden="true"></canvas>
      <div class="ew3-lower-grid" aria-hidden="true"></div>

      <div class="ew3-lower-copy">
        <div>
          <span class="micro">The machine · lower systems hero</span>
          <h2 id="ew3-lower-title">One blueprint.<br>Ten load paths.</h2>
          <p>
            The public interface should show how the pieces carry one another:
            infrastructure, policy, evidence, accountability, access, and failure gates.
            Pull on the system. Follow the load.
          </p>

          <div class="ew3-lower-actions">
            <a href="#blueprint">Inspect the Ten Pillars</a>
            <a href="explorers-build/explorers-preview.html">Open Systems Lab</a>
          </div>
        </div>

        <aside class="ew3-lower-readout" aria-label="Blueprint systems readout">
          <header>
            <b>SYSTEM LOAD MAP</b>
            <span>INTERACTIVE</span>
          </header>

          <div class="ew3-system-lines">
            <div class="ew3-system-line"><b>01</b><strong>Entry reform</strong><span>policy</span></div>
            <div class="ew3-system-line"><b>03</b><strong>AEGIS infrastructure spine</strong><span>physical</span></div>
            <div class="ew3-system-line"><b>08</b><strong>Education / access</strong><span>network</span></div>
            <div class="ew3-system-line"><b>09</b><strong>ARPA ecosystem</strong><span>innovation</span></div>
            <div class="ew3-system-line"><b>∞</b><strong>Receipts / corrections</strong><span>audit</span></div>
          </div>
        </aside>
      </div>
    `;

    trademark.after(section);
    initSystemsCanvas(section);
  }

  function initSystemsCanvas(section) {
    if (reduceMotion) return;

    const canvas = $(".ew3-system-canvas", section);
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const colors = ["#d84143", "#ffc044", "#40b875", "#429ee8", "#62ddd7"];
    let width = 1;
    let height = 1;
    let dpr = 1;
    let visible = true;
    let animationFrame = 0;
    let pointer = { x: .5, y: .5, active: false };

    const nodes = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      phase: index / 10 * Math.PI * 2,
      radius: .22 + (index % 3) * .035,
      color: colors[index % colors.length]
    }));

    function resize() {
      const rect = section.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function nodePosition(node, now) {
      const min = Math.min(width, height);
      const drift = now * .00008;
      const cx = width * (.58 + (pointer.active ? (pointer.x - .5) * .025 : 0));
      const cy = height * (.50 + (pointer.active ? (pointer.y - .5) * .018 : 0));
      const rx = min * node.radius * 1.45;
      const ry = min * node.radius * .70;
      const angle = node.phase + drift * (node.id % 2 ? 1 : -1);

      return {
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry
      };
    }

    function queueFrame() {
      if (!animationFrame && visible && !document.hidden) {
        animationFrame = requestAnimationFrame(draw);
      }
    }

    function draw(now) {
      animationFrame = 0;
      if (!visible || document.hidden) return;

      ctx.clearRect(0, 0, width, height);

      const positions = nodes.map(node => nodePosition(node, now));

      // connections
      for (let i = 0; i < positions.length; i += 1) {
        const a = positions[i];
        const b = positions[(i + 3) % positions.length];

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(120,205,230,.10)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // center
      const cx = width * .58;
      const cy = height * .50;
      const coreRadius = Math.min(width, height) * .075;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 2.5);
      gradient.addColorStop(0, "rgba(255,192,68,.16)");
      gradient.addColorStop(.35, "rgba(98,221,215,.07)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,192,68,.45)";
      ctx.lineWidth = 1;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#ffc044";
      ctx.stroke();

      // nodes
      positions.forEach((pos, i) => {
        const node = nodes[i];

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = .88;
        ctx.shadowBlur = 12;
        ctx.shadowColor = node.color;
        ctx.fill();

        ctx.globalAlpha = .72;
        ctx.fillStyle = "#dce7ec";
        ctx.font = "700 9px ui-monospace, monospace";
        ctx.fillText(String(node.id).padStart(2, "0"), pos.x + 9, pos.y + 3);
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      queueFrame();
    }

    section.addEventListener("pointermove", event => {
      const rect = section.getBoundingClientRect();
      pointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      pointer.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      pointer.active = true;
    }, { passive: true });

    section.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    new ResizeObserver(resize).observe(section);

    new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      queueFrame();
    }, { threshold: .01 }).observe(section);

    resize();
    document.addEventListener("visibilitychange", queueFrame);
    queueFrame();
  }

  // ----------------------------------------------------------
  // FIREWORKS — TWO DISTINCT MODES
  //   AUTO: sparse slow shells, outer sky.
  //   INTERACTIVE: click/tap launches shell from bottom to target.
  // No control button.
  // ----------------------------------------------------------
  function initFireworks() {
    if (reduceMotion) return;

    const hero = $('[data-region="upper-rally-hero"]');
    if (!hero || hero.dataset.ew3Fireworks === "true") return;

    hero.dataset.ew3Fireworks = "true";

    const autoCanvas = document.createElement("canvas");
    const interactiveCanvas = document.createElement("canvas");

    autoCanvas.className = "ew3-fireworks";
    interactiveCanvas.className = "ew3-fireworks";
    autoCanvas.dataset.mode = "auto";
    interactiveCanvas.dataset.mode = "interactive";
    autoCanvas.setAttribute("aria-hidden", "true");
    interactiveCanvas.setAttribute("aria-hidden", "true");

    hero.append(autoCanvas, interactiveCanvas);

    const autoCtx = autoCanvas.getContext("2d", { alpha: true });
    const intCtx = interactiveCanvas.getContext("2d", { alpha: true });

    const palettes = [
      ["#d84143", "#ff987d", "#fff3d9"],
      ["#ffc044", "#ffe39a", "#ffffff"],
      ["#40b875", "#a5edbf", "#f8fffa"],
      ["#429ee8", "#a4d5ff", "#ffffff"]
    ];

    const state = {
      width: 1,
      height: 1,
      visible: true,
      auto: { rockets: [], sparks: [], last: performance.now(), wait: 3500 + Math.random() * 3000 },
      interactive: { rockets: [], sparks: [], rings: [] }
    };
    let animationFrame = 0;

    const palette = () => palettes[Math.floor(Math.random() * palettes.length)];

    function resizeOne(canvas, ctx) {
      const rect = hero.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      state.width = rect.width;
      state.height = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function resize() {
      resizeOne(autoCanvas, autoCtx);
      resizeOne(interactiveCanvas, intCtx);
    }

    function launch(system, tx, ty, fast) {
      const sx = state.width * (.5 + (Math.random() - .5) * .12);
      const sy = state.height + 8;

      system.rockets.push({
        sx, sy, x: sx, y: sy, px: sx, py: sy,
        tx, ty,
        t: 0,
        speed: fast ? .017 : .0062,
        palette: palette()
      });
    }

    function launchAuto(now) {
      const left = Math.random() < .5;
      const tx = state.width * (
        left
          ? .10 + Math.random() * .25
          : .65 + Math.random() * .25
      );
      const ty = state.height * (.09 + Math.random() * .34);

      launch(state.auto, tx, ty, false);
      state.auto.last = now;
      state.auto.wait = 3300 + Math.random() * 3800;
    }

    function explode(system, x, y, colors, fast) {
      const count = fast ? 62 : 48;

      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - .5) * .08;
        const speed = (fast ? 2.8 : 1.8) * (.55 + Math.random() * .8);

        system.sparks.push({
          x, y, px: x, py: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: fast ? .974 : .987,
          gravity: fast ? .03 : .014,
          life: 1,
          decay: fast ? .015 + Math.random() * .009 : .006 + Math.random() * .004,
          color: colors[i % colors.length],
          size: .8 + Math.random() * 1.5
        });
      }

      if (fast && system.rings) {
        system.rings.push({ x, y, radius: 2, life: 1, color: colors[0] });
      }
    }

    function drawRocket(ctx, rocket, fast) {
      rocket.px = rocket.x;
      rocket.py = rocket.y;
      rocket.t += rocket.speed;

      const t = clamp(rocket.t, 0, 1);
      const inv = 1 - t;
      const cx = rocket.sx * .68 + rocket.tx * .32;
      const cy = Math.min(rocket.sy, rocket.ty) - state.height * .12;

      rocket.x = inv * inv * rocket.sx + 2 * inv * t * cx + t * t * rocket.tx;
      rocket.y = inv * inv * rocket.sy + 2 * inv * t * cy + t * t * rocket.ty;

      ctx.beginPath();
      ctx.moveTo(rocket.px, rocket.py);
      ctx.lineTo(rocket.x, rocket.y + (fast ? 15 : 11));
      ctx.strokeStyle = rocket.palette[0];
      ctx.globalAlpha = fast ? .95 : .72;
      ctx.lineWidth = fast ? 1.4 : 1;
      ctx.shadowBlur = fast ? 12 : 9;
      ctx.shadowColor = rocket.palette[0];
      ctx.stroke();

      return rocket.t >= 1;
    }

    function drawSparks(ctx, system) {
      for (let i = system.sparks.length - 1; i >= 0; i -= 1) {
        const p = system.sparks[i];
        p.px = p.x;
        p.py = p.y;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.lineWidth = p.size;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.stroke();

        if (p.life <= 0) system.sparks.splice(i, 1);
      }
    }

    function drawRings(ctx, system) {
      for (let i = system.rings.length - 1; i >= 0; i -= 1) {
        const ring = system.rings[i];
        ring.radius += 3;
        ring.life -= .05;

        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = Math.max(0, ring.life) * .72;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (ring.life <= 0) system.rings.splice(i, 1);
      }
    }

    function renderSystem(ctx, system, now, fast) {
      ctx.clearRect(0, 0, state.width, state.height);

      if (!fast && now - system.last >= system.wait) {
        launchAuto(now);
      }

      for (let i = system.rockets.length - 1; i >= 0; i -= 1) {
        const rocket = system.rockets[i];
        if (drawRocket(ctx, rocket, fast)) {
          explode(system, rocket.tx, rocket.ty, rocket.palette, fast);
          system.rockets.splice(i, 1);
        }
      }

      if (fast) drawRings(ctx, system);
      drawSparks(ctx, system);

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    function queueFrame() {
      if (!animationFrame && state.visible && !document.hidden) {
        animationFrame = requestAnimationFrame(frame);
      }
    }

    function frame(now) {
      animationFrame = 0;
      if (!state.visible || document.hidden) return;
      renderSystem(autoCtx, state.auto, now, false);
      renderSystem(intCtx, state.interactive, now, true);
      queueFrame();
    }

    hero.addEventListener("pointerdown", event => {
      if (event.target.closest("a,button,input,textarea,select,summary")) return;

      const rect = hero.getBoundingClientRect();
      launch(
        state.interactive,
        event.clientX - rect.left,
        clamp(event.clientY - rect.top, 18, rect.height * .80),
        true
      );
    });

    new ResizeObserver(resize).observe(hero);
    new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      queueFrame();
    }, { threshold: .01 }).observe(hero);

    resize();
    document.addEventListener("visibilitychange", queueFrame);
    queueFrame();
  }

  // ----------------------------------------------------------
  // SCROLL PROGRESS
  // ----------------------------------------------------------
  function addProgress() {
    if ($(".ew3-progress")) return;

    const bar = document.createElement("div");
    bar.className = "ew3-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const pct = max > 0 ? clamp(scrollY / max, 0, 1) * 100 : 0;
      bar.style.setProperty("--ew3-progress", `${pct}%`);
    };

    addEventListener("scroll", () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  function init() {
    watchLockedAssets();
    addPageSeams();
    rebuildWeldPanels();
    addLowerHero();
    initFireworks();
    addProgress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
