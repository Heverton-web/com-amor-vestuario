# Feature: E-mail Transacional

## Descrição

Sistema de envio de e-mails transacionais para eventos do e-commerce: confirmação de pedido, status atualizado, recuperação de senha, etc. Utiliza ListMonk (self-hosted) como motor de envio.

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
| #9 Marketing Automation | Externa | Pode usar ListMonk instalado |

## Esforço Estimado

**12-20 horas** distribuídas em:
- Setup ListMonk/configuração: 2h
- Template e-mails: 6h
- Integração n8n: 6h
- Testes: 4h

## Stack/Tech

- **ListMonk** (self-hosted no Docker Swarm)
- **n8n** (triggers via API)
- Supabase (dados)
- React Email (templates para desenvolvimento)

## Providers

| Provider | Prós | Contras |
|----------|------|---------|
| ListMonk (self) | Livre, completo, API | Setup manual |
| Resend | API moderna, bom free tier | Custo mensal |
| SendGrid | Popular, bom dashboard | Legacy, custo |

> **Decisão**: Usar ListMonk (já instalado na VPS) para manter consistência com Marketing Automation.

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
│ Evento       │───→│ n8n          │───→│ ListMonk    │
│ (create order)│    │ (workflow)   │    │ (envia)     │
└──────────────┘    └──────────────┘    └─────────────┘
```

## Integração n8n → ListMonk

```json
{
  "nodes": [
    {
      "name": "Supabase Trigger",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "watchChanges",
        "table": "orders",
        "triggerField": "status"
      }
    },
    {
      "name": "Switch",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "dataType": "string",
        "value1": "{{$json.status}}",
        "rules": {
          "rules": [
            {"value2": "realizado", "output": 0},
            {"value2": "pago", "output": 1},
            {"value2": "enviado", "output": 2}
          ]
        }
      }
    },
    {
      "name": "ListMonk",
      "type": "n8n-nodes-base.listmonk",
      "parameters": {
        "operation": "sendTransactional",
        "templateId": "{{$json.template_id}}",
        "email": "{{$json.customer_email}}"
      }
    }
  ]
}
```

## Setup ListMonk

1. Acessar ListMonk via nginx reverse proxy
2. Criar conta admin inicial
3. Configurar SMTP relay (ou usar built-in)
4. Criar templates transacionais
5. Obter API Key para n8n

## Files a Modificar/Criar

- `n8n/workflows/01-order-confirmation.json` - workflow
- `n8n/workflows/02-payment-received.json` - workflow
- `n8n/workflows/03-order-shipped.json` - workflow
- `src/features/vendas/services/email.ts` - wrapper (opcional)
- Configuração nginx para ListMonk

## Considerações

- **Spam**: evitar palavras spam, manter sender rep
- **Unsubscribe**: obrigatório (LGPD)
- **Fallback**: se email falhar, não bloquear checkout
- **Métricas**: ListMonk dashboard já fornece aberturas/cliques

## Alternativas

| Abordagem | Prós | Contras |
|-----------|------|---------|
| ListMonk (self) | Livre, completo | Setup manual |
| Resend + React Email | Type-safe, bonito | Custo |
| HTML inline | Flexivel | Manutenção difícil |

## Referências

- [ListMonk Docs](https://listmonk.app/docs/)
- [n8n ListMonk Node](https://github.com/n8n-io/n8n-nodes-listmonk)
- [LGPD - E-mail marketing](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)