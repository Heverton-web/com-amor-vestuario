# Supabase Cloud (Opção A)

> Configuração do Supabase externo (cloud.supabase.com).

---

## ⚡ Visão Rápida

Esta é a **opção recomendada** se você já tem um projeto Supabase no cloud.supabase.com

---

## 🎯 Pré-requisitos

- ✅ Projeto Supabase criado em [supabase.com](https://supabase.com)
- ✅ Acesso ao painel do Supabase

---

## 🔧 Configuração

### 1. Acesse o Supabase

1. Vá para [supabase.com](https://supabase.com)
2. Faça login
3. Selecione seu projeto

---

### 2. Obter Credenciais

#### URL do Projeto

No painel do projeto, você verá:

```
https://xxxxxx.supabase.co
```

Guarde esta URL.

---

#### API Keys

1. **Settings** (ícone de engrenagem) → **API**
2. Você verá:

| Key | Valor |
|-----|-------|
| Project URL | `https://xxxxxx.supabase.co` |
| anon public | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| service_role | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

⚠️ **Use a key `service_role` apenas no backend/n8n** (ela ignora RLS)

---

### 3. Executar Migration

O projeto já inclui o arquivo de migration:

```
supabase/migrations/20260520000000_features_stack.sql
```

#### Via Dashboard Supabase

1. **SQL Editor** no menu
2. Clique em **"New query"**
3. Copie o conteúdo do arquivo `20260520000000_features_stack.sql`
4. Execute (Run)

#### Via CLI

```bash
# Se tiver o CLI instalado
supabase db push
```

---

### 4. Configurar no .env do Servidor

No servidor (VPS), edite o arquivo `.env` em `essential/`:

```env
# Supabase
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
```

---

### 5. Configurar no n8n

No n8n, ao configurar as credenciais:

| Campo | Valor |
|-------|-------|
| URL | `https://xxxxxx.supabase.co` |
| Key | `SUPABASE_SERVICE_ROLE_KEY` (service_role) |

---

## 📋 Checklist

- [ ] URL do Supabase copiada
- [ ] anon key copiada
- [ ] service_role key copiada
- [ ] Migration executada
- [ ] .env configurado na VPS

---

## 📊 Estrutura do Banco

A migration cria as seguintes tabelas para as novas features:

| Tabela | Função |
|--------|--------|
| `customers` | Dados dos clientes |
| `customer_addresses` | Endereços de entrega |
| `wholesale_requests` | Solicitações de atacado |
| `wishlists` | Listas de desejo |
| `product_reviews` | Avaliações de produtos |
| `marketing_campaigns` | Campanhas de marketing |
| `marketing_campaign_logs` | Log de campanhas |
| `abandoned_carts` | Carrinhos abandonados |

---

## 🔐 Row Level Security (RLS)

O Supabase usa RLS por padrão. Para o n8n funcionar corretamente, você precisa:

1. **Desabilitar RLS** nas tabelas novas (temporariamente), OU
2. **Criar uma política** que permita o service_role

No SQL Editor:

```sql
-- Desabilitar RLS na tabela (para development)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- Repita para outras tabelas...
```

---

## ⏭️ Próximo Passo

Agora vamos fazer o **Deploy do App E-commerce**:

→ [05_app_ecommerce.md](05_app_ecommerce.md)

---

## 📌 Alternativa

Se você instalou o Supabase via Setup Orion (opção local), vá para:

→ [04_supabase_local.md](04_supabase_local.md)

---

*Voltar ao [Índice](00_indice.md)*