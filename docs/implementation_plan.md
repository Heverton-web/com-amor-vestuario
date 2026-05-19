# Plano de Implementação — Clube Com Amor

Este documento descreve o plano detalhado para rebrandear a antiga "Loja de Recompensas" para o novo **Clube Com Amor**, criar uma página informativa detalhada, integrar botões inteligentes de lead com redirecionamento ao WhatsApp, introduzir um pipeline Kanban exclusivo de CRM e refinar o cabeçalho e formulário de contato da Landing Page.

---

## Revisão Necessária do Usuário

> [!IMPORTANT]
>
> - **Automação de Captura de Leads**: O botão **"Quero Fazer Parte"** abrirá uma micro-janela suspensa elegante solicitando apenas **Nome** e **WhatsApp** antes do redirecionamento. Isso garante que a empresa capture o contato do lead de forma 100% automatizada e o insira diretamente no CRM Kanban administrativo.
> - **Enum de Banco de Dados**: A inclusão da opção "Clube Com Amor" no formulário de contato requer uma atualização no tipo ENUM `lead_reason` do Postgres. Criaremos um script de migração DDL limpo para o banco de dados.

---

## Proposta de Alterações

### 1. Banco de Dados (Schema & Migrações)

#### [NEW] [20260518011000_clube_com_amor.sql](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/supabase/migrations/20260518011000_clube_com_amor.sql)

- Criação de script DDL contendo:
  1. Alteração do tipo ENUM `public.lead_reason` para adicionar o valor `'clube'`.
  2. Atualização da função de trigger `public.lead_to_kanban()` para direcionar os leads com razão `'clube'` automaticamente para o novo quadro `'clube'` do Kanban, no estágio inicial `'novo'`.

---

### 2. Landing Page & Cabeçalho

#### [MODIFY] [Header.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/marketing/components/Header.tsx)

- Adicionar a opção `"Clube Com Amor"` na lista de links com destino à rota `/recompensas`.
- Interceptador de clique: no loop de renderização do menu desktop e mobile, se o link for `#contato`, disparar a propriedade `onContact()` em vez do scroll de âncora padrão.

#### [MODIFY] [Hero.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/marketing/components/Hero.tsx)

- Inserir um terceiro botão de ação elegante com fundo semitransparente (`bg-primary/5`) e bordas personalizadas na cor da marca, exibindo um ícone de estrela brilhante (`Sparkles`) e a legenda `"Clube Com Amor"`, direcionando para `/recompensas`.

#### [MODIFY] [ContactDialog.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/marketing/components/ContactDialog.tsx)

- Adicionar a opção `{ id: "clube", label: "Clube Com Amor" }` na grade de motivos de contato.

---

### 3. Programa de Fidelidade & Recompensas

#### [MODIFY] [recompensas.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/recompensas.tsx)

- Rebrandear a tag do cabeçalho da área logada de _"recompensas"_ para _"Clube Com Amor"_.

#### [MODIFY] [recompensas.index.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/recompensas.index.tsx)

- Rebrandear todos os títulos e descrições para destacar o **Clube Com Amor**.
- Inserir um botão de destaque ao lado do saldo de pontos: _"Como funciona o Clube?"_ direcionando para a nova rota `/recompensas/como-funciona`.

#### [NEW] [recompensas.como-funciona.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/recompensas.como-funciona.tsx)

- Nova rota pública `/recompensas/como-funciona` com layout editorial premium descrevendo o passo a passo de acúmulo de pontos e vantagens.
- **Fluxo "Quero Fazer Parte"**:
  - Ao clicar no botão, abre um mini modal solicitando Nome e WhatsApp.
  - Ao salvar, insere o registro na tabela `kanban_cards` (board: `'clube'`, stage: `'novo'`).
  - Em seguida, abre a aba do WhatsApp (`https://wa.me/` oficial) com texto predefinido profissional.

---

### 4. CRM Administrativo (Kanban)

#### [MODIFY] [admin.kanban.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.kanban.tsx)

- Adicionar o quadro `'clube'` no dicionário `BOARDS`:
  ```typescript
  clube: {
    label: "Clube Com Amor",
    stages: [
      { key: "novo", label: "Interessados" },
      { key: "contatado", label: "Contatados" },
      { key: "membro", label: "Membros" },
      { key: "inativo", label: "Inativos" },
    ],
  }
  ```

---

## Plano de Verificação

### Testes de Fluxo Visual & Compilação

- Executar `npx tsc --noEmit` para validação estrita.
- Executar `npm run build` para garantir que o empacotamento SPA e SSR ocorra sem problemas.
- Testar a responsividade do cabeçalho móvel clicando nos novos links e no gatilho de modal de contato.
- Submeter o formulário com a opção "Clube Com Amor" e verificar se o card cai no pipeline correto no painel administrativo `/admin/kanban`.
