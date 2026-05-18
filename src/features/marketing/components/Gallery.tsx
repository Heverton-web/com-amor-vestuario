import { useEffect, useState } from "react";
import c1 from "@/assets/client-1.jpg";
import c2 from "@/assets/client-2.jpg";
import c3 from "@/assets/client-3.jpg";
import c4 from "@/assets/client-4.jpg";

import { useBranding } from "@/features/core/services/branding";

export function Gallery() {
  const { branding } = useBranding();

  const defaultImages = [c1, c2, c3, c4];
  const items = branding.gallery_items?.length
    ? branding.gallery_items.map((item, idx) => ({
        src: item.src || defaultImages[idx % defaultImages.length],
        caption: item.caption,
        span: item.span || "",
      }))
    : [
        { src: c1, caption: "Mariana · Blusa Linho", span: "" },
        { src: c2, caption: "Equipe Solaris · Fardamento", span: "" },
        { src: c3, caption: "Carla · Vestido Sage", span: "" },
        { src: c4, caption: "Pedro · Camisa Argila", span: "" },
      ];

  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleCount = width < 640 ? 1 : width < 1024 ? 2 : 4;
  const maxIndex = Math.max(0, items.length - visibleCount);

  // Auto-slide effect
  useEffect(() => {
    if (isHovered || maxIndex === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [maxIndex, isHovered]);

  // Reset index if visibleCount changes to avoid out of bounds translation
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  return (
    <section id="galeria" className="pt-6 pb-12 sm:pt-14 sm:pb-24 overflow-hidden bg-background">
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

        {/* Carousel Container */}
        <div 
          className="mt-10 relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="overflow-hidden rounded-3xl">
            <div 
              className="flex transition-transform duration-1000 ease-in-out -mx-2 sm:-mx-3"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
            >
              {items.map((i, idx) => (
                <div 
                  key={idx} 
                  className="w-full sm:w-1/2 lg:w-1/4 shrink-0 px-2 sm:px-3"
                >
                  <figure
                    className="group/item relative overflow-hidden rounded-3xl border border-border aspect-[4/5] bg-muted/20"
                  >
                    <img
                      src={i.src}
                      alt={i.caption}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover/item:scale-105"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-5 text-sm text-cream opacity-0 transition-opacity duration-300 group-hover/item:opacity-100 flex flex-col justify-end min-h-[80px]">
                      <span className="font-medium tracking-wide">{i.caption}</span>
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {maxIndex > 0 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    currentIndex === idx ? "w-6 bg-primary" : "w-2 bg-primary/20 hover:bg-primary/40"
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
