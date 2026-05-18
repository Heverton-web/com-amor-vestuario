# ==========================================
# ESTÁGIO ÚNICO DE DIAGNÓSTICO
# ==========================================
FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Mostra onde o build gerou os arquivos
RUN echo "=== RAIZ ===" && ls -la && echo "=== DIST ===" && ls -la dist/ 2>/dev/null || echo "sem dist/" && echo "=== .OUTPUT ===" && ls -la .output/ 2>/dev/null || echo "sem .output/" && echo "=== .OUTPUT/SERVER ===" && ls -la .output/server/ 2>/dev/null || echo "sem .output/server/" && echo "=== DIST/SERVER ===" && ls -la dist/server/ 2>/dev/null || echo "sem dist/server/" && echo "=== DIST/CLIENT ===" && ls -la dist/client/ 2>/dev/null || echo "sem dist/client/"

CMD ["echo", "diagnostico concluido"]
