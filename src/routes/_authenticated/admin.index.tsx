import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/features/core/components/AdminShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { brl } from "@/features/core/utils/format";
import {
  Package, Users, FileText, ShoppingBag, TrendingUp, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dash"],
    queryFn: async () => {
      const [p, c, o, q, l, rev] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("quotes").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total").in("status", ["pago", "enviado", "finalizado"]),
      ]);
      const revenue = (rev.data ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0);
      return {
        produtos: p.count ?? 0,
        clientes: c.count ?? 0,
        pedidos: o.count ?? 0,
        orcamentos: q.count ?? 0,
        leads: l.count ?? 0,
        receita: revenue,
      };
    },
  });

  const cards = [
    { label: "Produtos", value: data?.produtos ?? 0, icon: Package, link: "/admin/produtos" },
    { label: "Clientes", value: data?.clientes ?? 0, icon: Users, link: "/admin/clientes" },
    { label: "Orçamentos", value: data?.orcamentos ?? 0, icon: FileText, link: "/admin/orcamentos" },
    { label: "Pedidos", value: data?.pedidos ?? 0, icon: ShoppingBag, link: "/admin/pedidos" },
  ];

  return (
    <AdminShell title="Visão geral">
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.link as never}
            className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/30"
          >
            <c.icon className="h-5 w-5 text-primary" />
            <div className="mt-4 font-display text-3xl font-medium">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground">
          <TrendingUp className="h-5 w-5" />
          <div className="mt-3 text-sm opacity-80">Receita realizada</div>
          <div className="font-display text-4xl font-medium">{brl(data?.receita ?? 0)}</div>
          <Link to="/admin/analises" className="mt-4 inline-flex items-center gap-1 text-sm opacity-90 hover:opacity-100">
            Ver análises <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-sm text-muted-foreground">Leads recebidos</div>
          <div className="font-display text-4xl font-medium">{data?.leads ?? 0}</div>
          <Link to="/admin/kanban" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
            Ir para o CRM <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}

