export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento?: string;
}

export async function lookupCep(cep: string): Promise<ViaCepAddress | null> {
  const clean = (cep || "").replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await r.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}
