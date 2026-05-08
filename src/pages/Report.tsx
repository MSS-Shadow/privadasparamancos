import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const CATEGORIES = ["Cheating", "Toxic Behavior", "Smurf Account", "Multi Account", "Rule Violation"];

export default function ReportPage() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ reported_player: "", category: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Debes iniciar sesión para enviar un reporte.</p>
        <Link to="/auth" className="text-primary hover:underline">Iniciar Sesión</Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!form.reported_player || !form.category || !form.description) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      let screenshotUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `reports/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("uploads").upload(path, file);
        if (uploadErr) { toast.error("Error subiendo archivo"); return; }
        const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
        screenshotUrl = publicUrl;
      }

      const { error } = await supabase.from("reports").insert({
        reporter_user_id: user.id,
        reporter_nickname: profile.nickname,
        reported_player: form.reported_player,
        category: form.category,
        description: form.description,
        screenshot_url: screenshotUrl,
      });

      if (error) { toast.error(error.message); return; }
      toast.success("Reporte enviado correctamente");
      setForm({ reported_player: "", category: "", description: "" });
      setFile(null);
    } catch (e: any) {
      toast.error(e?.message || "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportar Jugador</h1>
          <p className="text-sm text-muted-foreground">Envía un reporte sobre un jugador que incumple las reglas.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Jugador Reportado *</label>
          <Input value={form.reported_player} onChange={(e) => setForm({ ...form, reported_player: e.target.value })} placeholder="Nickname del jugador" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Categoría *</label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Descripción *</label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe lo sucedido..." rows={4} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Captura de Pantalla (opcional)</label>
          <Input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG o PDF. Máx 5MB.</p>
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? "Enviando..." : "Enviar Reporte"}
        </Button>
      </div>
    </div>
  );
}
