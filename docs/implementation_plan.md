# Plano de Implementação: Regras do Clube de Fidelidade Editáveis no Painel Administrativo

Permitir que o administrador edite dinamicamente as 3 regras explicativas de acúmulo de pontos e fidelidade através do painel de administração (Branding), atualizando de forma dinâmica tanto a página pública quanto a pré-visualização em tempo real no simulador.

## Mudanças Propostas

### 1. Definições de Branding e Defaults
#### [MODIFY] [branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/services/branding.tsx)
- Adicionar os seguintes campos de regras de negócio ao tipo `Branding`:
  - `rule_register_title: string;` (Título da Regra 1)
  - `rule_register_desc: string;` (Descrição da Regra 1)
  - `rule_points_title: string;` (Título da Regra 2)
  - `rule_points_desc: string;` (Descrição da Regra 2)
  - `rule_rewards_title: string;` (Título da Regra 3)
  - `rule_rewards_desc: string;` (Descrição da Regra 3)
- Adicionar os textos padrão correspondentes no objeto `DEFAULT_BRANDING`.

### 2. Interface de Configuração e Simulador no Admin
#### [MODIFY] [admin.branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.branding.tsx)
- Criar a nova aba `fidelidade` ("Fidelidade & Regras") no objeto `tabSections` contendo:
  - **Configurações Gerais do Clube**: Campos como Nome do Clube (`rewards_label`), R$ equivalente a 1 ponto (`points_per_real`), Validade do resgate (`redemption_days_default`) e o link de Webhook (`n8n_rewards_webhook`).
  - **Regra 1: Cadastro do Cliente**: Título e Descrição.
  - **Regra 2: Acúmulo de Pontos**: Título e Descrição.
  - **Regra 3: Resgate de Prêmios**: Título e Descrição.
- Modificar o `update` no componente administrativo para aceitar `string | number | null` a fim de suportar a edição numérica dos campos `points_per_real` e `redemption_days_default`.
- Ajustar a iteração de campos para converter números para string e vice-versa de forma segura durante a renderização no `FieldEditor`.
- Adicionar a seção "Como Funciona" simulada no mockup do celular (na visualização `recompensas`) para renderizar dinamicamente os textos da regra em tempo real à medida que o administrador digita.

### 3. Exibição Dinâmica das Regras Públicas
#### [MODIFY] [recompensas.como-funciona.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/recompensas.como-funciona.tsx)
- Substituir o array estático `steps` por definições dinâmicas obtidas de `branding.rule_...` provenientes do hook `useBranding()`.

---

## Plano de Verificação

### Testes Manuais
1. Entrar no painel de administração em `/admin/branding`.
2. Acessar a nova aba "Fidelidade & Regras".
3. Alterar os títulos e descrições das regras (Ex: alterar "R$ 1 = 1 Ponto" para "R$ 2 = 1 Ponto").
4. Mudar para a aba de pré-visualização "Fidelidade" no simulador de celular e verificar se os textos mudaram instantaneamente.
5. Clicar em "Salvar tudo" e confirmar a notificação de sucesso.
6. Acessar a página pública explicativa `/recompensas/como-funciona` e certificar-se de que as novas regras de negócio personalizadas são exibidas corretamente.
