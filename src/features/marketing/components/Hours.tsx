import { Clock, MapPin, Phone } from "lucide-react";
import { useBranding } from "@/features/core/services/branding";

export function Hours({ onContact }: { onContact: () => void }) {
  const { branding } = useBranding();
  const hours = [
    { day: "Segunda a Sexta", time: branding.hours_weekday },
    { day: "Sábado", time: branding.hours_saturday },
    { day: "Domingo & Feriados", time: branding.hours_sunday },
  ];
  return (
    <section id="horarios" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 sm:p-8 md:grid-cols-3 md:gap-10 md:p-14">
          <div className="md:col-span-1">
            <span className="text-xs uppercase tracking-[0.25em] text-primary">atendimento</span>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight">
              Nossa porta está aberta.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Venha tomar um café, conhecer os tecidos e provar à vontade.
            </p>
            <button
              onClick={onContact}
              className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95 transition-all"
            >
              {branding.cta_contact_label}
            </button>
          </div>

          <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-10">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
                <Clock className="h-4 w-4" /> Horários
              </div>
              <ul className="divide-y divide-border">
                {hours.map((h) => (
                  <li key={h.day} className="flex items-center justify-between py-3">
                    <span className="text-foreground">{h.day}</span>
                    <span className="font-medium text-muted-foreground">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 md:mt-0">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
                <MapPin className="h-4 w-4" /> Endereço
              </div>
              <p className="text-foreground">
                {branding.address_line1}
                <br />
                {branding.address_line2}
              </p>

              <div className="mb-4 mt-8 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
                <Phone className="h-4 w-4" /> Contato direto
              </div>
              <a
                href={`https://wa.me/${branding.whatsapp}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                WhatsApp · {branding.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
