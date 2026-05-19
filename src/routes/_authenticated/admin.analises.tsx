import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/features/core/integrations/supabase/client";
import { AdminShell } from "@/features/core/components/AdminShell";
import { brl } from "@/features/core/utils/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/analises")({
  component: AnalyticsPage,
});

const PERIODS = [
  { key: "day", label: "Hoje", days: 1 },
  { key: "week", label: "7 dias", days: 7 },
  { key: "fortnight", label: "Quinzena", days: 15 },
  { key: "month", label: "Mês", days: 30 },
  { key: "quarter", label: "Trimestre", days: 90 },
  { key: "semester", label: "Semestre", days: 180 },
  { key: "year", label: "Ano", days: 365 },
];

const COLORS = ["oklch(0.55 0.16 38)", "oklch(0.65 0.08 145)", "oklch(0.78 0.07 20)"];

function AnalyticsPage() {
  const [period, setPeriod] = useState(PERIODS[3]);

  const since = new Date(Date.now() - period.days * 86400000).toISOString();

  const { data } = useQuery({
    queryKey: ["analytics", period.key],
    queryFn: async () => {
      const [{ data: orders }, { data: items }, { data: customers }] = await Promise.all([
        supabase.from("orders").select("*, customers(name, category)").gte("created_at", since),
        supabase
          .from("order_items")
          .select("product_name, quantity, total, orders!inner(created_at)")
          .gte("orders.created_at", since),
        supabase.from("customers").select("id, name, category"),
      ]);

      const completed = (orders ?? []).filter((o: any) =>
        ["pago", "enviado", "finalizado"].includes(o.status),
      );
      const revenue = completed.reduce((s: number, o: any) => s + Number(o.total), 0);
      const cost = completed.reduce((s: number, o: any) => s + Number(o.subtotal) * 0.4, 0); // estimativa
      const profit = revenue - cost;

      const productMap = new Map<string, { name: string; qty: number; total: number }>();
      (items ?? []).forEach((it: any) => {
        const cur = productMap.get(it.product_name) ?? { name: it.product_name, qty: 0, total: 0 };
        cur.qty += it.quantity;
        cur.total += Number(it.total);
        productMap.set(it.product_name, cur);
      });
      const topProducts = [...productMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

      const byCategory: Record<string, number> = { varejo: 0, atacado: 0, fardamento: 0 };
      completed.forEach((o: any) => {
        const cat = o.customers?.category ?? "varejo";
        byCategory[cat] = (byCategory[cat] || 0) + Number(o.total);
      });

      // série temporal
      const series: Record<string, number> = {};
      completed.forEach((o: any) => {
        const d = new Date(o.created_at).toLocaleDateString("pt-BR");
        series[d] = (series[d] || 0) + Number(o.total);
      });
      const timeline = Object.entries(series)
        .map(([date, total]) => ({ date, total }))
        .slice(-30);

      return {
        revenue,
        cost,
        profit,
        topProducts,
        byCategory,
        timeline,
        ordersCount: completed.length,
      };
    },
  });

  return (
    <AdminShell title="Análises">
      <div className="mb-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p)}
            className={`rounded-full border px-4 py-2 text-sm ${period.key === p.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card label="Receita" value={brl(data?.revenue ?? 0)} hl />
        <Card label="Custos (est. 40%)" value={brl(data?.cost ?? 0)} />
        <Card label="Lucro estimado" value={brl(data?.profit ?? 0)} />
        <Card label="Pedidos finalizados" value={data?.ordersCount ?? 0} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
          <h3 className="font-display text-lg">Vendas no período</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={data?.timeline ?? []}>
                <XAxis dataKey="date" stroke="oklch(0.55 0.04 50)" fontSize={11} />
                <YAxis stroke="oklch(0.55 0.04 50)" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v: any) => brl(Number(v))} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="oklch(0.55 0.16 38)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg">Por categoria</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={Object.entries(data?.byCategory ?? {}).map(([k, v]) => ({
                    name: k,
                    value: v,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                >
                  {Object.keys(data?.byCategory ?? {}).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => brl(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {Object.entries(data?.byCategory ?? {}).map(([k, v], i) => (
              <li key={k} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                  {k}
                </span>
                <span className="font-medium">{brl(v as number)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg">Top produtos</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer>
            <BarChart data={data?.topProducts ?? []}>
              <XAxis dataKey="name" stroke="oklch(0.55 0.04 50)" fontSize={11} />
              <YAxis stroke="oklch(0.55 0.04 50)" fontSize={11} />
              <Tooltip formatter={(v: any, n) => (n === "total" ? brl(Number(v)) : v)} />
              <Bar dataKey="qty" fill="oklch(0.55 0.16 38)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminShell>
  );
}

function Card({ label, value, hl = false }: { label: string; value: any; hl?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${hl ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card"}`}
    >
      <div className={`text-sm ${hl ? "opacity-80" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-1 font-display text-3xl font-medium">{value}</div>
    </div>
  );
}
