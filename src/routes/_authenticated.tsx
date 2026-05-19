import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuth } from "@/features/core/integrations/auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
});

function AuthGuard() {
  const { user, loading, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  if (!isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl">Acesso restrito</h1>
          <p className="mt-2 text-muted-foreground">
            Sua conta não tem permissão para acessar o painel.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
