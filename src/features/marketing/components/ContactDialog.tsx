import { useState } from "react";
import { X, Send, Check } from "lucide-react";
import { supabase } from "@/features/core/integrations/supabase/client";
import { toast } from "sonner";

const reasons = [
  { id: "orcamento", label: "Orçamento" },
  { id: "fardamento", label: "Fardamento" },
  { id: "clube", label: "Clube Com Amor" },
  { id: "produto", label: "Dúvida sobre produto" },
  { id: "preco", label: "Dúvida sobre preço" },
  { id: "pagamento", label: "Forma de pagamento" },
  { id: "entrega", label: "Entrega" },
];

export function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [reason, setReason] = useState("orcamento");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const dbReason =
      reason === "produto" || reason === "preco" || reason === "pagamento" || reason === "entrega"
        ? reason
        : reason; // already matches
    const { error } = await supabase.from("leads").insert({
      name,
      whatsapp,
      reason: dbReason as never,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar. Tente novamente.");
      return;
    }
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
      setName("");
      setWhatsapp("");
      setReason("orcamento");
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl md:max-h-[88vh] md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="shrink-0 bg-accent/40 px-5 py-5 sm:px-8 sm:py-7">
          <span className="text-[10px] uppercase tracking-[0.25em] text-primary sm:text-xs">
            fale conosco
          </span>
          <h3 className="mt-1.5 font-display text-xl font-medium leading-tight sm:text-2xl md:text-3xl">
            A gente adora um bom papo.
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Deixe seus dados — a gente retorna pelo WhatsApp.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sent ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center sm:py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-7 w-7" />
              </div>
              <p className="font-display text-2xl">Recebido!</p>
              <p className="text-muted-foreground">Em breve falamos com você.</p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="space-y-4 px-5 pb-6 pt-5 sm:space-y-5 sm:px-8 sm:pb-8 sm:pt-6"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nome</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none ring-primary/40 focus:ring-2"
                  placeholder="Como podemos te chamar?"
                  style={{ fontSize: 16 }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">WhatsApp</label>
                <input
                  required
                  inputMode="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none ring-primary/40 focus:ring-2"
                  placeholder="(00) 0 0000-0000"
                  style={{ fontSize: 16 }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Motivo do contato</label>
                <div className="grid grid-cols-2 gap-2">
                  {reasons.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setReason(r.id)}
                      className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        reason === r.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar mensagem"} <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
