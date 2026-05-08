import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Creator {
  nickname: string;
  platform: string;
  channel_link: string;
}

export default function CreatorsPage() {
  const { user, profile, roles } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({ platform: "YouTube", channel_link: "" });
  const [submitting, setSubmitting] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      // Get approved creators from creator_requests
      const { data } = await supabase.from("creator_requests").select("nickname, platform, channel_link").eq("status", "Approved");
      setCreators(data ?? []);

      // Check if current user already has a pending request
      if (user) {
        const { data: existing } = await supabase.from("creator_requests").select("id").eq("user_id", user.id);
        setHasRequest((existing?.length ?? 0) > 0);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const submitRequest = async () => {
    if (!user || !profile) { toast.error("Debes iniciar sesión"); return; }
    if (!form.channel_link.trim()) { toast.error("El link del canal es obligatorio"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("creator_requests").insert({
      user_id: user.id,
      nickname: profile.nickname,
      email: profile.email,
      platform: form.platform,
      channel_link: form.channel_link.trim(),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("¡Solicitud enviada! Un administrador la revisará pronto.");
    setShowRequest(false);
    setHasRequest(true);
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Creadores de Contenido</h1>
        <p className="text-muted-foreground">Creadores de contenido de la comunidad Warzone LATAM.</p>
      </div>

      {creators.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {creators.map((c) => (
            <div key={c.nickname} className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-semibold text-foreground mb-1">{c.nickname}</h3>
              <p className="text-sm text-muted-foreground mb-3">{c.platform}</p>
              <a href={c.channel_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Visitar Canal
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">Aún no hay creadores aprobados.</p>
      )}

      {/* Request Creator Access */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Conviértete en Creador</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Solicita acceso como creador de contenido para organizar scrims y aparecer en esta página.
        </p>
        {roles.includes("content_creator") ? (
          <p className="text-sm text-accent font-medium">✓ Ya eres creador de contenido</p>
        ) : hasRequest ? (
          <p className="text-sm text-primary font-medium">Solicitud enviada — pendiente de revisión</p>
        ) : (
          <Button onClick={() => setShowRequest(true)}>Solicitar Acceso</Button>
        )}
      </div>

      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Acceso de Creador</DialogTitle>
            <DialogDescription>Completa los datos de tu canal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Plataforma</label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Twitch">Twitch</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Facebook Gaming">Facebook Gaming</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Link del Canal</label>
              <Input value={form.channel_link} onChange={(e) => setForm({ ...form, channel_link: e.target.value })} placeholder="https://youtube.com/@tucabal" />
            </div>
          </div>
          <Button onClick={submitRequest} disabled={submitting} className="w-full mt-2">
            {submitting ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
