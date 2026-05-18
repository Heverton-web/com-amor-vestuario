import c1 from "@/assets/client-1.jpg";
import c2 from "@/assets/client-2.jpg";
import c3 from "@/assets/client-3.jpg";
import c4 from "@/assets/client-4.jpg";

const items = [
  { src: c1, caption: "Mariana · Blusa Linho", span: "md:row-span-2" },
  { src: c2, caption: "Equipe Solaris · Fardamento", span: "" },
  { src: c3, caption: "Carla · Vestido Sage", span: "" },
  { src: c4, caption: "Pedro · Camisa Argila", span: "md:row-span-2" },
];

export function Gallery() {
  return (
    <section id="galeria" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-primary">
              galeria
            </span>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">
              Quem veste a gente.
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Clientes reais usando peças reais. Sem retoque, sem cenário — só
            gente que ficou bonita de verdade.
          </p>
        </div>

        <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:gap-4 md:grid-cols-4 md:gap-6">
          {items.map((i, idx) => (
            <figure
              key={idx}
              className={`group relative overflow-hidden rounded-3xl border border-border ${i.span}`}
            >
              <img
                src={i.src}
                alt={i.caption}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 text-sm text-cream opacity-0 transition-opacity group-hover:opacity-100">
                {i.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
