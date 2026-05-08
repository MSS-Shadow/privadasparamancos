import { useState, useEffect } from "react";
import { Star, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function HallOfFamePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <div className="text-center py-20 text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Star className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salón de la Fama</h1>
          <p className="text-muted-foreground">Campeones históricos de los eventos de Privadas para Mancos.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <p className="text-center text-muted-foreground py-12">Aún no hay campeones registrados. Los campeones aparecerán aquí cuando se completen los primeros torneos.</p>
      </div>
    </div>
  );
}
