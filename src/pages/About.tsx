import { BookOpen, Trophy, Users, Swords, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Acerca de Privadas para Mancos</h1>
        <p className="text-muted-foreground leading-relaxed">
          Privadas para Mancos es el punto de encuentro de la comunidad casual de Warzone LATAM.
          Organizamos torneos, scrims y mantenemos rankings para la creciente comunidad casual.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { icon: Trophy, title: "Torneos", desc: "Torneos regulares en modo Solo, Duo, Trio y Squad con rankings completos." },
          { icon: Swords, title: "Scrims", desc: "Partidas de práctica organizadas por creadores verificados y administradores." },
          { icon: Users, title: "Comunidad", desc: "Una comunidad creciente de jugadores casuales de Warzone." },
          { icon: Target, title: "Rankings", desc: "Sistema de clasificación basado en campeonatos ganados en todos los modos." },
        ].map((item, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">{item.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-3">Nuestra Misión</h2>
        <p className="text-muted-foreground leading-relaxed">
          Construir una plataforma casual y justa que le dé un hogar a cada jugador de Warzone LATAM —
          desde competidores casuales hasta equipos serios. Cada partida importa. La historia de cada jugador cuenta.
        </p>
      </div>
    </div>
  );
}
