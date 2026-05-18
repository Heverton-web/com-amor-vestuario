import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Mail, LockKeyhole, Sparkles } from "lucide-react";
import { supabase } from "@/features/core/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/recompensas/login")({
  component: RewardsLoginPage,
});

function RewardsLoginPage() {
  const nav = useNavigate();
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/recompensas" className="flex items-baseline gap-2">
            <Heart className="h-4 w-4 fill-primary stroke-primary" />
            <span className="font-display text-lg">Recompensas</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Loja de Recompensas
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
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Aguarde..." : mode === "senha" ? "Entrar" : "Enviar link de acesso"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Ainda não recebeu credenciais? Faça seu primeiro pedido na <Link to="/loja" className="underline">loja</Link> ou com um consultor.
          </p>
        </div>
      </main>
    </div>
  );
}

