// Nucleo Avalanche · camada de movimento (fundo vivo, entradas, fisica de hover, celebracao).
// Nao toca no app.js: escuta o DOM (MutationObserver) e eventos. Cor solida, so transform/opacity.
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var mqReduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var REDUCE = !!(mqReduce && mqReduce.matches);
  var FINE = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);

  function ready(fn) {
    if (doc.readyState !== "loading") fn();
    else doc.addEventListener("DOMContentLoaded", fn);
  }

  // paleta real lida dos tokens do styles.css (fallback = os mesmos hex)
  function palette() {
    var cs = getComputedStyle(root);
    function v(name, fb) { var x = (cs.getPropertyValue(name) || "").trim(); return x || fb; }
    return {
      front: [
        v("--coral", "#e9584f"), v("--teal", "#07887e"), v("--mustard", "#d89919"),
        v("--paper-light", "#fffaf0"), v("--paper-cream", "#f4e6c7"), v("--paper-aged", "#e7d1a2"),
        v("--green", "#3a9f78"), v("--teal-soft", "#91cbc2"), v("--mustard-soft", "#edc76a"),
        v("--paper-light", "#fffaf0"), v("--paper-cream", "#f4e6c7")
      ],
      back: v("--paper-aged", "#e7d1a2"),
      speck: v("--paper-light", "#fffaf0"),
      confetti: [
        v("--coral", "#e9584f"), v("--teal", "#07887e"), v("--mustard", "#d89919"),
        v("--navy", "#183653"), v("--green", "#3a9f78"), v("--paper-cream", "#f4e6c7")
      ]
    };
  }

  // ==========================================================================
  // 1. FUNDO VIVO: papeis recortados caindo devagar (avalanche de papel), com
  //    parallax de mouse e scroll, giro 3D falso (o verso e papel envelhecido)
  //    e graos de papel piscando. Pausa com aba oculta e com video tocando.
  // ==========================================================================
  var bg = null;

  function lowEnd() {
    var nav = navigator;
    var conn = nav.connection || {};
    if (conn.saveData) return true;
    if (nav.deviceMemory && nav.deviceMemory <= 2) return true;
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (coarse && nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true;
    return false;
  }

  function mountBackground() {
    if (REDUCE || lowEnd() || doc.getElementById("m-bg")) return;
    var canvas = doc.createElement("canvas");
    canvas.id = "m-bg";
    canvas.setAttribute("aria-hidden", "true");
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    doc.body.insertBefore(canvas, doc.body.firstChild);

    var pal = palette();
    var mobile = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
    var DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
    var W = 0, H = 0;
    var scraps = [], specks = [];
    var quality = 1;          // cai sozinho se o aparelho engasgar
    var running = false, raf = 0, last = 0;
    var videoOn = false, hidden = doc.hidden;
    var mouse = { x: -9999, y: -9999, tx: 0, ty: 0, px: 0, py: 0 };
    var scrollY = window.scrollY || 0, scrollSm = scrollY;
    var frames = 0, slow = 0, winStart = 0;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

    function makeScrap(anyY) {
      var z = rnd(0.35, 1);                       // profundidade
      var kind = Math.random();
      kind = kind < 0.46 ? 0 : kind < 0.7 ? 1 : kind < 0.86 ? 2 : 3; // retangulo, triangulo, fita, bolinha
      var size = rnd(7, 19) * (0.55 + z * 0.6);
      return {
        x: rnd(0, W), y: anyY ? rnd(-40, H + 40) : rnd(-80, -20),
        z: z, kind: kind, size: size,
        ratio: kind === 2 ? rnd(2.6, 3.6) : rnd(0.7, 1.35),
        color: pick(pal.front),
        alpha: (kind === 3 ? rnd(0.18, 0.34) : rnd(0.2, 0.46)) * (0.45 + z * 0.6),
        vy: rnd(9, 20) * (0.45 + z * 0.75),
        sway: rnd(8, 26) * z, swayF: rnd(0.25, 0.6), ph: rnd(0, 6.283),
        rot: rnd(0, 6.283), vrot: rnd(-0.6, 0.6),
        flip: rnd(0, 6.283), vflip: rnd(0.6, 1.6) * (Math.random() < 0.5 ? -1 : 1),
        kx: 0, ky: 0
      };
    }

    function populate() {
      var area = W * H;
      var n = Math.round(Math.min(mobile ? 16 : 58, area / (mobile ? 30000 : 24000)) * quality);
      var s = Math.round(Math.min(mobile ? 30 : 90, area / 14000) * quality);
      while (scraps.length < n) scraps.push(makeScrap(true));
      scraps.length = Math.max(0, n);
      while (specks.length < s) specks.push({ x: rnd(0, 1), y: rnd(0, 1), z: rnd(0.2, 1), r: rnd(0.6, 1.5), ph: rnd(0, 6.283), f: rnd(0.4, 1.4) });
      specks.length = Math.max(0, s);
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      populate();
      if (!running) draw(0, performance.now() / 1000);
    }

    function draw(dt, t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // parallax suave
      mouse.px += (mouse.tx - mouse.px) * Math.min(1, dt * 3);
      mouse.py += (mouse.ty - mouse.py) * Math.min(1, dt * 3);
      scrollSm += (scrollY - scrollSm) * Math.min(1, dt * 6);

      // graos de papel
      ctx.fillStyle = pal.speck;
      for (var i = 0; i < specks.length; i++) {
        var p = specks[i];
        var a = 0.05 + 0.1 * (0.5 + 0.5 * Math.sin(t * p.f + p.ph));
        var sx = p.x * W + mouse.px * 10 * p.z;
        var sy = ((p.y * H - scrollSm * 0.08 * p.z) % H + H) % H + mouse.py * 8 * p.z;
        ctx.globalAlpha = a * p.z;
        ctx.fillRect(sx * DPR, sy * DPR, p.r * DPR, p.r * DPR);
      }

      // papeis
      for (var k = 0; k < scraps.length; k++) {
        var s = scraps[k];
        s.y += s.vy * dt;
        s.ph += s.swayF * dt;
        s.rot += s.vrot * dt;
        s.flip += s.vflip * dt;
        // cursor empurra o papel (vento)
        var wrapH = H + 120;
        if (s.y > wrapH * 1000) s.y -= wrapH * 1000;
        var bx = s.x + Math.sin(s.ph) * s.sway + mouse.px * 16 * s.z + s.kx;
        var by = s.y - scrollSm * 0.12 * s.z + mouse.py * 12 * s.z + s.ky;
        var yy = ((by + 60) % wrapH + wrapH) % wrapH - 60;
        var dx = bx - mouse.x, dy = yy - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) {
          var d = Math.sqrt(d2) || 1, f = (120 - d) / 120;
          s.kx += (dx / d) * f * 90 * dt * s.z;
          s.ky += (dy / d) * f * 90 * dt * s.z;
          s.vrot += (Math.random() - 0.5) * f * dt * 4;
        }
        s.kx *= 1 - Math.min(1, dt * 0.9);
        s.ky *= 1 - Math.min(1, dt * 0.9);
        s.vrot = Math.max(-1.4, Math.min(1.4, s.vrot));


        var fl = Math.cos(s.flip);
        var sxs = Math.max(0.12, Math.abs(fl));
        var cr = Math.cos(s.rot), sr = Math.sin(s.rot);
        ctx.setTransform(cr * sxs * DPR, sr * sxs * DPR, -sr * DPR, cr * DPR, bx * DPR, yy * DPR);
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = fl < 0 && s.kind !== 3 ? pal.back : s.color;
        var w = s.size, h = s.size * (s.kind === 2 ? 1 / s.ratio : s.ratio);
        if (s.kind === 0 || s.kind === 2) {
          ctx.fillRect(-w / 2, -h / 2, w, h);
        } else if (s.kind === 1) {
          ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(0, 0, w * 0.28, 0, 6.283); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      raf = 0;
      if (!running) return;
      var t = now / 1000;
      var dt = last ? Math.min(0.05, t - last) : 0.016;
      // qualidade adaptativa: janela de 2s, se >35% dos frames passarem de 24ms, corta pela metade
      frames++; if (dt > 0.024) slow++;
      if (!winStart) winStart = t;
      if (t - winStart > 2) {
        if (frames > 20 && slow / frames > 0.35) {
          quality *= 0.5;
          if (quality < 0.2) { stop(); canvas.remove(); root.classList.remove("m-bg-on"); return; }
          populate();
        }
        frames = 0; slow = 0; winStart = t;
      }
      last = t;
      draw(dt, t);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running || hidden || videoOn) return;
      running = true; last = 0; winStart = 0; frames = 0; slow = 0;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    var rzT = 0;
    window.addEventListener("resize", function () { clearTimeout(rzT); rzT = setTimeout(resize, 120); }, { passive: true });
    window.addEventListener("scroll", function () { scrollY = window.scrollY || 0; }, { passive: true });
    if (FINE) {
      window.addEventListener("pointermove", function (e) {
        mouse.x = e.clientX; mouse.y = e.clientY;
        mouse.tx = (e.clientX / (W || 1)) * 2 - 1;
        mouse.ty = (e.clientY / (H || 1)) * 2 - 1;
      }, { passive: true });
      doc.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; }, { passive: true });
    }
    doc.addEventListener("visibilitychange", function () {
      hidden = doc.hidden;
      if (hidden) stop(); else start();
    });

    bg = {
      setVideo: function (on) {
        videoOn = on;
        root.classList.toggle("m-video-on", on);
        if (on) stop(); else start();
      },
      stats: function () { return { scraps: scraps.length, specks: specks.length, quality: quality, running: running, dpr: DPR }; }
    };

    resize();
    root.classList.add("m-bg-on");
    start();
  }

  // video tocando (tag <video>) ou player em iframe com foco: fundo congela
  function watchVideo() {
    var playing = new Set();
    var iframeFocus = false;
    function sync() { if (bg) bg.setVideo(playing.size > 0 || iframeFocus); }
    doc.addEventListener("play", function (e) { if (e.target && e.target.tagName === "VIDEO") { playing.add(e.target); sync(); } }, true);
    ["pause", "ended", "emptied"].forEach(function (ev) {
      doc.addEventListener(ev, function (e) { if (e.target && e.target.tagName === "VIDEO") { playing.delete(e.target); sync(); } }, true);
    });
    window.addEventListener("blur", function () {
      setTimeout(function () {
        var a = doc.activeElement;
        if (a && a.tagName === "IFRAME" && a.closest(".video-wrap")) { iframeFocus = true; sync(); }
      }, 0);
    });
    window.addEventListener("focus", function () { if (iframeFocus) { iframeFocus = false; sync(); } });
    // video removido do DOM (troca de aula) sai do conjunto
    setInterval(function () {
      playing.forEach(function (v) { if (!v.isConnected || v.paused) playing.delete(v); });
      sync();
    }, 3000);
  }

  // ==========================================================================
  // 2. ENTRADAS COREOGRAFADAS (stagger) via MutationObserver
  // ==========================================================================
  var seen = new WeakSet();
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    var i = 0;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      play(en.target, "m-in", Math.min(i++, 6) * 60);
    });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;

  function play(el, cls, delay) {
    el.classList.remove("m-wait");
    el.style.setProperty("--m-d", delay + "ms");
    el.classList.add(cls);
    var done = function (e) {
      if (e && e.target !== el) return;
      el.classList.remove(cls);
      el.style.removeProperty("--m-d");
      el.removeEventListener("animationend", done);
    };
    el.addEventListener("animationend", done);
    setTimeout(done, delay + 1400); // garantia: nunca deixa a classe presa
  }

  // containers nunca animam: quem anima sao os filhos
  var CONTAINERS = ".lesson-split,.lesson-media,.lesson-text,.material,.page-lesson,.manual-root,.manual-panel";
  var CARDS = ".prem-card,.team-card,.rolecard,.compare__card,.prem-offer-card";
  var TILT = ".prem-card:not(.prem-card-video),.team-card,.rolecard,.compare__card,.prem-offer-card,.material .cardbox";

  function collectContent(host) {
    var list = [];
    function add(el) {
      if (!el || el.nodeType !== 1 || seen.has(el)) return;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
      if (el.matches(CONTAINERS)) {
        for (var c = el.firstElementChild; c; c = c.nextElementSibling) add(c);
        return;
      }
      if (el.classList.contains("skeleton") || el.querySelector(".skeleton")) return;
      list.push(el);
    }
    for (var c = host.firstElementChild; c; c = c.nextElementSibling) add(c);
    // cartoes dentro de grades (vitrine, equipe) entram um a um
    host.querySelectorAll(CARDS).forEach(function (el) { if (!seen.has(el)) list.push(el); });
    // tira quem tem ancestral ja na lista (sem animacao dupla aninhada)
    var set = new Set(list);
    return list.filter(function (el) {
      for (var p = el.parentElement; p && p !== host; p = p.parentElement) if (set.has(p)) return false;
      return true;
    });
  }

  function choreograph(list, cls, step, max) {
    if (!list.length) return;
    var vh = window.innerHeight;
    var i = 0;
    list.forEach(function (el) {
      seen.add(el);
      var r = el.getBoundingClientRect();
      var visible = r.bottom > 0 && r.top < vh;
      if (visible || !io || cls !== "m-in") {
        play(el, cls, Math.min(i++, max) * step);
      } else {
        el.classList.add("m-wait");
        io.observe(el);
      }
    });
  }

  function wireContent() {
    var content = doc.getElementById("content");
    if (!content) return;
    var pending = false;
    function flush() {
      pending = false;
      choreograph(collectContent(content), "m-in", 55, 10);
      content.querySelectorAll(TILT).forEach(bindTilt);
      content.querySelectorAll(".lf-done").forEach(bindDone);
      content.querySelectorAll(".lf-stars").forEach(bindStars);
    }
    new MutationObserver(function () {
      if (!pending) { pending = true; requestAnimationFrame(flush); }
    }).observe(content, { childList: true, subtree: true });
    flush();
  }

  function wireNav() {
    var nav = doc.getElementById("nav");
    if (!nav) return;
    var pending = false;
    function flush() {
      pending = false;
      var list = [];
      nav.querySelectorAll(".nav-section-head,.nav-section.open .nav-item").forEach(function (el) {
        if (seen.has(el) || el.querySelector(".skeleton")) return;
        list.push(el);
      });
      nav.querySelectorAll(".nav-item").forEach(function (el) { seen.add(el); });
      choreograph(list, "m-in-x", 38, 14);
    }
    new MutationObserver(function (muts) {
      var structural = false;
      muts.forEach(function (m) {
        if (m.type === "childList") structural = true;
        if (m.type === "attributes" && m.target.classList && m.target.classList.contains("nav-item")) {
          var was = (m.oldValue || "").split(/\s+/).indexOf("active") !== -1;
          if (!was && m.target.classList.contains("active")) {
            var el = m.target;
            el.classList.remove("m-pop"); void el.offsetWidth; el.classList.add("m-pop");
            setTimeout(function () { el.classList.remove("m-pop"); }, 700);
          }
        }
      });
      if (structural && !pending) { pending = true; requestAnimationFrame(flush); }
    }).observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
    flush();

    // gaveta do celular: itens entram em cascata quando abre
    var sidebar = doc.getElementById("sidebar");
    if (sidebar) {
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          var was = (m.oldValue || "").split(/\s+/).indexOf("open") !== -1;
          if (!was && sidebar.classList.contains("open")) {
            var items = [].slice.call(sidebar.querySelectorAll(".sidebar-top,.nav-section-head,.nav-section.open .nav-item,.sidebar-foot"));
            items.forEach(function (el, i) { if (i < 16) play(el, "m-in-x", 80 + i * 32); });
          }
        });
      }).observe(sidebar, { attributes: true, attributeFilter: ["class"], attributeOldValue: true });
    }
  }

  // app aparece depois do /api/me: moldura (topbar, topo e rodape do menu) entra
  function wireAppShell() {
    var app = doc.getElementById("app");
    if (!app) return;
    function enter() {
      var list = [].slice.call(app.querySelectorAll(".topbar,.sidebar-top,.sidebar-foot"));
      list.forEach(function (el, i) { seen.add(el); play(el, "m-in", i * 90); });
    }
    if (!app.hidden) enter();
    else new MutationObserver(function (m, obs) {
      if (!app.hidden) { obs.disconnect(); enter(); }
    }).observe(app, { attributes: true, attributeFilter: ["hidden"] });
  }

  // ==========================================================================
  // 3. FISICA DE HOVER: cartao inclina pro cursor, sombra acompanha;
  //    botoes principais tem leve atracao magnetica.
  // ==========================================================================
  var tiltBound = new WeakSet();
  function bindTilt(el) {
    if (!FINE || REDUCE || tiltBound.has(el)) return;
    if (el.querySelector("video,iframe")) return;
    tiltBound.add(el);
    el.classList.add("m-tilt");
    var raf = 0, lx = 0, ly = 0;
    function apply() {
      raf = 0;
      var r = el.getBoundingClientRect();
      var nx = Math.max(-1, Math.min(1, ((lx - r.left) / r.width) * 2 - 1));
      var ny = Math.max(-1, Math.min(1, ((ly - r.top) / r.height) * 2 - 1));
      el.style.setProperty("--m-r", (nx * 1.6).toFixed(2) + "deg");
      el.style.setProperty("--m-sx", (7 - nx * 5).toFixed(1) + "px");
      el.style.setProperty("--m-sy", (11 - ny * 4).toFixed(1) + "px");
    }
    el.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") el.classList.add("m-hov"); });
    el.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      lx = e.clientX; ly = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    el.addEventListener("pointerleave", function () {
      el.classList.remove("m-hov");
      el.style.removeProperty("--m-r"); el.style.removeProperty("--m-sx"); el.style.removeProperty("--m-sy");
    });
  }

  var MAGNET = ".btn-primary,.btn-google,.lf-done,.comm-activate,.skill-download,.skill-upgrade,.support-submit,.sched-confirm,.naia-sales-cta,.prem-offer-cta";
  function wireMagnet() {
    if (!FINE || REDUCE) return;
    var cur = null, raf = 0, lx = 0, ly = 0;
    function apply() {
      raf = 0;
      if (!cur) return;
      var r = cur.getBoundingClientRect();
      var nx = ((lx - r.left) / r.width) * 2 - 1, ny = ((ly - r.top) / r.height) * 2 - 1;
      cur.style.translate = (nx * 4).toFixed(1) + "px " + (ny * 3).toFixed(1) + "px";
    }
    doc.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var t = e.target && e.target.closest ? e.target.closest(MAGNET) : null;
      if (t && t.disabled) t = null;
      if (cur && cur !== t) { cur.style.translate = ""; }
      cur = t;
      if (!cur) return;
      lx = e.clientX; ly = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
  }

  // ==========================================================================
  // 4. CELEBRACAO: concluir aula solta confete de papel; estrelas pulam em cascata
  // ==========================================================================
  var doneBound = new WeakSet();
  function bindDone(btn) {
    if (doneBound.has(btn)) return;
    doneBound.add(btn);
    btn.addEventListener("click", function () {
      // o app.js alterna a classe no mesmo clique; lemos no frame seguinte
      requestAnimationFrame(function () {
        if (!btn.classList.contains("done")) return;
        btn.classList.remove("m-celebrate"); void btn.offsetWidth; btn.classList.add("m-celebrate");
        setTimeout(function () { btn.classList.remove("m-celebrate"); }, 800);
        burst(btn);
      });
    });
  }
  var starsBound = new WeakSet();
  function bindStars(box) {
    if (starsBound.has(box)) return;
    starsBound.add(box);
    box.addEventListener("click", function (e) {
      var s = e.target.closest && e.target.closest(".lf-star");
      if (!s) return;
      requestAnimationFrame(function () {
        box.querySelectorAll(".lf-star.on").forEach(function (st, i) {
          st.classList.remove("m-star"); void st.offsetWidth;
          st.style.setProperty("--m-d", i * 55 + "ms");
          st.classList.add("m-star");
          setTimeout(function () { st.classList.remove("m-star"); st.style.removeProperty("--m-d"); }, 500 + i * 55);
        });
        if (s.getAttribute("data-v") === "5") burst(s, 14);
      });
    });
  }

  function burst(el, count) {
    if (REDUCE || !el.animate) return;
    var cols = palette().confetti;
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var n = count || 26;
    // o confete nunca cruza o player: trajetorias que passam pelo video sao sorteadas de novo
    var players = [].slice.call(doc.querySelectorAll(".video-wrap")).map(function (v) { return v.getBoundingClientRect(); });
    function hitsPlayer(x, y) {
      for (var k = 0; k < players.length; k++) {
        var q = players[k];
        if (x > q.left - 12 && x < q.right + 12 && y > q.top - 12 && y < q.bottom + 12) return true;
      }
      return false;
    }
    for (var i = 0; i < n; i++) {
      var ang, dist, tx, ty, tries = 0, ok = false;
      while (tries++ < 6 && !ok) {
        ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
        if (tries > 3) ang = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2; // cai pra baixo
        dist = 60 + Math.random() * 110;
        tx = Math.cos(ang) * dist; ty = Math.sin(ang) * dist;
        ok = !hitsPlayer(cx + tx * 0.8, cy + ty) && !hitsPlayer(cx + tx * 0.4, cy + ty * 0.5) && !hitsPlayer(cx + tx, cy + ty + 90);
      }
      if (!ok) continue;
      var p = doc.createElement("i");
      p.className = "m-confetti";
      var w = 5 + Math.random() * 6, h = 7 + Math.random() * 8;
      p.style.width = w + "px"; p.style.height = h + "px";
      p.style.background = cols[i % cols.length];
      doc.body.appendChild(p);
      var rot = (Math.random() - 0.5) * 720;
      var dur = 900 + Math.random() * 500;
      var anim = p.animate([
        { transform: "translate(" + cx + "px," + cy + "px) rotate(0deg) scale(.4)", opacity: 1 },
        { transform: "translate(" + (cx + tx * 0.8) + "px," + (cy + ty) + "px) rotate(" + rot * 0.6 + "deg) scale(1)", opacity: 1, offset: 0.45 },
        { transform: "translate(" + (cx + tx) + "px," + (cy + ty + 90) + "px) rotate(" + rot + "deg) scale(.9)", opacity: 0 }
      ], { duration: dur, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
      anim.onfinish = (function (node) { return function () { node.remove(); }; })(p);
    }
  }

  // ==========================================================================
  // 5. LOGIN / RESET: entrada marcante
  // ==========================================================================
  function wireLogin() {
    if (!doc.body.classList.contains("login-page")) return;
    if (REDUCE) return;
    root.classList.add("m-login");
    var card = doc.querySelector(".login-card");
    if (!card) return;
    var items = [].slice.call(card.querySelectorAll(".login-head > *, .btn-google, .login-or, .field, .btn-primary, .forgot-link, .reset-lead, .login-foot"));
    items.forEach(function (el, i) { seen.add(el); play(el, "m-in", 420 + i * 70); });
  }

  // ==========================================================================
  ready(function () {
    if (REDUCE) return; // o CSS global de styles.css ja zera animacoes; aqui nao montamos nada
    mountBackground();
    watchVideo();
    wireLogin();
    wireAppShell();
    wireNav();
    wireContent();
    wireMagnet();
    doc.querySelectorAll(TILT).forEach(bindTilt);
  });

  // exposto so pra medicao/QA
  window.__motion = { stats: function () { return bg ? bg.stats() : null; } };
})();
