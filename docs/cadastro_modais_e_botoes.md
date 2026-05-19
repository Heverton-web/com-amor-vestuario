# Modais de Cadastro Premium & Padronização de Botões

Esta documentação detalha a arquitetura técnica, as escolhas de design e a padronização visual aplicadas no painel de **Branding & Conteúdo** do _Atelier Com Amor Vestuário_.

---

## 1. Modais de Cadastro Premium

Para aprimorar a experiência do usuário (UX) de cadastro e evitar inserções acidentais de elementos incompletos diretamente na lista de rascunhos, implementamos modais específicos e altamente responsivos.

### 1.1 Cadastro de Nova Imagem (`AddImageModal`)

- **Propósito**: Permitir que o estilista ou administrador adicione novas fotos à galeria da Landing Page ("Quem veste a gente").
- **Componentes e Recursos**:
  - **Chassis de Upload (Dropzone)**: Espaço retangular com bordas tracejadas e micro-animações (scale-up do ícone no hover). Suporta upload de imagens real com feedback imediato via Supabase Storage.
  - **Campo de Legenda**: Input de texto curto premium com foco atenuado de cor.
  - **Seleção de Disposição na Grade**: Seletor para layout Padrão ($1\times1$) ou Destaque Vertical ($1\times2$ usando `md:row-span-2`), permitindo total flexibilidade editorial diretamente da interface administrativa.
  - **Validação Ativa**: Impede o salvamento se não houver imagem carregada ou legenda preenchida.

### 1.2 Cadastro de Novo Depoimento (`AddTestimonialModal`)

- **Propósito**: Cadastrar depoimentos e relatos reais dos clientes para o rodapé dinâmico da Landing Page.
- **Componentes e Recursos**:
  - **Citação do Depoimento**: Textarea otimizada com placeholder contextualizado de alta fidelidade.
  - **Identificação do Cliente**: Inputs dedicados para o Nome Completo e Ocupação/Cargo (Ex: "Beatriz Lima - Sócia da Solaris").
  - **Validação Ativa**: Garante integridade nas opiniões cadastradas.

---

## 2. Padronização Ultra-Premium dos Botões

Seguindo o guia de design system de alta fidelidade estabelecido no ecossistema digital da marca, todos os botões do painel de controle de branding foram revisados para seguir um padrão uniforme de classes e comportamento:

### 2.1 Botões Primários (`Action Buttons`)

- **Classes Utilizadas**:
  ```typescript
  className =
    "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm";
  ```
- **Características**:
  - Cantos totalmente arredondados (`rounded-full`).
  - Altura mínima consistente de $40px$ em telas de cadastro (`min-h-[40px]`).
  - Efeitos suaves de transição no hover (`transition-colors hover:bg-primary/90`).
  - Ausência total de emojis de sistema no texto (substituídos por ícones do _Lucide-react_ como `Plus`, `Save`, `Upload`, `X`).

### 2.2 Botões Secundários (`Cancel / Border Buttons`)

- **Classes Utilizadas**:
  ```typescript
  className =
    "inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-xs font-semibold hover:bg-muted transition-colors";
  ```
- **Características**:
  - Bordas sutis no padrão da interface e fundo transparente/translúcido.
  - Foco e hover leves com cor de fundo atenuada (`hover:bg-muted`).

---

## 3. Fluxo de Integração e Rascunho Reativo

Os modais atuam de forma totalmente sincronizada com o estado reativo (`draft` e `setDraft`) da página de branding:

1. O usuário clica em **Adicionar Imagem** ou **Adicionar Depoimento**.
2. O modal correspondente é exibido como um overlay dinâmico (`backdrop-blur-sm`).
3. Ao finalizar o preenchimento, os novos dados são anexados ao array local do rascunho correspondente:
   - `draft.gallery_items`
   - `draft.testimonials`
4. A lista principal e o simulador interativo multi-ambiente reagem **imediatamente**, atualizando o mockup visual em tempo real.
5. O usuário consolida todas as mudanças clicando em **Salvar Tudo** no cabeçalho administrativo, persistindo as informações com 100% de integridade no banco de dados.

---

## 4. Carrosséis Dinâmicos de Alta Fidelidade (Gallery & Testimonials)

Para enriquecer a experiência do cliente final (Landing Page) e dar vida ao conteúdo dinâmico editado, transformamos a listagem estática em carrosséis automáticos fluidos e elegantes:

### 4.1 Carrossel da Galeria de Fotos (`Gallery.tsx`)

- **Auto-Play Inteligente**: Avanço automático a cada $3.5$ segundos com efeito de transição suave e acelerado por hardware (`ease-in-out duration-1000`).
- **Controle por Hover**: Pausa o carrossel temporariamente quando o cursor está posicionado sobre as fotos (`onMouseEnter`/`onMouseLeave`).
- **Visualização Responsiva Dinâmica**:
  - **Celulares**: $1$ foto visível por slide.
  - **Tablets**: $2$ fotos visíveis por slide.
  - **Desktops**: $4$ fotos visíveis por slide.
- **Dots de Navegação**: Indicadores arredondados na parte inferior, onde o slide ativo assume formato expandido (_Pill styling_ `w-6 bg-primary`), entregando uma estética premium contemporânea.

### 4.2 Carrossel de Depoimentos (`Testimonials.tsx`)

- **Auto-Play Inteligente**: Avanço automático a cada $4.5$ segundos, permitindo tempo de leitura ideal de forma tranquila e harmoniosa.
- **Layout Fluido**:
  - **Celulares**: $1$ depoimento por slide.
  - **Tablets**: $2$ depoimentos por slide.
  - **Desktops**: $3$ depoimentos por slide.
- **Estilização Refinada**: Cards com desfoque de fundo e bordas translúcidas de alta costura e dots dinâmicos brancos (`primary-foreground`).
