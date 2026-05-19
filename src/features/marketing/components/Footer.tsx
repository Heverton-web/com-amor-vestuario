import { Instagram, Facebook, MessageCircle, Mail } from "lucide-react";
import { useBranding } from "@/features/core/services/branding";

export function Footer() {
  const { branding } = useBranding();
  const socials = [
    { icon: Instagram, label: "Instagram", href: branding.instagram_url },
    { icon: Facebook, label: "Facebook", href: branding.facebook_url },
    { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/${branding.whatsapp}` },
    { icon: Mail, label: "E-mail", href: `mailto:${branding.email}` },
  ];
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr] md:gap-12">
          <div>
            <div className="flex items-baseline gap-2">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.brand_name} className="h-9 w-auto" />
              ) : (
                <>
                  <span className="font-display text-3xl font-medium">{branding.brand_name}</span>
                  <span className="text-xs uppercase tracking-[0.25em] opacity-70">
                    {branding.brand_suffix}
                  </span>
                </>
              )}
            </div>
            <p className="mt-5 max-w-sm text-cream/70">
              Roupas autorais, fardamento corporativo e atendimento humano.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg">Navegue</h4>
            <ul className="mt-4 space-y-2 text-cream/70">
              <li>
                <a href="#sobre" className="hover:text-cream">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#galeria" className="hover:text-cream">
                  Galeria
                </a>
              </li>
              <li>
                <a href="#depoimentos" className="hover:text-cream">
                  Depoimentos
                </a>
              </li>
              <li>
                <a href={branding.cta_footer_shop_url} className="hover:text-cream">
                  {branding.cta_footer_shop_label}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg">Redes sociais</h4>
            <div className="mt-4 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:bg-cream hover:text-ink"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <p className="mt-6 text-sm text-cream/60">{branding.instagram_handle}</p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-cream/10 pt-6 text-sm text-cream/60 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {branding.brand_name} {branding.brand_suffix}. Todos os
            direitos reservados.
          </p>
          <p>Feito com cuidado — peça por peça.</p>
        </div>
      </div>
    </footer>
  );
}
