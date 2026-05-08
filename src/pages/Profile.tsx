import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Save, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
  nickname: z.string().trim().min(2).max(50),
  player_id: z.string().trim().min(2).max(50),
  platform: z.enum(["PC", "Mobile"]),
  country: z.string().trim().min(2).max(50),
  // clan ya no se actualiza desde aquí
});

export default function ProfilePage() {
  const { user, profile, roles, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nickname: "",
    player_id: "",
    platform: "Mobile" as "PC" | "Mobile",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user]);

  useEffect(() => {
    if (profile) {
      setForm({
        nickname: profile.nickname || "",
        player_id: profile.player_id || "",
        platform: (profile.platform as "PC" | "Mobile") || "Mobile",
        country: profile.country || "",
      });
    }
  }, [profile]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: result.data.nickname,
        player_id: result.data.player_id,
        platform: result.data.platform,
        country: result.data.country,
        // No actualizamos "clan" desde el perfil
      })
      .eq("user_id", user!.id);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    await refreshProfile();
    toast.success("Perfil actualizado correctamente");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
    toast.success("Perfil actualizado");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Sin perfil encontrado.</div>;

  const hasClan = !!profile.clan;
  const isPendingClan = !hasClan && profile.clan === null; // pendiente de aprobación

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
            <div className="flex gap-2 mt-1">
              {roles.map((r) => (
                <Badge key={r} variant="outline" className="text-xs capitalize">
                  {r}
                </Badge>
              ))}
              {profile.verified && (
                <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        {/* Email (solo lectura) */}
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <Input value={profile.email || ""} disabled className="mt-1" />
        </div>

        {/* Nickname */}
        <div>
          <label className="text-sm text-muted-foreground">Nickname</label>
          <Input
            value={form.nickname}
            onChange={(e) => set("nickname", e.target.value)}
            maxLength={50}
            className="mt-1"
          />
        </div>

        {/* Player ID */}
        <div>
          <label className="text-sm text-muted-foreground">Activision ID</label>
          <Input
            value={form.player_id}
            onChange={(e) => set("player_id", e.target.value)}
            maxLength={50}
            className="mt-1"
          />
        </div>

        {/* Platform */}
        <div>
          <label className="text-sm text-muted-foreground">Plataforma</label>
          <Select value={form.platform} onValueChange={(v) => set("platform", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mobile">Mobile</SelectItem>
              <SelectItem value="PC">PC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* País */}
        <div>
          <label className="text-sm text-muted-foreground">País</label>
          <Input
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            maxLength={50}
            className="mt-1"
          />
        </div>

        {/* CLAN - Solo lectura */}
        <div>
          <label className="text-sm text-muted-foreground">Clan</label>
          <div className="mt-1">
            {hasClan ? (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="font-medium text-foreground">{profile.clan}</span>
                <Badge variant="secondary" className="ml-auto">Activo</Badge>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-border text-center">
                <p className="text-muted-foreground">
                  {isPendingClan 
                    ? "⏳ Tu solicitud para unirte a un clan está pendiente de aprobación." 
                    : "Aún no perteneces a ningún clan."}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Regístrate o solicita unirte a uno desde la página de registro.
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            El clan solo puede ser modificado por el líder del clan.
          </p>
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          Registrado: {new Date(profile.created_at).toLocaleDateString("es")}
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="h-4 w-4 mr-2" /> 
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="flex-1">
            <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
