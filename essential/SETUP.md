# Guia de Configuração - Com Amor Vestuário

> Passo a passo para configurar o ambiente de desenvolvimento.

---

## Pré-requisitos

| Software | Versão Mínima | Descrição |
|----------|---------------|-----------|
| Node.js | 20.x | Runtime JavaScript |
| Bun | 1.x | Package manager (opcional) |
| Docker | 24.x | Containerização |
| Git | 2.x | Controle de versão |
| VS Code | 1.8x | Editor recomendado |

---

## Configuração Local

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-repo/proj_comamor-vestuario.git
cd proj_comamor-vestuario
```

### 2. Instalar Dependências

```bash
# Com Bun (recomendado)
bun install

# Ou com npm
npm install
```

### 3. Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar com suas credenciais
code .env
```

Contenido mínimo do `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### 4. Iniciar Servidor Dev

```bash
# Com Bun
bun run dev

# Ou com npm
npm run dev
```

Acesse: `http://localhost:5173`

---

## Configuração do Banco

### Usar Supabase Local (Opcional)

```bash
# Instalar CLI
npm install -g supabase

# Iniciar container local
supabase start

# Ver status
supabase status
```

### Executar Migrations

```bash
# Aplicar todas as migrations
supabase db push

# Ou via SQL
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/20260520000000_features_stack.sql
```

---

## Docker (Desenvolvimento)

### Iniciar Serviços

```bash
# Iniciar PostgreSQL + Supabase
docker compose up -d

# Ver logs
docker compose logs -f
```

### Serviços Disponíveis

| Serviço | Porta | URL |
|---------|------|-----|
| App (Vite) | 5173 | http://localhost:5173 |
| Supabase DB | 54322 | postgresql://localhost:54322 |
| Supabase Studio | 54323 | http://localhost:54323 |

---

## Estrutura de Branches

```
main        ─────► Produção (deploy automático)
develop     ─────► Desenvolvimento
feature/*   ─────► Novas funcionalidades
fix/*       ─────► Correções
hotfix/*    ─────► Correções urgentes
```

### Fluxo de Trabalho

```bash
# 1. Criar branch
git checkout -b feature/nova-feature

# 2. Desenvolver
git add .
git commit -m 'feat: adiciona nova feature'

# 3. Push
git push origin feature/nova-feature

# 4. Pull Request (GitHub)
```

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Iniciar dev server |
| `bun run build` | Build produção |
| `bun run lint` | Verificar código |
| `bun run format` | Formatar código |

---

## Depuração

### Erros Comuns

#### "Module not found"
```bash
# Limpar cache e reinstallar
rm -rf node_modules
bun install
```

#### "Supabase connection failed"
```bash
# Verificar variável VITE_SUPABASE_URL
# Verificar se Supabase está rodando (se local)
```

#### "Port already in use"
```bash
# Ver processos usando porta
lsof -i :5173
# ou matar processo
kill -9 $(lsof -t -i:5173)
```

---

## Extensões VS Code Recomendadas

| Extensão | Descrição |
|----------|-----------|
| ESLint | Linting de código |
| Prettier | Formatação automática |
| Tailwind CSS IntelliSense | Autocomplete Tailwind |
| Supabase | Integração Supabase |
| Error Lens | Visualizar erros inline |

---

## Próximos Passos

1. ✅ Configurar ambiente
2. ⬜ Explorar código fonte
3. ⬜ Fazer primeira alteração
4. ⬜ Executar testes
5. ⬜ Criar PR

---

## Suporte

- **Issues**: https://github.com/seu-repo/proj_comamor-vestuario/issues
- **Discussões**: https://github.com/seu-repo/proj_comamor-vestuario/discussions
- **Email**: suporte@comamor.com.br