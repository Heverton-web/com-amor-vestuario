# Plano de Implementação: Modularização por Features

De acordo com o documento `docs/proposta_modularizacao.md`, realizaremos a transição da arquitetura monolítica atual (agrupada por tipo técnico) para uma **Arquitetura Baseada em Recursos (Feature-Based Architecture)**.

## User Review Required

> [!WARNING]
> Como sugerido na proposta, esta é uma refatoração "Big Bang". Vamos mover dezenas de arquivos de `src/components`, `src/lib`, `src/hooks` e `src/integrations` para o novo diretório `src/features/`.
> 
> Durante este processo, a aplicação local ficará temporariamente com quebras de compilação até que todos os caminhos de *imports* sejam ajustados.
> 
> O `tsconfig.json` e `vite.config.ts` já possuem o path alias `@/` apontando para `src/`, portanto essa etapa (Passo 1 do documento) está coberta.

## Open Questions

> [!IMPORTANT]
> 1. Posso prosseguir criando toda a árvore de diretórios vazia (Passo 1)?
> 2. Após a criação da estrutura, prefere que eu faça o "Lift & Shift" (Passo 2) de todos os módulos de uma vez, ou foco em um módulo por vez para garantir que não nos percamos nos ajustes de imports? (Minha recomendação é fazer a movimentação completa primeiro para depois usar o `tsc` como guia para corrigir imports no Passo 3).

## Proposed Changes

Abaixo está o resumo das operações de movimentação propostas:

### 1. Esqueleto Base (Módulos Iniciais)
Criaremos a estrutura de pastas em `src/features/`:
- `core/`
- `fidelidade/`
- `vendas/`
- `catalogo/`
- `crm/`
- `financeiro/`
- `marketing/`
- `acessos/`
- E as respectivas subpastas `components/`, `hooks/`, `services/`, `index.ts`, e `types.ts` dentro de cada.

---

### Módulo: `core`
#### [NEW] `src/features/core/components/` (Move componentes UI base)
#### [NEW] `src/features/core/utils/` (Move formatadores: `format.ts`, `utils.ts`, `num-to-words.ts`, etc.)
#### [NEW] `src/features/core/integrations/` (Move a configuração do Supabase e PDFs base)
#### [NEW] `src/features/core/index.ts`

---

### Módulo: `fidelidade`
#### [NEW] `src/features/fidelidade/components/` (Move componentes de recompensa)
#### [NEW] `src/features/fidelidade/services/` (Move `rewards.ts` e lógica de voucher)
#### [NEW] `src/features/fidelidade/index.ts`

---

### Módulo: `vendas`
#### [NEW] `src/features/vendas/components/` (Move `CartDrawer`, `ProductGrid`, etc.)
#### [NEW] `src/features/vendas/services/` (Move `cart.ts`, `pricing.ts`, `freight.ts`, `viacep.ts`)
#### [NEW] `src/features/vendas/index.ts`

---

### Demais Módulos (`catalogo`, `crm`, `financeiro`, `marketing`, `acessos`)
Realizaremos a mesma movimentação lógica mapeada na sua proposta. Toda a lógica específica de negócio (e.g. `admin-team.functions.ts`, `portal.functions.ts` de acessos) irá para a pasta `services/` da sua feature apropriada.

---

### Roteamento e Views
#### [MODIFY] `src/routes/*`
As rotas serão enxutas. Toda a UI e lógicas complexas atualmente dentro das rotas serão extraídas para componentes de página como `src/features/*/components/*Page.tsx`.

## Verification Plan

### Automated Tests
- Usarei o comando `npx tsc --noEmit` repetidamente. Ele guiará a correção de todos os *imports* e garantirá que nenhuma referência cíclica ou caminho "fantasma" permaneça no código após a mudança.

### Manual Verification
- Assim que o compilador do Vite acusar sucesso sem erros na interface, poderemos reabrir a aplicação (Login, Kanban, Vitrine e Acessos) e testar a navegação do fluxo principal.
