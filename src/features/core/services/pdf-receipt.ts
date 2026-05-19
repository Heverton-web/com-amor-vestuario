import { jsPDF } from "jspdf";
import { brl, dateBR } from "@/features/core/utils/format";

export interface ReceiptData {
  code: string;
  amount: number;
  amount_in_words: string;
  payer_name: string;
  payer_doc?: string | null;
  reference: string;
  payment_method: string;
  paid_at: string | Date;
  city?: string | null;
  issuer_name?: string | null;
  issuer_doc?: string | null;
  issuer_address?: string | null;
  signature_mode: "linha" | "imagem";
  signature_url?: string | null;
  brand?: string;
  publicUrl?: string | null;
}

const METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência bancária",
  boleto: "Boleto",
  outro: "Outro",
};

async function loadImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function makeReceiptPDF(d: ReceiptData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  // Cabeçalho emissor
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(d.issuer_name || d.brand || "Recibo", 40, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  let ly = y + 14;
  if (d.issuer_doc) {
    doc.text(`CNPJ/CPF: ${d.issuer_doc}`, 40, ly);
    ly += 12;
  }
  if (d.issuer_address) {
    const lines = doc.splitTextToSize(d.issuer_address, 320);
    doc.text(lines, 40, ly);
    ly += lines.length * 11;
  }

  // Cabeçalho do recibo (direita)
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RECIBO", W - 40, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nº ${d.code}`, W - 40, y + 16, { align: "right" });

  y = Math.max(ly, y + 50) + 16;
  doc.setDrawColor(220);
  doc.line(40, y, W - 40, y);
  y += 30;

  // Valor destacado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(brl(d.amount), 40, y);
  y += 26;

  // Corpo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20);
  const bodyText =
    `Recebi de ${d.payer_name}${d.payer_doc ? `, portador(a) do documento ${d.payer_doc},` : ""} ` +
    `a importância de ${brl(d.amount)} (${d.amount_in_words}), ` +
    `referente a ${d.reference || "—"}, ` +
    `paga via ${METHOD_LABEL[d.payment_method] ?? d.payment_method}. ` +
    `Para maior clareza firmo o presente recibo, dando plena, geral e irrevogável quitação pelo valor recebido.`;
  const wrapped = doc.splitTextToSize(bodyText, W - 80);
  doc.text(wrapped, 40, y);
  y += wrapped.length * 15 + 26;

  // Local / data
  doc.text(`${d.city ? d.city + ", " : ""}${dateBR(d.paid_at)}.`, 40, y);
  y += 60;

  // Assinatura
  if (d.signature_mode === "imagem" && d.signature_url) {
    const img = await loadImage(d.signature_url);
    if (img) {
      try {
        doc.addImage(img, "PNG", W / 2 - 90, y - 40, 180, 50);
      } catch {
        /* ignore */
      }
    }
  }
  doc.setDrawColor(60);
  doc.line(W / 2 - 110, y, W / 2 + 110, y);
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(d.issuer_name || "Assinatura do emissor", W / 2, y + 14, { align: "center" });

  if (d.publicUrl) {
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Verificação: ${d.publicUrl}`, 40, 800);
  }

  return doc;
}

export async function downloadReceiptPDF(d: ReceiptData) {
  const doc = await makeReceiptPDF(d);
  doc.save(`Recibo-${d.code}.pdf`);
}
