import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { brl, dateBR } from "@/features/core/utils/format";
import { Heart, Copy, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/fatura/$token")({
  head: () => ({ meta: [{ title: "Fatura · Com Amor Vestuário" }] }),
  component: PublicInvoicePage,
});

function PublicInvoicePage() {
  const { token } = Route.useParams();
  const qc = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["public-invoice", token],
    queryFn: async () => {
      const { data: inv } = await supabase
        .from("invoices")
        .select("*")
        .eq("public_token", token)
        .maybeSingle();
      if (!inv) return null;
      const [{ data: customer }, { data: order }] = await Promise.all([
        inv.customer_id
          ? supabase.from("customers").select("name").eq("id", inv.customer_id).maybeSingle()
          : Promise.resolve({ data: null }),
        inv.order_id
          ? supabase.from("orders").select("code").eq("id", inv.order_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return { ...inv, customers: customer, orders: order } as any;
    },
  });

  // MOCK: simula confirmação de pagamento (em produção viria do webhook do MP)
  const simulatePay = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      await supabase
        .from("invoices")
        .update({
          status: "paga",
          paid_total: invoice.total,
          mp_payment_id: "MOCK-" + Date.now(),
        })
        .eq("id", invoice.id);
      await supabase.from("invoice_payments").insert({
        invoice_id: invoice.id,
        amount: invoice.total,
        method: invoice.payment_method ?? "manual",
        gateway_id: "MOCK-" + Date.now(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-invoice", token] });
      toast.success("Pagamento confirmado!");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <h1 className="font-display text-3xl">Fatura não encontrada</h1>
          <p className="mt-2 text-muted-foreground">O link pode ter expirado ou está incorreto.</p>
        </div>
      </div>
    );
  }

  const paid = invoice.status === "paga";
  const cancelled = invoice.status === "cancelada";

  function copyPix() {
    if (!invoice?.pix_copia_cola) return;
    navigator.clipboard.writeText(invoice.pix_copia_cola);
    toast.success("Pix copia-e-cola copiado");
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4 sm:h-16 sm:px-6">
          <Heart className="h-4 w-4 fill-primary stroke-primary" />
          <span className="font-display text-lg font-medium">Com Amor</span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            fatura
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted-foreground">{invoice.code}</p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl">
                Olá, {invoice.customers?.name ?? "cliente"}!
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {invoice.orders?.code && (
                  <>
                    Pedido <strong>{invoice.orders.code}</strong> ·{" "}
                  </>
                )}
                Vencimento: <strong>{invoice.due_date ? dateBR(invoice.due_date) : "—"}</strong>
              </p>
            </div>
            {paid ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                <CheckCircle2 className="h-3 w-3" /> Paga
              </span>
            ) : cancelled ? (
              <span className="rounded-full bg-muted px-3 py-1 text-xs">Cancelada</span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
                <Clock className="h-3 w-3" /> Aberta
              </span>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-accent/30 p-5 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="mt-1 font-display text-4xl text-primary sm:text-5xl">
              {brl(Number(invoice.total))}
            </p>
          </div>

          {!paid && !cancelled && (
            <div className="mt-6 space-y-4">
              {invoice.payment_method === "pix" && invoice.pix_copia_cola && (
                <div className="rounded-2xl border border-border p-5">
                  <h3 className="font-display text-lg">Pague com Pix</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Copie o código abaixo e cole no app do seu banco.
                  </p>
                  <div className="mt-3 break-all rounded-xl bg-muted p-3 font-mono text-[11px]">
                    {invoice.pix_copia_cola}
                  </div>
                  <button
                    onClick={copyPix}
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
                  >
                    <Copy className="h-4 w-4" /> Copiar Pix
                  </button>
                </div>
              )}

              {invoice.payment_method === "boleto" && invoice.boleto_url && (
                <div className="rounded-2xl border border-border p-5">
                  <h3 className="font-display text-lg">Boleto bancário</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vencimento {invoice.due_date ? dateBR(invoice.due_date) : "—"}
                  </p>
                  <a
                    href={invoice.boleto_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
                  >
                    <ExternalLink className="h-4 w-4" /> Abrir boleto
                  </a>
                </div>
              )}

              {invoice.payment_method === "cartao" && invoice.mp_init_point && (
                <div className="rounded-2xl border border-border p-5">
                  <h3 className="font-display text-lg">Cartão de crédito</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pagamento seguro via Mercado Pago.
                  </p>
                  <a
                    href={invoice.mp_init_point}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
                  >
                    <ExternalLink className="h-4 w-4" /> Pagar com cartão
                  </a>
                </div>
              )}

              {invoice.payment_method === "manual" && (
                <div className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
                  Combine o pagamento diretamente com a equipe Com Amor.
                </div>
              )}

              {/* MOCK demo button */}
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center">
                <p className="text-xs text-muted-foreground">🧪 Modo demonstração</p>
                <button
                  onClick={() => simulatePay.mutate()}
                  disabled={simulatePay.isPending}
                  className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-5 py-2 text-xs font-medium text-primary"
                >
                  Simular confirmação de pagamento
                </button>
              </div>
            </div>
          )}

          {paid && (
            <div className="mt-6 rounded-2xl bg-primary/10 p-5 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-2 font-display text-xl">Pagamento confirmado!</p>
              <p className="mt-1 text-sm text-muted-foreground">Obrigado pela sua compra.</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Dúvidas? Fale com a Com Amor pelo WhatsApp.
        </p>
      </div>
    </div>
  );
}
