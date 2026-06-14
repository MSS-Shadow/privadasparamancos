import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

/**
 * Renders a link that, on click, requests a short-lived signed URL for a file
 * in the private 'uploads' bucket and opens it. Accepts either a storage path
 * (e.g. "verification/<uid>/foo.png") or a legacy public URL — in the latter
 * case the path portion after "/uploads/" is extracted.
 */
export default function SignedFileLink({
  urlOrPath,
  children,
  className,
}: {
  urlOrPath: string | null | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  if (!urlOrPath) return null;

  const extractPath = (v: string) => {
    const marker = "/uploads/";
    const idx = v.indexOf(marker);
    return idx >= 0 ? v.slice(idx + marker.length) : v;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const path = extractPath(urlOrPath);
      const { data, error } = await supabase.storage.from("uploads").createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) throw error || new Error("No se pudo generar el link");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo abrir el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <a href="#" onClick={handleClick} className={className}>
      <ExternalLink className="h-3 w-3" /> {children}
    </a>
  );
}