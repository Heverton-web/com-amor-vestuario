import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Users, FileText, ShoppingBag,
  Kanban, BarChart3, Link2, Receipt, LogOut, Heart, Palette,
  ShieldCheck, Menu, FileSpreadsheet, ReceiptText, Gift, Terminal,
} from "lucide-react";
import { useAuth } from "@/features/core/integrations/auth";
import { ADMIN_PAGES, ADMIN_CATEGORIES, SUPERADMIN_PAGE, pageKeyForPath } from "@/features/core/utils/admin-pages";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/features/core/components/sheet";

const ICONS: Record<string, typeof LayoutDashboard> = {
  inicio: LayoutDashboard,
  branding: Palette,
  produtos: Package,
  clientes: Users,
  orcamentos: FileText,
  pedidos: ShoppingBag,
  kanban: Kanban,
  analises: BarChart3,
  utm: Link2,
  faturas: FileSpreadsheet,
  recibos: ReceiptText,
  nfe: Receipt,
  recompensas: Gift,
  equipe: ShieldCheck,
  dev: Terminal,
};

export function AdminShell({ title, children, actions }: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { signOut, user, canAccess, isSuperAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visiblePages = ADMIN_PAGES.filter((p) => canAccess(p.key));
  if (isSuperAdmin) visiblePages.push(SUPERADMIN_PAGE);

  const currentKey = pageKeyForPath(loc.pathname);
  const allowed = currentKey ? canAccess(currentKey) : true;

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-4 overflow-y-auto p-3">
      {ADMIN_CATEGORIES.map((cat) => {
        const items = visiblePages.filter((p) => (p.category ?? "geral") === cat.key);
        if (!items.length) return null;
        return (
          <div key={cat.key} className="space-y-1">
            <div className="px-3 pb-1 pt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
              {cat.label}
            </div>
            {items.map((n) => {
              const active = n.path === "/admin"
                ? loc.pathname === n.path
                : loc.pathname === n.path || loc.pathname.startsWith(n.path + "/");
              const Icon = ICONS[n.key] ?? LayoutDashboard;
              return (
                <Link
                  key={n.key}
                  to={n.path as never}
                  onClick={onNavigate}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  const Brand = (
    <Link to="/" className="flex items-baseline gap-2 px-6 py-5 border-b border-border">
      <Heart className="h-4 w-4 fill-primary stroke-primary" />
      <span className="font-display text-xl">Com Amor</span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {isSuperAdmin ? "super" : "admin"}
      </span>
    </Link>
  );

  const Footer = (
    <div className="border-t border-border p-3">
      <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
      <button
        onClick={async () => { await signOut(); navigate({ to: "/" }); }}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/70 hover:bg-muted"
      >
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-background md:flex md:flex-col">
        {Brand}
        <NavList />
        {Footer}
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md md:px-10 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    aria-label="Abrir menu"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-72 flex-col p-0">
                  {Brand}
                  <NavList onNavigate={() => setMobileOpen(false)} />
                  {Footer}
                </SheetContent>
              </Sheet>
              <h1 className="font-display text-xl font-medium md:text-2xl">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          </div>
        </header>
        <div className="p-4 md:p-10">
          {allowed ? children : (
            <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center md:p-10">
              <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 font-display text-2xl">Página restrita</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sua conta não tem permissão para acessar esta página. Solicite ao
                superadmin para liberar o acesso.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

