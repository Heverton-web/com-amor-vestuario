# Introdução - Manual de Deploy

> Visão geral do projeto, arquitetura e componentes.

---

## 🎯 Visão Geral

Este manual ensina como configurar a infraestrutura completa de automação de marketing para o e-commerce **Com Amor Vestuário** em uma VPS Contabo.

A stack inclui:
- **E-commerce**: Aplicação React/Next.js com Supabase
- **Automação**: n8n para workflows de marketing
- **WhatsApp**: Evolution API para mensagens
- **E-mail**: ListMonk para newsletter e automações

---

## 🏗 Arquitetura da Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TRAEFIK (Reverse Proxy)                    │
│                  HTTPS automático (Let's Encrypt)              │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   n8n         │    │  ListMonk     │    │  Evolution    │
│  (5678)       │    │   (9000)      │    │    API        │
│               │    │               │    │    (8080)     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE                                   │
│              (Banco + Auth + Realtime)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   APP E-COMMERCE                                │
│             (lojacomamor.com.br / localhost)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes

### 1. Traefik (via Setup Orion)
- Reverse proxy com SSL automático
- Gerencia rotas para todos os serviços
- Porta: 80, 443, 8080 (dashboard)

### 2. Portainer (via Setup Orion)
- Interface visual para Docker
- Gerenciamento de containers
- URL: `https://portainer.seu-dominio.com`

### 3. n8n (via Setup Orion)
- Automação de workflows
- 10 workflows prontos (em `n8n/workflows/`)
- URL: `https://n8n.seu-dominio.com`

### 4. Evolution API (via Setup Orion)
- WhatsApp Business API
- Envio e recebimento de mensagens
- URL: `https://evolution.seu-dominio.com`

### 5. ListMonk (INSTALAÇÃO MANUAL)
- Servidor de e-mail self-hosted
- Newsletter e automações de e-mail
- URL: `https://listmonk.seu-dominio.com`

### 6. Supabase (Escolha uma opção)
- **Opção A - Cloud**: [supabase.com](https://supabase.com)
- **Opção B - Local**: Instalação via Setup Orion

### 7. App E-commerce
- Aplicação principal
- Deploy via `deploy.sh`
- Conexão com Supabase

---

## 🔗 Fluxo de Dados

### Compra Online
```
Usuário → App E-commerce → Supabase → n8n → Evolution API → WhatsApp
                                     ↓
                               ListMonk → E-mail
```

### Automação de Marketing
```
n8n (Workflow)
    │
    ├──→ Evolution API ──→ WhatsApp do cliente
    │
    ├──→ ListMonk ──→ E-mail do cliente
    │
    └──→ Supabase ──→ Armazenar dados
```

---

## 📋 Pré-requisitos

### Servidor
| Recurso | Mínimo | Recomendado |
|---------|--------|------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disco | 40 GB | 80 GB |
| OS | Ubuntu 20.04 | Ubuntu 22.04 |

### Domínio
- Domínio registrado (ex: `comamor.com.br`)
- Acesso ao DNS para criar registros

### Acesso
- Acesso SSH ao servidor (usuário com sudo)
- credentials do Supabase (se usar Cloud)

---

## 🚀 Próximos Passos

| Passo | Ação |
|-------|------|
| 1 | Executar Setup Orion → [02_setup_orion.md](02_setup_orion.md) |
| 2 | Instalar ListMonk → [03_listmonk.md](03_listmonk.md) |
| 3 | Configurar Supabase → [04_supabase_cloud.md](04_supabase_cloud.md) ou [04_supabase_local.md](04_supabase_local.md) |
| 4 | Deploy App → [05_app_ecommerce.md](05_app_ecommerce.md) |
| 5 | Configurar n8n → [06_n8n_workflows.md](06_n8n_workflows.md) |
| 6 | Verificar → [07_verificacao.md](07_verificacao.md) |

---

*Voltar ao [Índice](00_indice.md)*