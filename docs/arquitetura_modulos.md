# 🏛️ Arquitetura do Sistema: Módulos e Correlações

Este documento fornece um mapeamento detalhado da arquitetura baseada em recursos (**Feature-Based Architecture**) da plataforma **Com Amor Vestuário**. Ele serve como guia para entender a divisão de responsabilidades de negócios, a estrutura de arquivos em `src/features/` e os fluxos de integração orientados a eventos (webhooks) que interligam os módulos.

---

## 🎯 Visão Geral da Arquitetura

O projeto adota uma estrutura em que o código é organizado **por domínio de negócio (recurso)** e não por tipo técnico (como arquivos separados de hooks, componentes e tipos). 

* **`src/features/`**: Pasta centralizadora. Cada pasta interna representa um módulo independente contendo seus próprios componentes, utilitários, serviços de API e tipos.
* **`src/routes/`**: Camada de roteamento (TanStack Router). Os arquivos de rotas atuam estritamente como **Entrypoints (Controladores Leves)**. Eles apenas configuram metadados (como SEO), definem as permissões de acesso e renderizam os componentes de páginas que são importados das respectivas features.
* **Comunicação Inter-Módulos:** A comunicação entre as features segue regras rígidas. Recursos compartilhados residem no módulo `core`. Integrações de negócios específicas usam exportações públicas explícitas definidas nos arquivos `index.ts` (barrel files) de cada feature.

---

## 📂 Detalhamento dos Módulos (`src/features/`)

Abaixo estão detalhados os 9 módulos que compõem o ecossistema da plataforma:

### 1. ⚙️ `core` (Infraestrutura, UI Base e Autenticação)
O alicerce técnico e visual do projeto. Tudo o que é compartilhado globalmente e não possui regras acopladas a uma regra de negócio específica reside aqui.

* **Estrutura e Arquivos Chave:**
  * **[components/ui/](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/components)**: Botões, modais, tabelas, inputs e componentes base do Shadcn.
  * **[AdminShell.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/components/AdminShell.tsx)**: O layout administrativo unificado com a barra de navegação e menu lateral.
  * **[services/branding.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/services/branding.tsx)**: Motor de estilização visual dinâmica e customização de cores da marca.
  * **[services/pdf.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/services/pdf.ts)** e **[pdf-receipt.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/services/pdf-receipt.ts)**: Motores de geração de relatórios e recibos em PDF.
  * **[integrations/supabase/](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/integrations/supabase)**: Cliente de conexão do Supabase, definições de tipos do banco (`types.ts`) e middlewares de autenticação.
  * **[integrations/auth.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/core/integrations/auth.tsx)**: Contexto global de autenticação de usuários (sessões, login e logout).
* **Correlações e Integrações:**
  * Todos os outros módulos importam componentes UI e conexões do Supabase do `core`.
  * Fornece o contexto de login que o módulo de `acessos` gerencia.

---

### 2. 🎁 `fidelidade` (Clube de Recompensas e Pontos)
Responsável por toda a jornada de incentivo, fidelização de clientes e resgate de prêmios.

* **Estrutura e Arquivos Chave:**
  * **[components/RewardCard.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/fidelidade/components/RewardCard.tsx)**: Card visual para exibição das recompensas disponíveis para resgate.
  * **[components/RewardModal.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/fidelidade/components/RewardModal.tsx)**: Interface de criação, edição e exclusão de recompensas pelo painel do administrador.
  * **[services/rewards.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/fidelidade/services/rewards.ts)**: Funções de processamento de pontos (ledger de pontos, cálculo de saldo, requisições de resgate e cupons).
* **Correlações e Integrações:**
  * Consome dados de clientes do módulo `crm` para associar pontuações.
  * Integra-se ao módulo de `vendas` fornecendo cupons promocionais gerados a partir do saldo de pontos dos clientes, os quais são validados no momento do checkout.
* **Eventos Associados:**
  * `fidelidade.pontos_acumulados`: Disparado ao adicionar pontos a um cliente.
  * `fidelidade.resgate_solicitado`: Disparado ao solicitar a troca de pontos por um voucher.
  * `fidelidade.resgate_concluido`: Disparado quando o voucher é utilizado ou entregue pelo administrador.

---

### 3. 🛍️ `vendas` (E-commerce, Carrinho e Pedidos)
Compreende o fluxo completo da jornada de compra pública, do carrinho ao checkout, e a gestão dos pedidos de venda recebidos.

* **Estrutura e Arquivos Chave:**
  * **[services/cart.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/vendas/services/cart.ts)**: Gerenciamento do estado local e persistência do carrinho de compras.
  * **[services/pricing.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/vendas/services/pricing.ts)**: Lógica de precificação inteligente (conversão automática entre atacado e varejo com base em quantidade/valor).
  * **[services/freight.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/vendas/services/freight.ts)**: Cálculo de regras de frete e prazos.
  * **[services/viacep.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/vendas/services/viacep.ts)**: Integração com a API ViaCEP para autocompletar endereços no checkout.
* **Correlações e Integrações:**
  * Consome produtos do catálogo (**catalogo**) para renderização da loja e do carrinho.
  * Valida e consome vouchers do clube de vantagens (**fidelidade**).
  * Envia dados de pedidos pagos para faturamento no módulo **financeiro**.
  * Cria e atualiza cards no funil comercial do **crm** a partir do andamento das vendas.
* **Eventos Associados:**
  * `vendas.pedido_criado`: Novo pedido adicionado.
  * `vendas.pedido_pago`: Confirmação de pagamento recebida.
  * `vendas.pedido_cancelado`: Cancelamento por falta de pagamento ou ação manual.
  * `vendas.pedido_status_alterado`: Alteração no andamento ou envio do pedido.

---

### 4. 🏷️ `catalogo` (Produtos e Variações)
Módulo responsável pela gestão e especificação técnica de todas as peças e coleções de roupas antes do processo de venda.

* **Estrutura e Arquivos Chave:**
  * **[types.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/catalogo/types.ts)**: Modelagem de dados de produtos, categorias e grades de variações (cores e tamanhos).
* **Correlações e Integrações:**
  * Fornece o catálogo de produtos e variações para exibição na loja pública e carrinho no módulo **vendas**.
  * É impactado pelo módulo de **vendas** ao dar baixa nos estoques físicos quando um pagamento é efetuado.
* **Eventos Associados:**
  * `produtos.estoque_alterado`: Atualização do saldo de estoque de um produto ou variação.
  * `produtos.esgotado`: Disparado quando o estoque de um item atinge zero.

---

### 5. 👥 `crm` (Gestão de Leads, Clientes B2B e Orçamentos)
Focado no relacionamento com clientes atacadistas, captação de novos leads e negociações de fardamento corporativo.

* **Estrutura e Arquivos Chave:**
  * **[types.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/crm/types.ts)**: Definições de leads, clientes B2B, cartões de Kanban e propostas.
* **Correlações e Integrações:**
  * Fornece a base de clientes unificada utilizada em **vendas** e **fidelidade**.
  * Ao ter um orçamento aprovado (`orcamento.aprovado`), este módulo interage com o de **vendas** para a conversão do orçamento em pedido ativo e com o **financeiro** para emissão de faturas de faturamento corporativo.
* **Eventos Associados:**
  * `crm.lead_capturado`: Novo lead preenche dados em formulários.
  * `crm.cliente_criado`: Cadastro de novo perfil no ecossistema.
  * `crm.cliente_atualizado`: Alteração de dados cadastrais.
  * `orcamento.criado`: Elaboração de proposta de orçamento.
  * `orcamento.aprovado`: Cliente aprova a proposta de orçamento.
  * `orcamento.rejeitado`: Proposta é negada ou cancelada.

---

### 6. 💳 `financeiro` (Faturamento, Cobranças e Emissão Fiscal)
Módulo encarregado da gestão de entradas e saídas de caixa decorrentes de vendas B2C e negociações B2B.

* **Estrutura e Arquivos Chave:**
  * **[types.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/financeiro/types.ts)**: Estruturas de faturas, faturamentos parcelados e notas fiscais eletrônicas.
* **Correlações e Integrações:**
  * É provocado pelas ações de criação de pedidos (**vendas**) ou fechamento de orçamentos (**crm**) para gerar os registros de faturamento.
  * Envia dados de faturas pagas de volta a **vendas** para liberação de mercadoria e a **fidelidade** para cálculo de pontos.
* **Eventos Associados:**
  * `financeiro.fatura_criada`: Emissão de cobrança.
  * `financeiro.pagamento_confirmado`: Confirmação da entrada financeira.
  * `financeiro.recibo_emitido`: Geração do arquivo de recibo fiscal/PDF.

---

### 📈 7. `marketing` (Campanhas, UTMs e SEO Institucional)
O módulo de aquisição. Gerencia a landing page pública, captura de contatos e análises de tráfego.

* **Estrutura e Arquivos Chave:**
  * **[components/](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/marketing/components)**: Componentes dinâmicos da Landing Page institucional (ex: `Hero.tsx`, `About.tsx`, `Gallery.tsx`, `ContactDialog.tsx`, `Testimonials.tsx`).
* **Correlações e Integrações:**
  * Rastreia os parâmetros UTM e repassa os dados de novos clientes ao **crm** no momento do cadastro ou envio de formulário de contato.
  * Fornece dashboards analíticos com taxas de conversão de cliques em vendas.

---

### 🔑 8. `acessos` (Equipe, Níveis de Acesso e Permissões)
Gerencia quem pode acessar o painel administrativo da empresa e os portais privados de clientes.

* **Estrutura e Arquivos Chave:**
  * **[services/admin-team.functions.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/acessos/services/admin-team.functions.ts)**: Funções de gestão de membros da equipe (criação, edição e listagem de funcionários).
  * **[services/portal.functions.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/acessos/services/portal.functions.ts)**: Lógica de vinculação de credenciais do Supabase Auth a clientes.
  * **[services/demo-admin.functions.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/acessos/services/demo-admin.functions.ts)**: Simulação e populações de contas de teste administrativas.
* **Correlações e Integrações:**
  * Funciona em conjunto com a autenticação do `core` para autorizar rotas administrativas e portais de clientes específicos do clube de fidelidade.

---

### 🛠️ 9. `desenvolvedor` (Console do Desenvolvedor e Integrações)
Interface administrativa dedicada a diagnósticos técnicos de API e simulação de cenários em tempo real.

* **Estrutura e Arquivos Chave:**
  * **[components/DevConsoleDashboard.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/desenvolvedor/components/DevConsoleDashboard.tsx)**: Dashboard visual para visualização de logs, monitoramento de conexões e disparo manual de webhooks.
  * **[services/api-diagnostics.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/desenvolvedor/services/api-diagnostics.ts)**: Validação do status de serviços essenciais da aplicação.
  * **[services/integrations-simulator.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/desenvolvedor/services/integrations-simulator.ts)**: Criação de payloads simulados e realistas para as diversas categorias de eventos.
  * **[services/webhook-dispatcher.ts](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/features/desenvolvedor/services/webhook-dispatcher.ts)**: Componente que envia os eventos para as URLs do N8N cadastradas.
* **Correlações e Integrações:**
  * Mapeia e intercepta os eventos de todos os outros módulos do ecossistema, servindo como uma centralizadora de testes para integrações com o N8N.

---

## 🔄 Fluxos de Correlação e Eventos do Ecossistema

As integrações dinâmicas de dados na plataforma baseiam-se em uma **Arquitetura Orientada a Eventos (Event-Driven)**. 

### Tabela de Mapeamento de Eventos e Gatilhos

| Evento | Módulo Emissor | Módulo Impactado | Gatilho no Supabase | Ação Resultante esperada no N8N |
| :--- | :--- | :--- | :--- | :--- |
| `vendas.pedido_criado` | `vendas` | `financeiro` / `crm` | `INSERT` em `public.orders` | Dispara notificação de boas-vindas no WhatsApp; cria fatura inicial no financeiro. |
| `vendas.pedido_pago` | `vendas` | `fidelidade` / `catalogo` | `UPDATE` em `public.orders` | Adiciona pontos de recompensa; envia mensagem de pagamento confirmado; inicia produção. |
| `fidelidade.pontos_acumulados`| `fidelidade` | `crm` | `INSERT` em `public.points_ledger` | Notifica o saldo atualizado de pontos do cliente via WhatsApp. |
| `fidelidade.resgate_solicitado`| `fidelidade` | `vendas` | `INSERT` em `public.redemptions` | Envia o código do voucher gerado para o cliente e cria cupom no banco. |
| `orcamento.aprovado` | `crm` | `vendas` / `financeiro` | `UPDATE` em `public.quotes` | Converte o orçamento aprovado em um pedido ativo e gera as respectivas faturas. |
| `produtos.estoque_alterado` | `catalogo` | `vendas` | `UPDATE` em `public.products` | Atualiza a vitrine de produtos impedindo compras acima do limite físico. |

### Roteamento Dinâmico de Webhooks

A plataforma conta com um sistema de roteamento flexível de eventos cadastrados no banco de dados através da tabela `integration_settings`:

1. **Configuração por Evento:** Permite cadastrar uma URL do N8N específica para cada tipo de evento usando a chave `n8n:nome_do_evento` (ex: `n8n:vendas.pedido_criado`).
2. **Configuração Global (Fallback):** Caso um evento específico não possua uma URL cadastrada, o `webhook-dispatcher` busca uma URL global do provedor (`provider = 'n8n'`) para despachar o payload.
3. **Ambiente Dev:** Através do painel `DevConsoleDashboard`, o desenvolvedor pode simular o envio de qualquer um dos eventos acima no ambiente de desenvolvimento, facilitando o desenvolvimento e debug de workflows no N8N sem a necessidade de realizar compras ou ações reais de produção.
