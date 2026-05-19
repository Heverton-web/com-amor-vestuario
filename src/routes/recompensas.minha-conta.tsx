import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  LogOut,
  Copy,
  TrendingUp,
  TrendingDown,
  Ticket,
  Calendar,
  ShoppingBag,
  Gift,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { supabase } from "@/features/core/integrations/supabase/client";
import { useAuth } from "@/features/core/integrations/auth";
import {
  fetchMyCustomer,
  kindLabel,
  rewardSummary,
  type LedgerEntry,
  type Redemption,
  type RewardItem,
} from "@/features/fidelidade/services/rewards";
import { dateTimeBR, dateBR } from "@/features/core/utils/format";
import { toast } from "sonner";

export const Route = createFileRoute("/recompensas/minha-conta")({
  component: MyAccountPage,
});

type Tab = "resgates" | "extrato" | "vouchers";

function getLedgerStyle(description: string, delta: number) {
  const desc = (description || "").toLowerCase();
  
  if (desc.includes("boas-vindas") || desc.includes("cadastro") || desc.includes("inicial")) {
    return {
      Icon: Gift,
      colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/50",
      badgeText: "Boas-vindas",
    };
  }
  
  if (desc.includes("resgate") || desc.includes("cupom") || desc.includes("vale")) {
    return {
      Icon: Ticket,
      colorClass: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/50",
      badgeText: "Resgate",
    };
  }
  
  if (desc.includes("compra") || desc.includes("pedido") || desc.includes("venda")) {
    return {
      Icon: ShoppingBag,
      colorClass: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-900/50",
      badgeText: "Compra",
    };
  }
  
  if (desc.includes("ajuste") || desc.includes("admin") || desc.includes("correc")) {
    return {
      Icon: Sparkles,
      colorClass: "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900/50",
      badgeText: "Ajuste",
    };
  }
  
  if (delta > 0) {
    return {
      Icon: ArrowUpRight,
      colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/50",
      badgeText: "Crédito",
    };
  } else {
    return {
      Icon: ArrowDownLeft,
      colorClass: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-900/50",
      badgeText: "Débito",
    };
  }
}

function MyAccountPage() {
  const nav = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("resgates");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/recompensas/login" });
  }, [loading, user, nav]);

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
      return (data as { balance?: number } | null)?.balance ?? 0;
    },
    enabled: !!customer?.id,
  });

  const { data: ledger } = useQuery({
    queryKey: ["my-ledger", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const { data } = await supabase
        .from("points_ledger" as never)
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as LedgerEntry[];
    },
    enabled: !!customer?.id,
  });

  const { data: redemptions } = useQuery({
    queryKey: ["my-redemptions", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const { data } = await supabase
        .from("redemptions" as never)
        .select("*, reward:reward_items(*)")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as (Redemption & { reward: RewardItem })[];
    },
    enabled: !!customer?.id,
  });

  if (!user || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  const totalEarned = (ledger ?? []).filter((l) => l.delta > 0).reduce((a, b) => a + b.delta, 0);
  const totalSpent = (ledger ?? []).filter((l) => l.delta < 0).reduce((a, b) => a + b.delta, 0);
  const activeVouchers = (redemptions ?? []).filter(
    (r) =>
      r.status === "resgatado" &&
      r.voucher_code &&
      (!r.valid_until || new Date(r.valid_until) >= new Date()),
  );

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <section className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <h1 className="font-display text-3xl">Olá, {customer.name}!</h1>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Saldo</div>
            <div className="mt-1 font-display text-4xl text-primary">{balance ?? 0}</div>
            <div className="text-xs text-muted-foreground">pontos</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Acumulados</div>
            <div className="mt-1 font-display text-4xl text-green-600">+{totalEarned}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Resgatados</div>
            <div className="mt-1 font-display text-4xl text-rose-600">{totalSpent}</div>
          </div>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2">
          {[
            { k: "resgates", l: "Meus resgates" },
            { k: "extrato", l: "Extrato / Timeline" },
            { k: "vouchers", l: `Vouchers ativos (${activeVouchers.length})` },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as Tab)}
              className={`min-h-11 rounded-full px-4 text-sm ${tab === t.k ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"}`}
            >
              {t.l}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === "resgates" && (
            <ul className="space-y-3">
              {(redemptions ?? []).map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {r.code} · {dateBR(r.created_at)}
                      </div>
                      <div className="font-medium">{r.reward?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.reward && rewardSummary(r.reward)} — {kindLabel(r.reward.kind)}
                      </div>
                    </div>
                    <StatusBadge status={r.status} validUntil={r.valid_until} />
                  </div>
                  {r.voucher_code && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-secondary/50 p-3">
                      <Ticket className="h-4 w-4" />
                      <code className="rounded bg-background px-2 py-1 font-mono text-sm">
                        {r.voucher_code}
                      </code>
                      <span className="text-xs text-muted-foreground">Use no checkout</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(r.voucher_code!);
                          toast.success("Código copiado");
                        }}
                        className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs"
                      >
                        <Copy className="h-3 w-3" /> Copiar
                      </button>
                    </div>
                  )}
                  {r.valid_until && r.status === "resgatado" && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> Válido até {dateBR(r.valid_until)}
                    </div>
                  )}
                </li>
              ))}
              {!redemptions?.length && (
                <li className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
                  Você ainda não resgatou nada.{" "}
                  <Link to="/recompensas" className="underline">
                    Ver recompensas
                  </Link>
                </li>
              )}
            </ul>
          )}

          {tab === "extrato" && (
            <div className="relative border-l border-border/80 ml-4 md:ml-6 pl-6 space-y-6">
              {(ledger ?? []).map((l) => {
                const { Icon, colorClass, badgeText } = getLedgerStyle(l.description || l.reason || "", l.delta);
                return (
                  <div key={l.id} className="relative group">
                    {/* Círculo indicador na Timeline */}
                    <span className={`absolute -left-[43px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border shadow-xs transition-all duration-300 group-hover:scale-110 ${colorClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    
                    {/* Card da transação */}
                    <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:bg-card/90">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          {/* Badge da categoria e data */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase border ${colorClass}`}>
                              {badgeText}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{dateTimeBR(l.created_at)}</span>
                            </div>
                          </div>
                          
                          {/* Título/Descrição */}
                          <h3 className="font-sans text-sm font-medium text-foreground mt-1">
                            {l.description || l.reason}
                          </h3>
                        </div>
                        
                        {/* Pontuação */}
                        <div className="text-right">
                          <div className={`font-display text-xl font-bold tracking-tight ${l.delta > 0 ? "text-green-600" : "text-rose-600"}`}>
                            {l.delta > 0 ? "+" : ""}
                            {l.delta}
                            <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!ledger?.length && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground -ml-6">
                  Sem movimentações ainda.
                </div>
              )}
            </div>
          )}

          {tab === "vouchers" && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {activeVouchers.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-5"
                >
                  <div className="text-xs uppercase tracking-wider text-primary">
                    {kindLabel(r.reward.kind)}
                  </div>
                  <div className="mt-1 font-display text-xl">{rewardSummary(r.reward)}</div>
                  <code className="mt-3 block rounded-lg bg-background px-3 py-2 font-mono text-center text-lg tracking-widest">
                    {r.voucher_code}
                  </code>
                  {r.valid_until && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Válido até {dateBR(r.valid_until)}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(r.voucher_code!);
                      toast.success("Código copiado");
                    }}
                    className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-xs font-medium text-primary-foreground transition-all hover:opacity-90"
                  >
                    <Copy className="h-3 w-3" /> Copiar código
                  </button>
                  <Link
                    to="/loja"
                    className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-card hover:bg-secondary text-xs font-semibold text-primary transition-all cursor-pointer"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Usar na loja
                  </Link>
                </li>
              ))}
              {!activeVouchers.length && (
                <li className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
                  Nenhum voucher ativo.
                </li>
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status, validUntil }: { status: string; validUntil: string | null }) {
  const expired = validUntil && new Date(validUntil) < new Date() && status === "resgatado";
  const label = expired
    ? "Expirado"
    : status === "resgatado"
      ? "Disponível"
      : status === "utilizado"
        ? "Utilizado"
        : status === "cancelado"
          ? "Cancelado"
          : status;
  const cls =
    expired || status === "cancelado"
      ? "bg-rose-100 text-rose-700"
      : status === "utilizado"
        ? "bg-blue-100 text-blue-700"
        : "bg-green-100 text-green-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}
