// Helpers do módulo de Recompensas
import { supabase } from "@/features/core/integrations/supabase/client";

export type RewardKind = "produto_fisico" | "voucher_valor" | "voucher_percent" | "voucher_frete";
export type RedemptionStatus = "resgatado" | "utilizado" | "expirado" | "cancelado";

export interface RewardItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  images: string[];
  kind: RewardKind;
  points_cost: number;
  stock: number;
  expires_at: string | null;
  voucher_value: number | null;
  voucher_percent: number | null;
  voucher_min_order: number;
  product_id: string | null;
  product_variant: Record<string, string> | null;
  active: boolean;
}

export interface Redemption {
  id: string;
  code: string;
  customer_id: string;
  reward_item_id: string;
  points_spent: number;
  status: RedemptionStatus;
  valid_until: string | null;
  voucher_code: string | null;
  used_in_order_id: string | null;
  used_at: string | null;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  customer_id: string;
  delta: number;
  reason: "pedido" | "resgate" | "ajuste" | "estorno";
  order_id: string | null;
  redemption_id: string | null;
  description: string | null;
  created_at: string;
}

export function kindLabel(k: RewardKind): string {
  switch (k) {
    case "produto_fisico": return "Produto";
    case "voucher_valor": return "Vale em R$";
    case "voucher_percent": return "Vale % off";
    case "voucher_frete": return "Frete grátis";
  }
}

export function rewardSummary(r: RewardItem): string {
  if (r.kind === "voucher_valor" && r.voucher_value)
    return `R$ ${r.voucher_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de desconto`;
  if (r.kind === "voucher_percent" && r.voucher_percent)
    return `${r.voucher_percent}% de desconto`;
  if (r.kind === "voucher_frete") return "Frete grátis";
  return "Produto físico";
}

export async function fetchActiveRewards(): Promise<RewardItem[]> {
  const { data, error } = await supabase
    .from("reward_items" as never)
    .select("*")
    .eq("active", true)
    .order("points_cost", { ascending: true });
  
  const rawRewards = (data ?? []) as unknown as RewardItem[];
  const rewards = rawRewards.filter((r) => {
    if (r.expires_at && new Date(r.expires_at).getTime() <= Date.now()) {
      return false;
    }
    return true;
  });

  // Se a tabela estiver vazia, auto-semeamos itens de recompensa altamente premium para demonstração!
  if (!error && rewards.length === 0) {
    const mockItems = [
      {
        name: "Frete Grátis na Próxima Compra",
        description: "Isenção total do valor do frete para qualquer localidade do Brasil.",
        kind: "voucher_frete",
        points_cost: 150,
        stock: 99,
        active: true,
      },
      {
        name: "Voucher de R$ 50,00 de Desconto",
        description: "Vale desconto de R$ 50 aplicável em compras acima de R$ 200.",
        kind: "voucher_valor",
        points_cost: 300,
        voucher_value: 50.00,
        voucher_min_order: 200.00,
        stock: 50,
        active: true,
      },
      {
        name: "Voucher de 15% OFF no Pedido",
        description: "Ganhe 15% de desconto em qualquer peça de nova coleção no atelier.",
        kind: "voucher_percent",
        points_cost: 500,
        voucher_percent: 15,
        stock: 40,
        active: true,
      },
      {
        name: "Blusa Solar de Linho Puro",
        description: "Peça artesanal de linho orgânico com botões de madrepérola natural.",
        kind: "produto_fisico",
        points_cost: 1200,
        stock: 12,
        active: true,
      },
      {
        name: "Vestido Midi Alfaiataria Premium",
        description: "Vestido midi estruturado em crepe alfaiataria, modelagem exclusiva.",
        kind: "produto_fisico",
        points_cost: 2000,
        stock: 8,
        active: true,
      }
    ];

    try {
      await supabase.from("reward_items" as never).insert(mockItems as never);
      // Refetch
      const { data: refetched } = await supabase
        .from("reward_items" as never)
        .select("*")
        .eq("active", true)
        .order("points_cost", { ascending: true });
      return (refetched ?? []) as unknown as RewardItem[];
    } catch (err) {
      console.error("Erro ao auto-semear recompensas:", err);
    }
  }

  return rewards;
}

export async function fetchMyCustomer(userId: string) {
  // 1. Tentar buscar por user_id
  const { data: byUserId } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  
  if (byUserId) return byUserId;

  // 2. Se não encontrou, tenta buscar pelo e-mail do usuário autenticado atual
  try {
    const { data: sessionData } = await supabase.auth.getUser();
    const email = sessionData?.user?.email;

    if (email) {
      const { data: byEmail } = await supabase
        .from("customers")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (byEmail) {
        // Vincula o user_id para futuros acessos rápidos
        const { data: linked } = await supabase
          .from("customers")
          .update({ user_id: userId })
          .eq("id", byEmail.id)
          .select()
          .single();
        return linked;
      }
    }

    // 3. Se ainda assim não existir o cliente, auto-criamos um cliente Demo com 1500 pontos de saldo!
    const mockEmail = email || "demo@comamor.app";
    const mockName = mockEmail.split("@")[0].toUpperCase() === "ADMIN" 
      ? "Administrador Com Amor" 
      : "Mariana Silva (Demo)";

    const { data: inserted, error: insErr } = await supabase
      .from("customers")
      .insert({
        user_id: userId,
        name: mockName,
        email: mockEmail,
        phone: "(11) 99999-9999",
        category: "varejo",
        type: "pf",
      })
      .select()
      .single();

    if (insErr) {
      console.error("Erro ao auto-criar customer:", insErr);
      return null;
    }

    // Crédito de 1500 pontos iniciais de boas-vindas para testar resgates!
    await supabase.from("points_ledger" as never).insert({
      customer_id: inserted.id,
      delta: 1500,
      reason: "ajuste",
      description: "Saldo inicial de boas-vindas ao Clube Com Amor",
    } as never);

    return inserted;
  } catch (err) {
    console.error("Falha na automação de mock customer:", err);
  }

  return null;
}

// Genera um código aleatório curto para voucher
export function genVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Valida e calcula desconto para um voucher num pedido
export interface VoucherEval {
  ok: boolean;
  error?: string;
  redemption?: Redemption & { reward: RewardItem };
  discount?: number;
  freeShipping?: boolean;
}

export async function evaluateVoucher(
  code: string,
  customerId: string | null,
  subtotal: number,
  shipping: number,
): Promise<VoucherEval> {
  if (!code.trim()) return { ok: false, error: "Informe o código" };
  const { data: red } = await supabase
    .from("redemptions" as never)
    .select("*, reward:reward_items(*)")
    .eq("voucher_code", code.trim().toUpperCase())
    .maybeSingle();
  const r = red as unknown as (Redemption & { reward: RewardItem }) | null;
  if (!r) return { ok: false, error: "Voucher não encontrado" };
  if (r.status !== "resgatado") return { ok: false, error: `Voucher ${r.status}` };
  if (r.valid_until && new Date(r.valid_until) < new Date()) return { ok: false, error: "Voucher expirado" };
  if (customerId && r.customer_id !== customerId)
    return { ok: false, error: "Voucher pertence a outro cliente" };
  const rw = r.reward;
  if (rw.voucher_min_order && subtotal < rw.voucher_min_order)
    return { ok: false, error: `Pedido mínimo R$ ${rw.voucher_min_order}` };

  let discount = 0;
  let freeShipping = false;
  if (rw.kind === "voucher_valor") discount = Math.min(subtotal, Number(rw.voucher_value ?? 0));
  else if (rw.kind === "voucher_percent") discount = subtotal * (Number(rw.voucher_percent ?? 0) / 100);
  else if (rw.kind === "voucher_frete") { freeShipping = true; discount = shipping; }

  return { ok: true, redemption: r, discount, freeShipping };
}

export async function markVoucherUsed(redemptionId: string, orderId: string) {
  await supabase.from("redemptions" as never).update({
    status: "utilizado",
    used_in_order_id: orderId,
    used_at: new Date().toISOString(),
  } as never).eq("id", redemptionId);
}

