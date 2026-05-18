// Regra de negócio: 1-5 peças = varejo, >=6 peças = atacado.
export const WHOLESALE_THRESHOLD = 6;

export function priceFor(qtyTotal: number, retail: number, wholesale: number) {
  return qtyTotal >= WHOLESALE_THRESHOLD ? wholesale : retail;
}

export function priceTier(qtyTotal: number): "varejo" | "atacado" {
  return qtyTotal >= WHOLESALE_THRESHOLD ? "atacado" : "varejo";
}
