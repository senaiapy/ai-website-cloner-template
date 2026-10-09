# Subagente 05 — Conectar o clone no Instagram Direct (via Zernio)

## PROMPT PARA ENVIAR

Envie este arquivo para a sua Naia no Telegram com esta mensagem (copie e cole):

> lê este documento e me guia pra conectar meu Instagram

---

## Instrução PARA a Naia (não apague, ela precisa ler)

Naia, este documento te ensina a conectar o clone do dono (o subagente de atendimento) no Instagram Direct dele, usando o **Zernio** (https://zernio.com), uma API REST unificada de redes sociais e mensageria que cobre 15 plataformas (Instagram, WhatsApp, TikTok e mais) e tem plano grátis que cobre até 2 contas conectadas.

Conduza o dono passo a passo, em PT-BR, UMA etapa por vez, esperando ele confirmar cada uma antes de avançar. O fluxo é este:

### Etapa 1 — Conta no Zernio

Peça pro dono criar a conta dele em https://zernio.com. O plano grátis cobre até 2 contas conectadas, o que é suficiente pra começar. Não peça cartão, não peça plano pago.

### Etapa 2 — Conectar o Instagram

Peça pro dono conectar a conta do Instagram dele no painel do Zernio (a conexão é via OAuth hospedado pelo próprio Zernio, não precisa criar app de desenvolvedor na Meta). Ele confirma quando a conta aparecer como conectada no painel.

### Etapa 3 — API key

Peça pro dono gerar uma API key no painel do Zernio e te mandar a chave aqui no Telegram. Quando receber:

- Guarde a chave no seu `.env` (ex.: `ZERNIO_API_KEY=...`), com permissão 600, NUNCA em arquivo de memória, nunca repetida no chat. Depois de salvar, apague a mensagem com a chave se a plataforma permitir, e confirme só com "chave guardada com segurança".

### Etapa 4 — Configurar o clone nos directs

Leia a documentação oficial do Zernio em https://zernio.com/docs NA HORA e descubra os endpoints exatos de mensageria do Instagram (listar conversas, ler mensagens, responder). NÃO invente endpoints: consulte a doc oficial e use exatamente o que estiver lá. Com os endpoints confirmados:

- Configure o clone (o subagente `clone-do-dono` que você já criou) pra ler os directs novos do Instagram e responder seguindo o treinamento dele.
- Se o Zernio oferecer webhook pra novas mensagens, prefira webhook a polling. Configure o endpoint de recepção no seu servidor.
- Toda resposta que SAI pelo Instagram é ação externa: siga as regras de segurança. No começo, opere em modo assistido (você mostra o rascunho pro dono aprovar) até ele liberar o modo autônomo explicitamente.

### Etapa 5 — Regra de CRM

Todo lead que chegar pelo Instagram PRECISA ser registrado. Pergunte ao dono qual CRM ele usa e se ele tem API ou webhook disponível:

- Se ele tiver CRM com API, configure o registro automático de cada lead novo (nome, perfil, estágio da conversa, classificação).
- Se ele NÃO tiver CRM, registre os leads num arquivo ou banco local seu (pipeline de vendas na sua memória/workspace) até o CRM existir, e deixe claro pro dono onde esse registro mora.

### Etapa 6 — Teste final

Peça pro dono mandar um direct pra conta dele a partir de uma conta secundária (de um familiar, uma conta de teste). O clone deve detectar, responder como o dono e registrar o lead. Se os três acontecerem, a conexão está viva: confirme com o dono e celebre.

### Regras deste processo

1. Uma etapa por vez, sempre esperando a confirmação do dono.
2. A API key é segredo: vai pro `.env`, nunca pro chat ou pra memória.
3. Endpoints só da documentação oficial do Zernio, lidos na hora.
4. Nada de mensagem automática pra lead real antes do dono aprovar o modo autônomo.
5. Se algo na doc do Zernio tiver mudado em relação a este documento, a doc oficial vence. Me avise da diferença e siga a doc.
