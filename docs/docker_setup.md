# Guia de Configuração e Execução do Docker

Este guia descreve como construir, configurar e executar a plataforma **Com Amor Vestuário** utilizando contêineres Docker.

O projeto é baseado no framework **TanStack Start** (React + Vite) e utiliza a integração nativa com o **Cloudflare Workers** através do **Wrangler**. A configuração Docker abaixo permite compilar toda a aplicação e rodá-la de forma 100% independente em servidores privados (VPS, instâncias de nuvem, AWS, GCP, etc.) simulando perfeitamente o ambiente de borda (edge).

---

## 🏗️ Estrutura do Dockerfile

O `Dockerfile` na raiz do projeto foi projetado utilizando a técnica de **Multi-stage Build** (construção em múltiplos estágios) com os seguintes objetivos:

1. **Redução de tamanho**: A imagem final contém apenas o necessário para a execução, reduzindo o tamanho de gigabytes para poucos megabytes.
2. **Segurança**: Arquivos de desenvolvimento, chaves locais e dependências de compilação (como compiladores e linters) não são copiados para a imagem final de produção.
3. **Cache Inteligente**: O Docker aproveita o cache de dependências de forma eficaz para acelerar builds subsequentes.

### Estágio 1: Builder (Compilação)

- Baseado em `node:20-alpine` (uma distribuição Linux extremamente leve e rápida).
- Instala todas as dependências do `package.json` (incluindo `devDependencies` e o Vite).
- Transpila os códigos TypeScript e gera os assets otimizados do cliente em `dist/client` e o arquivo do servidor em `dist/server/index.js`.

### Estágio 2: Runner (Execução)

- Baseado em `node:20-alpine`.
- Copia apenas os arquivos gerados no estágio anterior (`dist/`).
- Instala apenas o runtime de simulação de edge do **Wrangler** (`wrangler`) sem as dependências de desenvolvimento.
- Expõe a porta `3000` por padrão.
- Executa a aplicação usando o Wrangler e Miniflare locais para servir os recursos com suporte SSR (Server-Side Rendering) e Server Functions de forma nativa e estável.

---

## 🚫 Arquivos Ignorados (`.dockerignore`)

Para impedir que arquivos desnecessários aumentem o contexto enviado ao Docker Daemon ou vazem chaves secretas de ambiente locales, o arquivo `.dockerignore` bloqueia:

- Pasta `node_modules/` local.
- Pastas temporárias e caches como `.tanstack/`, `.wrangler/`, e `.output/`.
- Chaves confidenciais como `.env`, `.env.local` e `.dev.vars`.
- Pastas de configuração de IDEs (`.vscode/`) e o histórico Git (`.git/`).

---

## 🚀 Como Compilar e Rodar o Contêiner

Siga as instruções abaixo para buildar e rodar o projeto localmente ou em produção.

### 1. Build da Imagem Docker

Na raiz do projeto (onde está o `Dockerfile`), execute o comando para construir a imagem. Vamos chamá-la de `comamor-vestuario`:

```bash
docker build -t comamor-vestuario .
```

> [!NOTE]
> O primeiro build pode demorar alguns minutos para baixar a imagem base e instalar os pacotes, mas os próximos builds serão consideravelmente mais rápidos graças ao sistema de cache do Docker.

### 2. Executando o Contêiner

Para iniciar o contêiner mapeando a porta local `3000` para a porta `3000` interna do contêiner:

```bash
docker run -d --name comamor-app -p 3000:3000 comamor-vestuario
```

Agora você pode acessar a aplicação em seu navegador através do endereço: `http://localhost:3000`.

---

## 🔐 Configurando Variáveis de Ambiente

A aplicação interage com o **Supabase** e precisa de credenciais válidas em produção para funcionar corretamente. O contêiner Docker não inclui o arquivo `.env` para evitar vulnerabilidades de segurança, portanto, você deve passar as variáveis de ambiente na inicialização do contêiner.

Use o argumento `-e` para passar as variáveis necessárias (como URL e chaves do Supabase):

```bash
docker run -d \
  --name comamor-app \
  -p 3000:3000 \
  -e VITE_SUPABASE_URL="https://sua-url-supabase.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="sua-chave-anonima-supabase" \
  comamor-vestuario
```

### Usando um arquivo `.env` de produção

Se preferir gerenciar através de um arquivo local contendo as chaves de produção, crie um arquivo por exemplo `.env.prod` e execute:

```bash
docker run -d \
  --name comamor-app \
  -p 3000:3000 \
  --env-file .env.prod \
  comamor-vestuario
```

---

## 📊 Gerenciamento e Monitoramento do Contêiner

Aqui estão alguns comandos básicos e úteis do Docker para gerenciar o servidor:

- **Visualizar os logs em tempo real**:

  ```bash
  docker logs -f comamor-app
  ```

- **Parar o contêiner**:

  ```bash
  docker stop comamor-app
  ```

- **Iniciar o contêiner parado**:

  ```bash
  docker start comamor-app
  ```

- **Remover o contêiner**:

  ```bash
  docker rm -f comamor-app
  ```

- **Verificar o consumo de memória e CPU**:
  ```bash
  docker stats comamor-app
  ```

---

## 💡 Melhores Práticas para Produção

- **Orquestração (Docker Compose)**: Para cenários de produção mais robustos, recomenda-se criar um arquivo `docker-compose.yml` integrando o contêiner da aplicação com proxies reversos (como Nginx, Caddy ou Traefik) para gerenciar facilmente certificados SSL/HTTPS.
- **Restart Policy**: Adicione a flag `--restart unless-stopped` no comando `docker run` para garantir que a aplicação reinicie automaticamente caso o servidor sofra um reboot físico ou falha de sistema.
- **Saúde do Contêiner (Healthcheck)**: Pode ser configurado um Healthcheck apontando para `/` ou `/api` do seu app para assegurar que serviços externos de monitoramento saibam exatamente se o contêiner está pronto para receber requisições HTTP.
