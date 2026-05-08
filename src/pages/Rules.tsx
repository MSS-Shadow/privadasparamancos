export default function RulesPage() {
  const rules = [
    {
      title: "Reglas Generales",
      items: [
        "Todos los jugadores deben registrarse con su Activision ID válido de Warzone.",
        "Una cuenta por jugador. Las cuentas duplicadas serán marcadas y podrían ser baneadas.",
        "Se espera un comportamiento respetuoso en todo momento. La conducta tóxica resultará en advertencias o baneos.",
        "Todas las decisiones de los administradores de Privadas para Mancos son definitivas.",
      ],
    },
    {
      title: "Reglas de Torneos",
      items: [
        "Los equipos deben estar registrados al menos 24 horas antes del inicio del torneo.",
        "Los jugadores deben estar en línea 15 minutos antes de su partida programada.",
        "Las ausencias resultarán en descalificación automática.",
        "No se permiten cambios de roster una vez que el torneo haya comenzado.",
        "Los resultados se determinan por la posición y eliminaciones en el juego.",
      ],
    },
    {
      title: "Reglas de Scrims",
      items: [
        "Los scrims son organizados únicamente por administradores y creadores verificados.",
        "Los IDs de sala y contraseñas solo se comparten con participantes registrados.",
        "El stream sniping está estrictamente prohibido y resultará en baneo.",
        "Los jugadores deben seguir el modo de juego especificado por el organizador.",
      ],
    },
    {
      title: "Fair Play",
      items: [
        "El uso de cheats, hacks o exploits está estrictamente prohibido.",
        "Cualquier jugador atrapado haciendo trampa será baneado permanentemente de todos los eventos de Privadas para Mancos.",
        "No se permite el teaming en partidas solo.",
        "Los jugadores deben usar la misma cuenta registrada en la plataforma.",
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Reglas</h1>
        <p className="text-muted-foreground">Reglas de la casa para todos los eventos de Privadas para Mancos.</p>
      </div>

      {rules.map((section, i) => (
        <section key={i}>
          <h2 className="text-xl font-semibold text-foreground mb-3">{section.title}</h2>
          <div className="bg-card border border-border rounded-lg p-5">
            <ol className="space-y-3">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-sm">
                  <span className="text-primary font-bold tabular-nums shrink-0">{j + 1}.</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}
