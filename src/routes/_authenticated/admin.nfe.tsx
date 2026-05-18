import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { brl, dateBR } from "@/features/core/utils/format";
import { Receipt, Download, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/nfe")({
  component: NfePage,
});

function NfePage() {
  const { data: orders } = useQuery({
    queryKey: ["orders-nfe"],
    queryFn: async () => (await supabase.from("orders").select("*, customers(name, email, phone)").in("status", ["pago", "enviado", "finalizado"])).data ?? [],
  });

  function generate(o: any) {
    const lines = [
      "═══════════════════════════════════════",
      "       COM AMOR VESTUÁRIO LTDA",
      "  Nota Fiscal Eletrônica (simulação)",
      "═══════════════════════════════════════",
      "",
      `NF-e nº: NFE-${o.code}`,
      `Data emissão: ${dateBR(new Date())}`,
      `Pedido: ${o.code}`,
      "",
      `Cliente: ${o.customers?.name ?? "—"}`,
      `Subtotal: ${brl(Number(o.subtotal))}`,
      `Frete: ${brl(Number(o.shipping))}`,
      `TOTAL: ${brl(Number(o.total))}`,
      "",
      "Este é um documento de demonstração.",
      "Em produção, integrar com NFePHP ou similar.",
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `NFE-${o.code}.txt`;
    a.click();
    toast.success("NF-e gerada");
  }

  function whatsApp(o: any) {
    const phone = (o.customers?.phone ?? "").replace(/\D/g, "");
    const text = encodeURIComponent(`Olá ${o.customers?.name ?? ""}! Segue a NF-e do pedido ${o.code} no valor de ${brl(Number(o.total))}. — Com Amor Vestuário`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  }

  function email(o: any) {
    const subject = encodeURIComponent(`NF-e do pedido ${o.code}`);
    const body = encodeURIComponent(`Olá!\n\nSegue a NF-e do seu pedido ${o.code} no valor de ${brl(Number(o.total))}.\n\nObrigado,\nCom Amor Vestuário`);
    window.open(`mailto:${o.customers?.email ?? ""}?subject=${subject}&body=${body}`);
  }

  return (
    <AdminShell title="Nota Fiscal Eletrônica">
      <div className="mb-6 rounded-2xl border border-border bg-accent/30 p-4 text-sm text-muted-foreground">
        ℹ️ Gere e envie NF-e dos pedidos faturados/finalizados. <strong>Demonstração</strong> — integração real com NFePHP, Focus NFe ou eNotas pode ser plugada substituindo a função <code>generate()</code>.
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Ações</th></tr>
          </thead>
          <tbody>
            {orders?.map((o: any) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{o.code}</td>
                <td className="px-4 py-3 font-medium">{o.customers?.name ?? "—"}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-1 text-xs">{o.status}</span></td>
                <td className="px-4 py-3">{brl(Number(o.total))}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => generate(o)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"><Receipt className="h-3 w-3" /> Gerar</button>
                    <button onClick={() => generate(o)} className="rounded-lg p-2 hover:bg-muted" title="Baixar"><Download className="h-4 w-4" /></button>
                    <button onClick={() => email(o)} className="rounded-lg p-2 hover:bg-muted" title="E-mail"><Mail className="h-4 w-4" /></button>
                    <button onClick={() => whatsApp(o)} className="rounded-lg p-2 hover:bg-muted" title="WhatsApp"><MessageCircle className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!orders?.length && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nenhum pedido faturado ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

