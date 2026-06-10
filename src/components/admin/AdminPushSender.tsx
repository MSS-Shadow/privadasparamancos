import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bell, Send } from "lucide-react";
import { toast } from "sonner";

export default function AdminPushSender() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Completá título y mensaje");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push", {
        body: { title: title.trim(), body: body.trim(), url: url.trim() || "/" },
      });
      if (error) throw error;
      toast.success(`Enviadas ${data?.sent ?? 0} de ${data?.total ?? 0} notificaciones`);
      setTitle("");
      setBody("");
    } catch (e: any) {
      toast.error(e.message || "Error enviando notificaciones");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Enviar notificación push</h2>
          <p className="text-sm text-muted-foreground">
            Se envía a todos los usuarios suscriptos.
          </p>
        </div>
      </div>

      <div>
        <Label>Título</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nueva privada disponible"
          maxLength={120}
          className="mt-1"
        />
      </div>
      <div>
        <Label>Mensaje</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Sumate al lobby que arranca en 10 minutos"
          maxLength={400}
          className="mt-1"
        />
      </div>
      <div>
        <Label>URL destino</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/scrims"
          maxLength={500}
          className="mt-1"
        />
      </div>

      <Button onClick={handleSend} disabled={sending} className="w-full">
        <Send className="h-4 w-4 mr-2" />
        {sending ? "Enviando..." : "Enviar a todos"}
      </Button>
    </div>
  );
}