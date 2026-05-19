# Configuração Dinâmica de Webhooks por Evento - Ambiente Dev

Este documento detalha o funcionamento e o walkthrough de validação da nova funcionalidade de **Roteamento Dinâmico de Webhooks por Evento** no painel administrativo do desenvolvedor do ecossistema **Com Amor Vestuário**.

---

## 1. O Problema Resolvido

Anteriormente, o sistema contava apenas com uma única URL global para webhooks do N8N. Isso exigia a criação de um fluxo único e centralizado no N8N para fazer a triagem e roteamento manual baseado no tipo de evento.

Com a nova funcionalidade:
- O desenvolvedor pode definir uma URL de destino de webhook **individual para cada evento** do sistema.
- A aplicação busca de forma automática a URL customizada de cada evento ao selecioná-lo no formulário.
- Caso o evento selecionado não possua uma URL dedicada salva, a aplicação faz o fallback automático para a URL geral do N8N (ou o padrão do sistema).
- É possível persistir essa configuração na tabela `integration_settings` sob demanda, marcando a opção **"Salvar esta URL no Banco de Dados"** antes de realizar o disparo.

---

## 2. Detalhes de Implementação Técnica

### Persistência de Chaves
Reaproveitamos a tabela `integration_settings` de forma dinâmica através do uso de prefixos no campo `provider`. Os registros são salvos com a seguinte estrutura lógica:
* **Geral:** `provider = 'n8n'`
* **Por Evento:** `provider = 'n8n:categoria.nome_do_evento'` (ex: `n8n:vendas.pedido_criado`, `n8n:produtos.esgotado`)

### Roteamento na Despachante (`webhook-dispatcher.ts`)
A função principal de disparo `dispatchWebhook` foi atualizada:
```typescript
export async function dispatchWebhook(
  eventType: string,
  payload: any,
  customWebhookUrl?: string,
): Promise<Omit<WebhookLog, "id" | "created_at">> {
  let webhookUrl = customWebhookUrl || "";
  
  if (!customWebhookUrl) {
    // 1. Tenta buscar configuração específica do evento (n8n:evento)
    // 2. Se não houver, busca a configuração global (n8n)
    // 3. Fallback final para a URL padrão
  }
  
  // Efetua o POST HTTP no destino selecionado...
}
```

---

## 3. Walkthrough de Testes e Validação Visual

Para certificar que o visual ficou premium e que a sincronização de estados no formulário funciona perfeitamente, realizamos o seguinte teste automatizado via navegador:

1. **Acesso e Login:** Acessamos a tela de login do painel administrativo em `http://localhost:8080/login` e efetuamos o login rápido utilizando a conta de demonstração do administrador.
2. **Navegação:** Fomos até a URL `/admin/dev` onde se localiza o **Console de Desenvolvedor**.
3. **Seleção e Alteração:** 
   * Na aba **N8N Webhooks**, selecionamos o evento `vendas.pedido_criado` e alteramos a URL no input para `http://localhost:5678/webhook/pedido-criado-custom`.
   * Marcamos a opção **"Salvar esta URL no Banco de Dados"** e clicamos em **"Disparar Webhook no N8N"**.
   * O sistema executou o disparo, realizou a persistência no banco e retornou sucesso no painel lateral.
4. **Alternância Dinâmica de Eventos:**
   * Trocamos o dropdown para o evento `vendas.pedido_pago`. O campo de URL mudou automaticamente de volta para a URL global de fallback.
   * Ao retornar a seleção para `vendas.pedido_criado`, o campo **recarregou de forma instantânea** a URL customizada persistida anteriormente (`http://localhost:5678/webhook/pedido-criado-custom`).

Abaixo está o registro da execução dos testes:

![Registro de Execução de Testes](/C:/Users/trcnologia/.gemini/antigravity/brain/0b1b63ff-b25c-45f9-b31f-e19c2fe0544d/.tempmediaStorage/media_0b1b63ff-b25c-45f9-b31f-e19c2fe0544d_1779193679933.png)

A funcionalidade está homologada e pronta para o uso!
