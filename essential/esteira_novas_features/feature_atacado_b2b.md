# Feature: Atacado B2B (Lojistas)

## Descrição

Área dedicado para clientes atacadistas/lojistas com cadastro de CNPJ, preços especiais, MOQ (mínimo de pedido) e condições de pagamento diferenciadas.

## Escopo

### Necessário
- [ ] Cadastro lojista (CNPJ, Razão Social, Inscrição Estadual)
- [ ] Aprovação manual (admin aprova cadastro)
- [ ] Preços especiais por cliente/grupo
- [ ] MOQ (mínimo pedido) configurável
- [ ] Condições pagamento (boleto, pix, crédito)
- [ ] Área logada B2B (pedidos, preços)

### Desejável
- [ ] Lista de preços em PDF para download
- [ ] Condição de pagamento prazo (30/60 dias)
- [ ] Atacado só ativa com CNPJ aprovado
- [ ] Desconto progressivo por volume

## Dependências

| Dependência | Tipo | Motivo |
|-------------|------|--------|
| #2 Autenticação | Externa | Login obrigatório para atacadista |

## Esforço Estimado

**24-40 horas** distribuídas em:
- Schema + migration: 2h
- Fluxo aprovação: 6h
- Preços por cliente: 8h
- Condições pagamento: 4h
- Frontend B2B: 8h
- Testes: 6h

## Stack/Tech

- Supabase (RLS + functions)
- TanStack Query (preços dinâmicos)

## Arquitetura

```
┌─────────────┐    ┌──────────────┐
│ Lojista     │───→│ Cadastro B2B  │
│ (sem login) │    │ (pendente)   │
└─────────────┘    └──────────────┘
                         │
                         ↓
                  ┌──────────────┐
                  │ Admin        │───→ aprova/rejeita
                  │ (aprovação)  │
                  └──────────────┘
                         │
                         ↓
                  ┌──────────────┐
                  │ Área B2B     │
                  │ (aprovado)   │
                  └──────────────┘
```

## Schema DB

```sql
-- Tabela de grupos/clientes atacadistas
CREATE TABLE public.wholesale_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Ouro", "Prata", "Bronze"
  min_order_qty INTEGER DEFAULT 6,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  payment_terms TEXT[], -- ['pix', 'boleto', 'credito_30']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vincular cliente ao tier
ALTER TABLE customers ADD COLUMN wholesale_tier_id UUID REFERENCES wholesale_tiers(id);
ALTER TABLE customers ADD COLUMN wholesale_approved BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN wholesale_approved_by UUID REFERENCES auth.users(id);
ALTER TABLE customers ADD COLUMN wholesale_approved_at TIMESTAMPTZ;

-- Preços especiais por produto/cliente (override)
CREATE TABLE public.wholesale_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  custom_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, product_id)
);
```

## Fluxo

### Cadastro Lojista
1. Cliente acessa /atacado
2. Clica "Quero vender"
3. Preenche: CNPJ, Razão Social, IE, telefone, endereço
4. Dados salvos como `wholesale_approved = false`
5. Admin recebe notificação (kanban ou e-mail)

### Aprovação Admin
1. Admin acessa admin.atacado (nova página)
2. Visualiza pedidos de aprovação
3. Decide: aprovar ou rejeitar
4. Se aprovado → customer `wholesale_approved = true` + tier

### Compra Atacado
1. Lojista loga
2. Sistema carrega preços do tier + custom prices
3. Carrinho aplica discount do tier automaticamente
4. Checkout mostra condições do tier

## Frontend Pages

### /atacado
- Landing page explicando vantagens
- "Quero vender" → formulário

### /atacado/cadastro
- Form com campos CNPJ (validação), razão social, IE, telefone
- Docs obrigatória (opcional Upload certidão)

### /atacado/area (logado)
- Dashboard lojista
- Histórico pedidos atacadista
- Condições atuais (tier, próximo desconto)

### /admin.atacado
- Lista pendentes aprovação
- Aprovar/rejeitar com motivo

## Lógica de Preços

```typescript
// priority: custom > tier > wholesale base

function getPrice(customerId, product) {
  // 1. Custom price por cliente
  const custom = getWholesalePrice(customerId, product.id);
  if (custom) return custom;

  // 2. Tier discount
  const tier = customer.wholesale_tier;
  if (tier) {
    const base = product.wholesale_price;
    return base * (1 - tier.discount_percent / 100);
  }

  // 3. Default
  return product.wholesale_price;
}
```

## MOQ - Mínimo de Pedido

```typescript
const MOQ = customer.wholesale_tier?.min_order_qty || 6;

function validateCart(cart) {
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  if (total < MOQ) {
    return { valid: false, message: `Mínimo ${MOQ} peças` };
  }
  return { valid: true };
}
```

## Files a Modificar/Criar

- `supabase/migrations/` - schema novo
- `src/routes/atacado.tsx` - landing
- `src/routes/atacado.cadastro.tsx`
- `src/routes/atacado.area.tsx`
- `src/routes/_authenticated/admin.atacado.tsx`
- `src/features/vendas/services/pricing.ts` - lógica preços B2B

## Considerações

- **Aprovação manual** é intencional (B2B = relação comercial)
- **Validação CNPJ**: usar API (ReceitaWS ou similar) ou manual
- **IE**: validar formato por estado
- **Tier padrão**: criar tier "Padrão" com MOQ=6, discount=0
- **Migrar clientes**: existentes com category='atacado' viram approved

## Alternativas

| Abordagem | Prós | Contras |
|-----------|------|---------|
| Aprovação manual | Controlar quem vende | Demorado |
| Auto-aprovação com verificação | Rápido | Risco |
| Tier automático por volume | Simples | Menos controle |

## Referências

- [CNPJ API](https://receitaws.com.br/)
- [Validação IE por estado](https://www.sped.fazenda.gov.br)