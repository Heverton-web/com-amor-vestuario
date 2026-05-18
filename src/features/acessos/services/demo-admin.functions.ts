import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/features/core/integrations/supabase/client.server";
import { ALL_PAGE_KEYS } from "@/features/core/utils/admin-pages";

const DEMO_ADMIN_EMAIL = "admin@comamor.app";
const DEMO_ADMIN_PASSWORD = "admin1234";

export const ensureDemoAdmin = createServerFn({ method: "POST" }).handler(
  async () => {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    let user = list?.users.find((u) => u.email === DEMO_ADMIN_EMAIL);

    if (!user) {
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: DEMO_ADMIN_EMAIL,
          password: DEMO_ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: "Demo Administrador" },
        });
      if (createErr) throw new Error(createErr.message);
      user = created.user!;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: DEMO_ADMIN_PASSWORD,
        email_confirm: true,
      });
    }

    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: user.id, role: "admin" },
        { onConflict: "user_id,role" },
      );

    // Ensure the demo admin can see every regular admin page.
    await supabaseAdmin.from("admin_page_access").upsert(
      ALL_PAGE_KEYS.map((page_key) => ({ user_id: user!.id, page_key })),
      { onConflict: "user_id,page_key" },
    );

    return {
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
    };
  },
);

