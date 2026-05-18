# ==========================================
# 1. ESTÁGIO DE BUILD (builder)
# ==========================================
FROM node:20 AS builder

WORKDIR /app

# Copia os arquivos de dependência do projeto
COPY package.json package-lock.json* ./

# Instala todas as dependências (tolerando conflitos de peer-dependencies do React 19)
RUN npm install --legacy-peer-deps

# Copia todo o código-fonte
COPY . .

# Executa o build de produção (gera o bundle do cliente e do servidor na pasta dist)
RUN npm run build

# ==========================================
# 2. ESTÁGIO DE PRODUÇÃO (runner)
# ==========================================
FROM node:20 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV WRANGLER_SEND_METRICS=false

# Copia os diretórios buildados a partir do estágio anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/wrangler.jsonc ./wrangler.jsonc
COPY --from=builder /app/package.json ./package.json

# Instala apenas o wrangler como dependência de execução para o Miniflare do Cloudflare Pages local
RUN npm install wrangler@3.57.1 --omit=dev --no-audit --no-fund

# Expõe a porta configurada
EXPOSE 3000

# Executa o wrangler dev apontando para o bundle de servidor gerado
CMD ["npx", "wrangler", "dev", "dist/server/index.js", "--port", "3000", "--ip", "0.0.0.0", "--live-reload", "false"]
