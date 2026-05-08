import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function VerifyAccountPage() {
  const { user, profile } = useAuth();
  const [profileScreenshot, setProfileScreenshot] = useState<File | null>(null);
  const [idScreenshot, setIdScreenshot] = useState<File | null>(null);
  const [additionalDoc, setAdditionalDoc] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Debes iniciar sesión para verificar tu cuenta.</p>
        <Link to="/auth" className="text-primary hover:underline">Iniciar Sesión</Link>
      </div>
    );
  }

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!profileScreenshot || !idScreenshot) {
      toast.error("Las capturas de perfil y Player ID son obligatorias");
      return;
    }
    setSubmitting(true);
    try {
      const [profileUrl, idUrl, additionalUrl] = await Promise.all([
        uploadFile(profileScreenshot, "verification"),
        uploadFile(idScreenshot, "verification"),
        additionalDoc ? uploadFile(additionalDoc, "verification") : Promise.resolve(null),
      ]);

      if (!profileUrl || !idUrl) { toast.error("Error subiendo archivos"); return; }

      const { error } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        nickname: profile.nickname,
        player_id: profile.player_id,
        email: profile.email,
        profile_screenshot_url: profileUrl,
        id_screenshot_url: idUrl,
        additional_doc_url: additionalUrl,
      });

      if (error) {
        if (error.code === "23505") toast.error("Ya tienes una solicitud de verificación pendiente");
        else toast.error(error.message);
        return;
      }
      toast.success("Solicitud de verificación enviada");
    } catch (e: any) {
      toast.error(e?.message || "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-accent/10">
          <ShieldCheck className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verificar Cuenta</h1>
          <p className="text-sm text-muted-foreground">Sube capturas para obtener la insignia de Cuenta Verificada (KD revisado).</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground">Nickname</p>
            <p className="font-medium text-foreground">{profile.nickname}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground">Player ID</p>
            <p className="font-medium text-foreground">{profile.player_id}</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Captura de tu perfil de Warzone (con stats y KD) *</label>
          <Input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setProfileScreenshot(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Captura mostrando tu Player ID *</label>
          <Input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setIdScreenshot(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Documento Adicional (opcional)</label>
          <Input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setAdditionalDoc(e.target.files?.[0] || null)} />
        </div>
        <p className="text-xs text-muted-foreground">Formatos aceptados: PNG, JPG, JPEG, PDF. Máx 5MB por archivo.</p>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? "Enviando..." : "Enviar Verificación"}
        </Button>
      </div>
    </div>
  );
}
