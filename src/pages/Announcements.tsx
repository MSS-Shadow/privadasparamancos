import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setAnnouncements((data as any[]) ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Anuncios</h1>
        <p className="text-muted-foreground">Noticias y actualizaciones de Privadas para Mancos.</p>
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((a) => (
            <article key={a.id} className="bg-card border border-border rounded-lg overflow-hidden">
              {a.image_url && (
                <img src={a.image_url} alt={a.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("es")}</span>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">{a.title}</h2>
                <p className="text-muted-foreground text-sm whitespace-pre-line">{a.description}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">No hay anuncios por el momento.</p>
      )}
    </div>
  );
}
