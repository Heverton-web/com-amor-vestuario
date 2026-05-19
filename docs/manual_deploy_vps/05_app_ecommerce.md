# Deploy do App E-commerce

> Como fazer o deploy da aplicação na VPS usando o deploy.sh.

---

## ⚡ Visão Rápida

Vou copier os arquivos do projeto para a VPS e executar o deploy.sh.

---

## 🛠 Pré-requisitos

- ✅ Setup Orion instalado (Traefik, n8n, Evolution API)
- ✅ ListMonk instalado
- ✅ Supabase configurado
- ✅ **Bitvise** instalado no seu computador

---

## 🚀 Passo a Passo

### 1. Preparar arquivos no Computador Local

Com o **Bitvise SFTP** (ou terminal), você vai copier os seguintes arquivos para a VPS:

**Arquivos essenciais para a VPS:**

| Arquivo | Origem | Destino na VPS |
|---------|--------|----------------|
| `essential/` | pasta local | `/opt/comamor/essential/` |
| `n8n/` | pasta local | `/opt/comamor/n8n/` |
| `supabase/` | pasta local | `/opt/comamor/supabase/` |

---

### 2. Conectar via Bitvise

1. Abra o **Bitvise SSH Client**
2. Preencha:

| Campo | Valor |
|-------|-------|
| Host | `IP-DA-SUA-VPS` |
| Port | `22` |
| Username | `root` (ou seu usuário) |
| Password | sua_senha |

3. Clique em **Log In**

---

### 3. Criar diretórios na VPS

No terminal Bitvise:

```bash
mkdir -p /opt/comamor
cd /opt/comamor
```

---

### 4. Transferir arquivos via SFTP

No **Bitvise SFTP** (aba lateral):

1. Navegue até `/opt/comamor/`
2. Arraste a pasta `essential/` do seu computador
3. Arraste a pasta `n8n/` do seu computador
4. Arraste a pasta `supabase/` do seu computador

---

### 5. Configurar .env na VPS

```bash
cd /opt/comamor/essential
cp .env.example .env
nano .env
```

Preencha com suas credenciais:

```env
# Supabase
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App
VITE_APP_URL=https://comamor.com.br
NODE_ENV=production

# ListMonk
LISTMONK_URL=http://listmonk:9000
LISTMONK_API_KEY=sua_chave_aqui
LISTMONK_LIST_ID=1

# Evolution API
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=sua_chave_aqui

# Database
LISTMONK_DB_PASSWORD=sua_senha_aqui
EVOLUTION_DB_PASSWORD=sua_senha_aqui

# Webhook
WEBHOOK_URL=https://n8n.seu-dominio.com/webhook
```

---

### 6. Executar Deploy

```bash
cd /opt/comamor/essential
chmod +x deploy.sh
./deploy.sh
```

O script vai:
1. Verificar Docker Swarm
2. Criar rede se necessário
3. Fazer deploy da stack
4. Mostrar status dos serviços

---

### 7. Resultado do Deploy

Você verá algo como:

```
[INFO] Verificando Docker Swarm...
[✓] Docker Swarm está ativo
[INFO] Fazendo deploy da stack comamor...
[INFO] Deploy iniciado
[INFO] Verificando status dos serviços...

========================================
   SERVIÇOS DO DOCKER SWARM
========================================

ID             NAME                MODE           REPLICAS
abc123         comamor_n8n         replicated     1/1
def456         comamor_listmonk    replicated     1/1
ghi789         comamor_postgres    replicated     1/1
jkl012         comamor_redis       replicated     1/1

[✓] Deploy concluído!
```

---

## 🌐 URLs do App

| Serviço | URL |
|---------|-----|
| App | https://seu-dominio.com |
| n8n | https://n8n.seu-dominio.com |
| ListMonk | https://listmonk.seu-dominio.com |
| Evolution | https://evolution.seu-dominio.com |

---

## 📁 Estrutura na VPS

```
/opt/comamor/
├── essential/
│   ├── .env                  ← Suas configurações
│   ├── .env.example
│   ├── docker-compose.yaml
│   ├── deploy.sh
│   ├── README.md
│   ├── SETUP.md
│   └── esteira_novas_features/
├── n8n/
│   ├── README.md
│   └── workflows/
│       ├── 01-marketing-campaign-crud.json
│       ├── 02-followup-order-delivered.json
│       └── ... (mais 8 workflows)
└── supabase/
    └── migrations/
        └── 20260520000000_features_stack.sql
```

---

## ⚠️ Observação Importante

Como você já tem **n8n** e **Evolution API** instalados via Setup Orion, o docker-compose.yaml original que criamos pode tentar criar serviços duplicados.

** Recomendação:** Revise o `essential/docker-compose.yaml` e remova os serviços que já foram instalados pelo Setup Orion:

```yaml
# REMOVER (já instalado via Setup Orion):
# - traefik
# - n8n
# - evolution-api

# MANTER (não vem no Setup Orion):
# - listmonk
# - postgres (para ListMonk)
# - redis
```

---

## ⏭️ Próximo Passo

Agora vamos configurar os **workflows do n8n**:

→ [06_n8n_workflows.md](06_n8n_workflows.md)

---

## 📌 Comandos Úteis

```bash
# Ver status
docker service ls

# Ver logs
docker service logs comamor_listmonk

# Reiniciar serviço
docker service update --force comamor_listmonk

# Remover stack
docker stack rm comamor
```

---

*Voltar ao [Índice](00_indice.md)*