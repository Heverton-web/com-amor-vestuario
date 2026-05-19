import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/features/marketing/components/Header";
import { Hero } from "@/features/marketing/components/Hero";
import { About } from "@/features/marketing/components/About";
import { Gallery } from "@/features/marketing/components/Gallery";
import { Testimonials } from "@/features/marketing/components/Testimonials";
import { Hours } from "@/features/marketing/components/Hours";
import { Footer } from "@/features/marketing/components/Footer";
import { ContactDialog } from "@/features/marketing/components/ContactDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Com Amor Vestuário — Roupas feitas à mão, com afeto" },
      {
        name: "description",
        content:
          "Vestuário autoral, atacado e fardamento corporativo costurados com cuidado. Tamanhos PP até G7, atendimento humano e entrega para todo o Brasil.",
      },
      { property: "og:title", content: "Com Amor Vestuário" },
      {
        property: "og:description",
        content: "Roupa que veste história, não só o corpo. Varejo, atacado e fardamento.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [contactOpen, setContactOpen] = useState(false);
  const openContact = () => setContactOpen(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onContact={openContact} />
      <main id="contato">
        <Hero onContact={openContact} />
        <About />
        <Gallery />
        <Testimonials />
        <Hours onContact={openContact} />
      </main>
      <Footer />
      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
