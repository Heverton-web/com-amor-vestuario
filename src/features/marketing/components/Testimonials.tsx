import { Quote } from "lucide-react";

const items = [
  {
    quote:
      "O acabamento é de outro mundo. Sinto o cuidado em cada costura — comprei uma peça, voltei para mais três.",
    name: "Beatriz Lima",
    role: "Cliente varejo",
  },
  {
    quote:
      "Fizemos o fardamento da nossa equipe inteira. Pontualidade impecável e qualidade que valoriza nossa marca.",
    name: "Ricardo Sales",
    role: "Solaris Tecnologia",
  },
  {
    quote:
      "Atendimento humano de verdade. Me ajudaram a escolher tamanho pelo WhatsApp e a peça caiu perfeita.",
    name: "Luana Pires",
    role: "Cliente varejo",
  },
];

export function Testimonials() {
  return (
    <section id="depoimentos" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.25em] opacity-70">
            depoimentos
          </span>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">
            A gente costura. <em className="italic opacity-80">Elas contam.</em>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <figure
              key={i}
              className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-7 backdrop-blur"
            >
              <Quote className="h-6 w-6 opacity-60" />
              <blockquote className="mt-5 font-display text-xl leading-snug italic text-balance">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 border-t border-primary-foreground/15 pt-4 text-sm">
                <span className="block font-medium">{t.name}</span>
                <span className="opacity-70">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
