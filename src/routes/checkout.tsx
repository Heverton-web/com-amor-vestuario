import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useCart } from "@/features/vendas/services/cart";
import { brl } from "@/features/core/utils/format";
import { priceFor } from "@/features/vendas/services/pricing";
import { calcShipping } from "@/features/vendas/services/freight";
import { lookupCep } from "@/features/vendas/services/viacep";
import { supabase } from "@/features/core/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Search, CreditCard, Check, Ticket, X as XIcon } from "lucide-react";
import { evaluateVoucher, markVoucherUsed, type VoucherEval } from "@/features/fidelidade/services/rewards";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const totalQty = cart.totalQty();
  const items = useMemo(() => cart.items.map((i) => ({ ...i, unit: priceFor(totalQty, i.retailPrice, i.wholesalePrice) })), [cart.items, totalQty]);
  const subtotal = items.reduce((a, b) => a + b.unit * b.qty, 0);

  const [form, setForm] = useState({ name: "", email: "", phone: "", cep: "", street: "", number: "", city: "", state: "" });
  const [shipping, setShipping] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const [voucherCode, setVoucherCode] = useState("");
  const [voucher, setVoucher] = useState<VoucherEval | null>(null);
  const [applying, setApplying] = useState(false);

  const effectiveShipping = voucher?.freeShipping ? 0 : shipping;
  const discount = voucher?.discount && !voucher.freeShipping ? voucher.discount : 0;
  const total = Math.max(0, subtotal + effectiveShipping - discount);

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  async function applyVoucher() {
    if (!voucherCode.trim()) return;
    setApplying(true);
    // Sem customer_id ainda no checkout público; valida apenas regras gerais
    const res = await evaluateVoucher(voucherCode, null, subtotal, shipping);
    setApplying(false);
    if (!res.ok) { toast.error(res.error || "Voucher inválido"); return; }
    setVoucher(res);
    toast.success("Voucher aplicado!");
  }

  function removeVoucher() { setVoucher(null); setVoucherCode(""); }

  async function fetchCep() {
    const a = await lookupCep(form.cep);
    if (!a) { toast.error("CEP não encontrado"); return; }
    setForm((s) => ({ ...s, street: a.logradouro, city: a.localidade, state: a.uf }));
    setShipping(await calcShipping(form.cep, totalQty));
  }

  async function placeOrder() {
    if (!items.length) return;
    if (!form.name || !form.phone) { toast.error("Preencha nome e WhatsApp"); return; }
    setPlacing(true);

    // upsert customer by phone or email
    const { data: existing } = await supabase.from("customers").select("id").eq("phone", form.phone).maybeSingle();
    let customerId = existing?.id;
    if (!customerId) {
      const { data: c } = await supabase.from("customers").insert({
        name: form.name, type: "pf", phone: form.phone, email: form.email,
        category: totalQty >= 6 ? "atacado" : "varejo",
        cep: form.cep, street: form.street, number: form.number, city: form.city, state: form.state,
      }).select("id").single();
      customerId = c?.id;
    }

    // Re-valida o voucher agora que conhecemos o customer
    let finalVoucher = voucher;
    if (voucher && customerId) {
      const recheck = await evaluateVoucher(voucherCode, customerId, subtotal, shipping);
      if (!recheck.ok) { toast.error(recheck.error || "Voucher inválido para este cliente"); setPlacing(false); return; }
      finalVoucher = recheck;
    }
    const effShip = finalVoucher?.freeShipping ? 0 : shipping;
    const disc = finalVoucher?.discount && !finalVoucher.freeShipping ? finalVoucher.discount : 0;
    const finalTotal = Math.max(0, subtotal + effShip - disc);
    const voucherNote = finalVoucher?.redemption
      ? `Voucher ${finalVoucher.redemption.voucher_code}: -${brl(finalVoucher.freeShipping ? shipping : (finalVoucher.discount ?? 0))}`
      : null;

    const { data: order } = await supabase.from("orders").insert({
      customer_id: customerId, status: "realizado", source: "loja_virtual",
      subtotal, shipping: effShip, total: finalTotal,
      notes: voucherNote,
    }).select().single();

    if (order) {
      await supabase.from("order_items").insert(items.map((it) => ({
        order_id: order.id, product_id: it.productId, product_name: it.name,
        color: it.color, size: it.size, quantity: it.qty, unit_price: it.unit, total: it.unit * it.qty,
      })));
      await supabase.from("kanban_cards").insert({
        board: "pedidos", stage: "realizado", title: `${order.code} · ${form.name}`,
        customer_id: customerId, order_id: order.id, amount: finalTotal,
        contact_name: form.name, contact_whatsapp: form.phone,
      });
      if (finalVoucher?.redemption) await markVoucherUsed(finalVoucher.redemption.id, order.id);
      cart.clear();
      setDone(order.code);
    } else {
      toast.error("Erro ao criar pedido");
    }
    setPlacing(false);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-3xl border border-border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-7 w-7" /></div>
          <h1 className="mt-5 font-display text-3xl">Pedido recebido!</h1>
          <p className="mt-2 text-muted-foreground">Seu pedido <strong>{done}</strong> foi registrado. Em breve enviaremos o link de pagamento (Mercado Pago) pelo WhatsApp.</p>
          <Link to="/loja" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">Voltar para a loja</Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Seu carrinho está vazio.</p>
          <Link to="/loja" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Ir para a loja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link to="/loja" className="inline-flex min-h-11 items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Voltar à loja</span></Link>
          <h1 className="font-display text-base sm:text-xl">Finalizar compra</h1>
          <span className="w-8" />
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 sm:py-10 md:grid-cols-[1fr_360px] md:gap-8">
        <div className="space-y-5 rounded-3xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-display text-lg sm:text-xl">Seus dados</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Lbl t="Nome completo" c="md:col-span-2"><input required value={form.name} onChange={(e) => set("name", e.target.value)} className="input" /></Lbl>
            <Lbl t="WhatsApp"><input required inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" /></Lbl>
            <Lbl t="E-mail"><input type="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" /></Lbl>
            <Lbl t="CEP">
              <div className="flex gap-2">
                <input inputMode="numeric" value={form.cep} onChange={(e) => set("cep", e.target.value)} className="input flex-1" />
                <button onClick={fetchCep} aria-label="Buscar CEP" className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-border px-3"><Search className="h-4 w-4" /></button>
              </div>
            </Lbl>
            <Lbl t="Número"><input inputMode="numeric" value={form.number} onChange={(e) => set("number", e.target.value)} className="input" /></Lbl>
            <Lbl t="Rua" c="md:col-span-2"><input value={form.street} onChange={(e) => set("street", e.target.value)} className="input" /></Lbl>
            <Lbl t="Cidade"><input value={form.city} onChange={(e) => set("city", e.target.value)} className="input" /></Lbl>
            <Lbl t="UF"><input value={form.state} onChange={(e) => set("state", e.target.value)} className="input" /></Lbl>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
            <h3 className="font-display text-lg">Resumo</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((i, k) => (
                <li key={k} className="flex justify-between gap-3"><span className="line-clamp-1">{i.qty}x {i.name}</span><span className="shrink-0">{brl(i.unit * i.qty)}</span></li>
              ))}
            </ul>

            <div className="mt-4 border-t border-border pt-4">
              {voucher ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 truncate"><Ticket className="h-4 w-4 text-primary" /><code className="font-mono text-xs">{voucherCode.toUpperCase()}</code><span className="text-xs text-muted-foreground truncate">aplicado</span></span>
                  <button onClick={removeVoucher} aria-label="Remover voucher" className="rounded-full p-1 hover:bg-background"><XIcon className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} placeholder="CUPOM" className="input flex-1 uppercase" />
                  <button onClick={applyVoucher} disabled={applying || !voucherCode.trim()} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm disabled:opacity-50"><Ticket className="h-4 w-4" /> Aplicar</button>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
              <div className="flex justify-between"><span>Frete{voucher?.freeShipping && <span className="ml-1 text-xs text-primary">(grátis)</span>}</span><span>{voucher?.freeShipping ? <s className="text-muted-foreground">{brl(shipping)}</s> : brl(shipping)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-primary"><span>Desconto</span><span>−{brl(discount)}</span></div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-display text-xl"><span>Total</span><span className="text-primary">{brl(total)}</span></div>
            </div>
            <button onClick={placeOrder} disabled={placing} className="mt-5 hidden min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-60 md:inline-flex">
              <CreditCard className="h-4 w-4" /> {placing ? "Finalizando..." : "Confirmar pedido"}
            </button>
            <p className="mt-3 hidden text-center text-[11px] text-muted-foreground md:block">Pagamento via Mercado Pago será enviado por WhatsApp.</p>
          </div>
        </aside>
      </div>

      {/* Sticky CTA mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground">Total</p>
            <p className="font-display text-xl text-primary leading-none">{brl(total)}</p>
          </div>
          <button onClick={placeOrder} disabled={placing} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
            <CreditCard className="h-4 w-4" /> {placing ? "Finalizando..." : "Confirmar"}
          </button>
        </div>
      </div>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--input);background:var(--background);padding:0.75rem 0.9rem;font-size:16px;outline:none;min-height:44px}.input:focus{box-shadow:0 0 0 2px color-mix(in oklab,var(--primary) 40%,transparent)}`}</style>
    </div>
  );
}

function Lbl({ t, c = "", children }: { t: string; c?: string; children: React.ReactNode }) {
  return <label className={`block ${c}`}><span className="mb-1.5 block text-sm font-medium">{t}</span>{children}</label>;
}

