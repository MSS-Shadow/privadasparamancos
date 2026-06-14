import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const requestSchema = z.object({
  clan_name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(50),
  description: z.string().trim().max(500).optional(),
});

export default function ClanLeaderRequest() {
  const { user, profile, roles, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ clan_name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!user) { setChecking(false); return; }
      try {
        const { data } = await supabase
          .from("clan_leader_requests")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .limit(1);
        setHasPendingRequest((data?.length ?? 0) > 0);
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    };
    checkPendingRequest();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !profile) return toast.error("Debes estar logueado");

    const result = requestSchema.safeParse(form);
    if (!result.success) return toast.error(result.error.errors[0].message);

    setSubmitting(true);
    try {
      const { error } = await supabase.from("clan_leader_requests").insert({
        user_id: user.id,
        nickname: profile.nickname,
        player_id: profile.player_id,
        clan_name: form.clan_name.trim(),
        email: user.email ?? "",
        description: form.description.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("✅ Solicitud enviada. Un administrador la revisará pronto.");
      setHasPendingRequest(true);
      setForm({ clan_name: "", description: "" });
    } catch (error: any) {
      toast.error(error.message || "Error al enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checking) return <div className="text-center py-20">Cargando...</div>;

  if (roles.includes("clan_leader")) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Users className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Ya eres líder de clan</h1>
        <Button onClick={() => navigate("/teams")}>Ir a mis clanes</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Solicitar ser Líder de Squad</h1>
          <p className="text-sm text-muted-foreground">Indica tu Activision ID y el squad que representas. Un admin validará tu solicitud.</p>
        </div>
      </div>

      {hasPendingRequest ? (
        <div className="bg-card border border-accent/30 rounded-2xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-accent mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Solicitud en revisión</h3>
          <p className="text-muted-foreground">Ya tienes una solicitud pendiente. Te notificaremos cuando sea revisada.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Nickname</label>
              <Input value={profile?.nickname ?? ""} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Activision ID</label>
              <Input value={profile?.player_id ?? ""} disabled className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Squad que representas *</label>
            <Input
              value={form.clan_name}
              onChange={(e) => setForm({ ...form, clan_name: e.target.value })}
              placeholder="Ej: Shadow Squad"
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Mensaje al admin (opcional)</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="¿Por qué deberías liderar este squad?"
              rows={3}
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>El admin validará tu Activision ID y squad antes de aprobar tu solicitud. No es necesario subir capturas.</span>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !form.clan_name.trim()}
            className="w-full py-6 text-base"
          >
            {submitting ? "Enviando solicitud..." : "Enviar Solicitud"}
          </Button>
        </div>
      )}
    </div>
  );
}
