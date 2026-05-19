# Feature: Marketing Automation (n8n + ListMonk + EvolutionAPI)

## Descrição

Sistema completo de automação de marketing para follow-up de clientes e envio de campanhas via WhatsApp e E-mail. Utiliza n8n como orquestrador, ListMonk para e-mails e EvolutionAPI para WhatsApp.

## Escopo

### Necessário (CRUD)
- [ ] Criar campanhas (nome, tipo, segmento, template, agendamento)
- [ ] Editar campanhas
- [ ] Ativar/desativar campanhas
- [ ] Excluir campanhas
- [ ] Dashboard com métricas (enviados, abertos, cliques, respostas)
- [ ] Fluxos de follow-up automatizados

### Funcionalidades
- [ ] Segmentação de clientes (status pedido, categoria, pontos)
- [ ] Templates de mensagem com variáveis
- [ ] Agendamento (dias específicos, horários)
- [ ] Métricas por campanha
- [ ] Logs de envio detalhados

### Fluxos Automáticos
- [ ] Follow-up pós-pedido (1 dia depois)
- [ ] Follow-up entrega (apos 3 dias)
- [ ] Carrinho abandonado (1 hora)
- [ ] Aniversário (no dia)
- [ ] Pontos prestes a expirar (30 dias)
- [ ] Newsletter semanal

## Dependências

| Dependência | Tipo | Motivo |
|-------------|------|--------|
| #2 Autenticação | Externa | Segmentar clientes por perfil |
| #3 E-mail Transacional | Externa | ListMonk para e-mails |
| #6 Rastreamento | Externa | Trigger em status pedido |

## Infraestrutura (Docker Swarm - Contabo)

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER SWARM (Contabo)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Traefik (Reverse Proxy)           │   │
│  └─────────────────────────────────────────────────────┘   │
│         │              │              │              │       │
│         ▼              ▼              ▼              ▼       │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐  │
│  │  n8n      │  │ ListMonk  │  │Evolution  │  │Supabase│  │
│  │ :5678     │  │ :9000     │  │ :8080     │  │ :5432  │  │
│  └───────────┘  └───────────┘  └───────────┘  └────────┘  │
│       │              │              │                        │
│       └──────────────┼──────────────┘                        │
│                      │                                       │
│                ┌─────▼─────┐                                  │
│                │  WhatsApp │                                  │
│                │ (Gateway) │                                  │
│                └───────────┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Esforço Estimado

**24-40 horas** distribuídas em:
- Schema DB + migrations: 4h
- Backend API (supabase functions): 6h
- Frontend admin (campanhas CRUD): 8h
- Dashboard métricas: 4h
- Fluxos n8n (templates): 8h
- Testes integração: 6h
- Documentação fluxos: 4h

## Stack/Tech

- **n8n** - Orquestrador de automação (self-hosted)
- **ListMonk** - Servidor de e-mail (self-hosted)
- **EvolutionAPI** - API WhatsApp (self-hosted)
- **Supabase** - Dados + API (já existe)
- **React** - Frontend admin

---

## Schema DB

### Campanhas

```sql
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email', 'both')),
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativa', 'pausada', 'finalizada')),
  segment_json JSONB, -- critérios de segmentação
  template_subject TEXT, -- para e-mail
  template_body TEXT NOT NULL, -- template da mensagem
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_time TIME, -- horário agendado (ex: '09:00')
  schedule_days TEXT[], -- ['monday', 'wednesday', 'friday']
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Logs de Envio

```sql
CREATE TABLE marketing_campaign_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id),
  flow_id UUID REFERENCES marketing_flows(id), -- se automático
  customer_id UUID REFERENCES customers(id),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  message_text TEXT,
  message_id TEXT, -- ID externo (WhatsApp message ID ou ListMonk ID)
  status TEXT NOT NULL CHECK (status IN ('enviado', 'entregue', 'erro', 'lido')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);
```

### Fluxos de Follow-up

```sql
CREATE TABLE marketing_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'order_created', 'order_paid', 'order_shipped', 'order_delivered',
    'points_earned', 'points_expiring', 'birthday', 'inactive_30_days',
    'cart_abandoned', 'wholesale_approved'
  )),
  trigger_delay INTERVAL DEFAULT '1 day', -- '1 hour', '2 days', etc
  action_channel TEXT NOT NULL CHECK (action_channel IN ('whatsapp', 'email')),
  action_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Trigger (Eventos)

```sql
-- Trigger para criar log quando status mudar
CREATE OR REPLACE FUNCTION public.log_marketing_event()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  event_type TEXT;
BEGIN
  -- Detectar mudança de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    event_type := 'order_' || NEW.status;
    -- Insert em marketing_campaign_logs será feito pelo n8n
  END IF;
  RETURN NEW;
END;
$$;
```

---

## Frontend Admin

### Página: /admin.marketing

```
┌────────────────────────────────────────────────────────────────┐
│ Marketing Automation                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ 📧 Enviados  │ │ 📬 Entregues  │ │ 👁️ Abertos   │          │
│  │    1.234     │ │    1.100     │ │    890      │          │
│  └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ [ + Nova Camp ]  [Fluxos]  [Templates]                  │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ ┌────────────────────────────────────────────────────┐  │ │
│  │ │Campanha        │Tipo  │Status  │Enviados│Abertos│   │ │
│  │ ├────────────────────────────────────────────────────┤  │ │
│  │ │Black Friday   │Whats │Ativa   │ 500    │ 350   │   │ │
│  │ │Aniversário    │Email │Ativa   │ 50     │ 40    │   │ │
│  │ │Follow-up Pd 12│Both  │Pausada │ 200    │ 180   │   │ │
│  │ └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Página: /admin.marketing.$id (Editar)

```
┌────────────────────────────────────────────────────────────────│
│ Editar Campanha: Black Friday                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Nome: [Black Friday 20% OFF_________________________________]  │
│ Descrição: [Promoção dia dos pais...]                        │
│                                                                 │
│ Tipo: (●) WhatsApp  ( ) Email  (●) Ambos                       │
│                                                                 │
│ Status: (●) Rascunho  ( ) Ativa  ( ) Pausada  ( ) Finalizada   │
│                                                                 │
│ Segmentação:                                                    │
│   Categoria: [Atacado ▼]                                       │
│   Mín. pontos: [100________]                                   │
│   Última compra: [mais de 30 dias ▼]                           │
│                                                                 │
│ Template:                                                        │
│   ┌────────────────────────────────────────────────────────┐  │
│   │ Olá {name}! 👋                                          │  │
│   │                                                         │  │
│   │ BLACK FRIDAY na Com Amor!                               │  │
│   │ 20% OFF em toda a loja!                                 │  │
│   │                                                         │  │
│   │ Use o cupom: BF20                                       │  │
│   │ Válido até: {campaign_end_date}                         │  │
│   │                                                         │  │
│   │ [Garantar meu desconto] → {campaign_url}              │  │
│   │                                                         │  │
│   │ {company_name}                                          │  │
│   └────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Agendamento: [ ] Ativar                                         │
│   Dias: ☐ Seg ☐ Ter ☐ Qua ☐ Qui ☐ Sex ☐ Sáb ☐ Dom            │
│   Horário: [09:00___]                                           │
│                                                                 │
│ [Salvar] [Cancelar] [Testar] [Enviar Agora]                    │
└────────────────────────────────────────────────────────────────┘
```

### Página: /admin.marketing.fluxos

```
┌────────────────────────────────────────────────────────────────┐
│ Fluxos de Automação                                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ [ + Novo Fluxo ]                                        │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ Nome                    │ Trigger           │ Status     │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ Follow-up Pedido       │ order_delivered    │ ● Ativo    │  │
│ │ Carrinho Abandonado    │ cart_abandoned     │ ● Ativo    │  │
│ │ Aniversário            │ birthday           │ ○ Inativo  │  │
│ │ Pontos Expirando       │ points_expiring    │ ● Ativo    │  │
│ │ Welcome Lojista        │ wholesale_approved │ ● Ativo    │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Integração n8n

### Workflow 01: Criar/Editar Campanha

```json
{
  "name": "Marketing Campaign CRUD",
  "nodes": [
    {
      "name": "Supabase Trigger",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "watchChanges",
        "table": "marketing_campaigns"
      }
    },
    {
      "name": "Switch - Operation",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "dataType": "string",
        "value1": "{{$json.operation}}",
        "rules": {
          "rules": [
            {"value2": "insert", "output": 0},
            {"value2": "update", "output": 1},
            {"value2": "delete", "output": 2}
          ]
        }
      }
    }
  ]
}
```

### Workflow 02: Executar Campanha

```json
{
  "name": "Execute Campaign",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.schedule",
      "parameters": {
        "rule": "custom",
        "cron": "0 9 * * 1,3,5"
      }
    },
    {
      "name": "Get Active Campaigns",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "getAll",
        "table": "marketing_campaigns",
        "filter": {"status": "ativa", "schedule_enabled": true}
      }
    },
    {
      "name": "Loop Campaigns",
      "type": "n8n-nodes-base.splitInBatches"
    },
    {
      "name": "Query Segment",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "query",
        "sql": "SELECT * FROM customers WHERE {{$json.segment_json}}"
      }
    },
    {
      "name": "Loop Customers",
      "type": "n8n-nodes-base.splitInBatches"
    },
    {
      "name": "Switch Channel",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "value1": "{{$json.campaign_type}}",
        "rules": {"rules": [
          {"value2": "whatsapp", "output": 0},
          {"value2": "email", "output": 1},
          {"value2": "both", "output": 2}
        ]}
      }
    },
    {
      "name": "Send WhatsApp (EvolutionAPI)",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.EVOLUTION_API_URL}}/message/sendText/{{$json.customer_phone}}",
        "body": "{{$json.template_body}}"
      }
    },
    {
      "name": "Send Email (ListMonk)",
      "type": "n8n-nodes-base.listmonk",
      "parameters": {
        "operation": "sendTransactional",
        "listId": "{{$env.LISTMONK_LIST_ID}}"
      }
    },
    {
      "name": "Log Result",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "marketing_campaign_logs"
      }
    }
  ]
}
```

### Workflow 03: Follow-up Automático

```json
{
  "name": "Follow-up Order Delivered",
  "nodes": [
    {
      "name": "Order Status Changed",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "watchChanges",
        "table": "orders",
        "filter": {"status": "finalizado"}
      }
    },
    {
      "name": "Wait 3 Days",
      "type": "n8n-nodes-base.wait",
      "parameters": {"amount": 3, "unit": "days"}
    },
    {
      "name": "Get Flow Template",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "get",
        "table": "marketing_flows",
        "id": "{{$json.flow_id}}"
      }
    },
    {
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.EVOLUTION_API_URL}}/message/sendText/{{$json.customer_phone}}"
      }
    }
  ]
}
```

---

## Templates de Mensagem

### Variáveis Disponíveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{name}` | Nome do cliente | Maria |
| `{first_name}` | Primeiro nome | Maria |
| `{phone}` | Telefone | +5521999999999 |
| `{email}` | E-mail | maria@email.com |
| `{points}` | Pontos fidelidade | 150 |
| `{order_code}` | Código pedido | PD1001 |
| `{order_total}` | Total pedido | R$ 250,00 |
| `{tracking_code}` | Código rastreamento | AB123456789BR |
| `{campaign_name}` | Nome campanha | Black Friday |
| `{campaign_url}` | URL campanha | https://... |
| `{company_name}` | Nome loja | Com Amor |
| `{company_phone}` | WhatsApp loja | +5521... |

### Exemplos de Template

#### Follow-up Pedido Entregue
```
Olá {name}! 🎉

Seu pedido {order_code} foi entregue!

 esperamos que você adore suas novas peças!

Curtiu? Compartilhe sua experiência com a gente!
Responda esta mensagem com uma foto - queremos ver você estilosa! 💕

Em breve você receberá cupons exclusivos!
Seu próxima compra pode sair mais barato! ✨

Equipe {company_name} 💕
```

#### Carrinho Abandonado
```
Oi {name}! 👋

Vimos que você deixou algumas peças maneiras no carrinho!

Parece que você se interessou por:
{cart_items}

corujas esperando você voltar! 🦉

使用 este cupom para garantir o desconto:
CARRINHO10 - 10% OFF

Válido por 24h! ⏰

Aqui: {cart_checkout_url}

Equipe {company_name} 💕
```

#### Aniversário
```
Feliz aniversário, {name}! 🎂🎉

Que seu dia seja cheio de amor, alegrias e muitas peças novas! 💕

Como presente, você ganhou:
🎁 {birthday_reward}

使用 até {birthday_valid_date}!

Aproveite: {birthday_redemption_link}

Um beijo da equipe {company_name} 💕
```

---

## API Endpoints (Supabase Functions)

### Campanhas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /marketing/campaigns | Listar todas |
| GET | /marketing/campaigns/:id | Detalhar uma |
| POST | /marketing/campaigns | Criar |
| PUT | /marketing/campaigns/:id | Atualizar |
| DELETE | /marketing/campaigns/:id | Excluir |
| POST | /marketing/campaigns/:id/send | Enviar agora |
| POST | /marketing/campaigns/:id/test | Enviar teste |

### Fluxos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /marketing/flows | Listar fluxos |
| POST | /marketing/flows | Criar fluxo |
| PUT | /marketing/flows/:id | Atualizar |
| PUT | /marketing/flows/:id/toggle | Ativar/desativar |

### Métricas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /marketing/metrics | Métricas gerais |
| GET | /marketing/campaigns/:id/metrics | Métricas campanha |
| GET | /marketing/metrics/timeline | Timeline 30 dias |

---

## Fluxos Automáticos Recomendados

| Fluxo | Trigger | Delay | Canal | Template |
|-------|---------|-------|-------|----------|
| Confirmação Pedido | order_created | 0 | WhatsApp | "Pedido recebido!..." |
| Pagamento Recebido | order_paid | 0 | WhatsApp | "Pagamento confirmado!..." |
| Pedido Enviado | order_shipped | 0 | WhatsApp | "Seu pedido foi enviado!..." |
| follow-up Entrega | order_delivered | 3 dias | WhatsApp | "Como foi a experiência?..." |
| Avaliação Pedido | order_delivered | 5 dias | Email | "Avalie sua compra..." |
| Carrinho Abandonado | cart_abandoned | 1h | WhatsApp | "Esqueceu algo?..." |
| Aniversário | birthday | 0 | WhatsApp+Email | "Feliz aniversário!..." |
| Pontos Expirando | points_expiring | 30 dias | WhatsApp | "Pontos vão expirar!..." |
| Newsletter Semanal | schedule | toda 4ª 9h | Email | "Novidades da semana" |
| Lojista Aprovado | wholesale_approved | 0 | WhatsApp | "Bem-vindo lojista!..." |

---

## Considerações Importantes

### Rate Limiting
- EvolutionAPI: verificar limite diário
- ListMonk: configuração de concurrent connections
- n8n: configurar execution timeout

### LGPD/Consentimento
- Campo `marketing_consent` em customers
- Permitir opt-out em todas mensagens
- Registrar consentimento com data

### Métricas
- WhatsApp: obter status "lido" via EvolutionAPI
- E-mail: tracking pixels ListMonk
- Dashboards em tempo real via WebSocket

### Variáveis de Ambiente (n8n)

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx

# EvolutionAPI
EVOLUTION_API_URL=http://evolution:8080
EVOLUTION_API_KEY=xxx

# ListMonk
LISTMONK_URL=http://listmonk:9000
LISTMONK_API_KEY=xxx
LISTMONK_LIST_ID=1
```

---

## Files a Modificar/Criar

### Database
- `supabase/migrations/2026xx_marketing_automation.sql` - schema completo

### Backend (Supabase Functions)
- `supabase/functions/marketing-campaigns/index.ts` - CRUD
- `supabase/functions/marketing-metrics/index.ts` - métricas

### Frontend
- `src/routes/_authenticated/admin.marketing.tsx` - dashboard
- `src/routes/_authenticated/admin.marketing.campaign.tsx` - criar/editar
- `src/routes/_authenticated/admin.marketing.fluxos.tsx` - fluxos

### n8n (Workflows)
- `n8n/workflows/marketing-campaign-trigger.json`
- `n8n/workflows/followup-order.json`
- `n8n/workflows/abandoned-cart.json`
- `n8n/workflows/birthday.json`

---

## Alternativas

| Componente | Alternativa | Quando Usar |
|------------|-------------|-------------|
| n8n | Zapier, Make | Se não quiser self-hosted |
| EvolutionAPI | Twilio, Botconversa | Se preferir cloud |
| ListMonk | Resend, SendGrid | Se aceitar custo mensal |

---

## Referências

- [n8n Documentation](https://docs.n8n.io/)
- [ListMonk Documentation](https://listmonk.app/docs/)
- [EvolutionAPI Documentation](https://github.com/Atendee-Technologies/evolution-api)
- [Evolution API - n8n Integration](https://github.com/n8n-io/n8n-nodes-chat-api)