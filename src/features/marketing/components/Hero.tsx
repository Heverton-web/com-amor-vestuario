import heroImg from "@/assets/hero-clothing.jpg";
import { ArrowRight, Heart } from "lucide-react";
import { useBranding } from "@/features/core/services/branding";

export function Hero({ onContact }: { onContact: () => void }) {
  const { branding } = useBranding();
  const img = branding.hero_image_url || heroImg;
  return (
    <section id="top" className="relative min-h-[600px] sm:min-h-[700px] flex items-center overflow-hidden bg-background text-foreground py-12 md:py-16">
      {/* Cenário de Fundo Atmosférico (Sutil e desfocado) */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        <img
          src={img}
          alt=""
          className="h-full w-full object-cover opacity-5 blur-2xl scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
      </div>

      {/* Conteúdo Central */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 items-center md:grid-cols-[1.1fr_1fr] md:gap-16">
          {/* Coluna de Texto */}
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/85 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:text-xs md:mb-6 backdrop-blur-sm shadow-sm">
              <Heart className="h-3.5 w-3.5 fill-primary stroke-primary text-primary" style={{ fill: branding.primary_color, stroke: branding.primary_color }} />
              {branding.tagline}
            </span>
            
            <h1 className="font-display font-medium leading-[1.08] tracking-tight text-foreground text-[clamp(2.25rem,8vw,3.75rem)] md:text-7xl">
              {branding.hero_title}
            </h1>
            
            <p className="mt-4 max-w-xl text-muted-foreground text-base leading-relaxed md:mt-6 md:text-lg">
              {branding.hero_subtitle}
            </p>
            
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:mt-10">
              <a
                href={branding.cta_shop_url}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
                style={{ backgroundColor: branding.primary_color }}
              >
                {branding.cta_shop_label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <button
                onClick={onContact}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-6 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                {branding.cta_contact_label}
              </button>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-border/60 pt-6 sm:gap-6 md:mt-14 md:pt-8">
              {[
                { k: "+8", v: "anos costurando" },
                { k: "+2k", v: "clientes felizes" },
                { k: "PP–G7", v: "tamanhos reais" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-2xl font-semibold text-primary md:text-3xl" style={{ color: branding.primary_color }}>{s.k}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground md:text-sm">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Coluna de Imagem com visualização 100% livre de cortes */}
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Brilho decorativo atenuado atrás da imagem principal */}
            <div 
              className="absolute -inset-4 rounded-3xl opacity-10 blur-3xl -z-10" 
              style={{ backgroundColor: branding.primary_color }}
            />
            
            <div className="relative overflow-hidden rounded-3xl border border-border bg-muted/10 shadow-2xl p-2 md:p-3">
              <img
                src={img}
                alt="Com Amor Atelier"
                className="w-full h-auto max-h-[400px] sm:max-h-[480px] md:max-h-[580px] object-contain rounded-2xl animate-fade-in"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

