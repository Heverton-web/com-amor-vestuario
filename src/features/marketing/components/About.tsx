import atelier from "@/assets/about-atelier.jpg";
import { useBranding } from "@/features/core/services/branding";

export function About() {
  const { branding } = useBranding();
  const img = branding.about_image_url || atelier;
  return (
    <section id="sobre" className="relative min-h-[600px] sm:min-h-[700px] flex items-center overflow-hidden bg-background text-foreground border-b border-border/40 py-12 md:py-0">
      
      {/* Container da Imagem (Lado Esquerdo Inteiro no Desktop, Fullscreen no Mobile) */}
      <div className="absolute left-0 top-0 bottom-0 w-full md:w-1/2 z-0">
        <img
          src={img}
          alt="Atelier"
          className="h-full w-full object-cover object-top animate-fade-in"
        />
        {/* Degradê sutil no lado direito da imagem para se fundir ao fundo no Desktop (com largura maior) */}
        <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-background via-background/40 to-transparent z-10 hidden md:block" />
        {/* Degradê sutil de baixo para cima no Mobile (com altura maior) */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/40 to-transparent z-10 md:hidden" />
        
        {/* Selo "Desde 2017" flutuando na imagem */}
        <div className="absolute left-4 top-4 z-20 rounded-2xl bg-primary px-4 py-2 text-primary-foreground shadow-lg backdrop-blur-sm bg-primary/95" style={{ backgroundColor: branding.primary_color }}>
          <p className="font-display text-xs italic">desde 2017</p>
        </div>
      </div>

      {/* Conteúdo Central */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2">
          {/* Spacer para ocupar o lado esquerdo (onde a imagem absoluta está no desktop) */}
          <div className="hidden md:block" />

          {/* Coluna da Direita (Texto) */}
          <div className="flex flex-col justify-center pl-0 md:pl-16 mt-[320px] md:mt-0">
            <span className="text-xs uppercase tracking-[0.25em] text-primary" style={{ color: branding.primary_color }}>
              sobre nós
            </span>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-balance md:text-5xl">
              {branding.about_title}
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
              {branding.about_text}
            </div>

            <ul className="mt-10 grid grid-cols-2 gap-4">
              {["Varejo & atacado", "Fardamento empresarial", "Tamanhos PP até G7", "Atendimento humano"].map((t) => (
                <li key={t} className="rounded-2xl border border-border bg-card/65 px-4 py-3 text-sm text-foreground backdrop-blur-sm shadow-sm hover:border-primary/30 transition-colors">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

