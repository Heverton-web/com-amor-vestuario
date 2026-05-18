import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { brl } from "@/features/core/utils/format";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Upload, Check, Gift } from "lucide-react";
import { NumInput } from "@/features/core/components/num-input";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: ProductsPage,
});

const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG", "XG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"];
const COLOR_PRESETS = ["Argila", "Creme", "Sage", "Rosé", "Areia", "Carvão", "Marinho", "Preto", "Branco"];

interface Product {
  id: string; code: string; name: string; description: string | null;
  type: "convencional" | "fardamento";
  cost_price: number; retail_price: number; wholesale_price: number;
  stock: number; colors: string[]; sizes: string[]; images: string[];
  active: boolean;
}

function ProductsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [reallocating, setReallocating] = useState<Product | null>(null);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Produto removido"); },
  });

  const toggle = useMutation({
    mutationFn: async (p: Product) => {
      const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  return (
    <AdminShell
      title="Produtos"
      actions={
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Varejo</th>
                <th className="px-4 py-3">Atacado</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-1 text-xs">{p.type}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">{brl(p.retail_price)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{brl(p.wholesale_price)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle.mutate(p)}
                      className={`rounded-full px-2 py-1 text-xs ${p.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {p.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button title="Realocar p/ recompensas" onClick={() => setReallocating(p)} className="rounded-lg p-2 hover:bg-primary/10 hover:text-primary"><Gift className="h-4 w-4" /></button>
                      <button onClick={() => setEditing(p)} className="rounded-lg p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { if (confirm("Excluir produto?")) del.mutate(p.id); }} className="rounded-lg p-2 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {products?.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Nenhum produto cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <ProductForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["products"] }); }} />}
      {reallocating && <ReallocateDialog product={reallocating} onClose={() => setReallocating(null)} onSaved={() => { setReallocating(null); qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Produto realocado para recompensas"); }} />}
    </AdminShell>
  );
}

function ReallocateDialog({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [qty, setQty] = useState(1);
  const [pts, setPts] = useState(Math.max(10, Math.round(Number(product.retail_price) * 10)));
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (qty < 1 || qty > product.stock) { toast.error(`Quantidade deve ser entre 1 e ${product.stock}`); return; }
    if (pts < 1) { toast.error("Custo em pontos inválido"); return; }
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
    if (rErr) { setSaving(false); toast.error(rErr.message); return; }
    await supabase.from("products").update({
      stock: Math.max(0, product.stock - qty),
    }).eq("id", product.id);
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl border border-border bg-background p-6 shadow-2xl md:rounded-3xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Realocar para recompensas</p>
            <h3 className="font-display text-xl">{product.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Estoque atual: {product.stock} · Varejo {brl(product.retail_price)}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 text-sm">
          <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Quantidade a realocar</span>
            <NumInput allowDecimal={false} value={qty} onValueChange={setQty} /></label>
          <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Custo em pontos</span>
            <NumInput allowDecimal={false} value={pts} onValueChange={setPts} />
            <span className="mt-1 block text-[11px] text-muted-foreground">Sugestão: valor de varejo × 10</span>
          </label>
          <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Validade (opcional)</span>
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="min-h-11 flex-1 rounded-full border border-border text-sm">Cancelar</button>
          <button disabled={saving} onClick={save} className="min-h-11 flex-1 rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">
            {saving ? "Realocando..." : "Realocar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ initial, onClose, onSaved }: { initial: Partial<Product>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Product>>({
    name: "", description: "", type: "convencional",
    cost_price: 0, retail_price: 0, wholesale_price: 0,
    stock: 0, colors: [], sizes: [], images: [], active: true,
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
      if (error) { toast.error(error.message); continue; }
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
      name: form.name, description: form.description, type: form.type,
      cost_price: form.cost_price, retail_price: form.retail_price, wholesale_price: form.wholesale_price,
      stock: form.stock, colors: form.colors, sizes: form.sizes, images: form.images, active: form.active,
    };
    if (form.code) payload.code = form.code;
    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Produto salvo");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-background p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-2xl">{form.id ? "Editar produto" : "Novo produto"}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Código (opcional, gerado automaticamente)">
            <input value={form.code ?? ""} onChange={(e) => setF("code", e.target.value)} className="input" placeholder="Gerado automaticamente" />
          </Field>
          <Field label="Tipo">
            <select value={form.type} onChange={(e) => setF("type", e.target.value as never)} className="input">
              <option value="convencional">Convencional</option>
              <option value="fardamento">Fardamento</option>
            </select>
          </Field>
          <Field label="Nome" className="md:col-span-2">
            <input required value={form.name} onChange={(e) => setF("name", e.target.value)} className="input" />
          </Field>
          <Field label="Descrição" className="md:col-span-2">
            <textarea value={form.description ?? ""} onChange={(e) => setF("description", e.target.value)} rows={3} className="input" />
          </Field>

          <Field label="Preço de custo"><NumInput value={form.cost_price ?? 0} onValueChange={(n) => setF("cost_price", n)} placeholder="0,00" /></Field>
          <Field label="Estoque"><NumInput allowDecimal={false} value={form.stock ?? 0} onValueChange={(n) => setF("stock", n)} placeholder="0" /></Field>
          <Field label="Preço varejo"><NumInput value={form.retail_price ?? 0} onValueChange={(n) => setF("retail_price", n)} placeholder="0,00" /></Field>
          <Field label="Preço atacado (≥6 peças)"><NumInput value={form.wholesale_price ?? 0} onValueChange={(n) => setF("wholesale_price", n)} placeholder="0,00" /></Field>

          <Field label="Cores disponíveis" className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => setF("colors", toggle(form.colors, c))}
                  className={`rounded-full border px-3 py-1.5 text-sm ${form.colors?.includes(c) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{c}</button>
              ))}
            </div>
          </Field>

          <Field label="Tamanhos" className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setF("sizes", toggle(form.sizes, s))}
                  className={`min-w-10 rounded-full border px-3 py-1.5 text-sm ${form.sizes?.includes(s) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{s}</button>
              ))}
            </div>
          </Field>

          <Field label="Fotos do produto" className="md:col-span-2">
            <div className="grid grid-cols-4 gap-3">
              {form.images?.map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setF("images", (form.images ?? []).filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary">
                <Upload className="h-5 w-5" />
                {uploading ? "Enviando..." : "Adicionar"}
                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
              </label>
            </div>
          </Field>

          <label className="md:col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={form.active ?? true} onChange={(e) => setF("active", e.target.checked)} />
            <span className="text-sm">Ativo na loja virtual</span>
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
            <Check className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>

        <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--input);background:var(--background);padding:0.65rem 0.9rem;outline:none}.input:focus{box-shadow:0 0 0 2px color-mix(in oklab,var(--primary) 40%,transparent)}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

