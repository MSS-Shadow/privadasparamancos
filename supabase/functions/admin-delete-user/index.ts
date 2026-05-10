import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "No tienes permisos de admin" }, 403);

    const cleanup = [
      admin.from("user_roles").delete().eq("user_id", targetUserId),
      admin.from("clan_join_requests").delete().eq("user_id", targetUserId),
      admin.from("clan_leader_requests").delete().eq("user_id", targetUserId),
      admin.from("clan_members").delete().eq("user_id", targetUserId),
      admin.from("creator_requests").delete().eq("user_id", targetUserId),
      admin.from("reports").delete().eq("reporter_user_id", targetUserId),
      admin.from("scrim_participants").delete().eq("user_id", targetUserId),
      admin.from("tournament_registrations").delete().eq("user_id", targetUserId),
      admin.from("tournament_waiting_list").delete().eq("user_id", targetUserId),
      admin.from("verification_requests").delete().eq("user_id", targetUserId),
      admin.from("profiles").delete().eq("user_id", targetUserId),
    ];
    const cleanupResults = await Promise.all(cleanup);
    const cleanupError = cleanupResults.find((result: any) => result.error)?.error;
    if (cleanupError) return json({ error: cleanupError.message }, 500);

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