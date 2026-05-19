import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { brl, dateTimeBR } from "@/features/core/utils/format";
import { toast } from "sonner";
import {
  Plus,
  X,
  Trash2,
  Check,
  Search,
  UserPlus,
  FileDown,
  Truck,
  Ticket,
  X as XIcon,
} from "lucide-react";
import { CustomerForm } from "./admin.clientes";
import { priceFor } from "@/features/vendas/services/pricing";
import { calcShipping } from "@/features/vendas/services/freight";
import { NumInput } from "@/features/core/components/num-input";
import { downloadDocPDF } from "@/features/core/services/pdf";
import {
  evaluateVoucher,
  markVoucherUsed,
  type VoucherEval,
} from "@/features/fidelidade/services/rewards";
import { Dialog, DialogContent } from "@/features/core/components/dialog";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: OrdersPage,
});

const STAGES: { key: string; label: string; field?: string }[] = [
  { key: "realizado", label: "Realizado" },
  { key: "separado", label: "Separado", field: "separated_at" },
  { key: "pago", label: "Pago / Faturado", field: "paid_at" },
  { key: "enviado", label: "Enviado", field: "shipped_at" },
  { key: "finalizado", label: "Finalizado", field: "finished_at" },
];

interface OrderItem {
  product_id?: string;
  product_name: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

function OrdersPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select("*, customers(name, code, phone, email)")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const advance = useMutation({
    mutationFn: async ({ id, status, field }: { id: string; status: string; field?: string }) => {
      const payload: any = { status };
      if (field) payload[field] = new Date().toISOString();
      const { error } = await supabase.from("orders").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido atualizado");
    },
  });

  const detailOrder = orders?.find((o: any) => o.id === detailId) ?? null;

  return (
    <AdminShell
      title="Pedidos"
      noScroll
      actions={
        <button
          onClick={() => setCreating(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shrink-0"
        >
          <Plus className="h-4 w-4" /> Novo pedido
        </button>
      }
    >
      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 flex-1 overflow-y-hidden flex flex-col min-h-0">
        <div
          className="grid gap-3 md:gap-4 h-full min-h-0"
          style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(240px, 1fr))` }}
        >
          {STAGES.map((s) => {
            const stageOrders = orders?.filter((o: any) => o.status === s.key) ?? [];
            return (
              <div
                key={s.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(s.key);
                }}
                onDragLeave={() => setOverStage((cur) => (cur === s.key ? null : cur))}
                onDrop={() => {
                  if (dragId) advance.mutate({ id: dragId, status: s.key, field: s.field });
                  setDragId(null);
                  setOverStage(null);
                }}
                className={`rounded-2xl border bg-card p-4 transition-colors flex flex-col h-[400px] md:h-full min-h-0 ${overStage === s.key ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2 shrink-0">
                  <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium tabular-nums">
                    {stageOrders.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {stageOrders.map((o: any) => {
                    const idx = STAGES.findIndex((x) => x.key === s.key);
                    const next = STAGES[idx + 1];
                    return (
                      <button
                        key={o.id}
                        type="button"
                        draggable
                        onDragStart={() => setDragId(o.id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverStage(null);
                        }}
                        onClick={() => setDetailId(o.id)}
                        className={`w-full cursor-grab rounded-xl border border-border bg-background p-3 text-left text-sm transition-shadow hover:shadow-sm active:cursor-grabbing ${dragId === o.id ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs">{o.code}</span>
                          <span className="font-medium">{brl(o.total)}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {o.customers?.name ?? "Sem cliente"}
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {dateTimeBR(o.created_at)}
                        </div>
                        {next && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              advance.mutate({ id: o.id, status: next.key, field: next.field });
                            }}
                            className="mt-2 block w-full rounded-lg bg-primary px-2 py-1 text-center text-xs font-medium text-primary-foreground"
                          >
                            Avançar → {next.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {!stageOrders.length && (
                    <div className="rounded-xl border border-dashed border-border/60 px-2 py-4 text-center text-[11px] text-muted-foreground shrink-0">
                      Solte aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground md:hidden shrink-0">
        Arraste para o lado para ver todas as etapas →
      </p>

      <p className="mt-4 text-xs text-muted-foreground shrink-0">
        Pedidos são criados a partir da Loja Virtual (checkout), de Orçamentos aprovados, do CRM
        (Kanban Fardamento → Aprovado) ou diretamente pelo botão "Novo pedido".
      </p>

      {creating && (
        <NewOrderDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["orders"] });
          }}
        />
      )}

      {detailOrder && <OrderDetailDialog order={detailOrder} onClose={() => setDetailId(null)} />}
    </AdminShell>
  );
}

function OrderDetailDialog({ order, onClose }: { order: any; onClose: () => void }) {
  const { data: items } = useQuery({
    queryKey: ["order-items", order.id],
    queryFn: async () =>
      (await supabase.from("order_items").select("*").eq("order_id", order.id)).data ?? [],
  });

  function downloadPDF() {
    downloadDocPDF({
      kind: "Pedido",
      code: order.code,
      date: order.created_at,
      customer: order.customers,
      items: (items ?? []).map((i: any) => ({
        product_name: i.product_name,
        color: i.color,
        size: i.size,
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
        total: Number(i.total),
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      total: Number(order.total),
      notes: order.notes,
    });
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-background">
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4 sm:px-7 pr-12">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pedido</p>
            <h3 className="font-display text-xl sm:text-2xl">{order.code}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{dateTimeBR(order.created_at)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Cliente</p>
              <p>{order.customers?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
              <p className="capitalize">{order.status}</p>
            </div>
            {order.customers?.phone && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp</p>
                <p>{order.customers.phone}</p>
              </div>
            )}
            {order.customers?.email && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</p>
                <p>{order.customers.email}</p>
              </div>
            )}
          </div>

          <h4 className="mt-5 font-display text-lg">Itens</h4>
          <div className="mt-2 divide-y divide-border rounded-xl border border-border">
            {items?.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[i.color, i.size].filter(Boolean).join(" · ")} · {i.quantity}×{" "}
                    {brl(Number(i.unit_price))}
                  </p>
                </div>
                <p className="shrink-0 font-medium">{brl(Number(i.total))}</p>
              </div>
            ))}
            {!items?.length && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">Sem itens.</p>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{brl(Number(order.subtotal))}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Frete</span>
              <span>{brl(Number(order.shipping))}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-display text-lg">
              <span>Total</span>
              <span className="text-primary">{brl(Number(order.total))}</span>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Observações</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3 sm:px-7">
          <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
            Fechar
          </button>
          <button
            onClick={downloadPDF}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <FileDown className="h-4 w-4" /> Baixar PDF
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewOrderDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shipping, setShipping] = useState(0);
  const [cep, setCep] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [newCustomer, setNewCustomer] = useState(false);

  const [voucherCode, setVoucherCode] = useState("");
  const [voucher, setVoucher] = useState<VoucherEval | null>(null);
  const [applyingV, setApplyingV] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["products-active-orders"],
    queryFn: async () =>
      (await supabase.from("products").select("*").eq("active", true)).data ?? [],
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-search-orders", customerSearch],
    queryFn: async () =>
      (
        await supabase
          .from("customers")
          .select("id, code, name, phone")
          .ilike("name", `%${customerSearch}%`)
          .limit(8)
      ).data ?? [],
    enabled: customerSearch.length > 1,
  });

  const totalQty = items.reduce((a, b) => a + b.quantity, 0);
  const subtotal = items.reduce((a, b) => a + b.total, 0);
  const effectiveShipping = voucher?.freeShipping ? 0 : shipping;
  const discount = voucher?.discount && !voucher.freeShipping ? voucher.discount : 0;
  const total = Math.max(0, subtotal + effectiveShipping - discount);

  async function applyVoucher() {
    if (!voucherCode.trim()) return;
    setApplyingV(true);
    const res = await evaluateVoucher(voucherCode, customerId || null, subtotal, shipping);
    setApplyingV(false);
    if (!res.ok) {
      toast.error(res.error || "Voucher inválido");
      return;
    }
    setVoucher(res);
    toast.success("Voucher aplicado!");
  }
  function removeVoucher() {
    setVoucher(null);
    setVoucherCode("");
  }

  function addItem(productId: string) {
    const p = products?.find((x: any) => x.id === productId);
    if (!p) return;
    const newQty = totalQty + 1;
    const arr = [
      ...items,
      {
        product_id: p.id,
        product_name: p.name,
        color: p.colors?.[0],
        size: p.sizes?.[0],
        quantity: 1,
        unit_price: priceFor(newQty, p.retail_price, p.wholesale_price),
        total: priceFor(newQty, p.retail_price, p.wholesale_price),
      },
    ];
    recalc(arr);
  }

  function recalc(arr: OrderItem[]) {
    const newQty = arr.reduce((a, b) => a + b.quantity, 0);
    const updated = arr.map((it) => {
      const p = products?.find((x: any) => x.id === it.product_id);
      const unit = p ? priceFor(newQty, p.retail_price, p.wholesale_price) : it.unit_price;
      return { ...it, unit_price: unit, total: unit * it.quantity };
    });
    setItems(updated);
  }

  async function fetchFreight() {
    const v = await calcShipping(cep, totalQty || 1);
    setShipping(v);
    if (v > 0) toast.success(`Frete estimado: ${brl(v)}`);
    else toast.error("CEP inválido");
  }

  async function save() {
    if (!items.length) {
      toast.error("Adicione ao menos 1 item");
      return;
    }
    setSaving(true);
    const voucherNote = voucher?.redemption
      ? `\nVoucher ${voucher.redemption.voucher_code}: -${brl(voucher.freeShipping ? shipping : (voucher.discount ?? 0))}`
      : "";
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId || null,
        subtotal,
        shipping: effectiveShipping,
        total,
        notes: (notes || "") + voucherNote,
        status: "realizado",
        source: "manual",
      })
      .select()
      .single();
    if (error || !order) {
      toast.error(error?.message ?? "Erro");
      setSaving(false);
      return;
    }

    const itemsPayload = items.map((i) => ({ ...i, order_id: order.id }));
    await supabase.from("order_items").insert(itemsPayload);

    if (voucher?.redemption) await markVoucherUsed(voucher.redemption.id, order.id);

    setSaving(false);
    toast.success(`Pedido ${order.code} criado!`);
    onSaved();
  }

  return (
    <>
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden bg-background">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 sm:px-7 pr-12">
            <h3 className="font-display text-xl sm:text-2xl">Novo pedido</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            <div>
              <label className="text-sm font-medium">Cliente</label>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerId("");
                    }}
                    placeholder="Buscar cliente (opcional)"
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm"
                    style={{ fontSize: 16 }}
                  />
                  {customers &&
                    customers.length > 0 &&
                    customerSearch.length > 1 &&
                    !customerId && (
                      <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                        {customers.map((c: any) => (
                          <li key={c.id}>
                            <button
                              onClick={() => {
                                setCustomerId(c.id);
                                setCustomerSearch(c.name);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                              <span className="font-medium">{c.name}</span>{" "}
                              <span className="text-xs text-muted-foreground">{c.code}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                <button
                  onClick={() => setNewCustomer(true)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm"
                >
                  <UserPlus className="h-4 w-4" /> Novo
                </button>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="mb-2 font-display text-lg">Itens</h4>
              <select
                onChange={(e) => {
                  if (e.target.value) addItem(e.target.value);
                  e.target.value = "";
                }}
                className="mb-3 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
              >
                <option value="">+ Adicionar produto...</option>
                {products?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name} — {brl(p.retail_price)} / {brl(p.wholesale_price)}
                  </option>
                ))}
              </select>

              <div className="space-y-2">
                {items.map((it, idx) => {
                  const p = products?.find((x: any) => x.id === it.product_id);
                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3"
                    >
                      <span className="w-full text-sm font-medium sm:w-auto sm:flex-1">
                        {it.product_name}
                      </span>
                      <select
                        value={it.color ?? ""}
                        onChange={(e) => {
                          const a = [...items];
                          a[idx] = { ...a[idx], color: e.target.value };
                          setItems(a);
                        }}
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                      >
                        {p?.colors?.map((c: string) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <select
                        value={it.size ?? ""}
                        onChange={(e) => {
                          const a = [...items];
                          a[idx] = { ...a[idx], size: e.target.value };
                          setItems(a);
                        }}
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                      >
                        {p?.sizes?.map((s: string) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <NumInput
                        allowDecimal={false}
                        value={it.quantity}
                        onValueChange={(n) => {
                          const a = [...items];
                          a[idx] = { ...a[idx], quantity: Math.max(1, n || 1) };
                          recalc(a);
                        }}
                        className="w-20 px-2 py-1.5"
                        placeholder="1"
                      />
                      <span className="w-24 text-right text-sm">{brl(it.unit_price)}</span>
                      <span className="w-24 text-right text-sm font-medium">{brl(it.total)}</span>
                      <button
                        onClick={() => {
                          const a = items.filter((_, i) => i !== idx);
                          recalc(a);
                        }}
                        className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                {!items.length && (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    Nenhum item adicionado.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">CEP do destino</label>
                <div className="flex gap-2">
                  <input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                    style={{ fontSize: 16 }}
                  />
                  <button
                    type="button"
                    onClick={fetchFreight}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-border px-3 text-sm"
                  >
                    <Truck className="h-4 w-4" /> Calcular
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Frete (R$)</label>
                <NumInput value={shipping} onValueChange={setShipping} placeholder="0,00" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Observações</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  style={{ fontSize: 16 }}
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-4">
              <div className="mb-3">
                {voucher ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <Ticket className="h-4 w-4 text-primary" />
                      <code className="font-mono text-xs">{voucherCode.toUpperCase()}</code>
                      <span className="text-xs text-muted-foreground">aplicado</span>
                    </span>
                    <button
                      type="button"
                      onClick={removeVoucher}
                      className="rounded-full p-1 hover:bg-background"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="Código de voucher"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm uppercase"
                      style={{ fontSize: 16 }}
                    />
                    <button
                      type="button"
                      onClick={applyVoucher}
                      disabled={applyingV || !voucherCode.trim()}
                      className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm disabled:opacity-50"
                    >
                      <Ticket className="h-4 w-4" /> Aplicar
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal ({totalQty} peças)</span>
                <span>{brl(subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span>
                  Frete
                  {voucher?.freeShipping && (
                    <span className="ml-1 text-xs text-primary">(grátis)</span>
                  )}
                </span>
                <span>
                  {voucher?.freeShipping ? (
                    <s className="text-muted-foreground">{brl(shipping)}</s>
                  ) : (
                    brl(shipping)
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="mt-1 flex justify-between text-sm text-primary">
                  <span>Desconto</span>
                  <span>−{brl(discount)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-display text-lg">
                <span>Total</span>
                <span className="text-primary">{brl(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3 sm:px-7">
            <button
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving || !items.length}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60 hover:bg-primary/90 transition-colors"
            >
              <Check className="h-4 w-4" /> {saving ? "Criando..." : "Criar pedido"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {newCustomer && (
        <CustomerForm
          initial={{}}
          onClose={() => setNewCustomer(false)}
          onSaved={(c) => {
            setNewCustomer(false);
            if (c) {
              setCustomerId(c.id);
              setCustomerSearch(c.name);
            }
          }}
        />
      )}
    </>
  );
}
