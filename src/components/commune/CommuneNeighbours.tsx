import { Link } from "react-router-dom";
import { GlowCard } from "@/components/design";
import type { NeighbourInput } from "@/lib/communeShare";

interface Props {
  neighbours: Array<NeighbourInput & { km: number }>;
  year: number;
}

/** Communes proches, avec liens vers leur page. */
export function CommuneNeighbours({ neighbours, year }: Props) {
  if (neighbours.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {neighbours.map((n) => (
        <li key={n.code}>
          <Link to={`/commune/${n.code}?year=${year}`} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <GlowCard className="h-full p-4" interactive>
              <p className="font-heading text-base font-bold leading-tight">{n.nom}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {n.km < 10 ? n.km.toFixed(1).replace(".", ",") : Math.round(n.km)} km · {n.population.toLocaleString("fr-FR")} hab.
              </p>
            </GlowCard>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default CommuneNeighbours;
