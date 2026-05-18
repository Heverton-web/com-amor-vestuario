import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/features/core/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/features/core/integrations/supabase/client.server";

function genPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/**
 * Garante uma conta de portal para o cliente. Se o cliente ainda não tem
 * `user_id`, cria usuário no Supabase Auth com email_confirm=true e senha
 * temporária. Registra um envio mock em `portal_invitations`.
 */
export const ensurePortalAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      customerId: z.string().uuid(),
      channel: z.enum(["email", "whatsapp", "both"]).default("both"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Autorização: somente staff
    const { data: isStaff } = await supabaseAdmin.rpc("is_staff" as never, {
      _user_id: context.userId,
    } as never);
    if (!isStaff) throw new Response("Forbidden", { status: 403 });

    const { data: customer, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id, name, email, phone, user_id, portal_invited_at")
      .eq("id", data.customerId)
      .maybeSingle();
    if (cErr || !customer) throw new Error("Cliente não encontrado");
    if (!customer.email) throw new Error("Cliente sem e-mail cadastrado");

    const loginUrl = `${process.env.SUPABASE_URL?.replace(".supabase.co", ".lovable.app") ?? ""}/recompensas/login`;
    const tempPassword = genPassword();

    let userId = customer.user_id as string | null;
    let created = false;

    if (!userId) {
      // Tenta criar; se já existir, busca o existente
      const { data: createRes, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: customer.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: customer.name },
        });
      if (createErr) {
        // Email já existente: localizar por listUsers
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({
          page: 1, perPage: 200,
        });
        const existing = list?.users.find((u) => u.email === customer.email);
        if (!existing) throw new Error(createErr.message);
        userId = existing.id;
      } else {
        userId = createRes.user?.id ?? null;
        created = true;
      }
      if (userId) {
        await supabaseAdmin
          .from("customers")
          .update({ user_id: userId, portal_invited_at: new Date().toISOString() })
          .eq("id", customer.id);
      }
    } else {
      // Já existe — apenas reseta a senha (admin)
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: tempPassword,
      });
      await supabaseAdmin
        .from("customers")
        .update({ portal_invited_at: new Date().toISOString() })
        .eq("id", customer.id);
    }

    // Log mock — futuras integrações (SMTP, n8n+Evolution) lerão daqui
    await supabaseAdmin.from("portal_invitations" as never).insert({
      customer_id: customer.id,
      email: customer.email,
      whatsapp: customer.phone,
      temp_password: tempPassword,
      login_url: loginUrl,
      channel: data.channel,
      status: "mock",
      payload: {
        email_body: `Olá ${customer.name}, sua conta no Clube Com Amor está pronta!\nE-mail: ${customer.email}\nSenha temporária: ${tempPassword}\nAcesse: ${loginUrl}`,
        whatsapp_text: `Olá ${customer.name}! 🎁 Seu Clube Com Amor:\n${loginUrl}\nLogin: ${customer.email}\nSenha: ${tempPassword}`,
        created,
      },
    } as never);

    return {
      ok: true,
      created,
      email: customer.email,
      whatsapp: customer.phone,
      tempPassword,
      loginUrl,
    };
  });

