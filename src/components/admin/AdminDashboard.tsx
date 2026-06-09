import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 12000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("La carga tardó demasiado")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    players: 0,
    clans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [profilesRes, clansRes] = await Promise.all([
          withTimeout(supabase.from("profiles").select("*", { count: "exact", head: true })),
          withTimeout(supabase.from("clans").select("*", { count: "exact", head: true })),
        ]);

        setStats({
          players: profilesRes.count || 0,
          clans: clansRes.count || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-zinc-400">Cargando estadísticas...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Panel de Administrador</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Jugadores Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-yellow-400">{stats.players}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clanes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{stats.clans}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Torneos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scrims Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
