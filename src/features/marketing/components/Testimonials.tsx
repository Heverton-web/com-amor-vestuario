import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { useBranding } from "@/features/core/services/branding";

export function Testimonials() {
  const { branding } = useBranding();

  const items = branding.testimonials?.length
    ? branding.testimonials
    : [
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

  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleCount = width < 640 ? 1 : width < 1024 ? 2 : 3;
  const maxIndex = Math.max(0, items.length - visibleCount);

  // Auto-slide effect
  useEffect(() => {
    if (isHovered || maxIndex === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500); // 4.5 segundos de leitura
    return () => clearInterval(interval);
  }, [maxIndex, isHovered]);

  // Reset index if visibleCount changes to avoid out of bounds translation
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  return (
    <section id="depoimentos" className="bg-primary text-primary-foreground overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.25em] opacity-70">depoimentos</span>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">
            A gente costura. <em className="italic opacity-80">Elas contam.</em>
          </h2>
        </div>

        {/* Carousel Container */}
        <div
          className="mt-14 relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-1000 ease-in-out -mx-2 sm:-mx-3"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
            >
              {items.map((t, i) => (
                <div key={i} className="w-full sm:w-1/2 lg:w-1/3 shrink-0 px-2 sm:px-3">
                  <figure className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-7 backdrop-blur min-h-[220px] flex flex-col justify-between">
                    <div>
                      <Quote className="h-6 w-6 opacity-60 text-primary-foreground" />
                      <blockquote className="mt-5 font-display text-lg leading-snug italic text-balance text-primary-foreground">
                        “{t.quote}”
                      </blockquote>
                    </div>
                    <figcaption className="mt-6 border-t border-primary-foreground/15 pt-4 text-sm text-primary-foreground">
                      <span className="block font-medium">{t.name}</span>
                      <span className="opacity-70">{t.role}</span>
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {maxIndex > 0 && (
            <div className="flex justify-center gap-1.5 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentIndex === idx
                      ? "w-5 bg-primary-foreground"
                      : "w-1.5 bg-primary-foreground/30 hover:bg-primary-foreground/55"
                  }`}
                  aria-label={`Ir para depoimento ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
