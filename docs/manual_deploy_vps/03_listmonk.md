# ListMonk - Instalação do Servidor de E-mail

> Manual para instalar e configurar o ListMonk (não incluso no Setup Orion).

---

## ⚡ Visão Rápida

O **ListMonk** é um servidor de e-mail self-hosted que usaremos para:
- Newsletter semanal
- E-mails transacionais
- Automação de marketing por e-mail

**IMPORTANTE**: O ListMonk NÃO vem no Setup Orion - precisa ser instalado manualmente.

---

## 🐳 Instalação via Docker

### 1. Criar diretório

```bash
mkdir -p /opt/listmonk
cd /opt/listmonk
```

---

### 2. Criar arquivo docker-compose.yaml

```bash
nano docker-compose.yaml
```

Cole o seguinte conteúdo:

```yaml
version: '3.8'

services:
  listmonk:
    image: listmonk/listmonk:latest
    container_name: listmonk
    restart: unless-stopped
    ports:
      - "9000:9000"
    environment:
      - LISTMONK_PORT=9000
      - LISTMONK_DB_HOST=postgres
      - LISTMONK_DB_PORT=5432
      - LISTMONK_DB_USER=listmonk
      - LISTMONK_DB_PASSWORD=${LISTMONK_PASS}
      - LISTMONK_DB_NAME=listmonk
      - LISTMONK_DB_SSL_MODE=disable
    volumes:
      - ./listmonk-data:/listmonk
      - ./listmonk-uploads:/var/listmonk/uploads
    depends_on:
      - postgres
    networks:
      - listmonk-network

  postgres:
    image: postgres:15-alpine
    container_name: listmonk-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=listmonk
      - POSTGRES_PASSWORD=${LISTMONK_PASS}
      - POSTGRES_DB=listmonk
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    networks:
      - listmonk-network

networks:
  listmonk-network:
    driver: bridge
```

---

### 3. Criar arquivo .env

```bash
nano .env
```

Adicione:

```env
LISTMONK_PASS=sua_senha_segura_aqui
```

Gere uma senha segura:
```bash
openssl rand -hex 16
```

---

### 4. Iniciar o container

```bash
docker compose up -d
```

---

### 5. Configurar no Traefik

Adicione labels ao container no Portainer ou edite o docker-compose com as labels do Traefik:

```yaml
services:
  listmonk:
    # ... config anterior ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.listmonk.rule=Host(`listmonk.seu-dominio.com`)"
      - "traefik.http.routers.listmonk.entrypoints=web,websecure"
      - "traefik.http.routers.listmonk.tls.certresolver=letsencrypt"
      - "traefik.http.services.listmonk.loadbalancer.server.port=9000"
```

Reinicie:
```bash
docker compose down && docker compose up -d
```

---

## 🌐 Primeiro Acesso

### URL
```
https://listmonk.seu-dominio.com
```

### Credenciais padrão
- **Usuário**: `listmonk`
- **Senha**: `listmonk`

⚠️ **Mude a senha imediatamente!**

---

## ⚙️ Configuração Inicial

### 1. Alterar senha admin

1. Vá em **Settings** → **Admin**
2. Altere username e senha

---

### 2. Configurar SMTP (Envio de E-mails)

O ListMonk precisa de um SMTP para enviar e-mails.

#### Opção A: Gmail / Google Workspace

1. **Settings** → **SMTP**
2. Preencha:

| Campo | Valor |
|-------|-------|
| Host | smtp.gmail.com |
| Port | 587 |
| Username | seu-email@gmail.com |
| Password | App Password do Google |
| TLS | Enabled |

**Para gerar App Password no Google:**
1. Conta Google → Segurança
2. Verificação em 2 etapas → Ativar
3. Senhas de App → Criar (selecione "E-mail")

---

#### Opção B:-mailtrap (para testes)

| Campo | Valor |
|-------|-------|
| Host | smtp.mailtrap.io |
| Port | 2525 |
| Username | (do Mailtrap) |
| Password | (do Mailtrap) |

---

#### Opção C: Proprio servidor de e-mail

Use as credenciais do seu provider de SMTP.

---

### 3. Criar Lista de Subscribers

1. **Lists** → **New List**
2. Preencha:

| Campo | Valor |
|-------|-------|
| Name | Clientes Com Amor |
| Description | Lista de clientes do e-commerce |
| Public | ✅ Yes |

---

### 4. Obter API Key do ListMonk

1. **Settings** → **API**
2. Clique em **"Generate New Key"**
3. Copie a chave (形式: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

**Guarde esta chave!** Você precisará para o n8n.

---

## 📋 Resumo das Credenciais

| Serviço | Dado | Valor |
|---------|------|-------|
| ListMonk | URL | `https://listmonk.seu-dominio.com` |
| ListMonk | Usuário | (o que você definiu) |
| ListMonk | API Key | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| ListMonk | List ID | `1` (primeira lista) |
| PostgreSQL | Senha | `LISTMONK_PASS` do .env |

---

## 🧪 Testar Envio

1. **Campaigns** → **New Campaign**
2. Preencha subject e content
3. Selecione a lista "Clientes Com Amor"
4. Send test → Preencha seu e-mail
5. Send now

---

## ⏭️ Próximo Passo

Agora você precisa configurar o **Supabase** (escolha uma opção):

→ [04_supabase_cloud.md](04_supabase_cloud.md) (se usa Supabase externo)
ou
→ [04_supabase_local.md](04_supabase_local.md) (se instalou via Setup Orion)

---

## 📌 Notas

- O ListMonk não vem no Setup Orion, por isso a instalação manual
- Para produção, use um SMTP profissional (Mailgun, SendGrid, etc.)
- O limite deenvio depende do seu SMTP

---

*Voltar ao [Índice](00_indice.md)*