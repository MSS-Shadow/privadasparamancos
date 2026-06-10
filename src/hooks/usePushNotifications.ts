import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY =
  "BN2jyim5PjRwhzymJ4WFIa0r7N6cGtJ4bDx8ACUzpT-l4lZCfNhswZzxVezrQPk9A3J1B6Np6oUwJ35oRFwGlvY";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);
    if (!supported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => setIsSubscribed(false));
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error("Tu navegador no soporta notificaciones push");
      return;
    }
    if (!user) {
      toast.error("Iniciá sesión para activar notificaciones");
      return;
    }
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permiso de notificaciones denegado");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      const json = sub.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } };
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh || "",
          auth: json.keys?.auth || "",
          user_agent: navigator.userAgent,
        },
        { onConflict: "endpoint" },
      );
      if (error) throw error;
      setIsSubscribed(true);
      toast.success("Notificaciones activadas");
    } catch (e: any) {
      toast.error(e.message || "Error al activar notificaciones");
    } finally {
      setLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      toast.success("Notificaciones desactivadas");
    } catch (e: any) {
      toast.error(e.message || "Error al desactivar");
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, loading, subscribe, unsubscribe };
}