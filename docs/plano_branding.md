# Plano de Implementação — Upgrade Ultra-Premium: Branding & Conteúdo

Este documento detalha o plano técnico para refatorar e elevar a aba de **Branding & Conteúdo** ([admin.branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.branding.tsx)) de um formulário comum para uma central interativa de alta costura, contendo simulador visual em tempo real, paletas de estilista aplicáveis com um clique e organização impecável em abas.

---

## 💎 Destaques da Nova Interface

1. **Organização por Abas Horizontais / Verticais:**
   - Reduz a poluição visual separando as 9 seções originais em 4 abas coesas: `Identidade & Cores`, `Página Inicial (Landing)`, `Canais & Horários` e `Recibos & Faturamento`.

2. **Simulador Visual em Tempo Real (Mockup Interativo):**
   - Um celular/desktop virtual posicionado ao lado direito do formulário que replica a landing page real do e-commerce.
   - Atualiza instantaneamente fontes, cores primárias, imagens do hero, textos de CTAs e logo de forma reativa conforme o usuário digita.
   - Toggle rápido entre visualização **Mobile** (celular premium) e **Desktop** (tela inteira de vidro).

3. **Paletas Curadas de Alta Costura (One-Click Themes):**
   - 4 paletas pré-configuradas e selecionadas por estilistas de moda (ex: Terracota Artesanal, Oliva Orgânico, Seda Negra e Brisa de Lavanda) que preenchem as cores do formulário instantaneamente ao serem clicadas.

4. **Indicador de Completude da Marca (Completeness Score):**
   - Barra de progresso circular ou linear em LED que analisa quais campos essenciais (logo, cores, telefone, CNPJ) já foram preenchidos e dá uma nota de completude (ex: 85% Concluído).

---

## 🛠️ Proposed Changes

### [Component] [admin.branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.branding.tsx)

#### **Principais alterações:**
- **Estruturação de Layout de Duas Colunas:**
  - Coluna Esquerda (~60%): Barra de progresso de completude, seletor de abas modernas e formulário dinâmico baseado na aba selecionada com grids melhorados.
  - Coluna Direita (~40%): Mockup físico interativo do celular com renderização de cabeçalho, hero banner com botão nas cores ativas, seção "Sobre o Atelier" e rodapé de contatos.
- **Inserção de Módulo de Temas One-Click:**
  - Grade de botões visuais exibindo as cores de cada paleta de estilista para fácil escolha rápida.
- **Transições e Micro-animações:**
  - Efeitos suaves de fade e escalonamento utilizando classes nativas e Tailwind nos inputs e no simulador.

---

## 🧪 Verification Plan

### Automated Tests
- Execução de `npx tsc --noEmit` para certificar que todas as tipagens das propriedades de `Branding` continuam perfeitamente integradas sem quebras.
- Rodar `npm run build` para garantir que o compilador otimize os novos subcomponentes e estilos com performance impecável e sem warnings de PostCSS.

### Manual Verification
- O usuário e desenvolvedores poderão validar visualmente todas as interações abrindo o endereço `/admin/branding` e alterando textos e paletas de cores, observando a renderização imediata no simulador.
