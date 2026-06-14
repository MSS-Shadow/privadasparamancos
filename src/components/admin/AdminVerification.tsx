import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import SignedFileLink from "@/components/SignedFileLink";

export default function AdminVerification() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("verification_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      console.error("Error loading verification requests:", err);
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, status: string, nickname: string) => {
    const { error } = await supabase.from("verification_requests").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }

    if (status === "approved") {
      await supabase.from("profiles").update({ verified: true }).eq("nickname", nickname);
    }

    toast.success(`Solicitud ${status === "approved" ? "aprobada" : "rechazada"}`);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Verificación de Cuentas ({requests.length})</h2>
        <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Cargando...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay solicitudes de verificación.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Player ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Capturas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nickname}</TableCell>
                  <TableCell className="font-mono text-xs">{r.player_id}</TableCell>
                  <TableCell className="text-xs">{r.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.profile_screenshot_url && (
                        <SignedFileLink urlOrPath={r.profile_screenshot_url} className="text-primary hover:underline text-xs inline-flex items-center gap-0.5">
                          Perfil
                        </SignedFileLink>
                      )}
                      {r.id_screenshot_url && (
                        <SignedFileLink urlOrPath={r.id_screenshot_url} className="text-primary hover:underline text-xs inline-flex items-center gap-0.5">
                          ID
                        </SignedFileLink>
                      )}
                      {r.additional_doc_url && (
                        <SignedFileLink urlOrPath={r.additional_doc_url} className="text-primary hover:underline text-xs inline-flex items-center gap-0.5">
                          Extra
                        </SignedFileLink>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es")}</TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleAction(r.id, "approved", r.nickname)}>Aprobar</Button>
                        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleAction(r.id, "rejected", r.nickname)}>Rechazar</Button>
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
