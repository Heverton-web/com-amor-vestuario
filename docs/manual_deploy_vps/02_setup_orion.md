# Setup Orion - Instalação de Ferramentas

> Como instalar Traefik, Portainer, N8N e Evolution API via Setup Orion.

---

## ⚡ Visão Rápida

O **Setup Orion** é um instalador automático que configura várias ferramentas de automação/marketing no seu servidor com apenas um comando.

---

## 🎯 Ferramentas que precisamos

Para o nosso projeto, selecione estas opções no Setup Orion:

| Ferramenta | Selecionar? | Para quê |
|-----------|-------------|----------|
| **Traefik** | ✅ Sim | Reverse proxy com SSL |
| **Portainer** | ✅ Sim | Gerenciar containers |
| **N8N** | ✅ Sim | Automação de workflows |
| **Evolution API** | ✅ Sim | WhatsApp Business |
| Supabase | ⬜ (escolha) | Ver opção 04 |
| ListMonk | ❌ Não | Instalação manual (parte 03) |

---

## 🚀 Passo a Passo

### 1. Acesse sua VPS via SSH

```bash
ssh usuario@ip-da-sua-vps
```

Exemplo:
```bash
ssh root@164.23.45.78
```

---

### 2. Execute o Setup Orion

```bash
bash <(curl -sSL setup.oriondesign.art.br)
```

Aguarde alguns segundos enquanto o script baixa e inicia.

---

### 3. Menu Principal

Você verá um menu como este:

```
╔═══════════════════════════════════════════════════════════╗
║           🔷 SETUP ORION - AUTO INSTALADOR 🔷              ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  [1] Instalar / Atualizar Docker                          ║
║  [2] Instalar Traefik                                     ║
║  [3] Instalar Portainer                                   ║
║  [4] Instalar Evolution API                              ║
║  [5] Instalar N8N                                         ║
║  [6] Instalar Supabase                                    ║
║  [0] SAIR                                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Escolha uma opção:
```

---

### 4. Selecione as Ferramentas

#### Opção 1: Instalar/Atualizar Docker
```
[1]
```
Espere a instalação completar.

---

#### Opção 2: Traefik
```
[2]
```
- Solicitará seu domínio (ex: `seu-dominio.com`)
- Solicitará e-mail para Let's Encrypt
- Configura SSL automático

---

#### Opção 3: Portainer
```
[3]
```
- Cria usuário admin
- Define senha
- URL: `https://portainer.seu-dominio.com`

---

#### Opção 4: Evolution API
```
[4]
```
- Define nome da instância (ex: `comamor`)
- Define número de telefone (seu número pessoal para pareamento)
- URL: `https://evolution.seu-dominio.com`

---

#### Opção 5: N8N
```
[5]
```
- Cria usuário e senha
- URL: `https://n8n.seu-dominio.com`

---

### 5. Alternativa: Instalação一括 (Todos de uma vez)

Se preferir instalar tudo de uma vez, o Setup Orion oferece essa opção. Mas cuidado: cada ferramenta pede informações específicas.

---

## 📋 Configuração de Domínio

### Registros DNS necessários

No seu provedor de DNS (Cloudflare, Registro.br, etc.), adicione:

| Tipo | Host | Valor |
|------|------|-------|
| A | @ | IP da VPS |
| A | traefik | IP da VPS |
| A | n8n | IP da VPS |
| A | evolution | IP da VPS |
| A | portainer | IP da VPS |

---

## ✅ Verificação

### Liste os containers rodando

```bash
docker ps
```

Você deve ver algo como:

```
CONTAINER ID   IMAGE              STATUS          PORTS
abc123...      traefik:latest     Up 2 minutes    80-80/tcp, 443-443/tcp
def456...      portainer:latest   Up 2 minutes    9000/tcp
ghi789...      atendee/evolution  Up 2 minutes    8080/tcp
jkl012...      n8nio/n8n          Up 2 minutes    5678/tcp
```

---

## 🌐 URLs de Acesso

Após a instalação, acesso:

| Serviço | URL |
|---------|-----|
| **Traefik Dashboard** | https://traefik.seu-dominio.com:8080 |
| **Portainer** | https://portainer.seu-dominio.com |
| **N8N** | https://n8n.seu-dominio.com |
| **Evolution API** | https://evolution.seu-dominio.com |

---

## 📝 Informações para as Próximas Partes

Guarde estas informações:

1. **Domínio configurado**: `seu-dominio.com`
2. **URLs dos serviços**:
   - N8N: `https://n8n.seu-dominio.com`
   - Evolution API: `https://evolution.seu-dominio.com`
3. **Credenciais**:
   - Usuário N8N: (o que você definiu)
   - Evolution API Key: (gere uma ou use a automática)

---

## ⚠️ Problemas Comuns

### " Porta já em uso"
- Outro serviço está usando a porta 80 ou 443
- Pare o serviço ou edite a configuração

### " DNS não resolve"
- Aguarde a propagação DNS (até 24h)
- Verifique se os registros estão corretos

### " Let's Encrypt não emite certificado"
- Certifique-se que o domínio aponta para o IP correto
- Verifique se as portas 80/443 estão abertas no firewall

---

## ⏭️ Próximo Passo

Agora vamos instalar o **ListMonk** (que NÃO vem no Setup Orion):

→ [03_listmonk.md](03_listmonk.md)

---

*Voltar ao [Índice](00_indice.md)*