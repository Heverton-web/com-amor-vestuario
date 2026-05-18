import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, LogIn, User as UserIcon } from "lucide-react";
import { useAuth } from "@/features/core/integrations/auth";
import { useBranding } from "@/features/core/services/branding";
import { fetchMyCustomer } from "@/features/fidelidade/services/rewards";

export const Route = createFileRoute("/recompensas")({
  component: RecompensasPage,
});

function RecompensasPage() {
  const { user } = useAuth();
  const { branding } = useBranding();

  const { data: customer } = useQuery({
    queryKey: ["my-customer", user?.id],
    queryFn: () => (user ? fetchMyCustomer(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/recompensas" className="flex items-baseline gap-2">
            <Heart className="h-4 w-4 fill-primary stroke-primary" />
            <span className="font-display text-lg md:text-xl">{branding.brand_name}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">recompensas</span>
          </Link>
          {user && customer ? (
            <Link
              to="/recompensas/minha-conta"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm hover:bg-secondary"
            >
              <UserIcon className="h-4 w-4" /> Minha conta
            </Link>
          ) : (
            <Link
              to="/recompensas/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm text-primary-foreground"
            >
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}


