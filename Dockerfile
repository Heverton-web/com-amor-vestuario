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

# Copia o build gerado, o adaptador e as dependências de runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node-adapter.js ./node-adapter.js
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Roda o servidor Node.js puro
CMD ["node", "node-adapter.js"]
