import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { brl, dateBR } from "@/features/core/utils/format";
import { Heart, FileDown, CheckCircle2, XCircle } from "lucide-react";
import { downloadReceiptPDF } from "@/features/core/services/pdf-receipt";
import { useBranding } from "@/features/core/services/branding";
import logo from "@/assets/logo-com-amor.png";

export const Route = createFileRoute("/recibo/$token")({
  head: () => ({ meta: [{ title: "Recibo · Com Amor Vestuário" }] }),
  component: PublicReceiptPage,
});

const METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência bancária",
  boleto: "Boleto",
  outro: "Outro",
};

function PublicReceiptPage() {
  const { token } = Route.useParams();
  const { branding } = useBranding();

  const { data: r, isLoading } = useQuery({
    queryKey: ["public-receipt", token],
    queryFn: async () => {
      const { data } = await supabase
        .from("receipts" as never)
        .select("*")
        .eq("public_token", token)
        .maybeSingle();
      return data as never;
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>
    );
  }
  if (!r) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-display text-2xl">Recibo não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Verifique o link recebido.</p>
        </div>
      </div>
    );
  }

  const rc = r as {
    code: string;
    amount: number;
    amount_in_words: string;
    payer_name: string;
    payer_doc: string | null;
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
  };
  const cancelled = rc.status === "cancelado";

  const handlePDF = () =>
    downloadReceiptPDF({
      ...rc,
      amount: Number(rc.amount),
      issuer_name: rc.issuer_name || branding.issuer_legal_name || branding.brand_name,
      issuer_doc: rc.issuer_doc || branding.issuer_doc,
      issuer_address: rc.issuer_address || branding.issuer_address,
      signature_url: rc.signature_url || branding.signature_url,
      brand: branding.brand_name,
      publicUrl:
        typeof window !== "undefined" ? `${window.location.origin}/recibo/${rc.public_token}` : "",
    });

  return (
    <div className="min-h-screen bg-secondary/30 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <img
            src={branding.logo_url || logo}
            alt={branding.brand_name}
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
            <div>
              <div className="font-mono text-xs text-muted-foreground">{rc.code}</div>
              <h1 className="font-display text-2xl">Recibo</h1>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${cancelled ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}
            >
              {cancelled ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {cancelled ? "Cancelado" : "Pago"}
            </span>
          </div>

          <div className="space-y-5 p-6">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Valor recebido
              </div>
              <div className="mt-1 font-display text-4xl">{brl(Number(rc.amount))}</div>
              <div className="mt-2 text-sm italic text-muted-foreground">{rc.amount_in_words}</div>
            </div>

            <div className="space-y-2 rounded-xl bg-muted/30 p-4 text-sm">
              <Row
                k="Recebi de"
                v={`${rc.payer_name}${rc.payer_doc ? ` (${rc.payer_doc})` : ""}`}
              />
              <Row k="Referente a" v={rc.reference || "—"} />
              <Row
                k="Forma de pagamento"
                v={METHOD_LABEL[rc.payment_method] ?? rc.payment_method}
              />
              <Row k="Data" v={`${rc.city ? rc.city + ", " : ""}${dateBR(rc.paid_at)}`} />
            </div>

            {(rc.issuer_name || rc.issuer_doc || rc.issuer_address) && (
              <div className="border-t border-border pt-4 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">{rc.issuer_name}</div>
                {rc.issuer_doc && <div>CNPJ/CPF: {rc.issuer_doc}</div>}
                {rc.issuer_address && <div>{rc.issuer_address}</div>}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background px-6 py-4">
            <button
              onClick={handlePDF}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            >
              <FileDown className="h-4 w-4" /> Baixar PDF
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Este recibo é uma confirmação digital. Guarde o link para futuras consultas.
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <dt className="min-w-[140px] text-muted-foreground">{k}</dt>
      <dd className="flex-1 font-medium">{v}</dd>
    </div>
  );
}
