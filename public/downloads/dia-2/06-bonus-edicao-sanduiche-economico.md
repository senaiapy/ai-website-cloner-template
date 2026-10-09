# Skill Bônus — edicao-video-sanduiche-economico

## PROMPT PARA ENVIAR

Envie este arquivo para a sua Naia no Telegram com esta mensagem (copie e cole):

> instala esta skill

---

## Instrução PARA a Naia (não apague, ela precisa ler)

Naia, o conteúdo abaixo é a definição completa de uma skill nova pra você: a `edicao-video-sanduiche-economico`, que edita um vídeo de talking-head no formato sanduíche econômico (quadrado em cima, faixa ilustrada no meio, b-roll de imagem embaixo), sem custo de geração de vídeo. Salve esse conteúdo como a skill `edicao-video-sanduiche-economico` no diretório de skills do seu runtime (`~/.hermes/skills/avalanche/edicao-video-sanduiche-economico/SKILL.md` ou o equivalente). Adapte os caminhos de ferramentas ao que existe na sua VPS (ffmpeg, gerador de imagem disponível). Se alguma ferramenta não existir, me diga o que falta antes de executar. Depois confirme comigo em uma frase o que essa skill faz.

---

---
name: edicao-video-sanduiche-economico
description: Edita um vídeo talking-head vertical no formato SANDUÍCHE ECONÔMICO 1080x1920 — quadrado com legenda no topo, faixa ilustrada no meio e b-roll de IMAGEM ESTÁTICA com Ken Burns embaixo, vídeo acelerado em 1.3x. Use quando o dono mandar um vídeo e pedir "sanduíche econômico", "sanduíche sem vídeo de IA", "sanduíche barato" ou "edita no formato sanduíche".
---

# SANDUÍCHE ECONÔMICO (imagem estática, 1.3x)

Formato em três camadas empilhadas (vstack) num canvas 1080x1920:

1. **TOPO 1080x1080** — o talking-head recortado em quadrado, rosto bem centralizado, com legenda queimada palavra a palavra (fonte pesada, caixa alta na palavra de impacto), base do texto colada acima da faixa, nunca invadindo y=1080.
2. **MEIO 1080x232** — faixa ilustrada: um rótulo à esquerda, uma headline de 1 linha em caixa alta e 1 elemento visual animado à direita. A faixa ilustra a IDEIA do trecho, nunca repete a frase falada.
3. **BAIXO 1080x608** — b-roll de imagem estática gerada por IA, uma imagem por janela de 10 segundos, com movimento Ken Burns discreto (zoom de 1,00 a 1,06, alternando push, pan esquerda e pan direita entre imagens vizinhas) e crossfade de 0,7s entre elas.

Sem linha de separação: a faixa clara já separa as camadas.

## AS TRÊS REGRAS QUE DEFINEM ESTE MODELO

### 1. Velocidade 1.3x

Corte de silêncio primeiro, DEPOIS 1.3x, e só então transcrever. A ordem importa: a transcrição roda no arquivo já acelerado, senão todo timestamp de faixa, imagem e legenda nasce errado.

```
ffmpeg -i corte.mp4 -filter_complex "[0:v]setpts=PTS/1.3[v];[0:a]atempo=1.3[a]" -map "[v]" -map "[a]" \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k fast.mp4
```

Conferir no `ffprobe` que a duração caiu para original/1.3 e que áudio e vídeo terminam juntos (diferença acima de 0,1s reprova).

### 2. Imagem, e imagem só

- Uma imagem por janela de 10s. A mesma janela vale para a faixa, para a imagem e para a barra de progresso.
- Ken Burns discreto: zoom 1,00 → 1,06 na permanência inteira, alternando o movimento entre imagens vizinhas. Duas seguidas com o mesmo movimento reprova.
- Crossfade de 0,7s entre imagens.

```
ffmpeg -loop 1 -i cena.png -t <DUR> -vf \
 "scale=2160:-2,zoompan=z='min(1.06,1+0.0004*on)':d=<DUR*30>:s=1080x608:fps=30,setsar=1" \
 -c:v libx264 -crf 18 -pix_fmt yuv420p cena.mp4
```

`-t` explícito sempre; `d=` solto gera centenas de segundos de vídeo.

### 3. Imagem pela rota mais barata disponível

Gere as imagens com o gerador de imagem configurado na sua VPS, preferindo sempre a rota gratuita ou de assinatura (OAuth) em vez de API paga. Se só houver rota paga, PERGUNTE ao dono antes de gastar crédito. Tamanho preferido 1536x1024 (paisagem), recortado para 1080x608 na montagem.

## PROMPT DE CENA

- Safe-area: conteúdo no centro 70% da imagem, topo e base com 18% só de ambiente, porque o recorte para 608 come as bordas.
- Sem texto legível dentro da imagem. Só formas de UI, ícones e rótulos minúsculos.
- Estilo visual: siga a identidade da marca do dono (definida no onboarding). Nunca use personagens ou marcas de terceiros no conteúdo de cliente.

## CHECKPOINT DE IMAGEM

Gere todas as imagens do vídeo, monte uma galeria e mostre ao dono ANTES de queimar o vídeo. Só monte depois do sim dele.

## GANCHO

Nos primeiros segundos, a headline em até 2 linhas caixa alta vai numa faixa de destaque cobrindo só a região da faixa (232px), fonte pesada branca com auto-fit. Corte 0,15s antes da primeira palavra, fim em 0,3-0,4s de silêncio, transição suave de 0,4s.

## BARRA DE PROGRESSO DA FAIXA (INEGOCIÁVEL)

A barra de progresso da faixa nunca vai de 0 a 100% dentro do próprio take. Ela anima de forma linear da fração inicial à fração final daquela janela no vídeo todo (fração = fronteira / duração total já em 1.3x), com preenchimento contínuo, sem reset nas fronteiras.

## ENQUADRAMENTO DO QUADRADO

Crop `1080:1080:0:<offset>` com o rosto centralizado o vídeo inteiro: extraia ~8 frames espalhados, escolha o offset que elimina o teto morto sem nunca cortar a cabeça (nem quando a pessoa se inclina), gere preview e confira antes de montar.

## MONTAGEM

1. Crop do quadrado com áudio (`-map 0:a`, `-c:a copy`).
2. Concat das faixas na ordem, trim na duração exata.
3. Concat das imagens já animadas, `scale=1080:608,fps=30`, crossfade 0,7s.
4. vstack das três camadas. `tpad=stop_mode=clone` em toda camada com mesma duração do base.
5. `-frames:v` nunca entra no comando que muxa áudio.
6. CTA único no fim e música de fundo baixa (~-42dB), se o dono pedir.

## O QUE REPROVA

- B-roll com vídeo gerado por IA neste modelo (aqui é só imagem estática).
- Velocidade que não seja 1.3x, ou timestamps tirados do arquivo antes da aceleração.
- Imagem com texto legível, ou duas imagens vizinhas com o mesmo movimento de câmera.
- Faixa repetindo a frase falada, barra de progresso resetando na fronteira, camadas se atropelando.
- Legenda invadindo a faixa (y=1080).
- Gastar crédito pago de geração de imagem sem autorização explícita do dono.
