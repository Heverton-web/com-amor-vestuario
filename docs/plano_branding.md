# Plano de Implementação — Upgrade Ultra-Premium: Branding & Conteúdo

Este documento detalha o plano técnico para refatorar e elevar a aba de **Branding & Conteúdo** ([admin.branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.branding.tsx)) de um formulário comum para uma central interativa de alta costura, contendo simulador visual em tempo real, paletas de estilista aplicáveis com um clique e organização impecável em abas.

---

## 💎 Destaques da Nova Interface

1. **Organização por Abas Horizontais / Verticais:**
   - Reduz a poluição visual separando as seções originais em 4 abas curtas e coesas: `Identidade & Cores`, `Página Inicial`, `Canais & Horários` e `Emissor de Recibos`.

2. **Simulador Visual em Tempo Real (Mockup Interativo Multi-Ambiente):**
   - Um celular/desktop virtual posicionado ao lado direito do formulário que replica a landing page real do e-commerce.
   - **Seletor de Páginas:** Permite visualizar a **Landing Page**, a **Loja Virtual (Catálogo)** ou a área de **Fidelidade (Clube de Recompensas)**, reativamente.
   - Atualiza instantaneamente fontes, cores primárias, imagens do hero, textos de CTAs e logotipos correspondentes de forma reativa conforme o usuário digita.
   - Toggle rápido entre visualização **Mobile** (celular premium) e **Desktop** (tela inteira de vidro).

3. **Logotipos Múltiplos por Ambiente:**
   - Permite o upload de arquivos transparentes PNG/SVG exclusivos para cada ambiente do ecossistema:
     - Logo Geral (Fallback)
     - Logo da Landing Page
     - Logo da Loja Virtual
     - Logo do Clube de Recompensas
     - Logo de Recibos & Faturamento

4. **Paletas Sazonais & Personalizadas (One-Click Themes):**
   - **Sazonalidades:** Paletas prontas divididas em _Festividades_ (Dia das Mães, Natal, Ano Novo) e _Estações_ (Primavera/Verão, Outono/Inverno).
   - **Criador de Paleta Própria:** Permite ajustar as cores nos seletores visuais, definir um nome exclusivo e salvar a paleta na sua lista de coleções pessoais, persistindo no banco de dados.

5. **Indicador de Completude da Marca (Completeness Score):**
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
