import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Skull, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: ruta inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ backgroundColor: "#0B0E0B" }}
    >
      <div className="text-center max-w-lg">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10">
          <Skull className="h-10 w-10" style={{ color: "#22c55e" }} />
        </div>
        <h1 className="mb-3 text-7xl font-black font-display" style={{ color: "#22c55e" }}>
          404
        </h1>
        <p className="mb-2 text-xl font-semibold text-white">
          Te caíste del mapa, operador.
        </p>
        <p className="mb-8 text-sm text-white/60">
          Esta zona no existe o fue destruida por el gas. Volvé al helicóptero de extracción.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-black transition-transform hover:scale-105"
          style={{ backgroundColor: "#22c55e" }}
        >
          <Home className="h-5 w-5" /> Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
