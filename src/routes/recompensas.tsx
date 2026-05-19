import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, LogIn, User as UserIcon, LogOut, Sparkles, ShoppingBag } from "lucide-react";
import { useAuth } from "@/features/core/integrations/auth";
import { useBranding } from "@/features/core/services/branding";
import { BrandLogo } from "@/features/core/components/BrandLogo";
import { fetchMyCustomer } from "@/features/fidelidade/services/rewards";

export const Route = createFileRoute("/recompensas")({
  component: RecompensasPage,
});

function RecompensasPage() {
  const { user, signOut } = useAuth();
  const { branding } = useBranding();
  const location = useLocation();

  const isIndexPage = location.pathname === "/recompensas" || location.pathname === "/recompensas/";

  const { data: customer } = useQuery({
    queryKey: ["my-customer", user?.id],
    queryFn: () => (user ? fetchMyCustomer(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/recompensas" className="shrink-0">
            <BrandLogo environment="clube" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/loja"
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-secondary cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Loja</span>
            </Link>
            {user && customer ? (
              <>
                {location.pathname !== "/recompensas/minha-conta" ? (
                  <Link
                    to="/recompensas/minha-conta"
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-secondary cursor-pointer"
                  >
                    <UserIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Minha conta</span>
                  </Link>
                ) : (
                  <Link
                    to="/recompensas"
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-secondary cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Clube</span>
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await signOut();
                    window.location.href = "/recompensas";
                  }}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-secondary cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <Link
                to="/recompensas/login"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 shadow-sm cursor-pointer"
                style={{ backgroundColor: branding.primary_color }}
              >
                <LogIn className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
