import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, MessageCircle, ArrowLeft, ShieldCheck, Ticket, Gift, ArrowRight } from "lucide-react";
import { useBranding } from "@/features/core/services/branding";
import { supabase } from "@/features/core/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/features/core/components/dialog";

export const Route = createFileRoute("/recompensas/como-funciona")({
  component: ComoFuncionaPage,
});

function ComoFuncionaPage() {
  const { branding } = useBranding();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName || !joinPhone) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    setJoinLoading(true);
    try {
      const { error } = await supabase.from("kanban_cards").insert({
        board: "clube",
        stage: "novo",
        title: `Interesse Clube: ${joinName}`,
        contact_name: joinName,
        contact_whatsapp: joinPhone,
        description: `${joinName} clicou em "Quero Fazer Parte" na página explicativa do Clube Com Amor.`
      });
      if (error) throw error;

      toast.success("Dados salvos no CRM! Direcionando para o WhatsApp...");
      const text = encodeURIComponent(`Olá! Vi a página explicativa do Clube Com Amor e quero fazer parte para começar a acumular pontos.`);
      const cleanPhone = branding.whatsapp ? branding.whatsapp.replace(/\D/g, "") : "5599999999999";
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
      
      setShowJoinDialog(false);
      setJoinName("");
      setJoinPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Direcionando ao WhatsApp...");
      const text = encodeURIComponent(`Olá! Quero fazer parte do Clube Com Amor.`);
      const cleanPhone = branding.whatsapp ? branding.whatsapp.replace(/\D/g, "") : "5599999999999";
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
    } finally {
      setJoinLoading(false);
    }
  };

  const steps = [
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "1. Cadastro Simples",
      description: "Ao realizar sua primeira compra física ou online no atelier, seu cadastro no Clube Com Amor é criado automaticamente com seu WhatsApp.",
    },
    {
      icon: <Ticket className="h-6 w-6" />,
      title: "2. Acumule R$ 1 = 1 Ponto",
      description: "Toda compra gera pontos imediatamente. Não importa a coleção, cada real gasto é revertido em pontos para você usar quando preferir.",
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: "3. Resgate Prêmios Reais",
      description: "Troque seus pontos acumulados por descontos em novos pedidos, frete grátis ou peças físicas exclusivas fabricadas no nosso atelier.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12 animate-fade-in">
      {/* Botão Voltar */}
      <Link
        to="/recompensas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o Clube
      </Link>

      {/* Título de Entrada */}
      <div className="text-center md:text-left mb-10 md:mb-12">
        <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/85 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:text-xs backdrop-blur-sm shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" style={{ color: branding.primary_color }} />
          O segredo da fidelidade premium
        </span>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-5xl">
          Como funciona o Clube Com Amor?
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground leading-relaxed">
          Pensado exclusivamente para quem valoriza a alta costura e o caimento perfeito, o Clube Com Amor é a nossa forma de agradecer e presentear quem apoia nossa jornada de moda afetiva.
        </p>
      </div>

      {/* Grid de Passos */}
      <div className="grid gap-6 md:grid-cols-3 mb-12">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="group relative rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]"
          >
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4 transition-colors"
              style={{ backgroundColor: `${branding.primary_color}10`, color: branding.primary_color }}
            >
              {s.icon}
            </div>
            <h3 className="font-display text-lg font-medium text-foreground mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>

      {/* Caixa de Manifesto e Vantagens */}
      <div className="rounded-3xl border border-border/80 bg-accent/20 p-6 md:p-8 mb-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <Sparkles className="h-48 w-48 text-primary" style={{ color: branding.primary_color }} />
        </div>
        <h3 className="font-display text-xl font-medium mb-4">Vantagens Exclusivas do Clube</h3>
        <ul className="space-y-3.5 text-sm md:text-base">
          <li className="flex items-start gap-2.5">
            <span className="text-primary mt-1" style={{ color: branding.primary_color }}>✦</span>
            <span><strong>Acesso Antecipado</strong>: Descubra novas coleções e tecidos importados antes de todo mundo.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-primary mt-1" style={{ color: branding.primary_color }}>✦</span>
            <span><strong>Ajustes sem Custo</strong>: Clientes fidelidade ativos contam com pequenos ajustes de alta costura inclusos nas peças.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-primary mt-1" style={{ color: branding.primary_color }}>✦</span>
            <span><strong>Pontos Sem Expiração Rápida</strong>: Seus pontos duram até 12 meses inteiros para você resgatar com calma.</span>
          </li>
        </ul>
      </div>

      {/* Ações Finais */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border/60 pt-8">
        <div>
          <h4 className="font-display text-lg font-medium">Ficou com alguma dúvida?</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Fale diretamente com nossa consultoria humana de estilo.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/recompensas"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium hover:bg-secondary transition-all cursor-pointer"
          >
            Ver Recompensas
          </Link>
          <button
            onClick={() => setShowJoinDialog(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 cursor-pointer shadow-md animate-pulse-subtle"
            style={{ backgroundColor: branding.primary_color }}
          >
            <Sparkles className="h-4 w-4" /> Quero Fazer Parte
          </button>
        </div>
      </div>

      {/* Modal de Interesse "Quero Fazer Parte" */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" style={{ color: branding.primary_color }} />
              Fazer Parte do Clube Com Amor
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para registrar seu interesse. Salvando seus dados, você será direcionado ao nosso WhatsApp oficial para iniciar seu acúmulo de pontos!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinSubmit} className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nome Completo</label>
              <input
                required
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-base outline-none ring-primary/40 focus:ring-2"
                placeholder="Seu nome completo"
                style={{ fontSize: 16 }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">WhatsApp</label>
              <input
                required
                inputMode="tel"
                value={joinPhone}
                onChange={(e) => setJoinPhone(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-base outline-none ring-primary/40 focus:ring-2"
                placeholder="(00) 00000-0000"
                style={{ fontSize: 16 }}
              />
            </div>
            <DialogFooter className="pt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowJoinDialog(false)}
                className="min-h-11 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={joinLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: branding.primary_color }}
              >
                <MessageCircle className="h-4 w-4" />
                {joinLoading ? "Direcionando..." : "Quero Fazer Parte"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
