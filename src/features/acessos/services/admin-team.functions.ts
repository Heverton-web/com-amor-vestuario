import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/features/core/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/features/core/integrations/supabase/auth-middleware";
import { ALL_PAGE_KEYS } from "@/features/core/utils/admin-pages";

const SUPERADMIN_EMAIL = "hevertoneduardoperes@gmail.com";
const SUPERADMIN_PASSWORD = "@#Khen741963@#";
const DEMO_ADMIN_EMAIL = "admin@comamor.app";

async function assertSuperadmin(userId: string) {
  // Bypass de segurança para o e-mail/ID do desenvolvedor
  if (userId === "00000000-0000-0000-0000-000000000000") {
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
    return;
  }

  const { data } = await supabaseAdmin
    .from("superadmins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) throw new Error("Acesso negado: requer superadmin.");
}

// Idempotent: ensure the superadmin user exists with the correct password.
export const ensureSuperAdmin = createServerFn({ method: "POST" }).handler(async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY missing. Skipping superadmin provisioning.");
    return { email: SUPERADMIN_EMAIL };
  }

  const { data: list } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  let user = list?.users.find((u) => u.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase());

  if (!user) {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Heverton (Superadmin)" },
    });
    if (error) throw new Error(error.message);
    user = created.user!;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
    });
  }

  await supabaseAdmin.from("superadmins").upsert({ user_id: user.id }, { onConflict: "user_id" });

  // Also give the admin role so existing is_staff()-based RLS works.
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

  // Ensure superadmin sees every page (and the catalog evolves cleanly).
  const rows = ALL_PAGE_KEYS.map((page_key) => ({
    user_id: user!.id,
    page_key,
  }));
  await supabaseAdmin.from("admin_page_access").upsert(rows, { onConflict: "user_id,page_key" });

  return { email: SUPERADMIN_EMAIL };
});

interface AdminUserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  is_superadmin: boolean;
  pages: string[];
  created_at: string;
}

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperadmin(context.userId);

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "consultor"]);
    const { data: supers } = await supabaseAdmin.from("superadmins").select("user_id");
    const { data: access } = await supabaseAdmin
      .from("admin_page_access")
      .select("user_id, page_key");

    const ids = new Set<string>();
    roles?.forEach((r) => ids.add(r.user_id));
    supers?.forEach((s) => ids.add(s.user_id));

    const result: AdminUserRow[] = [];
    const superSet = new Set(supers?.map((s) => s.user_id) ?? []);
    const pagesByUser = new Map<string, string[]>();
    access?.forEach((a) => {
      const arr = pagesByUser.get(a.user_id) ?? [];
      arr.push(a.page_key);
      pagesByUser.set(a.user_id, arr);
    });

    for (const id of ids) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id);
      if (!data?.user) continue;
      result.push({
        user_id: id,
        email: data.user.email ?? "",
        full_name: (data.user.user_metadata?.full_name as string | undefined) ?? null,
        is_superadmin: superSet.has(id),
        pages: pagesByUser.get(id) ?? [],
        created_at: data.user.created_at,
      });
    }

    return { users: result.sort((a, b) => a.email.localeCompare(b.email)) };
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { email: string; password: string; full_name: string; pages: string[] }) => input,
  )
  .handler(async ({ context, data }) => {
    await assertSuperadmin(context.userId);

    if (!data.email || !data.password || data.password.length < 6) {
      throw new Error("E-mail e senha (mín. 6 caracteres) são obrigatórios.");
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const user = created.user!;

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

    if (data.pages.length > 0) {
      await supabaseAdmin.from("admin_page_access").upsert(
        data.pages.map((page_key) => ({ user_id: user.id, page_key })),
        { onConflict: "user_id,page_key" },
      );
    }

    return { user_id: user.id };
  });

export const updateAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; pages: string[]; password?: string | null }) => input)
  .handler(async ({ context, data }) => {
    await assertSuperadmin(context.userId);

    if (data.password && data.password.length >= 6) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
        password: data.password,
      });
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.from("admin_page_access").delete().eq("user_id", data.user_id);

    if (data.pages.length > 0) {
      await supabaseAdmin.from("admin_page_access").insert(
        data.pages.map((page_key) => ({
          user_id: data.user_id,
          page_key,
        })),
      );
    }

    return { ok: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string }) => input)
  .handler(async ({ context, data }) => {
    await assertSuperadmin(context.userId);

    // Don't allow deleting another superadmin via this endpoint.
    const { data: isSuper } = await supabaseAdmin
      .from("superadmins")
      .select("user_id")
      .eq("user_id", data.user_id)
      .maybeSingle();
    if (isSuper) throw new Error("Não é possível remover um superadmin.");

    // Don't delete the demo admin account (it gets re-created automatically).
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (u?.user?.email?.toLowerCase() === DEMO_ADMIN_EMAIL.toLowerCase()) {
      throw new Error("A conta demo de administrador não pode ser removida.");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
