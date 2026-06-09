import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RefreshCw, ExternalLink } from "lucide-react";
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

type CreatorRequestRow = {
  id: string;
  user_id: string;
  nickname: string;
  email: string;
  platform: string;
  channel_link: string;
  status: string;
  created_at: string;
};
type FunctionErrorPayload = { error?: string };
const getMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export default function AdminCreators() {
  const [requests, setRequests] = useState<CreatorRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await withTimeout(supabase.from("creator_requests").select("*").order("created_at", { ascending: false }));
      if (error) throw error;
      setRequests(data || []);
    } catch (err: unknown) {
      console.error("Error loading creator requests:", err);
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id: string, status: string, userId: string) => {
    setProcessingId(id);
    try {
      const { error } = await withTimeout(supabase.from("creator_requests").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id));
      if (error) throw error;

      if (status === "Approved") {
        const { data: roleData, error: roleError } = await withTimeout(supabase.functions.invoke("admin-toggle-role", {
          body: {
            target_user_id: userId,
            role: "content_creator",
            add: true,
          },
        }));
        if (roleError) throw roleError;
        const payload = roleData as FunctionErrorPayload | null;
        if (payload?.error) throw new Error(payload.error);
      }

      toast.success(`Solicitud ${status === "Approved" ? "aprobada" : "rechazada"}`);
      await fetchRequests();
    } catch (err: unknown) {
      toast.error(getMessage(err, "Error al procesar solicitud"));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Solicitudes de Creadores ({requests.length})</h2>
        <Button variant="ghost" size="sm" onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Cargando...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay solicitudes de creadores.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nickname}</TableCell>
                  <TableCell className="text-xs">{r.email}</TableCell>
                  <TableCell>{r.platform}</TableCell>
                  <TableCell>
                    <a href={r.channel_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs inline-flex items-center gap-0.5">
                      <ExternalLink className="h-3 w-3" /> Ver Canal
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "Approved" ? "default" : r.status === "Rejected" ? "destructive" : "secondary"} className="text-xs">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es")}</TableCell>
                  <TableCell>
                    {r.status === "Pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 text-xs" disabled={processingId === r.id} onClick={() => handleAction(r.id, "Approved", r.user_id)}>Aprobar</Button>
                        <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={processingId === r.id} onClick={() => handleAction(r.id, "Rejected", r.user_id)}>Rechazar</Button>
                      </div>
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
