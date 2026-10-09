/* Instalador Hermes da Imersao dentro da apostila (secao "Gravação Imersão").
   Copia do wizard da pagina da imersao (standalone-wizard.v20260926d.js). Diferencas: roda como funcao
   de montagem chamada pelo app.js quando a aula abre; a rede passa pelo proxy autenticado da API da
   apostila (/api/imersao/hermes/*, cookie de sessao), porque a API Hermes so libera CORS pra imersao;
   idioma fixo em portugues (padrao da imersao sem o seletor); Plano B sempre liberado. */

window.mountHermesWizard = function () {
  "use strict";

  var API_HW = (typeof API_BASE !== "undefined" ? API_BASE : "https://api-apostila.denderson.ai") + "/api/imersao/hermes";
  if (window.__hwStop) { window.__hwStop(); }
  var LS_KEY = "hw_install_id";
  var LS_ACCESS = "hw_install_access";
  var LS_IDEM = "hw_install_idempotency";
  var LS_LEAD = "hw_lead_ok";
  var POLL_MS = 3000;

  var LABELS = [
    { key: "conectar", label: "Conectando na sua VPS" },
    { key: "preparar", label: "Preparando o servidor" },
    { key: "hermes", label: "Instalando o Hermes" },
    { key: "telegram", label: "Configurando o Telegram" },
    { key: "oauth", label: "Autenticação com sua conta ChatGPT" },
    { key: "gateway", label: "Ligando seu agente" },
    { key: "verificar", label: "Verificação final" }
  ];

  // ---------- idiomas (pt/en/es), mesma regra do seletor da página: ?lang= ou idioma do navegador ----------
  // Na página da imersão o idioma vem do seletor "reception-language" (e troca ao vivo).
  var REC_SEL = document.getElementById("reception-language");
  function normLang(v) { v = String(v || "").toLowerCase().slice(0, 2); return (v === "en" || v === "es") ? v : "pt"; }
  var LANG = "pt";
  window.HW_LANG = LANG;
  var TX = {
    pt: {
      title: "Instale o seu Agente Hermes", kicker: "Acesso exclusivo",
      gate1: "<strong>Você está a um passo de ter um funcionário que não dorme.</strong> Este instalador monta o seu Agente Hermes sozinho, direto na sua VPS, sem você digitar um único comando: em 20 a 30 minutos ele está no seu Telegram, pronto pra trabalhar.",
      gate2: "Preencha o cadastro abaixo pra liberar o instalador agora. É rápido, e é por aqui que a gente te avisa das novidades do seu agente.",
      lbNome: "Seu nome", phNome: "Como você quer ser chamado", lbEmail: "Seu melhor e-mail", phEmail: "voce@email.com",
      lbFone: "Seu WhatsApp", phFone: "(11) 99999-9999", gateBtn: "Liberar o instalador agora", gateBusy: "Liberando...",
      errNome: "Informe o seu nome.", errEmail: "E-mail inválido. Confira e tente de novo.", errFone: "Telefone inválido. Use DDD + número.",
      errLeadSave: "Não consegui salvar o cadastro. Tente de novo.", errNet: "Sem conexão com o servidor do instalador, tente em instantes",
      formLead: "Preencha os quatro campos abaixo. O instalador conecta na sua VPS, sobe o Hermes e liga o seu bot no Telegram.",
      lbIp: "IP da sua VPS", lbPass: "Senha do root da VPS", phPass: "a senha que o provedor te mandou",
      eyeShow: "Mostrar senha", eyeHide: "Esconder senha", lbToken: "Token do bot do Telegram", lbTgid: "Seu ID do Telegram",
      privacy: "Suas credenciais são usadas só durante a instalação e não ficam salvas.",
      goBtn: "Instalar meu Hermes agora", goBusy: "Verificando os seus dados...",
      errIp: "IP da VPS inválido. Use o formato 187.0.0.0.", errPass: "Informe a senha do root da VPS.",
      errToken: "Token do bot com formato inválido. Ele parece com 123456789:AA... e vem do @BotFather.",
      errTgid: "Seu ID do Telegram deve ter somente números.",
      progLead: "Estamos montando o seu agente. Deixe esta página aberta, isso leva alguns minutos.",
      queued: "Sua instalação entrou na fila", queuePos: "posição", queuedTail: "Esta página pode ser fechada e aberta de novo.",
      oauthTag: "Falta você autorizar", oauth1: "1. Clique no botão e entre com a SUA conta do ChatGPT/OpenAI",
      oauthBtn: "Abrir a autorização da OpenAI", oauth2: "2. Digite este código:", copy: "Copiar", copied: "Copiado", copyHand: "Copie na mão",
      waiting: "Esperando você autorizar...", doneTag: "Instalação concluída", doneTitle: "Seu Hermes está no ar",
      doneLead: "O agente já está rodando na sua VPS e responde só para você. Manda a primeira mensagem no Telegram.",
      doneBtn: "Abrir meu agente no Telegram", errLead: "A instalação parou no meio do caminho.", retry: "Tentar de novo",
      st: { conectar: "Conectando na sua VPS", preparar: "Preparando o servidor", hermes: "Instalando o Hermes", telegram: "Configurando o Telegram",
            oauth: "Autenticação com sua conta ChatGPT", gateway: "Ligando seu agente", verificar: "Verificação final" }
    },
    en: {
      title: "Install your Hermes Agent", kicker: "Exclusive access",
      gate1: "<strong>You are one step away from an employee who never sleeps.</strong> This installer sets up your Hermes Agent on its own, right on your VPS, without you typing a single command: in 20 to 30 minutes it is on your Telegram, ready to work.",
      gate2: "Fill in the form below to unlock the installer now. It is quick, and it is how we let you know about news for your agent.",
      lbNome: "Your name", phNome: "What should we call you", lbEmail: "Your best email", phEmail: "you@email.com",
      lbFone: "Your WhatsApp", phFone: "+1 555 123 4567", gateBtn: "Unlock the installer now", gateBusy: "Unlocking...",
      errNome: "Enter your name.", errEmail: "Invalid email. Check it and try again.", errFone: "Invalid phone. Use area code + number.",
      errLeadSave: "I could not save your details. Try again.", errNet: "No connection to the installer server, try again in a moment",
      formLead: "Fill in the four fields below. The installer connects to your VPS, sets up Hermes and turns on your Telegram bot.",
      lbIp: "Your VPS IP", lbPass: "VPS root password", phPass: "the password your provider sent you",
      eyeShow: "Show password", eyeHide: "Hide password", lbToken: "Telegram bot token", lbTgid: "Your Telegram ID",
      privacy: "Your credentials are used only during the installation and are not stored.",
      goBtn: "Install my Hermes now", goBusy: "Checking your details...",
      errIp: "Invalid VPS IP. Use the format 187.0.0.0.", errPass: "Enter the VPS root password.",
      errToken: "Bot token has an invalid format. It looks like 123456789:AA... and comes from @BotFather.",
      errTgid: "Your Telegram ID must contain only numbers.",
      progLead: "We are setting up your agent. Keep this page open, it takes a few minutes.",
      queued: "Your installation is in the queue", queuePos: "position", queuedTail: "You can close this page and open it again.",
      oauthTag: "Your authorization is needed", oauth1: "1. Click the button and sign in with YOUR ChatGPT/OpenAI account",
      oauthBtn: "Open the OpenAI authorization", oauth2: "2. Enter this code:", copy: "Copy", copied: "Copied", copyHand: "Copy it by hand",
      waiting: "Waiting for your authorization...", doneTag: "Installation complete", doneTitle: "Your Hermes is live",
      doneLead: "The agent is already running on your VPS and answers only you. Send it your first message on Telegram.",
      doneBtn: "Open my agent on Telegram", errLead: "The installation stopped halfway.", retry: "Try again",
      st: { conectar: "Connecting to your VPS", preparar: "Preparing the server", hermes: "Installing Hermes", telegram: "Setting up Telegram",
            oauth: "Signing in with your ChatGPT account", gateway: "Starting your agent", verificar: "Final check" }
    },
    es: {
      title: "Instala tu Agente Hermes", kicker: "Acceso exclusivo",
      gate1: "<strong>Estás a un paso de tener un empleado que no duerme.</strong> Este instalador monta tu Agente Hermes solo, directo en tu VPS, sin que escribas un solo comando: en 20 a 30 minutos está en tu Telegram, listo para trabajar.",
      gate2: "Completa el registro de abajo para liberar el instalador ahora. Es rápido, y es por aquí que te avisamos de las novedades de tu agente.",
      lbNome: "Tu nombre", phNome: "Cómo quieres que te llamemos", lbEmail: "Tu mejor correo", phEmail: "tu@email.com",
      lbFone: "Tu WhatsApp", phFone: "+34 600 123 456", gateBtn: "Liberar el instalador ahora", gateBusy: "Liberando...",
      errNome: "Escribe tu nombre.", errEmail: "Correo inválido. Revísalo e inténtalo de nuevo.", errFone: "Teléfono inválido. Usa código de área + número.",
      errLeadSave: "No pude guardar el registro. Inténtalo de nuevo.", errNet: "Sin conexión con el servidor del instalador, inténtalo en unos instantes",
      formLead: "Completa los cuatro campos de abajo. El instalador se conecta a tu VPS, sube Hermes y enciende tu bot de Telegram.",
      lbIp: "IP de tu VPS", lbPass: "Contraseña root de la VPS", phPass: "la contraseña que te envió el proveedor",
      eyeShow: "Mostrar contraseña", eyeHide: "Ocultar contraseña", lbToken: "Token del bot de Telegram", lbTgid: "Tu ID de Telegram",
      privacy: "Tus credenciales se usan solo durante la instalación y no se guardan.",
      goBtn: "Instalar mi Hermes ahora", goBusy: "Verificando tus datos...",
      errIp: "IP de la VPS inválida. Usa el formato 187.0.0.0.", errPass: "Escribe la contraseña root de la VPS.",
      errToken: "Token del bot con formato inválido. Se parece a 123456789:AA... y viene de @BotFather.",
      errTgid: "Tu ID de Telegram debe tener solo números.",
      progLead: "Estamos montando tu agente. Deja esta página abierta, tarda unos minutos.",
      queued: "Tu instalación entró en la fila", queuePos: "posición", queuedTail: "Puedes cerrar esta página y abrirla de nuevo.",
      oauthTag: "Falta tu autorización", oauth1: "1. Haz clic en el botón y entra con TU cuenta de ChatGPT/OpenAI",
      oauthBtn: "Abrir la autorización de OpenAI", oauth2: "2. Escribe este código:", copy: "Copiar", copied: "Copiado", copyHand: "Cópialo a mano",
      waiting: "Esperando tu autorización...", doneTag: "Instalación completada", doneTitle: "Tu Hermes está en línea",
      doneLead: "El agente ya está funcionando en tu VPS y responde solo a ti. Envíale el primer mensaje en Telegram.",
      doneBtn: "Abrir mi agente en Telegram", errLead: "La instalación se detuvo a mitad de camino.", retry: "Intentar de nuevo",
      st: { conectar: "Conectando a tu VPS", preparar: "Preparando el servidor", hermes: "Instalando Hermes", telegram: "Configurando Telegram",
            oauth: "Autenticación con tu cuenta de ChatGPT", gateway: "Encendiendo tu agente", verificar: "Verificación final" }
    }
  };
  var T = TX[LANG];
  function applyI18n() {
    if (!REC_SEL) { document.documentElement.setAttribute("lang", LANG === "pt" ? "pt-BR" : LANG); }
    var root = document.querySelector(".hw-root");
    if (!root) { return; }
    root.querySelectorAll("[data-i18n]").forEach(function (el) { var k = el.getAttribute("data-i18n"); if (T[k]) { el.textContent = T[k]; } });
    root.querySelectorAll("[data-i18n-html]").forEach(function (el) { var k = el.getAttribute("data-i18n-html"); if (T[k]) { el.innerHTML = T[k]; } });
    root.querySelectorAll("[data-i18n-ph]").forEach(function (el) { var k = el.getAttribute("data-i18n-ph"); if (T[k]) { el.setAttribute("placeholder", T[k]); } });
    root.querySelectorAll("[data-i18n-aria]").forEach(function (el) { var k = el.getAttribute("data-i18n-aria"); if (T[k]) { el.setAttribute("aria-label", T[k]); } });
  }

  var RE_IP = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  var RE_TGID = /^\d{1,15}$/;
  var RE_TOKEN = /^\d+:[A-Za-z0-9_-]{30,}$/;

  // Qualquer erro da instalação (API, rede, capacidade, falha de etapa) mostra a mensagem única
  // do Plano B no idioma da página. O erro técnico real fica registrado no servidor.
  var FAIL_MSG = {
    pt: "CAPACIDADE EXCEDIDA DEVIDO A MUITOS ACESSOS SIMULTÂNEOS. TENTE DE NOVO EM 10 MINUTOS OU BAIXE O PACOTE QUE ESTÁ NO RODAPÉ DESTE SITE E ENTREGUE PARA O CLAUDE OU CODEX NO APLICATIVO DO SEU DESKTOP.",
    en: "CAPACITY EXCEEDED DUE TO TOO MANY SIMULTANEOUS ACCESSES. TRY AGAIN IN 10 MINUTES OR DOWNLOAD THE PACKAGE IN THE FOOTER OF THIS SITE AND HAND IT TO CLAUDE OR CODEX IN YOUR DESKTOP APP.",
    es: "CAPACIDAD EXCEDIDA DEBIDO A MUCHOS ACCESOS SIMULTÁNEOS. INTÉNTALO DE NUEVO EN 10 MINUTOS O DESCARGA EL PAQUETE QUE ESTÁ EN EL PIE DE ESTE SITIO Y ENTRÉGASELO A CLAUDE O CODEX EN LA APLICACIÓN DE TU ESCRITORIO."
  };
  var FAIL_LINK = { pt: "Baixar o pacote do Plano B", en: "Download the Plan B package", es: "Descargar el paquete del Plan B" };
  function lang() { return LANG; }
  function failInto(el) {
    var l = lang();
    el.textContent = "";
    el.removeAttribute("data-fail");
    var p = document.createElement("strong");
    p.textContent = FAIL_MSG[l];
    el.appendChild(p);
    var link = window.HW_PLANOB && window.HW_PLANOB.url();
    if (link) {
      var a = document.createElement("a");
      a.href = link; a.className = "hw-planob-link"; a.setAttribute("download", "hermes-instalacao-plano-b.zip");
      a.textContent = FAIL_LINK[l];
      el.appendChild(document.createElement("br")); el.appendChild(a);
    }
    el.setAttribute("data-fail", "1");
    el.classList.add("hw-on");
  }

  function q(id) { return document.getElementById(id); }
  window.HW_PLANOB = {
    unlock: function () {},
    url: function () { var a = document.getElementById("plano-b-area"); return a ? a.getAttribute("data-planob-open") : null; }
  };

  var elScreens = {
    gate: q("hw-screen-gate"),
    form: q("hw-screen-form"),
    progress: q("hw-screen-progress"),
    done: q("hw-screen-done"),
    error: q("hw-screen-error")
  };
  var elIp = q("hw-ip");
  var elPass = q("hw-pass");
  var elToken = q("hw-token");
  var elTgid = q("hw-tgid");
  var elFormAlert = q("hw-form-alert");
  var elGo = q("hw-go");
  var elGoLabel = q("hw-go-label");
  var elSteps = q("hw-steps");
  var elProgAlert = q("hw-prog-alert");
  var elOauth = q("hw-oauth");
  var elOauthLink = q("hw-oauth-link");
  var elCodeBlock = q("hw-code-block");
  var elCode = q("hw-code");
  var elCodeCopy = q("hw-code-copy");
  var elBotLink = q("hw-bot-link");
  var elErrorMsg = q("hw-error-msg");
  var elRetry = q("hw-retry");
  var elEye = q("hw-eye");
  var elEyeOpen = q("hw-eye-open");
  var elEyeOff = q("hw-eye-off");

  var pollTimer = null;
  var lastStages = null;
  var currentId = null;
  var currentAccess = null;

  // ---------- storage ----------
  function lsGet() {
    try { return window.localStorage.getItem(LS_KEY); } catch (e) { return null; }
  }
  function lsSet(v) {
    try { window.localStorage.setItem(LS_KEY, v); } catch (e) { /* ignora */ }
  }
  function lsClear() {
    try { window.localStorage.removeItem(LS_KEY); window.localStorage.removeItem(LS_ACCESS); } catch (e) { /* ignora */ }
  }
  function idemGet() {
    try {
      var value = window.localStorage.getItem(LS_IDEM);
      if (!value) { value = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2); window.localStorage.setItem(LS_IDEM, value); }
      return value;
    } catch (e) { return String(Date.now()) + Math.random().toString(36).slice(2); }
  }
  function accessSet(value) { try { window.localStorage.setItem(LS_ACCESS, value); } catch (e) { /* ignora */ } }
  function accessGet() { try { return window.localStorage.getItem(LS_ACCESS); } catch (e) { return null; } }

  // ---------- telas ----------
  function show(name) {
    Object.keys(elScreens).forEach(function (k) {
      elScreens[k].classList.toggle("hw-on", k === name);
    });
  }

  function formError(msg) {
    elFormAlert.removeAttribute("data-fail");
    elFormAlert.textContent = msg || "";
    elFormAlert.classList.toggle("hw-on", !!msg);
  }
  function formFail() { failInto(elFormAlert); }
  function planob(u) { if (u && window.HW_PLANOB) { window.HW_PLANOB.unlock(u); } }
  function clearInvalid(el) {
    (el ? [el] : [elIp, elPass, elToken, elTgid]).forEach(function (f) {
      f.classList.remove("hw-invalid"); f.removeAttribute("aria-invalid");
    });
  }

  function progError(msg) {
    elProgAlert.removeAttribute("data-fail");
    elProgAlert.textContent = msg || "";
    elProgAlert.classList.toggle("hw-on", !!msg);
  }
  function progFail() { failInto(elProgAlert); }

  function setBusy(busy) {
    elGo.disabled = !!busy;
    elGoLabel.textContent = busy ? T.goBusy : T.goBtn;
  }

  // ---------- icones ----------
  var SVG_CHECK = '<svg class="hw-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"></path></svg>';
  var SVG_X = '<svg class="hw-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>';

  function markFor(state) {
    if (state === "done") { return SVG_CHECK; }
    if (state === "error") { return SVG_X; }
    if (state === "running") { return '<span class="hw-spin"></span>'; }
    return '<span class="hw-circle"></span>';
  }

  function renderSteps(stages) {
    var list = (stages && stages.length) ? stages : LABELS.map(function (s) {
      return { key: s.key, state: "pending" };
    });
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var st = list[i];
      var state = st.state || "pending";
      html += '<li data-key="' + esc(st.key) + '" data-state="' + esc(state) + '">' +
        '<span class="hw-mark">' + markFor(state) + "</span>" +
        '<span class="hw-label">' + esc((T.st[st.key]) || st.label || "") + "</span></li>";
    }
    elSteps.innerHTML = html;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------- validacao ----------
  function validate() {
    var ip = (elIp.value || "").trim();
    var pass = elPass.value || "";
    var token = (elToken.value || "").trim();
    var tgid = (elTgid.value || "").trim();

    if (!RE_IP.test(ip)) { return { err: T.errIp, field: elIp }; }
    if (!pass) { return { err: T.errPass, field: elPass }; }
    if (!RE_TOKEN.test(token)) {
      return { err: T.errToken, field: elToken };
    }
    if (!RE_TGID.test(tgid)) { return { err: T.errTgid, field: elTgid }; }

    return { data: { ip: ip, root_password: pass, bot_token: token, telegram_id: tgid, idempotency_key: idemGet() } };
  }

  // ---------- rede ----------
  function postInstall(payload) {
    return fetch(API_HW + "/install", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        return { ok: r.ok, status: r.status, body: body };
      });
    });
  }

  function getInstall(id) {
    return fetch(API_HW + "/install/" + encodeURIComponent(id) + "/status", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: currentAccess })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        return { ok: r.ok, status: r.status, body: body };
      });
    });
  }

  // ---------- fluxo ----------
  function start() {
    formError("");
    clearInvalid();
    var v = validate();
    if (v.err) {
      formError(v.err);
      if (v.field) { v.field.classList.add("hw-invalid"); v.field.setAttribute("aria-invalid", "true"); v.field.focus(); }
      return;
    }

    setBusy(true);
    postInstall(v.data).then(function (res) {
      setBusy(false);
      planob(res.body && res.body.plano_b_url);
      if (!res.ok) {
        // 422 sem error_code = validação de campo (continua específica); o resto vira a mensagem do Plano B
        if (res.status === 422 && res.body && res.body.error && !res.body.error_code) { formError(res.body.error); }
        else { formFail(); }
        return;
      }
      var id = res.body && res.body.id;
      if (!id) { formFail(); return; }
      currentId = id;
      currentAccess = res.body.access_token;
      if (!currentAccess) { formFail(); return; }
      lsSet(id);
      accessSet(currentAccess);
      renderSteps(null);
      show("progress");
      poll();
    }).catch(function () {
      setBusy(false);
      formFail();
    });
  }

  function stopPoll() {
    if (pollTimer) { window.clearTimeout(pollTimer); pollTimer = null; }
  }

  window.__hwStop = function () { stopPoll(); currentId = null; };

  function schedule() {
    stopPoll();
    pollTimer = window.setTimeout(poll, POLL_MS);
  }

  function poll() {
    if (!currentId) { return; }
    if (!document.body.contains(elSteps)) { stopPoll(); return; }
    getInstall(currentId).then(function (res) {
      if (res.status === 404) {
        lsClear();
        currentId = null;
        stopPoll();
        show("form");
        return;
      }
      if (!res.ok) { progFail(); schedule(); return; }
      progError("");

      var d = res.body || {};
      planob(d.plano_b_url);
      lastStages = d.stages;
      renderSteps(d.stages);
      if (d.status === "queued") { progError(T.queued + (d.queue_position ? " · " + T.queuePos + " " + d.queue_position : "") + ". " + T.queuedTail); }

      if (d.status === "awaiting_oauth" && d.oauth && d.oauth.url) {
        elOauthLink.setAttribute("href", d.oauth.url);
        if (d.oauth.user_code) {
          elCode.textContent = d.oauth.user_code;
          elCodeBlock.classList.remove("hw-hide");
        } else {
          elCodeBlock.classList.add("hw-hide");
        }
        elOauth.classList.add("hw-on");
      } else {
        elOauth.classList.remove("hw-on");
      }

      if (d.status === "done") {
        stopPoll();
        lsClear();
        try { window.localStorage.removeItem(LS_IDEM); } catch (e) { /* ignora */ }
        if (d.bot_link) { elBotLink.setAttribute("href", d.bot_link); }
        show("done");
        return;
      }

      if (d.status === "error") {
        stopPoll();
        lsClear();
        try { window.localStorage.removeItem(LS_IDEM); } catch (e) { /* ignora */ }
        failInto(elErrorMsg);
        show("error");
        return;
      }

      show("progress");
      schedule();
    }).catch(function () {
      // sem rede: avisa na tela de progresso e segue tentando
      progFail();
      schedule();
    });
  }

  function resume() {
    var id = lsGet();
    var access = accessGet();
    if (!id || !access) { if (id) { lsClear(); } return; }
    currentId = id;
    currentAccess = access;
    renderSteps(null);
    show("progress");
    poll();
  }

  // ---------- eventos ----------
  elGo.addEventListener("click", start);

  [elIp, elPass, elToken, elTgid].forEach(function (el) {
    el.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); start(); }
    });
    el.addEventListener("input", function () { formError(""); clearInvalid(el); });
  });

  elEye.addEventListener("click", function () {
    var showing = elPass.getAttribute("type") === "text";
    elPass.setAttribute("type", showing ? "password" : "text");
    elEyeOpen.classList.toggle("hw-hide", !showing);
    elEyeOff.classList.toggle("hw-hide", showing);
    elEye.setAttribute("aria-label", showing ? T.eyeShow : T.eyeHide);
  });

  elCodeCopy.addEventListener("click", function () {
    var code = elCode.textContent || "";
    if (!code) { return; }
    var done = function () {
      elCodeCopy.textContent = T.copied;
      window.setTimeout(function () { elCodeCopy.textContent = T.copy; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done, function () {
        elCodeCopy.textContent = T.copyHand;
      });
    } else {
      elCodeCopy.textContent = T.copyHand;
    }
  });

  elRetry.addEventListener("click", function () {
    stopPoll();
    currentId = null;
    lsClear();
    elOauth.classList.remove("hw-on");
    formError("");
    progError("");
    setBusy(false);
    show("form");
    elIp.focus();
  });

  // ---------- cadastro (gate) ----------
  var elLeadNome = q("hw-lead-nome");
  var elLeadEmail = q("hw-lead-email");
  var elLeadFone = q("hw-lead-fone");
  var elGateAlert = q("hw-gate-alert");
  var elGateGo = q("hw-gate-go");
  var elGateLabel = q("hw-gate-label");

  function leadOk() {
    try { return window.localStorage.getItem(LS_LEAD) === "1"; } catch (e) { return false; }
  }
  function leadSet() {
    try { window.localStorage.setItem(LS_LEAD, "1"); } catch (e) { /* ignora */ }
  }
  function gateError(msg) {
    elGateAlert.textContent = msg || "";
    elGateAlert.classList.toggle("hw-on", !!msg);
  }

  elGateGo.addEventListener("click", function () {
    gateError("");
    var nome = (elLeadNome.value || "").trim();
    var email = (elLeadEmail.value || "").trim();
    var fone = (elLeadFone.value || "").replace(/\D/g, "");
    if (nome.length < 2) { gateError(T.errNome); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) { gateError(T.errEmail); return; }
    if (fone.length < 8) { gateError(T.errFone); return; }
    elGateGo.disabled = true;
    elGateLabel.textContent = T.gateBusy;
    fetch(API_HW + "/lead", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome, email: email, telefone: fone })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        elGateGo.disabled = false;
        elGateLabel.textContent = T.gateBtn;
        if (!r.ok) { gateError((body && body.error) || T.errLeadSave); return; }
        leadSet();
        show("form");
      });
    }).catch(function () {
      elGateGo.disabled = false;
      elGateLabel.textContent = T.gateBtn;
      gateError(T.errNet);
    });
  });

  [elLeadNome, elLeadEmail, elLeadFone].forEach(function (el) {
    el.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); elGateGo.click(); }
    });
    el.addEventListener("input", function () { gateError(""); });
  });

  // ---------- troca de idioma ao vivo (seletor da página da imersão) ----------
  if (REC_SEL) {
    REC_SEL.addEventListener("change", function (e) {
      LANG = normLang(e.target.value); T = TX[LANG]; window.HW_LANG = LANG;
      applyI18n();
      if (!elGo.disabled) { setBusy(false); }
      renderSteps(lastStages);
      [elFormAlert, elProgAlert, elErrorMsg].forEach(function (el) { if (el.getAttribute("data-fail") === "1") { failInto(el); } });
      if (elFormAlert.classList.contains("hw-on") && elFormAlert.getAttribute("data-fail") !== "1") { formError(""); clearInvalid(); }
    });
  }

  // ---------- boot ----------
  applyI18n();
  renderSteps(null);
  // apostila: o aluno ja esta logado, entao o instalador abre direto, sem cadastro de nome/e-mail/WhatsApp
  show("form");
  resume();
};

/* botao "Copiar cupom" do menu Servidor do Agente (na imersao era onclick="copyCoupon(this)"; aqui por
   delegacao, porque a CSP da apostila nao executa handler inline) */
document.addEventListener("click", function (ev) {
  var btn = ev.target && ev.target.closest ? ev.target.closest(".imersao-root .copy-btn[data-copy]") : null;
  if (!btn || !navigator.clipboard) return;
  navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function () {
    var old = btn.textContent;
    btn.textContent = "Copiado ✓";
    setTimeout(function () { btn.textContent = old; }, 1800);
  });
});
