# Feature: E-mail Transacional

## Descrição

Sistema de envio de e-mails transacionais para eventos do e-commerce: confirmação de pedido, status atualizado, recuperação de senha, etc.

## Escopo

### Necessário
- [ ] Confirmação de pedido (ao criar)
- [ ] Notificação pagamento recebido
- [ ] Status atualizado (separado, enviado, entregue)
- [ ] Recuperação de senha

### Desejável
- [ ] Boas-vindas (cadastro)
- [ ] Newsletter (promoções)
- [ ] Abandoned cart (carrinho abandonado)
- [ ] Nota fiscal eletrônica (NFe)

## Dependências

| Dependência | Tipo | Motivo |
|-------------|------|--------|
| nenhuma | - | Pode implementar independente |

## Esforço Estimado

**12-20 horas** distribuídas em:
- Setup provider: 2h
- Template e-mails: 6h
- Envio triggers: 6h
- Testes: 4h

## Stack/Tech

- **Resend** (recomendado) ou SendGrid
- Supabase Edge Functions (triggers)
- React Email (templates)
- Domínio configurado (DKIM, SPF)

## Providers

| Provider | Prós | Contras |
|----------|------|---------|
| Resend | API moderna, bom free tier | Novo |
| SendGrid | Popular, bom dashboard | Legacy |
| AWS SES | Barato, flexível | Complexo |
| Postmark | Foco transacional | Menor free tier |

## Templates Necessários

### 1. Confirmação Pedido
```
Assunto: Pedido {code} confirmado! 📦

Olá {name}!

Seu pedido foi recebido com sucesso.

Pedido: {code}
Data: {date}
Itens: {itens}
Total: {total}
Frete: {shipping}

{total > 200 ? "Frete grátis!" : "Em breve enviaremos o link de pagamento."}

Obrigado pela compra!
{brand_name}
```

### 2. Pagamento Recebido
```
Assunto: Pagamento confirmado! 🎉

Olá {name}!

Seu pagamento foi confirmado!
Pedido: {code}
Pagamento: {payment_method}
Valor: {total}

Estamos separando seu pedido.
```

### 3. Pedido Enviado
```
Assunto: Seu pedido foi enviado! 🚚

Olá {name}!

Seu pedido está a caminho!

Código rastreamento: {tracking_code}
Transportadora: {carrier}

Acompanhe: {tracking_url}
```

### 4. Recuperação Senha
```
Assunto: Redefinir sua senha

Olá {name}!

Clique para criar nova senha:
{reset_link}

Este link expira em 1 hora.
```

## Arquitetura

```
┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│ Evento       │───→│ Edge         │───→│ Provider    │
│ (create order)│    │ Function     │    │ (Resend)    │
└──────────────┘    └──────────────┘    └─────────────┘
```

## Integração com Supabase

```typescript
// supabase/functions/send-order-confirmation/index.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: Request) {
  const { order_id, customer_email, customer_name } = await req.json();

  await resend.emails.send({
    from: 'Com Amor <contato@comamor.com.br>',
    to: customer_email,
    subject: `Pedido confirmado!`,
    html: await renderTemplate('order-confirmed', {
      name: customer_name,
      orderId: order_id
    })
  });

  return Response.json({ success: true });
}
```

## Trigger DB (PostgreSQL)

```sql
-- Enviar e-mail quando pedido criado
CREATE OR REPLACE FUNCTION public.send_order_email()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM net.http_post(
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.edge_function_key') || '"}',
    url: current_setting('app.settings.edge_function_url') || 'https://xxx.supabase.co/functions/v1/send-order-email',
    body:=jsonb_build_object(
      'order_id', NEW.id,
      'customer_email', (SELECT email FROM customers WHERE id = NEW.customer_id),
      'customer_name', (SELECT name FROM customers WHERE id = NEW.customer_id)
    )
  );
  RETURN NEW;
END;
$$;
```

## Setup Domínio

1. Adicionar domínio no provider (Resend/SendGrid)
2. Configurar DNS:
   - **SPF**: `v=spf1 include:resend.com ~all`
   - **DKIM**: `dkim._domainkey IN TXT "v=DKIM1; k=rsa; p=..."`
   - **DMARC**: `v=DMARC1; p=none`
3. Aguardar propagação (até 48h)
4. Verificar entrega em ferramentas do provider

## Files a Modificar/Criar

- `.env` - adicionar API key
- `supabase/functions/send-order-email/`
- `supabase/functions/send-status-update/`
- `emails/` - templates React Email
- `src/features/vendas/services/email.ts` - wrapper

## Considerações

- **Testar** com caixa postal real durante dev
- **Spam**: evitar palavras spam, manter sender rep
- **Unsubscribe**: obrigatório (LGPD)
- **Templates**: criar em React Email (type-safe)
- **Fallback**: se email falhar, não bloquear checkout

## Alternativas

| Abordagem | Prós | Contras |
|-----------|------|---------|
| Resend + React Email | Type-safe, bonito | Setup |
| HTML inline | Flexivel | Manutenção difícil |
| SendGrid Dashboard | Sem código | Menos controle |

## Referências

- [Resend Docs](https://resend.com/docs)
- [React Email](https://react.email/)
- [LGPD - E-mail marketing](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)