import { useState, useEffect } from "react";
import { CheckCircle, XCircle, RefreshCw, Image, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 12000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("La operación tardó demasiado. Se canceló para evitar cargando infinito.")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

interface Request {
  id: string;
  user_id: string;
  nickname: string;
  player_id: string;
  clan_name: string;
  email: string;
  description: string | null;
  proof_image_url?: string | null;
  status: string;
  created_at: string;
}

export default function AdminClanLeaderRequests() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await withTimeout(supabase
        .from("clan_leader_requests")
        .select("*")
        .order("created_at", { ascending: false }));

      if (error) throw error;
      setRequests((data as any[]) ?? []);
    } catch (error) {
      toast.error("Error al cargar solicitudes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (req: Request, action: "approved" | "rejected") => {
    if (!user) return;
    setProcessingId(req.id);

    try {
      // Actualizar estado de la solicitud
      const { error: updateError } = await withTimeout(supabase
        .from("clan_leader_requests")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", req.id));

      if (updateError) throw updateError;

      if (action === "approved") {
        // Crear el clan si no existe
        const { data: existingClan } = await withTimeout(supabase
          .from("clans")
          .select("id")
          .eq("name", req.clan_name)
          .maybeSingle());

        if (!existingClan) {
          const { error: clanError } = await withTimeout(supabase.from("clans").insert({
            name: req.clan_name,
            leader_user_id: req.user_id,
            leader_nickname: req.nickname,
          }));

          if (clanError) throw clanError;
        }

        const roleResult = await withTimeout((supabase.rpc as any)("admin_toggle_role", {
          _target_user_id: req.user_id,
          _role: "clan_leader",
          _add: true,
        }));
        if ((roleResult as any)?.error) throw (roleResult as any).error;

        // Actualizar perfil
        await withTimeout((supabase.from as any)("profiles")
          .update({ is_clan_leader: true })
          .eq("user_id", req.user_id));

        toast.success(`✅ ${req.nickname} es ahora líder del clan "${req.clan_name}"`);
      } else {
        toast.success(`Solicitud de ${req.nickname} rechazada`);
      }

      // Log de moderación
      await withTimeout(supabase.from("moderation_logs").insert({
        admin_user_id: user.id,
        admin_nickname: profile?.nickname ?? "Admin",
        target_user_id: req.user_id,
        target_nickname: req.nickname,
        action: action === "approved" ? "Approved clan leader" : "Rejected clan leader",
        reason: `Clan: ${req.clan_name}`,
      }));

    } catch (error: any) {
      toast.error(error.message || "Error al procesar la solicitud");
    } finally {
      setProcessingId(null);
      await fetchRequests();
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Cargando solicitudes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Solicitudes de Líder de Clan</h2>
          <p className="text-muted-foreground">Revisa las solicitudes y las capturas de prueba</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">No hay solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Clan Solicitado</TableHead>
                <TableHead className="hidden md:table-cell">Player ID</TableHead>
                <TableHead>Captura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.nickname}</TableCell>
                  <TableCell className="font-semibold text-primary">{req.clan_name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{req.player_id}</TableCell>
                  
                  {/* Columna de Captura */}
                  <TableCell>
                    {req.proof_image_url ? (
                      <a 
                        href={req.proof_image_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-500"
                      >
                        <Image className="h-4 w-4" />
                        Ver Captura
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sin captura</span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString("es")}
                  </TableCell>

                  <TableCell className="text-right">
                    {req.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={processingId === req.id}
                          onClick={() => handleAction(req, "approved")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={processingId === req.id}
                          onClick={() => handleAction(req, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    ) : (
                      <Badge variant={req.status === "approved" ? "default" : "secondary"}>
                        {req.status}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
