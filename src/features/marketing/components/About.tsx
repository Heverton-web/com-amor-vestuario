import atelier from "@/assets/about-atelier.jpg";
import { useBranding } from "@/features/core/services/branding";

export function About() {
  const { branding } = useBranding();
  const img = branding.about_image_url || atelier;
  return (
    <section id="sobre" className="bg-secondary/40 py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-center md:gap-16">
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-border">
            <img
              src={img}
              alt="Atelier"
              width={1200}
              height={1400}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -right-4 -top-4 rounded-2xl bg-primary px-5 py-3 text-primary-foreground shadow-lg">
            <p className="font-display text-sm italic">desde 2017</p>
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-primary">sobre nós</span>
          <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-balance md:text-5xl">
            {branding.about_title}
          </h2>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
            {branding.about_text}
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-4">
            {["Varejo & atacado", "Fardamento empresarial", "Tamanhos PP até G7", "Atendimento humano"].map((t) => (
              <li key={t} className="rounded-2xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

