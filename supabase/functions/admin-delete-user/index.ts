import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mainAdminEmails = ["portadormato@gmail.com"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "No autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Backend no configurado" }, 500);

    const body = await req.json().catch(() => null);
    const targetUserId = body?.target_user_id;
    if (!targetUserId || !uuidRegex.test(targetUserId)) return json({ error: "Jugador inválido" }, 400);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError) return json({ error: "Sesión inválida" }, 401);
    const caller = userData?.user;
    if (!caller) return json({ error: "No autorizado" }, 401);
    if (targetUserId === caller.id) return json({ error: "No te puedes eliminar a ti mismo" }, 400);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: roles, error: rolesError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    if (rolesError) return json({ error: rolesError.message }, 500);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin") || mainAdminEmails.includes((caller.email || "").toLowerCase());
    if (!isAdmin) return json({ error: "No tienes permisos de admin" }, 403);

    const cleanupSteps = [
      { table: "user_roles", column: "user_id" },
      { table: "clan_join_requests", column: "user_id" },
      { table: "clan_leader_requests", column: "user_id" },
      { table: "clan_members", column: "user_id" },
      { table: "creator_requests", column: "user_id" },
      { table: "reports", column: "reporter_user_id" },
      { table: "scrim_participants", column: "user_id" },
      { table: "tournament_registrations", column: "user_id" },
      { table: "tournament_waiting_list", column: "user_id" },
      { table: "verification_requests", column: "user_id" },
      { table: "profiles", column: "user_id" },
    ];

    for (const step of cleanupSteps) {
      const { error } = await admin.from(step.table).delete().eq(step.column, targetUserId);
      if (error) return json({ error: `No se pudo limpiar ${step.table}: ${error.message}` }, 500);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(targetUserId);
    if (delErr && !delErr.message.toLowerCase().includes("not found")) return json({ error: delErr.message }, 500);

    return json({ ok: true });
  } catch (e: any) {
    console.error("admin-delete-user failed", e);
    return json({ error: e?.message || "Server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}