# 🚀 Guia de Atualização e Deploy na VPS (Docker Swarm & Traefik)

Este documento registra o procedimento passo a passo para atualizar o código da plataforma **Com Amor Vestuário** na VPS (`KhenServer`) e configurar/apontar novos subdomínios utilizando o ecossistema do **Setup Orion** (Docker Swarm e Traefik).

---

## 🏗️ Como a Aplicação Funciona na VPS

*   **Roteamento Dinâmico (Traefik):** O Traefik gerencia o roteamento de subdomínios e a emissão automática de certificados SSL (HTTPS via Let's Encrypt).
*   **Docker Swarm:** O Traefik roda em modo Swarm e escuta os containers conectados à rede overlay privada **`KhenNetwork`**.
*   **Serviço Swarm (Service):** Como a rede `KhenNetwork` não é manualmente associável a containers comuns (stand-alone), a aplicação roda obrigatoriamente como um **Serviço do Swarm (`docker service`)**. Isso permite que o container se conecte de forma nativa e segura à rede do Traefik na porta interna `3000`.

---

## 🛠️ Passo a Passo para Atualização do Projeto

Sempre que fizer alterações no código local e quiser colocá-las no ar, siga este fluxo ordenado:

### Passo 1: Enviar as alterações do seu computador (Local)
No terminal do seu computador (Windows), faça o commit e envie as alterações para o seu repositório Git:

```bash
git add .
git commit -m "feat: suas alterações de código"
git push
```

### Passo 2: Puxar as alterações na VPS (SSH)
1. Conecte-se na sua VPS via terminal SSH.
2. Navegue até a pasta correta do projeto:
   ```bash
   cd ~/com-amor-vestuario
   ```
3. Puxe o código atualizado do GitHub/GitLab:
   ```bash
   git pull
   ```

### Passo 3: Compilar a Nova Imagem Docker na VPS
Com o código atualizado na VPS, reconstrua a imagem do Docker. O Dockerfile executará a instalação das dependências e o build de produção do Vite de forma isolada:

```bash
docker build -t comamor-app:latest .
```

### Passo 4: Aplicar a Nova Imagem no Serviço (Deploy)
Como o serviço já está configurado no Swarm, você não precisa recriá-lo do zero. Basta forçar a reinicialização para que ele passe a usar a nova imagem que você acabou de compilar:

```bash
docker service update --force comamor-app
```

---

## 🌐 Como Apontar um Novo Subdomínio (Ex: `comamor.signa-docs.com`)

Se no futuro você precisar mudar ou adicionar um subdomínio para a aplicação, os passos são:

### 1. Configuração do DNS
No seu provedor de domínio (Cloudflare, Registro.br, etc.), crie um registro:
*   **Tipo:** `A`
*   **Nome:** `comamor` (ou o subdomínio desejado)
*   **Aponta para (IP):** `IP_DA_SUA_VPS`
*   *Recomendação:* Inicialmente, deixe as opções de Proxy desativadas (DNS Only) para que o Let's Encrypt da VPS valide o certificado com mais rapidez.

### 2. Recriação do Serviço com as Novas Labels
Se for necessário redefinir as labels do subdomínio, remova o serviço anterior e inicialize-o novamente com a configuração abaixo:

```bash
# 1. Remove o serviço atual
docker service rm comamor-app

# 2. Cria o serviço com a nova URL
docker service create \
  --name comamor-app \
  --network KhenNetwork \
  --env NODE_ENV=production \
  --env PORT=3000 \
  --label 'traefik.enable=true' \
  --label 'traefik.http.routers.comamor-app.rule=Host(`comamor.signa-docs.com`)' \
  --label 'traefik.http.routers.comamor-app.entrypoints=web,websecure' \
  --label 'traefik.http.routers.comamor-app.tls.certresolver=letsencryptresolver' \
  --label 'traefik.http.services.comamor-app.loadbalancer.server.port=3000' \
  comamor-app:latest
```

---

## 🔍 Comandos Úteis de Diagnóstico na VPS

Aqui estão os comandos principais que você pode usar no SSH da VPS para monitorar a saúde da aplicação:

*   **Verificar logs da aplicação em tempo real:**
    ```bash
    docker service logs -f comamor-app
    ```
*   **Verificar o status do serviço no Swarm:**
    ```bash
    docker service ls
    ```
*   **Verificar detalhes de tarefas e containers do serviço:**
    ```bash
    docker service ps comamor-app
    ```
