# Comandos de Referência Rápida

> Quick reference para gerenciamento da infraestrutura.

---

## 🐳 Docker / Swarm

```bash
# Ver containers rodando
docker ps

# Ver todos os serviços Swarm
docker service ls

# Ver serviços de uma stack específica
docker service ls | grep comamor

# Ver logs de um serviço
docker service logs comamor_n8n

# Ver logs em tempo real
docker service logs -f comamor_n8n

# Reiniciar um serviço
docker service update --force comamor_n8n

# Remover stack
docker stack rm comamor

# Ver recursos
docker stats

# Ver redes
docker network ls
```

---

## 📦 Containers Específicos

```bash
# n8n
docker service logs comamor_n8n
docker service update --force comamor_n8n

# ListMonk
docker service logs comamor_listmonk
docker service restart comamor_listmonk

# Evolution API
docker service logs comamor_evolution-api
docker service restart comamor_evolution-api

# PostgreSQL
docker service logs comamor_postgres
```

---

## 🌐 Redes e DNS

```bash
# Ver redes Docker
docker network ls

# Criar rede overlay
docker network create --driver overlay comamor-network

# Ver IP do container
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' container_name

# TestarDNS
nslookup seu-dominio.com

# Testar conectividade
curl -I https://seu-dominio.com
```

---

## 📁 Arquivos e Pastas

```bash
# Ver estrutura do projeto
ls -la /opt/comamor/

# Ver arquivos de configuração
ls -la /opt/comamor/essential/

# Ver logs do app
tail -f /opt/comamor/essential/logs/app.log

# Ver arquivos docker-compose
cat /opt/comamor/essential/docker-compose.yaml
```

---

## ⚙️ n8n

```bash
# Acessar painel
# https://n8n.seu-dominio.com

# Ver workflows ativos
# Via interface: Settings → Workflows

# Exportar workflow
# Via interface: Workflow → Download

# Importar workflow
# Via interface: Workflows → Import from File

# Ver execuções
# Via interface: Workflow → Executions

# Reiniciar n8n
docker service update --force comamor_n8n
```

---

## 📧 ListMonk

```bash
# Acessar painel
# https://listmonk.seu-dominio.com

# Ver estatísticas
# Via interface: Dashboard

# Criar campanha
# Via interface: Campaigns → New Campaign

# Testar SMTP
# Settings → SMTP → Send Test Email
```

---

## 💬 Evolution API

```bash
# Acessar painel
# https://evolution.seu-dominio.com

# Ver instâncias
# Via interface: Instances

# Enviar mensagem teste
# Via interface: Send Message

# Ver sessões ativas
docker service logs comamor_evolution-api | grep "CONNECTED"
```

---

## 🗄️ Supabase

```bash
# Se usando Supabase local via Docker
docker ps | grep supabase

# Ver logs
docker logs supabase-db

# Acessar PostgreSQL diretamente
docker exec -it supabase-db psql -U postgres
```

---

## 🔧 Manutenção

```bash
# Limpar containers parados
docker container prune

# Limpar imagens não usadas
docker image prune -a

# Limpar volumes órfãos
docker volume prune

# Ver uso de disco
df -h

# Limpar logs antigos
sudo journalctl --vacuum-time=7d
```

---

## 🔄 Deploy

```bash
# Fazer deploy completo
cd /opt/comamor/essential
./deploy.sh

# Ver status após deploy
docker service ls

# Verificar health
curl -f https://seu-dominio.com || echo "ERRO"
```

---

## 📊 Monitoramento

```bash
# Ver todos os containers
watch -n 5 'docker ps'

# Ver recursos em tempo real
docker stats

# Ver logs de todos os serviços
docker logs -f $(docker service ls -q)

# Verificar SSL/TLS
curl -vI https://seu-dominio.com 2>&1 | grep -E "SSL|TLS|HTTP"
```

---

## 🆘 Emergência

```bash
# Parar tudo
docker stack rm comamor

# Remover TODOS os containers
docker stop $(docker ps -aq)

# Recomeçar do zero
# 1. docker stack rm comamor
# 2. docker system prune -af
# 3. ./deploy.sh
```

---

## 📋 Variáveis de Ambiente

Locais importantes com variáveis:

| Arquivo | Descrição |
|---------|-----------|
| `/opt/comamor/essential/.env` | Variáveis do deploy |
| n8n Credentials | Supabase, Evolution, ListMonk |
| Supabase Dashboard | API Keys |
| ListMonk Settings | SMTP e API |

---

## 🌐 URLs Úteis

| Serviço | URL |
|---------|-----|
| App | `https://seu-dominio.com` |
| n8n | `https://n8n.seu-dominio.com` |
| ListMonk | `https://listmonk.seu-dominio.com` |
| Evolution | `https://evolution.seu-dominio.com` |
| Portainer | `https://portainer.seu-dominio.com` |
| Traefik Dashboard | `https://traefik.seu-dominio.com:8080` |
| Supabase | `https://xxxxxx.supabase.co` |

---

## 📌 Quick Reference (impressão)

```
┌─────────────────────────────────────────────────────────┐
│              COMANDOS ESSENCIAIS                       │
├─────────────────────────────────────────────────────────┤
│ docker service ls          → Ver serviços              │
│ docker service logs -f X   → Ver logs em tempo real   │
│ docker service update --force X → Reiniciar serviço    │
│ docker stack rm comamor    → Remover stack             │
│ ./deploy.sh                → Fazer deploy              │
└─────────────────────────────────────────────────────────┘
```

---

*Manual completo em: [00_indice.md](00_indice.md)*