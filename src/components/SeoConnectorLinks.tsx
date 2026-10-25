import { Link } from "react-router-dom";
import { BarChart3, Map, MapPin, Search, UsersRound } from "lucide-react";

import { GlowCard } from "@/components/design";

interface SeoConnectorLinksProps {
  context: "commune" | "department" | "year";
  communeName?: string;
  departmentName?: string;
  year?: number;
}

const copyByContext = {
  commune: {
    eyebrow: "Comprendre ce résultat",
    title: "Explorer le vote local autrement",
    intro: "Ces pages replacent le résultat communal dans une lecture plus large : carte, mobilisation, abstention et comparaison.",
  },
  department: {
    eyebrow: "Explorer autrement",
    title: "Lire les résultats du département",
    intro: "Après avoir choisi une commune, ces pages aident à comprendre les dynamiques territoriales et la mobilisation électorale.",
  },
  year: {
    eyebrow: "Approfondir l'année",
    title: "Analyser cette présidentielle",
    intro: "Ces entrées relient le scrutin aux communes, aux cartes et aux indicateurs de mobilisation.",
  },
} as const;

export default function SeoConnectorLinks({ context, communeName, departmentName, year }: SeoConnectorLinksProps) {
  const copy = copyByContext[context];
  const place = communeName || departmentName;
  const suffix = place ? ` pour ${place}` : year ? ` en ${year}` : "";

  const links = [
    {
      to: "/resultats-presidentielle-par-commune",
      label: "Résultats par commune",
      text: `Trouver les scores, la participation et l'abstention${suffix}.`,
      Icon: Search,
    },
    {
      to: "/carte-presidentielle",
      label: "Carte présidentielle",
      text: "Visualiser les rapports de force entre territoires.",
      Icon: Map,
    },
    {
      to: "/participation-presidentielle",
      label: "Participation",
      text: "Comparer la mobilisation électorale entre communes et années.",
      Icon: UsersRound,
    },
    {
      to: "/abstention-presidentielle",
      label: "Abstention",
      text: "Nuancer les scores avec le niveau de non-vote.",
      Icon: BarChart3,
    },
  ];

  return (
    <section className="mb-12">
      <GlowCard interactive={false} className="p-5 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{copy.eyebrow}</p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{copy.intro}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map(({ to, label, text, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group/link rounded-xl border border-border bg-background/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 motion-reduce:transform-none"
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {label}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
            </Link>
          ))}
        </div>
      </GlowCard>
    </section>
  );
}
