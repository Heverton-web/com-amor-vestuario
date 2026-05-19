# Feature: Wishlist (Lista de Desejos)

## Descrição

Funcionalidade para clientes salvarem produtos de interesse, semelhante ao "favoritar" ou " lista de desejos" de grandes e-commerces.

## Escopo

### Necessário
- [ ] Salvar produto na wishlist
- [ ] Remover produto da wishlist
- [ ] Visualizar wishlist completa
- [ ]Persistência (login não obrigatório para adicionar)

### Desejável
- [ ] "Avise-me quando chegar" (notify)
- [ ] Compartilhar wishlist
- [ ] Adicionar ao carrinho da wishlist
- [ ] Wishlist pública (share link)

## Dependências

| Dependência | Tipo | Motivo |
|-------------|------|--------|
| #2 Autenticação | Externa | Opcional, mas recomenda-se |

## Esforço Estimado

**12-16 horas** distribuídas em:
- Schema: 2h
- Botão wishlist na loja: 4h
- Página wishlist: 4h
- Persistência (localStorage ou DB): 4h
- Testes: 2h

## Stack/Tech

- Supabase (se logado) ou localStorage (se guest)
- TanStack Query (sincronização)

## Schema DB

```sql
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  guest_id TEXT, -- para usuários não logados (localStorage)
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, product_id),
  UNIQUE(guest_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas sua wishlist
CREATE POLICY "Users view own wishlist" ON wishlists FOR SELECT
  USING (customer_id = auth.uid() OR guest_id = current_setting('app.guest_id', true));
```

## Arquitetura

```
┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│ Produto      │───→│ Wishlist     │───→│ DB (logado) │
│ (botão ♥)   │    │ Service      │    │ ou LS (guest)│
└──────────────┘    └──────────────┘    └─────────────┘
```

## Fluxo

### Usuário Logado
1. Clica ♥ no produto
2. Salva no DB com `customer_id`
3. Wishlist sincronizada em todos dispositivos

### Usuário Não-Logado (Guest)
1. Clica ♥ no produto
2. Salva em localStorage com `guest_id` (UUID aleatório)
3. Ao fazer login → migrar para DB (merge)

## Componente Botão Wishlist

```tsx
function WishlistButton({ productId }) {
  const { data: isWishlisted } = useQuery({
    queryKey: ['wishlist', productId],
    queryFn: () => checkWishlist(productId)
  });

  async function toggle() {
    if (isWishlisted) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
    queryClient.invalidateQueries(['wishlist', productId]);
  }

  return (
    <button onClick={toggle}>
      {isWishlisted ? <HeartFilled /> : <HeartOutline />}
    </button>
  );
}
```

## Página Wishlist

```
/conta/wishlist

┌────────────────────────────────────┐
│ ♥ Minha Wishlist (3 itens)        │
├────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐  │
│ │ img    │ │ img    │ │ img    │  │
│ │ nome   │ │ nome   │ │ nome   │  │
│ │ preço  │ │ preço  │ │ preço  │  │
│ │[carr]  │ │[carr]  │ │[carr]  │  │
│ └────────┘ └────────┘ └────────┘  │
└────────────────────────────────────┘
```

## Notificação "Avise-me"

```sql
CREATE TABLE public.product_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  email TEXT,
  phone TEXT,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- Quando produto volta ao estoque → notifica (e-mail/WhatsApp)
- Usar mesma estrutura que lead (via kanban)

## Migration

```sql
-- UUID aleatório para guests
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Seed para novo guest
-- client gera: localStorage.setItem('guest_id', uuidv4())
```

## Files a Modificar/Criar

- `supabase/migrations/` - schema wishlist
- `src/features/vendas/services/wishlist.ts` - novo service
- `src/components/WishlistButton.tsx` - botão
- `src/routes/wishlist.tsx` ou `/conta/wishlist.tsx`
- `src/routes/loja.tsx` - adicionar botão aos produtos

## Considerações

- **Merge ao fazer login**: se guest tem wishlist, migrar para user
- **Limite**: máximo 50 produtos por wishlist (evitar spam)
- **UI**: ícone cheio (♥) vs outlines (♡) para estado
- **Performance**: lazy load wishlist (não carregar na home)

## Alternativas

| Abordagem | Prós | Contras |
|-----------|------|---------|
| DB + Guest ID | Sincronizado | Complexo |
| localStorage only | Simples | Sem login, perdido |
| Session | Simples | Perde ao fechar |

## Referências

- [localForage](https://localforage.github.io/) - localStorage wrapper
- [TanStack Query](https://tanstack.com/query) - caching