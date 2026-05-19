# Feature: Área "Minha Conta"

## Descrição

Área logada do cliente com histórico de pedidos, pontos de fidelidade, cupons disponíveis e dados pessoais. Complementa o sistema de autenticação.

## Escopo

### Necessário
- [ ] Dashboard: resumo (pontos, pedidos recentes, cupons)
- [ ] Histórico de pedidos (lista + detalhe)
- [ ] Meus cupons/resgates
- [ ] Dados pessoais (editar perfil)
- [ ] Endereços (cadastrar/editar)

### Desejável
- [ ] Lista desejos (ver wishlist)
- [ ] Notificações/configurações
- [ ] Pedir segunda via nota fiscal

## Dependências

| Dependência | Tipo | Motivo |
|-------------|------|--------|
| #2 Autenticação | Externa | Precisa cliente logado |

## Esforço Estimado

**16-24 horas** distribuídas em:
- Layout base: 4h
- Dashboard: 4h
- Lista pedidos: 4h
- Detalhe pedido: 4h
- Meus cupons: 4h
- Dados/endereços: 4h

## Stack/Tech

- React Router (file routes)
- TanStack Query (fetch data)
- Supabase (queries)

## Arquitetura

```
/conta
├── /conta.index         (Dashboard)
├── /conta.pedidos
│   └── /conta.pedidos.$id (Detalhe)
├── /conta.cupons
├── /conta.perfil
└── /conta.enderecos
```

## Schema DB

```sql
-- Já existe:
-- - customers (dados pessoais)
-- - orders (historico)
-- - redemptions (resgates)
-- - reward_items (cupons)

-- Adicionar para endereços múltiplos
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  label TEXT DEFAULT 'Principal',
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Componentes por Página

### Dashboard
- Cards: pontos disponíveis, pedidos última 30 dias, cupons ativos
- Link rápido para pedido em andamento
- Banner promoções

### Pedidos
- Tabela: código, data, status, total, actions
- Filtros: status, período
- Detalhe: itens, endereço, status timeline

### Cupons
- Lista de redemptions com status "resgatado"
- Exibir: código, benefício, validade, status

### Perfil
- Form editar: nome, e-mail, telefone, CPF/CNPJ
- Campos condicionais: PJ tem campos diferentes

### Endereços
- CRUD de endereços
- Definir padrão para entrega

## Files a Modificar/Criar

- `src/routes/_authenticated.conta.tsx` - layout shell
- `src/routes/_authenticated.conta.index.tsx` - dashboard
- `src/routes/_authenticated.conta.pedidos.tsx`
- `src/routes/_authenticated.conta.pedidos.$id.tsx`
- `src/routes/_authenticated.conta.cupons.tsx`
- `src/routes/_authenticated.conta.perfil.tsx`
- `src/routes/_authenticated.conta.enderecos.tsx`

## Timeline Status Pedido

```
realizado → separado → pago → enviado → finalizado
```

- **realizado**: Recebido, aguardando pagamento
- **separado**: Pagamento confirmado, separado para envio
- **pago**: Nome antigo (confuso), manter retrocompat?
- **enviado**: Enviado ao cliente
- **finalizado**: Recebido pelo cliente

## Considerações

- Proteger todas rotas com AuthGuard
- Lazy load de dados (React Query)
- Feedback visual para cada ação (toast, loading)
- Mobile-first design (comum clientes mobile)

## Alternativas de UI

| Abordagem | Prós | Contras |
|-----------|------|---------|
| Abas (tabs) | Tudo em uma página | Scroll longo |
| Sidebar | Organizado, expansível | Complexo mobile |
| Bottom nav (mobile) | Padrão apps | Espaço limitado |

## Referências

- [Design Patterns E-commerce Account](https://shopify.com/blog/shopify-demo)