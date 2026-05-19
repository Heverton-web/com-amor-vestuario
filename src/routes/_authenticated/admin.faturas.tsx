import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { brl, dateBR, dateTimeBR } from "@/features/core/utils/format";
import { toast } from "sonner";
import {
  Plus,
  Link as LinkIcon,
  MessageCircle,
  Mail,
  CheckCircle2,
  X,
  FileDown,
} from "lucide-react";
import { NumInput } from "@/features/core/components/num-input";
import { downloadDocPDF } from "@/features/core/services/pdf";

export const Route = createFileRoute("/_authenticated/admin/faturas")({
  component: FaturasPage,
});

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  paga_parcial: "Parcial",
  paga: "Paga",
  vencida: "Vencida",
  cancelada: "Cancelada",
};
const STATUS_COLOR: Record<string, string> = {
  aberta: "bg-secondary text-foreground",
  paga_parcial: "bg-accent text-accent-foreground",
  paga: "bg-primary text-primary-foreground",
  vencida: "bg-destructive text-destructive-foreground",
  cancelada: "bg-muted text-muted-foreground",
};

function FaturasPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (!data?.length) return [];
      const customerIds = [...new Set(data.map((i) => i.customer_id).filter(Boolean))];
      const orderIds = [...new Set(data.map((i) => i.order_id).filter(Boolean))];
      const [{ data: cust }, { data: ords }] = await Promise.all([
        customerIds.length
          ? supabase
              .from("customers")
              .select("id, name, phone, email")
              .in("id", customerIds as string[])
          : Promise.resolve({ data: [] as any[] }),
        orderIds.length
          ? supabase
              .from("orders")
              .select("id, code")
              .in("id", orderIds as string[])
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const cm = new Map((cust ?? []).map((c: any) => [c.id, c]));
      const om = new Map((ords ?? []).map((o: any) => [o.id, o]));
      return data.map((i) => ({
        ...i,
        customers: cm.get(i.customer_id),
        orders: om.get(i.order_id),
      })) as any[];
    },
  });

  const markPaid = useMutation({
    mutationFn: async (inv: any) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paga", paid_total: inv.total })
        .eq("id", inv.id);
      if (error) throw error;
      await supabase.from("invoice_payments").insert({
        invoice_id: inv.id,
        amount: inv.total,
        method: inv.payment_method ?? "manual",
        gateway_id: "MOCK-" + Date.now(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Fatura marcada como paga");
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "cancelada" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Fatura cancelada");
    },
  });

  function publicUrl(token: string) {
    return `${window.location.origin}/fatura/${token}`;
  }
  function copyLink(token: string) {
    navigator.clipboard.writeText(publicUrl(token));
    toast.success("Link copiado");
  }
  function whatsapp(inv: any) {
    const phone = (inv.customers?.phone ?? "").replace(/\D/g, "");
    const text = encodeURIComponent(
      `Olá ${inv.customers?.name ?? ""}! Sua fatura ${inv.code} no valor de ${brl(Number(inv.total))} está disponível: ${publicUrl(inv.public_token)}`,
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  }
  function email(inv: any) {
    const subject = encodeURIComponent(`Fatura ${inv.code}`);
    const body = encodeURIComponent(
      `Olá!\n\nSua fatura ${inv.code} no valor de ${brl(Number(inv.total))} está disponível em:\n${publicUrl(inv.public_token)}\n\nObrigado,\nCom Amor Vestuário`,
    );
    window.open(`mailto:${inv.customers?.email ?? ""}?subject=${subject}&body=${body}`);
  }
  function downloadPDF(inv: any) {
    downloadDocPDF({
      kind: "Fatura",
      code: inv.code,
      date: inv.created_at,
      validUntil: inv.due_date,
      customer: inv.customers,
      total: Number(inv.total),
      notes: inv.notes,
      publicUrl: publicUrl(inv.public_token),
    });
  }

  return (
    <AdminShell
      title="Faturas"
      actions={
        <button
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Nova fatura
        </button>
      }
    >
      <div className="mb-6 rounded-2xl border border-border bg-accent/30 p-4 text-sm text-muted-foreground">
        🧪 <strong>Modo demonstração</strong> — Pix, boleto e cartão simulados via Mercado Pago. Use
        "Marcar como paga" para testar a baixa manual.
      </div>

      {/* Cards mobile */}
      <div className="space-y-3 md:hidden">
        {invoices?.map((inv: any) => (
          <button
            key={inv.id}
            type="button"
            onClick={() => setDetail(inv)}
            className="block w-full rounded-2xl border border-border bg-card p-4 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">{inv.code}</p>
                <p className="truncate font-medium">{inv.customers?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  Venc: {inv.due_date ? dateBR(inv.due_date) : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg text-primary">{brl(Number(inv.total))}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${STATUS_COLOR[inv.status]}`}
                >
                  {STATUS_LABEL[inv.status]}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Toque para ver detalhes</p>
          </button>
        ))}
        {!invoices?.length && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma fatura criada ainda.
          </p>
        )}
      </div>

      {/* Tabela desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Fatura</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map((inv: any) => (
              <tr
                key={inv.id}
                onClick={() => setDetail(inv)}
                className="cursor-pointer border-t border-border hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-mono text-xs">{inv.code}</td>
                <td className="px-4 py-3">{inv.customers?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs">{inv.due_date ? dateBR(inv.due_date) : "—"}</td>
                <td className="px-4 py-3 text-xs uppercase">{inv.payment_method ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_COLOR[inv.status]}`}
                  >
                    {STATUS_LABEL[inv.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{brl(Number(inv.total))}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => copyLink(inv.public_token)}
                      className="rounded-lg p-2 hover:bg-muted"
                      title="Copiar link público"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => whatsapp(inv)}
                      className="rounded-lg p-2 hover:bg-muted"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => email(inv)}
                      className="rounded-lg p-2 hover:bg-muted"
                      title="E-mail"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => downloadPDF(inv)}
                      className="rounded-lg p-2 hover:bg-muted"
                      title="Baixar PDF"
                    >
                      <FileDown className="h-4 w-4" />
                    </button>
                    {inv.status !== "paga" && inv.status !== "cancelada" && (
                      <>
                        <button
                          onClick={() => markPaid.mutate(inv)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs text-primary-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Pago
                        </button>
                        <button
                          onClick={() => cancel.mutate(inv.id)}
                          className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!invoices?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhuma fatura criada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <NewInvoiceDialog
          onClose={() => setOpen(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["invoices"] })}
        />
      )}
      {detail && (
        <InvoiceDetailDialog
          inv={detail}
          onClose={() => setDetail(null)}
          actions={{
            copyLink: () => copyLink(detail.public_token),
            whatsapp: () => whatsapp(detail),
            email: () => email(detail),
            downloadPDF: () => downloadPDF(detail),
            markPaid: () => {
              markPaid.mutate(detail);
              setDetail(null);
            },
            cancel: () => {
              cancel.mutate(detail.id);
              setDetail(null);
            },
          }}
        />
      )}
    </AdminShell>
  );
}

function InvoiceDetailDialog({
  inv,
  onClose,
  actions,
}: {
  inv: any;
  onClose: () => void;
  actions: {
    copyLink: () => void;
    whatsapp: () => void;
    email: () => void;
    downloadPDF: () => void;
    markPaid: () => void;
    cancel: () => void;
  };
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-background md:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Fatura</p>
            <h3 className="font-display text-xl sm:text-2xl">{inv.code}</h3>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] ${STATUS_COLOR[inv.status]}`}
            >
              {STATUS_LABEL[inv.status]}
            </span>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Row label="Cliente" value={inv.customers?.name ?? "—"} />
            <Row label="Vencimento" value={inv.due_date ? dateBR(inv.due_date) : "—"} />
            <Row label="Método" value={(inv.payment_method ?? "—").toString().toUpperCase()} />
            <Row label="Emissão" value={dateTimeBR(inv.created_at)} />
            {inv.customers?.phone && <Row label="WhatsApp" value={inv.customers.phone} />}
            {inv.customers?.email && <Row label="E-mail" value={inv.customers.email} />}
            {inv.orders?.code && <Row label="Pedido" value={inv.orders.code} />}
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="flex justify-between text-sm">
              <span>Total</span>
              <span className="font-display text-xl text-primary">{brl(Number(inv.total))}</span>
            </div>
            {Number(inv.paid_total) > 0 && (
              <div className="mt-1 flex justify-between text-sm">
                <span>Pago</span>
                <span>{brl(Number(inv.paid_total))}</span>
              </div>
            )}
          </div>

          {inv.pix_copia_cola && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Pix copia e cola
              </p>
              <p className="mt-1 break-all rounded-xl bg-muted p-3 font-mono text-[11px]">
                {inv.pix_copia_cola}
              </p>
            </div>
          )}
          {inv.notes && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Observações</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{inv.notes}</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3 sm:px-7">
          <button
            onClick={actions.copyLink}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-3 text-xs"
          >
            <LinkIcon className="h-3 w-3" /> Link
          </button>
          <button
            onClick={actions.whatsapp}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-3 text-xs"
          >
            <MessageCircle className="h-3 w-3" /> WhatsApp
          </button>
          <button
            onClick={actions.email}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-3 text-xs"
          >
            <Mail className="h-3 w-3" /> Email
          </button>
          <button
            onClick={actions.downloadPDF}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-3 text-xs"
          >
            <FileDown className="h-3 w-3" /> PDF
          </button>
          {inv.status !== "paga" && inv.status !== "cancelada" && (
            <>
              <button
                onClick={actions.markPaid}
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-primary px-3 text-xs text-primary-foreground"
              >
                <CheckCircle2 className="h-3 w-3" /> Pago
              </button>
              <button
                onClick={actions.cancel}
                className="inline-flex min-h-11 items-center gap-1 rounded-full border border-destructive/50 px-3 text-xs text-destructive"
              >
                <X className="h-3 w-3" /> Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function NewInvoiceDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [total, setTotal] = useState<number>(0);
  const [method, setMethod] = useState<"pix" | "boleto" | "cartao" | "manual">("pix");
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ["customers-min"],
    queryFn: async () =>
      (await supabase.from("customers").select("id, name, code").order("name")).data ?? [],
  });
  const { data: orders } = useQuery({
    queryKey: ["orders-min"],
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select("id, code, total, customer_id")
          .order("created_at", { ascending: false })
          .limit(50)
      ).data ?? [],
  });

  function pickOrder(id: string) {
    setOrderId(id);
    const o = orders?.find((x: any) => x.id === id);
    if (o) {
      setTotal(Number(o.total));
      if (o.customer_id) setCustomerId(o.customer_id);
    }
  }

  async function save() {
    if (!total) {
      toast.error("Informe o total");
      return;
    }
    setSaving(true);
    const pixPayload =
      method === "pix"
        ? `00020126360014br.gov.bcb.pix0114+5500000000000${Date.now().toString().slice(-6)}5204000053039865802BR5915COM AMOR LTDA6009SAO PAULO62070503***6304MOCK`
        : null;
    const boletoUrl =
      method === "boleto" ? `https://mock.mercadopago.com/boleto/${Date.now()}` : null;
    const initPoint =
      method === "cartao" ? `https://mock.mercadopago.com/checkout/${Date.now()}` : null;

    const { error } = await supabase.from("invoices").insert({
      customer_id: customerId || null,
      order_id: orderId || null,
      total,
      payment_method: method,
      due_date: dueDate,
      pix_copia_cola: pixPayload,
      pix_qr: pixPayload,
      boleto_url: boletoUrl,
      mp_init_point: initPoint,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Fatura criada");
    onCreated();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border border-border bg-background p-5 md:rounded-3xl md:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Nova fatura</h2>
          <button onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Pedido (opcional)</label>
            <select
              value={orderId}
              onChange={(e) => pickOrder(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="">— sem pedido vinculado —</option>
              {orders?.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.code} · {brl(Number(o.total))}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cliente</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="">— sem cliente —</option>
              {customers?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Total (R$)</label>
              <NumInput value={total} onValueChange={setTotal} placeholder="0,00" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Método de cobrança</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["pix", "boleto", "cartao", "manual"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-xs uppercase ${method === m ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Criando..." : "Criar fatura"}
        </button>
      </div>
    </div>
  );
}
