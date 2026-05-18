import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/features/core/integrations/auth";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { ensureDemoAdmin } from "@/features/acessos/services/demo-admin.functions";
import { ensureSuperAdmin } from "@/features/acessos/services/admin-team.functions";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Idempotently provision the superadmin account on first reach to /login.
  useEffect(() => {
    ensureSuperAdmin().catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, name);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (mode === "signup") {
      toast.success("Conta criada! Verifique seu e-mail.");
    } else {
      toast.success("Bem-vindo!");
      navigate({ to: "/admin" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-10 flex items-baseline gap-2">
          <Heart className="h-5 w-5 fill-primary stroke-primary" />
          <span className="font-display text-2xl font-medium">Com Amor</span>
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">admin</span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-3xl font-medium">
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso ao painel administrativo da Com Amor.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nome</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">E-mail</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Senha</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-60"
            >
              {loading ? "..." : mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const email = "demo@comamor.app";
              const password = "demo1234";
              let res = await signIn(email, password);
              if (res.error) {
                const up = await signUp(email, password, "Demo Cliente");
                if (up.error && !/already/i.test(up.error)) {
                  setLoading(false);
                  toast.error(up.error);
                  return;
                }
                res = await signIn(email, password);
              }
              setLoading(false);
              if (res.error) {
                toast.error(res.error);
                return;
              }
              toast.success("Acesso demo liberado!");
              navigate({ to: "/admin" });
            }}
            className="w-full rounded-full border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-medium text-primary hover:bg-primary/15 disabled:opacity-60"
          >
            🎁 Entrar como demo (cliente)
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const creds = await ensureDemoAdmin();
                let res = await signIn(creds.email, creds.password);
                if (res.error) {
                  // Fallback: tenta cadastrar o usuário administrador caso ele não exista no Auth
                  const up = await signUp(creds.email, creds.password, "Demo Administrador");
                  if (up.error && !/already/i.test(up.error)) {
                    throw new Error(up.error);
                  }
                  res = await signIn(creds.email, creds.password);
                }
                if (res.error) throw new Error(res.error);
                toast.success("Acesso admin demo liberado!");
                navigate({ to: "/admin" });
              } catch (e: any) {
                toast.error(e?.message ?? "Falha ao liberar admin demo");
              } finally {
                setLoading(false);
              }
            }}
            className="mt-3 w-full rounded-full border border-foreground/30 bg-foreground/5 px-5 py-3 text-sm font-medium hover:bg-foreground/10 disabled:opacity-60"
          >
            👑 Entrar como demo (administrador)
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signin" ? "Criar agora" : "Entrar"}
            </button>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Cliente: <strong>demo@comamor.app</strong> / <strong>demo1234</strong>
          <br />
          Admin: <strong>admin@comamor.app</strong> / <strong>admin1234</strong>
        </p>
      </div>
    </div>
  );
}

