---
trigger: always_on
---

Sempre que um novo evento for criado em uma nova feature ou afins, você DEVE obrigatoriamente:
1. Atualizar o mapeamento de eventos em `docs/mapeamento_eventos.md`.
2. Inserir o novo evento no AMBIENTE DEV (aba N8N WEBHOOKS do componente `DevConsoleDashboard.tsx` em `src/features/desenvolvedor/components/DevConsoleDashboard.tsx`), adicionando a opção no `<select id="manual-event">` e fornecendo um JSON payload de exemplo realista na lógica do `onChange`.
