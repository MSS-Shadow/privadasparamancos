import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: "Sesión inválida" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerRoles, error: rolesError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    if (rolesError) return json({ error: rolesError.message }, 500);

    const isAdmin = (callerRoles ?? []).some((r: any) => r.role === "admin") || mainAdminEmails.includes((userData.user.email || "").toLowerCase());
    if (!isAdmin) return json({ error: "No tienes permisos de admin" }, 403);

    const [{ data: profiles, error: profilesError }, { data: allRoles, error: allRolesError }] = await Promise.all([
      admin.from("profiles").select("id, user_id, email, nickname, is_clan_leader").order("created_at", { ascending: false }),
      admin.from("user_roles").select("user_id, role"),
    ]);

    if (profilesError) return json({ error: profilesError.message }, 500);
    if (allRolesError) return json({ error: allRolesError.message }, 500);

    const roleMap = new Map<string, string[]>();
    (allRoles ?? []).forEach((r: any) => {
      const current = roleMap.get(r.user_id) ?? [];
      if (r.role) current.push(r.role);
      roleMap.set(r.user_id, current);
    });

    const users = (profiles ?? []).map((profile: any) => ({
      ...profile,
      roles: roleMap.get(profile.user_id) ?? [],
    }));

    return json({ users });
  } catch (e: any) {
    console.error("admin-list-users failed", e);
    return json({ error: e?.message || "Server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}