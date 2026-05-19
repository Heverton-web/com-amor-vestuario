# Feature: Rastreamento de Pedido

## Descrição

Sistema para cliente acompanhar status do pedido em tempo real, com timeline visual e código de rastreamento quando enviado.

## Escopo

### Necessário
- [ ] Timeline de status (visual)
- [ ] Status atual do pedido
- [ ] Notificação mudança status
- [ ] Código rastreamento (opcional)
- [ ] Data prevista entrega

### Desejável
- [ ] Notificação WhatsApp
- [ ] Tracking integrado (Correios, Jadlog)
- [ ] Histórico completo (todas mudanças)

## Dependências

| Dependência | Tipo | Motivo |
|-------------|------|--------|
| #1 Pagamentos | Externa | Status "pago" precisa estar funcionando |

## Esforço Estimado

**8-16 horas** distribuídas em:
- Schema + campos: 2h
- Timeline component: 4h
- Integração Minha Conta: 4h
- Notificações: 4h
- Testes: 2h

## Stack/Tech

- Supabase (realtime optional)
- Timeline UI component

## Schema DB

```sql
-- Adicionar na tabela orders
ALTER TABLE orders ADD COLUMN tracking_code TEXT;
ALTER TABLE orders ADD COLUMN tracking_url TEXT;
ALTER TABLE orders ADD COLUMN carrier TEXT; -- 'correios', 'jadlog', etc

-- Nova tabela para logs de status
CREATE TABLE public.order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  status order_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para criar log quando status mudar
CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO order_status_logs (order_id, status, note)
    VALUES (NEW.id, NEW.status, NEW.notes);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_status ON orders;
CREATE TRIGGER trg_log_order_status
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status();
```

## Fluxo

```
Status: realizado → separado → pago → enviado → finalizado

realizado: Pedido criado, aguardando pagamento
separado: Pago confirmado, separando pedido
pago: Pago確認 (legacy, manter retrocompat)
enviado: Enviado com código rastreamento
finalizado: Entregue ao cliente
```

## Timeline UI

```
●──────●──────●──────●──────●
realizado  separado  enviado  finalizado

[●]realizado    15/05 14:30
[●]separado     16/05 09:15
[○]enviado      ---
[○]finalizado   ---
```

## Campos na Order

| Campo | Tipo | Descrição |
|-------|------|-----------|
| status | enum | Status atual |
| separated_at | timestamptz | Quando separou |
| paid_at | timestamptz | Quando pagou |
| shipped_at | timestamptz | Quando enviou |
| finished_at | timestamptz | Quando entregou |
| tracking_code | text | Código rastreamento |
| tracking_url | text | URL acompanhamento |
| carrier | text | Transportadora |

## Notificações

### Por Status

| Status | Notificação |
|--------|-------------|
| separado | "Seu pedido foi separado! Em breve enviaremos." |
| enviado | "Pedido enviado! Código: XXXXXX" |
| finalized | "Pedido entregue! Avalie sua experiência." |

### Canais
- WhatsApp (via Twilio ou similar)
- E-mail (see feature_email_transacional)

## Files a Modificar

- `supabase/migrations/` - schema
- `src/features/vendas/components/OrderTimeline.tsx` - novo
- `src/routes/conta.pedidos.$id.tsx` - detalhe
- `src/features/vendas/services/notifications.ts` - novo

## Considerações

- Usar status já existentes (não criar novos)
- "pago" é confuso (significa "separado"?) - manter retrocompat
- Tracking URL pode ser vazio (cliente ligando informar)
- Log permite troubleshooting (histórico completo)

## Alternativas

| Abordagem | Prós | Contras |
|-----------|------|---------|
| Manual (admin digita) | Simples | Trabajo manual |
| API transportadora | Automatico | Complexo |
| WhatsApp only | Barato | Sem historico |

## Referências

- [Timeline Design Pattern](https://ui-patterns.com/timeline)
- [Correios Rastreamento API](https://developers.correios.com.br)