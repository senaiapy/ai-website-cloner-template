const API_BASE = "https://api-apostila.denderson.ai";
// Area de membros — vanilla JS. Sessao via cookie httpOnly (sem auth no localStorage).
(function () {
  "use strict";

  const loader = document.getElementById("loader");
  const app = document.getElementById("app");
  const nav = document.getElementById("nav");
  const content = document.getElementById("content");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  const menuBtn = document.getElementById("menuBtn");

  const LAST_KEY = "naia_last_lesson"; // so conveniencia de UX, nunca auth
  let lessons = [];
  let activeId = null;
  let currentUser = null;       // usuario logado (pra checar admin nos comentarios)
  let progressMap = null;       // {lessonId: {completed, rating}} · concluir + nota das aulas
  let navSeq = 0;               // token monotonico de navegacao (corrige corrida entre aulas)
  const loaderHTML0 = loader.innerHTML; // markup original do loader (pra restaurar no retry)

  // ---------- estado do modo manual / marketplaces ----------
  let manualData = null;        // { nav, views, sections, team, catalog } depois do fetch
  let manualTeam = {};          // slug -> agente (montado de manualData.team)
  let manualSection = null;     // id da secao em foco
  let inManual = false;         // true enquanto uma view de manual/marketplace esta aberta
  let manualLesson = null;      // a aula (manual/skills/opensource) atual — define qual view usar

  // ---------- planos (gating starter x complete) ----------
  // Links de checkout/upgrade da Hubla (PLACEHOLDER — trocar pelos reais depois).
  var CHECKOUT_297_URL = "#";
  var UPGRADE_700_URL = "https://pay.hub.la/th0mxBCOLnLdxdzojX3X";
  // suporte agora é AGENDAMENTO de reunião (calendário integrado ao Google Calendar), não WhatsApp.
  // comunidade: grupo WhatsApp (entra após confirmar trial; aprovação humana até 2 dias) + checkout fundador.
  var COMMUNITY_WHATSAPP_URL = "https://chat.whatsapp.com/EKR4iYKkf6oJO69keTWNfH";
  // teste gratis de 30 dias = cadastro no checkout Hubla com trial; a Hubla avisa o webhook e o botao do grupo libera.
  var COMMUNITY_TRIAL_CHECKOUT_URL = "https://pay.hub.la/EmYU9XaLDcbn8H5fRCSY";
  // vídeo "Recado do Denderson" no 1o card da vitrine premium
  var RECADO_VIDEO_URL = "/video/recado-denderson.mp4";
  // vídeo de abertura no topo do submenu de Skills (loop mudo até dar play)
  var SKILLS_INTRO_VIDEO_URL = "/video/skills-intro.mp4";

  var STARTER_AGENTS = ["naia", "juliana-ops", "paulo-dev", "davi-sdr"];

  // plano do usuario logado; sessao antiga sem .plan vira 'complete' (nao quebra ninguem)
  function userPlan() {
    return currentUser && currentUser.plan === "starter" ? "starter" : "complete";
  }
  // a skill/plataforma (entrada do catalog) esta liberada pro plano atual?
  function planAllowsSkill(cat) {
    if (userPlan() === "complete") return true;
    return !!(cat && cat.kind === "skill" && cat.status === "installed");
  }
  // o agente (por slug) esta liberado pro plano atual?
  function planAllowsAgent(slug) {
    if (userPlan() === "complete") return true;
    return STARTER_AGENTS.indexOf(slug) !== -1;
  }

  // ---------- helpers ----------
  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "N";
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // <video> que sai da tela (troca de aula/secao/card) e pausado pelo navegador, mas CONTINUA
  // baixando o arquivo e rouba banda do video novo. Aqui o download e cortado de verdade.
  function releaseMedia(node) {
    const vids = node.tagName === "VIDEO" ? [node] : node.querySelectorAll ? node.querySelectorAll("video") : [];
    for (const v of vids) {
      if (v.isConnected) continue; // foi so movido, continua na pagina
      try { v.pause(); v.removeAttribute("src"); v.querySelectorAll("source").forEach((s) => s.remove()); v.load(); } catch (e) {}
    }
  }
  new MutationObserver((muts) => {
    for (const m of muts) m.removedNodes.forEach((n) => { if (n.nodeType === 1) releaseMedia(n); });
  }).observe(content, { childList: true, subtree: true });

  // wrapper unico de fetch: timeout via AbortController (default 12s) + tratamento central de status.
  // 401/403 = sessao invalida, manda pro login (lanca sentinel __auth pra abortar o fluxo do chamador).
  // 5xx/erro de rede/timeout = NAO desloga: a resposta (ou o throw) cai no catch do chamador.
  function apiFetch(url, opts) {
    opts = opts || {};
    const full = /^https?:/i.test(url) ? url : API_BASE + url;
    const ctrl = new AbortController();
    const ms = opts.timeout || 12000;
    const t = setTimeout(function () { ctrl.abort(); }, ms);
    const init = Object.assign({ credentials: "include" }, opts, { signal: ctrl.signal });
    delete init.timeout;
    return fetch(full, init).then(function (r) {
      if (r.status === 401 || r.status === 403) {
        location.replace("/login.html");
        const err = new Error("auth"); err.__auth = true; throw err;
      }
      return r;
    }).finally(function () { clearTimeout(t); });
  }

  // ---------- arranque: confirma sessao ----------
  async function boot() {
    let me;
    try {
      const r = await apiFetch("/api/me");
      if (!r.ok) throw new Error("me");
      me = (await r.json()).user;
    } catch (e) {
      if (e && e.__auth) return;   // 401/403: apiFetch ja esta indo pro login
      return showBootError();      // 5xx/rede/timeout: mantem a tela, oferece retry (nao desloga)
    }

    bootFails = 0;
    currentUser = me;
    paintUser(me);
    loader.hidden = true;
    app.hidden = false;
    mountGridScene();
    mountWalkers();
    wirePayModal();

    await loadLessons();
  }

  // instabilidade momentanea no arranque (5xx/rede/timeout): NAO desloga, mostra retry com backoff.
  let bootFails = 0, bootTimer = null;
  function showBootError() {
    bootFails++;
    if (bootTimer) { clearTimeout(bootTimer); bootTimer = null; }
    app.hidden = true;
    loader.hidden = false;
    loader.innerHTML =
      '<div class="center-state">' +
        '<div class="inline-msg error" style="max-width:420px">' +
          'Instabilidade momentanea. Nao deu pra carregar agora, isso costuma ser passageiro. ' +
          '<button type="button" id="bootRetry" style="margin-top:10px">Tentar de novo</button>' +
        "</div>" +
      "</div>";
    const retry = function () {
      if (bootTimer) { clearTimeout(bootTimer); bootTimer = null; }
      loader.innerHTML = loaderHTML0;
      boot();
    };
    const b = document.getElementById("bootRetry");
    if (b) b.addEventListener("click", retry);
    // backoff automatico entre tentativas: 4s, 8s, 16s... ate 60s
    bootTimer = setTimeout(retry, Math.min(60000, 2000 * Math.pow(2, bootFails)));
  }

  // Checkout da Hubla SEM tirar o aluno da area. O campo de cartao da Hubla
  // (mfe-tokenization, frame-ancestors https://*.hub.la) NAO pode ser embutido em
  // iframe de outro dominio — por isso o checkout abre numa JANELA segura (top-level
  // pay.hub.la, onde o cartao funciona), com a area de membros intacta atras + overlay.
  function wirePayModal() {
    if (window.__payModalWired) return; window.__payModalWired = true;
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a[data-prem]");
      if (!a) return;
      const url = a.getAttribute("href") || "";
      if (!url || url === "#" || url.charAt(0) === "#") return; // sem checkout real: nao intercepta
      e.preventDefault();
      openPayModal(url);
    });
  }
  function openCheckoutWindow(url) {
    const w = 480, h = 824;
    const ow = window.outerWidth || screen.width, oh = window.outerHeight || screen.height;
    const sx = window.screenX || 0, sy = window.screenY || 0;
    const left = Math.round(sx + Math.max(0, (ow - w) / 2));
    const top = Math.round(sy + Math.max(0, (oh - h) / 2));
    return window.open(url, "hubla_checkout", "width=" + w + ",height=" + h + ",left=" + left + ",top=" + top + ",resizable=yes,scrollbars=yes");
  }
  function openPayModal(url) {
    // reabrir o checkout nao pode vazar o interval/listener do modal anterior
    const old = document.getElementById("payModalScrim");
    if (old) {
      try { clearInterval(old._poll); } catch (e) {}
      if (old._onEsc) document.removeEventListener("keydown", old._onEsc);
      old.remove();
    }
    let win = openCheckoutWindow(url);

    const scrim = document.createElement("div");
    scrim.id = "payModalScrim"; scrim.className = "pay-scrim";
    const box = document.createElement("div"); box.className = "pay-note";
    box.innerHTML =
      '<button type="button" class="pay-close" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div class="pay-note-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>' +
      '<h3 class="pay-note-title">Checkout aberto numa janela segura</h3>' +
      '<p class="pay-note-sub">Finalize o pagamento na janela que abriu por cima. Quando terminar, volte aqui e atualize seus acessos, a liberação é na hora.</p>' +
      '<div class="pay-note-acts">' +
        '<button type="button" class="pay-btn primary" data-act="refresh">Já paguei, atualizar acessos</button>' +
        '<button type="button" class="pay-btn ghost" data-act="reopen">Reabrir a janela do checkout</button>' +
      '</div>';
    scrim.appendChild(box);
    document.body.appendChild(scrim);
    document.body.style.overflow = "hidden";

    const close = () => { clearInterval(poll); scrim.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onEsc); };
    function onEsc(ev) { if (ev.key === "Escape") close(); }
    box.querySelector(".pay-close").addEventListener("click", close);
    scrim.addEventListener("click", (ev) => { if (ev.target === scrim) close(); });
    box.querySelector('[data-act="refresh"]').addEventListener("click", () => location.reload());
    box.querySelector('[data-act="reopen"]').addEventListener("click", () => { try { if (win && !win.closed) win.focus(); else win = openCheckoutWindow(url); } catch (e) { win = openCheckoutWindow(url); } });
    document.addEventListener("keydown", onEsc);
    scrim._onEsc = onEsc; // guardado pra remover o listener se o modal for reaberto sem fechar

    // quando o aluno fecha a janela do checkout, oferecemos atualizar os acessos
    const poll = setInterval(() => {
      if (win && win.closed) {
        clearInterval(poll);
        const sub = box.querySelector(".pay-note-sub");
        if (sub) sub.textContent = "Janela do checkout fechada. Se você concluiu o pagamento, clique abaixo pra atualizar seus acessos.";
      }
    }, 1200);
    scrim._poll = poll; // guardado pra dar clearInterval se o modal for reaberto sem fechar

    // popup bloqueado pelo navegador: instrui a reabrir no gesto
    if (!win) {
      const sub = box.querySelector(".pay-note-sub");
      if (sub) sub.textContent = "Seu navegador bloqueou a janela. Clique em “Reabrir a janela do checkout” pra continuar.";
    }
  }

  // Mascotes pixel (Claudinho + OpenClaw) passeando ATRÁS do conteúdo, só na área de conteúdo (nunca no menu).
  // Motor de roaming adaptado do handoff: alvos aleatórios, repulsão boids (não se esbarram), flip pela direção,
  // idle/pausas. Limites = a ÁREA DE CONTEÚDO (layer), não a viewport; layer fica em z-index:-1 (camada do fundo 3D).
  function mountWalkers() {
    if (document.querySelector("#avalanche-walkers")) return;
    const host = document.querySelector(".member-body");
    if (!host) return;
    const layer = document.createElement("div");
    layer.id = "avalanche-walkers";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = '<div class="mascot claudinho"></div><div class="mascot openclaw"></div>';
    host.appendChild(layer);

    const REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    // alinha o overlay com a área de conteúdo (depois do sidebar)
    function syncLeft() {
      const c = document.querySelector(".content");
      if (c) { const r = c.getBoundingClientRect(); layer.style.left = Math.max(0, Math.round(r.left)) + "px"; }
    }
    syncLeft();

    const nodes = layer.querySelectorAll(".mascot");
    function vw() { return layer.clientWidth || 100; }
    function vh() { return layer.clientHeight || 100; }
    function rand(a, b) { return a + Math.random() * (b - a); }
    const SPEED = 48, ARRIVE = 6, EDGE_PAD = 10, SEP_FORCE = 240;
    // mascotes andam SO na faixa de baixo (terco inferior) — o "chao" do grid 3D
    function topY(){ return Math.round(vh() * 0.66); }
    function minSep() {
      const usableW = vw() - 2 * EDGE_PAD, usableH = vh() - topY() - EDGE_PAD;
      const cap = Math.max(60, Math.min(usableW, usableH) * 0.42);
      return Math.min(130, cap);
    }
    function Mascot(el, seed) {
      this.el = el; this.seed = seed || 1; this.measure();
      this.x = rand(EDGE_PAD + this.w * 0.5, vw() - this.w * 0.5 - EDGE_PAD);
      this.y = rand(topY(), vh() - this.h - EDGE_PAD);
      this.tx = this.x; this.ty = this.y; this.dir = 1; this.state = "idle"; this.timer = rand(0.4, 1.6);
    }
    Mascot.prototype.measure = function () { this.w = this.el.offsetWidth || 30; this.h = this.el.offsetHeight || 50; };
    Mascot.prototype.clampTarget = function () {
      let minx = EDGE_PAD + this.w * 0.5, maxx = vw() - this.w * 0.5 - EDGE_PAD; if (maxx < minx) maxx = minx;
      if (this.tx < minx) this.tx = minx; if (this.tx > maxx) this.tx = maxx;
      let miny = topY(), maxy = vh() - this.h - EDGE_PAD; if (maxy < miny) maxy = miny;
      if (this.ty < miny) this.ty = miny; if (this.ty > maxy) this.ty = maxy;
    };
    Mascot.prototype.sampleTarget = function () {
      this.tx = rand(EDGE_PAD + this.w * 0.5, vw() - this.w * 0.5 - EDGE_PAD);
      this.ty = rand(topY(), vh() - this.h - EDGE_PAD); this.clampTarget();
    };
    // gera uma ROTA LONGA (vários waypoints, cada perna bem comprida) -> demora muito a repetir
    Mascot.prototype.buildRoute = function () {
      const N = 16; const pts = []; let lx = this.x, ly = this.y;
      const minLeg = Math.max(120, (vw() - 2 * EDGE_PAD) * 0.35); // cada trecho razoavelmente grande
      for (let i = 0; i < N; i++) {
        let best = null, bestd = -1;
        for (let t = 0; t < 7; t++) {
          const cx = rand(EDGE_PAD + this.w * 0.5, vw() - this.w * 0.5 - EDGE_PAD);
          const cy = rand(topY(), vh() - this.h - EDGE_PAD);
          const d = Math.hypot(cx - lx, cy - ly);
          if (d > bestd) { bestd = d; best = { x: cx, y: cy }; }
          if (d >= minLeg) { best = { x: cx, y: cy }; break; }
        }
        pts.push(best); lx = best.x; ly = best.y;
      }
      this.route = pts;
    };
    Mascot.prototype.pickWander = function (other) {
      if (!this.route || !this.route.length) this.buildRoute();
      // próximo waypoint da rota; rejeita se cair colado no outro (tenta uns à frente)
      let p = this.route.shift();
      for (let k = 0; k < 4 && other; k++) {
        const dO = Math.hypot(p.x - other.x, p.y - other.y);
        if (dO >= minSep() || !this.route.length) break;
        p = this.route.shift() || p;
      }
      this.tx = p.x; this.ty = p.y; this.clampTarget();
      this.state = "walk";
    };
    Mascot.prototype.step = function (dt, other) {
      if (REDUCE) { this.state = "idle"; this.tx = this.x; this.ty = this.y; return; }
      if (other && this.state === "idle") {
        const dSelf = Math.hypot(other.x - this.x, other.y - this.y);
        if (dSelf < minSep() * 1.2) this.pickWander(other);
      }
      if (this.state === "idle") { this.timer -= dt; if (this.timer <= 0) this.pickWander(other); }
      if (this.state === "walk") {
        const dx = this.tx - this.x, dy = this.ty - this.y, dist = Math.hypot(dx, dy);
        if (dist <= ARRIVE) { this.x = this.tx; this.y = this.ty; this.state = "idle"; this.timer = rand(0.15, 0.7); }
        else { let sp = SPEED * dt; if (sp > dist) sp = dist; this.x += dx / dist * sp; this.y += dy / dist * sp; if (Math.abs(dx) > 1) this.dir = dx < 0 ? -1 : 1; }
      }
      if (other) {
        let sx = this.x - other.x, sy = this.y - other.y, sd = Math.hypot(sx, sy);
        const sep = minSep(), influence = sep * 1.6;
        if (sd < influence) {
          if (sd < 0.001) { sx = this.seed; sy = -this.seed; sd = Math.hypot(sx, sy); }
          const fall = (influence - sd) / influence; let push = SEP_FORCE * fall * fall * dt;
          if (sd < sep) { const hard = (sep - sd) / sep; push += SEP_FORCE * 2.2 * hard * dt; }
          this.x += sx / sd * push; this.y += sy / sd * push;
        }
      }
      let minx = this.w * 0.5 + EDGE_PAD, maxx = vw() - this.w * 0.5 - EDGE_PAD;
      if (this.x < minx) this.x = minx; if (this.x > maxx) this.x = maxx;
      let miny = topY(), maxy = vh() - this.h - EDGE_PAD; if (maxy < miny) maxy = miny;
      if (this.y < miny) this.y = miny; if (this.y > maxy) this.y = maxy;
    };
    Mascot.prototype.render = function () {
      const px = (this.x - this.w / 2).toFixed(1), py = this.y.toFixed(1);
      this.el.style.transform = "translate3d(" + px + "px," + py + "px,0) scaleX(" + this.dir + ")";
      const idle = this.state !== "walk";
      if (idle !== this._idleCls) { this.el.classList.toggle("is-idle", idle); this._idleCls = idle; }
    };
    const mascots = [];
    nodes.forEach(function (n, i) { mascots.push(new Mascot(n, i + 1)); });
    if (mascots.length >= 2) {
      const ga = mascots[0], gb = mascots[1]; let gtry = 0;
      while (Math.hypot(ga.x - gb.x, ga.y - gb.y) < minSep() && gtry++ < 12) {
        gb.x = rand(EDGE_PAD + gb.w * 0.5, vw() - gb.w * 0.5 - EDGE_PAD);
        gb.y = rand(topY(), vh() - gb.h - EDGE_PAD); gb.tx = gb.x; gb.ty = gb.y;
      }
    }
    mascots.forEach(function (m) { m.render(); });
    let last = performance.now();
    let rafId = null, running = false;
    function loop(now) {
      if (!running) return;
      const dt0 = (now - last) / 1000, dt = dt0 > 0.05 ? 0.05 : dt0; last = now;
      for (let i = 0; i < mascots.length; i++) { const other = mascots.length >= 2 ? mascots[(i + 1) % mascots.length] : null; mascots[i].step(dt, other); }
      for (let j = 0; j < mascots.length; j++) mascots[j].render();
      rafId = requestAnimationFrame(loop);
    }
    function startLoop() { if (running) return; running = true; last = performance.now(); rafId = requestAnimationFrame(loop); }
    function stopLoop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }
    let rz;
    window.addEventListener("resize", function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        syncLeft();
        for (let i = 0; i < mascots.length; i++) {
          const m = mascots[i]; m.measure();
          let minx = m.w * 0.5 + EDGE_PAD, maxx = vw() - m.w * 0.5 - EDGE_PAD; if (m.x > maxx) m.x = maxx; if (m.x < minx) m.x = minx;
          let miny = topY(), maxy = vh() - m.h - EDGE_PAD; if (maxy < miny) maxy = miny; if (m.y > maxy) m.y = maxy; if (m.y < miny) m.y = miny;
          m.tx = m.x; m.ty = m.y; m.state = "idle"; m.timer = rand(0.4, 1.6);
        }
      }, 180);
    }, { passive: true });
    // prefers-reduced-motion: renderiza uma vez e NAO agenda o loop de animacao
    if (REDUCE) { mascots.forEach(function (m) { m.render(); }); return; }
    // pausa a animacao quando a aba sai de foco (economiza CPU sob escala) e retoma ao voltar
    document.addEventListener("visibilitychange", function () { if (document.hidden) stopLoop(); else startLoop(); });
    requestAnimationFrame(function () { requestAnimationFrame(startLoop); });
  }

  // cena 3D do fundo (tema escuro): piso + teto em perspectiva + LEDs discretos indo ao horizonte
  function mountGridScene() {
    if (document.querySelector(".grid-scene")) return;
    const host = document.querySelector(".member-body");
    if (!host) return;
    const scene = document.createElement("div");
    scene.className = "grid-scene";
    const floor = document.createElement("div");
    floor.className = "grid-plane grid-floor";
    const ceil = document.createElement("div");
    ceil.className = "grid-plane grid-ceil";
    scene.appendChild(floor);
    scene.appendChild(ceil);
    host.appendChild(scene);
  }

  function paintUser(user) {
    document.getElementById("userName").textContent = user.name || user.email;
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("avatar").textContent = initials(user.name || user.email);
    // selo acima do nome: turma atual = "Membro Fundador" (congelado); novos = selo do tier do plano.
    var fb = document.getElementById("founderBadge");
    if (fb) {
      var label, cls;
      if (user.founder) { label = "Membro Fundador"; cls = "fb-founder"; }
      else if (user.purchases && user.purchases.indexOf("naia-claude-10x") > -1) { label = "Naia Claude"; cls = "fb-claude"; }
      else if (user.plan === "complete" || user.communityActive) { label = "Naia Completa"; cls = "fb-completa"; }
      else { label = "Primeira Naia"; cls = "fb-primeira"; }
      fb.className = "founder-badge " + cls;
      fb.innerHTML = '<span class="founder-star" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z"/></svg></span> ' + label;
      fb.hidden = false;
    }
    if (user.role === "admin") document.getElementById("adminLink").hidden = false;
  }

  // ---------- aulas ----------
  async function loadLessons() {
    nav.innerHTML = navSkeleton();
    try {
      const r = await apiFetch("/api/lessons");
      if (!r.ok) throw new Error("lessons");
      lessons = (await r.json()).lessons || [];
    } catch (e) {
      if (e && e.__auth) return;
      nav.innerHTML = '<div class="empty">Nao deu pra carregar as aulas.</div>';
      return;
    }
    renderNav();

    // aula inicial: hash > ultima vista > primeira
    // o hash pode ser "idDaAula" ou "manual/secao" — pega so a aula
    const hashLesson = location.hash ? location.hash.slice(1).split("/")[0] : "";
    const fromStore = (() => { try { return localStorage.getItem(LAST_KEY); } catch { return null; } })();
    const valid = (id) => lessons.some((l) => l.id === id);
    const start = valid(hashLesson) ? hashLesson : valid(fromStore) ? fromStore : (lessons[0] && lessons[0].id);
    if (start) openLesson(start);
  }

  function navSkeleton() {
    let h = "";
    for (let i = 0; i < 4; i++) h += '<div class="nav-item"><span class="num skeleton"></span><span class="label skeleton sk-line" style="flex:1"></span></div>';
    return h;
  }

  // aula do bloco de instalação da Primeira Naia (seção "Instalacao" do lessons.js)
  function isInstallLesson(l) {
    return !!l && String(l.section || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() === "instalacao";
  }
  // aula da seção "Naia completa" (upgrade): mesma regra da instalação, só Primeira Naia e admin
  function isNaiaCompletaLesson(l) {
    return !!l && String(l.section || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() === "naia completa";
  }

  function renderNav() {
    nav.innerHTML = "";
    // Gravações da Comunidade só aparece pra membro ativo da comunidade (Elite) ou admin
    const communityActive = !!(currentUser && currentUser.communityActive);
    const isAdmin = !!(currentUser && currentUser.role === "admin");
    // quem ja entrou na comunidade (membro ou trial) NAO ve o menu de suporte/agendamento — ja teve o onboarding.
    // so novos membros Primeira Naia / Naia Completa veem, ate ativarem a comunidade. Admin sempre ve.
    const inCommunity = !isAdmin && (communityActive || !!(currentUser && currentUser.communityTrial));
    // Grupo de Estudos (3o nivel) só aparece pra quem tem estudos_member (ou admin)
    const estudosActive = !!(currentUser && currentUser.estudosActive);
    // Comunidade/Grupo de Estudos não veem o bloco de instalação da Primeira Naia (o servidor já não manda)
    const installActive = !(currentUser && currentUser.installActive === false);
    const visibleLessons = lessons.filter((l) =>
      (l.id !== "gravacoes-comunidade" || communityActive) &&
      (l.id !== "gravacoes-estudos" || estudosActive) &&
      (l.view !== "imersao" || communityActive) &&
      (installActive || !isInstallLesson(l)) &&
      (installActive || !isNaiaCompletaLesson(l)) &&
      (l.id !== "acesso-suporte" || !inCommunity));
    const sections = [];
    visibleLessons.forEach((l) => {
      let s = sections.find((x) => x.name === l.section);
      if (!s) { s = { name: l.section, items: [] }; sections.push(s); }
      s.items.push(l);
    });

    sections.forEach((sec) => {
      const wrap = document.createElement("div");
      wrap.className = "nav-section";
      // seção colapsável: começa aberta só a que tem a aula ativa (ou a 1ª)
      const temAtiva = sec.items.some((l) => l.id === activeId);
      const ehPrimeira = sections.indexOf(sec) === 0;
      if (temAtiva || (!activeId && ehPrimeira)) wrap.classList.add("open");

      const head = document.createElement("button");
      head.type = "button";
      head.className = "nav-section-head";
      head.innerHTML =
        '<span class="nav-section-label">' + esc(sec.name) + "</span>" +
        '<span class="nav-section-chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>';
      head.addEventListener("click", () => wrap.classList.toggle("open"));
      wrap.appendChild(head);

      const itemsBox = document.createElement("div");
      itemsBox.className = "nav-section-items";
      const inner = document.createElement("div");
      inner.className = "nav-section-inner";
      sec.items.forEach((l) => {
        const btn = document.createElement("button");
        btn.className = "nav-item" + (l.id === activeId ? " active" : "");
        btn.dataset.id = l.id;
        btn.innerHTML =
          '<span class="num">' + esc(l.n) + "</span>" +
          '<span class="label">' + esc(l.title) + "</span>";
        btn.addEventListener("click", () => { openLesson(l.id); closeMenu(); });
        inner.appendChild(btn);
      });
      itemsBox.appendChild(inner);
      wrap.appendChild(itemsBox);
      nav.appendChild(wrap);
    });
  }

  function markActive() {
    nav.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === activeId);
    });
    // abre a seção que contém a aula ativa (sem fechar as que o usuário abriu)
    const act = nav.querySelector(".nav-item.active");
    if (act) { const sec = act.closest(".nav-section"); if (sec) sec.classList.add("open"); }
  }

  async function openLesson(id) {
    const navToken = ++navSeq; // qualquer resposta atrasada de uma aula anterior e descartada
    // Gravações da Comunidade: bloqueia acesso direto (hash) de quem não é membro ativo
    if (id === "gravacoes-comunidade" && !(currentUser && currentUser.communityActive)) {
      id = (lessons[0] && lessons[0].id) || id;
    }
    // Grupo de Estudos: bloqueia acesso direto (hash) de quem nao e membro do Grupo de Estudos
    if (id === "gravacoes-estudos" && !(currentUser && currentUser.estudosActive)) {
      id = (lessons[0] && lessons[0].id) || id;
    }
    // Gravação Imersão (Instalador Hermes, Dia 1, Dia 2): só Comunidade, Grupo de Estudos e admin
    const imersao0 = lessons.find((l) => l.id === id);
    if (imersao0 && imersao0.view === "imersao" && !(currentUser && currentUser.communityActive)) {
      id = (lessons[0] && lessons[0].id) || id;
    }
    // Instalação da Primeira Naia: quem tem Comunidade/Grupo de Estudos não abre por hash direto
    // (o servidor já tira essas aulas da lista, então id fora da lista volta pra 1ª aula)
    if (currentUser && currentUser.installActive === false &&
        (isInstallLesson(lessons.find((l) => l.id === id)) || isNaiaCompletaLesson(lessons.find((l) => l.id === id)) ||
         !lessons.some((l) => l.id === id))) {
      id = (lessons[0] && lessons[0].id) || id;
    }
    // Suporte/agendamento: quem já está na comunidade (membro/trial) não acessa mais (admin sim)
    if (id === "acesso-suporte" && currentUser && currentUser.role !== "admin" &&
        (currentUser.communityActive || currentUser.communityTrial)) {
      id = (lessons[0] && lessons[0].id) || id;
    }
    activeId = id;
    markActive();
    // se for o manual, o hash fino (manual/secao) e cuidado dentro de openManual
    const lesson0 = lessons.find((l) => l.id === id);
    if (!(lesson0 && lesson0.kind === "manual")) {
      if (history.replaceState) history.replaceState(null, "", "#" + id);
    }
    try { localStorage.setItem(LAST_KEY, id); } catch (e) {}

    content.innerHTML = lessonSkeleton();
    window.scrollTo({ top: 0, behavior: "smooth" });

    let lesson;
    try {
      const r = await apiFetch("/api/lessons/" + encodeURIComponent(id));
      if (navToken !== navSeq) return; // navegou pra outra aula durante o fetch
      if (r.status === 404) { content.innerHTML = '<div class="center-state">Aula nao encontrada.</div>'; return; }
      if (!r.ok) throw new Error("lesson");
      lesson = (await r.json()).lesson;
      if (navToken !== navSeq) return; // guard apos o parse, antes de tocar o DOM
    } catch (e) {
      if (e && e.__auth) return;
      if (navToken !== navSeq) return;
      inManual = false;
      content.innerHTML =
        '<div class="inline-msg error">Nao deu pra carregar esta aula. Verifique a conexao e tente de novo.</div>';
      return;
    }

    if (lesson && lesson.kind === "manual") {
      // deep-link de secao so vale se o hash for desta aula (ex: #marketplace-skills/skill-carrossel)
      const hashId = location.hash ? location.hash.slice(1).split("/")[0] : "";
      const sub = hashId === lesson.id ? parseManualHash() : null;
      return openManual(sub, lesson);
    }

    inManual = false;
    if (lesson && lesson.kind === "page") return renderPage(lesson);
    if (lesson && lesson.kind === "support") return renderSupport(lesson);
    if (lesson && lesson.kind === "community") return renderCommunity(lesson);
    renderLesson(lesson);
  }

  // ---------- Zoom Semanal + Comunidade: video + bonus 30 dias + ativar trial ----------
  function fmtDay(iso) {
    try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }); } catch (e) { return ""; }
  }
  function communityActiveBlock(startedAt) {
    const end = startedAt ? new Date(new Date(startedAt).getTime() + 30 * 864e5).toISOString() : null;
    return (
      '<div class="comm-active">' +
        '<div class="comm-active-tag">Teste grátis ativo</div>' +
        '<p class="comm-active-msg">Seu mês grátis está valendo' + (end ? " até <b>" + esc(fmtDay(end)) + "</b>" : "") +
        ". Entre no grupo da comunidade no WhatsApp e participe do Zoom comigo <b>toda segunda às 20h</b>.</p>" +
        '<a class="comm-wa" href="' + esc(COMMUNITY_WHATSAPP_URL) + '"' + (COMMUNITY_WHATSAPP_URL === "#" ? "" : ' target="_blank" rel="noopener"') + '>Entrar no grupo da comunidade <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>' +
        '<p class="comm-approve"><span class="comm-approve-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 8.5 4.1-.9 7-4.3 7-8.5V6z"/></svg></span> A entrada no grupo passa por <b>aprovação manual</b> (checagem humana) e pode levar <b>até 2 dias</b>. Fica tranquilo que a gente libera o seu acesso.</p>' +
        '<p class="comm-after">Quando os 30 dias acabarem, você continua na <b>turma de fundadores</b> por <b>R$1.197</b>.</p>' +
      "</div>"
    );
  }
  function renderCommunity(lesson) {
    const started = currentUser && currentUser.communityTrial;
    const pitch =
      '<div class="comm-pitch">' +
        '<p>Como aluno, você ganhou <b>1 mês grátis</b> de acesso à nossa <b>comunidade no WhatsApp</b> + o <b>Zoom semanal comigo, toda segunda-feira às 20h</b>. É onde a gente tira dúvidas ao vivo, mostra o que está funcionando e acelera os seus resultados com a Naia.</p>' +
        '<p>Depois dos 30 dias de bônus, você pode continuar na comunidade pagando o valor da <b>turma de fundadores</b>: <b>R$1.197</b>. Mas comece agora de graça.</p>' +
      "</div>";
    const action = started
      ? communityActiveBlock(started)
      : '<a class="comm-activate" id="commActivate" href="' + esc(COMMUNITY_TRIAL_CHECKOUT_URL) + '" target="_blank" rel="noopener">Ativar meu teste grátis de 30 dias ↗</a>' +
        '<p class="comm-approve">Faça o cadastro no checkout com o <b>mesmo e-mail</b> que você usa aqui. Assim que a Hubla confirmar o cadastro, o botão de entrada no grupo aparece nesta página.</p>' +
        '<button type="button" class="comm-refresh" id="commRefresh">Já me cadastrei, liberar meu acesso</button>' +
        '<div class="support-msg" id="commMsg"></div>';
    content.innerHTML =
      '<div class="page-lesson support-page">' +
        '<div class="lesson-kicker">' + esc(lesson.section) + "</div>" +
        '<h1 class="lesson-title">' + esc(lesson.title) + "</h1>" +
        (lesson.subtitle ? '<p class="lesson-subtitle">' + esc(lesson.subtitle) + "</p>" : "") +
        '<div class="lesson-media support-media">' + videoHTML(lesson.video, lesson.cover) + "</div>" +
        '<div class="support-box">' + pitch + action + "</div>" +
      "</div>";
    if (lesson.video && lesson.video.type === "html" && lesson.video.html) {
      const slot = content.querySelector('[data-rawvideo="1"]');
      if (slot) slot.innerHTML = lesson.video.html;
    }
    // libera o botao do grupo quando o webhook da Hubla registrar o trial (checagem no /api/me)
    async function checkTrial(silent) {
      const msg = content.querySelector("#commMsg");
      if (!silent && msg) msg.textContent = "Conferindo o cadastro...";
      try {
        const r = await apiFetch("/api/me");
        const j = await r.json().catch(() => ({}));
        const started = j && j.user && j.user.communityTrial;
        if (!started) {
          if (!silent && msg) msg.textContent = "Ainda não recebemos a confirmação da Hubla. Aguarde alguns segundos e tente de novo.";
          return false;
        }
        if (currentUser) currentUser.communityTrial = started;
        const boxEl = content.querySelector(".support-box");
        if (boxEl) boxEl.innerHTML = pitch + communityActiveBlock(started);
        renderNav(); // entrou na comunidade -> some o menu de suporte na hora
        return true;
      } catch (e) {
        if (!silent && msg) msg.textContent = "Não deu pra conferir agora. Tente de novo.";
        return false;
      }
    }
    const link = content.querySelector("#commActivate");
    if (link) link.addEventListener("click", () => {
      // enquanto o aluno preenche o checkout na outra aba, confere sozinho a cada 20s por ate 15min
      let tries = 0;
      const timer = setInterval(async () => {
        tries += 1;
        if (!document.body.contains(link) || tries > 45 || await checkTrial(true)) clearInterval(timer);
      }, 20000);
    });
    const refresh = content.querySelector("#commRefresh");
    if (refresh) refresh.addEventListener("click", () => checkTrial(false));
  }

  // ---------- acesso ao suporte: video + formulario de cadastro -> AGENDA reuniao ----------
  // calendario premium integrado ao Google Calendar do dono (ate 3 dias, 2 horarios/dia, 11-17h, 30min)
  function supportBookingBlock() {
    return (
      '<div class="sched" id="sched">' +
        '<div class="sched-head">' +
          '<span class="sched-badge"><span class="sched-badge-dot"></span> Cadastro recebido</span>' +
          '<h3 class="sched-title">Agende sua reunião de boas-vindas</h3>' +
          '<p class="sched-sub">São <b>30 minutos ao vivo</b> com o nosso time pra destravar a sua Naia. Escolha o melhor horário:</p>' +
        "</div>" +
        '<div class="sched-body" id="schedBody"><div class="sched-loading"><span class="sched-spin"></span> Carregando horários…</div></div>' +
      "</div>"
    );
  }
  function bookedHTML(startISO, dayLabel, timeLabel) {
    var when = (dayLabel && timeLabel) ? (dayLabel + " às " + timeLabel) : "";
    if (!when) { try { when = new Date(startISO).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }); } catch (e) { when = ""; } }
    return (
      '<div class="sched-done">' +
        '<div class="sched-done-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>' +
        '<div class="sched-done-t">Reunião confirmada</div>' +
        '<div class="sched-done-when">' + esc(when) + "</div>" +
        '<p class="sched-done-sub">O convite com o link da chamada chega no seu e-mail. A gente te espera!</p>' +
      "</div>"
    );
  }
  async function wireBooking(opts) {
    opts = opts || {};
    const bodyId = opts.bodyId || "schedBody";
    const slotsUrl = opts.slotsUrl || "/api/booking/slots";
    const bookUrl = opts.bookUrl || "/api/booking";
    const body = document.getElementById(bodyId);
    if (!body) return;
    let data;
    try {
      const r = await apiFetch(API_BASE + slotsUrl, { credentials: "include" });
      data = await r.json();
    } catch (e) { body.innerHTML = '<div class="sched-empty">Não deu pra carregar os horários agora. Recarregue a página.</div>'; return; }
    if (data && data.mine) { body.innerHTML = bookedHTML(data.mine); return; }
    if (!data || !data.connected) { body.innerHTML = '<div class="sched-empty">A agenda está sendo configurada. Volte em breve pra marcar a sua reunião.</div>'; return; }
    const slots = data.slots || [];
    if (!slots.length) { body.innerHTML = '<div class="sched-empty">Sem horários livres nos próximos dias. Tente novamente em breve.</div>'; return; }
    const byDay = {};
    slots.forEach((s) => { (byDay[s.dayLabel] = byDay[s.dayLabel] || []).push(s); });
    const cols = Object.keys(byDay).map((day) => {
      const chips = byDay[day].map((s) =>
        '<button type="button" class="sched-slot" data-start="' + esc(s.start) + '" data-label="' + esc(day + " às " + s.timeLabel) + '">' + esc(s.timeLabel) + "</button>").join("");
      return '<div class="sched-day"><div class="sched-day-h">' + esc(day) + '</div><div class="sched-slots">' + chips + "</div></div>";
    }).join("");
    body.innerHTML =
      '<div class="sched-grid">' + cols + "</div>" +
      '<div class="sched-foot"><div class="sched-pick" id="schedPick">Selecione um horário acima</div>' +
      '<button type="button" class="sched-confirm" id="schedConfirm" disabled>Confirmar reunião</button></div>' +
      '<div class="sched-msg" id="schedMsg"></div>';
    let chosen = null;
    body.querySelectorAll(".sched-slot").forEach((b) => b.addEventListener("click", () => {
      body.querySelectorAll(".sched-slot").forEach((x) => x.classList.remove("is-sel"));
      b.classList.add("is-sel");
      chosen = { start: b.getAttribute("data-start"), label: b.getAttribute("data-label") };
      const pick = document.getElementById("schedPick"); if (pick) pick.innerHTML = "Reunião em <b>" + esc(chosen.label) + "</b>";
      const cf = document.getElementById("schedConfirm"); if (cf) cf.disabled = false;
    }));
    const cf = document.getElementById("schedConfirm");
    if (cf) cf.addEventListener("click", async () => {
      if (!chosen) return;
      const msg = document.getElementById("schedMsg");
      cf.disabled = true; cf.textContent = "Marcando…";
      try {
        const r = await apiFetch(API_BASE + bookUrl, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start: chosen.start }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (msg) msg.textContent = j.error || "Não deu pra marcar. Escolha outro horário.";
          cf.disabled = false; cf.textContent = "Confirmar reunião";
          if (j.error && /disponiv|preenchid/i.test(j.error)) wireBooking(opts); // recarrega slots se o horario caiu
          return;
        }
        body.innerHTML = bookedHTML(j.start, j.dayLabel, j.timeLabel);
      } catch (e) { if (msg) msg.textContent = "Falha de conexão. Tente de novo."; cf.disabled = false; cf.textContent = "Confirmar reunião"; }
    });
  }

  function renderSupport(lesson) {
    const registered = !!(currentUser && currentUser.supportRegistered);
    const mail = (currentUser && currentUser.email) || "";
    const formHTML =
      '<div class="support-intro"><b>Pra liberar o seu acesso ao suporte, a gente precisa do seu cadastro completo.</b> ' +
      "Preenche os campos abaixo e clica em enviar. Assim que salvar, o botão do suporte no WhatsApp é liberado pra você.</div>" +
      '<div class="support-form" id="supportForm">' +
        '<div class="sf-grid">' +
          fld("nome", "Nome completo", "text", true) +
          fld("email", "E-mail", "email", true, esc(mail)) +
          fld("whatsapp", "WhatsApp (com DDD)", "tel", true) +
          fld("documento", "CPF ou CNPJ", "text", true) +
          fld("idade", "Idade", "number", false) +
          sel("genero", "Gênero", ["Masculino", "Feminino"]) +
          fld("data_compra", "Data da compra", "date", false) +
          sel("tempo_conhece", "Há quanto tempo conhece o Denderson?", ["Menos de 1 mês", "1 a 6 meses", "6 meses a 1 ano", "1 a 3 anos", "Mais de 3 anos"]) +
          sel("profissao", "Profissão atual", ["Sócio/Dono", "Diretor", "Autônomo", "Gestor de tráfego", "Expert", "Dono de agência", "Funcionário de agência", "Outro"]) +
          fld("profissao_outro", "Se outro, qual?", "text", false) +
          sel("faturamento", "Nível de faturamento mensal", ["Até R$ 5 mil", "R$ 5 mil a R$ 20 mil", "R$ 20 mil a R$ 50 mil", "R$ 50 mil a R$ 100 mil", "Acima de R$ 100 mil"]) +
          sel("tinha_ia", "Já tinha agente de IA?", ["Não", "Sim"]) +
          fld("qual_ia", "Se sim, qual?", "text", false) +
          sel("objetivo", "Principal objetivo com a Naia", ["Usar pra mim", "Prestar serviço pra clientes", "Os dois"]) +
        "</div>" +
        '<div class="support-msg" id="supportMsg"></div>' +
        '<button type="button" class="support-submit" id="supportSubmit">Enviar informações e liberar suporte</button>' +
      "</div>";

    content.innerHTML =
      '<div class="lesson-split">' +
        '<div class="lesson-media">' + videoHTML(lesson.video, lesson.cover) + "</div>" +
        '<div class="lesson-text">' +
          '<div class="lesson-kicker">' + esc(lesson.section) + "</div>" +
          '<h1 class="lesson-title">' + esc(lesson.title) + "</h1>" +
          (lesson.subtitle ? '<p class="lesson-subtitle">' + esc(lesson.subtitle) + "</p>" : "") +
          '<div class="support-box">' + (registered ? supportBookingBlock() : formHTML) + "</div>" +
        "</div>" +
      "</div>";

    if (lesson.video && lesson.video.type === "html" && lesson.video.html) {
      const slot = content.querySelector('[data-rawvideo="1"]');
      if (slot) {
        let vhtml = lesson.video.html;
        if (lesson.cover && vhtml.indexOf("poster=") === -1) {
          vhtml = vhtml.replace(/<video\b/i, '<video poster="' + esc(lesson.cover) + '"');
        }
        slot.innerHTML = vhtml;
      }
    }
    if (!registered) wireSupportForm(); else wireBooking();
  }

  function fld(name, label, type, req, val) {
    return '<label class="sf-field"><span class="sf-label">' + esc(label) + (req ? ' <i class="sf-req">*</i>' : "") + "</span>" +
      '<input class="sf-input" name="' + name + '" type="' + type + '"' + (req ? " required" : "") + (val ? ' value="' + val + '"' : "") + "></label>";
  }
  function sel(name, label, opts) {
    return '<label class="sf-field"><span class="sf-label">' + esc(label) + "</span>" +
      '<select class="sf-input" name="' + name + '">' +
      opts.map((o) => '<option value="' + esc(o) + '">' + esc(o) + "</option>").join("") +
      "</select></label>";
  }

  function wireSupportForm() {
    const box = content.querySelector("#supportForm");
    if (!box) return;
    const btn = box.querySelector("#supportSubmit");
    const msg = box.querySelector("#supportMsg");
    // campo "Se outro, qual?" só aparece quando a profissão = Outro
    const profSel = box.querySelector('[name="profissao"]');
    const outroEl = box.querySelector('[name="profissao_outro"]');
    const outroField = outroEl ? outroEl.closest(".sf-field") : null;
    const toggleOutro = () => { if (outroField) outroField.style.display = (profSel && profSel.value === "Outro") ? "" : "none"; };
    if (profSel) profSel.addEventListener("change", toggleOutro);
    toggleOutro();
    btn.addEventListener("click", async () => {
      const data = {};
      box.querySelectorAll(".sf-input").forEach((el) => { data[el.name] = el.value.trim(); });
      const obrig = ["nome", "email", "whatsapp", "documento"];
      const falta = obrig.filter((k) => !data[k]);
      if (falta.length) { msg.textContent = "Preencha: nome, e-mail, WhatsApp e CPF/CNPJ."; return; }
      data.tinha_ia = (data.tinha_ia === "Sim");
      btn.disabled = true; msg.textContent = "Enviando...";
      try {
        const r = await apiFetch(API_BASE + "/api/support/signup", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!r.ok) throw new Error("falha");
        if (currentUser) currentUser.supportRegistered = true;
        const boxEl = content.querySelector(".support-box");
        if (boxEl) { boxEl.innerHTML = supportBookingBlock(); wireBooking(); }
      } catch (e) {
        msg.textContent = "Não deu pra enviar. Tente de novo.";
        btn.disabled = false;
      }
    });
  }

  // pagina de largura total (sem video, sem comentarios): ex. Gestao de assinatura
  function renderPage(lesson) {
    content.innerHTML =
      '<div class="page-lesson">' +
        '<div class="lesson-kicker">' + esc(lesson.section) + "</div>" +
        '<h1 class="lesson-title">' + esc(lesson.title) + "</h1>" +
        (lesson.subtitle ? '<p class="lesson-subtitle">' + esc(lesson.subtitle) + "</p>" : "") +
        '<div class="material">' + (lesson.material || "") + "</div>" +
      "</div>";

    if (lesson.id === "gestao-assinatura") decorateSubscriptionPage();
    // Gravação Imersão: liga o instalador Hermes (public/imersao-hermes.js) no HTML recém-injetado
    if (lesson.id === "imersao-instalador-hermes" && typeof window.mountHermesWizard === "function") window.mountHermesWizard();
  }

  // gestao de assinatura: liga o link de upgrade e ajusta o estado pelo plano do usuario
  function decorateSubscriptionPage() {
    const offerCta = content.querySelector('.naia-sales-cta[data-plan="997"]');
    const offerBox = content.querySelector(".naia-sales-offer");
    if (offerCta) offerCta.setAttribute("href", UPGRADE_700_URL);

    if (userPlan() === "complete") {
      // ja tem a Naia Completa: a oferta vira "voce ja possui"
      if (offerCta) {
        offerCta.textContent = "Você já tem a Naia Completa";
        offerCta.classList.add("is-disabled");
        offerCta.removeAttribute("href");
        offerCta.setAttribute("aria-disabled", "true");
      }
      if (offerBox && !offerBox.querySelector(".plan__current")) {
        const ribbon = document.createElement("span");
        ribbon.className = "plan__current";
        ribbon.textContent = "Seu plano atual";
        offerBox.appendChild(ribbon);
      }
      // caixa do topo vira "Naia Completa" como plano atual
      const cur = content.querySelector(".naia-sales-current");
      if (cur) {
        const t = cur.querySelector(".ns-cur-title");
        if (t) t.innerHTML = 'Naia Completa <span class="dot">·</span> plano anual';
        const sub = cur.querySelector(".ns-cur-sub");
        if (sub) sub.textContent = "Você liberou tudo. A sua Naia está completa: o time inteiro, todas as skills e a memória permanente, rodando por você.";
        const grid = cur.querySelector(".ns-cur-grid");
        if (grid) grid.innerHTML =
          '<li><span class="mk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span> Acesso a tudo da área de membros (exceto o Marketplace Premium, que é à parte).</li>' +
          '<li><span class="mk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span> Todos os subagentes do time da Naia liberados, a Equipe completa.</li>' +
          '<li><span class="mk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span> Todas as skills do Marketplace liberadas, não só as 4.</li>' +
          '<li><span class="mk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span> As plataformas Open Source, como o CRM, liberadas.</li>' +
          '<li><span class="mk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span> Banco de dados de memória: a sua Naia nunca mais esquece nada.</li>' +
          '<li><span class="mk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span> Atualizações futuras inclusas durante o ano.</li>';
      }
    }
    // starter: mantem o HTML como veio (caixa do 297 = plano atual, CTA de upgrade ativo no link da Hubla)
  }

  function lessonSkeleton() {
    return (
      '<div class="skeleton sk-line" style="width:140px;height:11px"></div>' +
      '<div class="skeleton sk-title"></div>' +
      '<div class="skeleton sk-line" style="width:50%;height:20px"></div>' +
      '<div class="skeleton sk-video"></div>' +
      '<div class="skeleton sk-line"></div><div class="skeleton sk-line"></div>' +
      '<div class="skeleton sk-line" style="width:80%"></div>'
    );
  }

  function videoHTML(video, cover) {
    if (video && video.type === "iframe" && video.src) {
      return '<div class="video-wrap"><iframe src="' + esc(video.src) +
        '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
    }
    if (video && video.type === "html" && video.html) {
      return '<div class="video-wrap" data-rawvideo="1"></div>';
    }
    // sem video ainda: mostra SO a capa da aula (imagem limpa, ja em 16:9)
    if (cover) {
      return '<div class="video-wrap"><img class="video-cover" src="' + esc(cover) + '" alt=""></div>';
    }
    // placeholder elegante 16:9
    return (
      '<div class="video-wrap"><div class="video-placeholder">' +
      '<div class="play"><svg width="22" height="24" viewBox="0 0 22 24" fill="none">' +
      '<path d="M2 2.5L20 12L2 21.5V2.5Z" fill="#ed6f5c"/></svg></div>' +
      '<div class="txt">Video em breve</div></div></div>'
    );
  }

  function renderLesson(lesson) {
    const html =
      '<div class="lesson-split">' +
        '<div class="lesson-media">' + videoHTML(lesson.video, lesson.cover) + "</div>" +
        '<div class="lesson-text">' +
          '<div class="lesson-kicker">Aula ' + esc(lesson.n) + " · " + esc(lesson.section) + "</div>" +
          '<h1 class="lesson-title">' + esc(lesson.title) + "</h1>" +
          (lesson.subtitle ? '<p class="lesson-subtitle">' + esc(lesson.subtitle) + "</p>" : "") +
          '<div class="material">' + (lesson.material || "") + "</div>" +
        "</div>" +
      "</div>";
    content.innerHTML = html;

    // embed de video tipo html injetado com seguranca apos render
    if (lesson.video && lesson.video.type === "html" && lesson.video.html) {
      const slot = content.querySelector('[data-rawvideo="1"]');
      if (slot) {
        // usa a capa da aula como poster do video (mostra antes do play)
        let vhtml = lesson.video.html;
        if (lesson.cover && vhtml.indexOf("poster=") === -1) {
          vhtml = vhtml.replace(/<video\b/i, '<video poster="' + esc(lesson.cover) + '"');
        }
        slot.innerHTML = vhtml;
      }
    }

    // concluir + nota (abaixo do video) e depois perguntas e comentarios
    mountLessonFooter(lesson.id);
    mountComments(lesson.id);
  }

  // ==========================================================================
  // COMENTARIOS / PERGUNTAS (gravados no banco, visiveis a todos os alunos)
  // ==========================================================================
  function fmtDate(s) {
    try {
      const d = new Date(s);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
        " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }

  // ---------- progresso da aula: concluir + nota (5 estrelas) ----------
  async function ensureProgress() {
    if (progressMap) return progressMap;
    try {
      const r = await apiFetch(API_BASE + "/api/progress", { credentials: "include" });
      const j = await r.json();
      progressMap = j.progress || {};
    } catch (e) { progressMap = {}; }
    return progressMap;
  }
  function starsHTML(rating) {
    let h = "";
    for (let i = 1; i <= 5; i++) h += '<button type="button" class="lf-star' + (i <= (rating || 0) ? " on" : "") + '" data-v="' + i + '" aria-label="' + i + ' estrela(s)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z"/></svg></button>';
    return h;
  }
  // injeta o bloco "concluir + nota" abaixo da aula e ACIMA dos comentarios.
  // Insercao SINCRONA (pra garantir a ordem no DOM); o estado vem depois via ensureProgress.
  function mountLessonFooter(lessonId, hostEl, beforeEl) {
    const host = hostEl || content.querySelector(".lesson-media") || content;
    const box = document.createElement("div");
    box.className = "lesson-footer";
    box.innerHTML =
      '<button type="button" class="lf-done">' +
        '<span class="lf-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span> <span class="lf-done-txt">Marcar como concluída</span>' +
      "</button>" +
      '<div class="lf-rate"><span class="lf-rate-label">Sua nota:</span><div class="lf-stars">' + starsHTML(0) + "</div></div>";
    if (beforeEl && beforeEl.parentNode === host) host.insertBefore(box, beforeEl);
    else host.appendChild(box);

    // aplica o estado salvo quando carregar (sem bagunçar a ordem do DOM)
    ensureProgress().then((map) => {
      const st = map[lessonId] || { completed: false, rating: null };
      if (st.completed) { box.querySelector(".lf-done").classList.add("done"); box.querySelector(".lf-done-txt").textContent = "Aula concluída"; }
      box.querySelectorAll(".lf-star").forEach((s2) => s2.classList.toggle("on", parseInt(s2.getAttribute("data-v"), 10) <= (st.rating || 0)));
    });

    const save = async (payload, after) => {
      try {
        const r = await apiFetch(API_BASE + "/api/lessons/" + encodeURIComponent(lessonId) + "/progress", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await r.json();
        if (j.progress) { if (progressMap) progressMap[lessonId] = j.progress; if (after) after(j.progress); }
      } catch (e) {}
    };
    const doneBtn = box.querySelector(".lf-done");
    doneBtn.addEventListener("click", () => {
      const novo = !doneBtn.classList.contains("done");
      doneBtn.classList.toggle("done", novo);
      box.querySelector(".lf-done-txt").textContent = novo ? "Aula concluída" : "Marcar como concluída";
      save({ completed: novo });
    });
    box.querySelectorAll(".lf-star").forEach((star) => {
      star.addEventListener("click", () => {
        const v = parseInt(star.getAttribute("data-v"), 10);
        box.querySelectorAll(".lf-star").forEach((s2) => s2.classList.toggle("on", parseInt(s2.getAttribute("data-v"), 10) <= v));
        save({ rating: v });
      });
    });
  }

  function mountComments(lessonId) {
    const sec = document.createElement("section");
    sec.className = "comments";
    sec.innerHTML =
      '<h2 class="comments-title">Perguntas e comentarios</h2>' +
      '<div class="comment-form">' +
        '<textarea id="commentInput" rows="3" maxlength="2000" placeholder="Escreva uma pergunta ou comentario pra turma..."></textarea>' +
        '<div class="comment-form-foot">' +
          '<span class="comment-msg" id="commentMsg"></span>' +
          '<button class="btn-primary" id="commentSend" type="button">Comentar</button>' +
        "</div>" +
      "</div>" +
      '<div class="comment-list" id="commentList"><div class="empty">Carregando...</div></div>';
    // colada na video-aula: vai na coluna do video (esquerda no desktop), logo abaixo dele
    const host = content.querySelector(".lesson-media") || content;
    host.appendChild(sec);

    const sendBtn = sec.querySelector("#commentSend");
    const input = sec.querySelector("#commentInput");
    const msg = sec.querySelector("#commentMsg");
    sendBtn.addEventListener("click", async () => {
      const body = input.value.trim();
      if (!body) { input.focus(); return; }
      sendBtn.disabled = true; msg.textContent = "";
      try {
        const r = await apiFetch(API_BASE + "/api/lessons/" + encodeURIComponent(lessonId) + "/comments", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Nao deu pra enviar.");
        input.value = "";
        await loadComments(lessonId);
      } catch (e) {
        msg.textContent = e.message || "Nao deu pra enviar.";
      } finally { sendBtn.disabled = false; }
    });

    loadComments(lessonId);
  }

  async function loadComments(lessonId) {
    const navToken = navSeq; // se o aluno trocar de aula durante o fetch, nao renderiza por cima
    const list = document.getElementById("commentList");
    if (!list) return;
    try {
      const r = await apiFetch("/api/lessons/" + encodeURIComponent(lessonId) + "/comments");
      if (navToken !== navSeq) return;
      if (!r.ok) throw new Error("c");
      const comments = (await r.json()).comments || [];
      if (navToken !== navSeq) return;
      renderComments(list, comments, lessonId);
    } catch (e) {
      if (e && e.__auth) return;
      if (navToken !== navSeq) return;
      list.innerHTML = '<div class="empty">Nao deu pra carregar os comentarios.</div>';
    }
  }

  function renderComments(list, comments, lessonId) {
    if (!comments.length) {
      list.innerHTML = '<div class="empty">Seja o primeiro a comentar.</div>';
      return;
    }
    const isAdmin = currentUser && currentUser.role === "admin";
    list.innerHTML = comments.map((c) =>
      '<div class="comment">' +
        '<div class="comment-avatar">' + esc(initials(c.name)) + "</div>" +
        '<div class="comment-body">' +
          '<div class="comment-head">' +
            '<span class="comment-author">' + esc(c.name) + "</span>" +
            '<span class="comment-date">' + esc(fmtDate(c.created_at)) + "</span>" +
            (isAdmin ? '<button class="comment-del" type="button" data-del="' + esc(c.id) + '">excluir</button>' : "") +
          "</div>" +
          '<p class="comment-text">' + esc(c.body) + "</p>" +
        "</div>" +
      "</div>"
    ).join("");
    if (isAdmin) {
      list.querySelectorAll("[data-del]").forEach((b) => {
        b.addEventListener("click", async () => {
          if (!window.confirm("Excluir este comentario?")) return;
          try {
            const r = await apiFetch(API_BASE + "/api/comments/" + encodeURIComponent(b.getAttribute("data-del")), {
              method: "DELETE", credentials: "include",
            });
            if (!r.ok) throw new Error("d");
            await loadComments(lessonId);
          } catch (e) {}
        });
      });
    }
  }

  // ==========================================================================
  // MODO MANUAL — submenu lateral + painel de conteudo + popup de equipe
  // ==========================================================================

  // Le a secao do manual do hash (#manual/cap-sites -> "cap-sites")
  function parseManualHash() {
    const h = location.hash ? location.hash.slice(1) : "";
    const parts = h.split("/");
    return parts.length > 1 ? parts.slice(1).join("/") : null;
  }

  // nav da view atual (manual / skills / opensource); fallback no nav legado
  function currentViewNav() {
    const v = manualLesson && manualLesson.view;
    if (manualData && manualData.views && v && manualData.views[v]) return manualData.views[v];
    return (manualData && manualData.nav) || [];
  }

  // Acha o primeiro id de secao da view atual (default)
  function firstManualSection() {
    for (const g of currentViewNav()) {
      if (g.items && g.items.length) return g.items[0].id;
    }
    return null;
  }

  function validManualSection(id) {
    return !!(manualData && manualData.sections && Object.prototype.hasOwnProperty.call(manualData.sections, id));
  }

  // a secao pertence a view atual? (evita abrir secao de outra aba)
  function sectionInCurrentView(id) {
    return currentViewNav().some((g) => (g.items || []).some((it) => it.id === id));
  }

  // Abre uma view de manual/marketplace. `sub` = id de secao; `lesson` = aula que define a view.
  async function openManual(sub, lesson) {
    const navToken = navSeq; // continua a navegacao iniciada em openLesson; descarta se mudar
    inManual = true;
    if (lesson) manualLesson = lesson;
    content.innerHTML = manualLoadingHTML();

    if (!manualData) {
      try {
        const r = await apiFetch("/api/manual");
        if (navToken !== navSeq) return; // navegou pra outra aula durante o fetch do manual
        if (!r.ok) throw new Error("manual");
        manualData = await r.json();
        if (navToken !== navSeq) return;
      } catch (e) {
        if (e && e.__auth) return;
        if (navToken !== navSeq) return;
        content.innerHTML =
          '<div class="inline-msg error">Nao deu pra carregar o manual. Verifique a conexao e tente de novo. ' +
          '<button type="button" class="manual-retry">Tentar de novo</button></div>';
        const rt = content.querySelector(".manual-retry");
        if (rt) rt.addEventListener("click", () => openManual(manualSection, manualLesson));
        return;
      }
      manualTeam = {};
      (manualData.team || []).forEach((a) => { if (a && a.slug) manualTeam[a.slug] = a; });
    }

    // Marketplace Premium: layout de cards (estilo Netflix). sub = card aberto.
    if (manualLesson && manualLesson.view === "premium") {
      if (sub && sectionInCurrentView(sub)) renderPremiumDetail(sub);
      else renderPremiumGallery();
      return;
    }

    const wanted = sub && sectionInCurrentView(sub) ? sub : firstManualSection();
    renderManualShell();
    showManualSection(wanted, { fromUser: false });
  }

  // ---------- Marketplace Premium: galeria de cards + detalhe ----------
  function premiumItems() {
    const v = manualData && manualData.views && manualData.views.premium;
    return (v && v[0] && v[0].items) || [];
  }
  function renderPremiumGallery() {
    const items = premiumItems();
    // 1o card da 1a fila: vídeo "Recado do Denderson" (mesmo tamanho de um card, vertical)
    // preview: toca em loop, mudo, autoplay (só pra ver que é um vídeo); clicou = som + controles
    const videoArt = RECADO_VIDEO_URL
      ? '<video class="prem-recado-video" controlsList="nodownload noremoteplayback" disablePictureInPicture oncontextmenu="return false" autoplay muted loop playsinline preload="auto" src="' + esc(RECADO_VIDEO_URL) + '"></video><span class="prem-recado-hint" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4.5 19 12 6 19.5z"/></svg> toque pra ouvir</span>'
      : '<div class="prem-video-ph"><span class="prem-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4.5 19 12 6 19.5z"/></svg></span><span class="prem-video-soon">Recado do Denderson</span></div>';
    const videoCard =
      '<div class="prem-card prem-card-video">' +
        '<div class="prem-card-art">' + videoArt + "</div>" +
        '<div class="prem-card-title">Recado do Denderson</div>' +
      "</div>";
    const cards = items.map((it) =>
      '<button type="button" class="prem-card" data-id="' + esc(it.id) + '">' +
        '<div class="prem-card-art">' +
          (it.card ? '<img src="' + esc(it.card) + '" alt="' + esc(it.label) + '" loading="lazy">' : '<div class="prem-card-ph"></div>') +
        "</div>" +
        '<div class="prem-card-title">' + esc(it.label) + "</div>" +
      "</button>"
    ).join("");
    content.innerHTML =
      '<div class="prem-gallery">' +
        '<div class="lesson-kicker">Marketplace</div>' +
        '<h1 class="lesson-title">Marketplace Premium</h1>' +
        '<p class="lesson-subtitle">Skills e aplicativos premium da sua Naia. Clique num card pra ver os detalhes.</p>' +
        '<div class="prem-row">' + videoCard + cards + "</div>" +
      "</div>";
    content.querySelectorAll(".prem-card[data-id]").forEach((c) => {
      c.addEventListener("click", () => {
        const id = c.getAttribute("data-id");
        manualSection = id;
        if (history.replaceState) history.replaceState(null, "", "#marketplace-premium/" + id);
        renderPremiumDetail(id);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    // recado em vídeo: toca mudo em loop; no 1o clique liga o som + controles, do início
    const rv = content.querySelector(".prem-recado-video");
    if (rv) {
      const art = rv.closest(".prem-card-art");
      const activate = () => {
        if (!rv.muted) return;
        rv.muted = false; rv.loop = false; rv.controls = true; rv.currentTime = 0;
        const h = art && art.querySelector(".prem-recado-hint"); if (h) h.style.display = "none";
        const pr = rv.play(); if (pr && pr.catch) pr.catch(() => {});
      };
      rv.addEventListener("click", activate);
      const hint = art && art.querySelector(".prem-recado-hint");
      if (hint) hint.addEventListener("click", activate);
    }
  }
  function renderPremiumDetail(id) {
    manualSection = id;
    const html = (manualData.sections && manualData.sections[id]) || "";
    // mantem o wrapper .manual-root/.manual-panel pra a pagina da skill ficar IDENTICA (CSS das ofertas/aviso é scoped nesses)
    content.innerHTML =
      '<div class="prem-detail manual-root">' +
        '<button type="button" class="prem-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Voltar pro Marketplace</button>' +
        '<div class="manual-panel" id="manualPanel">' + html + "</div>" +
      "</div>";
    const panel = content.querySelector("#manualPanel");
    if (panel) decorateSkillSection(panel, id);
    // Naia Claude 10x: quem JÁ comprou vê o agendamento da INSTALAÇÃO no lugar da oferta
    if (id === "prem-naia-claude-10x" && panel && currentUser &&
        Array.isArray(currentUser.purchases) && currentUser.purchases.indexOf("naia-claude-10x") > -1) {
      const offerEl = panel.querySelector(".prem-offer");
      const noticeEl = panel.querySelector(".prem-notice");
      const sched = document.createElement("div");
      sched.className = "sched";
      sched.innerHTML =
        '<div class="sched-head">' +
          '<span class="sched-badge"><span class="sched-badge-dot"></span> Compra confirmada</span>' +
          '<h3 class="sched-title">Agende a instalação da sua Naia Claude 10x</h3>' +
          '<p class="sched-sub">Nossa agenda de instalação está concorrida. Encontramos horários disponíveis apenas nos dias a seguir:</p>' +
        "</div>" +
        '<div class="sched-body" id="schedBodyInstall"><div class="sched-loading"><span class="sched-spin"></span> Carregando horários…</div></div>';
      if (noticeEl) noticeEl.remove();
      if (offerEl) offerEl.replaceWith(sched); else panel.appendChild(sched);
      wireBooking({ bodyId: "schedBodyInstall", slotsUrl: "/api/booking/install/slots", bookUrl: "/api/booking/install" });
    }
    const back = content.querySelector(".prem-back");
    if (back) back.addEventListener("click", () => {
      if (history.replaceState) history.replaceState(null, "", "#marketplace-premium");
      renderPremiumGallery();
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  function manualLoadingHTML() {
    return (
      '<div class="manual-loading center-state">' +
      '<div class="spinner" aria-label="Carregando manual"></div>' +
      '<div>Carregando o manual…</div></div>'
    );
  }

  // Estrutura de duas colunas: submenu + painel
  function renderManualShell() {
    let navHTML = "";
    // topo do submenu de Skills: vídeo de abertura (loop mudo até dar play)
    if (manualLesson && manualLesson.view === "skills" && SKILLS_INTRO_VIDEO_URL) {
      navHTML +=
        '<div class="skills-intro"><div class="skills-intro-art">' +
          '<video class="skills-intro-video" autoplay muted loop playsinline preload="auto" src="' + esc(SKILLS_INTRO_VIDEO_URL) + '"></video>' +
          '<span class="skills-intro-hint" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4.5 19 12 6 19.5z"/></svg> toque pra ouvir</span>' +
        "</div></div>";
    }
    // no Marketplace de Skills, plano 297 (starter): marca de verde as skills ja incluidas
    const markFree = manualLesson && manualLesson.view === "skills" && userPlan() === "starter";
    currentViewNav().forEach((group) => {
      navHTML += '<div class="manual-nav-group">';
      navHTML += '<div class="manual-nav-label">' + esc(group.group) + "</div>";
      (group.items || []).forEach((it) => {
        const cat = manualData.catalog && manualData.catalog[it.id];
        const free = markFree && planAllowsSkill(cat);
        navHTML +=
          '<button type="button" class="manual-nav-item' + (free ? " is-free" : "") + '" data-section="' + esc(it.id) + '">' +
          '<span class="manual-nav-index">' + esc(it.index) + "</span>" +
          '<span class="manual-nav-text">' + esc(it.label) + "</span>" +
          (free ? '<span class="manual-nav-free">incluída</span>' : "") +
          "</button>";
      });
      navHTML += "</div>";
    });

    const barKicker = manualLesson ? ("Menu " + (manualLesson.n || "")) : "Manual";
    const barTitle = (manualLesson && manualLesson.title) || "Manual da Naia";
    const viewCls = manualLesson && manualLesson.view ? " manual-view-" + manualLesson.view : "";
    content.innerHTML =
      '<div class="manual-root' + viewCls + '">' +
        '<div class="manual-bar">' +
          '<span class="manual-bar-kicker">' + esc(barKicker) + "</span>" +
          '<span class="manual-bar-title">' + esc(barTitle) + "</span>" +
          '<button type="button" class="manual-toc-toggle" aria-expanded="false" aria-controls="manualSubnav">' +
            '<span class="manual-toc-toggle-label">Secoes</span>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' +
          "</button>" +
        "</div>" +
        '<div class="manual-layout">' +
          '<aside class="manual-subnav" id="manualSubnav" aria-label="Secoes do manual">' + navHTML + "</aside>" +
          '<div class="manual-subnav-scrim" hidden></div>' +
          '<div class="manual-panel" id="manualPanel" tabindex="-1"></div>' +
        "</div>" +
      "</div>";

    // cliques do submenu
    content.querySelectorAll(".manual-nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        showManualSection(btn.dataset.section, { fromUser: true });
        closeManualToc();
      });
    });

    // vídeo de abertura do submenu de skills: loop mudo; 1o clique liga o som + controles
    const siv = content.querySelector(".skills-intro-video");
    if (siv) {
      const art = siv.closest(".skills-intro-art");
      const activate = () => {
        if (!siv.muted) return;
        siv.muted = false; siv.loop = false; siv.controls = true; siv.currentTime = 0;
        const h = art && art.querySelector(".skills-intro-hint"); if (h) h.style.display = "none";
        const pr = siv.play(); if (pr && pr.catch) pr.catch(() => {});
      };
      siv.addEventListener("click", activate);
      const hint = art && art.querySelector(".skills-intro-hint");
      if (hint) hint.addEventListener("click", activate);
    }

    // drawer mobile do submenu
    const toggle = content.querySelector(".manual-toc-toggle");
    const scrimEl = content.querySelector(".manual-subnav-scrim");
    if (toggle) toggle.addEventListener("click", () => {
      const open = content.querySelector(".manual-subnav").classList.contains("is-open");
      open ? closeManualToc() : openManualToc();
    });
    if (scrimEl) scrimEl.addEventListener("click", closeManualToc);
  }

  function openManualToc() {
    const sub = content.querySelector(".manual-subnav");
    const scrimEl = content.querySelector(".manual-subnav-scrim");
    const toggle = content.querySelector(".manual-toc-toggle");
    if (sub) sub.classList.add("is-open");
    if (scrimEl) scrimEl.hidden = false;
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }
  function closeManualToc() {
    const sub = content.querySelector(".manual-subnav");
    const scrimEl = content.querySelector(".manual-subnav-scrim");
    const toggle = content.querySelector(".manual-toc-toggle");
    if (sub) sub.classList.remove("is-open");
    if (scrimEl) scrimEl.hidden = true;
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  // Mostra a secao escolhida no painel
  // selo (verde/amarelo) + como ativar + download, com base no catalogo de skills
  // item do Marketplace Premium: se o aluno ja comprou, esconde a compra e libera o download
  function decoratePremium(panel, id) {
    const cat = (manualData.catalog && manualData.catalog[id]) || null;
    if (!cat || cat.kind !== "premium" || !cat.slug) return;
    const bought = !!(currentUser && Array.isArray(currentUser.purchases) && currentUser.purchases.indexOf(cat.slug) !== -1);
    if (!bought) return; // nao comprou: mantem aviso + caixas de pagamento como vieram
    const inner = panel.querySelector(".section__inner") || panel;
    const offer = panel.querySelector(".prem-offer");
    const notice = panel.querySelector(".prem-notice");
    if (offer) offer.style.display = "none";
    if (notice) notice.style.display = "none";
    const box = document.createElement("div");
    box.className = "prem-unlocked";
    if (cat.installOnly) {
      // entrega por instalacao (produto caro, sem zip): confirmacao + agendamento pelo time
      box.innerHTML =
        '<div class="prem-unlocked-msg"><b>Compra confirmada.</b> Que bom ter você com a gente. Uma pessoa do time Avalanche vai entrar em contato com você para agendar a instalação, e a gente entrega tudo rodando com a sua marca. Não precisa fazer nada agora, é só aguardar o nosso contato.</div>';
    } else {
      box.innerHTML =
        '<div class="prem-unlocked-msg"><b>Liberado!</b> Você já comprou esta skill. Baixe o arquivo .zip e mande pra sua Naia no Telegram pra ela instalar.</div>' +
        '<a class="skill-download" href="' + API_BASE + "/api/premium/" + encodeURIComponent(cat.slug) + '/download">' +
        '<span class="skill-download-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12M6.5 11.5 12 17l5.5-5.5M5 20h14"/></svg></span> Baixe a Skill</a>';
    }
    inner.appendChild(box);
  }

  function decorateSkillSection(panel, id) {
    const cat = (manualData.catalog && manualData.catalog[id]) || null;
    if (!cat) return;
    if (cat.kind === "premium") return decoratePremium(panel, id); // item premium tem fluxo proprio
    const inner = panel.querySelector(".section__inner") || panel;
    const installed = cat.status === "installed";
    const kind = cat.kind || "skill";
    const allowed = planAllowsSkill(cat);

    // selo no topo (logo abaixo do titulo)
    const head = inner.querySelector(".cap__head");
    const seal = document.createElement("div");
    if (!allowed) {
      // skill/plataforma bloqueada pro plano do usuario (starter)
      seal.className = "skill-seal is-locked";
      seal.innerHTML = '<span class="skill-seal-dot"></span> Bloqueado · disponível no plano Naia Completa';
    } else {
      seal.className = "skill-seal " + (installed ? "is-green" : "is-yellow");
      if (kind === "subagent") {
        seal.className = "skill-seal is-green";
        seal.innerHTML = '<span class="skill-seal-dot"></span> Já vem com a sua Naia (subagente)';
      } else if (kind === "builtin") {
        seal.className = "skill-seal is-green";
        seal.innerHTML = '<span class="skill-seal-dot"></span> Já vem com a sua Naia';
      } else if (installed) {
        seal.innerHTML = '<span class="skill-seal-dot"></span> Liberado · já vem instalada na sua Naia';
      } else {
        seal.innerHTML = '<span class="skill-seal-dot"></span> Liberar · baixe e instale na sua Naia';
      }
    }
    if (head && head.parentNode) head.parentNode.insertBefore(seal, head.nextSibling);
    else inner.insertBefore(seal, inner.firstChild);

    // bloqueada pro plano: nao mostra download, mostra CTA de upgrade no rodape
    if (!allowed) {
      const lockFoot = document.createElement("div");
      lockFoot.className = "skill-foot";
      lockFoot.innerHTML =
        '<div class="skill-activate">Essa entrega faz parte do plano <b>Naia Completa</b>. ' +
        "Libere o plano completo pra ativar essa skill na sua Naia.</div>" +
        '<a class="skill-upgrade" href="#gestao-assinatura">Liberar no plano Naia Completa</a>';
      inner.appendChild(lockFoot);
      return;
    }

    // rodape: como ativar + download (skills e guia tem download; subagente/builtin nao)
    if (kind === "subagent" || kind === "builtin") return;
    const slug = cat.slug;
    const foot = document.createElement("div");
    foot.className = "skill-foot";
    let ativarHtml, btnLabel;
    if (kind === "guide") {
      ativarHtml = "<b>Como instalar:</b> baixe o setup abaixo e cole no seu Claude Code ou Codex. Ele instala na sua VPS pra você, igual fez com a sua Naia.";
      btnLabel = "Baixe o setup";
    } else if (installed) {
      ativarHtml = "<b>Como ativar:</b> essa skill já vem instalada na sua Naia, é só pedir pra ela (veja o exemplo acima). O download abaixo é caso você queira o pacote pra guardar ou reinstalar.";
      btnLabel = "Baixe a Skill";
    } else {
      ativarHtml = "<b>Como ativar:</b> baixe o .zip abaixo e mande pra sua Naia no Telegram dizendo <i>\"instala essa skill\"</i>. Ela instala sozinha e a partir daí é só pedir.";
      btnLabel = "Baixe a Skill";
    }
    foot.innerHTML =
      '<div class="skill-activate">' + ativarHtml + "</div>" +
      '<a class="skill-download" href="' + API_BASE + "/api/skills/" + encodeURIComponent(slug) + '/download">' +
      '<span class="skill-download-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12M6.5 11.5 12 17l5.5-5.5M5 20h14"/></svg></span> ' + btnLabel + "</a>";
    inner.appendChild(foot);
  }

  // equipe: no plano starter, deixa em preto e branco os agentes nao liberados
  function decorateTeamSection(panel) {
    if (userPlan() !== "starter") return; // complete: ninguem fica cinza
    const cards = panel.querySelectorAll('[onclick*="openTeamModal"]');
    cards.forEach(function (card) {
      const m = /openTeamModal\('([^']+)'\)/.exec(card.getAttribute("onclick") || "");
      const slug = m && m[1];
      if (slug && !planAllowsAgent(slug)) {
        card.classList.add("team-locked");
        const tag = document.createElement("span");
        tag.className = "team-locked-tag";
        tag.textContent = "Bloqueado";
        card.appendChild(tag);
      }
    });
  }

  function showManualSection(id, opts) {
    if (!validManualSection(id)) id = firstManualSection();
    if (!id) return;
    manualSection = id;

    const panel = content.querySelector("#manualPanel");
    if (panel) {
      panel.innerHTML = manualData.sections[id] || "";
      decorateSkillSection(panel, id);
      if (id === "equipe") decorateTeamSection(panel);
      // gravacoes da comunidade e do grupo de estudos tambem sao aulas: concluir + nota abaixo do video
      if (manualLesson && (manualLesson.view === "gravacoes" || manualLesson.view === "estudos")) {
        const inner = panel.querySelector(".section__inner") || panel;
        // footer fica abaixo do video e ACIMA dos capitulos (antes do "X capitulos"/acordeao)
        const before = inner.querySelector(".gv-count") || inner.querySelector(".gv-accordion");
        mountLessonFooter(id, inner, before);
      }
      // sobe pro topo do painel ao trocar (rolagem suave so quando o usuario clicou)
      window.scrollTo({ top: 0, behavior: (opts && opts.fromUser) ? "smooth" : "auto" });
    }

    // marca o item ativo no submenu
    content.querySelectorAll(".manual-nav-item").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.section === id);
      if (el.dataset.section === id) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });

    // reflete no hash: #<aula>/<secao> (ex: #marketplace-skills/skill-carrossel)
    const lid = (manualLesson && manualLesson.id) || "manual";
    if (history.replaceState) history.replaceState(null, "", "#" + lid + "/" + id);
    try { localStorage.setItem(LAST_KEY, lid); } catch (e) {}
  }

  // ---------- copiar (delegado): data-copy="TEXTO" e data-copy-el="ID" ----------
  content.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-copy], [data-copy-el]");
    if (!btn) return;

    let text = null;
    if (btn.hasAttribute("data-copy")) {
      text = btn.getAttribute("data-copy");
    } else {
      const el = document.getElementById(btn.getAttribute("data-copy-el"));
      text = el ? el.textContent : "";
    }
    if (text == null) return;

    // botao de icone (term-copy) tem spans proprios: nao mexer no textContent, so alterna .done
    const isIcon = btn.classList.contains("term-copy");
    const done = btn.classList.contains("btn-copy") ? "Copiado" : "copiado";
    const original = btn.dataset.label || btn.textContent;
    btn.dataset.label = original;

    const feedback = () => {
      if (!isIcon) btn.textContent = done;
      btn.classList.add("done");
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        if (!isIcon) btn.textContent = btn.dataset.label;
        btn.classList.remove("done");
      }, 2200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(feedback).catch(() => fallbackCopy(text, feedback));
    } else {
      fallbackCopy(text, feedback);
    }
  });

  // ---------- Gravações Comunidade: acordeão de capítulos + seek no vídeo ----------
  content.addEventListener("click", function (e) {
    const seek = e.target.closest(".gv-seek");
    if (seek) {
      const v = document.getElementById(seek.getAttribute("data-video"));
      const t = parseInt(seek.getAttribute("data-t"), 10) || 0;
      if (v) {
        try { v.currentTime = t; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (err) {}
        v.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    const head = e.target.closest(".gv-ch-head");
    if (head) {
      const ch = head.closest(".gv-chapter");
      if (ch) ch.classList.toggle("open");
    }
  });

  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); cb(); } catch (e) {}
    document.body.removeChild(ta);
  }

  // ---------- copiar comando do manual (delegado): .cmd__copy -> .cmd__text ----------
  var CMD_COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  var CMD_CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  content.addEventListener("click", function (e) {
    const btn = e.target.closest(".cmd__copy");
    if (!btn) return;
    const cmd = btn.closest(".cmd");
    const textEl = cmd && cmd.querySelector(".cmd__text");
    if (!textEl) return;
    const text = textEl.textContent.trim();

    const done = () => {
      btn.classList.add("is-copied");
      btn.innerHTML = CMD_CHECK_ICON;
      btn.setAttribute("aria-label", "Comando copiado");
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        btn.classList.remove("is-copied");
        btn.innerHTML = CMD_COPY_ICON;
        btn.setAttribute("aria-label", "Copiar comando");
      }, 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  });

  // ==========================================================================
  // POPUP DA EQUIPE — openTeamModal(slug) (portado do manual-app.js)
  // ==========================================================================
  var GRP_LABEL = {
    "Comando": "Comando e Operação",
    "Producao": "Produção",
    "Trafego": "Tráfego e Clientes",
    "SDR": "Squad SDR"
  };

  var TM_ICO_CHECK = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TM_ICO_DOT = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.4" fill="currentColor"/></svg>';

  function tmStatusChip(s) {
    var ativo = s === "ativo";
    return '<span class="chip chip-' + (ativo ? "ativo" : "hib") + '"><span class="chip-dot"></span>' + esc(s) + "</span>";
  }
  function tmModelChip(m) {
    var isOpus = String(m || "").toLowerCase() === "opus";
    return '<span class="chip chip-' + (isOpus ? "opus" : "sonnet") + '">' + esc(m) + "</span>";
  }
  function tmSectionBlock(title, inner) {
    if (!inner) return "";
    return '<div class="tbm-sec"><div class="tbm-sec-title">' + esc(title) + "</div>" + inner + "</div>";
  }
  function tmBulletList(items, ico, cls) {
    if (!items || !items.length) return "";
    return '<ul class="tbm-list ' + (cls || "") + '">' + items.map(function (it) {
      return '<li><span class="tbm-li-ico">' + ico + "</span><span>" + esc(it) + "</span></li>";
    }).join("") + "</ul>";
  }
  function tmPlatChips(items) {
    if (!items || !items.length) return "";
    return '<div class="tbm-plats">' + items.map(function (p) {
      return '<span class="tbm-plat">' + esc(p) + "</span>";
    }).join("") + "</div>";
  }

  var teamModal = null;
  var teamModalBody = null;
  var teamModalLastFocus = null;

  function ensureTeamModal() {
    if (teamModal) return;
    teamModal = document.createElement("div");
    teamModal.className = "team-modal";
    teamModal.setAttribute("aria-hidden", "true");
    teamModal.setAttribute("role", "dialog");
    teamModal.setAttribute("aria-modal", "true");
    teamModal.setAttribute("aria-label", "Detalhes do integrante da equipe");
    teamModal.innerHTML =
      '<div class="team-modal__scrim" data-close="1"></div>' +
      '<div class="team-modal__card" role="document">' +
        '<button type="button" class="team-modal__x" data-close="1" aria-label="Fechar">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        "</button>" +
        '<div id="teamModalBody"></div>' +
      "</div>";
    document.body.appendChild(teamModal);
    teamModalBody = teamModal.querySelector("#teamModalBody");

    teamModal.addEventListener("click", function (e) {
      if (e.target.getAttribute("data-close") === "1") closeTeamModal();
    });
  }

  window.openTeamModal = function (slug) {
    var a = manualTeam[slug];
    if (!a) return;
    ensureTeamModal();

    var grpLabel = GRP_LABEL[a.grupo] || a.grupo || "";
    var avatar = a.foto
      ? '<img src="/manual/img/equipe/' + esc(a.foto) + '" alt="' + esc(a.nome) + '">'
      : '<div class="team-avatar-ini">' + esc((a.nome || "?").replace(/^Clone\s+/, "").charAt(0).toUpperCase()) + "</div>";
    var orqChip = (slug === "naia") ? '<span class="chip chip-orq">orquestra a equipe</span>' : "";

    var lockedNote = !planAllowsAgent(slug)
      ? '<div class="tbm-locked-note">Disponível no plano Naia Completa</div>'
      : "";

    var body =
      lockedNote +
      tmSectionBlock("Resumo", a.resumo ? '<p class="tbm-resumo">' + esc(a.resumo) + "</p>" : "") +
      tmSectionBlock("Habilidades", tmBulletList(a.habilidades, TM_ICO_CHECK, "tbm-skills")) +
      tmSectionBlock("O que faz", tmBulletList(a.o_que_faz, TM_ICO_DOT, "tbm-does")) +
      tmSectionBlock("Plataformas e ferramentas", tmPlatChips(a.plataformas)) +
      tmSectionBlock("Como atua no fluxo", a.como_atua ? '<p class="tbm-fluxo">' + esc(a.como_atua) + "</p>" : "");

    teamModalBody.innerHTML =
      '<div class="tbm-hero" data-grp="' + esc(a.grupo || "") + '">' +
        '<div class="tbm-avatar">' + avatar + "</div>" +
        '<div class="tbm-hero-info">' +
          '<div class="tbm-name">' + esc(a.nome) + "</div>" +
          '<div class="tbm-role">' + esc(a.cargo) + "</div>" +
          '<div class="tbm-group"><span class="grp-dot"></span>' + esc(grpLabel) + "</div>" +
          '<div class="tbm-chips">' + tmStatusChip(a.status) + tmModelChip(a.modelo) + orqChip + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="tbm-content" data-grp="' + esc(a.grupo || "") + '">' + body + "</div>";

    teamModalLastFocus = document.activeElement;
    teamModal.classList.add("is-open");
    teamModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var x = teamModal.querySelector(".team-modal__x");
    if (x) x.focus();
  };

  function closeTeamModal() {
    if (!teamModal) return;
    teamModal.classList.remove("is-open");
    teamModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (teamModalLastFocus && teamModalLastFocus.focus) teamModalLastFocus.focus();
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && teamModal && teamModal.classList.contains("is-open")) closeTeamModal();
  });

  // ---------- menu mobile ----------
  function openMenu() {
    sidebar.classList.add("open");
    scrim.classList.add("show");
    menuBtn.setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    sidebar.classList.remove("open");
    scrim.classList.remove("show");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  menuBtn.addEventListener("click", () =>
    sidebar.classList.contains("open") ? closeMenu() : openMenu()
  );
  scrim.addEventListener("click", closeMenu);

  // hash externo (voltar/avancar do navegador)
  window.addEventListener("hashchange", () => {
    const raw = location.hash.slice(1);
    const id = raw.split("/")[0];

    // navegacao dentro da view atual (manual/marketplace): troca so a secao, sem refazer o shell
    if (inManual && manualData && manualLesson && id === manualLesson.id) {
      const sub = parseManualHash();
      if (sub && sub !== manualSection) showManualSection(sub, { fromUser: false });
      return;
    }

    if (id && id !== activeId && lessons.some((l) => l.id === id)) openLesson(id);
  });

  // ---------- tema claro/escuro ----------
  var THEME_KEY = "naia_theme"; // "light" (default) | "dark"
  var SUN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  var MOON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function readTheme() {
    try {
      return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch (e) { return "light"; }
  }
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    var ic = document.getElementById("themeToggleIc");
    var label = document.getElementById("themeToggleLabel");
    var btn = document.getElementById("themeToggle");
    // ico mostra o destino: no claro mostra a lua (vai pro escuro); no escuro mostra o sol
    if (ic) ic.innerHTML = theme === "dark" ? SUN_ICON : MOON_ICON;
    if (label) label.textContent = theme === "dark" ? "Tema claro" : "Tema escuro";
    if (btn) btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }
  function setupTheme() {
    applyTheme(readTheme());
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = readTheme() === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme(next);
    });
  }
  setupTheme();

  // ---------- sair ----------
  document.getElementById("logoutBtn").addEventListener("click", async function () {
    this.disabled = true;
    this.textContent = "Saindo…";
    try {
      await apiFetch(API_BASE + "/api/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    try { localStorage.removeItem(LAST_KEY); } catch (e) {}
    location.replace("/login.html");
  });

  boot();
})();
