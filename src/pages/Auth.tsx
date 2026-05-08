import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Eye, EyeOff, ShieldCheck, Gamepad2, Users, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [existingClans, setExistingClans] = useState<string[]>([]);
  const [selectedClan, setSelectedClan] = useState<string>("sin_clan");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    playerId: "",
    platform: "Mobile" as "PC" | "Mobile",
    country: "Uruguay",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadClans = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("clan")
        .not("clan", "is", null)
        .not("clan", "eq", "")
        .order("clan");

      if (error) return;
      const uniqueClans = [...new Set((data || []).map((p: any) => p.clan))].sort() as string[];
      setExistingClans(uniqueClans);
    };
    loadClans();
  }, []);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    if (step === 1) {
      if (!form.email || !form.password) {
        toast.error("Email y contraseña son obligatorios");
        return;
      }
      if (form.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!form.nickname || !form.playerId) {
        toast.error("Nickname y Player ID son obligatorios");
        return;
      }
      setStep(3);
      return;
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setStep(1);
  };

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.nickname || !form.playerId) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (selectedClan === "") {
      toast.error("Debes seleccionar un clan o 'Sin clan'");
      return;
    }

    setLoading(true);

    try {
      // Sign out any existing session before creating new account
      await supabase.auth.signOut();
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          email: form.email.trim().toLowerCase(),
          nickname: form.nickname.trim(),
          player_id: form.playerId.trim(),
          platform: form.platform,
          country: form.country,
          clan: selectedClan !== "sin_clan" ? selectedClan : "",
        });

        if (profileError) {
          console.error("Profile insert error:", profileError);
          toast.error("Error al crear perfil: " + profileError.message);
          return;
        }

        if (selectedClan !== "sin_clan") {
          await (supabase.from as any)("clan_join_requests").insert({
            user_id: authData.user.id,
            nickname: form.nickname.trim(),
            player_id: form.playerId.trim(),
            clan_name: selectedClan,
          });
          toast.success(`Solicitud enviada al clan "${selectedClan}"`);
        } else {
          toast.success("¡Cuenta creada! Revisa tu email.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast.error("Email y contraseña son obligatorios");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (error) throw error;

      toast.success("¡Bienvenido!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const stepCopy: Record<1 | 2 | 3, { title: string; subtitle: string }> = {
    1: { title: "Crea tu cuenta", subtitle: "Tu acceso a la comunidad casual de Warzone LATAM. Sin tryhards: verificamos cada cuenta para mantener lobbies justos." },
    2: { title: "Datos de jugador", subtitle: "Verificamos manualmente cada jugador para mantener una competencia real y segura." },
    3: { title: "Tu equipo", subtitle: "¿Ya tienes clan? Puedes pedir unirte ahora o hacerlo después." },
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-6 md:p-8 animate-fade-up">
        <div className="flex justify-center mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-gaming-cyan">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold font-display text-center gradient-text mb-1">
          {mode === "login" ? "Bienvenido de nuevo" : stepCopy[step].title}
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          {mode === "login" ? "Inicia sesión para continuar" : stepCopy[step].subtitle}
        </p>

        {/* Wizard progress (signup only) */}
        {mode === "signup" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2 text-xs font-medium">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                      step === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : step > s
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                  </span>
                  <span className={step === s ? "text-foreground" : "text-muted-foreground hidden sm:inline"}>
                    {s === 1 ? "Cuenta" : s === 2 ? "Jugador" : "Clan"}
                  </span>
                </div>
              ))}
            </div>
            <div className="slot-bar"><span style={{ width: `${(step / 3) * 100}%` }} /></div>
          </div>
        )}

        {/* LOGIN view */}
        {mode === "login" && (
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full py-6 text-base font-semibold">
              {loading ? "Procesando..." : "Iniciar Sesión"}
            </Button>
          </div>
        )}

        {/* SIGNUP wizard */}
        {mode === "signup" && step === 1 && (
          <div className="space-y-3 animate-fade-up">
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña (mín. 6 caracteres)"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-2 pt-1">
              <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              Tu email se usa solo para iniciar sesión y notificaciones de torneos.
            </p>
            <Button onClick={goNext} className="w-full py-6 text-base font-semibold">
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {mode === "signup" && step === 2 && (
          <div className="space-y-3 animate-fade-up">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1.5">
                <Gamepad2 className="h-3.5 w-3.5" /> Nickname dentro del juego
              </label>
              <Input
                placeholder="Tu nick exacto en Warzone (Activision)"
                value={form.nickname}
                onChange={(e) => updateForm("nickname", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Player ID
              </label>
              <Input
                placeholder="Ej: 1234567890"
                value={form.playerId}
                onChange={(e) => updateForm("playerId", e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Lo usamos para verificarte manualmente y prevenir cuentas duplicadas (anti-smurf).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Plataforma</label>
                <Select value={form.platform} onValueChange={(v) => updateForm("platform", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">País</label>
                <Input
                  value={form.country}
                  onChange={(e) => updateForm("country", e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
              </Button>
              <Button onClick={goNext} className="flex-1 font-semibold">
                Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {mode === "signup" && step === 3 && (
          <div className="space-y-3 animate-fade-up">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> ¿Ya tienes clan?
              </label>
              <Select value={selectedClan} onValueChange={setSelectedClan}>
                <SelectTrigger><SelectValue placeholder="Selecciona un clan..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_clan">Sin clan por ahora</SelectItem>
                  {existingClans.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs text-muted-foreground">Clanes existentes:</div>
                      {existingClans.map((clan) => (
                        <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Si seleccionas un clan, se enviará una solicitud al líder. Puedes unirte a uno más tarde.
              </p>
            </div>

            <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>
                  Tu cuenta entrará en estado <span className="text-foreground font-semibold">pendiente de verificación</span> hasta que un admin valide tu Player ID. Podrás competir igual mientras tanto.
                </span>
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
              </Button>
              <Button onClick={handleSignup} disabled={loading} className="flex-1 py-6 text-base font-semibold">
                {loading ? "Creando..." : "Crear cuenta"}
              </Button>
            </div>
          </div>
        )}

        {/* Enlace de olvidaste contraseña */}
        {mode === "login" && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link to="/auth/forgot-password" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
          <button
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="text-accent hover:underline ml-1 font-medium"
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
