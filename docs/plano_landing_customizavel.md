# Plano de Implementação — Landing Page 100% Personalizável (Galeria & Depoimentos)

Este plano detalha as alterações necessárias para tornar a Galeria de Clientes e a Seção de Depoimentos da landing page totalmente customizáveis pelo painel administrativo, mantendo a reatividade instantânea, o salvamento unificado no Supabase e uma experiência de edição ultra-premium.

---

## 💎 Arquitetura Proposta

1. **Camada de Dados (`Branding`):**
   - Estenderemos o tipo `Branding` ([branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/services/branding.tsx)) com dois arrays opcionais:
     - `gallery_items`: lista de objetos `{ src: string; caption: string; span?: string }` (onde `span` pode ser `"normal"` ou `"grande"`).
     - `testimonials`: lista de objetos `{ quote: string; name: string; role: string }`.
   - Definiremos valores padrões iniciais idênticos aos mockups originais no objeto `DEFAULT_BRANDING`, garantindo um fallback elegante caso o banco de dados não possua registros salvos.

2. **Interface Administrativa (`admin.branding.tsx`):**
   - Inseriremos novos editores visuais interativos diretamente dentro da aba **`Página Inicial`** (onde já são configurados os elementos do Hero e do Sobre).
   - **Editor de Galeria de Imagens:**
     - Exibição das imagens cadastradas em miniatura.
     - Inputs para Legenda da Imagem.
     - Alternador do formato da imagem na grade: **Padrão** ou **Destaque (Vertical Duplo)**.
     - Uploaders de imagem dedicados por item ou campo para inserir link externo.
     - Botão para **➕ Adicionar Imagem** e **🗑️ Excluir**.
   - **Editor de Depoimentos:**
     - Inputs em formato de formulário sanfonado/lista para cada depoimento.
     - Campos de: Depoimento (Aspas/Texto), Nome do Cliente e Subtítulo/Função (ex: "Cliente Varejo", "Parceiro Comercial").
     - Botão para **➕ Adicionar Depoimento** e **🗑️ Excluir**.
   - Integrados ao fluxo nativo: qualquer adição/remoção atualizará o rascunho de configurações e será visualizado na hora no Simulador Visual e salvo ao clicar em **"Salvar tudo"**.

3. **Renderização Dinâmica no Frontend:**
   - Atualizaremos `Gallery.tsx` e `Testimonials.tsx` para consumir o hook de branding e iterar sobre os dados salvos em vez de usar as listas estáticas originais.
   - Preservaremos os assets locais (`client-1.jpg`, etc.) como fallback resiliente automático.

---

## 🛠️ Proposta de Arquivos Modificados

### [Component] [branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/services/branding.tsx)

- **[MODIFY]** Adicionar propriedades `gallery_items` e `testimonials` ao tipo `Branding`.
- **[MODIFY]** Adicionar valores padrão originais em `DEFAULT_BRANDING` para que a primeira carga do site seja perfeita.

### [Component] [admin.branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.branding.tsx)

- **[MODIFY]** Criar subcomponentes internos no formulário de "Página Inicial" para gerenciar as listas de Galeria e Depoimentos de forma elegante e limpa.
- **[MODIFY]** Atualizar a visualização em tempo real nos mockups da coluna direita.

### [Component] [Gallery.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/marketing/components/Gallery.tsx)

- **[MODIFY]** Consumir o hook `useBranding()` e mapear os itens dinamicamente do banco de dados, utilizando as imagens padrão locais caso a URL do item customizado esteja em branco.

### [Component] [Testimonials.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/marketing/components/Testimonials.tsx)

- **[MODIFY]** Consumir o hook `useBranding()` e renderizar a lista de depoimentos cadastrada pelo administrador de forma totalmente reativa.

---

## 🧪 Plano de Validação

### Testes Automatizados

- Execução de `npx tsc --noEmit` para validação estrita de tipos TypeScript.
- Execução de `npm run build` para garantir que o bundling final do ecossistema continue funcionando livre de erros.

### Homologação Manual

- Acessar o painel administrativo, navegar até a aba "Página Inicial", cadastrar uma nova imagem de galeria e um depoimento de teste, confirmando que o simulador atualiza em tempo real e os dados persistem perfeitamente no Supabase.
