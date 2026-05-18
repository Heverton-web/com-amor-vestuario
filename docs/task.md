# Check-list do Upgrade: Landing Page 100% Personalizável

Abaixo estão os passos detalhados para a execução e homologação técnica da Galeria e Depoimentos dinâmicos:

- [x] Estender tipo `Branding` e `DEFAULT_BRANDING` em `src/features/core/services/branding.tsx`
- [x] Adicionar sub-painéis de gerenciamento de lista na aba "Página Inicial" em `src/routes/_authenticated/admin.branding.tsx`
- [x] Atualizar Mockups do simulador para ler a galeria e depoimentos dinâmicos reativamente
- [x] Refatorar componente `Gallery.tsx` para carregar dados do hook `useBranding()` e suportar fallbacks
- [x] Refatorar componente `Testimonials.tsx` para carregar dados dinâmicos do hook `useBranding()`
- [x] Validar compilação estrita e build final de produção
- [x] Registrar o commit com todas as modificações integradas
