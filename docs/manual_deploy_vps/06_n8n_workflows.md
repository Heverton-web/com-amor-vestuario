# n8n Workflows - Configuração

> Como importar e configurar os 10 workflows de automação.

---

## ⚡ Visão Rápida

O projeto inclui **10 workflows prontos** para automação de marketing que você vai importar no n8n.

---

## 📂 Localização dos Workflows

```
/opt/comamor/n8n/workflows/
├── 01-marketing-campaign-crud.json
├── 02-followup-order-delivered.json
├── 03-abandoned-cart.json
├── 04-birthday.json
├── 05-points-expiring.json
├── 06-wholesale-approved.json
├── 07-newsletter-weekly.json
├── 08-new-order-notification.json
├── 09-low-stock-alert.json
└── 10-new-product-notification.json
```

---

## 🚀 Passo a Passo

### 1. Acesse o n8n

```
https://n8n.seu-dominio.com
```

---

### 2. Importar Workflow

1. Clique em **Workflows** (menu lateral)
2. Clique em **Import from File**
3. Selecione o arquivo JSON

**Repita para todos os 10 arquivos**

---

### 3. Configurar Credenciais

Cada workflow precisa de credenciais. Você precisa criar:

#### A. Supabase

1. **Settings** → **Credentials**
2. **Add Credential** → **Supabase**
3. Preencha:

| Campo | Valor |
|-------|-------|
| Name | Supabase Main |
| URL | `https://xxxxxx.supabase.co` |
| Key | `SUPABASE_SERVICE_ROLE_KEY` |

Clique em **Save**.

---

#### B. Evolution API

1. **Add Credential** → **HTTP Request**
2. Preencha:

| Campo | Valor |
|-------|-------|
| Name | Evolution API |
| Authentication | Preemptive Credential |
| URL | `http://evolution-api:8080` |
| Username | (vazio) |
| Password | `EVOLUTION_API_KEY` |

**Ou use Header Authentication:**

| Campo | Valor |
|-------|-------|
| Authentication | Custom Header |
| Header Name | `apikey` |
| Header Value | `SUA_EVOLUTION_API_KEY` |

---

#### C. ListMonk

1. **Add Credential** → **HTTP Request**
2. Preencha:

| Campo | Valor |
|-------|-------|
| Name | ListMonk API |
| Authentication | Basic Auth |
| URL | `http://listmonk:9000` |
| Username | `listmonk` |
| Password | `LISTMONK_API_KEY` |

---

### 4. Ativar Workflows

Após configurar as credenciais:

1. Clique no workflow
2. Clique em **Activate** (toggle no canto superior direito)

---

## 📋 Descrição dos Workflows

### 01 - Marketing Campaign CRUD
- **Função**: Criar/listar campanhas de marketing
- **Trigger**: Manual
- **Uso**: Gerenciar campanhas pelo n8n

---

### 02 - Follow-up Order Delivered
- **Função**: Enviar mensagem 3 dias após entrega
- **Trigger**: Supabase (watch orders)
- **Serviços**: Evolution API (WhatsApp)

---

### 03 - Abandoned Cart
- **Função**: Recuperar carrinhos abandonados
- **Trigger**: A cada 30 minutos
- **Serviços**: Evolution API + Supabase

---

### 04 - Birthday
- **Função**: Enviar mensagem de aniversário
- **Trigger**: Diário 9h00
- **Serviços**: Evolution API + Supabase

---

### 05 - Points Expiring
- **Função**: Avisar clientes sobre pontos expirando
- **Trigger**: Segunda-feira 10h00
- **Serviços**: Evolution API + Supabase

---

### 06 - Wholesale Approved
- **Função**: Welcome para novos lojistas aprovados
- **Trigger**: Supabase (watch wholesale_requests)
- **Serviços**: Evolution API

---

### 07 - Newsletter Weekly
- **Função**: Enviar newsletter semanal
- **Trigger**: Quarta-feira 9h00
- **Serviços**: ListMonk

---

### 08 - New Order Notification
- **Função**: Notificar admin sobre novos pedidos
- **Trigger**: Supabase (watch orders)
- **Serviços**: Evolution API (WhatsApp admin)

---

### 09 - Low Stock Alert
- **Função**: Alertar sobre estoque baixo (≤5)
- **Trigger**: Diário 8h00
- **Serviços**: Evolution API (WhatsApp admin)

---

### 10 - New Product Notification
- **Função**: Notificar clientes sobre produtos novos
- **Trigger**: Supabase (watch products)
- **Serviços**: ListMonk + Evolution API

---

## 🔧 Configuração de Variáveis

Em cada workflow, você pode ajustar:

- **Números de telefone**: Substitua pelos números reais
- **IDs de listas**: Ajuste o ListMonk List ID
- **Horários**: Modifique os schedules

---

## ✅ Verificação

1. **Workflows Ativos**: Você deve ver o toggle verde em cada um
2. **Teste Manual**: Clique em "Test Workflow" para verificar
3. **Ver Logs**: Clique em "Executions" para ver histórico

---

## ⏭️ Próximo Passo

Agora vamos fazer a **Verificação Final**:

→ [07_verificacao.md](07_verificacao.md)

---

## 📌 Dicas

### Rate Limit do WhatsApp
- Adicione nodes de "Wait" entre envios
- Recomendado: 10-20 segundos entre mensagens

### Debug
- Use "Log" nodes temporários
- Verifique "Executions" para ver erros

---

*Voltar ao [Índice](00_indice.md)*