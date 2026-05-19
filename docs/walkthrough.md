# Walkthrough: Regras de Fidelidade Customizáveis

Neste passo a passo descrevemos como a funcionalidade de personalização das regras do Clube de Fidelidade foi integrada à plataforma, desde as definições no banco de dados até a visualização no simulador do administrador e na página explicativa do cliente final.

## 1. Expansão do Schema de Branding
* **Arquivo**: [branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/services/branding.tsx)
* **Mudança**: Adicionados 6 novos campos opcionais do tipo string ao objeto `Branding` para personalizar os títulos e descrições dos 3 passos do clube de recompensas (`rule_register_title`, `rule_register_desc`, `rule_points_title`, `rule_points_desc`, `rule_rewards_title`, `rule_rewards_desc`).
* **Valor Padrão**: As regras originais de acúmulo de pontos ("Cadastro Simples", "Acumule R$ 1 = 1 Ponto", "Resgate Prêmios Reais") foram inseridas como fallback no objeto `DEFAULT_BRANDING`.

## 2. Nova Aba de Configurações no Painel do Administrador
* **Arquivo**: [admin.branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.branding.tsx)
* **Mudança**:
  * Adicionada a aba **Fidelidade & Regras** no agrupamento do formulário admin (`tabSections`).
  * Expansão da assinatura da função `update` para que aceite o tipo `number` (permitindo configurar `points_per_real` e `redemption_days_default`).
  * Atualização da iteração dinâmica de campos para converter números para strings durante a renderização no componente `FieldEditor` e reconverter para `number` no `onChange` de forma limpa.

## 3. Pré-Visualização Dinâmica no Simulador do Celular
* **Arquivo**: [admin.branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.branding.tsx)
* **Mudança**:
  * O mockup do celular, ao ser chaveado para visualizar a tela de **Fidelidade**, agora renderiza em tempo real a seção "Como Funciona" com os três passos e seus respectivos textos baseados no rascunho ativo.
  * O nome do clube exibido no banner superior do mockup passa a usar o rascunho de `rewards_label` dinamicamente.

## 4. Integração Dinâmica da Página Explicativa Pública
* **Arquivo**: [recompensas.como-funciona.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/recompensas.como-funciona.tsx)
* **Mudança**:
  * A variável local `steps` que definia a explicação estática do Clube foi vinculada diretamente ao hook `useBranding()`, caindo para os textos padrão em caso de ausência de configuração personalizada.

## 5. Validação de Tipagem
* **Execução**: O compilador TypeScript (`npx tsc --noEmit`) foi executado e concluiu o build sem apontar erros de tipos ou dependências quebradas.
