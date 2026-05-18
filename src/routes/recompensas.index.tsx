import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, LogIn, Gift } from "lucide-react";
import { supabase } from "@/features/core/integrations/supabase/client";
import { useAuth } from "@/features/core/integrations/auth";
import { useBranding } from "@/features/core/services/branding";
import { fetchActiveRewards, fetchMyCustomer, genVoucherCode, kindLabel, rewardSummary, type RewardItem } from "@/features/fidelidade/services/rewards";
import { RewardCard } from "@/features/fidelidade/components/RewardCard";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/features/core/components/dialog";

export const Route = createFileRoute("/recompensas/")({
  component: RecompensasIndexPage,
});

type Filter = "todos" | "produto" | "voucher";

function RecompensasIndexPage() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("todos");
  const [confirming, setConfirming] = useState<RewardItem | null>(null);

  const { data: rewards } = useQuery({ queryKey: ["rewards-public"], queryFn: fetchActiveRewards });
  const { data: customer } = useQuery({
    queryKey: ["my-customer", user?.id],
    queryFn: () => (user ? fetchMyCustomer(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const { data: balance } = useQuery({
    queryKey: ["my-balance", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return 0;
      const { data } = await supabase
        .from("customer_points_balance" as never)
        .select("balance")
        .eq("customer_id", customer.id)
        .maybeSingle();
      return ((data as { balance?: number } | null)?.balance) ?? 0;
    },
    enabled: !!customer?.id,
  });

  const redeem = useMutation({
    mutationFn: async (reward: RewardItem) => {
      if (!customer) throw new Error("Faça login para resgatar");
      if ((balance ?? 0) < reward.points_cost) throw new Error("Pontos insuficientes");

      // Validar estoque do produto principal se for físico
      if (reward.kind === "produto_fisico" && reward.product_id) {
        const { data: prod } = await supabase.from("products").select("stock").eq("id", reward.product_id).single();
        if (!prod || prod.stock <= 0) throw new Error("Produto sem estoque físico no momento");
      } else if (reward.stock <= 0) {
        throw new Error("Sem estoque");
      }

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (branding.redemption_days_default || 30));
      const voucherCode = reward.kind !== "produto_fisico" ? genVoucherCode() : null;

      const { data: red, error } = await supabase
        .from("redemptions" as never)
        .insert({
          customer_id: customer.id,
          reward_item_id: reward.id,
          points_spent: reward.points_cost,
          voucher_code: voucherCode,
          valid_until: validUntil.toISOString().slice(0, 10),
        } as never)
        .select()
        .single();
      if (error) throw error;
      const redemption = red as unknown as { id: string; code: string };

      await supabase.from("points_ledger" as never).insert({
        customer_id: customer.id,
        delta: -reward.points_cost,
        reason: "resgate",
        redemption_id: redemption.id,
        description: `Resgate: ${reward.name}`,
      } as never);

      if (reward.kind === "produto_fisico" && reward.product_id) {
        // Criar pedido (orders) com total 0.00 e status 'separado'
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({
            customer_id: customer.id,
            status: "separado",
            source: "recompensa",
            subtotal: 0,
            shipping: 0,
            total: 0,
            notes: `Resgate de Recompensa ${redemption.code}: ${reward.name}`,
          })
          .select()
          .single();

        if (orderErr) throw orderErr;

        // Associar o item físico ao pedido
        await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: reward.product_id,
          product_name: reward.name,
          quantity: 1,
          unit_price: 0,
          total: 0,
          color: reward.product_variant?.color || null,
          size: reward.product_variant?.size || null,
        });

        // Criar o card no Kanban de Pedidos (Estágio 'separado')
        await supabase.from("kanban_cards").insert({
          board: "pedidos",
          stage: "separado",
          title: `Resgate: ${order.code} · ${customer.name}`,
          customer_id: customer.id,
          order_id: order.id,
          amount: 0,
          contact_name: customer.name,
          contact_whatsapp: customer.phone || "",
        });

        // Vincular o ID do pedido gerado de volta no registro de resgate
        await supabase
          .from("redemptions" as never)
          .update({
            used_in_order_id: order.id,
            status: "utilizado",
            used_at: new Date().toISOString(),
          } as never)
          .eq("id", redemption.id);
      } else {
        // Se for um voucher, decrementa o estoque virtual do próprio item de recompensa
        await supabase.from("reward_items" as never)
          .update({ stock: reward.stock - 1 } as never)
          .eq("id", reward.id);
      }
    },
    onSuccess: () => {
      toast.success("Resgate realizado com sucesso! Pedido de entrega gerado como 'separado'.");
      qc.invalidateQueries({ queryKey: ["rewards-public"] });
      qc.invalidateQueries({ queryKey: ["my-balance"] });
      qc.invalidateQueries({ queryKey: ["my-redemptions"] });
      setConfirming(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (rewards ?? []).filter((r) => {
    if (filter === "produto") return r.kind === "produto_fisico";
    if (filter === "voucher") return r.kind !== "produto_fisico";
    return true;
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/40 px-3 py-1 text-[11px] uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> Programa de pontos
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            {branding.rewards_label}
          </h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            A cada R$ {branding.points_per_real} em compras você ganha 1 ponto. Troque por
            peças exclusivas e vouchers especiais.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          {user && customer ? (
            <>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Seu saldo</div>
              <div className="mt-1 font-display text-5xl text-primary">{balance ?? 0}</div>
              <div className="text-sm text-muted-foreground">pontos disponíveis</div>
              <div className="mt-4 text-sm">Olá, <strong>{customer.name}</strong>!</div>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">Entre para ver seus pontos</div>
              <Link
                to="/recompensas/login"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                <LogIn className="h-4 w-4" /> Acessar minha conta
              </Link>
              <p className="mt-3 text-xs text-muted-foreground">
                Suas credenciais foram enviadas por e-mail / WhatsApp após sua primeira compra.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {(["todos", "produto", "voucher"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-11 rounded-full px-4 text-sm transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"
            }`}
          >
            {f === "todos" ? "Todos" : f === "produto" ? "Produtos" : "Vouchers"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {filtered.map((r) => (
          <RewardCard key={r.id} reward={r} balance={user ? (balance ?? 0) : null} onRedeem={setConfirming} />
        ))}
      </div>

      {!filtered.length && (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          <Gift className="mx-auto h-8 w-8" />
          <p className="mt-3">Nada por aqui ainda. Volte em breve!</p>
        </div>
      )}

      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar resgate</DialogTitle>
            <DialogDescription>
              {confirming && (
                <>
                  Você está prestes a resgatar <strong>{confirming.name}</strong> ({rewardSummary(confirming)})
                  por <strong>{confirming.points_cost} pontos</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {confirming && user && customer && (
            <div className="space-y-2 rounded-xl bg-secondary/40 p-4 text-sm">
              <div className="flex justify-between"><span>Saldo atual</span><strong>{balance ?? 0} pts</strong></div>
              <div className="flex justify-between"><span>Custo do resgate</span><strong>− {confirming.points_cost} pts</strong></div>
              <div className="flex justify-between border-t border-border pt-2"><span>Saldo após resgate</span><strong>{(balance ?? 0) - confirming.points_cost} pts</strong></div>
              <div className="pt-2 text-xs text-muted-foreground">
                Validade do {kindLabel(confirming.kind).toLowerCase()}: {branding.redemption_days_default} dias
              </div>
            </div>
          )}
          <DialogFooter>
            {!user ? (
              <Link to="/recompensas/login" className="min-h-11 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">
                Entrar para resgatar
              </Link>
            ) : (
              <button
                disabled={redeem.isPending}
                onClick={() => confirming && redeem.mutate(confirming)}
                className="min-h-11 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {redeem.isPending ? "Resgatando..." : "Confirmar resgate"}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

