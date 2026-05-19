// Catalog of admin pages used to drive the menu and per-user permissions.
export interface AdminPageDef {
  key: string;
  label: string;
  path: string;
  category?: string;
}

// Categories order is the order they appear in the sidebar.
export const ADMIN_CATEGORIES: { key: string; label: string }[] = [
  { key: "geral", label: "Geral" },
  { key: "site", label: "Página de vendas" },
  { key: "loja", label: "Loja virtual" },
  { key: "vendas", label: "Vendas" },
  { key: "recompensas", label: "Clube Com Amor" },
  { key: "acompanhamento", label: "Acompanhamento" },
  { key: "analise", label: "Análise" },
  { key: "desenvolvedor", label: "Desenvolvedor" },
];

export const ADMIN_PAGES: AdminPageDef[] = [
  { key: "inicio", label: "Início", path: "/admin", category: "geral" },
  { key: "branding", label: "Branding", path: "/admin/branding", category: "site" },
  { key: "produtos", label: "Produtos", path: "/admin/produtos", category: "loja" },
  { key: "orcamentos", label: "Orçamentos", path: "/admin/orcamentos", category: "vendas" },
  { key: "pedidos", label: "Pedidos", path: "/admin/pedidos", category: "vendas" },
  { key: "faturas", label: "Faturas", path: "/admin/faturas", category: "vendas" },
  { key: "recibos", label: "Recibos", path: "/admin/recibos", category: "vendas" },
  { key: "nfe", label: "Nota Fiscal", path: "/admin/nfe", category: "vendas" },
  {
    key: "recompensas",
    label: "Clube Com Amor",
    path: "/admin/recompensas",
    category: "recompensas",
  },
  { key: "clientes", label: "Clientes", path: "/admin/clientes", category: "acompanhamento" },
  { key: "kanban", label: "CRM (Kanban)", path: "/admin/kanban", category: "acompanhamento" },
  { key: "analises", label: "Análises", path: "/admin/analises", category: "analise" },
  { key: "utm", label: "Gerador UTM", path: "/admin/utm", category: "analise" },
  { key: "dev", label: "Ambiente Dev", path: "/admin/dev", category: "desenvolvedor" },
];

// Page reserved for the superadmin only; not assignable to regular admins.
export const SUPERADMIN_PAGE: AdminPageDef = {
  key: "equipe",
  label: "Equipe",
  path: "/admin/equipe",
  category: "geral",
};

export const ALL_PAGE_KEYS = ADMIN_PAGES.map((p) => p.key);

export function pageKeyForPath(pathname: string): string | null {
  // Match the most specific (longest) path that the current URL starts with.
  const all = [...ADMIN_PAGES, SUPERADMIN_PAGE]
    .slice()
    .sort((a, b) => b.path.length - a.path.length);
  for (const p of all) {
    if (p.path === "/admin") {
      if (pathname === "/admin") return p.key;
    } else if (pathname === p.path || pathname.startsWith(p.path + "/")) {
      return p.key;
    }
  }
  return null;
}
