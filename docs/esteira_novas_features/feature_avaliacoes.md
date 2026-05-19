# Feature: Avaliações de Produtos

## Descrição

Sistema para clientes avaliarem produtos adquiridos, com nota (estrelas) e comentário textual. Similar a reviews de e-commerce.

## Escopo

### Necessário
- [ ] Avaliar produto (somente quem comprou)
- [ ] Exibir média avaliações na loja
- [ ] Listar avaliações no produto
- [ ] Aprovar/rejeitar avaliações (admin)

### Desejável
- [ ] Fotos na avaliação
- [ ] Avaliação respondida (vendedor)
- [ ] Ordenar por mais úteis
- [ ] Resumo (quantas pessoas avaliaram)

## Dependências

| Dependência | Tipo | Motivo |
|-------------|------|--------|
| #2 Autenticação | Externa | Precisaconfir-mar que comprou |
| #3 Área "Minha Conta" | Externa | Onde avalia |

## Esforço Estimado

**12-20 horas** distribuídas em:
- Schema: 2h
- Form avaliação: 4h
- Exibição na loja: 4h
- Admin aprovação: 4h
- Testes: 4h

## Stack/Tech

- Supabase (storage para fotos)
- React Hook Form (formulário)
- Star rating component

## Schema DB

```sql
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id), -- para confirmar que comprou
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  images TEXT[], -- URLs de fotos (storage)
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Média de avaliações (view para performance)
CREATE VIEW product_ratings AS
SELECT
  product_id,
  COUNT(*) as review_count,
  AVG(rating)::NUMERIC(3,2) as avg_rating
FROM product_reviews
WHERE status = 'approved'
GROUP BY product_id;
```

## Fluxo

### Cliente Avalia
1. Acessa "/conta/pedidos"
2. Seleciona pedido entregue
3. Clica "Avaliar" nos produtos
4. Preenche: estrelas (1-5), título, comentário
5. Submit → status "pending" (não visível ainda)

### Admin Aprova
1. Acessa admin.avaliacoes
2. Vê avaliações pendentes
3. Aprova ou rejeita (com motivo)
4. Se aprovada → visível na loja

### Exibição na Loja
1. Produto mostra: ★★★★☆ (4.2 - 15 avaliações)
2. Clique → abre modal com lista avaliações

## Validação

```typescript
// Apenas quem comprou pode avaliar
async function canReview(customerId, productId) {
  const { data } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('product_id', productId)
    .join('orders', 'orders.id = order_items.order_id')
    .eq('orders.customer_id', customerId)
    .eq('orders.status', 'finalizado'); // só entrega concluída

  return data.length > 0;
}
```

## UI - Form Avaliação

```
┌─────────────────────────────┐
│ Avalie este produto         │
├─────────────────────────────┤
│ ★ ★ ★ ★ ☆                   │  ← Clique para selecionar
├─────────────────────────────┤
│ Título (opcional)            │
│ [________________________]  │
├─────────────────────────────┤
│ Comentário                  │
│ [                          ] │
│ [                          ] │
│ [                          ] │
├─────────────────────────────┤
│ [Adicionar fotos]           │
├─────────────────────────────┤
│ [      Enviar avaliação    ]│
└─────────────────────────────┘
```

## UI - Exibição Produto

```
┌────────────────────────────────────┐
│ CAMISETA FLORAL                    │
│ ★★★★☆ (23 avaliações)   [Ver todas]│
└────────────────────────────────────┘
```

## Admin Page

```
/admin.avaliacoes

┌────────────────────────────────────────┐
│ Filtros: [Pendente] [Aprovadas] [Todas]│
├────────────────────────────────────────┤
│ ★★★★★ Maria - "Excelente produto"     │
│ Produto: Camiseta Floral               │
│ Data: 15/05/2026                       │
│ [✓ Aprovar] [✗ Rejeitar]              │
├────────────────────────────────────────┤
│ ★★★☆☆ João - "Tamanho pequeno"        │
│ ...                                   │
└────────────────────────────────────────┘
```

## Fotos (Opcional)

```sql
-- Storage bucket para reviews
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true);

-- Policy permitir upload apenas para quem avaliou
CREATE POLICY "Users upload review images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'review-images'
  AND auth.uid() IN (SELECT user_id FROM customers WHERE id = (SELECT customer_id FROM product_reviews WHERE id = (SELECT id FROM product_reviews WHERE created_by = auth.uid())))
);
```

## Files a Modificar/Criar

- `supabase/migrations/` - schema + view
- `src/routes/_authenticated/admin.avaliacoes.tsx`
- `src/routes/_authenticated/conta.avaliar.$orderId.$productId.tsx`
- `src/features/catalogo/components/ProductReviews.tsx`
- `src/routes/loja.tsx` - integrar reviews no produto
- `src/components/StarRating.tsx` - componente reutilizável

## Considerações

- **Anti-spam**: limite 1 avaliação por produto/pedido
- **Média cache**: usar view (ou cache manual) para não calcular sempre
- **Estrelas**: 5 pontos, meias estrelas (★☆) = .5
- **Ordenação**: mais úteis primeiro (helpful_count)

## Alternativas

| Abordagem | Prós | Contras |
|-----------|------|---------|
| only purchased | Confiável | Limita volume |
| any logged | Mais avaliações | Pode ser fake |
| any (no auth) | Volume máximo | Spam |

## Referências

- [Star Rating UX](https://www.nngroup.com/articles/rating-visuals/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)