import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function CreatorRequest() {
  const { user, profile, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ platform: "YouTube", channel_link: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user]);

  useEffect(() => {
    if (user) {
      supabase.from("creator_requests").select("id").eq("user_id", user.id).then(({ data }) => {
        setHasRequest((data?.length ?? 0) > 0);
      });
    }
  }, [user]);

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;

  if (roles.includes("content_creator")) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Ya eres Creador de Contenido</h1>
        <p className="text-muted-foreground">Puedes crear scrims desde la página de Scrims.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!user || !profile) return;
    if (!form.channel_link.trim()) { toast.error("El link del canal es obligatorio"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("creator_requests").insert({
        user_id: user.id,
        nickname: profile.nickname,
        email: profile.email,
        platform: form.platform,
        channel_link: form.channel_link.trim(),
      });
      if (error) { toast.error(error.message); return; }
      toast.success("¡Solicitud enviada!");
      setHasRequest(true);
    } catch (e: any) {
      toast.error(e?.message || "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitar Creador de Contenido</h1>
          <p className="text-sm text-muted-foreground">Solicita acceso para organizar scrims.</p>
        </div>
      </div>

      {hasRequest ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-primary font-medium">Solicitud enviada — pendiente de revisión.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Nickname</label>
            <Input value={profile?.nickname ?? ""} disabled />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Email</label>
            <Input value={profile?.email ?? ""} disabled />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Plataforma de Streaming</label>
            <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Twitch">Twitch</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Kick">Kick</SelectItem>
                <SelectItem value="Facebook Gaming">Facebook Gaming</SelectItem>
                <SelectItem value="Other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Link del Canal</label>
            <Input value={form.channel_link} onChange={(e) => setForm({ ...form, channel_link: e.target.value })} placeholder="https://youtube.com/@tucabal" />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </div>
      )}
    </div>
  );
}
