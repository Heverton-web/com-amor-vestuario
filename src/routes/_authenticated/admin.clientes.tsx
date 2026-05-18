import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { lookupCep } from "@/features/vendas/services/viacep";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: CustomersPage,
});

interface Customer {
  id: string; code: string; name: string;
  type: "pf" | "pj"; cpf: string | null; cnpj: string | null;
  email: string | null; phone: string | null; landline: string | null;
  birth_date: string | null;
  category: "varejo" | "atacado" | "fardamento";
  cep: string | null; street: string | null; number: string | null;
  complement: string | null; neighborhood: string | null; city: string | null; state: string | null;
  active: boolean;
}

function CustomersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Customer[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("customers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Cliente removido"); },
  });

  const toggle = useMutation({
    mutationFn: async (c: Customer) => { const { error } = await supabase.from("customers").update({ active: !c.active }).eq("id", c.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  return (
    <AdminShell title="Clientes" actions={
      <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
        <Plus className="h-4 w-4" /> Novo cliente
      </button>
    }>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Código</th><th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Contato</th><th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers?.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{c.name}</td>
                  <td className="px-4 py-3">{c.type === "pf" ? "PF" : "PJ"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.type === "pf" ? c.cpf : c.cnpj}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.phone}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-1 text-xs">{c.category}</span></td>
                  <td className="px-4 py-3"><button onClick={() => toggle.mutate(c)} className={`rounded-full px-2 py-1 text-xs ${c.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.active ? "Ativo" : "Inativo"}</button></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(c)} className="rounded-lg p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm("Excluir cliente?")) del.mutate(c.id); }} className="rounded-lg p-2 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
              {customers?.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Nenhum cliente cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <CustomerForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["customers"] }); }} />}
    </AdminShell>
  );
}

export function CustomerForm({ initial, onClose, onSaved }: { initial: Partial<Customer>; onClose: () => void; onSaved: (c?: Customer) => void }) {
  const [f, setF] = useState<Partial<Customer>>({
    name: "", type: "pf", category: "varejo", active: true, ...initial,
  });
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => setF((s) => ({ ...s, [k]: v }));

  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  async function fetchCep() {
    if (!f.cep) return;
    setCepLoading(true);
    const a = await lookupCep(f.cep);
    setCepLoading(false);
    if (!a) { toast.error("CEP não encontrado"); return; }
    setF((s) => ({ ...s, street: a.logradouro, neighborhood: a.bairro, city: a.localidade, state: a.uf }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: any = { ...f };
    delete payload.id; delete payload.code;
    const { data, error } = f.id
      ? await supabase.from("customers").update(payload).eq("id", f.id).select().single()
      : await supabase.from("customers").insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cliente salvo");
    onSaved(data as Customer);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-background p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-2xl">{f.id ? "Editar cliente" : "Novo cliente"}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Lbl t="Tipo de pessoa">
            <select value={f.type} onChange={(e) => set("type", e.target.value as never)} className="input">
              <option value="pf">Pessoa física</option><option value="pj">Pessoa jurídica</option>
            </select>
          </Lbl>
          <Lbl t="Categoria">
            <select value={f.category} onChange={(e) => set("category", e.target.value as never)} className="input">
              <option value="varejo">Varejo</option><option value="atacado">Atacado</option><option value="fardamento">Fardamento</option>
            </select>
          </Lbl>
          <Lbl t={f.type === "pj" ? "Razão social" : "Nome completo"} c="md:col-span-2">
            <input required value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} className="input" />
          </Lbl>
          {f.type === "pf" ? (
            <Lbl t="CPF"><input value={f.cpf ?? ""} onChange={(e) => set("cpf", e.target.value)} className="input" /></Lbl>
          ) : (
            <Lbl t="CNPJ"><input value={f.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} className="input" /></Lbl>
          )}
          <Lbl t="Data de nascimento"><input type="date" value={f.birth_date ?? ""} onChange={(e) => set("birth_date", e.target.value)} className="input" /></Lbl>

          <Lbl t="WhatsApp / Celular"><input value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className="input" /></Lbl>
          <Lbl t="Telefone fixo"><input value={f.landline ?? ""} onChange={(e) => set("landline", e.target.value)} className="input" /></Lbl>
          <Lbl t="E-mail" c="md:col-span-2"><input type="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} className="input" /></Lbl>

          <Lbl t="CEP">
            <div className="flex gap-2">
              <input value={f.cep ?? ""} onChange={(e) => set("cep", e.target.value)} className="input flex-1" />
              <button type="button" onClick={fetchCep} disabled={cepLoading} className="rounded-xl border border-border px-3"><Search className="h-4 w-4" /></button>
            </div>
          </Lbl>
          <Lbl t="UF"><input value={f.state ?? ""} onChange={(e) => set("state", e.target.value)} className="input" /></Lbl>
          <Lbl t="Logradouro" c="md:col-span-2"><input value={f.street ?? ""} onChange={(e) => set("street", e.target.value)} className="input" /></Lbl>
          <Lbl t="Número"><input value={f.number ?? ""} onChange={(e) => set("number", e.target.value)} className="input" /></Lbl>
          <Lbl t="Complemento"><input value={f.complement ?? ""} onChange={(e) => set("complement", e.target.value)} className="input" /></Lbl>
          <Lbl t="Bairro"><input value={f.neighborhood ?? ""} onChange={(e) => set("neighborhood", e.target.value)} className="input" /></Lbl>
          <Lbl t="Cidade"><input value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} className="input" /></Lbl>

          <label className="md:col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={f.active ?? true} onChange={(e) => set("active", e.target.checked)} />
            <span className="text-sm">Cliente ativo</span>
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

function Lbl({ t, c = "", children }: { t: string; c?: string; children: React.ReactNode }) {
  return <label className={`block ${c}`}><span className="mb-1.5 block text-sm font-medium">{t}</span>{children}</label>;
}

