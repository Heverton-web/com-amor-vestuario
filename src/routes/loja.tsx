import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { useCart } from "@/features/vendas/services/cart";
import { brl } from "@/features/core/utils/format";
import { priceFor, priceTier, WHOLESALE_THRESHOLD } from "@/features/vendas/services/pricing";
import {
  ShoppingBag,
  Heart,
  Filter,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/features/core/components/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/loja")({
  head: () => ({
    meta: [
      { title: "Loja · Com Amor Vestuário" },
      { name: "description", content: "Compre roupas autorais com tabela de varejo e atacado." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const cart = useCart();
  const totalQty = cart.totalQty();
  const tier = priceTier(totalQty);

  const [selected, setSelected] = useState<any>(null);
  const [filterPrice, setFilterPrice] = useState<[number, number]>([0, 1000]);
  const [filterColor, setFilterColor] = useState<string>("");
  const [filterSize, setFilterSize] = useState<string>("");

  const [showPrice, setShowPrice] = useState(true);
  const [showColor, setShowColor] = useState(true);
  const [showSize, setShowSize] = useState(true);

  const { data: products } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () =>
      (
        await supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const filtered = useMemo(() => {
    return (products ?? []).filter((p: any) => {
      const eff = priceFor(
        Math.max(totalQty, 1),
        Number(p.retail_price),
        Number(p.wholesale_price),
      );
      if (eff < filterPrice[0] || eff > filterPrice[1]) return false;
      if (filterColor && !p.colors?.includes(filterColor)) return false;
      if (filterSize && !p.sizes?.includes(filterSize)) return false;
      return true;
    });
  }, [products, filterPrice, filterColor, filterSize, totalQty]);

  const allColors = [...new Set((products ?? []).flatMap((p: any) => p.colors ?? []))];
  const allSizes = [...new Set((products ?? []).flatMap((p: any) => p.sizes ?? []))];

  const FiltersBody = (
    <div className="space-y-4">
      {/* Faixa de preço */}
      <div className="border-b border-border pb-4">
        <button
          onClick={() => setShowPrice(!showPrice)}
          className="flex w-full items-center justify-between py-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          <span>Faixa de preço (R$)</span>
          {showPrice ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showPrice && (
          <div className="mt-2.5 flex gap-2">
            <input
              inputMode="numeric"
              type="number"
              value={filterPrice[0]}
              onChange={(e) => setFilterPrice([+e.target.value, filterPrice[1]])}
              className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm"
              placeholder="Mín"
            />
            <input
              inputMode="numeric"
              type="number"
              value={filterPrice[1]}
              onChange={(e) => setFilterPrice([filterPrice[0], +e.target.value])}
              className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm"
              placeholder="Máx"
            />
          </div>
        )}
      </div>

      {/* Cor */}
      <div className="border-b border-border pb-4">
        <button
          onClick={() => setShowColor(!showColor)}
          className="flex w-full items-center justify-between py-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          <span>Cor</span>
          {showColor ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showColor && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterColor("")}
              className={`min-h-9 rounded-full border px-3 py-1.5 text-xs transition-all ${
                !filterColor
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              Todas
            </button>
            {allColors.map((c) => (
              <button
                key={c as string}
                onClick={() => setFilterColor(c as string)}
                className={`min-h-9 rounded-full border px-3 py-1.5 text-xs transition-all ${
                  filterColor === c
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                {c as string}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tamanho */}
      <div className="border-b border-border pb-4">
        <button
          onClick={() => setShowSize(!showSize)}
          className="flex w-full items-center justify-between py-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          <span>Tamanho</span>
          {showSize ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showSize && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterSize("")}
              className={`min-h-9 rounded-full border px-3 py-1.5 text-xs transition-all ${
                !filterSize
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              Todos
            </button>
            {allSizes.map((s) => (
              <button
                key={s as string}
                onClick={() => setFilterSize(s as string)}
                className={`min-h-9 rounded-full border px-3 py-1.5 text-xs transition-all ${
                  filterSize === s
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                {s as string}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de preços info */}
      <div className="rounded-2xl border border-border bg-card p-4 text-xs shadow-sm">
        <p className="text-muted-foreground">Aplicando tabela:</p>
        <p className="mt-1 font-display text-lg font-medium">
          {tier === "atacado" ? "🏷️ Atacado" : "Varejo"}
        </p>
        {tier === "varejo" && totalQty > 0 && (
          <p className="mt-1 text-muted-foreground">
            Faltam <strong>{WHOLESALE_THRESHOLD - totalQty}</strong> peças para o atacado.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex items-baseline gap-1.5 sm:gap-2">
            <Heart className="h-4 w-4 fill-primary stroke-primary" />
            <span className="font-display text-lg font-medium sm:text-xl">Com Amor</span>
            <span className="hidden text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:inline">
              loja
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden text-sm text-foreground/70 hover:text-primary sm:inline">
              ← Site
            </Link>
            <button
              onClick={() => cart.setOpen(true)}
              aria-label="Abrir carrinho"
              className="relative inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:px-5"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Carrinho</span>
              {totalQty > 0 && (
                <span className="rounded-full bg-primary-foreground px-1.5 text-xs font-bold text-primary">
                  {totalQty}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-border bg-accent/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14">
          <span className="text-[10px] uppercase tracking-[0.25em] text-primary sm:text-xs">
            coleção atual
          </span>
          <h1 className="mt-2 font-display font-medium leading-tight text-[clamp(1.75rem,7vw,3rem)] md:text-6xl">
            Peças autorais, prontas para você.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Tabela de <strong>atacado a partir de {WHOLESALE_THRESHOLD} peças</strong> no carrinho —
            vale para qualquer combinação.
          </p>
        </div>
      </section>

      {/* FILTROS + GRID */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          <aside className="sticky top-20 hidden h-fit self-start space-y-6 md:block">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
              <Filter className="h-4 w-4" /> Filtros
            </h3>
            {FiltersBody}
          </aside>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{filtered.length} produto(s)</p>
              <Sheet>
                <SheetTrigger asChild>
                  <button className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm md:hidden">
                    <Filter className="h-4 w-4" /> Filtros
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">{FiltersBody}</div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
              {filtered.map((p: any) => {
                const eff = priceFor(
                  Math.max(totalQty + 1, 1),
                  Number(p.retail_price),
                  Number(p.wholesale_price),
                );
                return (
                  <button key={p.id} onClick={() => setSelected(p)} className="group text-left">
                    <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-secondary">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          Sem foto
                        </div>
                      )}
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <p className="text-[10px] font-mono text-muted-foreground">{p.code}</p>
                      <h3 className="line-clamp-2 text-sm font-medium leading-tight sm:text-base">
                        {p.name}
                      </h3>
                      <p className="mt-1 font-display text-base text-primary sm:text-lg">
                        {brl(eff)}
                      </p>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-full py-12 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {selected && <ProductDialog product={selected} onClose={() => setSelected(null)} />}
      <CartDrawer />
    </div>
  );
}

function ProductDialog({ product, onClose }: { product: any; onClose: () => void }) {
  const cart = useCart();
  const totalQty = cart.totalQty();
  const [imgIdx, setImgIdx] = useState(0);
  const [color, setColor] = useState<string>(product.colors?.[0] ?? "");
  const [size, setSize] = useState<string>(product.sizes?.[0] ?? "");
  const [qty, setQty] = useState(1);

  const eff = priceFor(
    totalQty + qty,
    Number(product.retail_price),
    Number(product.wholesale_price),
  );

  function add() {
    cart.add({
      productId: product.id,
      code: product.code,
      name: product.name,
      image: product.images?.[0],
      color,
      size,
      qty,
      retailPrice: Number(product.retail_price),
      wholesalePrice: Number(product.wholesale_price),
    });
    toast.success("Adicionado ao carrinho");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-border bg-background shadow-2xl md:rounded-3xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-background p-2 shadow"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-0 md:grid-cols-2">
          <div className="bg-secondary">
            <div className="aspect-[4/5] overflow-hidden">
              {product.images?.length ? (
                <img
                  src={product.images[imgIdx]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sem foto
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {product.images.map((u: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${imgIdx === i ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5 p-5 sm:p-8">
            <div>
              <p className="text-xs font-mono text-muted-foreground">{product.code}</p>
              <h2 className="font-display text-2xl font-medium leading-tight sm:text-3xl">
                {product.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <span className="font-display text-3xl text-primary sm:text-4xl">{brl(eff)}</span>
              <span className="text-[11px] text-muted-foreground sm:text-xs">
                Varejo: {brl(Number(product.retail_price))} · Atacado (≥{WHOLESALE_THRESHOLD}):{" "}
                {brl(Number(product.wholesale_price))}
              </span>
            </div>

            {product.colors?.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-medium">Cor</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`rounded-full border px-3 py-1.5 text-sm ${color === c ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.sizes?.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-medium">Tamanho</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-10 rounded-full border px-3 py-1.5 text-sm ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">Qtd:</p>
              <div className="inline-flex items-center rounded-full border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="p-2">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              onClick={add}
              className="w-full rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground"
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer() {
  const cart = useCart();
  if (!cart.open) return null;
  const totalQty = cart.totalQty();
  const tier = priceTier(totalQty);
  const items = cart.items.map((i) => ({
    ...i,
    unit: priceFor(totalQty, i.retailPrice, i.wholesalePrice),
  }));
  const subtotal = items.reduce((a, b) => a + b.unit * b.qty, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-sm"
      onClick={() => cart.setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="font-display text-2xl">Seu carrinho</h2>
          <button onClick={() => cart.setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground">Seu carrinho está vazio.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((it, i) => (
                <li key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                  {it.image && <img src={it.image} className="h-20 w-20 rounded-lg object-cover" />}
                  <div className="flex-1 text-sm">
                    <p className="font-medium leading-tight">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[it.color, it.size].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => cart.setQty(i, it.qty - 1)}
                        className="rounded p-1 hover:bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs">{it.qty}</span>
                      <button
                        onClick={() => cart.setQty(i, it.qty + 1)}
                        className="rounded p-1 hover:bg-muted"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="ml-auto font-medium">{brl(it.unit * it.qty)}</span>
                      <button
                        onClick={() => cart.remove(i)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border p-6">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span>Tabela aplicada</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${tier === "atacado" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                {tier}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-display text-2xl text-primary">{brl(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => cart.setOpen(false)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground"
            >
              Finalizar compra <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
