/* Mapa mental navegavel das aulas da apostila (Grupo de Estudos), sem dependencia externa.
   Monta sozinho em todo .gv-mapa[data-mapa-url] que aparecer na pagina: busca o JSON na rota
   autenticada da API (cookie da sessao), desenha a raiz e os ramos e liga abrir e fechar ramo,
   arrastar, zoom (roda do mouse, pinca e botoes), centralizar, abrir e fechar tudo e o horario
   que pula o video para o trecho. */
(function () {
  "use strict";
  if (window.__naiaMapaMental) return;
  window.__naiaMapaMental = true;

  var ACC = ["--coral", "--teal", "--mustard", "--navy", "--green", "--brick", "--gold", "--kraft-dark"];
  var K_MIN = 0.2, K_MAX = 2.5, COMPACTO = 440, BADGE = 12;
  var REDUZ = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var cache = {};

  var ICO = {
    mais: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    menos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    centro: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/></svg>',
    abrir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8v14.4L19 12z"/></svg>'
  };

  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return (h > 0 ? h + ":" : "") + p(m) + ":" + p(x);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function suave(t) { return 1 - Math.pow(1 - t, 3); }

  function carregar(url) {
    if (!cache[url]) {
      cache[url] = fetch(url, { credentials: "include", headers: { Accept: "application/json" } }).then(function (r) {
        if (!r.ok) { var e = new Error("http " + r.status); e.status = r.status; throw e; }
        return r.json();
      });
      cache[url].catch(function () { delete cache[url]; });
    }
    return cache[url];
  }

  function status(box, msg, tentar) {
    var st = box.querySelector(".mm-status");
    if (!st) { st = document.createElement("div"); st.className = "mm-status"; box.appendChild(st); }
    st.textContent = msg;
    if (tentar) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = "Tentar de novo";
      b.addEventListener("click", tentar);
      st.appendChild(b);
    }
  }

  function montar(host) {
    if (host.__mm) return;
    host.__mm = true;
    var box = host.querySelector(".mm-box");
    if (!box) { box = document.createElement("div"); box.className = "mm-box"; host.appendChild(box); }
    status(box, "Carregando o mapa mental...");
    carregar(host.getAttribute("data-mapa-url")).then(function (dados) {
      if (!host.isConnected) return;
      if (!dados || !dados.raiz) throw new Error("mapa vazio");
      host.__mapa = new Mapa(host, box, dados);
    }).catch(function (e) {
      if (!host.isConnected) return;
      var s = e && e.status;
      if (s === 401 || s === 403) status(box, "Entre de novo na sua conta para ver o mapa mental.");
      else if (s === 404) status(box, "O mapa mental desta aula ainda não está disponível.");
      else status(box, "Não deu para carregar o mapa mental agora.", function () { host.__mm = false; box.innerHTML = ""; montar(host); });
    });
  }

  // ------------------------------------------------------------------ o mapa
  function Mapa(host, box, dados) {
    var self = this;
    this.host = host; this.box = box; this.videoId = host.getAttribute("data-video") || "";
    this.view = { x: 0, y: 0, k: 1 };
    this.mexeu = false; this.pronto = false; this.compacto = null; this.todos = false; this.anim = 0;
    this.nos = [];
    (function add(n, d, pai, ramo) {
      var no = { id: self.nos.length, texto: String(n.texto || ""), t: typeof n.t === "number" ? n.t : null, d: d,
                 pai: pai, filhos: [], ramo: ramo, aberto: d === 0, w: null, h: null, rx: null, ry: null };
      self.nos.push(no);
      if (pai) pai.filhos.push(no);
      (n.filhos || []).forEach(function (f, i) { add(f, d + 1, no, d === 0 ? i : ramo); });
      return no;
    })(dados.raiz, 0, null, 0);
    this.raiz = this.nos[0];
    this.montarDom(dados);
    this.ligarEventos();
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(function () {
        if (!self.host.isConnected) { self.ro.disconnect(); return; }
        self.aoRedimensionar();
      });
      this.ro.observe(box);
    }
    this.aoRedimensionar();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (!self.host.isConnected || !self.pronto) return;
        self.nos.forEach(function (n) { n.w = n.h = null; });
        self.render(self.mexeu ? null : function () { return self.enquadrar(); }, false);
      });
    }
  }

  Mapa.prototype.montarDom = function (dados) {
    var host = this.host, box = this.box, self = this;
    var head = host.querySelector(".mm-head");
    if (!head) { head = document.createElement("div"); head.className = "mm-head"; host.insertBefore(head, box); }
    var titulo = head.querySelector(".mm-title");
    if (!titulo) { titulo = document.createElement("h3"); titulo.className = "mm-title"; titulo.textContent = "Mapa mental da aula"; head.appendChild(titulo); }
    var esq = document.createElement("div"); esq.className = "mm-head-l";
    head.insertBefore(esq, titulo); esq.appendChild(titulo);
    var cont = document.createElement("span"); cont.className = "mm-count";
    cont.textContent = (this.nos.length - 1) + " tópicos"; esq.appendChild(cont);

    var tools = document.createElement("div"); tools.className = "mm-tools"; tools.setAttribute("role", "toolbar"); tools.setAttribute("aria-label", "Controles do mapa mental");
    function bt(cls, ico, rot, aria, fn) {
      var b = document.createElement("button");
      b.type = "button"; b.className = cls; b.title = aria; b.setAttribute("aria-label", aria);
      b.innerHTML = ico + (rot ? '<span class="mm-tl">' + rot + "</span>" : "");
      b.addEventListener("click", fn);
      tools.appendChild(b);
      return b;
    }
    bt("mm-zin is-icon", ICO.mais, "", "Aproximar", function () { self.zoomBotao(1.25); });
    bt("mm-zout is-icon", ICO.menos, "", "Afastar", function () { self.zoomBotao(1 / 1.25); });
    bt("mm-centro", ICO.centro, "Centralizar", "Centralizar o mapa", function () { self.mexeu = false; self.animarView(self.enquadrar()); });
    this.btTudo = bt("mm-tudo", ICO.abrir, "Abrir tudo", "Abrir todos os ramos", function () { self.tudo(!self.todos); });
    this.btTudo.setAttribute("aria-pressed", "false");
    head.appendChild(tools);

    var dica = document.createElement("p"); dica.className = "mm-hint";
    dica.textContent = "Toque num tópico para abrir os ramos e no horário para ver o trecho no vídeo. Arraste para mover e use a roda do mouse, a pinça ou os botões para o zoom.";
    host.insertBefore(dica, box);

    box.innerHTML = "";
    box.setAttribute("tabindex", "0");
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Mapa mental da aula. Setas movem o mapa, mais e menos mudam o zoom e zero centraliza.");
    var stage = document.createElement("div"); stage.className = "mm-stage";
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "mm-links"); svg.setAttribute("aria-hidden", "true");
    stage.appendChild(svg);
    this.nos.forEach(function (no) {
      var el = document.createElement("div");
      el.className = "mm-node mm-d" + Math.min(no.d, 3) + (no.filhos.length && no.d > 0 ? " is-branch" : "");
      el.setAttribute("data-k", no.id);
      el.hidden = no.d > 1;
      if (no.d > 0) el.style.setProperty("--mm-acc", "var(" + ACC[no.ramo % ACC.length] + ")");
      // texto (abre e fecha o ramo), horario logo depois do texto e contador do ramo na borda direita
      var lb = document.createElement("span");
      lb.className = "mm-label";
      lb.textContent = no.texto;
      if (no.filhos.length && no.d > 0) { lb.setAttribute("role", "button"); lb.setAttribute("tabindex", "0"); }
      el.appendChild(lb);
      if (no.t != null && no.d > 0) {
        var tb = document.createElement("button");
        tb.type = "button"; tb.className = "mm-time"; tb.setAttribute("data-t", String(no.t));
        tb.title = "Assistir desde " + fmt(no.t); tb.setAttribute("aria-label", "Assistir desde " + fmt(no.t));
        tb.innerHTML = ICO.play + "<span>" + fmt(no.t) + "</span>";
        el.appendChild(tb);
      }
      if (no.filhos.length && no.d > 0) { var bd = document.createElement("span"); bd.className = "mm-badge"; bd.setAttribute("aria-hidden", "true"); el.appendChild(bd); }
      no.el = el; no.lb = lb;
      if (no.d > 0) {
        var p = document.createElementNS(NS, "path");
        p.setAttribute("class", no.d > 1 ? "mm-fina" : "");
        p.style.stroke = "var(" + ACC[no.ramo % ACC.length] + ")";
        p.style.display = no.d > 1 ? "none" : "";
        svg.appendChild(p);
        no.linha = p;
      }
      self.estadoNo(no);
      stage.appendChild(el);
    });
    box.appendChild(stage);
    this.stage = stage; this.svg = svg;
  };

  Mapa.prototype.estadoNo = function (no) {
    if (!no.filhos.length || no.d === 0) return;
    no.el.classList.toggle("is-open", no.aberto);
    no.lb.setAttribute("aria-expanded", no.aberto ? "true" : "false");
    no.lb.setAttribute("aria-label", no.texto + (no.aberto ? ". Fechar ramo" : ". Abrir ramo com " + no.filhos.length + (no.filhos.length > 1 ? " tópicos" : " tópico")));
    var bd = no.el.querySelector(".mm-badge");
    if (bd) bd.textContent = no.aberto ? "" : String(no.filhos.length);
  };

  // ---------------------------------------------------------------- layout (arvore da esquerda para a direita)
  Mapa.prototype.layout = function () {
    var vis = [];
    (function walk(n) { vis.push(n); if (n.aberto) n.filhos.forEach(walk); })(this.raiz);
    var ativo = {};
    vis.forEach(function (n) { ativo[n.id] = true; if (n.el.hidden) n.el.hidden = false; });
    this.nos.forEach(function (n) {
      if (!ativo[n.id] && !n.el.hidden) { n.el.hidden = true; n.rx = n.ry = null; if (n.linha) n.linha.style.display = "none"; }
    });
    vis.forEach(function (n) { if (n.w == null) { n.w = n.el.offsetWidth; n.h = n.el.offsetHeight; } });
    var comp = this.compacto;
    function gx(n) { return n.d === 0 ? (comp ? 34 : 60) : (comp ? 30 : 42); }
    function gy(n) { return n.d === 0 ? (comp ? 12 : 16) : 8; }
    (function alt(n) {
      var kids = n.aberto ? n.filhos : [];
      if (!kids.length) { n.sh = n.h; return n.sh; }
      var s = 0;
      kids.forEach(function (c, i) { s += alt(c) + (i ? gy(n) : 0); });
      n.bloco = s; n.sh = Math.max(n.h, s);
      return n.sh;
    })(this.raiz);
    (function pos(n, x, topo) {
      n.nx = x;
      var kids = n.aberto ? n.filhos : [];
      if (!kids.length) { n.ny = topo + (n.sh - n.h) / 2; return; }
      var y = topo + Math.max(0, (n.sh - n.bloco) / 2), cx = x + n.w + gx(n);
      kids.forEach(function (c) { pos(c, cx, y); y += c.sh + gy(n); });
      var a = kids[0], b = kids[kids.length - 1];
      var meio = (a.ny + a.h / 2 + b.ny + b.h / 2) / 2;
      n.ny = clamp(meio - n.h / 2, topo, topo + n.sh - n.h);
    })(this.raiz, 0, 0);
    return vis;
  };

  Mapa.prototype.caixa = function (lista) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    lista.forEach(function (n) {
      b.x0 = Math.min(b.x0, n.nx); b.y0 = Math.min(b.y0, n.ny);
      b.x1 = Math.max(b.x1, n.nx + n.w + (n.filhos.length && n.d > 0 ? BADGE : 0)); b.y1 = Math.max(b.y1, n.ny + n.h);
    });
    return b;
  };
  Mapa.prototype.pad = function () { return this.compacto ? 12 : 22; };

  // enquadra a arvore visivel. Se ela inteira nao couber num zoom legivel, prioriza a largura
  // (com piso legivel) e ancora na raiz no meio da altura: arrastar mostra o resto.
  Mapa.prototype.enquadrar = function () {
    var W = this.box.clientWidth, H = this.box.clientHeight, vis = this.visiveis || [this.raiz], P = this.pad();
    var b = this.caixa(vis), bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    var kLeg = this.compacto ? 0.66 : 0.6;
    var kw = (W - 2 * P) / bw, kh = (H - 2 * P) / bh;
    var k = Math.min(1, Math.max(Math.min(kw, kh, 1), kLeg));
    var x = bw * k <= W - 2 * P + 0.5 ? (W - bw * k) / 2 - b.x0 * k : P - b.x0 * k;
    var y = bh * k <= H - 2 * P + 0.5 ? (H - bh * k) / 2 - b.y0 * k : H / 2 - (this.raiz.ny + this.raiz.h / 2) * k;
    return { x: x, y: y, k: k };
  };

  // depois de abrir um ramo: move o minimo para os filhos aparecerem sem perder o no de vista
  Mapa.prototype.mostrarRamo = function (no, v) {
    var W = this.box.clientWidth, H = this.box.clientHeight, sub = [], PAD = this.pad();
    (function walk(n) { sub.push(n); if (n.aberto) n.filhos.forEach(walk); })(no);
    var b = this.caixa(sub), k = v.k;
    // os filhos aparecem inteiros; o no aberto pode sair um pouco pela esquerda, mas fica um pedaco
    // dele (com o contador) a vista para fechar de novo
    var dir = b.x1 * k + v.x, dirNo = (no.nx + no.w) * k + v.x;
    if (dir > W - PAD) {
      var desloca = Math.min(dir - (W - PAD), dirNo - (PAD + 56));
      if (desloca > 0) v.x -= desloca;
    }
    var topo = b.y0 * k + v.y, base = b.y1 * k + v.y;
    if ((b.y1 - b.y0) * k <= H - 2 * PAD) {
      if (topo < PAD) v.y += PAD - topo;
      else if (base > H - PAD) v.y -= base - (H - PAD);
    } else {
      var yTopo = PAD - b.y0 * k;
      var noBase = (no.ny + no.h) * k + yTopo;
      v.y = noBase <= H - PAD ? yTopo : H / 2 - (no.ny + no.h / 2) * k;
    }
    return v;
  };

  Mapa.prototype.caminho = function (n) {
    var p = n.pai, x1 = p.rx + p.w, y1 = p.ry + p.h / 2, x2 = n.rx, y2 = n.ry + n.h / 2, dx = Math.max(16, (x2 - x1) / 2);
    return "M" + x1.toFixed(1) + " " + y1.toFixed(1) + "C" + (x1 + dx).toFixed(1) + " " + y1.toFixed(1) + " " +
      (x2 - dx).toFixed(1) + " " + y2.toFixed(1) + " " + x2.toFixed(1) + " " + y2.toFixed(1);
  };

  Mapa.prototype.pintar = function (vis) {
    var mx = 0, my = 0;
    vis.forEach(function (n) {
      n.el.style.transform = "translate(" + n.rx.toFixed(1) + "px," + n.ry.toFixed(1) + "px)";
      mx = Math.max(mx, n.rx + n.w); my = Math.max(my, n.ry + n.h);
    });
    for (var i = 0; i < vis.length; i++) {
      var n = vis[i];
      if (n.linha) { n.linha.setAttribute("d", this.caminho(n)); n.linha.style.display = ""; }
    }
    this.svg.setAttribute("width", Math.ceil(mx + 40));
    this.svg.setAttribute("height", Math.ceil(my + 40));
  };

  Mapa.prototype.setView = function (v) {
    this.view = { x: v.x, y: v.y, k: v.k };
    this.stage.style.transform = "translate(" + v.x.toFixed(1) + "px," + v.y.toFixed(1) + "px) scale(" + v.k.toFixed(4) + ")";
  };

  // re-layout com animacao curta: nos novos saem do pai, os que ficam deslizam, a vista vai junto
  Mapa.prototype.render = function (alvoView, animar) {
    var self = this;
    cancelAnimationFrame(this.anim);
    var vis = this.layout();
    this.visiveis = vis;
    var de = {}, novos = [];
    vis.forEach(function (n) {
      if (n.rx == null) {
        var p = n.pai;
        de[n.id] = p && p.rx != null ? { x: p.rx + p.w * 0.5, y: p.ry + (p.h - n.h) / 2 } : { x: n.nx, y: n.ny };
        novos.push(n);
      } else de[n.id] = { x: n.rx, y: n.ry };
    });
    var v0 = this.view, v1 = alvoView ? alvoView.call(this) : v0;
    var dur = animar === false || REDUZ ? 0 : 300, t0 = performance.now();
    function passo(agora) {
      var t = dur ? clamp((agora - t0) / dur, 0, 1) : 1, e = suave(t);
      vis.forEach(function (n) { n.rx = de[n.id].x + (n.nx - de[n.id].x) * e; n.ry = de[n.id].y + (n.ny - de[n.id].y) * e; });
      novos.forEach(function (n) { n.el.style.opacity = t < 1 ? String(e) : ""; });
      self.pintar(vis);
      self.setView({ x: v0.x + (v1.x - v0.x) * e, y: v0.y + (v1.y - v0.y) * e, k: v0.k + (v1.k - v0.k) * e });
      if (t < 1) self.anim = requestAnimationFrame(passo);
    }
    if (dur) this.anim = requestAnimationFrame(passo); else passo(t0);
  };

  Mapa.prototype.animarView = function (v1) {
    var self = this, v0 = this.view, t0 = performance.now(), dur = REDUZ ? 0 : 260;
    cancelAnimationFrame(this.anim);
    if (this.visiveis) this.visiveis.forEach(function (n) { n.rx = n.nx; n.ry = n.ny; n.el.style.opacity = ""; });
    if (this.visiveis) this.pintar(this.visiveis);
    function passo(agora) {
      var t = dur ? clamp((agora - t0) / dur, 0, 1) : 1, e = suave(t);
      self.setView({ x: v0.x + (v1.x - v0.x) * e, y: v0.y + (v1.y - v0.y) * e, k: v0.k + (v1.k - v0.k) * e });
      if (t < 1) self.anim = requestAnimationFrame(passo);
    }
    if (dur) this.anim = requestAnimationFrame(passo); else passo(t0);
  };

  Mapa.prototype.alternar = function (no) {
    var v = this.view;
    var sx = (no.rx != null ? no.rx : no.nx) * v.k + v.x, sy = (no.ry != null ? no.ry : no.ny) * v.k + v.y;
    no.aberto = !no.aberto;
    this.estadoNo(no);
    var abriu = no.aberto;
    this.render(function () {
      var nv = { k: v.k, x: sx - no.nx * v.k, y: sy - no.ny * v.k };
      return abriu ? this.mostrarRamo(no, nv) : nv;
    });
    this.atualizaBotaoTudo();
  };

  Mapa.prototype.tudo = function (abrir) {
    this.nos.forEach(function (n) { if (n.d > 0 && n.filhos.length) n.aberto = abrir; });
    this.nos.forEach(this.estadoNo, this);
    this.mexeu = false;
    this.render(function () { return this.enquadrar(); });
    this.atualizaBotaoTudo();
  };

  Mapa.prototype.atualizaBotaoTudo = function () {
    var ramos = this.nos.filter(function (n) { return n.d > 0 && n.filhos.length; });
    this.todos = ramos.length > 0 && ramos.every(function (n) { return n.aberto; });
    var b = this.btTudo;
    b.innerHTML = (this.todos ? ICO.fechar : ICO.abrir) + '<span class="mm-tl">' + (this.todos ? "Fechar tudo" : "Abrir tudo") + "</span>";
    b.title = this.todos ? "Fechar todos os ramos" : "Abrir todos os ramos";
    b.setAttribute("aria-label", b.title);
    b.setAttribute("aria-pressed", this.todos ? "true" : "false");
  };

  Mapa.prototype.zoomEm = function (fator, px, py) {
    var v = this.view, k = clamp(v.k * fator, K_MIN, K_MAX), f = k / v.k;
    return { k: k, x: px - (px - v.x) * f, y: py - (py - v.y) * f };
  };
  Mapa.prototype.zoomBotao = function (fator) {
    this.mexeu = true;
    this.animarView(this.zoomEm(fator, this.box.clientWidth / 2, this.box.clientHeight / 2));
  };

  // pula o video da aula para o horario (mesmo comportamento do "assistir desde aqui" dos capitulos)
  Mapa.prototype.pular = function (t) {
    var v = document.getElementById(this.videoId);
    if (!v) return;
    try {
      v.currentTime = t;
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    } catch (err) {}
    v.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  Mapa.prototype.aoRedimensionar = function () {
    var W = this.box.clientWidth, H = this.box.clientHeight;
    if (!W || !H) return;
    var comp = W < COMPACTO;
    if (comp !== this.compacto) {
      this.compacto = comp;
      this.host.classList.toggle("is-compact", comp);
      this.nos.forEach(function (n) { n.w = n.h = null; });
      this.render(this.mexeu ? null : function () { return this.enquadrar(); }, false);
      this.pronto = true;
      this.host.setAttribute("data-mm", "pronto");
      return;
    }
    if (!this.mexeu) this.render(function () { return this.enquadrar(); }, false);
  };

  // ---------------------------------------------------------------- eventos
  Mapa.prototype.ligarEventos = function () {
    var self = this, box = this.box, ptrs = {}, n = 0, drag = null, pinca = null, arrastou = false;

    function lista() { return Object.keys(ptrs).map(function (k) { return ptrs[k]; }); }
    function iniciaPinca() {
      var p = lista(), r = box.getBoundingClientRect();
      var mx = (p[0].x + p[1].x) / 2 - r.left, my = (p[0].y + p[1].y) / 2 - r.top;
      pinca = { d0: Math.max(1, Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)), k0: self.view.k,
                sx: (mx - self.view.x) / self.view.k, sy: (my - self.view.y) / self.view.k };
      drag = null;
    }

    box.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; n = Object.keys(ptrs).length;
      if (n === 1) { drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, vx: self.view.x, vy: self.view.y, ativo: false }; arrastou = false; }
      else if (n === 2) {
        iniciaPinca(); arrastou = true;
        Object.keys(ptrs).forEach(function (id) { try { box.setPointerCapture(+id); } catch (err) {} });
      }
    });
    box.addEventListener("pointermove", function (e) {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pinca && Object.keys(ptrs).length >= 2) {
        var p = lista(), r = box.getBoundingClientRect();
        var d = Math.max(1, Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y));
        var mx = (p[0].x + p[1].x) / 2 - r.left, my = (p[0].y + p[1].y) / 2 - r.top;
        var k = clamp(pinca.k0 * d / pinca.d0, K_MIN, K_MAX);
        cancelAnimationFrame(self.anim);
        self.setView({ k: k, x: mx - pinca.sx * k, y: my - pinca.sy * k });
        self.mexeu = true;
        e.preventDefault();
        return;
      }
      if (drag && drag.id === e.pointerId) {
        var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
        if (!drag.ativo && Math.abs(dx) + Math.abs(dy) > 6) {
          drag.ativo = true; arrastou = true; box.classList.add("is-dragging");
          try { box.setPointerCapture(e.pointerId); } catch (err) {}
          cancelAnimationFrame(self.anim);
        }
        if (drag.ativo) { self.setView({ k: self.view.k, x: drag.vx + dx, y: drag.vy + dy }); self.mexeu = true; e.preventDefault(); }
      }
    });
    function solta(e) {
      delete ptrs[e.pointerId];
      var resto = lista();
      if (resto.length < 2) pinca = null;
      if (drag && drag.id === e.pointerId) drag = null;
      if (resto.length === 1 && !drag) {
        var id = Object.keys(ptrs)[0];
        drag = { id: +id, x0: resto[0].x, y0: resto[0].y, vx: self.view.x, vy: self.view.y, ativo: true };
      }
      if (!resto.length) box.classList.remove("is-dragging");
    }
    box.addEventListener("pointerup", solta);
    box.addEventListener("pointercancel", solta);

    // clique logo depois de arrastar nao abre ramo nem pula o video
    box.addEventListener("click", function (e) {
      if (arrastou) { e.stopPropagation(); e.preventDefault(); arrastou = false; }
    }, true);
    box.addEventListener("click", function (e) {
      var tb = e.target.closest(".mm-time");
      if (tb && box.contains(tb)) { self.pular(parseInt(tb.getAttribute("data-t"), 10) || 0); return; }
      var el = e.target.closest(".mm-node.is-branch");
      if (el && box.contains(el)) {
        var no = self.nos[+el.getAttribute("data-k")];
        if (no) { self.mexeu = true; self.alternar(no); }
      }
    });
    box.addEventListener("keydown", function (e) {
      var lb = e.target.closest && e.target.closest(".mm-label[role=button]");
      if (!lb || (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar")) return;
      e.preventDefault();
      var no = self.nos[+lb.parentNode.getAttribute("data-k")];
      if (no) { self.mexeu = true; self.alternar(no); }
    });

    box.addEventListener("wheel", function (e) {
      e.preventDefault();
      var r = box.getBoundingClientRect(), m = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? r.height : 1;
      var dy = e.deltaY * m, dx = e.deltaX * m;
      cancelAnimationFrame(self.anim);
      self.mexeu = true;
      if (!e.ctrlKey && Math.abs(dx) > Math.abs(dy)) { self.setView({ k: self.view.k, x: self.view.x - dx, y: self.view.y }); return; }
      self.setView(self.zoomEm(Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left, e.clientY - r.top));
    }, { passive: false });

    box.addEventListener("keydown", function (e) {
      if (e.target !== box) return;
      var v = self.view, passo = 60, feito = true;
      if (e.key === "ArrowLeft") self.setView({ k: v.k, x: v.x + passo, y: v.y });
      else if (e.key === "ArrowRight") self.setView({ k: v.k, x: v.x - passo, y: v.y });
      else if (e.key === "ArrowUp") self.setView({ k: v.k, x: v.x, y: v.y + passo });
      else if (e.key === "ArrowDown") self.setView({ k: v.k, x: v.x, y: v.y - passo });
      else if (e.key === "+" || e.key === "=") self.zoomBotao(1.25);
      else if (e.key === "-" || e.key === "_") self.zoomBotao(1 / 1.25);
      else if (e.key === "0") { self.mexeu = false; self.animarView(self.enquadrar()); }
      else feito = false;
      if (feito) { e.preventDefault(); self.mexeu = true; }
    });
  };

  // ---------------------------------------------------------------- montagem automatica
  function varrer(raiz) {
    var lista = (raiz || document).querySelectorAll ? (raiz || document).querySelectorAll(".gv-mapa[data-mapa-url]") : [];
    for (var i = 0; i < lista.length; i++) montar(lista[i]);
  }
  var agendado = false;
  var mo = new MutationObserver(function () {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () { agendado = false; varrer(document); });
  });
  function iniciar() {
    mo.observe(document.body, { childList: true, subtree: true });
    varrer(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
  window.NaiaMapaMental = { varrer: varrer };
})();
