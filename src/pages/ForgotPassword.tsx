import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Por favor ingresa tu email");

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        toast.error("No se pudo enviar el email. " + error.message);
      } else {
        toast.success("✅ Link de recuperación enviado. Revisa tu email (incluido Spam).");
      }
    } catch (e: any) {
      toast.error(e?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl p-8">
        <Link to="/auth" className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
          <ArrowLeft className="h-5 w-5" /> Volver al login
        </Link>

        <div className="flex justify-center mb-6">
          <Mail className="h-12 w-12 text-yellow-400" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Recuperar contraseña</h1>
        <p className="text-center text-zinc-400 mb-8">
          Ingresa tu email y te enviaremos un link para restablecerla
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando link..." : "Enviar link de recuperación"}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          ¿Ya recordaste tu contraseña?{" "}
          <Link to="/auth" className="text-yellow-400 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
