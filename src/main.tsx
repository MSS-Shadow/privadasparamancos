import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("Nueva versión disponible, actualizando...");
  },
  onOfflineReady() {
    console.log("App lista para funcionar offline");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
