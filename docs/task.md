# Lista de Tarefas: Feature Ambiente Dev

Acompanhamento passo a passo do progresso de desenvolvimento da funcionalidade de Ambiente Dev (Developer Console).

---

## ⚙️ Progresso Geral
- `[x]` **Fase 1: Infraestrutura de Banco de Dados**
  - `[x]` Criar migration SQL `20260518000000_ambiente_dev_core.sql` para tabelas de webhook e configurações.
  - `[x]` Executar a migration no Supabase local ou remoto.
- `[x]` **Fase 2: Scaffolding & Mapeamento de Feature**
  - `[x]` Executar o gerador de feature para criar o módulo `desenvolvedor`.
  - `[x]` Definir as tipagens em `types.ts` e exportações públicas em `index.ts`.
- `[x]` **Fase 3: Camada de Serviços & Lógica de Integração**
  - `[x]` Desenvolver o despachante de webhooks assíncronos (`webhook-dispatcher.ts`) integrado ao banco de dados.
  - `[x]` Desenvolver o console de pings e diagnósticos de APIs (`api-diagnostics.ts`).
  - `[x]` Implementar fluxo OAuth2 e renovação de tokens do Melhor Envio (Visual + Backend/Edge).
  - `[x]` Criar simulador híbrido (Mocks Locais + Sandbox real) de pagamentos Mercado Pago e fretes Melhor Envio.
- `[x]` **Fase 4: Componentes de UI (Console Administrativo)**
  - `[x]` Desenvolver `<DevConsoleDashboard />` com layout premium de abas.
  - `[x]` Implementar visualizador JSON interativo com opção de cópia rápida para logs de webhooks.
  - `[x]` Implementar painel de monitoramento do Supabase (Edge Functions e Migrações).
- `[x]` **Fase 5: Rotas & Navegação**
  - `[x]` Adicionar categoria "Desenvolvedor" e rota `/admin/dev` em `admin-pages.ts`.
  - `[x]` Criar arquivo de rota `src/routes/_authenticated/admin.dev.tsx`.
- `[x]` **Fase 6: Verificação & Polimento**
  - `[x]` Validar compilação TypeScript (`npx tsc --noEmit`).
  - `[x]` Realizar testes manuais de disparo de webhooks no N8N.
