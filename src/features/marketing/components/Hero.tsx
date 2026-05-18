import heroImg from "@/assets/hero-clothing.jpg";
import { ArrowRight, Heart } from "lucide-react";
import { useBranding } from "@/features/core/services/branding";

export function Hero({ onContact }: { onContact: () => void }) {
  const { branding } = useBranding();
  const img = branding.hero_image_url || heroImg;
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-6 sm:px-6 md:grid-cols-[1.05fr_1fr] md:gap-16 md:pb-28 md:pt-20">
        <div className="order-2 flex flex-col justify-center md:order-1">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs md:mb-6">
            <Heart className="h-3 w-3 fill-primary stroke-primary" />
            {branding.tagline}
          </span>
          <h1 className="font-display font-medium leading-[1.05] tracking-tight text-balance text-foreground text-[clamp(2rem,8vw,3.25rem)] md:text-7xl">
            {branding.hero_title}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:mt-6 md:text-lg">
            {branding.hero_subtitle}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:mt-10">
            <a
              href={branding.cta_shop_url}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
            >
              {branding.cta_shop_label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <button
              onClick={onContact}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/20 px-6 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
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
                <dt className="font-display text-2xl font-medium text-primary md:text-3xl">{s.k}</dt>
                <dd className="mt-1 text-xs text-muted-foreground md:text-sm">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative order-1 md:order-2">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-accent/40 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-2xl shadow-primary/10">
            <img
              src={img}
              alt="Imagem hero"
              width={1600}
              height={1280}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

