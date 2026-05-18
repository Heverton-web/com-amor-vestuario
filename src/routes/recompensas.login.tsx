import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Mail, LockKeyhole, Sparkles } from "lucide-react";
import { supabase } from "@/features/core/integrations/supabase/client";
import { useBranding } from "@/features/core/services/branding";
import { toast } from "sonner";

export const Route = createFileRoute("/recompensas/login")({
  component: RewardsLoginPage,
});

function RewardsLoginPage() {
  const nav = useNavigate();
  const { branding } = useBranding();
  const [mode, setMode] = useState<"senha" | "magic">("senha");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "senha") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vinda!");
        nav({ to: "/recompensas/minha-conta" });
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/recompensas/minha-conta` },
        });
        if (error) throw error;
        toast.success("Link de acesso enviado para seu e-mail");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3" /> {branding.rewards_label === "Loja de Recompensas" ? "Clube Com Amor" : branding.rewards_label}
          </div>
          <h1 className="mt-2 font-display text-3xl">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use o e-mail enviado com suas credenciais.
          </p>

          <div className="mt-4 flex gap-2 rounded-full bg-secondary p-1 text-xs">
            <button
              onClick={() => setMode("senha")}
              className={`flex-1 min-h-9 rounded-full px-3 ${mode === "senha" ? "bg-background shadow-sm" : ""}`}
            >Senha</button>
            <button
              onClick={() => setMode("magic")}
              className={`flex-1 min-h-9 rounded-full px-3 ${mode === "magic" ? "bg-background shadow-sm" : ""}`}
            >Link mágico</button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">E-mail</span>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="min-h-11 flex-1 bg-transparent text-sm focus:outline-none"
                  placeholder="voce@email.com"
                />
              </div>
            </label>
            {mode === "senha" && (
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Senha</span>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
                  <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="min-h-11 flex-1 bg-transparent text-sm focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </label>
            )}
            <button
              type="submit" disabled={busy}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: branding.primary_color }}
            >
              {busy ? "Aguarde..." : mode === "senha" ? "Entrar" : "Enviar link de acesso"}
            </button>
          </form>

          {/* Caixa de Acesso Rápido (Demo/Mock) com preenchimento automático */}
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary" style={{ color: branding.primary_color }}>
              ✦ ACESSO RÁPIDO DE TESTE ✦
            </span>
            <p className="mt-1 text-xs text-muted-foreground leading-normal">
              Clique no botão abaixo para preencher os dados de teste e logar instantaneamente:
            </p>
            <button
              onClick={() => {
                setMode("senha");
                setEmail("demo@comamor.app");
                setPassword("demo1234");
                toast.success("Credenciais preenchidas!");
              }}
              className="mt-3 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 cursor-pointer transition-all active:scale-[0.98] w-full"
              style={{ backgroundColor: branding.primary_color }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Preencher dados do Cliente Demo
            </button>
            <div className="mt-2 text-[10px] text-muted-foreground flex flex-col sm:flex-row justify-center sm:gap-3 leading-normal border-t border-primary/10 pt-2">
              <span>E-mail: <strong className="text-foreground select-all">demo@comamor.app</strong></span>
              <span className="hidden sm:inline">·</span>
              <span>Senha: <strong className="text-foreground select-all">demo1234</strong></span>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Ainda não recebeu credenciais? Faça seu primeiro pedido na <Link to="/loja" className="underline">loja</Link> ou com um consultor.
          </p>
        </div>
      </main>
    );
  }

