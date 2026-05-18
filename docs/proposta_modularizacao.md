# Proposta de Arquitetura: Modularização por Features

Esta proposta apresenta uma estratégia de refatoração para transformar a estrutura monolítica atual da plataforma **Com Amor Vestuário** em uma **Arquitetura Baseada em Recursos (Feature-Based Architecture)**. Isso aumentará a escalabilidade do projeto, facilitará a inserção de novas features de forma isolada e garantirá total controle sobre o ciclo de vida de cada funcionalidade.

---

## 🎯 Por que Modularizar por Features?

Atualmente, o projeto está estruturado por "camadas técnicas" (ex: todos os hooks em `src/hooks`, todas as páginas em `src/routes`, todos os helpers em `src/lib`). Conforme a plataforma cresce e adiciona novos módulos complexos (como Fidelidade, CRM, Atacado, etc.), essa organização traz algumas desvantagens:
- **Alta Acoplamento:** Alterar um arquivo em `src/lib` ou `src/components` pode quebrar partes distantes e imprevisíveis da aplicação.
- **Dificuldade de Navegação:** Para entender ou dar manutenção na Loja de Recompensas, o desenvolvedor precisa abrir arquivos espalhados em 5 pastas diferentes.
- **Sobreposição de Código:** Desenvolvedores trabalhando em features diferentes ao mesmo tempo enfrentam constantes conflitos de Git.

Ao adotarmos a **Modularização por Features**, agrupamos arquivos **por domínio de negócio** (o que a feature faz) em vez de agrupá-los por tipo técnico (o que o arquivo é).

---

## 🏛️ A Estrutura Proposta (`src/features`)

Criaremos um diretório centralizador chamado `src/features/`. Cada grande área de negócio terá seu próprio módulo isolado contendo seus componentes, hooks, regras de negócio e tipos. As rotas em `src/routes/` atuarão apenas como **controladores leves (Entrypoints)** que importam os componentes prontos de suas respectivas features.

Veja como fica a estrutura de pastas:

```text
src/
├── features/                     # Core da modularização
│   ├── fidelidade/               # Módulo de Fidelidade e Recompensas
│   │   ├── components/           # Componentes exclusivos do módulo (RewardCard, etc.)
│   │   ├── hooks/                # Queries, mutations e estado local (useRewards, etc.)
│   │   ├── services/             # Chamadas de API/Supabase (rewardsApi.ts)
│   │   ├── types.ts              # Tipos específicos do módulo
│   │   └── index.ts              # Exportações públicas do módulo (API pública)
│   │
│   ├── crm/                      # Módulo de CRM e Kanban de Fardamento
│   │   ├── components/           # KanbanBoard, KanbanCard, CustomerForm
│   │   ├── hooks/                # useKanban, useLeads
│   │   └── services/             # crmApi.ts
│   │
│   ├── vendas/                   # Módulo de Vendas Virtuais e Checkout
│   │   ├── components/           # CartDrawer, ProductGrid, CheckoutForm
│   │   ├── hooks/                # useCart, useCheckout
│   │   └── services/             # checkoutApi.ts
│   │
│   └── core/                     # Módulo Compartilhado (Shared/Common)
│       ├── components/           # UI básica (Button, Dialog, AdminShell)
│       ├── integrations/         # Configurações do Supabase base
│       └── utils/                # Formatadores de moeda (brl), datas, etc.
│
├── routes/                       # Roteamento (TanStack Router) - Apenas chamadas limpas
│   ├── _authenticated/
│   │   ├── admin.recompensas.tsx # Importa de @/features/fidelidade
│   │   └── admin.pedidos.tsx     # Importa de @/features/vendas
│   ├── recompensas.index.tsx     # Importa de @/features/fidelidade
│   └── checkout.tsx              # Importa de @/features/vendas
```

---

## 🔄 Mapeamento Exaustivo de Módulos (TODAS as Features)

Após análise minuciosa de toda a base de código (`src/routes/`, `src/lib/`, `src/components/`), as funcionalidades do sistema serão divididas rigorosamente em **8 Módulos Principais**. Abaixo está o destino exato de cada arquivo atual:

### 1. Módulo: `core` (Infraestrutura, UI e Auth Base)
O alicerce do sistema. Tudo que é compartilhado globalmente e não pertence a um domínio específico de negócio.
*   **Componentes de UI:** Todo o conteúdo de `src/components/ui/` (botões, inputs, modais base).
*   **Layouts Base:** `AdminShell` e Error Boundaries.
*   **Branding & Tema:** `src/lib/branding.tsx`.
*   **Utilitários & Formatadores:** `src/lib/format.ts`, `src/lib/utils.ts`, `src/lib/num-to-words.ts`, `src/lib/error-capture.ts`.
*   **PDF Engine:** `src/lib/pdf.ts` e `src/lib/pdf-receipt.ts`.
*   **Autenticação Global:** Lógica principal de login e integração cliente (`src/lib/auth.tsx`, pasta `src/integrations/`).

### 2. Módulo: `fidelidade` (Programa de Recompensas e Pontos)
Gestão completa do portal público de recompensas e do saldo dos clientes.
*   **Rotas (Entrypoints):** `admin.recompensas.tsx`, `recompensas.index.tsx`, `recompensas.login.tsx`, `recompensas.minha-conta.tsx`.
*   **Lógica & Serviços:** `src/lib/rewards.ts` (API de pontos, ledgers, vouchers).
*   **Componentes:** Toda a pasta `src/components/rewards/` e o modal interno de administração.

### 3. Módulo: `vendas` (E-commerce, Checkout e Pedidos)
Toda a jornada de compra B2C e B2B finalizada, além da visão de pedidos do painel.
*   **Rotas (Entrypoints):** `loja.tsx`, `checkout.tsx`, `admin.pedidos.tsx`.
*   **Lógica & Serviços:** `src/lib/cart.ts`, `src/lib/pricing.ts` (regras de atacado/varejo), `src/lib/freight.ts`, `src/lib/viacep.ts`.
*   **Componentes:** Carrinho lateral (`CartDrawer`), `ProductGrid` (vitrine pública).

### 4. Módulo: `catalogo` (PIM - Product Information Management)
Gestão de cadastro de produtos, grades (tamanhos/cores) e estoques (antes da venda).
*   **Rotas (Entrypoints):** `admin.produtos.tsx`.
*   **Componentes:** Formulário avançado de variações de produto e upload de fotos.

### 5. Módulo: `crm` (Gestão de Relacionamento, Leads e B2B)
Tudo relacionado ao acompanhamento de clientes, funis de venda corporativos (Fardamento) e negociações.
*   **Rotas (Entrypoints):** `admin.kanban.tsx`, `admin.orcamentos.tsx`, `admin.clientes.tsx`.
*   **Componentes:** Colunas do Kanban, Cartões de Lead, PDFs dinâmicos de orçamentos.

### 6. Módulo: `financeiro` (Faturamento, Documentos e Fiscal)
Controle de tesouraria, emissão de cobranças e notas fiscais.
*   **Rotas (Entrypoints):** `admin.faturas.tsx`, `admin.recibos.tsx`, `admin.nfe.tsx` (Emissão Fiscal).
*   **Visão Pública (Cliente):** `fatura.$token.tsx`, `recibo.$token.tsx`.
*   **Componentes:** Tabelas de conciliação e botões de baixa bancária.

### 7. Módulo: `marketing` (Tráfego e Relatórios)
Dashboards de análise e captura de origem de leads.
*   **Rotas (Entrypoints):** `admin.analises.tsx` (Dashboard de métricas), `admin.utm.tsx` (Links e Origens de Campanha).

### 8. Módulo: `acessos` (Identidade e Permissões de Equipe)
Gestão de quem acessa o painel e quais portais de cliente estão ativos.
*   **Rotas (Entrypoints):** `admin.equipe.tsx`, `login.tsx`.
*   **Lógica & Serviços:** `src/lib/admin-team.functions.ts` (Níveis de acesso de funcionários), `src/lib/portal.functions.ts` (Criação de contas de cliente no Auth).

---

## 🔗 Comunicação Inter-Módulos (Regras Estritas)

Para evitar que a modularização crie dependências circulares, adotaremos as seguintes regras:
1.  **Sem dependências cruzadas complexas:** Um módulo de feature (ex: `fidelidade`) nunca deve importar diretamente de outro módulo de feature (ex: `crm`).
2.  **Uso do Módulo `core`:** Se dois módulos precisam compartilhar algo (como componentes de botão ou funções auxiliares de string), esse elemento deve viver no módulo `core`.
3.  **Pontos de Integração Claros (APIs Públicas):** Cada recurso expõe apenas o necessário através do seu arquivo `index.ts`. Por exemplo, o módulo `vendas` precisa checar se um cupom de pontos é válido. Ele importará `evaluateVoucher` de `@/features/fidelidade`, que está exportado de forma limpa na API pública do módulo.

---

## 📅 Plano de Ação: Refatoração Global e Imediata (Big Bang)

Como o sistema ainda **não está em produção**, temos a liberdade de executar uma reestruturação profunda e completa de uma só vez, sem a necessidade de migrações parciais lentas. O plano de ataque direto é composto por 6 etapas sequenciais:

### Passo 1: Preparação do Ambiente e Configurações (Core)
*   **Path Aliases:** Configurar `tsconfig.json` e `vite.config.ts` para suportar importações absolutas limpas baseadas em features (ex: `import { RewardCard } from "@/features/fidelidade";`).
*   **Esqueleto de Pastas:** Criar a árvore de diretórios vazia em `src/features/` com as 8 pastas dos módulos (e suas subpastas `components`, `hooks`, `services`, `types.ts`, `index.ts`).

### Passo 2: O Grande Deslocamento (Lift & Shift)
Moveremos de forma agressiva todos os arquivos compartilhados atuais para os seus devidos domínios.
*   Transferir os arquivos de `src/lib/` para as pastas `services/` e `utils/` correspondentes.
*   Transferir os componentes de `src/components/` para as pastas `components/` de seus respectivos módulos em `src/features/`.

### Passo 3: Correção de Referências e API Pública
Ao movermos os arquivos, milhares de *imports* ficarão quebrados.
*   Criar o arquivo `index.ts` (Barrel File) em cada módulo para exportar apenas a "API pública" (componentes e funções permitidas para o resto do sistema).
*   Corrigir os imports quebras utilizando os novos *Path Aliases*.

### Passo 4: Refatoração das Views (Limpeza do Roteador)
A parte mais arquitetural. Os arquivos dentro de `src/routes/` (ex: `checkout.tsx`, `admin.recompensas.tsx`) possuem atualmente dezenas de linhas de lógica de UI e Hooks.
*   Extrair o código principal dessas rotas e criar componentes de página (ex: `src/features/vendas/components/CheckoutPage.tsx`).
*   Deixar os arquivos em `src/routes/` exclusivamente como "Controladores" do TanStack Router, contendo apenas configurações de carregamento (loaders/seo) e a renderização simples: `return <CheckoutPage />`.

### Passo 5: Validação de Tipagem Estrita
Executar `npx tsc --noEmit` para auditar a árvore do TypeScript. Este passo garantirá que não restou nenhuma dependência circular ou import fantasma (caminho antigo) durante o reposicionamento.

### Passo 6: Quality Assurance Final
Rodar a plataforma localmente (`npm run dev`) e testar a navegação de ponta a ponta. Como a refatoração será massiva, a recompilação global será a prova de fogo de que a arquitetura modular está perfeitamente selada.

### Passo 7: Automação com AI Skill (Scaffolding Padronizado)
Para garantir que a equipe e a IA mantenham o padrão arquitetural no futuro, criaremos uma **Skill Personalizada** no diretório `.agents/skills/scaffold-module/SKILL.md`. 
*   **Objetivo da Skill:** Sempre que o comando "criar novo módulo X" for acionado, a Skill garantirá que as pastas (`components`, `hooks`, `services`, `types.ts`, `index.ts`) sejam geradas automaticamente, com as exportações corretas e respeitando as regras de isolamento (comunicação inter-módulo via `core` ou `index.ts`). Isso blinda a arquitetura contra degradação ao longo do tempo.
