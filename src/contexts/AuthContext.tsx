import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) console.warn("Error fetching profile:", error.message);
      setProfile(data || null);
    } catch (err) {
      console.warn("fetchProfile failed:", err);
      setProfile(null);
    }
  };

  const fetchRoles = async () => {
    // Temporal: Solo admin manual por email
    const adminEmails = ["portadormato@gmail.com"]; // ← CAMBIA ESTO por tu correo real
    const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());
    
    setRoles(isAdmin ? ["admin"] : []);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchRoles();
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await Promise.all([fetchProfile(session.user.id), fetchRoles()]);
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
        await Promise.all([fetchProfile(session.user.id), fetchRoles()]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [user?.email]);

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
