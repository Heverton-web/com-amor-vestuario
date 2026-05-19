import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import {
  Plus,
  Trash2,
  Gift,
  X,
  Send,
  Pencil,
  Eye,
  EyeOff,
  Ticket,
  Calendar,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  User,
  KeyRound,
  Upload,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { NumInput } from "@/features/core/components/num-input";
import {
  kindLabel,
  type RewardItem,
  type RewardKind,
  type Redemption,
  type LedgerEntry,
} from "@/features/fidelidade/services/rewards";
import { ensurePortalAccount } from "@/features/acessos/services/portal.functions";
import { dateTimeBR, dateBR, brl } from "@/features/core/utils/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/features/core/components/dialog";

export const Route = createFileRoute("/_authenticated/admin/recompensas")({
  component: RewardsAdmin,
});

// ─── Componentes reutilizáveis de filtro ────────────────────────────────────

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
};

function FilterSelect({ label, value, onChange, options, placeholder }: FilterSelectProps) {
  const isActive = !!value;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between min-h-[18px]">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        {isActive && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary hover:text-primary/80 cursor-pointer transition-colors"
          >
            <X className="h-2.5 w-2.5" /> Limpar
          </button>
        )}
      </div>
      <div
        className={`relative rounded-xl border transition-all ${isActive ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
      >
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-xl bg-background px-3.5 text-xs outline-none cursor-pointer font-medium appearance-none"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronRight
          className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rotate-90 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>
    </div>
  );
}

type FilterDateProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

function FilterDate({ label, value, onChange }: FilterDateProps) {
  const isActive = !!value;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between min-h-[18px]">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        {isActive && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary hover:text-primary/80 cursor-pointer transition-colors"
          >
            <X className="h-2.5 w-2.5" /> Limpar
          </button>
        )}
      </div>
      <div
        className={`relative rounded-xl border transition-all ${isActive ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
      >
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-xl bg-background px-3.5 text-xs outline-none cursor-pointer font-medium"
        />
      </div>
    </div>
  );
}

// ─── Imagens padrão por tipo de voucher ──────────────────────────────────────

function getDefaultVoucherImage(kind: RewardKind): string {
  if (kind === "voucher_frete") return "/voucher-frete.png";
  if (kind === "voucher_valor") return "/voucher-reais.png";
  if (kind === "voucher_percent") return "/voucher-percentual.png";
  return "/voucher-frete.png"; // fallback genérico
}

function rewardImage(images: string[] | undefined | null, kind: RewardKind): string {
  return images?.[0] ?? getDefaultVoucherImage(kind);
}

// ─────────────────────────────────────────────────────────────────────────────

type Tab = "catalogo" | "resgates" | "historico" | "acessos" | "analises";

function RewardsAdmin() {
  const [tab, setTab] = useState<Tab>("catalogo");
  return (
    <AdminShell title="Recompensas">
      <nav className="mb-5 flex flex-wrap gap-2">
        {[
          { k: "catalogo", l: "Catálogo" },
          { k: "resgates", l: "Resgates" },
          { k: "historico", l: "Histórico" },
          { k: "acessos", l: "Acessos" },
          { k: "analises", l: "Análises" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as Tab)}
            className={`min-h-10 rounded-full px-4 text-sm ${tab === t.k ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"}`}
          >
            {t.l}
          </button>
        ))}
      </nav>
      {tab === "catalogo" && <Catalogo />}
      {tab === "resgates" && <Resgates />}
      {tab === "historico" && <Historico />}
      {tab === "acessos" && <Acessos />}
      {tab === "analises" && <Analises />}
    </AdminShell>
  );
}

function getTimeLeftText(expiresAt: string): {
  text: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
} {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) {
    return { text: "Encerrado", isExpiringSoon: false, isExpired: true };
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  if (d > 0) {
    return {
      text: `Falta ${d}d ${h}h`,
      isExpiringSoon: d <= 2,
      isExpired: false,
    };
  }
  if (h > 0) {
    return {
      text: `Falta ${h}h ${m}m`,
      isExpiringSoon: true,
      isExpired: false,
    };
  }
  return {
    text: `Falta ${m}m`,
    isExpiringSoon: true,
    isExpired: false,
  };
}

function Catalogo() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<RewardItem | null>(null);
  const [open, setOpen] = useState(false);
  const [initialKind, setInitialKind] = useState<RewardKind>("produto_fisico");
  const [extendingItem, setExtendingItem] = useState<RewardItem | null>(null);

  const extendExpiry = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number | null }) => {
      let nextDate: string | null = null;
      if (days !== null) {
        const base = new Date();
        base.setDate(base.getDate() + days);
        nextDate = base.toISOString();
      }
      const { error } = await supabase
        .from("reward_items" as never)
        .update({ expires_at: nextDate } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards-admin"] });
      toast.success("Validade prorrogada com sucesso!");
      setExtendingItem(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: items } = useQuery({
    queryKey: ["rewards-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reward_items" as never)
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as RewardItem[];
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reward_items" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards-admin"] });
      toast.success("Removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleActive = useMutation({
    mutationFn: async (r: RewardItem) => {
      const { error } = await supabase
        .from("reward_items" as never)
        .update({ active: !r.active } as never)
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards-admin"] });
    },
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
        {(items ?? []).map((r) => {
          const isExpired = r.expires_at ? new Date(r.expires_at).getTime() <= Date.now() : false;
          return (
            <div
              key={r.id}
              className={`flex gap-3 rounded-2xl border bg-card p-4 transition-all duration-200 ${
                !r.active
                  ? "border-border/60 opacity-60 bg-secondary/5"
                  : isExpired
                    ? "border-rose-200 dark:border-rose-950/60 bg-rose-50/5 dark:bg-rose-950/5 shadow-sm"
                    : "border-border"
              }`}
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary/40 border border-border">
                {r.images[0] ? (
                  <img src={r.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={rewardImage(r.images, r.kind)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">
                  {r.code} · {kindLabel(r.kind)}
                  {!r.active && (
                    <span className="text-amber-600 font-semibold uppercase tracking-wider text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded-full ml-1">
                      Inativo
                    </span>
                  )}
                  {isExpired && (
                    <span className="text-rose-600 font-semibold uppercase tracking-wider text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                      Encerrado
                    </span>
                  )}
                </div>
                <div className="truncate font-medium mt-1">{r.name}</div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5 text-xs items-center">
                  <span>
                    <strong className="text-primary font-semibold">{r.points_cost}</strong> pts
                  </span>
                  <span className="text-muted-foreground/30">•</span>
                  <span>{r.stock} em estoque</span>
                  {r.expires_at && (
                    <>
                      <span className="text-muted-foreground/30">•</span>
                      {(() => {
                        const {
                          text,
                          isExpiringSoon,
                          isExpired: expired,
                        } = getTimeLeftText(r.expires_at);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${
                              expired
                                ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                : isExpiringSoon
                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse-subtle"
                                  : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            }`}
                          >
                            <Clock className="h-2.5 w-2.5 shrink-0" />
                            {text} (Expira {dateTimeBR(r.expires_at)})
                          </span>
                        );
                      })()}
                    </>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background hover:bg-secondary px-3 text-xs cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" /> Editar / Reativar
                  </button>
                  <button
                    onClick={() => setExtendingItem(r)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary px-3 text-xs cursor-pointer"
                  >
                    <Clock className="h-3 w-3" /> Prorrogar
                  </button>
                  <button
                    onClick={() => toggleActive.mutate(r)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background hover:bg-secondary px-3 text-xs cursor-pointer"
                  >
                    {r.active ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Desativar
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Ativar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${r.name}"?`)) del.mutate(r.id);
                    }}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background hover:bg-rose-50 dark:hover:bg-rose-950/20 px-3 text-xs text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!items?.length && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            Nenhuma recompensa criada ainda.
          </div>
        )}
      </div>

      {open && (
        <RewardModal
          item={editing}
          initialKind={initialKind}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        />
      )}

      {extendingItem && (
        <Dialog open={!!extendingItem} onOpenChange={(o) => !o && setExtendingItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary animate-pulse-subtle" />
                Prorrogar Validade
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm mt-1.5">
                Escolha por quanto tempo deseja prorrogar ou alterar a validade de{" "}
                <strong className="text-foreground">{extendingItem.name}</strong>:
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {[
                { label: "+ 3 Dias", days: 3 },
                { label: "+ 7 Dias", days: 7 },
                { label: "+ 15 Dias", days: 15 },
                { label: "+ 30 Dias", days: 30 },
                { label: "+ 90 Dias", days: 90 },
                { label: "Sem expiração (Vitalício)", days: null },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => extendExpiry.mutate({ id: extendingItem.id, days: opt.days })}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/40 active:scale-[0.98] transition-all text-xs font-semibold text-foreground cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-5 border-t border-border/60 pt-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Ou escolha uma data e hora específica:
              </span>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  id="custom-extend-date"
                  className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  defaultValue={
                    extendingItem.expires_at ? extendingItem.expires_at.slice(0, 16) : ""
                  }
                />
                <button
                  onClick={() => {
                    const el = document.getElementById("custom-extend-date") as HTMLInputElement;
                    if (el && el.value) {
                      const iso = new Date(el.value).toISOString();
                      supabase
                        .from("reward_items" as never)
                        .update({ expires_at: iso } as never)
                        .eq("id", extendingItem.id)
                        .then(({ error }) => {
                          if (error) {
                            toast.error(error.message);
                          } else {
                            qc.invalidateQueries({ queryKey: ["rewards-admin"] });
                            toast.success("Validade prorrogada com sucesso!");
                            setExtendingItem(null);
                          }
                        });
                    } else {
                      toast.error("Por favor, selecione uma data válida.");
                    }
                  }}
                  className="rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExtendingItem(null)}
                className="rounded-full border border-border bg-background px-5 py-2 text-xs font-semibold hover:bg-secondary transition-all active:scale-[0.98] cursor-pointer"
              >
                Cancelar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function RewardModal({
  item,
  initialKind,
  onClose,
}: {
  item: RewardItem | null;
  initialKind: RewardKind;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!item;

  const { data: products } = useQuery({
    queryKey: ["products-active-rewards"],
    queryFn: async () =>
      (
        await supabase
          .from("products")
          .select("id, name, code, stock, description, images")
          .eq("active", true)
          .order("name")
      ).data ?? [],
  });

  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    kind: (item?.kind ?? initialKind) as RewardKind,
    points_cost: item?.points_cost ?? 50,
    stock: item?.stock ?? 10,
    image_url: item?.images?.[0] ?? "",
    expires_at: item?.expires_at ? item.expires_at.slice(0, 16) : "",
    voucher_value: Number(item?.voucher_value ?? 0),
    voucher_percent: item?.voucher_percent ?? 10,
    voucher_min_order: Number(item?.voucher_min_order ?? 0),
    product_id: item?.product_id ?? "",
  });

  const [uploading, setUploading] = useState(false);

  const getCalculatedName = () => {
    if (form.kind === "produto_fisico") {
      const p = products?.find((x) => x.id === form.product_id);
      return p?.name || "Nenhum produto selecionado";
    }
    if (form.kind === "voucher_valor") {
      return `Vale R$ ${form.voucher_value.toFixed(2).replace(".", ",")} de desconto`;
    }
    if (form.kind === "voucher_percent") {
      return `Desconto de ${form.voucher_percent}%`;
    }
    if (form.kind === "voucher_frete") {
      return "Frete grátis";
    }
    return "";
  };

  const isValid = (() => {
    if (form.kind === "produto_fisico") return !!form.product_id;
    if (form.kind === "voucher_valor") return form.voucher_value > 0;
    if (form.kind === "voucher_percent") return form.voucher_percent > 0;
    return true; // voucher_frete
  })();

  const save = useMutation({
    mutationFn: async () => {
      const calculatedName = (() => {
        if (form.kind === "produto_fisico") {
          const p = products?.find((x) => x.id === form.product_id);
          return p?.name || "";
        }
        if (form.kind === "voucher_valor") {
          return `Vale R$ ${form.voucher_value.toFixed(2).replace(".", ",")} de desconto`;
        }
        if (form.kind === "voucher_percent") {
          return `Desconto de ${form.voucher_percent}%`;
        }
        if (form.kind === "voucher_frete") {
          return "Frete grátis";
        }
        return "";
      })();

      const payload: Record<string, unknown> = {
        name: calculatedName,
        description: form.description || null,
        kind: form.kind,
        points_cost: form.points_cost,
        stock: form.stock,
        images: form.image_url ? [form.image_url] : [],
        expires_at: form.expires_at || null,
        voucher_value: form.kind === "voucher_valor" ? form.voucher_value : null,
        voucher_percent: form.kind === "voucher_percent" ? form.voucher_percent : null,
        voucher_min_order: form.voucher_min_order || 0,
        product_id: form.kind === "produto_fisico" ? form.product_id || null : null,
      };
      if (isEdit && item) {
        const { error } = await supabase
          .from("reward_items" as never)
          .update(payload as never)
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reward_items" as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards-admin"] });
      toast.success(isEdit ? "Recompensa atualizada" : "Recompensa criada");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm p-0 md:items-center md:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-6 shadow-md md:rounded-2xl md:p-7 animate-scale-up">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {isEdit
              ? "Editar Recompensa"
              : form.kind === "produto_fisico"
                ? "Novo Produto"
                : "Novo Voucher"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground opacity-80 hover:opacity-100 hover:bg-secondary/80 transition-all cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 text-sm">
          {/* Card de Nome Auto-Gerado / Preview da Recompensa */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between shadow-sm animate-fade-in">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                Nome da Recompensa
              </span>
              <span className="font-display text-base font-bold text-foreground mt-0.5 block truncate leading-tight">
                {getCalculatedName()}
              </span>
            </div>
            <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary ml-3 shadow-inner">
              {form.kind === "produto_fisico" ? (
                <Gift className="h-4.5 w-4.5" />
              ) : (
                <Ticket className="h-4.5 w-4.5" />
              )}
            </div>
          </div>

          {/* 1. SE FOR PRODUTO FÍSICO: Produto Vinculado no topo absoluto! */}
          {form.kind === "produto_fisico" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Produto Vinculado (Estoque)
                </span>
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
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Gift className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        Informações Herdadas
                      </div>
                      <div className="font-semibold text-sm truncate mt-0.5">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {p.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 2. SE FOR VOUCHER: Tipo de Voucher e Descrição no topo */}
          {form.kind !== "produto_fisico" && (
            <>
              {/* Descrição */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Descrição Detalhada
                </span>
                <textarea
                  placeholder="Ex: R$ 50 de desconto para compras acima de R$ 300"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all min-h-20 max-h-40 placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Seletor Segmentado de Tipo de Voucher */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tipo de Voucher
                </span>
                <div className="flex rounded-xl bg-secondary p-1 border border-border/60">
                  {[
                    { k: "voucher_valor", l: "Valor (R$)" },
                    { k: "voucher_percent", l: "Percentual (%)" },
                    { k: "voucher_frete", l: "Frete grátis" },
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

              {/* Imagem do Voucher (Opcional) com Uploader Interativo e URL */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Imagem do Voucher (Opcional)
                </span>

                {uploading ? (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/40 bg-primary/5 rounded-2xl p-6 animate-pulse">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs font-semibold text-primary">
                      Enviando imagem para o storage...
                    </span>
                  </div>
                ) : form.image_url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary/30 p-2.5 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={form.image_url}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                          Imagem selecionada
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm((s) => ({ ...s, image_url: "" }))}
                          className="text-[10px] text-destructive hover:underline font-bold block mt-0.5"
                        >
                          Remover e escolher outra
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <Check className="h-3 w-3 shrink-0" /> Pronto
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 bg-secondary/10 hover:bg-secondary/20 rounded-2xl p-6 cursor-pointer transition-all active:scale-[0.99]">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1.5" />
                    <span className="text-xs font-semibold text-foreground">
                      Clique para enviar imagem
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                      JPEG, PNG ou WEBP (Max 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files?.length) return;
                        setUploading(true);
                        const file = files[0];
                        const path = `rewards/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
                        const { error } = await supabase.storage
                          .from("product-images")
                          .upload(path, file);
                        if (error) {
                          toast.error(error.message);
                          setUploading(false);
                          return;
                        }
                        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
                        setForm((s) => ({ ...s, image_url: data.publicUrl }));
                        setUploading(false);
                        toast.success("Imagem enviada com sucesso!");
                      }}
                    />
                  </label>
                )}

                {/* Alternativa: URL Manual */}
                <input
                  placeholder="Ou cole a URL de uma imagem externa..."
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </>
          )}

          {/* Custo em Pontos e Estoque */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Custo (Pontos)
              </span>
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
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Valor do Desconto (R$)
              </span>
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
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Percentual de Desconto (%)
              </span>
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
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pedido Mínimo (R$)
              </span>
              <NumInput
                value={form.voucher_min_order}
                onValueChange={(v) => setForm({ ...form, voucher_min_order: v ?? 0 })}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Validade (Opcional)
              </span>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer font-medium"
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
            disabled={save.isPending || !isValid}
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
  const [searchClient, setSearchClient] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const { data } = useQuery({
    queryKey: ["redemptions-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("redemptions" as never)
        .select("*, reward:reward_items(name,kind,images), customer:customers(name,code)")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as (Redemption & {
        reward: { name: string; kind: string; images: string[] };
        customer: { name: string; code: string };
      })[];
    },
  });

  const uniqueCustomers = useMemo<{ name: string; code: string }[]>(() => {
    const map = new Map<string, { name: string; code: string }>();
    (data ?? []).forEach((r) => {
      if (r.customer?.name) {
        map.set(r.customer.name, { name: r.customer.name, code: r.customer.code });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const uniqueRewards = useMemo<string[]>(() => {
    const set = new Set<string>();
    (data ?? []).forEach((r) => {
      if (r.reward?.name) {
        set.add(r.reward.name);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase
        .from("redemptions" as never)
        .update({
          status,
          used_at: status === "utilizado" ? new Date().toISOString() : null,
        } as never)
        .eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["redemptions-admin"] });
      toast.success("Atualizado");
    },
  });

  const filtered = (data ?? []).filter((r) => {
    if (searchClient && r.customer?.name !== searchClient) {
      return false;
    }
    if (searchProduct && r.reward?.name !== searchProduct) {
      return false;
    }
    if (filterDate) {
      const redemptionDate = r.created_at ? r.created_at.slice(0, 10) : "";
      if (redemptionDate !== filterDate) {
        return false;
      }
    }
    return true;
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
    <div className="space-y-4">
      {/* Barra de Filtros Ultra-Premium (Cliente, Produto e Data) */}
      <div className="grid gap-3.5 sm:grid-cols-3 bg-secondary/20 border border-border p-3.5 rounded-2xl animate-fade-in font-sans">
        <FilterSelect
          label="Cliente"
          value={searchClient}
          onChange={setSearchClient}
          placeholder="Todos os clientes"
          options={uniqueCustomers.map((c) => ({ value: c.name, label: `${c.name} (${c.code})` }))}
        />

        <FilterSelect
          label="Recompensa"
          value={searchProduct}
          onChange={setSearchProduct}
          placeholder="Todas as recompensas"
          options={uniqueRewards.map((name) => ({ value: name, label: name }))}
        />

        <FilterDate label="Data de Resgate" value={filterDate} onChange={setFilterDate} />
      </div>

      {/* Grid de Cards de Resgates */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            {/* Imagem da recompensa */}
            <div className="relative h-32 w-full overflow-hidden bg-secondary/40">
              <img
                src={rewardImage(
                  r.reward?.images as string[] | undefined,
                  (r.reward?.kind as RewardKind) ?? "frete_gratis",
                )}
                alt={r.reward?.name ?? ""}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Overlay gradiente sutil */}
              <div className="absolute inset-0 bg-gradient-to-t from-card/40 via-transparent to-transparent" />
              {/* Badge de tipo */}
              <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-sm border border-border px-2.5 py-1 text-[10px] font-bold text-foreground uppercase tracking-wider">
                {r.reward?.kind === "produto_fisico" ? (
                  <Gift className="h-3 w-3" />
                ) : (
                  <Ticket className="h-3 w-3" />
                )}
                {r.reward?.kind === "produto_fisico" ? "Produto" : "Voucher"}
              </span>
              {/* Select de status overlay */}
              <div className="absolute right-2.5 top-2.5">
                <select
                  value={r.status}
                  onChange={(e) => update.mutate({ id: r.id, status: e.target.value })}
                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold shadow-sm transition-all focus:outline-none cursor-pointer min-h-0 h-7 ${getStatusStyle(r.status)}`}
                >
                  <option value="resgatado">Resgatado</option>
                  <option value="utilizado">Utilizado</option>
                  <option value="expirado">Expirado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex flex-1 flex-col gap-2.5 p-4">
              {/* Código + data */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-mono font-bold text-foreground bg-secondary px-2 py-0.5 rounded">
                  {r.code}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {dateTimeBR(r.created_at)}
                </span>
              </div>

              {/* Nome da recompensa */}
              <div className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
                {r.reward?.name}
              </div>

              {/* Cliente */}
              <span className="inline-block self-start bg-primary/5 text-primary text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-primary/10 truncate max-w-full">
                {r.customer?.name || "Cliente Desconhecido"}
              </span>

              {/* Badges inferiores */}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                  -{r.points_spent} pts
                </span>
                {r.voucher_code ? (
                  <div className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                    <span>{r.voucher_code}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(r.voucher_code!);
                        toast.success("Código copiado");
                      }}
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
                {r.valid_until && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded border border-border/50">
                    Vence {dateBR(r.valid_until)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!filtered.length && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center text-muted-foreground">
          <Gift className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
          <p className="text-sm font-medium">
            Nenhum resgate encontrado com os filtros selecionados.
          </p>
        </div>
      )}
    </div>
  );
}

const HISTORICO_PAGE_SIZE = 20;

function Historico() {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<"" | "produto" | "voucher">("");

  const { data } = useQuery({
    queryKey: ["ledger-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("points_ledger" as never)
        .select("*, customer:customers(name,code)")
        .order("created_at", { ascending: false })
        .limit(500);
      return (data ?? []) as unknown as (LedgerEntry & {
        customer: { name: string; code: string };
      })[];
    },
  });

  const all = useMemo<(LedgerEntry & { customer: { name: string; code: string } })[]>(() => {
    const raw = data ?? [];
    if (!filterType) return raw;
    if (filterType === "produto") {
      return raw.filter(
        (l) => l.reason === "resgate" && l.description?.toLowerCase().includes("(resgate)"),
      );
    }
    // voucher: resgates que nao sao produto fisico
    if (filterType === "voucher") {
      return raw.filter(
        (l) => l.reason === "resgate" && !l.description?.toLowerCase().includes("(resgate)"),
      );
    }
    return raw;
  }, [data, filterType]);

  const totalPages = Math.max(1, Math.ceil(all.length / HISTORICO_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = all.slice(
    (currentPage - 1) * HISTORICO_PAGE_SIZE,
    currentPage * HISTORICO_PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      {/* Barra de filtros e cabecalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Historico de pontos
          </h3>
          {/* Toggle de tipo */}
          <div className="inline-flex rounded-xl border border-border bg-secondary/30 p-0.5 gap-0.5">
            {(
              [
                { v: "", l: "Todos" },
                { v: "produto", l: "Produto" },
                { v: "voucher", l: "Voucher" },
              ] as { v: "" | "produto" | "voucher"; l: string }[]
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => {
                  setFilterType(opt.v);
                  setPage(1);
                }}
                className={`h-7 rounded-lg px-3 text-[11px] font-semibold transition-all cursor-pointer ${
                  filterType === opt.v
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {all.length} registros · pagina {currentPage} de {totalPages}
        </span>
      </div>

      {/* Lista paginada */}
      <div className="space-y-2">
        {paginated.map((l) => {
          const isPositive = l.delta > 0;
          return (
            <div
              key={l.id}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5 transition-all hover:shadow-sm"
            >
              {/* Badge de direcao */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  isPositive
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5" />
                )}
              </div>

              {/* Informacoes */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {dateTimeBR(l.created_at)}
                  </span>
                </div>
                <div className="font-semibold text-foreground truncate">
                  {l.customer?.name || "Cliente sem nome"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {l.description || l.reason}
                </div>
              </div>

              {/* Delta de pontos */}
              <div
                className={`font-display text-lg font-bold shrink-0 px-2 py-0.5 rounded ${
                  isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {l.delta}
              </div>
            </div>
          );
        })}
        {!all.length && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center text-muted-foreground">
            Nenhum lancamento de pontos registrado ainda.
          </div>
        )}
      </div>

      {/* Controles de paginacao */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`h-7 w-7 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      page === item
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Proximo <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function Acessos() {
  const { data: balances } = useQuery({
    queryKey: ["balances-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_points_balance" as never)
        .select("customer_id, balance")
        .order("balance", { ascending: false });
      return (data ?? []) as unknown as { customer_id: string; balance: number }[];
    },
  });
  const { data: customersMap } = useQuery({
    queryKey: ["customers-min-rewards"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name, email, user_id, portal_invited_at");
      const map: Record<
        string,
        {
          name: string;
          email: string | null;
          user_id: string | null;
          portal_invited_at: string | null;
        }
      > = {};
      (data ?? []).forEach((c) => {
        map[c.id] = c as never;
      });
      return map;
    },
  });
  const invite = useServerFn(ensurePortalAccount);
  const [inviting, setInviting] = useState<string | null>(null);
  const [sortAZ, setSortAZ] = useState(false);

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

  const sortedBalances = useMemo(() => {
    const list = [...(balances ?? [])];
    if (!sortAZ) return list; // padrão: por saldo desc (vem da query)
    return list.sort((a, b) => {
      const nameA = (customersMap?.[a.customer_id]?.name ?? "").toLowerCase();
      const nameB = (customersMap?.[b.customer_id]?.name ?? "").toLowerCase();
      return nameA.localeCompare(nameB, "pt-BR");
    });
  }, [balances, customersMap, sortAZ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Saldos · Acesso ao Portal
        </h3>
        <button
          onClick={() => setSortAZ((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
            sortAZ
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          A–Z
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedBalances.map((b) => {
          const c = customersMap?.[b.customer_id];
          const hasAccess = !!c?.user_id;
          return (
            <div
              key={b.customer_id}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 gap-4 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Header: Avatar + Saldo */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-display font-bold text-sm">
                    {(c?.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground text-sm">
                      {c?.name ?? b.customer_id.slice(0, 8)}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {c?.email ?? "Sem e-mail"}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <strong
                    className={`font-display text-lg font-bold ${b.balance < 0 ? "text-rose-600" : "text-primary"}`}
                  >
                    {b.balance}
                  </strong>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    pontos
                  </div>
                </div>
              </div>

              {/* Footer: Status + Acao */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                    hasAccess
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-secondary text-muted-foreground border-border"
                  }`}
                >
                  {hasAccess ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>Acesso ativo</span>
                    </>
                  ) : (
                    <span>Sem acesso</span>
                  )}
                </span>

                <button
                  disabled={!c?.email || inviting === b.customer_id}
                  onClick={() => handleInvite(b.customer_id)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[11px] font-semibold transition-all cursor-pointer ${
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
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground text-sm">
            Nenhum saldo computado.
          </div>
        )}
      </div>
    </div>
  );
}

function Analises() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["redemptions-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("redemptions" as never)
        .select("*, reward:reward_items(name,kind), customer:customers(name,code)")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as (Redemption & {
        reward: { name: string; kind: string };
        customer: { name: string; code: string };
      })[];
    },
  });

  const uniqueCustomers = useMemo<{ name: string; code: string }[]>(() => {
    const map = new Map<string, { name: string; code: string }>();
    (data ?? []).forEach((r) => {
      if (r.customer?.name) {
        map.set(r.customer.name, { name: r.customer.name, code: r.customer.code });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const uniqueRewards = useMemo<string[]>(() => {
    const set = new Set<string>();
    (data ?? []).forEach((r) => {
      if (r.reward?.name) {
        set.add(r.reward.name);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 animate-pulse">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold text-muted-foreground">
          Carregando painel de análises...
        </span>
      </div>
    );
  }

  // Filtragem reativa em tempo real
  const filtered = (data ?? []).filter((r) => {
    // 1. Filtro de Cliente
    if (searchCustomer && r.customer?.name !== searchCustomer) {
      return false;
    }
    // 2. Filtro de Recompensa
    if (searchProduct && r.reward?.name !== searchProduct) {
      return false;
    }
    // 3. Filtro de Data
    if (startDate) {
      const rDate = r.created_at ? r.created_at.slice(0, 10) : "";
      if (rDate < startDate) return false;
    }
    if (endDate) {
      const rDate = r.created_at ? r.created_at.slice(0, 10) : "";
      if (rDate > endDate) return false;
    }
    return true;
  });

  // Métricas agregadas
  const totalRedemptions = filtered.length;
  const totalPointsSpent = filtered.reduce((sum, r) => sum + r.points_spent, 0);

  // Produtos físicos vs Vouchers
  const productCount = filtered.filter((r) => r.reward?.kind === "produto_fisico").length;
  const voucherCount = filtered.filter((r) => r.reward?.kind !== "produto_fisico").length;
  const productPercent =
    totalRedemptions > 0 ? Math.round((productCount / totalRedemptions) * 100) : 0;
  const voucherPercent =
    totalRedemptions > 0 ? Math.round((voucherCount / totalRedemptions) * 100) : 0;

  // Top Clientes
  const customerCounts: Record<string, { count: number; points: number; code: string }> = {};
  filtered.forEach((r) => {
    const name = r.customer?.name || "Desconhecido";
    const code = r.customer?.code || "";
    if (!customerCounts[name]) {
      customerCounts[name] = { count: 0, points: 0, code };
    }
    customerCounts[name].count += 1;
    customerCounts[name].points += r.points_spent;
  });
  const topCustomers = Object.entries(customerCounts)
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top Recompensas
  const rewardCounts: Record<string, { count: number; points: number; kind: string }> = {};
  filtered.forEach((r) => {
    const name = r.reward?.name || "Desconhecida";
    const kind = r.reward?.kind || "";
    if (!rewardCounts[name]) {
      rewardCounts[name] = { count: 0, points: 0, kind };
    }
    rewardCounts[name].count += 1;
    rewardCounts[name].points += r.points_spent;
  });
  const topRewards = Object.entries(rewardCounts)
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cards de KPIs de Alta Fidelidade */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* KPI 1: Total Resgates */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total de Resgates
            </span>
            <strong className="text-3xl font-display font-semibold text-foreground mt-2 block">
              {totalRedemptions}
            </strong>
          </div>
          <p className="text-xs text-muted-foreground/80 mt-3 flex items-center gap-1">
            <Gift className="h-3.5 w-3.5 text-primary" />
            Transações processadas
          </p>
        </div>

        {/* KPI 2: Pontos Trocados */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Pontos Utilizados
            </span>
            <strong className="text-3xl font-display font-semibold text-primary mt-2 block">
              {totalPointsSpent}{" "}
              <span className="text-sm font-sans text-muted-foreground font-normal">pts</span>
            </strong>
          </div>
          <p className="text-xs text-muted-foreground/80 mt-3 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Investimento em fidelidade
          </p>
        </div>

        {/* KPI 3: Produtos vs Vouchers */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Distribuição de Resgates
            </span>
            <div className="flex items-center justify-between text-xs mt-2.5 font-semibold text-foreground">
              <span>Produtos ({productPercent}%)</span>
              <span>Cupons ({voucherPercent}%)</span>
            </div>
            {/* Visual Balance Bar */}
            <div className="mt-2 h-2.5 w-full rounded-full bg-secondary overflow-hidden flex">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${productPercent}%` }}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${voucherPercent}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground/80 mt-2 flex items-center justify-between">
            <span>{productCount} Prod. físicos</span>
            <span>{voucherCount} Vouchers</span>
          </p>
        </div>
      </div>

      {/* Barra de Filtros Ultra-Premium (Análises) */}
      <div className="bg-secondary/20 border border-border p-4 rounded-3xl space-y-3.5 animate-fade-in">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
          Filtros de Pesquisa Avançados
        </span>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterDate label="Data Inicial" value={startDate} onChange={setStartDate} />
          <FilterDate label="Data Final" value={endDate} onChange={setEndDate} />
          <FilterSelect
            label="Cliente"
            value={searchCustomer}
            onChange={setSearchCustomer}
            placeholder="Todos os clientes"
            options={uniqueCustomers.map((c) => ({
              value: c.name,
              label: `${c.name} (${c.code})`,
            }))}
          />
          <FilterSelect
            label="Recompensa"
            value={searchProduct}
            onChange={setSearchProduct}
            placeholder="Todas as recompensas"
            options={uniqueRewards.map((name) => ({ value: name, label: name }))}
          />
        </div>

        {/* Linha de Status de Limpeza */}
        {(startDate || endDate || searchCustomer || searchProduct) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearchCustomer("");
                setSearchProduct("");
              }}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Grids Principais de Análises (Top Clientes e Top Recompensas) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 1: Clientes */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">
              Top Clientes que mais Resgatam
            </h3>
          </div>

          <div className="space-y-2.5">
            {topCustomers.map((c, index) => (
              <div
                key={c.name}
                className="flex items-center justify-between p-3 rounded-2xl bg-secondary/10 border border-border/50 hover:bg-secondary/20 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Posicionamento */}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? "bg-amber-400 text-amber-950"
                        : index === 1
                          ? "bg-slate-300 text-slate-900"
                          : index === 2
                            ? "bg-amber-600 text-amber-50"
                            : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{c.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">
                      {c.code}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-foreground">{c.count} resgates</div>
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    -{c.points} pts
                  </div>
                </div>
              </div>
            ))}
            {!topCustomers.length && (
              <div className="py-12 text-center text-xs text-muted-foreground font-medium">
                Nenhum dado de cliente encontrado para este período.
              </div>
            )}
          </div>
        </div>

        {/* Top 2: Recompensas */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gift className="h-4 w-4" />
            </div>
            <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">
              Recompensas Mais Resgatadas
            </h3>
          </div>

          <div className="space-y-2.5">
            {topRewards.map((r, index) => (
              <div
                key={r.name}
                className="flex items-center justify-between p-3 rounded-2xl bg-secondary/10 border border-border/50 hover:bg-secondary/20 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Posicionamento */}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? "bg-amber-400 text-amber-950"
                        : index === 1
                          ? "bg-slate-300 text-slate-900"
                          : index === 2
                            ? "bg-amber-600 text-amber-50"
                            : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{r.name}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                      {kindLabel(r.kind as RewardKind)}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-foreground">{r.count} resgates</div>
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    -{r.points} pts
                  </div>
                </div>
              </div>
            ))}
            {!topRewards.length && (
              <div className="py-12 text-center text-xs text-muted-foreground font-medium">
                Nenhum dado de recompensa encontrado para este período.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
