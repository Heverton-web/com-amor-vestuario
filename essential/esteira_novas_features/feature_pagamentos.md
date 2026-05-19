# Feature: Pagamentos (Mercado Pago)

## Descrição

Integração com Mercado Pago para aceitar pagamentos via PIX e cartão de crédito/débito no checkout. O sistema atual já menciona "pagamento via Mercado Pago será enviado por WhatsApp" mas não possui integração real.

## Escopo

### Necessário
- [ ] Criar preferência de pagamento no Mercado Pago
- [ ] Gerar QR Code PIX para pagamento
- [ ] Criar link pagamento cartão
- [ ] Webhook para receber notificações de pagamento
- [ ] Atualizar status pedido automaticamente
- [ ] Enviar link pagamento via WhatsApp (mantendo fluxo atual)

### Desejável
- [ ] Parcelamento sem juros (configurável)
- [ ] Desconto PIX (configurável)
- [ ] Checkout transparente (sem redir)

## Dependências

| Dependência | Tipo | Motivo |
|-------------|------|--------|
| nenhuma | - | Feature foundation |

## Esforço Estimado

**16-24 horas** distribuídas em:
- Setup SDK/configuração: 2h
- Criar preferência pagamento: 4h
- Webhook handler: 6h
- Atualizar checkout: 4h
- Testes/integração: 4h

## Stack/Tech

- Mercado Pago SDK (`@mercadopago/sdk-react`)
- Supabase Edge Functions ou Cloudflare Workers (webhook)
- Variáveis ambiente: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`

## Arquitetura

```
┌─────────┐    ┌──────────────┐    ┌─────────────┐
│ Cliente │───→│ Checkout     │───→│ MP API      │
└─────────┘    │ (cria pref)  │    └─────────────┘
                    │              ↑
                    ↓              │
               ┌─────────────┐   Webhook
               │ Orders      │───→Atualiza status
               │ (status)    │
               └─────────────┘
```

## Schema DB

```sql
-- Adicionar campos na tabela orders
ALTER TABLE orders ADD COLUMN payment_id TEXT;
ALTER TABLE orders ADD COLUMN payment_status TEXT;
ALTER TABLE orders ADD COLUMN payment_method TEXT;
ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ;
```

## Fluxo

1. Cliente clica "Finalizar compra" no checkout
2. Servidor cria preferência Mercado Pago com itens do carrinho
3. Retorna URL_payment ou QR Code
4. Cliente paga (via redirect ou QR)
5. Webhook recebe notificação → atualiza order.status → baixa estoque
6. WhatsApp envia link pagamento ao cliente

## Considerações

- Usar **Sandbox** para testes antes de produção
- Armazenar `payment_id` para consulta posterior
- Implementar idempotência no webhook (evitar dupla baixa estoque)
- Timeout para pagamento: 30 min (expirar preferência)

## Files a Modificar

- `src/routes/checkout.tsx` - integrar SDK, exibir QR/link
- `supabase/functions/payment-webhook/` - novo edge function
- `src/features/vendas/services/payment.ts` - criar cliente MP

## Alternativas

| Serviço | Prós | Contras |
|---------|------|---------|
| Mercado Pago | PIX instantâneo, popular BR | Taxas |
| Stripe | API melhor, global | Sem PIX |
| PagSeguro | Popular BR | Interface antiga |

## Referências

- [Mercado Pago SDK React](https://github.com/mercadopago/sdk-react)
- [Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/overview)