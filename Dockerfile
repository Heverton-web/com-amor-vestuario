# ==========================================
# 1. ESTÁGIO DE BUILD (builder)
# ==========================================
FROM node:20 AS builder

WORKDIR /app

# Copia os arquivos de dependência do projeto
COPY package.json package-lock.json* ./

# Instala todas as dependências (tolerando conflitos de peer-dependencies do React 19)
RUN npm install --legacy-peer-deps

# Copia todo o código-fonte (incluindo .env para o Vite injetar as variáveis VITE_*)
COPY . .

# Executa o build de produção para Node.js puro (sem Cloudflare Workers)
RUN npm run build

# Mostra a estrutura de saída para diagnóstico
RUN echo "=== Estrutura de saida ===" && ls -la .output/ 2>/dev/null; ls -la .output/server/ 2>/dev/null; ls -la dist/ 2>/dev/null; echo "=== FIM ==="

# ==========================================
# 2. ESTÁGIO DE PRODUÇÃO (runner)
# ==========================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia a saída do build (o TanStack Start sem Cloudflare gera em .output/)
COPY --from=builder /app/.output ./.output

# Expõe a porta configurada
EXPOSE 3000

# Executa o servidor Node.js puro gerado pelo TanStack Start
CMD ["node", ".output/server/index.mjs"]
