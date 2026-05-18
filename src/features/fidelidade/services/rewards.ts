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
  const { data } = await supabase
    .from("reward_items" as never)
    .select("*")
    .eq("active", true)
    .order("points_cost", { ascending: true });
  return (data ?? []) as unknown as RewardItem[];
}

export async function fetchMyCustomer(userId: string) {
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
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

