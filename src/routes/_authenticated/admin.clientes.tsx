import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { lookupCep } from "@/features/vendas/services/viacep";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Phone,
  Mail,
  Building2,
  User,
  KeyRound,
  Clock,
  Package,
  Gift,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog";
import { ensurePortalAccount } from "@/features/acessos/services/portal.functions";
import { dateTimeBR, brl } from "@/features/core/utils/format";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: CustomersPage,
});

interface Customer {
  id: string;
  code: string;
  name: string;
  type: "pf" | "pj";
  cpf: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  landline: string | null;
  birth_date: string | null;
  category: "varejo" | "atacado" | "fardamento";
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  active: boolean;
  user_id: string | null;
}

function CustomersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as Customer[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente removido");
    },
  });

  const toggle = useMutation({
    mutationFn: async (c: Customer) => {
      const { error } = await supabase
        .from("customers")
        .update({ active: !c.active })
        .eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  return (
    <AdminShell
      title="Clientes"
      actions={
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo cliente
        </button>
      }
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      ) : customers?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nenhum cliente cadastrado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers?.map((c) => (
            <div
              key={c.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              onClick={() => setDetailId(c.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/80 text-lg font-display text-muted-foreground border border-border/50">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-medium leading-tight">{c.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{c.code}</p>
                  </div>
                </div>
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(c);
                    }}
                    className="rounded-full bg-card p-2 text-muted-foreground hover:bg-secondary shadow-sm border border-border/50 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Excluir cliente?")) del.mutate(c.id);
                    }}
                    className="rounded-full bg-card p-2 text-destructive hover:bg-destructive/10 shadow-sm border border-border/50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 opacity-70" /> {c.phone}
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3 w-3 opacity-70" /> {c.email}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
                <div className="flex gap-1.5">
                  <span className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {c.type === "pf" ? (
                      <User className="mr-1 h-3 w-3" />
                    ) : (
                      <Building2 className="mr-1 h-3 w-3" />
                    )}{" "}
                    {c.type}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {c.category}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle.mutate(c);
                  }}
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${c.active ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  {c.active ? "Ativo" : "Inativo"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CustomerForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["customers"] });
          }}
        />
      )}
      {detailId && (
        <CustomerDetailDialog
          customer={customers?.find((c) => c.id === detailId)!}
          onClose={() => setDetailId(null)}
        />
      )}
    </AdminShell>
  );
}

function CustomerDetailDialog({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const ensurePortalFn = useServerFn(ensurePortalAccount);
  const [provisioning, setProvisioning] = useState(false);

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ["customer-orders", customer.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: redemptions, isLoading: loadingRedemptions } = useQuery({
    queryKey: ["customer-redemptions", customer.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("redemptions")
        .select("*, reward:reward_items(*)")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function handleProvision() {
    if (!customer.phone) {
      toast.error("Cliente não possui telefone cadastrado.");
      return;
    }
    setProvisioning(true);
    try {
      const res = await ensurePortalFn({ data: { customerId: customer.id } });
      if (res?.tempPassword) {
        toast.success("Acesso gerado com sucesso!");
        const msg = encodeURIComponent(
          `*Clube Com Amor*\n\nOlá, ${customer.name.split(" ")[0]}! Tudo bem?\nSeu acesso ao nosso clube de vantagens foi criado.\n\nAcesse: https://comamor.tec.br\nSeu código: *${customer.code}*\nSenha temporária: *${res.tempPassword}*\n\nAproveite seus benefícios!`,
        );
        const phone = customer.phone.replace(/\D/g, "");
        window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
      } else {
        const msg = encodeURIComponent(
          `*Clube Com Amor*\n\nOlá, ${customer.name.split(" ")[0]}!\nPassando para lembrar do seu acesso ao nosso clube.\n\nAcesse: https://comamor.tec.br\nSeu código de acesso: *${customer.code}*\n(Utilize a senha que você cadastrou)\n\nAproveite seus benefícios!`,
        );
        const phone = customer.phone.replace(/\D/g, "");
        window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao provisionar acesso");
    } finally {
      setProvisioning(false);
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
        <div className="grid md:grid-cols-[1fr_300px] h-[85vh] md:h-[600px]">
          {/* Main Area: Timelines */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-border bg-card/40">
              <h2 className="font-display text-2xl">Histórico do Cliente</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Acompanhe pedidos e resgates de {customer.name}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Pedidos */}
              <section>
                <h3 className="flex items-center gap-2 font-display text-lg mb-4 text-primary">
                  <Package className="h-5 w-5" /> Pedidos
                </h3>
                {loadingOrders ? (
                  <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
                ) : orders?.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum pedido registrado.</p>
                ) : (
                  <div className="space-y-3">
                    {orders?.map((o) => (
                      <div
                        key={o.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-border bg-card hover:bg-secondary/20 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold">{o.code}</span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] uppercase tracking-wider">
                              {o.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {dateTimeBR(o.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{brl(Number(o.total))}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {o.order_items?.length} itens
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Resgates */}
              <section>
                <h3 className="flex items-center gap-2 font-display text-lg mb-4 text-primary">
                  <Gift className="h-5 w-5" /> Resgates do Clube
                </h3>
                {loadingRedemptions ? (
                  <p className="text-sm text-muted-foreground">Carregando resgates...</p>
                ) : redemptions?.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum resgate registrado.</p>
                ) : (
                  <div className="space-y-3">
                    {redemptions?.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-border bg-card hover:bg-secondary/20 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{r.reward?.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold ${r.status === "resgatado" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50" : "bg-primary/10 text-primary"}`}
                            >
                              {r.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {dateTimeBR(r.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-destructive text-sm">
                            -{r.points_spent} pts
                          </p>
                          {r.voucher_code && (
                            <code className="text-[10px] bg-secondary px-1 py-0.5 rounded">
                              {r.voucher_code}
                            </code>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Sidebar: Customer Info & Access */}
          <div className="bg-secondary/30 border-t md:border-t-0 md:border-l border-border flex flex-col h-full overflow-y-auto">
            <div className="p-6 flex-1">
              <div className="w-16 h-16 rounded-full bg-secondary border-2 border-background shadow-sm flex items-center justify-center text-2xl font-display text-muted-foreground mb-4">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-display text-xl leading-tight">{customer.name}</h3>
              <p className="font-mono text-xs text-muted-foreground mt-1">{customer.code}</p>

              <div className="mt-6 space-y-4 text-sm">
                {customer.phone && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      WhatsApp
                    </p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                )}
                {customer.email && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      E-mail
                    </p>
                    <p className="font-medium truncate" title={customer.email}>
                      {customer.email}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Documento ({customer.type.toUpperCase()})
                  </p>
                  <p className="font-medium">
                    {customer.type === "pf" ? customer.cpf || "—" : customer.cnpj || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Localização
                  </p>
                  <p className="font-medium">
                    {customer.city ? `${customer.city} - ${customer.state}` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card border-t border-border mt-auto">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">Clube Com Amor</h4>
              </div>
              {customer.user_id ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-4 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle2 className="h-4 w-4" /> Cliente já possui acesso
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">
                  O cliente ainda não ativou sua conta no portal de recompensas.
                </p>
              )}

              <button
                onClick={handleProvision}
                disabled={provisioning || !customer.phone}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {provisioning
                  ? "Enviando..."
                  : customer.user_id
                    ? "Lembrar via WhatsApp"
                    : "Enviar Credenciais"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CustomerForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<Customer>;
  onClose: () => void;
  onSaved: (c?: Customer) => void;
}) {
  const [f, setF] = useState<Partial<Customer>>({
    name: "",
    type: "pf",
    category: "varejo",
    active: true,
    ...initial,
  });
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => setF((s) => ({ ...s, [k]: v }));

  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  async function fetchCep() {
    if (!f.cep) return;
    setCepLoading(true);
    const a = await lookupCep(f.cep);
    setCepLoading(false);
    if (!a) {
      toast.error("CEP não encontrado");
      return;
    }
    setF((s) => ({
      ...s,
      street: a.logradouro,
      neighborhood: a.bairro,
      city: a.localidade,
      state: a.uf,
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: any = { ...f };
    delete payload.id;
    delete payload.code;
    delete payload.user_id;
    const { data, error } = f.id
      ? await supabase.from("customers").update(payload).eq("id", f.id).select().single()
      : await supabase.from("customers").insert(payload).select().single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cliente salvo");
    onSaved(data as Customer);
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{f.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Lbl t="Tipo de pessoa">
              <select
                value={f.type}
                onChange={(e) => set("type", e.target.value as never)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pf">Pessoa física</option>
                <option value="pj">Pessoa jurídica</option>
              </select>
            </Lbl>
            <Lbl t="Categoria">
              <select
                value={f.category}
                onChange={(e) => set("category", e.target.value as never)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="varejo">Varejo</option>
                <option value="atacado">Atacado</option>
                <option value="fardamento">Fardamento</option>
              </select>
            </Lbl>
            <Lbl t={f.type === "pj" ? "Razão social" : "Nome completo"} c="md:col-span-2">
              <input
                required
                value={f.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>
            {f.type === "pf" ? (
              <Lbl t="CPF">
                <input
                  value={f.cpf ?? ""}
                  onChange={(e) => set("cpf", e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </Lbl>
            ) : (
              <Lbl t="CNPJ">
                <input
                  value={f.cnpj ?? ""}
                  onChange={(e) => set("cnpj", e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </Lbl>
            )}
            <Lbl t="Data de nascimento">
              <input
                type="date"
                value={f.birth_date ?? ""}
                onChange={(e) => set("birth_date", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>

            <Lbl t="WhatsApp / Celular">
              <input
                value={f.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>
            <Lbl t="Telefone fixo">
              <input
                value={f.landline ?? ""}
                onChange={(e) => set("landline", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>
            <Lbl t="E-mail" c="md:col-span-2">
              <input
                type="email"
                value={f.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>

            <Lbl t="CEP">
              <div className="flex gap-2">
                <input
                  value={f.cep ?? ""}
                  onChange={(e) => set("cep", e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={fetchCep}
                  disabled={cepLoading}
                  className="rounded-xl border border-border px-3 bg-secondary hover:bg-secondary/80"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </Lbl>
            <Lbl t="UF">
              <input
                value={f.state ?? ""}
                onChange={(e) => set("state", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>
            <Lbl t="Logradouro" c="md:col-span-2">
              <input
                value={f.street ?? ""}
                onChange={(e) => set("street", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>
            <Lbl t="Número">
              <input
                value={f.number ?? ""}
                onChange={(e) => set("number", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>
            <Lbl t="Complemento">
              <input
                value={f.complement ?? ""}
                onChange={(e) => set("complement", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>
            <Lbl t="Bairro">
              <input
                value={f.neighborhood ?? ""}
                onChange={(e) => set("neighborhood", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>
            <Lbl t="Cidade">
              <input
                value={f.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </Lbl>

            <label className="md:col-span-2 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={f.active ?? true}
                onChange={(e) => set("active", e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-sm font-medium">Cliente ativo</span>
            </label>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar cliente"}
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t}
      </span>
      {children}
    </label>
  );
}
