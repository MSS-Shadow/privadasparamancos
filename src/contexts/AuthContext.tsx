import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 12000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Tiempo de espera agotado")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  isAdmin: boolean;
  isClanLeader: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, roles: [], loading: true,
  isAdmin: false, isClanLeader: false, signOut: async () => {}, refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (authUser: User) => {
    const metadata = authUser.user_metadata || {};
    const fallbackNickname = authUser.email?.split("@")[0] || "Jugador";
    const platform = metadata.platform === "PC" || metadata.platform === "Mobile" ? metadata.platform : "Mobile";

    await withTimeout(supabase.from("profiles").upsert({
      user_id: authUser.id,
      email: authUser.email || metadata.email || "sin-email@privadas.local",
      nickname: (metadata.nickname || fallbackNickname).toString().trim(),
      player_id: (metadata.player_id || `PENDIENTE-${authUser.id.slice(0, 8)}`).toString().trim(),
      platform,
      country: (metadata.country || "LATAM").toString().trim(),
      clan: (metadata.clan || "").toString().trim(),
    }, { onConflict: "user_id" }));
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await withTimeout(supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle());

      if (error) console.warn("Error fetching profile:", error.message);
      setProfile(data || null);
    } catch (err) {
      console.warn("fetchProfile failed:", err);
      setProfile(null);
    }
  };

  const fetchRoles = async (userId: string, email?: string | null) => {
    const adminEmails = ["portadormato@gmail.com"];
    const emailAdminRole = email && adminEmails.includes(email.toLowerCase()) ? ["admin"] : [];

    try {
      const { data, error } = await withTimeout(
        supabase.from("user_roles").select("role").eq("user_id", userId)
      );
      if (error) throw error;
      setRoles(Array.from(new Set([...(data ?? []).map((r: any) => r.role), ...emailAdminRole])));
    } catch (err) {
      console.warn("fetchRoles failed:", err);
      setRoles(emailAdminRole);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await ensureProfile(user);
      await fetchProfile(user.id);
      await fetchRoles(user.id, user.email);
    }
  };

  useEffect(() => {
    let active = true;
    const failsafe = setTimeout(() => {
      if (active) setLoading(false);
    }, 15000);

    const syncSession = async (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await ensureProfile(nextSession.user).catch((err) => console.warn("ensureProfile failed:", err));
        await Promise.all([fetchProfile(nextSession.user.id), fetchRoles(nextSession.user.id, nextSession.user.email)]);
      } else {
        setProfile(null);
        setRoles([]);
      }

      if (active) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      void syncSession(session);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await syncSession(session);
    }).catch((err) => {
      console.warn("getSession failed:", err);
      setLoading(false);
    });

    return () => {
      active = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await withTimeout(supabase.auth.signOut()).catch((err) => console.warn("signOut failed:", err));
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, roles, loading,
      isAdmin: roles.includes("admin"),
      isClanLeader: roles.includes("clan_leader"),
      signOut, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}
