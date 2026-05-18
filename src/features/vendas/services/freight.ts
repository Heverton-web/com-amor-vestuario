// Cálculo de frete simplificado (placeholder — substituir por Melhor Envio API).
// Por enquanto baseado em CEP (região) e quantidade de itens.
export async function calcShipping(cep: string, qty: number): Promise<number> {
  const clean = (cep || "").replace(/\D/g, "");
  if (clean.length !== 8) return 0;
  const region = parseInt(clean[0], 10);
  // Tabela mock: regiões mais distantes pagam mais.
  const baseTable = [22, 24, 26, 28, 30, 35, 40, 42, 45, 50];
  const base = baseTable[region] ?? 30;
  const extra = Math.max(0, qty - 1) * 3;
  return Number((base + extra).toFixed(2));
}
