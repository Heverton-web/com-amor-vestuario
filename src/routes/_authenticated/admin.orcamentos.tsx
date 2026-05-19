import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { brl } from "@/features/core/utils/format";
import { priceFor, priceTier, WHOLESALE_THRESHOLD } from "@/features/vendas/services/pricing";
import { calcShipping } from "@/features/vendas/services/freight";
import { CustomerForm } from "./admin.clientes";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  Check,
  Download,
  Share2,
  FileText,
  UserPlus,
  Search,
  FileDown,
  MessageCircle,
  Mail,
  Link as LinkIcon,
} from "lucide-react";
import { NumInput } from "@/features/core/components/num-input";
import { downloadDocPDF } from "@/features/core/services/pdf";

export const Route = createFileRoute("/_authenticated/admin/orcamentos")({
  component: QuotesPage,
});

interface QuoteItem {
  product_id?: string;
  product_name: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

function QuotesPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [detailQuote, setDetailQuote] = useState<any | null>(null);

  const { data: quotes } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quotes")
        .select("*, customers(*)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <AdminShell
      title="Orçamentos"
      actions={
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Novo orçamento
        </button>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {quotes?.map((q: any) => (
                <tr
                  key={q.id}
                  onClick={() => setDetailQuote(q)}
                  className="cursor-pointer border-t border-border hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-mono text-xs">{q.code}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {q.requester_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{q.customers?.name ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(q.quote_date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs">{q.status}</span>
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{brl(q.total)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={async () => {
                        const { data: items } = await supabase
                          .from("quote_items")
                          .select("*")
                          .eq("quote_id", q.id);
                        downloadDocPDF({
                          kind: "Orçamento",
                          code: q.code,
                          date: q.quote_date,
                          validUntil: q.valid_until,
                          customer: q.customers,
                          requester: q.requester_name,
                          consultant: q.consultant_name,
                          items: (items ?? []).map((i: any) => ({
                            product_name: i.product_name,
                            color: i.color,
                            size: i.size,
                            quantity: i.quantity,
                            unit_price: Number(i.unit_price),
                            total: Number(i.total),
                          })),
                          subtotal: Number(q.subtotal),
                          shipping: Number(q.shipping),
                          total: Number(q.total),
                          notes: q.notes,
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs"
                      title="Baixar PDF"
                    >
                      <FileDown className="h-3 w-3" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
              {!quotes?.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum orçamento ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <QuoteForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["quotes"] });
          }}
        />
      )}

      {detailQuote && (
        <QuoteDetailDialog quote={detailQuote} onClose={() => setDetailQuote(null)} />
      )}
    </AdminShell>
  );
}

function QuoteForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [customerId, setCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [requester, setRequester] = useState("");
  const [consultant, setConsultant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState("");
  const [cep, setCep] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [shipping, setShipping] = useState(0);
  const [newCustomer, setNewCustomer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareData, setShareData] = useState<{ code: string; whatsapp?: string } | null>(null);

  const { data: products } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () =>
      (await supabase.from("products").select("*").eq("active", true)).data ?? [],
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-search", customerSearch],
    queryFn: async () =>
      (
        await supabase
          .from("customers")
          .select("id, code, name, phone")
          .ilike("name", `%${customerSearch}%`)
          .limit(8)
      ).data ?? [],
    enabled: customerSearch.length > 1,
  });

  const totalQty = items.reduce((a, b) => a + b.quantity, 0);
  const tier = priceTier(totalQty);
  const subtotal = items.reduce((a, b) => a + b.total, 0);
  const total = subtotal + shipping;

  function addItem(productId: string) {
    const p = products?.find((x: any) => x.id === productId);
    if (!p) return;
    const newItems = [
      ...items,
      {
        product_id: p.id,
        product_name: p.name,
        color: p.colors?.[0],
        size: p.sizes?.[0],
        quantity: 1,
        unit_price: priceFor(totalQty + 1, p.retail_price, p.wholesale_price),
        total: priceFor(totalQty + 1, p.retail_price, p.wholesale_price),
      },
    ];
    recalc(newItems);
  }

  function recalc(arr: QuoteItem[]) {
    const newQty = arr.reduce((a, b) => a + b.quantity, 0);
    const updated = arr.map((it) => {
      const p = products?.find((x: any) => x.id === it.product_id);
      const unit = p ? priceFor(newQty, p.retail_price, p.wholesale_price) : it.unit_price;
      return { ...it, unit_price: unit, total: unit * it.quantity };
    });
    setItems(updated);
  }

  async function fetchFreight() {
    const v = await calcShipping(cep, totalQty);
    setShipping(v);
    toast.success(`Frete estimado: ${brl(v)}`);
  }

  async function save() {
    if (!items.length) {
      toast.error("Adicione ao menos 1 produto");
      return;
    }
    setSaving(true);
    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        customer_id: customerId || null,
        requester_name: requester,
        consultant_name: consultant,
        quote_date: date,
        valid_until: validUntil || null,
        status: "gerado",
        subtotal,
        shipping,
        total,
      })
      .select()
      .single();
    if (error || !quote) {
      toast.error(error?.message ?? "Erro");
      setSaving(false);
      return;
    }

    const itemsPayload = items.map((i) => ({ ...i, quote_id: quote.id }));
    await supabase.from("quote_items").insert(itemsPayload);

    // Cria card no kanban orçamento
    await supabase.from("kanban_cards").insert({
      board: "orcamento",
      stage: "gerado",
      title: `${quote.code} · ${requester || "Sem solicitante"}`,
      contact_name: requester,
      customer_id: customerId || null,
      quote_id: quote.id,
      amount: total,
    });

    setSaving(false);
    toast.success("Orçamento gerado!");
    const customer = customers?.find((c: any) => c.id === customerId);
    setShareData({ code: quote.code, whatsapp: customer?.phone ?? undefined });
  }

  function shareText() {
    const lines = [
      `*Orçamento ${shareData?.code}* — Com Amor Vestuário`,
      `Solicitante: ${requester}`,
      `Data: ${new Date(date).toLocaleDateString("pt-BR")}`,
      validUntil ? `Validade: ${new Date(validUntil).toLocaleDateString("pt-BR")}` : "",
      "",
      "*Itens:*",
      ...items.map(
        (i) =>
          `• ${i.quantity}x ${i.product_name}${i.color ? ` (${i.color})` : ""}${i.size ? ` ${i.size}` : ""} — ${brl(i.unit_price)} = ${brl(i.total)}`,
      ),
      "",
      `Subtotal: ${brl(subtotal)}`,
      `Frete: ${brl(shipping)}`,
      `*Total: ${brl(total)}*`,
      "",
      `Tabela aplicada: ${tier === "atacado" ? "ATACADO (6+ peças)" : "Varejo"}`,
    ]
      .filter(Boolean)
      .join("\n");
    return lines;
  }

  function shareWhatsApp() {
    const phone = (shareData?.whatsapp ?? "").replace(/\D/g, "");
    const text = encodeURIComponent(shareText());
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  }

  function downloadTxt() {
    const blob = new Blob([shareText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shareData?.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (shareData) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
        onClick={onSaved}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl border border-border bg-background p-8 text-center shadow-2xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-2xl">Orçamento {shareData.code}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Total: <strong>{brl(total)}</strong>
          </p>
          <div className="mt-6 grid gap-3">
            <button
              onClick={shareWhatsApp}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            >
              <Share2 className="h-4 w-4" /> Enviar pelo WhatsApp
            </button>
            <button
              onClick={downloadTxt}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm"
            >
              <Download className="h-4 w-4" /> Baixar resumo (.txt)
            </button>
            <button
              onClick={onSaved}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-border bg-background p-8 shadow-2xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-display text-2xl">Novo orçamento</h3>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Cliente</label>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="input pl-9"
                  />
                  {customers &&
                    customers.length > 0 &&
                    customerSearch.length > 1 &&
                    !customerId && (
                      <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                        {customers.map((c: any) => (
                          <li key={c.id}>
                            <button
                              onClick={() => {
                                setCustomerId(c.id);
                                setCustomerSearch(c.name);
                                setRequester(c.name);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                              <span className="font-medium">{c.name}</span>{" "}
                              <span className="text-xs text-muted-foreground">{c.code}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                <button
                  onClick={() => setNewCustomer(true)}
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-3 text-sm"
                >
                  <UserPlus className="h-4 w-4" /> Novo
                </button>
              </div>
            </div>
            <Lbl t="Data do orçamento">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </Lbl>
            <Lbl t="Solicitante">
              <input
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                className="input"
              />
            </Lbl>
            <Lbl t="Consultor">
              <input
                value={consultant}
                onChange={(e) => setConsultant(e.target.value)}
                className="input"
              />
            </Lbl>
            <Lbl t="Validade">
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="input"
              />
            </Lbl>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-display text-lg">Itens</h4>
              <span
                className={`rounded-full px-3 py-1 text-xs ${tier === "atacado" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                Aplicando: {tier} {tier === "atacado" ? `(≥${WHOLESALE_THRESHOLD})` : ""}
              </span>
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) addItem(e.target.value);
                e.target.value = "";
              }}
              className="input mb-3"
            >
              <option value="">+ Adicionar produto...</option>
              {products?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name} — {brl(p.retail_price)} / {brl(p.wholesale_price)}
                </option>
              ))}
            </select>

            <div className="space-y-2">
              {items.map((it, idx) => {
                const p = products?.find((x: any) => x.id === it.product_id);
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3"
                  >
                    <span className="flex-1 font-medium">{it.product_name}</span>
                    <select
                      value={it.color ?? ""}
                      onChange={(e) => {
                        const a = [...items];
                        a[idx] = { ...a[idx], color: e.target.value };
                        setItems(a);
                      }}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    >
                      {p?.colors?.map((c: string) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={it.size ?? ""}
                      onChange={(e) => {
                        const a = [...items];
                        a[idx] = { ...a[idx], size: e.target.value };
                        setItems(a);
                      }}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    >
                      {p?.sizes?.map((s: string) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <NumInput
                      allowDecimal={false}
                      value={it.quantity}
                      onValueChange={(n) => {
                        const a = [...items];
                        a[idx] = { ...a[idx], quantity: Math.max(1, n || 1) };
                        recalc(a);
                      }}
                      className="w-20 px-2 py-1"
                      placeholder="1"
                    />
                    <span className="w-24 text-right text-sm">{brl(it.unit_price)}</span>
                    <span className="w-24 text-right font-medium">{brl(it.total)}</span>
                    <button
                      onClick={() => {
                        const a = items.filter((_, i) => i !== idx);
                        recalc(a);
                      }}
                      className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="flex items-end gap-2">
              <Lbl t="CEP do destino" c="flex-1">
                <input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  className="input"
                />
              </Lbl>
              <button
                onClick={fetchFreight}
                className="h-[46px] rounded-xl border border-border px-4 text-sm"
              >
                Calcular frete
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({totalQty} peças)</span>
                <span>{brl(subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span>Frete</span>
                <span>{brl(shipping)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-xl">
                <span>Total</span>
                <span className="text-primary">{brl(total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2.5 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving || !items.length}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              <FileText className="h-4 w-4" /> {saving ? "Gerando..." : "Gerar orçamento"}
            </button>
          </div>

          <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--input);background:var(--background);padding:0.65rem 0.9rem;outline:none}.input:focus{box-shadow:0 0 0 2px color-mix(in oklab,var(--primary) 40%,transparent)}`}</style>
        </div>
      </div>
      {newCustomer && (
        <CustomerForm
          initial={{}}
          onClose={() => setNewCustomer(false)}
          onSaved={(c) => {
            setNewCustomer(false);
            if (c) {
              setCustomerId(c.id);
              setCustomerSearch(c.name);
              setRequester(c.name);
            }
          }}
        />
      )}
    </>
  );
}

function Lbl({ t, c = "", children }: { t: string; c?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${c}`}>
      <span className="mb-1.5 block text-sm font-medium">{t}</span>
      {children}
    </label>
  );
}

function QuoteDetailDialog({ quote, onClose }: { quote: any; onClose: () => void }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ["quote-items", quote.id],
    queryFn: async () =>
      (await supabase.from("quote_items").select("*").eq("quote_id", quote.id)).data ?? [],
  });

  const totalQty = items?.reduce((a: number, b: any) => a + b.quantity, 0) ?? 0;
  const tier = priceTier(totalQty);

  function shareText() {
    const subtotal = Number(quote.subtotal);
    const shipping = Number(quote.shipping);
    const total = Number(quote.total);
    const lines = [
      `*Orçamento ${quote.code}* — Com Amor Vestuário`,
      `Solicitante: ${quote.requester_name ?? "—"}`,
      `Data: ${new Date(quote.quote_date).toLocaleDateString("pt-BR")}`,
      quote.valid_until ? `Validade: ${new Date(quote.valid_until).toLocaleDateString("pt-BR")}` : "",
      "",
      "*Itens:*",
      ...(items ?? []).map(
        (i: any) =>
          `• ${i.quantity}x ${i.product_name}${i.color ? ` (${i.color})` : ""}${i.size ? ` ${i.size}` : ""} — ${brl(Number(i.unit_price))} = ${brl(Number(i.total))}`,
      ),
      "",
      `Subtotal: ${brl(subtotal)}`,
      `Frete: ${brl(shipping)}`,
      `*Total: ${brl(total)}*`,
      "",
      `Tabela aplicada: ${tier === "atacado" ? "ATACADO (6+ peças)" : "Varejo"}`,
    ]
      .filter(Boolean)
      .join("\n");
    return lines;
  }

  function copyLink() {
    const url = `${window.location.origin}/orcamento/${quote.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  function shareWhatsApp() {
    const phone = (quote.customers?.phone ?? "").replace(/\D/g, "");
    const text = encodeURIComponent(shareText());
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  }

  function shareEmail() {
    const subject = encodeURIComponent(`Orçamento ${quote.code} - Com Amor Vestuário`);
    const body = encodeURIComponent(shareText());
    window.open(`mailto:${quote.customers?.email ?? ""}?subject=${subject}&body=${body}`);
  }

  function downloadPDF() {
    downloadDocPDF({
      kind: "Orçamento",
      code: quote.code,
      date: quote.quote_date,
      validUntil: quote.valid_until,
      customer: quote.customers,
      requester: quote.requester_name,
      consultant: quote.consultant_name,
      items: (items ?? []).map((i: any) => ({
        product_name: i.product_name,
        color: i.color,
        size: i.size,
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
        total: Number(i.total),
      })),
      subtotal: Number(quote.subtotal),
      shipping: Number(quote.shipping),
      total: Number(quote.total),
      notes: quote.notes,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background md:rounded-3xl shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Orçamento</p>
            <h3 className="font-display text-xl sm:text-2xl">{quote.code}</h3>
            <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
              {quote.status}
            </span>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 space-y-5">
          <div className="grid gap-3 text-sm sm:grid-cols-2 bg-secondary/10 p-4 rounded-2xl border border-border/40">
            <Row label="Cliente" value={quote.customers?.name ?? "—"} />
            <Row label="Solicitante" value={quote.requester_name ?? "—"} />
            <Row label="Consultor" value={quote.consultant_name ?? "—"} />
            <Row label="Data" value={new Date(quote.quote_date).toLocaleDateString("pt-BR")} />
            <Row
              label="Validade"
              value={quote.valid_until ? new Date(quote.valid_until).toLocaleDateString("pt-BR") : "—"}
            />
            {quote.customers?.phone && <Row label="WhatsApp" value={quote.customers.phone} />}
            {quote.customers?.email && <Row label="E-mail" value={quote.customers.email} />}
          </div>

          <div>
            <h4 className="font-display text-base mb-2">Itens do Orçamento</h4>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Carregando itens...</p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card text-xs">
                {items?.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 hover:bg-muted/10">
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{it.product_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {it.color && `Cor: ${it.color}`} {it.size && ` · Tam: ${it.size}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">
                        {it.quantity}x {brl(Number(it.unit_price))}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {brl(Number(it.total))}
                      </p>
                    </div>
                  </div>
                ))}
                {!items?.length && (
                  <p className="p-4 text-center text-muted-foreground">Nenhum item adicionado.</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 p-5 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal ({totalQty} peças)</span>
              <span>{brl(Number(quote.subtotal))}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Frete</span>
              <span>{brl(Number(quote.shipping))}</span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-3 font-display text-lg">
              <span>Total</span>
              <span className="text-primary">{brl(Number(quote.total))}</span>
            </div>
          </div>

          {quote.notes && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Observações</p>
              <p className="mt-1 whitespace-pre-wrap text-sm border border-border p-3 rounded-xl bg-card">
                {quote.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3 sm:px-7 bg-muted/20">
          <button
            onClick={copyLink}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-medium bg-background hover:bg-muted"
          >
            <LinkIcon className="h-3.5 w-3.5" /> Link
          </button>
          <button
            onClick={shareWhatsApp}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-medium bg-background hover:bg-muted"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
          <button
            onClick={shareEmail}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-medium bg-background hover:bg-muted"
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            onClick={downloadPDF}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-medium bg-background hover:bg-muted"
          >
            <FileDown className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
