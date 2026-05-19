# Com Amor Vestuário - Projeto E-commerce

> Visão geral do projeto, estrutura de arquivos e guia de desenvolvimento.

## Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| **Frontend** | React 19 + TypeScript + TanStack Start |
| **Estilização** | Tailwind CSS 4 + Shadcn/UI |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **Hospedagem** | Cloudflare Workers |
| **Automação** | n8n (VPS Docker Swarm) |
| **E-mail** | ListMonk (VPS Docker Swarm) |
| **WhatsApp** | EvolutionAPI (VPS Docker Swarm) |

## Estrutura do Projeto

```
proj_comamor-vestuario/
├── src/
│   ├── features/           # Módulos por domínio
│   │   ├── core/           # Componentes compartilhados
│   │   ├── marketing/      # Páginas públicas ( Landing )
│   │   ├── vendas/         # Loja, carrinho, checkout
│   │   ├── catalogo/       # Catálogo de produtos
│   │   ├── crm/            # Gestão de clientes
│   │   ├── financeiro/     # Financeiro e faturas
│   │   ├── fidelidade/     # Programa de pontos
│   │   ├── acessos/        # Controle de acesso
│   │   └── desenvolvedor/  # Ferramentas dev
│   ├── routes/             # Rotas da aplicação
│   │   ├── _authenticated/ # Rotas administrativas
│   │   ├── loja.tsx        # Página da loja
│   │   ├── checkout.tsx    # Finalização de compra
│   │   └── recompensas.*  # Programa fidelidade
│   ├── styles.css          # Estilos globais
│   └── router.tsx          # Configuração de rotas
├── supabase/
│   └── migrations/         # Migrations do banco
├── n8n/
│   └── workflows/          # Workflows de automação
├── docs/                   # Documentação
│   └── esteira_novas_features/  # Roadmap de features
└── essential/             # Configurações essenciais
```

## Módulos do Sistema

### Funcionalidades Implementadas ✅

- **Loja Virtual**: Catálogo com filtros (cor, tamanho, preço)
- **Sistema de Preços**: Varejo (1-5 pcs) e Atacado (6+ pcs)
- **Carrinho**: Seleção de variante (cor/tamanho)
- **Checkout**: Formulário com ViaCEP
- **Programa Fidelidade**: Pontos, vouchers, recompensas
- **Cadastro Clientes**: PF e PJ
- **Pedidos**: Status automático → Kanban
- **Estoque**: Controle com trigger de baixa
- **Admin**: CRM, produtos, pedidos, relatórios

### Funcionalidades Pendentes ❌

- **Pagamentos**: Integração Mercado Pago
- **Autenticação**: Login/cadastro cliente
- **Minha Conta**: Área do cliente
- **Atacado B2B**: Cadastro lojistas
- **Rastreamento**: Status pedido
- **E-mail Transacional**: Confirmações
- **Wishlist**: Lista de desejos
- **Avaliações**: Reviews produtos
- **Automação Marketing**: n8n + ListMonk + EvolutionAPI

## Como Executar

### Desenvolvimento Local

```bash
# Instalar dependências
bun install

# Iniciar servidor dev
bun run dev

# Build para produção
bun run build
```

### Deploy

O deploy é feito automaticamente via Cloudflare ao fazer push para `main`.

## Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# App
VITE_APP_URL=http://localhost:5173
```

## Dokumentação

| Arquivo | Descrição |
|---------|-----------|
| `docs/manual_desenvolvedor.md` | Guia do desenvolvedor |
| `docs/esteira_novas_features/roadmap_features.md` | Roadmap completo |
| `docs/esteira_novas_features/feature_*.md` | Especificação de cada feature |
| `essential/docker-compose.yaml` | Stack Docker para VPS |
| `essential/API.md` | Documentação da API |

## Contribuição

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Faça commit: `git commit -m 'feat: adiciona feature'`
3. Push: `git push origin feature/minha-feature`
4. Abra um Pull Request

## Licença

MIT