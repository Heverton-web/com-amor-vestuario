import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { brl, dateBR } from "@/features/core/utils/format";
import { toast } from "sonner";
import { Plus, Link as LinkIcon, MessageCircle, Mail, X, FileDown, Search } from "lucide-react";
import { NumInput } from "@/features/core/components/num-input";
import { brlInWords } from "@/features/core/utils/num-to-words";
import { downloadReceiptPDF } from "@/features/core/services/pdf-receipt";
import { useBranding } from "@/features/core/services/branding";

export const Route = createFileRoute("/_authenticated/admin/recibos")({
  component: RecibosPage,
});

const METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
  boleto: "Boleto",
  outro: "Outro",
};

type Receipt = {
  id: string;
  code: string;
  payer_name: string;
  payer_doc: string | null;
  amount: number;
  amount_in_words: string;
  reference: string;
  payment_method: string;
  paid_at: string;
  city: string | null;
  issuer_name: string | null;
  issuer_doc: string | null;
  issuer_address: string | null;
  signature_mode: "linha" | "imagem";
  signature_url: string | null;
  status: string;
  public_token: string;
  invoice_id: string | null;
  order_id: string | null;
  customer_id: string | null;
  notes: string | null;
  created_at: string;
};

function RecibosPage() {
  const qc = useQueryClient();
  const { branding } = useBranding();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Receipt | null>(null);

  const { data: receipts } = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("receipts" as never)
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as Receipt[];
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("receipts" as never)
        .update({ status: "cancelado" } as never)
        .eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receipts"] });
      toast.success("Recibo cancelado");
    },
  });

  const publicUrlFor = (token: string) => `${window.location.origin}/recibo/${token}`;

  const share = (r: Receipt, channel: "whatsapp" | "email" | "copy") => {
    const url = publicUrlFor(r.public_token);
    const msg = `Recibo ${r.code} no valor de ${brl(r.amount)} — ${url}`;
    if (channel === "copy") {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado");
      return;
    }
    if (channel === "whatsapp")
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    if (channel === "email")
      window.open(
        `mailto:?subject=${encodeURIComponent(`Recibo ${r.code}`)}&body=${encodeURIComponent(msg)}`,
        "_blank",
      );
  };

  const downloadPDF = async (r: Receipt) => {
    await downloadReceiptPDF({
      code: r.code,
      amount: Number(r.amount),
      amount_in_words: r.amount_in_words,
      payer_name: r.payer_name,
      payer_doc: r.payer_doc,
      reference: r.reference,
      payment_method: r.payment_method,
      paid_at: r.paid_at,
      city: r.city,
      issuer_name: r.issuer_name || branding.issuer_legal_name || branding.brand_name,
      issuer_doc: r.issuer_doc || branding.issuer_doc,
      issuer_address: r.issuer_address || branding.issuer_address,
      signature_mode: r.signature_mode,
      signature_url: r.signature_url || branding.signature_url,
      brand: branding.brand_name,
      publicUrl: publicUrlFor(r.public_token),
    });
  };

  return (
    <AdminShell
      title="Recibos"
      actions={
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Novo recibo
        </button>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Pagador</th>
              <th className="px-4 py-3">Referência</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {receipts?.length ? (
              receipts.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setDetail(r)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3">{r.payer_name}</td>
                  <td className="px-4 py-3 max-w-[240px] truncate text-muted-foreground">
                    {r.reference || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {METHOD_LABEL[r.payment_method] ?? r.payment_method}
                  </td>
                  <td className="px-4 py-3 text-xs">{dateBR(r.paid_at)}</td>
                  <td className="px-4 py-3 text-right font-medium">{brl(Number(r.amount))}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${r.status === "cancelado" ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}
                    >
                      {r.status === "cancelado" ? "Cancelado" : "Emitido"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => downloadPDF(r)}
                        title="Download PDF"
                        className="rounded-md p-2 hover:bg-muted"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => share(r, "whatsapp")}
                        title="WhatsApp"
                        className="rounded-md p-2 hover:bg-muted"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => share(r, "copy")}
                        title="Copiar link"
                        className="rounded-md p-2 hover:bg-muted"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum recibo emitido ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <ReceiptDialog
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["receipts"] });
          }}
        />
      )}
      {detail && (
        <DetailDialog
          receipt={detail}
          onClose={() => setDetail(null)}
          onCancel={() => {
            cancel.mutate(detail.id);
            setDetail(null);
          }}
          onDownload={() => downloadPDF(detail)}
          onShare={(c) => share(detail, c)}
          publicUrl={publicUrlFor(detail.public_token)}
        />
      )}
    </AdminShell>
  );
}

function DetailDialog({
  receipt,
  onClose,
  onCancel,
  onDownload,
  onShare,
  publicUrl,
}: {
  receipt: Receipt;
  onClose: () => void;
  onCancel: () => void;
  onDownload: () => void;
  onShare: (c: "whatsapp" | "email" | "copy") => void;
  publicUrl: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-card p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="font-mono text-xs text-muted-foreground">{receipt.code}</div>
            <h2 className="font-display text-2xl">Recibo · {brl(Number(receipt.amount))}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <Row
            k="Pagador"
            v={receipt.payer_name + (receipt.payer_doc ? ` · ${receipt.payer_doc}` : "")}
          />
          <Row k="Valor por extenso" v={receipt.amount_in_words} />
          <Row k="Referente a" v={receipt.reference || "—"} />
          <Row k="Pagamento" v={METHOD_LABEL[receipt.payment_method] ?? receipt.payment_method} />
          <Row k="Data" v={dateBR(receipt.paid_at)} />
          {receipt.city && <Row k="Cidade" v={receipt.city} />}
          <Row k="Link público" v={publicUrl} />
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <FileDown className="h-4 w-4" /> PDF
          </button>
          <button
            onClick={() => onShare("whatsapp")}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>
          <button
            onClick={() => onShare("email")}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <Mail className="h-4 w-4" /> E-mail
          </button>
          <button
            onClick={() => onShare("copy")}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <LinkIcon className="h-4 w-4" /> Copiar link
          </button>
          {receipt.status !== "cancelado" && (
            <button
              onClick={onCancel}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              Cancelar recibo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border/50 pb-1.5">
      <dt className="min-w-[120px] text-muted-foreground">{k}</dt>
      <dd className="flex-1 break-words">{v}</dd>
    </div>
  );
}

function ReceiptDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { branding } = useBranding();
  const [customers, setCustomers] = useState<
    { id: string; name: string; cpf: string | null; cnpj: string | null }[]
  >([]);
  const [invoices, setInvoices] = useState<
    {
      id: string;
      code: string;
      total: number;
      customer_id: string | null;
      payment_method: string | null;
    }[]
  >([]);

  useEffect(() => {
    supabase
      .from("customers")
      .select("id, name, cpf, cnpj")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setCustomers((data ?? []) as never));
    supabase
      .from("invoices")
      .select("id, code, total, customer_id, payment_method")
      .eq("status", "paga")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setInvoices((data ?? []) as never));
  }, []);

  const [form, setForm] = useState({
    customer_id: "",
    invoice_id: "",
    payer_name: "",
    payer_doc: "",
    amount: 0,
    reference: "",
    payment_method: "pix",
    paid_at: new Date().toISOString().slice(0, 10),
    city: branding.issuer_city || "",
    signature_mode: "linha" as "linha" | "imagem",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const amountWords = useMemo(() => brlInWords(form.amount || 0), [form.amount]);

  const pickInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) {
      setForm((f) => ({ ...f, invoice_id: "" }));
      return;
    }
    const cust = customers.find((c) => c.id === inv.customer_id);
    setForm((f) => ({
      ...f,
      invoice_id: id,
      customer_id: inv.customer_id ?? "",
      payer_name: cust?.name ?? f.payer_name,
      payer_doc: cust?.cnpj ?? cust?.cpf ?? f.payer_doc,
      amount: Number(inv.total),
      reference: f.reference || `Fatura ${inv.code}`,
      payment_method: inv.payment_method ?? f.payment_method,
    }));
  };

  const pickCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      customer_id: id,
      payer_name: c?.name ?? f.payer_name,
      payer_doc: c?.cnpj ?? c?.cpf ?? f.payer_doc,
    }));
  };

  const submit = async () => {
    if (!form.payer_name.trim()) {
      toast.error("Informe o pagador");
      return;
    }
    if (!form.amount || form.amount <= 0) {
      toast.error("Informe o valor");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("receipts" as never).insert({
      customer_id: form.customer_id || null,
      invoice_id: form.invoice_id || null,
      payer_name: form.payer_name.trim(),
      payer_doc: form.payer_doc || null,
      amount: form.amount,
      amount_in_words: amountWords,
      reference: form.reference,
      payment_method: form.payment_method,
      paid_at: form.paid_at,
      city: form.city || null,
      issuer_name: branding.issuer_legal_name || branding.brand_name,
      issuer_doc: branding.issuer_doc || null,
      issuer_address: branding.issuer_address || null,
      signature_mode: form.signature_mode,
      signature_url: form.signature_mode === "imagem" ? branding.signature_url : null,
      notes: form.notes || null,
    } as never);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Recibo criado");
    onCreated();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="font-display text-2xl">Novo recibo</h2>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-border p-3">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Gerar a partir de uma fatura paga
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={form.invoice_id}
                onChange={(e) => pickInvoice(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm"
              >
                <option value="">— selecionar fatura (opcional) —</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} · {brl(Number(i.total))}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cliente cadastrado">
              <select
                value={form.customer_id}
                onChange={(e) => pickCustomer(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— avulso —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nome do pagador *">
              <input
                value={form.payer_name}
                onChange={(e) => setForm((f) => ({ ...f, payer_name: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm"
              />
            </Field>
            <Field label="CPF / CNPJ do pagador">
              <input
                inputMode="numeric"
                value={form.payer_doc}
                onChange={(e) => setForm((f) => ({ ...f, payer_doc: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm"
              />
            </Field>
            <Field label="Valor *">
              <NumInput
                value={form.amount}
                onValueChange={(v) => setForm((f) => ({ ...f, amount: v }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm"
              />
            </Field>
            <Field label="Método de pagamento">
              <select
                value={form.payment_method}
                onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(METHOD_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data do pagamento">
              <input
                type="date"
                value={form.paid_at}
                onChange={(e) => setForm((f) => ({ ...f, paid_at: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm"
              />
            </Field>
            <Field label="Cidade" full>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm"
              />
            </Field>
            <Field label="Referente a" full>
              <textarea
                rows={2}
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm"
                placeholder="Ex.: prestação de serviço de costura — coleção primavera"
              />
            </Field>
            <Field label="Modo de assinatura" full>
              <div className="flex gap-2">
                {(["linha", "imagem"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, signature_mode: m }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm ${form.signature_mode === m ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    {m === "linha" ? "Linha para assinar à mão" : "Imagem da assinatura (Branding)"}
                  </button>
                ))}
              </div>
              {form.signature_mode === "imagem" && !branding.signature_url && (
                <p className="mt-1 text-xs text-destructive">
                  Nenhuma imagem de assinatura cadastrada no Branding.
                </p>
              )}
            </Field>
          </div>

          <div className="rounded-xl bg-muted/40 p-3 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Por extenso</div>
            <div className="mt-1 italic">{amountWords}</div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Emitir recibo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
