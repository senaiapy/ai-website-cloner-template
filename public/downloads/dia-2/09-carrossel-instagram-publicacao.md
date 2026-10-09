# Skill 09 — carrossel-instagram-publicacao

## PROMPT PARA ENVIAR

Envie este arquivo para a sua Naia no Telegram com esta mensagem (copie e cole):

> instala esta skill

---

## Instrução PARA a Naia (não apague, ela precisa ler)

Naia, o conteúdo abaixo é a definição completa de uma skill nova pra você. Salve esse conteúdo como a skill `carrossel-instagram-publicacao`, no caminho `~/.hermes/skills/avalanche/carrossel-instagram-publicacao/SKILL.md` do seu runtime (ou o diretório de skills equivalente que o seu runtime usar). Depois confirme comigo em uma frase o que essa skill faz.

---

---
name: carrossel-instagram-publicacao
description: Ciclo completo de criação → geração → publicação → automação de carrossel Instagram da Avalanche, com MÚLTIPLOS ESTILOS visuais. Use sempre que o Chefe pedir "Naia vamos fazer um carrossel", "pesquise tal notícia e cria um carrossel", "monta carrossel sobre X e posta", ou variações. Estilo padrão (top 1) = Anime Ultra Realista com o QUINTETO Avalanche ({{DONO}} + Naia + o agente + Claudinho + Codexzinho). Outros estilos sob demanda: Post do X, Jornal, Notícia, Texto Puro HTML. Cobre as 12 etapas e a regra de modelo de imagem (gpt-image-2 padrão, nano-banana só com autorização). Validado em produção no carrossel "Claude no Instagram = 1,5M views" (post IG DYSRcGFiAFf, 2026-05-13).
---

# Carrossel Instagram Avalanche — Ciclo Completo (multi-estilo)

> Skill mestra pra fazer ponta-a-ponta um carrossel IG sem o Chefe orquestrar cada passo.
> **Esta é tarefa operacional: a Naia NÃO executa, delega pra Juliana**, que roda o ciclo e devolve pra Naia entregar pro Chefe.

---

## 🎨 ESTILOS DE CARROSSEL (LER PRIMEIRO)

A Avalanche tem vários estilos. O fluxo das 12 etapas é o MESMO pra todos — muda só o tratamento visual de cada card.

| # | Estilo | Quando usar | Como gerar |
|---|--------|-------------|------------|
| **TOP 1 (PADRÃO)** | **Anime Ultra Realista — Quinteto Avalanche** | Padrão da marca. Conteúdo educativo, autoridade, branding | `gpt-image-2`, quinteto canônico ({{DONO}} + Naia + o agente + Claudinho + Codexzinho — ver `knowledge/personagens/SQUAD-AVALANCHE-CLAUDINHO.md`) |
| 2 | **Post do X (tweet)** | Provocação, opinião, "screenshot de tweet viral", thread | Mockup de post do X/Twitter (avatar @{{DONO}}.ai, nome, texto, métricas falsas plausíveis). Pode ser HTML→imagem ou gpt-image-2 |
| 3 | **Jornal** | Notícia "impressa", autoridade editorial, manchete de jornal antigo/clássico | Layout de jornal (cabeçalho, colunas, serifada, P&B ou sépia). HTML→imagem ou gpt-image-2 |
| 4 | **Notícia (portal)** | Quebra de notícia tech, "saiu na imprensa", credibilidade | Layout de portal de notícia (logo fictício/real, headline, foto, lide). HTML→imagem ou gpt-image-2 |
| 5 | **Texto Puro (HTML)** | Densidade de informação, lista, framework, didático limpo | HTML/CSS renderizado pra imagem (tipografia forte, fundo sólido, sem personagem) |

**REGRA DE GATILHO:**
- Chefe diz **"padrão"** ou **"top 1"** → uso o **Anime Ultra Realista (quinteto)** direto, sem perguntar estilo.
- Chefe **não especifica** estilo → assumo o padrão (top 1).
- Chefe pede **"me manda os estilos que você tem"** / "quais estilos?" → respondo com a tabela acima (os 5 estilos) e espero ele escolher.
- Chefe nomeia um estilo (ex: "faz estilo jornal") → uso aquele.

> Estilos 2-5 (X, Jornal, Notícia, HTML) podem ser renderizados via HTML→imagem (Playwright screenshot de um template HTML) quando precisarem de texto pixel-perfeito, OU via gpt-image-2 quando quiser estética ilustrada. Texto Puro é SEMPRE HTML.

---

## 🖼️ REGRA DE MODELO DE IMAGEM (CRÍTICA)

**Padrão: `gpt-image-2` (OpenAI).** Sempre tento primeiro.
- Tamanho: `1024x1280` (4:5 portrait) ou `1536x1024` (paisagem/capa). Quality `high`. Output `jpeg`.
- Chave: `OPENAI_API_KEY` em `$NAIA_HOME/.env`.

**Fallback: `nano-banana-pro` (gemini-3-pro-image-preview).** NUNCA uso por conta própria.
Se o gpt-image-2 falhar, o protocolo é OBRIGATÓRIO:
1. **Aviso o Chefe** que o gpt-image-2 falhou.
2. **Explico o porquê** (erro retornado, rate limit, conteúdo recusado, etc.).
3. **Peço autorização** explícita pra usar o nano-banana como fallback.
4. Só uso o nano-banana **depois do OK** dele.

> Nunca trocar de modelo em silêncio. O Chefe decide o fallback.

---

## 🎯 QUANDO ATIVAR ESSA SKILL

Triggers:
- "Naia vamos fazer um carrossel baseado nesse aqui" + link de post
- "Naia pesquise tal notícia e cria um carrossel"
- "Monta carrossel sobre X e posta"
- "Carrossel novo sobre [tema] e ativa o comment-to-DM"
- Qualquer pedido que envolva criar + postar + automação no mesmo fluxo

---

## 📚 PRÉ-REQUISITOS (ler ANTES de começar)

Referências canônicas (consultar):
- **`knowledge/personagens/SQUAD-AVALANCHE-CLAUDINHO.md`** — CANON MESTRE do **QUINTETO** (5 personagens obrigatórios, ordem oficial {{DONO}} + Naia + o agente + Claudinho + Codexzinho), descrições exatas + ambientes + paleta + tema padrão (disputa Claudinho vs o agente). **LER ANTES de qualquer prompt.** Codexzinho ref aprovada: `knowledge/personagens/codexzinho-canon.png`.
- **`knowledge/personagens/personagens-avalanche-v2.md`** — detalhamento da Naia (sexy executiva ruiva + circuitos discretos no pescoço/braços), o agente v2 (cara de lagosta + corpo de criança + moletom hype) e {{DONO}} (negro careca barba blazer preto).
- `feedback_envio_cards_carrossel_ordem.md` — envio 1 por vez sequencial
- `feedback_propostas_sem_promessa_numerica.md` — sem prometer ROI pro leitor (case real do Chefe é OK)
- `feedback_acentuacao_producao.md` — PT-BR perfeito sempre

Skills relacionadas:

---

## 🧭 ETAPAS DO CICLO (12 etapas)

### ETAPA 1 — Captura da referência
Se for "baseado nesse aqui" + link:
1. Identificar URL: Instagram (`/p/{shortcode}/` → Instaloader baixa imagens+caption+métricas), TikTok/Reels (yt-dlp), notícia/artigo (WebFetch).
2. Baixar pra `/tmp/{nome-curto}/card-N.jpg`.
3. Ler cada card com Read (multimodal): estrutura, estilo, densidade, hook+CTA.
4. Capturar caption original + top comments.

Se for "pesquise tal notícia": WebSearch/WebFetch → resumir 3-5 pontos-chave → identificar ângulo viral.

**ENTREGÁVEL:** resumo curto no Telegram (≤300 palavras): o que é a referência, hook, o que vamos pegar, **e qual estilo** (padrão/top 1 ou outro).

---

### ETAPA 2 — Roteiro detalhado

Estrutura padrão (estilo Anime/Quinteto):
| Card | Função |
|---|---|
| 01 | Capa com **quinteto** ({{DONO}} + Naia + o agente + Claudinho + Codexzinho) + headline + hook |
| 02-N | Prompts / pilares / insights |
| Meio | **Card CASE AVALANCHE** com o quinteto (quebra de ritmo, NAIA em destaque) |
| Último | **CTA** + palavra-chave pra comment-to-DM |

Pra cada card: tag superior, título (Inter Black), texto principal denso, **descrição visual completa**, badge de numeração, assinatura `@{{DONO}}.ai · Avalanche`.

Decisões a perguntar ANTES de aprovar:
1. **Estilo** (se não foi dito): padrão/top 1 (anime quinteto) ou outro (X/jornal/notícia/HTML)?
2. **Paleta**: cyber Avalanche (navy+coral+cyan) ou editorial (creme+terracota)?
3. **Quinteto em quais cards**: só na capa ou em vários?
4. **Palavra-chave do CTA**: "CLAUDE", "EU QUERO", "ACESSO"...?
5. **Destino do botão**: imersao.{{DONO}}.ai? outro link?

**ENTREGÁVEL:** roteiro completo no Telegram + perguntas-chave. **AGUARDAR OK EXPLÍCITO** antes de gerar.

---

### ETAPA 3 — Geração das imagens

**Modelo padrão: `gpt-image-2`** (ver REGRA DE MODELO DE IMAGEM acima — nano-banana só com autorização).
Tamanho `1024x1280`, quality `high`, output `jpeg`.

Template de script (gerar em paralelo via threads):
```python
import json, base64, urllib.request, ssl, threading
API_KEY = open('$NAIA_HOME/.env').read().split('OPENAI_API_KEY=')[1].split('\n')[0].strip()
def gen_card(idx, prompt):
    payload = json.dumps({'model':'gpt-image-2','prompt':prompt,'size':'1024x1280',
        'quality':'high','output_format':'jpeg','n':1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=payload,
        headers={'Content-Type':'application/json','Authorization':f'Bearer {API_KEY}'})
    with urllib.request.urlopen(req, context=ssl.create_default_context(), timeout=600) as r:
        data = json.loads(r.read())
    open(f'/tmp/cards/{idx:02d}.jpg','wb').write(base64.b64decode(data['data'][0]['b64_json']))
threads=[threading.Thread(target=gen_card,args=(i,prompts[i])) for i in range(1,7)]
[t.start() for t in threads]; [t.join() for t in threads]
```
Disparar em background, Monitor pros logs. ~2-5 min em paralelo.
**Se gpt-image-2 falhar → seguir o protocolo de fallback (avisar + explicar + pedir OK pro nano-banana).**
**Status pro Chefe a cada 2 min** durante a geração.

**Estilos 2-5 (X/Jornal/Notícia/HTML):** quando o estilo for mockup com texto pixel-perfeito, renderizar via HTML→imagem (template HTML + Playwright screenshot 1080x1350) em vez de gpt-image-2.

---

### ETAPA 4 — Revisão visual contra checklist

Ler cada card com Read (multimodal). Para o estilo Anime/Quinteto, validar contra o **canon do squad** (`SQUAD-AVALANCHE-CLAUDINHO.md`):
- [ ] **Naia**: ruiva cobre-vermelho volumoso, pele branca-bege, **circuitos discretos cyan/dourado no pescoço e braços** (sutil, não android), blazer preto justo decote V velado, pin "N" laranja na lapela, vibe Beyoncé corporate (sexy mas NUNCA vulgar)
- [ ] **{{DONO}}**: negro, careca raspada, barba cheia com grisalhos no jaw, blazer preto slim, ombros largos
- [ ] **o agente v2**: cabeça GIGANTE de lagosta cherry-red chibi + **corpo de criança** (~6-9 anos) + **moletom hype** (hoodie+jogger preto/cinza, logo ▲, tênis sneaker), pose streetwear descolada
- [ ] **Claudinho**: cabeça-cubo laranja fosco com olhos em colchete `>‹` (sem boca), MESMA roupa streetwear (hoodie preto "A" dourado + corrente, jogger preto listra vermelha, tênis brancos chunky), proporção chibi
- [ ] **Codexzinho**: cabeça = nuvem-flor (gradiente lavanda-roxo→azul) com rosto de terminal branco `>_`, MESMA roupa streetwear, proporção chibi, NUNCA monstro
- [ ] **Os 5 personagens presentes** na(s) cena(s) que pedem o squad (capa + cards-herói)
- [ ] Acentuação PT-BR **pixel-perfeita**
- [ ] Densidade de texto adequada, paleta consistente, badge de numeração, assinatura
- [ ] Sem watermark, sem emoji, sem promessa numérica pro leitor

Card que falhar → regenerar APENAS aquele com prompt ajustado.

---

### ETAPA 5 — Overlay manual de logos oficiais (quando precisar)
gpt-image-2 não faz logo pixel-perfect. Gerar versão SEM o logo (espaço reservado), baixar SVG/PNG oficial, compor via Pillow (paste com posição calculada). Logo Claude.ai em `/tmp/claude-logo-official.png`.

---

### ETAPA 6 — Envio sequencial pra aprovação
**1 card por vez**, ordem 01→N, esperar `ok:true`, sleep 1s. NUNCA paralelo, NUNCA sendMediaGroup.
```bash
TOKEN=$(grep "TELEGRAM_BOT_TOKEN" <BOT_DIR>/.env | cut -d= -f2)
curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendPhoto" \
  -F "chat_id={{DONO_TELEGRAM_ID}}" -F "photo=@/tmp/cards/01.jpg" \
  -F "caption=*01/06* — descrição curta" -F "parse_mode=Markdown"
```
No último, perguntar: "Aprova o carrossel inteiro? Sigo pra legenda + publicação?" **Aguardar OK explícito.**

---

### ETAPA 7 — Legenda do post
1ª pessoa ({{DONO}}), hook forte na 1ª linha, **sem promessa numérica pro leitor** (case do Chefe = OK), sem palavras de coach, 4-5 bullets (✦), CTA literal com a palavra-chave, 10-12 hashtags balanceadas, acentuação perfeita. Mandar pro Chefe e aguardar OK.

---

### ETAPA 8 — Upload em URL pública
⚠️ NÃO usar Litterbox/Catbox/Imgur (Meta scraper bloqueia).
✅ USAR repo `<GITHUB_USER>/imersao-claude-openclaw` (branch master), pasta `cards-carrossel-{nome}/` → Cloudflare Pages serve em `https://imersao.{{DONO}}.ai/cards-carrossel-{nome}/01.jpg`.
```bash
GITHUB_TOKEN=$(grep "^GITHUB_TOKEN" $NAIA_HOME/.env | cut -d= -f2 | tr -d '\n')
git clone "https://<GITHUB_USER>:${GITHUB_TOKEN}@github.com/<GITHUB_USER>/imersao-claude-openclaw" /tmp/imersao-clone
cd /tmp/imersao-clone && mkdir -p cards-carrossel-{nome} && cp /tmp/cards/*.jpg cards-carrossel-{nome}/
git config user.email "<EMAIL_DONO>"; git config user.name "{{DONO_NOME}}"
git add . && git commit -m "feat: carrossel {nome}" && git push origin master
```
⚠️ Email do autor TEM que ser `<EMAIL_DONO>`. Esperar CF Pages (~30-60s), validar com Monitor (`until curl ...200`). Se Meta rejeitar formato: recompress via Pillow `quality=92, optimize=True` + `?v=$(date +%s)` na URL.

---

### ETAPA 9 — Publicação via Meta Graph API
⚠️ Usar `graph.instagram.com` (NÃO facebook). Token IG `IGAAU...` (Instagram Login). Token encriptado no banco:
```python
import psycopg2
ENC_KEY = open('$NAIA_HOME/.env').read().split('META_ENCRYPTION_KEY=')[1].split('\n')[0].strip()
conn = psycopg2.connect(host='127.0.0.1', user='n8n', password='<senha em $NAIA_HOME/.env>', dbname='naia_memory')
cur = conn.cursor()
cur.execute("SELECT pgp_sym_decrypt(access_token_enc::bytea, %s) FROM meta_business_connections WHERE id=1", (ENC_KEY,))
TOKEN = cur.fetchone()[0]  # id=1 = {{DONO}}.ai
```
Fluxo (graph.instagram.com/v23.0): 1) criar N containers `is_carousel_item=true` → 2) esperar cada `status_code=FINISHED` → 3) criar container `media_type=CAROUSEL` com `children` + `caption` → 4) `media_publish` com `creation_id`. Salvar `media_id` + pegar `permalink`.

---


---

### ETAPA 11 — Validar disparo

---


---

## 🧰 GOTCHAS (não repetir)
1. **Token IG ≠ Facebook** — `IGAAU...` roda em `graph.instagram.com`. Sintoma: "Cannot parse access token".
2. **Litterbox/Catbox** bloqueiam scraper Meta. Sintoma: erro 9004. Solução: CF Pages via repo imersao.
3. **Cache CDN CF Pages** serve versão antiga. Solução: `?v=$(date +%s)`.
4. **gpt-image-2 às vezes gera JPEG que Meta rejeita** (erro 36001). Solução: recompress Pillow `quality=92, optimize=True`.
5. **Logo via prompt nunca é pixel-perfect** — overlay PNG via Pillow.
6. **Private Reply ≠ DM padrão** — botão anexado JUNTO no payload da Private Reply, nunca em 2ª chamada.
7. **Envio sequencial OBRIGATÓRIO** — 1 por vez, sleep 1s, esperar ok=True.
8. **Troca de modelo de imagem NUNCA em silêncio** — gpt-image-2 falhou? Avisa, explica, pede OK pro nano-banana.

---

## ✅ CRITÉRIOS DE "ENTREGUE"
- [ ] Estilo definido (padrão/top 1 ou outro escolhido pelo Chefe)
- [ ] Roteiro aprovado
- [ ] Cards gerados e enviados em ordem, todos aprovados
- [ ] Legenda aprovada
- [ ] Post publicado (`media_id` salvo)
- [ ] Automação criada (`automation_id`, enabled=true)
- [ ] 1º disparo real com `private_reply_with_buttons: ok=True`
- [ ] Confirmado pro Chefe com permalink + automation_id + log

## 🚨 ESCALAR PRO CHEFE QUANDO
- Referência não encontrável (link quebrado/post deletado)
- gpt-image-2 falhar (pedir OK pro fallback)
- Meta retornar erro persistente
- Banco/Postgres não responder

