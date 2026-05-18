import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { Plus, Trash2, Gift, X, Send, Pencil, Eye, EyeOff, Ticket, Calendar, Copy, ArrowUpRight, ArrowDownLeft, CheckCircle2, User, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { NumInput } from "@/features/core/components/num-input";
import { kindLabel, type RewardItem, type RewardKind, type Redemption, type LedgerEntry } from "@/features/fidelidade/services/rewards";
import { ensurePortalAccount } from "@/features/acessos/services/portal.functions";
import { dateTimeBR, dateBR, brl } from "@/features/core/utils/format";

export const Route = createFileRoute("/_authenticated/admin/recompensas")({
  component: RewardsAdmin,
});

type Tab = "catalogo" | "resgates" | "pontos";

function RewardsAdmin() {
  const [tab, setTab] = useState<Tab>("catalogo");
  return (
    <AdminShell title="Recompensas">
      <nav className="mb-5 flex flex-wrap gap-2">
        {[
          { k: "catalogo", l: "Catálogo" },
          { k: "resgates", l: "Resgates" },
          { k: "pontos", l: "Pontos" },
        ].map((t) => (
          <button
            key={t.k} onClick={() => setTab(t.k as Tab)}
            className={`min-h-10 rounded-full px-4 text-sm ${tab === t.k ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"}`}
          >{t.l}</button>
        ))}
      </nav>
      {tab === "catalogo" && <Catalogo />}
      {tab === "resgates" && <Resgates />}
      {tab === "pontos" && <Pontos />}
    </AdminShell>
  );
}

function Catalogo() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<RewardItem | null>(null);
  const [open, setOpen] = useState(false);
  const [initialKind, setInitialKind] = useState<RewardKind>("produto_fisico");

  const { data: items } = useQuery({
    queryKey: ["rewards-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("reward_items" as never).select("*").order("created_at", { ascending: false });
      return (data ?? []) as unknown as RewardItem[];
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reward_items" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rewards-admin"] }); toast.success("Removido"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleActive = useMutation({
    mutationFn: async (r: RewardItem) => {
      const { error } = await supabase.from("reward_items" as never).update({ active: !r.active } as never).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rewards-admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <>
      <div className="mb-5 flex justify-end gap-3">
        <button
          onClick={() => {
            setEditing(null);
            setInitialKind("produto_fisico");
            setOpen(true);
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 text-sm font-medium text-primary hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Gift className="h-4 w-4" /> Novo produto
        </button>
        <button
          onClick={() => {
            setEditing(null);
            setInitialKind("voucher_valor");
            setOpen(true);
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Ticket className="h-4 w-4" /> Novo voucher
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(items ?? []).map((r) => (
          <div key={r.id} className={`flex gap-3 rounded-2xl border border-border bg-card p-4 ${!r.active ? "opacity-60" : ""}`}>
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
              {r.images[0] ? <img src={r.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Gift className="h-6 w-6 text-muted-foreground" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">{r.code} · {kindLabel(r.kind)}{!r.active && " · inativo"}</div>
              <div className="truncate font-medium">{r.name}</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span><strong className="text-primary">{r.points_cost}</strong> pts</span>
                <span>{r.stock} em estoque</span>
                {r.expires_at && <span>Expira {dateBR(r.expires_at)}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => { setEditing(r); setOpen(true); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs"><Pencil className="h-3 w-3" /> Editar</button>
                <button onClick={() => toggleActive.mutate(r)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs">
                  {r.active ? <><EyeOff className="h-3 w-3" /> Desativar</> : <><Eye className="h-3 w-3" /> Ativar</>}
                </button>
                <button onClick={() => { if (confirm(`Excluir "${r.name}"?`)) del.mutate(r.id); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-rose-600"><Trash2 className="h-3 w-3" /> Excluir</button>
              </div>
            </div>
          </div>
        ))}
        {!items?.length && <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Nenhuma recompensa criada ainda.</div>}
      </div>
      {open && <RewardModal item={editing} initialKind={initialKind} onClose={() => { setOpen(false); setEditing(null); }} />}
    </>
  );
}

function RewardModal({ item, initialKind, onClose }: { item: RewardItem | null; initialKind: RewardKind; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!item;

  const { data: products } = useQuery({
    queryKey: ["products-active-rewards"],
    queryFn: async () => (await supabase.from("products").select("id, name, code, stock, description, images").eq("active", true).order("name")).data ?? [],
  });

  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    kind: (item?.kind ?? initialKind) as RewardKind,
    points_cost: item?.points_cost ?? 50,
    stock: item?.stock ?? 10,
    image_url: item?.images?.[0] ?? "",
    expires_at: item?.expires_at ? item.expires_at.slice(0, 10) : "",
    voucher_value: Number(item?.voucher_value ?? 0),
    voucher_percent: item?.voucher_percent ?? 10,
    voucher_min_order: Number(item?.voucher_min_order ?? 0),
    product_id: item?.product_id ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name, description: form.description || null,
        kind: form.kind, points_cost: form.points_cost, stock: form.stock,
        images: form.image_url ? [form.image_url] : [],
        expires_at: form.expires_at || null,
        voucher_value: form.kind === "voucher_valor" ? form.voucher_value : null,
        voucher_percent: form.kind === "voucher_percent" ? form.voucher_percent : null,
        voucher_min_order: form.voucher_min_order || 0,
        product_id: form.kind === "produto_fisico" ? (form.product_id || null) : null,
      };
      if (isEdit && item) {
        const { error } = await supabase.from("reward_items" as never).update(payload as never).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reward_items" as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rewards-admin"] }); toast.success(isEdit ? "Recompensa atualizada" : "Recompensa criada"); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 md:items-center md:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl border border-border/80 bg-card p-6 shadow-2xl md:rounded-3xl md:p-7 animate-scale-up">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {isEdit ? "Editar Recompensa" : form.kind === "produto_fisico" ? "Novo Produto" : "Novo Voucher"}
          </h2>
          <button onClick={onClose} aria-label="Fechar modal" className="rounded-full p-2 hover:bg-secondary transition-colors cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 text-sm">
          {/* 1. SE FOR PRODUTO FÍSICO: Produto Vinculado no topo absoluto! */}
          {form.kind === "produto_fisico" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto Vinculado (Estoque)</span>
                <select
                  value={form.product_id}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    const p = products?.find((x) => x.id === prodId);
                    setForm({
                      ...form,
                      product_id: prodId,
                      name: p?.name || "",
                      description: p?.description || "",
                      image_url: p?.images?.[0] || "",
                      stock: p?.stock ?? 0,
                    });
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-medium"
                >
                  <option value="">Selecione um produto do estoque...</option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.name} (Estoque: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Card visual herdando as informações em tempo real */}
              {(() => {
                const p = products?.find((x) => x.id === form.product_id);
                if (!p) return null;
                return (
                  <div className="flex gap-3.5 rounded-2xl border border-border bg-secondary/30 p-3.5 items-center animate-fade-in">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground"><Gift className="h-6 w-6" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Informações Herdadas</div>
                      <div className="font-semibold text-sm truncate mt-0.5">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{p.description}</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 2. SE FOR VOUCHER: Nome, Descrição e URL de Imagem no topo */}
          {form.kind !== "produto_fisico" && (
            <>
              {/* Nome e Descrição */}
              <div className="space-y-3">
                <input 
                  placeholder="Nome da recompensa (Ex: R$ 50 Off)" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60" 
                />
                <textarea 
                  placeholder="Descrição detalhada" 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all min-h-20 max-h-40 placeholder:text-muted-foreground/60" 
                />
              </div>

              {/* Seletor Segmentado de Tipo de Voucher */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Voucher</span>
                <div className="flex rounded-xl bg-secondary p-1 border border-border/60">
                  {[
                    { k: "voucher_valor", l: "Valor (R$)" },
                    { k: "voucher_percent", l: "Percentual (%)" },
                    { k: "voucher_frete", l: "Frete grátis" }
                  ].map((opt) => (
                    <button
                      key={opt.k}
                      type="button"
                      onClick={() => setForm({ ...form, kind: opt.k as RewardKind })}
                      className={`flex-1 min-h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        form.kind === opt.k
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL da Imagem */}
              <input 
                placeholder="URL da imagem (opcional)" 
                value={form.image_url} 
                onChange={(e) => setForm({ ...form, image_url: e.target.value })} 
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60" 
              />
            </>
          )}

          {/* Custo em Pontos e Estoque */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo (Pontos)</span>
              <NumInput 
                value={form.points_cost} 
                onValueChange={(v) => setForm({ ...form, points_cost: v ?? 0 })} 
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {form.kind === "produto_fisico" ? "Estoque (Sincronizado)" : "Estoque"}
              </span>
              <NumInput 
                disabled={form.kind === "produto_fisico"} 
                value={form.stock} 
                onValueChange={(v) => setForm({ ...form, stock: v ?? 0 })} 
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-60 disabled:bg-secondary/40" 
              />
            </div>
          </div>

          {/* Valor de Desconto Fixo */}
          {form.kind === "voucher_valor" && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor do Desconto (R$)</span>
              <NumInput 
                value={form.voucher_value} 
                onValueChange={(v) => setForm({ ...form, voucher_value: v ?? 0 })} 
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
              />
            </div>
          )}

          {/* Valor de Desconto Percentual */}
          {form.kind === "voucher_percent" && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Percentual de Desconto (%)</span>
              <NumInput 
                value={form.voucher_percent} 
                onValueChange={(v) => setForm({ ...form, voucher_percent: v ?? 0 })} 
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
              />
            </div>
          )}

          {/* Pedido Mínimo e Data de Expiração */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pedido Mínimo (R$)</span>
              <NumInput 
                value={form.voucher_min_order} 
                onValueChange={(v) => setForm({ ...form, voucher_min_order: v ?? 0 })} 
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Validade (Opcional)</span>
              <input 
                type="date" 
                value={form.expires_at} 
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })} 
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="mt-6 flex gap-3">
          <button 
            type="button"
            onClick={onClose} 
            className="min-h-11 flex-1 rounded-full border border-border bg-background hover:bg-secondary/40 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="button"
            disabled={save.isPending || !form.name} 
            onClick={() => save.mutate()} 
            className="min-h-11 flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {save.isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Resgates() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["redemptions-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("redemptions" as never)
        .select("*, reward:reward_items(name,kind), customer:customers(name,code)")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as (Redemption & { reward: { name: string; kind: string }; customer: { name: string; code: string } })[];
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from("redemptions" as never).update({ status, used_at: status === "utilizado" ? new Date().toISOString() : null } as never).eq("id", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["redemptions-admin"] }); toast.success("Atualizado"); },
  });

  function getStatusStyle(status: string) {
    switch (status) {
      case "resgatado":
        return "border-green-200 bg-green-50 text-green-700 focus:ring-green-400";
      case "utilizado":
        return "border-blue-200 bg-blue-50 text-blue-700 focus:ring-blue-400";
      case "expirado":
        return "border-rose-200 bg-rose-50 text-rose-700 focus:ring-rose-400";
      case "cancelado":
      default:
        return "border-border bg-secondary text-muted-foreground focus:ring-border";
    }
  }

  return (
    <div className="space-y-3">
      {(data ?? []).map((r) => (
        <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-sm">
          {/* Left Icon Badge */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10">
            {r.reward?.kind === "produto_fisico" ? <Gift className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
          </div>

          {/* Middle Content area */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono font-bold text-foreground bg-secondary px-2 py-0.5 rounded">{r.code}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {dateTimeBR(r.created_at)}</span>
            </div>
            
            <div className="text-base font-medium text-foreground">
              {r.reward?.name} 
              <span className="text-muted-foreground font-normal"> para </span>
              <span className="inline-block bg-primary/5 text-primary text-xs font-semibold px-2 py-0.5 rounded-full border border-primary/10">
                {r.customer?.name || "Cliente Desconhecido"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {/* Spent points badge */}
              <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                -{r.points_spent} pts
              </span>

              {/* Code Capsule */}
              {r.voucher_code ? (
                <div className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                  <span>{r.voucher_code}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(r.voucher_code!); toast.success("Código copiado"); }}
                    className="hover:text-primary p-0.5 transition-colors cursor-pointer"
                    title="Copiar código"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                  Produto físico
                </span>
              )}

              {/* Expire check */}
              {r.valid_until && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded border border-border/50">
                  Vence {dateBR(r.valid_until)}
                </span>
              )}
            </div>
          </div>

          {/* Right side interactive Select */}
          <div className="flex items-center gap-2 justify-end self-start md:self-center">
            <select
              value={r.status}
              onChange={(e) => update.mutate({ id: r.id, status: e.target.value })}
              className={`min-h-10 rounded-full border px-4 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-1 cursor-pointer ${getStatusStyle(r.status)}`}
            >
              <option value="resgatado">Resgatado</option>
              <option value="utilizado">Utilizado</option>
              <option value="expirado">Expirado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      ))}
      {!data?.length && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center text-muted-foreground">
          <Gift className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
          <p className="text-sm font-medium">Nenhum resgate registrado ainda.</p>
        </div>
      )}
    </div>
  );
}

function Pontos() {
  const { data } = useQuery({
    queryKey: ["ledger-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("points_ledger" as never)
        .select("*, customer:customers(name,code)")
        .order("created_at", { ascending: false })
        .limit(200);
      return (data ?? []) as unknown as (LedgerEntry & { customer: { name: string; code: string } })[];
    },
  });
  const { data: balances } = useQuery({
    queryKey: ["balances-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_points_balance" as never)
        .select("customer_id, balance").order("balance", { ascending: false });
      return (data ?? []) as unknown as { customer_id: string; balance: number }[];
    },
  });
  const { data: customersMap } = useQuery({
    queryKey: ["customers-min-rewards"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id, name, email, user_id, portal_invited_at");
      const map: Record<string, { name: string; email: string | null; user_id: string | null; portal_invited_at: string | null }> = {};
      (data ?? []).forEach((c) => { map[c.id] = c as never; });
      return map;
    },
  });
  const invite = useServerFn(ensurePortalAccount);
  const [inviting, setInviting] = useState<string | null>(null);

  async function handleInvite(customerId: string) {
    setInviting(customerId);
    try {
      const res = await invite({ data: { customerId, channel: "both" } });
      toast.success(`Convite gerado para ${res.email}`, {
        description: `Senha temporária: ${res.tempPassword}`,
        duration: 15000,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao convidar");
    } finally {
      setInviting(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Left Column: Recent Ledger Entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Lançamentos recentes</h3>
          <span className="text-xs text-muted-foreground">Exibindo os últimos 200</span>
        </div>
        
        <div className="space-y-2">
          {(data ?? []).map((l) => {
            const isPositive = l.delta > 0;
            return (
              <div key={l.id} className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5 transition-all hover:shadow-sm">
                {/* Visual Direction badge */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  isPositive 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}>
                  {isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                </div>

                {/* Info and Metadata */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {dateTimeBR(l.created_at)}</span>
                  </div>
                  <div className="font-semibold text-foreground truncate">{l.customer?.name || "Cliente sem nome"}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.description || l.reason}</div>
                </div>

                {/* Point delta display */}
                <div className={`font-display text-lg font-bold shrink-0 px-2 py-0.5 rounded ${
                  isPositive ? "text-emerald-600" : "text-rose-600"
                }`}>
                  {isPositive ? "+" : ""}{l.delta}
                </div>
              </div>
            );
          })}
          {!data?.length && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center text-muted-foreground">
              Nenhum lançamento de pontos registrado ainda.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Point Balances & Access Invitation Controls */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Saldos · acesso ao portal</h3>
        
        <div className="space-y-2.5">
          {(balances ?? []).map((b) => {
            const c = customersMap?.[b.customer_id];
            const hasAccess = !!c?.user_id;
            return (
              <div key={b.customer_id} className="rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="truncate font-semibold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{c?.name ?? b.customer_id.slice(0, 8)}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{c?.email ?? "Sem e-mail cadastrado"}</div>
                  </div>
                  <div className="shrink-0 bg-primary/5 border border-primary/10 rounded-xl px-3 py-1 text-right">
                    <strong className="text-primary font-display text-base font-semibold">{b.balance} pts</strong>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  {/* Status Indicator */}
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    hasAccess 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : "bg-secondary text-muted-foreground border-border"
                  }`}>
                    {hasAccess ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>Acesso ativo</span>
                      </>
                    ) : (
                      <span>Sem acesso</span>
                    )}
                  </span>

                  {/* Actions Button */}
                  <button
                    disabled={!c?.email || inviting === b.customer_id}
                    onClick={() => handleInvite(b.customer_id)}
                    className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition-all cursor-pointer ${
                      hasAccess
                        ? "bg-secondary hover:bg-secondary/80 border-border text-foreground"
                        : "bg-primary text-primary-foreground border-primary hover:opacity-90"
                    } disabled:opacity-50`}
                  >
                    {inviting === b.customer_id ? (
                      <span>Processando...</span>
                    ) : hasAccess ? (
                      <>
                        <KeyRound className="h-3 w-3 shrink-0" />
                        <span>Resetar senha</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3 shrink-0" />
                        <span>Convidar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {!balances?.length && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground text-sm">
              Nenhum saldo computado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

