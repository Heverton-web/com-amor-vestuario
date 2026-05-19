import { jsPDF } from "jspdf";
import { brl, dateBR } from "@/features/core/utils/format";

interface DocItem {
  product_name: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

interface DocData {
  kind: "Orçamento" | "Pedido" | "Fatura" | "Nota";
  code: string;
  date?: string | Date | null;
  validUntil?: string | Date | null;
  customer?: { name?: string | null; phone?: string | null; email?: string | null } | null;
  requester?: string | null;
  consultant?: string | null;
  items?: DocItem[];
  subtotal?: number;
  shipping?: number;
  total: number;
  notes?: string | null;
  publicUrl?: string | null;
  brand?: string;
}

export function makeDocPDF(d: DocData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(d.brand ?? "Com Amor Vestuário", 40, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("comamor-vestuario.lovable.app", 40, y + 14);

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${d.kind} ${d.code}`, W - 40, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Emissão: ${dateBR(d.date ?? new Date())}`, W - 40, y + 14, { align: "right" });
  if (d.validUntil)
    doc.text(`Validade: ${dateBR(d.validUntil)}`, W - 40, y + 28, { align: "right" });

  y += 50;
  doc.setDrawColor(220);
  doc.line(40, y, W - 40, y);
  y += 18;

  // Cliente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Cliente", 40, y);
  doc.setFont("helvetica", "normal");
  y += 14;
  doc.text(d.customer?.name ?? d.requester ?? "—", 40, y);
  if (d.customer?.phone) {
    y += 12;
    doc.text(`Tel: ${d.customer.phone}`, 40, y);
  }
  if (d.customer?.email) {
    y += 12;
    doc.text(`E-mail: ${d.customer.email}`, 40, y);
  }
  if (d.consultant) {
    y += 12;
    doc.text(`Consultor(a): ${d.consultant}`, 40, y);
  }
  y += 22;

  // Itens
  if (d.items?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Itens", 40, y);
    y += 8;
    doc.line(40, y, W - 40, y);
    y += 14;
    doc.setFontSize(9);
    doc.text("Qtd", 40, y);
    doc.text("Produto", 80, y);
    doc.text("Unit.", W - 180, y, { align: "right" });
    doc.text("Total", W - 40, y, { align: "right" });
    y += 6;
    doc.line(40, y, W - 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    for (const it of d.items) {
      if (y > 760) {
        doc.addPage();
        y = 56;
      }
      const desc = `${it.product_name}${it.color ? ` · ${it.color}` : ""}${it.size ? ` · ${it.size}` : ""}`;
      doc.text(String(it.quantity), 40, y);
      doc.text(desc, 80, y, { maxWidth: W - 280 });
      doc.text(brl(it.unit_price), W - 180, y, { align: "right" });
      doc.text(brl(it.total), W - 40, y, { align: "right" });
      y += 16;
    }
    y += 6;
    doc.setDrawColor(220);
    doc.line(40, y, W - 40, y);
    y += 14;
  }

  // Totais
  doc.setFontSize(10);
  if (d.subtotal != null) {
    doc.text("Subtotal", W - 180, y, { align: "right" });
    doc.text(brl(d.subtotal), W - 40, y, { align: "right" });
    y += 14;
  }
  if (d.shipping != null) {
    doc.text("Frete", W - 180, y, { align: "right" });
    doc.text(brl(d.shipping), W - 40, y, { align: "right" });
    y += 14;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL", W - 180, y + 6, { align: "right" });
  doc.text(brl(d.total), W - 40, y + 6, { align: "right" });
  y += 30;

  if (d.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Observações", 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(d.notes, W - 80);
    doc.text(lines, 40, y);
    y += lines.length * 12 + 6;
  }

  if (d.publicUrl) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Link: ${d.publicUrl}`, 40, 800);
  }

  return doc;
}

export function downloadDocPDF(d: DocData) {
  const doc = makeDocPDF(d);
  doc.save(`${d.kind}-${d.code}.pdf`);
}
