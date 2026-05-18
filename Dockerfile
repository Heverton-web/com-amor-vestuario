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

# Força a instalação GLOBAL da versão exata exigida pelo Cloudflare (v4) para evitar conflitos com versões antigas cacheadas em bibliotecas locais
RUN npm install -g wrangler@4.92.0

# Expõe a porta configurada
EXPOSE 3000

# Executa o wrangler V4 de forma global (sem npx), apontando a compatibilidade de 2025 e os recursos estáticos corretos
CMD ["wrangler", "dev", "dist/server/index.js", "--port", "3000", "--ip", "0.0.0.0", "--compatibility-date=2025-09-24", "--compatibility-flag=nodejs_compat", "--assets", "dist/client", "--live-reload", "false"]
