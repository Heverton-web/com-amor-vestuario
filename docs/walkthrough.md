# Walkthrough: Implementação do Fluxo de Estoque e Resgates

Este documento resume as implementações realizadas para sincronizar os estoques de produtos físicos da Loja de Recompensas e processar seus resgates com geração automática de pedidos no status `'separado'` e baixa unificada no faturamento.

---

## 🛠️ Alterações Executadas

### 1. Migração do Banco de Dados (Supabase)
*   **Arquivo criado:** [20260517223500_sincronizacao_estoque.sql](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/supabase/migrations/20260517223500_sincronizacao_estoque.sql)
*   **Triggers Adicionadas:**
    1.  `trg_sync_reward_product_stock`: Mantém o estoque virtual de itens de recompensa sincronizado com o estoque real do produto físico convencional no momento de criação ou edição.
    2.  `trg_sync_reward_stock_from_product`: Monitora mudanças de estoque em `public.products` (ex: compras, ajustes manuais) e replica instantaneamente em `public.reward_items.stock` para itens vinculados.
    3.  `trg_deduct_stock_on_invoice`: Monitora a tabela `public.orders` e, **apenas quando o pedido transicionar para o status `'pago'` (Pago/Faturado)**, realiza a baixa física de todos os itens do pedido na tabela `public.products.stock`.

### 2. Painel de Controle Administrativo
*   **Arquivo modificado:** [admin.recompensas.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/_authenticated/admin.recompensas.tsx)
*   **Melhorias na UI/UX:**
    *   Adicionado o dropdown **"Produto Vinculado"** no modal de criação e edição de recompensas (`RewardModal`) quando o tipo da recompensa é definido como `"Produto físico"`.
    *   **Estoque Travado e Sincronizado:** Quando um produto físico convencional é selecionado, o campo manual de `Estoque` é desabilitado na interface e exibe o texto `"(Sincronizado)"`, garantindo consistência visual.
    *   O formulário salva o relacionamento no campo `product_id` da tabela `public.reward_items`.

### 3. Mutação de Resgate de Recompensa Física
*   **Arquivo modificado:** [recompensas.index.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/recompensas.index.tsx)
*   **Fluxo de Resgate Físico Automatizado:**
    1.  Valida se há saldo e se o estoque em `products.stock` (e não apenas o virtual da recompensa) é maior que zero.
    2.  Registra a redenção em `public.redemptions`.
    3.  Gera um pedido real em `public.orders` com `status = 'separado'` e `total = 0.00` (resgatado por pontos).
    4.  Associa o item físico ao pedido através de `public.order_items`.
    5.  Cria o card de Kanban automaticamente no estágio `'separado'` para acionar instantaneamente a expedição administrativa.
    6.  Marca a redenção como `utilizado` e associa o `used_in_order_id` ao novo pedido criado.

### 4. Remoção de Baixa Manual no Frontend
*   **Arquivo modificado:** [checkout.tsx](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/src/routes/checkout.tsx)
*   **Limpeza lógica:** Removida a baixa de estoque imediata executada via mutação no React no momento de finalização do pedido. O pedido agora é criado no status inicial `'realizado'` sem alterar o estoque físico do produto convencional. A baixa real e definitiva ocorrerá somente quando o status for alterado para `'pago'` (Faturado), por meio da trigger PostgreSQL.

---

## 🚦 Próximos Passos de Validação

1.  **Rodar a Migração:** Execute o arquivo [20260517223500_sincronizacao_estoque.sql](file:///c:/Users/trcnologia/Desktop/proj_comamor-vestuario/supabase/migrations/20260517223500_sincronizacao_estoque.sql) no editor SQL do painel do Supabase para injetar as regras automáticas de integridade.
2.  **Vincular uma Recompensa Física:** Vá ao painel administrativo de recompensas, crie uma recompensa do tipo "Produto físico" e vincule-a a um de seus produtos cadastrados. Verifique se o estoque é espelhado perfeitamente.
3.  **Simular um Resgate:** Entre com a conta do cliente, resgate o produto físico e verifique:
    *   Se o pedido no valor de R$ 0,00 foi criado com status `'separado'`.
    *   Se o card Kanban correspondente apareceu na coluna "Separado" do quadro de Pedidos.
    *   Se a baixa de estoque no produto convencional ocorre apenas quando você avança o pedido para a etapa **Pago / Faturado**.
