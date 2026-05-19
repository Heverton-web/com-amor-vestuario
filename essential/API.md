# Documentação da API - Com Amor Vestuário

> Endpoints da aplicação e integrações externas.

---

## Sumário

1. [Supabase API](#supabase-api)
2. [Edge Functions](#edge-functions)
3. [n8n Webhooks](#n8n-webhooks)
4. [Mercado Pago](#mercado-pago)
5. [ListMonk](#listmonk)
6. [EvolutionAPI (WhatsApp)](#evolutionapi-whatsapp)

---

## Supabase API

### Autenticação

```javascript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@email.com',
  password: 'senha'
})

// Logout
await supabase.auth.signOut()

// Obter usuário atual
const { data: { user } } = await supabase.auth.getUser()
```

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `products` | Catálogo de produtos |
| `customers` | Clientes (PF/PJ) |
| `orders` | Pedidos |
| `order_items` | Itens do pedido |
| `reward_items` | Recompensas fidelidade |
| `redemptions` | Resgates de cupons |

### Exemplos de Query

```javascript
// Listar produtos ativos
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('active', true)

// Buscar cliente por ID
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('id', customerId)
  .single()

// Criar pedido
const { data, error } = await supabase
  .from('orders')
  .insert({
    customer_id: customerId,
    status: 'realizado',
    subtotal: 250.00,
    total: 280.00
  })
```

---

## Edge Functions

### Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/functions/v1/send-email` | Enviar e-mail transacional |
| POST | `/functions/v1/generate-pdf` | Gerar PDF (fatura/recibo) |
| POST | `/functions/v1/payment-webhook` | Webhook Mercado Pago |
| GET | `/functions/v1/branding` | Obter configurações de marca |

### Exemplo: Enviar E-mail

```javascript
const response = await fetch(
  'https://xxxxx.supabase.co/functions/v1/send-email',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      to: 'cliente@email.com',
      subject: 'Pedido confirmado!',
      template: 'order-confirmed',
      data: {
        order_id: 'PD1001',
        customer_name: 'Maria',
        total: 'R$ 250,00'
      }
    })
  }
)
```

---

## n8n Webhooks

### Webhooks Disponíveis

| Evento | URL | Descrição |
|--------|-----|-----------|
| Pedido criado | `/webhook/pedido-criado` | Quando novo pedido é feito |
| Pagamento confirmado | `/webhook/pagamento-confirmado` | Quando pagamento é aprovado |
| Pedido enviado | `/webhook/pedido-enviado` | Quando código rastreamento é adicionado |

### Payload Exemplo

```json
{
  "event": "order_created",
  "order_id": "PD1001",
  "customer_id": "c123abc",
  "customer_name": "Maria Silva",
  "customer_phone": "+5521999999999",
  "customer_email": "maria@email.com",
  "total": 250.00,
  "items": [
    {
      "product_id": "prod123",
      "name": "Camiseta Floral",
      "quantity": 2,
      "price": 75.00
    }
  ],
  "timestamp": "2026-05-20T14:30:00Z"
}
```

---

## Mercado Pago

### Endpoints

| Método | URL | Descrição |
|--------|-----|-----------|
| POST | `/checkout/preferences` | Criar preferência de pagamento |
| GET | `/checkout/preferences/{id}` | Buscar preferência |
| POST | `/payments/{id}/refunds` | Estornar pagamento |

### Criar Preferência de Pagamento

```javascript
const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
  },
  body: JSON.stringify({
    items: [
      {
        id: 'prod_123',
        title: 'Camiseta Floral',
        quantity: 2,
        unit_price: 75.00,
        currency_id: 'BRL'
      }
    ],
    back_urls: {
      success: 'https://comamor.com.br/checkout/sucesso',
      failure: 'https://comamor.com.br/checkout/falha',
      pending: 'https://comamor.com.br/checkout/pendente'
    },
    auto_return: 'all',
    notification_url: 'https://xxxxx.supabase.co/functions/v1/payment-webhook'
  })
})
```

### Webhook Notification

```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": 123456789
  },
  "date_created": "2026-05-20T14:30:00Z",
  "type": "payment"
}
```

---

## ListMonk

### API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/lists` | Listar listas |
| GET | `/api/lists/{id}/subscribers` | Listar assinantes |
| POST | `/api/send` | Enviar e-mail transacional |
| POST | `/api/campaigns` | Criar campanha |

### Enviar E-mail Transacional

```javascript
const response = await fetch('http://listmonk:9000/api/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa('listmonk:LISTMONK_API_KEY')}`
  },
  body: JSON.stringify({
    list_ids: [1],
    template_id: 1,
    subject: 'Pedido confirmado!',
    from: 'Com Amor <contato@comamor.com.br>',
    to: 'cliente@email.com',
    content: '<h1>Olá {{.Subscriber.FirstName}}!</h1><p>Seu pedido foi confirmado.</p>'
  })
})
```

---

## EvolutionAPI (WhatsApp)

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/message/sendText/{phone}` | Enviar mensagem de texto |
| POST | `/message/sendImage/{phone}` | Enviar imagem |
| POST | `/message/sendLink/{phone}` | Enviar link |
| GET | `/chat/contacts` | Listar contatos |
| GET | `/message/{messageId}` | Buscar mensagem |

### Enviar Mensagem de Texto

```javascript
const response = await fetch('http://evolution-api:8080/message/sendText/+5521999999999', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'EVOLUTION_API_KEY'
  },
  body: JSON.stringify({
    text: 'Olá Maria! Seu pedido foi confirmado. 😊'
  })
})
```

### Resposta

```json
{
  "key": {
    "id": "BAELS123456789",
    "remoteJid": "5512999999999@c.us",
    "fromMe": true
  },
  "message": {
    "conversation": "Olá Maria! Seu pedido foi confirmado. 😊"
  },
  "messageTimestamp": "1716217200",
  "status": "success"
}
```

---

## Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Mercado Pago
MP_ACCESS_TOKEN=APP_TEST_xxxxx...
MP_PUBLIC_KEY=APP_TEST_xxxxx...

# n8n
N8N_WEBHOOK_URL=https://n8n.comamor.com.br/webhook

# ListMonk
LISTMONK_API_KEY=xxxxx...
LISTMONK_LIST_ID=1

# EvolutionAPI
EVOLUTION_API_KEY=xxxxx...
```

---

## Códigos de Erro

| Código | Significado |
|--------|--------------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## Rate Limits

| Serviço | Limite |
|---------|--------|
| Supabase | 60 req/s (，免费) |
| Mercado Pago | 100 req/min |
| EvolutionAPI | Verificar plano |
| ListMonk | Ilimitado |