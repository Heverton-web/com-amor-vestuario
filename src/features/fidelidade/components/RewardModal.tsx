import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { X, Gift, Ticket, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { NumInput } from "@/features/core/components/num-input";
import { type RewardItem, type RewardKind } from "@/features/fidelidade/services/rewards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/features/core/components/dialog";

interface RewardModalProps {
  item: RewardItem | null;
  initialKind: RewardKind;
  onClose: () => void;
}

export function RewardModal({ item, initialKind, onClose }: RewardModalProps) {
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
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-6 md:p-7">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-display text-xl font-semibold tracking-tight">
            {isEdit
              ? "Editar Recompensa"
              : form.kind === "produto_fisico"
                ? "Novo Produto"
                : "Novo Voucher"}
          </DialogTitle>
        </DialogHeader>

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

          {form.kind !== "produto_fisico" && (
            <>
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

                <input
                  placeholder="Ou cole a URL de uma imagem externa..."
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </>
          )}

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

        <DialogFooter className="mt-6 flex sm:justify-between gap-3 w-full">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
