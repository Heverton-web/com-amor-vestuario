import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/features/core/components/AdminShell";
import { useAuth } from "@/features/core/integrations/auth";
import { ADMIN_PAGES } from "@/features/core/utils/admin-pages";
import {
  listAdminUsers,
  createAdminUser,
  updateAdminAccess,
  deleteAdminUser,
} from "@/features/acessos/services/admin-team.functions";
import { toast } from "sonner";
import { Trash2, Plus, ShieldCheck, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/equipe")({
  head: () => ({ meta: [{ title: "Equipe · Superadmin" }] }),
  component: TeamPage,
});

function TeamPage() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const list = useServerFn(listAdminUsers);
  const create = useServerFn(createAdminUser);
  const update = useServerFn(updateAdminAccess);
  const del = useServerFn(deleteAdminUser);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-team"],
    queryFn: () => list({ data: undefined as never }),
    enabled: isSuperAdmin,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    pages: new Set<string>(ADMIN_PAGES.map((p) => p.key)),
  });

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          pages: Array.from(form.pages),
        },
      }),
    onSuccess: () => {
      toast.success("Administrador criado.");
      setShowCreate(false);
      setForm({
        email: "",
        password: "",
        full_name: "",
        pages: new Set(ADMIN_PAGES.map((p) => p.key)),
      });
      qc.invalidateQueries({ queryKey: ["admin-team"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao criar"),
  });

  return (
    <AdminShell
      title="Equipe e acessos"
      actions={
        isSuperAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Novo administrador
          </button>
        )
      }
    >
      {!isSuperAdmin && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Apenas o superadmin pode gerenciar a equipe.
          </p>
        </div>
      )}

      {isSuperAdmin && (
        <>
          {isLoading && <p className="text-muted-foreground">Carregando...</p>}
          <div className="space-y-3">
            {data?.users?.map((u) => (
              <UserCard
                key={u.user_id}
                u={u}
                onSave={async (pages, password) => {
                  await update({
                    data: {
                      user_id: u.user_id,
                      pages,
                      password: password || null,
                    },
                  });
                  toast.success("Acessos atualizados.");
                  qc.invalidateQueries({ queryKey: ["admin-team"] });
                }}
                onDelete={async () => {
                  if (!confirm(`Remover ${u.email}?`)) return;
                  try {
                    await del({ data: { user_id: u.user_id } });
                    toast.success("Removido.");
                    qc.invalidateQueries({ queryKey: ["admin-team"] });
                  } catch (e: any) {
                    toast.error(e?.message ?? "Erro");
                  }
                }}
              />
            ))}
          </div>
        </>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-xl"
          >
            <h2 className="font-display text-2xl">Novo administrador</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Defina credenciais e marque as páginas que essa pessoa poderá acessar.
            </p>
            <div className="mt-5 space-y-3">
              <Field label="Nome">
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Senha (mín. 6)">
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input"
                />
              </Field>
              <PagesPicker value={form.pages} onChange={(s) => setForm({ ...form, pages: s })} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                disabled={createMut.isPending}
                onClick={() => createMut.mutate()}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {createMut.isPending ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:.75rem;padding:.65rem .9rem;font-size:.875rem;outline:none}`}</style>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function PagesPicker({
  value,
  onChange,
}: {
  value: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Páginas liberadas</p>
      <div className="grid grid-cols-2 gap-2">
        {ADMIN_PAGES.map((p) => {
          const on = value.has(p.key);
          return (
            <label
              key={p.key}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                on ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => {
                  const next = new Set(value);
                  if (on) next.delete(p.key);
                  else next.add(p.key);
                  onChange(next);
                }}
              />
              {p.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function UserCard({
  u,
  onSave,
  onDelete,
}: {
  u: {
    user_id: string;
    email: string;
    full_name: string | null;
    is_superadmin: boolean;
    pages: string[];
  };
  onSave: (pages: string[], password: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [pages, setPages] = useState<Set<string>>(new Set(u.pages));
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{u.full_name || u.email}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
          {u.is_superadmin && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3 w-3" /> Superadmin
            </span>
          )}
        </div>
        {!u.is_superadmin && (
          <button
            onClick={onDelete}
            className="rounded-full border border-destructive/40 p-2 text-destructive hover:bg-destructive/10"
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {!u.is_superadmin && (
        <div className="mt-4 space-y-3">
          <PagesPicker value={pages} onChange={setPages} />
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-[200px]">
              <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <KeyRound className="h-3 w-3" /> Trocar senha (opcional)
              </span>
              <input
                type="text"
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </label>
            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(Array.from(pages), password);
                  setPassword("");
                } finally {
                  setSaving(false);
                }
              }}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
