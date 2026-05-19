import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { brl } from "@/features/core/utils/format";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Check,
  Gift,
  Package,
  DollarSign,
  Layers,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import { NumInput } from "@/features/core/components/num-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: ProductsPage,
});

const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG", "XG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"];
const COLOR_PRESETS = [
  "Argila",
  "Creme",
  "Sage",
  "Rosé",
  "Areia",
  "Carvão",
  "Marinho",
  "Preto",
  "Branco",
];

interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "convencional" | "fardamento";
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  colors: string[];
  sizes: string[];
  images: string[];
  active: boolean;
}

function ProductsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [reallocating, setReallocating] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto removido");
    },
  });

  const toggle = useMutation({
    mutationFn: async (p: Product) => {
      const { error } = await supabase
        .from("products")
        .update({ active: !p.active })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  return (
    <AdminShell
      title="Produtos"
      actions={
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      }
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Carregando catálogo...</p>
        </div>
      ) : products?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nenhum produto cadastrado no catálogo.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/50 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Varejo</th>
                  <th className="px-6 py-4">Atacado</th>
                  <th className="px-6 py-4">Estoque</th>
                  <th className="px-6 py-4">Loja</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {products?.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono text-[11px] text-muted-foreground">
                      {p.code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-9 w-9 rounded-lg border border-border object-cover bg-secondary/50"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg border border-border bg-secondary/30 flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        )}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/30">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {brl(p.retail_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {brl(p.wholesale_price)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${p.stock <= 5 ? "text-destructive" : ""}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggle.mutate(p)}
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${p.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50" : "bg-muted text-muted-foreground border border-border"}`}
                      >
                        {p.active ? "Ativo" : "Pausado"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          title="Realocar p/ recompensas"
                          onClick={() => setReallocating(p)}
                          className="rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Gift className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded-full p-2 text-muted-foreground hover:bg-secondary transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Excluir produto?")) del.mutate(p.id);
                          }}
                          className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["products"] });
          }}
        />
      )}
      {reallocating && (
        <ReallocateDialog
          product={reallocating}
          onClose={() => setReallocating(null)}
          onSaved={() => {
            setReallocating(null);
            qc.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produto realocado para recompensas");
          }}
        />
      )}
    </AdminShell>
  );
}

function ReallocateDialog({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [pts, setPts] = useState(Math.max(10, Math.round(Number(product.retail_price) * 10)));
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (qty < 1 || qty > product.stock) {
      toast.error(`Quantidade deve ser entre 1 e ${product.stock}`);
      return;
    }
    if (pts < 1) {
      toast.error("Custo em pontos inválido");
      return;
    }
    setSaving(true);
    const { error: rErr } = await supabase.from("reward_items" as never).insert({
      name: product.name,
      description: product.description,
      kind: "produto_fisico",
      points_cost: pts,
      stock: qty,
      images: (product.images ?? []).slice(0, 1),
      product_id: product.id,
      expires_at: expires || null,
      active: true,
    } as never);
    if (rErr) {
      setSaving(false);
      toast.error(rErr.message);
      return;
    }
    await supabase
      .from("products")
      .update({
        stock: Math.max(0, product.stock - qty),
      })
      .eq("id", product.id);
    setSaving(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Realocar para recompensas</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mova estoque para o Clube de Fidelidade
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 mb-2">
          <h4 className="font-medium text-sm leading-tight">{product.name}</h4>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-mono">
            <span>Estoque: {product.stock}</span>
            <span>Varejo: {brl(product.retail_price)}</span>
          </div>
        </div>

        <div className="space-y-4 py-2">
          <Lbl t="Quantidade a realocar">
            <NumInput allowDecimal={false} value={qty} onValueChange={setQty} />
          </Lbl>
          <Lbl t="Custo em pontos">
            <NumInput allowDecimal={false} value={pts} onValueChange={setPts} />
            <p className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
              <ChevronRight className="h-3 w-3" /> Sugestão: 10 pontos por cada R$ 1,00 de varejo
            </p>
          </Lbl>
          <Lbl t="Validade do resgate (opcional)">
            <input
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
            />
          </Lbl>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={saving}
            onClick={save}
            className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60"
          >
            {saving ? "Realocando..." : "Confirmar Movimentação"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<Product>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    description: "",
    type: "convencional",
    cost_price: 0,
    retail_price: 0,
    wholesale_price: 0,
    stock: 0,
    colors: [],
    sizes: [],
    images: [],
    active: true,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const setF = <K extends keyof Product>(k: K, v: Product[K]) => setForm((s) => ({ ...s, [k]: v }));

  const toggle = (arr: string[] | undefined, v: string) =>
    (arr ?? []).includes(v) ? (arr ?? []).filter((x) => x !== v) : [...(arr ?? []), v];

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) {
        toast.error(error.message);
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setF("images", [...(form.images ?? []), ...urls]);
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      name: form.name,
      description: form.description,
      type: form.type,
      cost_price: form.cost_price,
      retail_price: form.retail_price,
      wholesale_price: form.wholesale_price,
      stock: form.stock,
      colors: form.colors,
      sizes: form.sizes,
      images: form.images,
      active: form.active,
    };
    if (form.code) payload.code = form.code;
    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produto salvo com sucesso");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[95vh] p-0 border-none bg-background shadow-2xl">
        <form onSubmit={save} className="flex flex-col h-full">
          <div className="p-6 border-b border-border bg-card/40 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
            <div>
              <DialogTitle className="text-2xl font-display">
                {form.id ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-widest font-semibold opacity-60">
                Catálogo Administrativo
              </p>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {/* Seção 1: Identificação */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Package className="h-4 w-4 text-primary" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Identificação
                </h4>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Lbl t="Código (SKU)" c="opacity-80">
                  <input
                    value={form.code ?? ""}
                    onChange={(e) => setF("code", e.target.value)}
                    className="w-full rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm font-mono placeholder:opacity-50"
                    placeholder="Gerado automaticamente"
                  />
                </Lbl>
                <Lbl t="Tipo de Produto">
                  <select
                    value={form.type}
                    onChange={(e) => setF("type", e.target.value as never)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm appearance-none cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <option value="convencional">Roupa Convencional</option>
                    <option value="fardamento">Fardamento / Corporativo</option>
                  </select>
                </Lbl>
                <Lbl t="Nome do Produto" c="md:col-span-2">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setF("name", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </Lbl>
                <Lbl t="Descrição Detalhada" c="md:col-span-2">
                  <textarea
                    value={form.description ?? ""}
                    onChange={(e) => setF("description", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </Lbl>
              </div>
            </section>

            {/* Seção 2: Precificação e Estoque */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <DollarSign className="h-4 w-4 text-primary" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Valores e Estoque
                </h4>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Lbl t="Preço de Custo">
                  <NumInput
                    value={form.cost_price ?? 0}
                    onValueChange={(n) => setF("cost_price", n)}
                    placeholder="0,00"
                  />
                </Lbl>
                <Lbl t="Preço Varejo">
                  <NumInput
                    value={form.retail_price ?? 0}
                    onValueChange={(n) => setF("retail_price", n)}
                    placeholder="0,00"
                  />
                </Lbl>
                <Lbl t="Preço Atacado (≥6)">
                  <NumInput
                    value={form.wholesale_price ?? 0}
                    onValueChange={(n) => setF("wholesale_price", n)}
                    placeholder="0,00"
                  />
                </Lbl>
                <Lbl t="Estoque Físico">
                  <NumInput
                    allowDecimal={false}
                    value={form.stock ?? 0}
                    onValueChange={(n) => setF("stock", n)}
                    placeholder="0"
                  />
                </Lbl>
              </div>
            </section>

            {/* Seção 3: Variantes */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Layers className="h-4 w-4 text-primary" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Grade e Variantes
                </h4>
              </div>

              <div className="space-y-6">
                <Lbl t="Cores Disponíveis">
                  <div className="flex flex-wrap gap-2 pt-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setF("colors", toggle(form.colors, c))}
                        className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-xs font-medium transition-all ${form.colors?.includes(c) ? "border-primary bg-primary text-primary-foreground shadow-sm scale-[1.02]" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:border-border/80"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </Lbl>

                <Lbl t="Tamanhos">
                  <div className="flex flex-wrap gap-2 pt-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setF("sizes", toggle(form.sizes, s))}
                        className={`min-w-11 inline-flex items-center justify-center rounded-lg border px-2 py-2 text-xs font-bold transition-all ${form.sizes?.includes(s) ? "border-primary bg-primary text-primary-foreground shadow-sm scale-[1.02]" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:border-border/80"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Lbl>
              </div>
            </section>

            {/* Seção 4: Galeria */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Galeria de Fotos
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {form.images?.map((url, i) => (
                  <div
                    key={i}
                    className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-secondary/20 shadow-sm"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setF(
                          "images",
                          (form.images ?? []).filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/5 hover:border-primary/50 hover:text-primary group">
                  <div className="mb-2 p-3 rounded-full bg-background border border-border group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5" />
                  </div>
                  {uploading ? "Enviando..." : "Adicionar Foto"}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => upload(e.target.files)}
                  />
                </label>
              </div>
            </section>

            <div className="pt-6 border-t border-border/50">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${form.active ? "bg-primary border-primary" : "border-border bg-card group-hover:border-primary/50"}`}
                >
                  {form.active && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={form.active ?? true}
                  onChange={(e) => setF("active", e.target.checked)}
                />
                <span className="text-sm font-medium">Exibir produto na loja virtual</span>
              </label>
            </div>
          </div>

          <div className="p-6 border-t border-border bg-card/40 flex justify-end gap-3 sticky bottom-0 z-10 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-8 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-60"
            >
              {saving ? (
                "Salvando..."
              ) : (
                <>
                  <Check className="h-4 w-4" /> Salvar Produto
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Lbl({ t, c = "", children }: { t: string; c?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${c}`}>
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
        {t}
      </span>
      {children}
    </label>
  );
}
