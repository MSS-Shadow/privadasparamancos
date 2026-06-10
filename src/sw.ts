/// <reference lib="webworker" />
/// <reference types="vite-plugin-pwa/client" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string } = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Privadas para Mancos", body: event.data?.text() ?? "" };
  }

  const title = data.title || "Privadas para Mancos";
  const options: NotificationOptions = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          (client as WindowClient).navigate(url);
          return (client as WindowClient).focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));