import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useBranding } from "@/features/core/services/branding";

const links = [
  { href: "#sobre", label: "Sobre" },
  { href: "#galeria", label: "Galeria" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#horarios", label: "Horários" },
  { href: "#contato", label: "Contato" },
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

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-foreground/70 transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={onContact}
            className="text-sm font-medium text-foreground/80 hover:text-primary"
          >
            {branding.cta_contact_label}
          </button>
          <a
            href={branding.cta_shop_url}
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90"
          >
            {branding.cta_shop_label}
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="inline-flex h-11 w-11 items-center justify-center md:hidden"
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="space-y-4 px-6 py-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block text-base text-foreground/80"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setOpen(false); onContact(); }}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm"
              >
                {branding.cta_contact_label}
              </button>
              <a href={branding.cta_shop_url} className="flex-1 rounded-full bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
                {branding.cta_shop_label}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

