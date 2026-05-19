import { useState } from "react";
import { Menu, X, Sparkles, ShoppingBag, Phone } from "lucide-react";
import { useBranding } from "@/features/core/services/branding";

const links = [
  { href: "#sobre", label: "Sobre" },
  { href: "#galeria", label: "Galeria" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#horarios", label: "Horários" },
];

export function Header({ onContact }: { onContact: () => void }) {
  const [open, setOpen] = useState(false);
  const { branding } = useBranding();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        <a href="#top" className="flex items-baseline gap-2">
          {branding.logo_url ? (
            <img src={branding.logo_url} alt={branding.brand_name} className="h-7 w-auto sm:h-8" />
          ) : (
            <>
              <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {branding.brand_name}
              </span>
              <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                {branding.brand_suffix}
              </span>
            </>
          )}
        </a>

        {/* Links centrais simplificados (removido Clube e Contato) */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-primary"
              style={{ transitionProperty: "color" }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Atalhos Mobile (Visíveis apenas em mobile) */}
        <div className="flex items-center gap-1.5 md:hidden">
          <a
            href="/recompensas"
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary"
            style={{ color: branding.primary_color }}
            aria-label="Clube"
          >
            <Sparkles className="h-5 w-5" />
          </a>
          <a
            href={branding.cta_shop_url}
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary"
            style={{ color: branding.primary_color }}
            aria-label="Loja"
          >
            <ShoppingBag className="h-5 w-5" />
          </a>
          <button
            onClick={onContact}
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary"
            style={{ color: branding.primary_color }}
            aria-label="Contato"
          >
            <Phone className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 items-center justify-center ml-1"
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {/* Os 3 Botões Premium alinhados no canto direito (Desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Botão 1: Fale conosco (Outline) */}
          <button
            onClick={onContact}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground/90 transition-colors hover:bg-muted cursor-pointer shadow-sm"
          >
            {branding.cta_contact_label}
          </button>

          {/* Botão 2: Compre aqui (Sólido) */}
          <a
            href={branding.cta_shop_url}
            className="inline-flex min-h-10 items-center justify-center rounded-full px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 cursor-pointer"
            style={{ backgroundColor: branding.primary_color }}
          >
            {branding.cta_shop_label}
          </a>

          {/* Botão 3: Clube Com Amor (Pill com Sparkles e texto "Clube") */}
          <a
            href="/recompensas"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary/10 hover:scale-[1.02] cursor-pointer shadow-sm"
            style={{ borderColor: `${branding.primary_color}40`, color: branding.primary_color }}
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse-subtle" />
            <span>Clube</span>
          </a>
        </div>
      </div>

      {/* Menu Mobile */}
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="space-y-4 px-6 py-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block text-base font-medium text-foreground/80"
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <a
                href="/recompensas"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary"
                style={{
                  borderColor: `${branding.primary_color}40`,
                  color: branding.primary_color,
                }}
              >
                <Sparkles className="h-4 w-4" />
                Clube Com Amor
              </a>
              <button
                onClick={() => {
                  setOpen(false);
                  onContact();
                }}
                className="flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/90"
              >
                {branding.cta_contact_label}
              </button>
              <a
                href={branding.cta_shop_url}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center justify-center rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
                style={{ backgroundColor: branding.primary_color }}
              >
                {branding.cta_shop_label}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
