# Módulo: Loja de Recompensas (Resgate por pontos)

Nome sugerido para a página pública: **"Loja de Recompensas Com Amor"** (rota `/recompensas`).

---

## 1. Regras de negócio

- **Acúmulo:** 1 ponto a cada R$ 10,00 gastos (arredondado para baixo) em pedidos com status `pago` ou superior — vale tanto loja virtual quanto pedido manual feito pelo consultor.
- **Lançamento:** quando um pedido entra em `pago`/`finalizado`, é registrado um evento positivo em `points_ledger` (créditos). Cancelamentos geram débito reverso.
- **Resgate:** quando o cliente troca pontos, registra-se um evento negativo no ledger e um registro em `redemptions` com status `resgatado`.
- **Tipos de recompensa:**
  - `produto_fisico` (vinculado opcionalmente a um produto real do catálogo, com unidades reservadas)
  - `voucher_valor` (R$ X off no pedido)
  - `voucher_percent` (X% off no pedido)
  - `voucher_frete` (frete grátis)
- **Validade:** cada recompensa tem `expires_at` opcional + cada resgate tem `valid_until` (default 30 dias).
- **Status do resgate:** `resgatado` → `utilizado` (consumido no checkout/pedido) → `expirado` (após validade).

---

## 2. Banco de dados (nova migration)

Tabelas novas:

- `reward_items` — catálogo da loja de recompensas
  - `code`, `name`, `description`, `images[]`, `kind` (enum), `points_cost`, `stock`, `expires_at`, `voucher_value`, `voucher_percent`, `voucher_min_order`, `product_id` (FK opcional), `product_variant` (cor/tamanho), `active`
- `points_ledger` — histórico de pontos (append-only)
  - `customer_id`, `delta` (int, +/-), `reason` (`pedido`, `resgate`, `ajuste`, `estorno`), `order_id?`, `redemption_id?`, `description`
- `redemptions` — resgates feitos
  - `code` (RG0001), `customer_id`, `reward_item_id`, `points_spent`, `status` (`resgatado`/`utilizado`/`expirado`/`cancelado`), `valid_until`, `voucher_code` (gerado), `used_in_order_id?`, `used_at?`
- Extensão em `products`: coluna `rewards_reserved` (int, default 0) para indicar unidades realocadas para recompensas.
- Extensão em `customers`: coluna `portal_access_token` + `portal_password_hash` (ou usar Supabase Auth — ver §6).

View `customer_points_balance` (sum do ledger por cliente) para leitura rápida.

RLS:

- `reward_items`: leitura pública dos ativos; staff gerencia.
- `points_ledger` e `redemptions`: cliente vê apenas o próprio (via `auth.uid()` → join com `customers.user_id`); staff vê tudo.

Trigger:

- `on orders status → pago/finalizado`: insere crédito no ledger (idempotente por `order_id`).
- `on redemptions insert`: insere débito no ledger e decrementa `reward_items.stock`.

---

## 3. Frontend público — `/recompensas`

- **Hero** com saldo de pontos (se logado) ou CTA "Entrar para ver meus pontos".
- **Grid de cards** (2 col mobile / 3-4 desktop) seguindo design system:
  - Imagem (aspect 4/5), nome, badge do tipo, **valor em pontos** em destaque, qtd disponível, **countdown regressivo** quando `expires_at` definido.
  - Botão "Resgatar" (desabilitado se pontos insuficientes ou estoque 0).
- **Filtros:** Todos / Produtos / Vouchers.
- Modal de confirmação de resgate com resumo (pontos antes/depois, validade).
- Página `/recompensas/login` — login simples (e-mail + senha) usando Supabase Auth.

### Área do cliente — `/recompensas/minha-conta`

- Cards: saldo atual, total acumulado, total resgatado.
- **Tabs:**
  - **Meus Resgates**: lista de cards com código, item, validade, status (badges), código do voucher copiável.
  - **Timeline / Extrato**: linha do tempo do `points_ledger` (créditos verdes, débitos rosa) com filtro por período.
  - **Vouchers ativos**: destaque para vouchers usáveis com botão "Copiar código".

---

## 4. Frontend admin — nova categoria "Recompensas"

Sidebar (nova categoria entre Vendas e Acompanhamento):

- **Recompensas → Catálogo** (`/admin/recompensas`): CRUD de `reward_items` com modal de criação (campos: imagens via storage `product-images`, nome, tipo, pontos, estoque, expiração, código, e — se produto físico — picker de produto existente + variação).
- **Recompensas → Resgates** (`/admin/recompensas/resgates`): tabela de `redemptions` com filtros por status, ações (marcar utilizado, cancelar/estornar pontos, exportar CSV).
- **Recompensas → Pontos** (`/admin/recompensas/pontos`): visualização do ledger por cliente + ação "ajuste manual" (crédito/débito com motivo).

Na página existente `/admin/produtos`:

- Coluna nova "Reservado p/ recompensas" e botão "Realocar p/ recompensas" — abre modal pedindo quantidade e cria/atualiza um `reward_items` vinculado àquele produto.

---

## 5. Aplicação dos vouchers

- **Checkout (loja virtual `/checkout`)** e **modal Novo Pedido (`/admin/pedidos`)**: novo campo "Código de voucher".
  - Função `validateVoucher(code, customerId, subtotal)` → server function que valida cliente dono, status `resgatado`, validade, valor mínimo.
  - Aplica desconto/frete grátis, mostra linha no resumo.
  - Ao confirmar pedido: marca `redemption` como `utilizado`, vincula `used_in_order_id`.

---

## 6. Autoprovisionamento de credenciais

Fluxo no primeiro pedido do cliente (loja ou consultor):

1. Server function `ensurePortalAccount(customerId)`:
   - Se cliente ainda não tem `auth user`, cria via `supabaseAdmin.auth.admin.createUser` com senha temporária aleatória (8 chars) + `email_confirm: true`.
   - Salva `user_id` em `customers`.
   - Retorna `{ email, tempPassword, loginUrl }`.
2. **Disparo de e-mail** (SMTP Google): inicialmente via **mock log** no banco (`portal_invitations`) com instruções de plug-in posterior. Quando o usuário quiser ativar de verdade, configuro Lovable Emails ou conector Gmail.
3. **Disparo WhatsApp**: server function que faz `POST` para webhook n8n configurável em `site_settings.n8n_rewards_webhook` (o n8n cuida da EvolutionAPI). Já entrego o payload pronto: `{ name, whatsapp, email, tempPassword, loginUrl }`.
4. Tela "Primeiro acesso" pede troca de senha.

⚠️ As credenciais reais de SMTP/n8n virão via secrets quando você quiser ativar — o módulo já é entregue com o disparo plugado e logando em `portal_invitations` para QA.

---

## 7. Dados mock (seed)

Insert via `supabase--insert` após migration:

- 6 `reward_items` reaproveitando 3 produtos reais (blusa, vestido, camiseta) + 3 vouchers (R$ 50 off, 10% off, frete grátis).
- Para 3-4 customers existentes:
  - 4-6 créditos no ledger (simulando pedidos antigos), totalizando 150-400 pts cada.
  - 1-2 resgates: 1 `utilizado`, 1 `resgatado` ativo, 1 `expirado`.
- 1 redemption vinculada a um pedido existente como exemplo de voucher aplicado.

---

## 8. Arquivos a criar/editar

**Novos:**

- `supabase/migrations/<ts>_rewards_module.sql`
- `src/lib/rewards.functions.ts` (server fns: list, redeem, validateVoucher, adminCrud, ensurePortalAccount, sendInvitation)
- `src/lib/points.ts` (helpers cliente)
- `src/routes/recompensas.tsx` (landing pública + grid)
- `src/routes/recompensas.login.tsx`
- `src/routes/_authenticated_customer.tsx` (layout guard para clientes)
- `src/routes/_authenticated_customer/minha-conta.tsx`
- `src/components/rewards/RewardCard.tsx`, `Countdown.tsx`, `RedeemDialog.tsx`, `VoucherInput.tsx`
- `src/routes/_authenticated/admin.recompensas.tsx`
- `src/routes/_authenticated/admin.recompensas.resgates.tsx`
- `src/routes/_authenticated/admin.recompensas.pontos.tsx`

**Editar:**

- `src/lib/admin-pages.ts` (nova categoria + 3 páginas)
- `src/components/admin/AdminShell.tsx` (ícones)
- `src/routes/_authenticated/admin.produtos.tsx` (botão "Realocar p/ recompensas")
- `src/routes/checkout.tsx` e `src/routes/_authenticated/admin.pedidos.tsx` (campo voucher)
- `src/lib/branding.tsx` + `admin.branding.tsx` (campos: regra de pontos R$/ponto, webhook n8n, link da loja de recompensas)
- `src/components/landing/Header.tsx` / `Footer.tsx` (link "Loja de Recompensas")

---

## 9. Perguntas antes de partir para o código

1. **Login do cliente**: Supabase Auth padrão (e-mail + senha gerada) — confirma? Ou prefere "magic link" (clica no e-mail e entra sem senha)?
2. **Regra de pontos** (1pt / R$10): fixa no código ou configurável no Branding?
3. **Validade padrão do resgate**: 30 dias OK?
4. **E-mail/WhatsApp agora**: entrego com mock (gravando em `portal_invitations`) e plugamos SMTP+n8n depois, ou você já fornece o webhook n8n e configuramos Lovable Emails agora?

Confirma o plano e me responde as 4 perguntas que eu já implemento tudo na sequência.
