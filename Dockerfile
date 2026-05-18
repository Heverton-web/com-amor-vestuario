# ==========================================
# 1. ESTÁGIO DE BUILD (builder)
# ==========================================
FROM node:20 AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ==========================================
# 2. ESTÁGIO DE PRODUÇÃO (runner)
# ==========================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia o build gerado e o adaptador Node.js
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node-adapter.js ./node-adapter.js

EXPOSE 3000

# Roda o servidor Node.js puro — sem Wrangler, sem workerd, sem Cloudflare
CMD ["node", "node-adapter.js"]
