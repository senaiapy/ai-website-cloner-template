/* Pet da Naia, copia do pet customizado do Orca.
   Asset: ~/Library/Application Support/orca/sidekicks/custom/b1d83285-e9eb-4b67-bf3f-4c7bf418e338/spritesheet.webp
   Sprite/timings: orca-data.json ui.customPets[id=b1d83285...] (ui.petId ativo, ui.petSize 100).
   Logica: Orca.app app.asar out/renderer/assets/PetOverlay-BGb5u06F.js (PetOverlay, SpriteFrame,
   useDrag, keyframes step-end por frameDurationsMs, pet-bob 1.2s, clamp na viewport). */
(function () {
  "use strict";
  if (window.__naiaPetMounted) return;
  window.__naiaPetMounted = true;

  var API_BASE = "https://api-apostila.denderson.ai";
  var ASSET = "/img/naia-pet/spritesheet.webp?v=m202609281200";
  var SIZE = 150; // ui.petSize (Orca 100; apostila 150 por ordem do Chefe)
  var POS_KEY = "pet-overlay-position"; // mesma chave do Orca, sufixada pelo usuario
  var LAST_USER_KEY = "pet-overlay-last-user";

  // ui.customPets[b1d83285-e9eb-4b67-bf3f-4c7bf418e338].sprite, verbatim
  var SPRITE = {
    frameWidth: 192, frameHeight: 208, columns: 8, rows: 9,
    sheetWidth: 1536, sheetHeight: 1872, fps: 8, defaultAnimation: "idle",
    animations: {
      "idle": { row: 0, frames: 6, frameDurationsMs: [1680, 660, 660, 840, 840, 1920] },
      "running-right": { row: 1, frames: 8, frameDurationsMs: [300, 300, 300, 300, 300, 300, 300, 480] },
      "running-left": { row: 2, frames: 8, frameDurationsMs: [300, 300, 300, 300, 300, 300, 300, 480] },
      "waving": { row: 3, frames: 4, frameDurationsMs: [340, 340, 340, 640] },
      "jumping": { row: 4, frames: 5, frameDurationsMs: [320, 320, 320, 320, 640] },
      "failed": { row: 5, frames: 8, frameDurationsMs: [340, 340, 340, 340, 340, 340, 340, 560] },
      "waiting": { row: 6, frames: 6, frameDurationsMs: [380, 380, 380, 380, 380, 640] },
      "running": { row: 7, frames: 6, frameDurationsMs: [300, 300, 300, 300, 300, 520] },
      "review": { row: 8, frames: 6, frameDurationsMs: [400, 400, 400, 400, 400, 700] }
    }
  };
  var MAX_FRAME_MS = 6e4;

  // ---------- keyframes (O/k/A do Orca) ----------
  function validDurations(d, frames) {
    return Array.isArray(d) && d.length === frames &&
      d.every(function (v) { return Number.isFinite(v) && v > 0 && v <= MAX_FRAME_MS; }) ? d : null;
  }
  function durationStops(d, total, frameWidth, scale, rowY) {
    var out = [], acc = 0, prev = -1;
    for (var c = 0; c < d.length; c++) {
      var pct = +((acc / total) * 100).toFixed(4);
      if (pct <= prev || pct >= 100) return null;
      prev = pct;
      out.push(pct + "% { background-position: " + -(c * frameWidth * scale) + "px " + rowY + "px; }");
      acc += d[c];
    }
    return out;
  }
  function buildAnimation(id, frames, fps, frameWidth, scale, rowY, durations) {
    var name = "pet-" + id;
    var d = validDurations(durations, frames);
    if (d) {
      var total = d.reduce(function (a, b) { return a + b; }, 0);
      var stops = durationStops(d, total, frameWidth, scale, rowY);
      if (stops) return {
        keyframesCss: "@keyframes " + name + " { " + stops.join(" ") + " }",
        animationCss: name + " " + total / 1e3 + "s step-end infinite"
      };
    }
    var secs = Math.max(0.1, frames / Math.max(0.1, fps));
    return {
      keyframesCss: "@keyframes " + name + " { from { background-position: 0px " + rowY + "px; } to { background-position: " + -(frames * frameWidth * scale) + "px " + rowY + "px; } }",
      animationCss: name + " " + secs + "s steps(" + frames + ") infinite"
    };
  }

  // ---------- posicao (z/B/V/H do Orca) ----------
  function clampToViewport(p, size) {
    var maxX = Math.max(0, window.innerWidth - size), maxY = Math.max(0, window.innerHeight - size);
    return { x: Math.min(Math.max(0, p.x), maxX), y: Math.min(Math.max(0, p.y), maxY) };
  }
  function defaultPosition() {
    return clampToViewport({ x: window.innerWidth - SIZE - 64, y: window.innerHeight - SIZE - 16 }, SIZE);
  }
  function storageKey(user) { return POS_KEY + ":" + (user || "anon"); }
  function readPosition(user) {
    try {
      var raw = window.localStorage.getItem(storageKey(user));
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (typeof p.x !== "number" || typeof p.y !== "number") return null;
      return clampToViewport({ x: p.x, y: p.y }, SIZE);
    } catch (e) { return null; }
  }
  function writePosition() {
    try { window.localStorage.setItem(storageKey(user), JSON.stringify(pos)); } catch (e) {}
  }

  // ---------- estado ----------
  var user = null;
  try { user = window.localStorage.getItem(LAST_USER_KEY); } catch (e) {}
  var pos = readPosition(user) || defaultPosition();
  var dragging = false, dragAnimation = null, hovering = false, dragGeneration = 0;
  var pointerId = null, grabOffset = { x: 0, y: 0 }, lastX = 0, lastAnim = null;
  var visible = document.visibilityState === "visible";
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduced = !!(mq && mq.matches);

  // ---------- DOM (mesma arvore do PetOverlay) ----------
  var root = document.createElement("div");
  root.className = "naia-pet";
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("data-naia-pet", "");
  var row = document.createElement("div");
  row.className = "naia-pet__row";
  var grab = document.createElement("div");
  grab.className = "naia-pet__grab";
  var styleEl = document.createElement("style");
  var sprite = document.createElement("div");
  sprite.className = "naia-pet__sprite";
  grab.appendChild(styleEl);
  grab.appendChild(sprite);
  row.appendChild(grab);
  root.appendChild(row);

  var scale = Math.min(SIZE / SPRITE.frameWidth, SIZE / SPRITE.frameHeight);
  sprite.style.width = SPRITE.frameWidth * scale + "px";
  sprite.style.height = SPRITE.frameHeight * scale + "px";
  sprite.style.backgroundImage = "url(" + ASSET + ")";
  sprite.style.backgroundSize = SPRITE.sheetWidth * scale + "px " + SPRITE.sheetHeight * scale + "px";

  var uid = "naiapet" + Math.random().toString(36).slice(2, 8);
  var currentKey = "";

  // T/w do Orca: com sessoes retidas (o caso real do Chefe) a base e "review" (tablet, positivo, pensativa);
  // hover = jumping; arrastando = direcao ou base
  function animationName() {
    var base = "review";
    return dragging ? (dragAnimation || base) : hovering ? "jumping" : base;
  }

  function render() {
    root.style.left = pos.x + "px";
    root.style.top = pos.y + "px";
    root.classList.toggle("is-dragging", dragging);

    var live = visible && !reduced;
    var spriteRunning = live && (!dragging || dragAnimation !== null);
    var bobRunning = live && !dragging;
    grab.style.animationPlayState = bobRunning ? "running" : "paused";

    var a = SPRITE.animations[animationName()] || SPRITE.animations[SPRITE.defaultAnimation];
    var r = a.row, frames = Math.max(1, a.frames);
    var key = uid + "-" + r + "-" + frames + "-" + dragGeneration;
    if (key !== currentKey) {
      currentKey = key;
      var rowY = -(r * SPRITE.frameHeight * scale);
      var built = buildAnimation(key, frames, SPRITE.fps, SPRITE.frameWidth, scale, rowY, a.frameDurationsMs);
      styleEl.textContent = built.keyframesCss;
      sprite.style.backgroundPosition = "0px " + rowY + "px";
      sprite.style.animation = built.animationCss;
    }
    sprite.style.animationPlayState = spriteRunning ? "running" : "paused";
  }

  // ---------- drag (E/C do Orca) ----------
  function dirFor(prev, dx) {
    return dx >= 4 ? { animation: "running-right", accepted: true }
      : dx <= -4 ? { animation: "running-left", accepted: true }
      : { animation: prev, accepted: false };
  }
  grab.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 || pointerId !== null) return;
    pointerId = e.pointerId;
    grabOffset = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    lastX = e.clientX;
    lastAnim = null;
    try { grab.setPointerCapture(e.pointerId); } catch (err) {}
    dragging = true;
    dragAnimation = null;
    dragGeneration++;
    e.preventDefault();
    render();
  });
  grab.addEventListener("pointermove", function (e) {
    if (e.pointerId !== pointerId) return;
    var d = dirFor(lastAnim, e.clientX - lastX);
    if (d.accepted) {
      lastX = e.clientX;
      if (d.animation !== lastAnim) { lastAnim = d.animation; dragAnimation = d.animation; }
    }
    pos = clampToViewport({ x: e.clientX - grabOffset.x, y: e.clientY - grabOffset.y }, SIZE);
    render();
  });
  function endDrag(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    lastAnim = null;
    try { if (grab.hasPointerCapture(e.pointerId)) grab.releasePointerCapture(e.pointerId); } catch (err) {}
    dragging = false;
    dragAnimation = null;
    render();
    writePosition();
  }
  grab.addEventListener("pointerup", endDrag);
  grab.addEventListener("pointercancel", endDrag);
  grab.addEventListener("lostpointercapture", endDrag);
  grab.addEventListener("pointerenter", function () { hovering = true; render(); });
  grab.addEventListener("pointerleave", function () { hovering = false; render(); });

  window.addEventListener("resize", function () {
    pos = clampToViewport(pos, SIZE);
    render();
    if (!dragging) writePosition();
  });
  document.addEventListener("visibilitychange", function () {
    visible = document.visibilityState === "visible";
    render();
  });
  if (mq) {
    var onMq = function () { reduced = mq.matches; render(); };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  // posicao por usuario: /api/me (cookie de sessao). Sem sessao, fica "anon".
  function resolveUser() {
    if (!window.fetch) return;
    fetch(API_BASE + "/api/me", { credentials: "include" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var u = j && j.user ? String(j.user.id || j.user.email || "") : "";
        if (!u || u === user) return;
        user = u;
        try { window.localStorage.setItem(LAST_USER_KEY, u); } catch (e) {}
        if (dragging) return;
        pos = readPosition(user) || pos;
        render();
      })
      .catch(function () {});
  }

  function mount() {
    document.body.appendChild(root);
    render();
    resolveUser();
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
