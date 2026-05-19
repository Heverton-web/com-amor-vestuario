# Schema do Banco de Dados - Com Amor Vestuário

> Visão geral das tabelas e relacionamentos do banco de dados Supabase.

---

## Entidades Principais

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    products     │     │   customers    │     │    orders      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ code            │     │ code            │     │ code            │
│ name            │     │ name            │     │ customer_id (FK)│
│ description     │     │ type (pf/pj)    │     │ status          │
│ retail_price    │     │ cpf/cnpj        │     │ subtotal        │
│ wholesale_price│     │ phone           │     │ shipping        │
│ stock           │     │ email           │     │ total           │
│ colors[]        │     │ category        │     │ created_at      │
│ sizes[]         │     │ wholesale_*     │     └────────┬────────┘
│ images[]        │     │ points_balance  │              │
│ active          │     │ created_at      │              │
└────────┬────────┘     └────────┬────────┘              │
         │                      │                        │
         │                      │                        │
         ▼                      ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      order_items                               │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)         │ order_id (FK)  │ product_id (FK)           │
│ product_name    │ quantity       │ unit_price                │
│ color           │ size           │ total                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tabelas do Sistema

### Products (Catálogo)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| code | TEXT | Código SKU (ex: P1001) |
| name | TEXT | Nome do produto |
| description | TEXT | Descrição |
| type | product_type | convencional/fardamento |
| cost_price | NUMERIC | Preço de custo |
| retail_price | NUMERIC | Preço varejo |
| wholesale_price | NUMERIC | Preço atacado |
| stock | INTEGER | Quantidade em estoque |
| colors | TEXT[] | Cores disponíveis |
| sizes | TEXT[] | Tamanhos disponíveis |
| images | TEXT[] | URLs das imagens |
| active | BOOLEAN | Produto ativo |

### Customers (Clientes)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| code | TEXT | Código cliente (ex: C1001) |
| name | TEXT | Nome completo |
| type | customer_type | pf/pj |
| cpf | TEXT | CPF (se PF) |
| cnpj | TEXT | CNPJ (se PJ) |
| email | TEXT | E-mail |
| phone | TEXT | WhatsApp |
| category | customer_category | varejo/atacado/fardamento |
| wholesale_tier_id | UUID | Tier atacadista |
| wholesale_approved | BOOLEAN | Aprovado para atacado |
| points_balance | INTEGER | Pontos fidelidade |
| created_at | TIMESTAMP | Data cadastro |

### Orders (Pedidos)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| code | TEXT | Código pedido (ex: PD1001) |
| customer_id | UUID | Cliente (FK) |
| status | order_status | Estado do pedido |
| subtotal | NUMERIC | Sem frete |
| shipping | NUMERIC | Valor do frete |
| total | NUMERIC | Total final |
| payment_id | TEXT | ID pagamento (MP) |
| payment_status | TEXT | Status pagamento |
| tracking_code | TEXT | Código rastreamento |
| created_at | TIMESTAMP | Data criação |

**Status do Pedido**: `realizado` → `separado` → `pago` → `enviado` → `finalizado`

### Reward Items (Recompensas)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| name | TEXT | Nome recompensa |
| kind | TEXT | Tipo (voucher_percent/voucher_valor/produto_fisico) |
| points_cost | INTEGER | Custo em pontos |
| voucher_percent | INTEGER | % desconto (se voucher) |
| voucher_value | NUMERIC | Valor fixo (se voucher) |
| product_id | UUID | Produto (se física) |
| stock | INTEGER | Estoque |
| active | BOOLEAN | Ativa |

### Redemptions (Resgates)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| customer_id | UUID | Cliente (FK) |
| reward_id | UUID | Recompensa (FK) |
| voucher_code | TEXT | Código cupom |
| status | TEXT | Estado (resgatado/usado/expirado) |
| redeemed_at | TIMESTAMP | Data resgate |
| used_at | TIMESTAMP | Data uso |

---

## Tabelas de Marketing (Pendentes)

### Marketing Campaigns

```sql
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('whatsapp', 'email', 'both')),
  status TEXT CHECK (status IN ('rascunho', 'ativa', 'pausada', 'finalizada')),
  segment_json JSONB,
  template_body TEXT,
  schedule_enabled BOOLEAN,
  schedule_time TIME,
  schedule_days TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Marketing Flows

```sql
CREATE TABLE marketing_flows (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_event TEXT CHECK (trigger_event IN (
    'order_created', 'order_paid', 'order_shipped', 'order_delivered',
    'points_earned', 'points_expiring', 'birthday', 'cart_abandoned'
  )),
  trigger_delay INTERVAL,
  action_channel TEXT CHECK (action_channel IN ('whatsapp', 'email')),
  action_template TEXT,
  is_active BOOLEAN DEFAULT true
);
```

### Marketing Campaign Logs

```sql
CREATE TABLE marketing_campaign_logs (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id),
  customer_id UUID REFERENCES customers(id),
  channel TEXT CHECK (channel IN ('whatsapp', 'email')),
  status TEXT CHECK (status IN ('pendente', 'enviado', 'entregue', 'erro', 'lido')),
  message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Views Úteis

### Product Ratings (Avaliações)

```sql
CREATE VIEW product_ratings AS
SELECT
  product_id,
  COUNT(*) as review_count,
  AVG(rating)::NUMERIC(3,2) as avg_rating
FROM product_reviews
WHERE status = 'approved'
GROUP BY product_id;
```

### Marketing Metrics Summary

```sql
CREATE VIEW marketing_metrics_summary AS
SELECT
  c.id as campaign_id,
  c.name as campaign_name,
  c.type,
  c.status,
  COUNT(l.id) as total_sent,
  COUNT(l.id) FILTER (WHERE l.status = 'entregue') as total_delivered,
  COUNT(l.id) FILTER (WHERE l.status = 'lido') as total_read
FROM marketing_campaigns c
LEFT JOIN marketing_campaign_logs l ON c.id = l.campaign_id
GROUP BY c.id;
```

---

## Funções Auxiliares

### get_wholesale_price

Retorna preço de atacado considerando tier e preços customizados:

```sql
SELECT get_wholesale_price('customer-uuid', 'product-uuid');
-- Retorna: 85.00 (preço com discount do tier)
```

### can_review_product

Verifica se cliente pode avaliar produto (só comprou):

```sql
SELECT can_review_product('customer-uuid', 'product-uuid');
-- Retorna: true/false
```

---

## Índices

| Tabela | Índice | Colunas |
|--------|--------|---------|
| products | idx_products_active | active |
| customers | idx_customers_phone | phone |
| orders | idx_orders_status | status |
| orders | idx_orders_customer | customer_id |
| marketing_campaign_logs | idx_mcl_campaign | campaign_id |
| marketing_campaign_logs | idx_mcl_customer | customer_id |
| marketing_campaign_logs | idx_mcl_created | created_at |

---

## Migration

Para aplicar todas as tabelas pendentes, execute:

```bash
psql -h HOST -U USER -d DBNAME -f ../supabase/migrations/20260520000000_features_stack.sql
```

---

## Relacionamentos

```
customers (1) ──────< orders (many)
orders (1) ───────< order_items (many)
products (1) ──────< order_items (many)

customers (1) ──────< redemptions (many)
reward_items (1) ──< redemptions (many)

customers (1) ──────< marketing_campaign_logs (many)
marketing_campaigns (1) ──< marketing_campaign_logs (many)
```