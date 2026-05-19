import atelier from "@/assets/about-atelier.jpg";
import { useBranding } from "@/features/core/services/branding";

export function About() {
  const { branding } = useBranding();
  const img = branding.about_image_url || atelier;
  return (
    <section
      id="sobre"
      className="relative bg-background pt-12 pb-6 sm:pt-28 sm:pb-14 overflow-hidden border-b border-border/40"
    >
      {/* Decorative subtle background blur */}
      <div
        className="absolute -left-40 top-1/4 h-96 w-96 rounded-full opacity-[0.03] blur-[100px]"
        style={{ backgroundColor: branding.primary_color }}
      />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:grid-cols-2 md:items-center md:gap-16 lg:gap-24">
        {/* Coluna da Esquerda: A Moldura Suspensa (Charme e Poder) */}
        <div className="relative mx-auto w-full max-w-md md:max-w-none">
          {/* Brilho decorativo atenuado atrás da moldura */}
          <div
            className="absolute -inset-4 rounded-[2rem] opacity-15 blur-3xl -z-10"
            style={{ backgroundColor: branding.primary_color }}
          />
          {/* Borda tracejada flutuante decorativa */}
          <div
            className="absolute -inset-3 rounded-[2rem] border border-dashed opacity-40 -z-10 scale-95 transition-transform duration-500 group-hover:scale-100"
            style={{ borderColor: branding.primary_color }}
          />

          {/* Container principal da imagem com aspecto perfeito 4:5 */}
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-muted shadow-2xl aspect-[4/5] group">
            <img
              src={img}
              alt="Atelier Com Amor"
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            />
          </div>

          {/* Selo Suspenso de Alta Costura */}
          <div
            className="absolute -right-2 -top-2 rounded-2xl px-5 py-2.5 text-xs font-semibold tracking-wider text-white shadow-xl rotate-3 backdrop-blur-md bg-primary/95"
            style={{ backgroundColor: branding.primary_color }}
          >
            <span className="font-display italic text-[9px] block opacity-85 uppercase tracking-[0.2em] mb-0.5">
              atelier
            </span>
            desde 2017
          </div>
        </div>

        {/* Coluna da Direita: Textos e Manifesto */}
        <div className="flex flex-col justify-center">
          <span
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em]"
            style={{ color: branding.primary_color }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: branding.primary_color }}
            />
            nossa essência
          </span>

          <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-balance md:text-5xl">
            {branding.about_title}
          </h2>

          <div className="mt-6 space-y-5 text-lg leading-relaxed text-muted-foreground whitespace-pre-line font-light">
            {branding.about_text}
          </div>

          {/* Selo/Manifesto de Atelier (O Toque de Charme) */}
          <div
            className="mt-8 border-l-2 pl-4 py-1 italic text-muted-foreground text-sm font-serif"
            style={{ borderLeftColor: branding.primary_color }}
          >
            "Costurando afetos e vestindo histórias únicas com dedicação e elegância."
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
            {[
              "Varejo & atacado",
              "Fardamento empresarial",
              "Tamanhos PP até G7",
              "Atendimento humano",
            ].map((t) => (
              <li
                key={t}
                className="rounded-2xl border border-border bg-card/40 px-4 py-3 text-sm text-foreground backdrop-blur-sm shadow-sm hover:border-primary/20 hover:bg-card/70 transition-all hover:translate-y-[-1px] duration-300"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: branding.primary_color }}
                  />
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
