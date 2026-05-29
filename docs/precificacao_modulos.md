# 💰 Modelo de Precificação Comercial por Módulos (SaaS)

Este documento descreve uma proposta de precificação comercial modular para a plataforma **Com Amor Vestuário**, baseada na divisão técnica de módulos em `src/features/`.

Esta proposta adota a lógica **"A la Carte" (Módulos Individuais)** baseada nos **Menus Visíveis no Painel Administrativo** da cliente, permitindo-a decidir o que habilitar ou desabilitar na barra lateral.

---

## 🏛️ Lógica Comercial e Ancoragem de Valor

* **Soma dos Módulos Individuais (A la Carte):** Setup R$ 20.000,00 | Mensalidade R$ 1.600,00
* **Combo Ecossistema Completo (Ultimate):** Setup R$ 15.000,00 | Mensalidade R$ 1.200,00
  * *Vantagem para o Cliente:* Economia imediata de **R$ 5.000,00 no setup** e **R$ 400,00/mês na assinatura**.

```mermaid
graph TD
    subgraph A la Carte [Contratação por Menus Visíveis]
        core[Core Base - R$ 3.000 | R$ 290<br>Menus: Início, Equipe, Branding]
        vendas[Loja & Catálogo - +R$ 4.000 | +R$ 300<br>Menus: Produtos, Pedidos, Clientes]
        crm[CRM & Orçamentos - +R$ 3.500 | +R$ 250<br>Menus: CRM Kanban, Orçamentos]
        fidelidade[Clube de Recompensas - +R$ 2.500 | +R$ 200<br>Menus: Clube Com Amor]
        financeiro[Financeiro & NF-e - +R$ 3.000 | +R$ 220<br>Menus: Faturas, Recibos, Nota Fiscal]
        marketing[Marketing & UTMs - +R$ 1.500 | +R$ 140<br>Menus: Análises, Gerador UTM]
        dev[Automações WhatsApp - +R$ 2.500 | +R$ 200<br>Backstage: Integrações N8N]
    end

    A la Carte -.-> |Desconto Combo ~ 25%| Combo[Combo Completo: R$ 15k Setup | R$ 1.200/mês]
```

---

## 📊 Matriz de Preços Baseada nos Menus Visíveis

| Item de Contratação | Menus Visíveis Liberados | Setup (Único) | Valor Mensal |
| :--- | :--- | :---: | :---: |
| **0. Core Base (Obrigatório)** | 🏠 **Início** \| 👥 **Equipe** \| 🎨 **Branding** | **R$ 3.000,00** | **R$ 290,00** |
| **1. Loja Virtual & Vendas** | 🏷️ **Produtos** \| 🛍️ **Pedidos** \| 👤 **Clientes** | **+ R$ 4.000,00** | **+ R$ 300,00** |
| **2. CRM & Orçamentos B2B** | 📋 **CRM (Kanban)** \| 📑 **Orçamentos** | **+ R$ 3.500,00** | **+ R$ 250,00** |
| **3. Clube de Fidelidade** | 🎁 **Clube Com Amor** | **+ R$ 2.500,00** | **+ R$ 200,00** |
| **4. Financeiro & Fiscal** | 💳 **Faturas** \| 📄 **Recibos** \| 🏛️ **Nota Fiscal** | **+ R$ 3.000,00** | **+ R$ 220,00** |
| **5. Marketing & UTMs** | 📊 **Análises** \| 🔗 **Gerador UTM** | **+ R$ 1.500,00** | **+ R$ 140,00** |
| **6. Automações de WhatsApp** | *Backstage (Sem menu)* | **+ R$ 2.500,00** | **+ R$ 200,00** |
| **SOMA DOS AVULSOS** | — | **R$ 20.000,00** | **R$ 1.600,00** |
| **COMBO COMPLETO (ALL-IN)**| **Todos os Menus Ativos** | **R$ 15.000,00** | **R$ 1.200,00** |

---

## 🔍 Detalhamento dos Módulos e Menus Ativados

### Módulo 0: Core Base (Obrigatório)
*Este módulo é o alicerce essencial da plataforma. Sem ele, nenhum outro menu ou tela pode funcionar.*
* **Setup (Fee):** R$ 3.000,00 | **Mensalidade:** R$ 290,00 / mês
* **Menus Ativados na Barra Lateral:**
  * 🏠 **Início:** Dashboard administrativo centralizado que resume a atividade diária e mostra atalhos rápidos para as operações.
  * 👥 **Equipe:** Gerenciador avançado de colaboradores da marca. Permite cadastrar funcionários e marcar quais páginas/menus específicos cada funcionário tem permissão de visualizar e alterar (Ex: bloquear financeiro e liberar catálogo).
  * 🎨 **Branding:** Painel dinâmico que permite à cliente mudar toda a identidade visual da plataforma (paleta de cores primárias/secundárias, logotipo e fontes) instantaneamente, alterando tanto o admin quanto o e-commerce.

---

### Módulo 1: Loja Virtual & Vendas B2C
*Habilita a vitrine pública de vendas e todo o controle operacional de estoque e remessas.*
* **Setup (Fee):** + R$ 4.000,00 | **Mensalidade:** + R$ 300,00 / mês
* **Menus Ativados na Barra Lateral:**
  * 🏷️ **Produtos:** Gestão completa do PIM (Product Information Management). Permite cadastrar peças de roupas com grades avançadas de variação combinada (por exemplo: Cor: Azul / Tamanho: M / Estoque: 15 peças).
  * 🛍️ **Pedidos:** Sistema de rastreamento logístico e status dos pedidos feitos pelo e-commerce (Aguardando pagamento, Em produção, Despachado, Concluído).
  * 👤 **Clientes:** Base unificada com o histórico de compras de cada cliente final B2C, dados de contato e endereços cadastrados.

---

### Módulo 2: CRM & Orçamentos B2B
*Focado em vendas corporativas de grande porte (como uniformes em lote e fardamentos sob medida).*
* **Setup (Fee):** + R$ 3.500,00 | **Mensalidade:** + R$ 250,00 / mês
* **Menus Ativados na Barra Lateral:**
  * 📋 **CRM (Kanban):** Painel visual de arrastar cartões de leads (prospects, proposta enviada, em negociação, fechado) para organizar o relacionamento com marcas parceiras e grandes contratos.
  * 📑 **Orçamentos:** Construtor dinâmico de propostas comerciais de atacado com geração automática de PDFs profissionais timbrados e personalizados prontos para envio.

---

### Módulo 3: Clube de Fidelidade
*Ferramenta ativa de engajamento do pós-venda para reter clientes B2C e impulsionar a recorrência.*
* **Setup (Fee):** + R$ 2.500,00 | **Mensalidade:** + R$ 200,00 / mês
* **Menus Ativados na Barra Lateral:**
  * 🎁 **Clube Com Amor:** Painel de gestão do clube de vantagens. Habilita o ledger automático de pontos (Ex: a cada R$ 1,00 gasto, o cliente ganha 1 ponto) e permite cadastrar o catálogo de prêmios físicos ou vouchers de desconto disponíveis para os compradores resgatarem na área pública logada ("Minha Conta").

---

### Módulo 4: Financeiro & Fiscal
*Gerenciador fiscal e financeiro do negócio que garante a conformidade com as regras fiscais do governo.*
* **Setup (Fee):** + R$ 3.000,00 | **Mensalidade:** + R$ 220,00 / mês
* **Menus Ativados na Barra Lateral:**
  * 💳 **Faturas:** Lançamento de faturamentos parcelados específicos para vendas corporativas, enviando boletos e Pix diretamente para os clientes.
  * 📄 **Recibos:** Emissor digital e controle de baixa de pagamentos com links de recibo em PDF compartilháveis (`recibo/$token`).
  * 🏛️ **Nota Fiscal:** Emissor integrado de Notas Fiscais Eletrônicas (NF-e). Conecta diretamente a plataforma à Prefeitura/SEFAZ e envia a nota autorizada automaticamente ao cliente.

---

### Módulo 5: Marketing & UTMs
*Habilita ferramentas analíticas de aquisição para mensurar o retorno de investimentos publicitários.*
* **Setup (Fee):** + R$ 1.500,00 | **Mensalidade:** + R$ 140,00 / mês
* **Menus Ativados na Barra Lateral:**
  * 📊 **Análises:** Dashboard estatístico que mostra número de visitas, taxa de conversão de cliques e faturamento global.
  * 🔗 **Gerador UTM:** Criador de URLs parametrizadas. Permite gerar links de produtos específicos para influenciadores ou anúncios (Facebook/Google Ads) e rastrear no painel exatamente de qual link veio cada venda realizada.

---

### Módulo 6: Automações de WhatsApp (Backstage)
*O motor de mensageria automática em segundo plano que melhora a experiência e reduz custos de atendimento.*
* **Setup (Fee):** + R$ 2.500,00 | **Mensalidade:** + R$ 200,00 / mês
* **Menus Ativados na Barra Lateral:**
  * *Sem menu visível.* Funciona de forma transparente em segundo plano integrando o banco de dados Supabase aos fluxos do N8N para disparar notificações transacionais de WhatsApp (Ex: "Olá Maria, seu pedido #103 foi pago e entrou em produção!" ou "Seu voucher do Clube de Fidelidade foi gerado: XXXXXX").
