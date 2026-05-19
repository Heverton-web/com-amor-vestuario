# Mapeamento de Eventos - Ecossistema Com Amor

Este documento apresenta a especificação técnica e de negócios de todos os eventos gerados no ecossistema **Com Amor Vestuário**. Esses eventos servem como gatilhos para integrações externas (por exemplo, fluxos no N8N, envio de notificações no WhatsApp, atualização de CRM e e-mail marketing).

Todos os eventos seguem o padrão de nomenclatura: `categoria.evento_ocorrido` (em snake_case e português).

---

## 1. Categoria: Vendas (`vendas.*`)

Eventos relacionados ao ciclo de vida de pedidos, carrinhos e entregas.

### `vendas.pedido_criado`
* **Descrição:** Disparado sempre que um novo pedido é registrado na plataforma (Site ou Loja).
* **Tabela Supabase:** `public.orders`
* **Gatilho:** `INSERT` na tabela `orders`.
* **Payload Principal:**
  ```json
  {
    "event": "vendas.pedido_criado",
    "timestamp": "2026-05-19T09:35:00Z",
    "data": {
      "id": "uuid-do-pedido",
      "number": 1024,
      "customer_id": "uuid-do-cliente",
      "total_amount": 250.00,
      "status": "pending",
      "payment_method": "pix",
      "items": [
        {
          "product_id": "uuid-do-produto",
          "quantity": 2,
          "unit_price": 125.00
        }
      ]
    }
  }
  ```

### `vendas.pedido_pago`
* **Descrição:** Disparado quando o pagamento do pedido é confirmado.
* **Tabela Supabase:** `public.orders`
* **Gatilho:** `UPDATE` na tabela `orders` onde `status` muda para `paid` ou similar.

### `vendas.pedido_cancelado`
* **Descrição:** Disparado quando um pedido é cancelado administrativa ou automaticamente por falta de pagamento.
* **Tabela Supabase:** `public.orders`
* **Gatilho:** `UPDATE` na tabela `orders` onde `status` muda para `cancelled`.

### `vendas.pedido_status_alterado`
* **Descrição:** Disparado quando qualquer mudança de status ocorre no ciclo de fabricação/entrega.
* **Tabelas Supabase:** `public.orders` ou `public.kanban_cards`
* **Gatilho:** Movimentação do card do pedido nas colunas do Kanban de produção.

---

## 2. Categoria: Clube de Fidelidade (`fidelidade.*`)

Eventos relacionados à pontuação de clientes, resgates de recompensas e cupons de fidelidade.

### `fidelidade.pontos_acumulados`
* **Descrição:** Disparado quando um cliente ganha pontos (por compra ou ação especial).
* **Tabela Supabase:** `public.points_ledger`
* **Gatilho:** `INSERT` na tabela `points_ledger` com tipo positivo.
* **Payload Principal:**
  ```json
  {
    "event": "fidelidade.pontos_acumulados",
    "timestamp": "2026-05-19T09:35:00Z",
    "data": {
      "customer_id": "uuid-do-cliente",
      "points_added": 50,
      "current_balance": 350,
      "reason": "Compra realizada - Pedido #1024"
    }
  }
  ```

### `fidelidade.resgate_solicitado`
* **Descrição:** Disparado quando um cliente solicita a troca de pontos por um voucher/recompensa no Clube.
* **Tabela Supabase:** `public.redemptions`
* **Gatilho:** `INSERT` na tabela `redemptions`.

### `fidelidade.resgate_concluido`
* **Descrição:** Disparado quando o voucher resgatado é efetivamente utilizado em uma compra ou marcado como entregue pelo admin.
* **Tabela Supabase:** `public.redemptions`
* **Gatilho:** `UPDATE` na tabela `redemptions` alterando o status para concluído/utilizado.

---

## 3. Categoria: CRM & Clientes (`crm.*`)

Eventos focados no cadastro de leads e clientes na base de contatos.

### `crm.lead_capturado`
* **Descrição:** Disparado quando um visitante preenche um formulário de newsletter ou contato no Site.
* **Tabela Supabase:** `public.leads`
* **Gatilho:** `INSERT` na tabela `leads`.

### `crm.cliente_criado`
* **Descrição:** Disparado quando um novo perfil de cliente é cadastrado no ecossistema (por compra ou cadastro manual).
* **Tabela Supabase:** `public.customers` ou `public.profiles`
* **Gatilho:** `INSERT` na tabela `customers`.

### `crm.cliente_atualizado`
* **Descrição:** Disparado quando há alteração nos dados cadastrais ou preferências do cliente.
* **Tabela Supabase:** `public.customers`
* **Gatilho:** `UPDATE` na tabela `customers`.

---

## 4. Categoria: Financeiro & Faturamento (`financeiro.*`)

Eventos relacionados à emissão de faturas, recibos e parcelamentos de faturamento B2B/B2C.

### `financeiro.fatura_criada`
* **Descrição:** Disparado quando uma nova fatura de pagamento é gerada para um pedido ou orçamento.
* **Tabela Supabase:** `public.invoices`
* **Gatilho:** `INSERT` na tabela `invoices`.

### `financeiro.pagamento_confirmado`
* **Descrição:** Disparado quando uma parcela ou pagamento total de fatura é quitado.
* **Tabela Supabase:** `public.invoice_payments` ou `public.invoices`
* **Gatilho:** `INSERT` na tabela `invoice_payments` ou atualização do status de `invoices`.

### `financeiro.recibo_emitido`
* **Descrição:** Disparado quando um recibo em PDF é emitido com sucesso pelo painel administrativo.
* **Tabela Supabase:** `public.receipts`
* **Gatilho:** `INSERT` na tabela `receipts`.

---

## 5. Categoria: Orçamentos (`orcamento.*`)

Eventos do fluxo de negociação comercial com clientes de vestuário e fardamento corporativo.

### `orcamento.criado`
* **Descrição:** Disparado quando um orçamento é criado e salvo na base de dados pelo time de vendas.
* **Tabela Supabase:** `public.quotes`
* **Gatilho:** `INSERT` na tabela `quotes`.

### `orcamento.aprovado`
* **Descrição:** Disparado quando o cliente aprova o orçamento, permitindo sua conversão automática em pedido.
* **Tabela Supabase:** `public.quotes`
* **Gatilho:** `UPDATE` na tabela `quotes` alterando o status para `approved`.

### `orcamento.rejeitado`
* **Descrição:** Disparado quando o orçamento é marcado como cancelado ou recusado.
* **Tabela Supabase:** `public.quotes`
* **Gatilho:** `UPDATE` na tabela `quotes` alterando o status para `rejected` ou `cancelled`.

---

## 6. Categoria: Produtos (`produtos.*`)

Eventos associados à gestão do catálogo de mercadorias e controle de estoques.

### `produtos.estoque_alterado`
* **Descrição:** Disparado sempre que o estoque de qualquer variação ou produto é atualizado (por venda, entrada ou ajuste manual).
* **Tabela Supabase:** `public.products` (com gatilho de sincronização de estoque)
* **Gatilho:** `UPDATE` na coluna de estoque na tabela `products`.

### `produtos.esgotado`
* **Descrição:** Disparado quando o estoque de um produto de alta demanda chega a zero.
* **Tabela Supabase:** `public.products`
* **Gatilho:** `UPDATE` na tabela `products` onde o saldo de estoque passa a ser `<= 0`.

---

## 7. Integração e Roteamento de Webhooks Dinâmicos

Para permitir que cada categoria de evento ou evento específico do ecossistema Com Amor seja roteado de maneira independente em microsserviços ou fluxos específicos no N8N, a plataforma suporta a **configuração dinâmica de webhooks por evento**.

### Funcionamento e Persistência

1. **Configuração Global (Fallback):** Uma URL global é armazenada no banco de dados com `provider = 'n8n'`. Ela serve como o receptor genérico para qualquer webhook disparado.
2. **Configuração por Evento:** Para direcionar um evento específico (ex: `vendas.pedido_criado`) para um fluxo exclusivo, o sistema permite salvar uma URL customizada associada à chave `n8n:nome_do_evento` (ex: `n8n:vendas.pedido_criado`) na tabela `integration_settings`.
3. **Resolução de Roteamento:** Sempre que um evento é despachado (de forma manual na dashboard ou automaticamente pelo simulador do sistema), a rotina `dispatchWebhook` verifica no banco de dados se há um registro correspondente na tabela `integration_settings` para o provider específico daquele evento (`n8n:nome_do_evento`). Se existir, o webhook é enviado a essa URL específica; caso contrário, é feito o roteamento para a URL global do N8N.

