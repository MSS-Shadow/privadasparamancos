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
      await fetchProfile(user.id);
      await fetchRoles(user.id, user.email);
    }
  };

  useEffect(() => {
    let active = true;
    const failsafe = setTimeout(() => {
      if (active) setLoading(false);
    }, 15000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await Promise.all([fetchProfile(session.user.id), fetchRoles(session.user.id, session.user.email)]);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([fetchProfile(session.user.id), fetchRoles(session.user.id, session.user.email)]);
      }
      setLoading(false);
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
    await supabase.auth.signOut();
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
