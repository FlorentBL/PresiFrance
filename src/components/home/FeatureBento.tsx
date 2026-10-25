import { Link } from "react-router-dom";
import { BarChart3, CalendarDays, GitCompare, Globe, LineChart, Users, type LucideIcon } from "lucide-react";
import { BentoGrid, BentoItem, GlowCard, Reveal, Section } from "@/components/design";

interface Feature {
  to?: string;
  title: string;
  text: string;
  icon: LucideIcon;
  span: 2 | 3 | 4 | 6;
  glow: "blue" | "red" | "white";
}

const FEATURES: Feature[] = [
  { to: "/resultats-presidentielle", title: "Résultats des présidentielles", icon: CalendarDays, span: 4, glow: "blue",
    text: "Parcourez les résultats par année, puis explorez les départements et les communes pour suivre les scores, la participation et les évolutions locales." },
  { to: "/explorer", title: "Explorer par ville", icon: BarChart3, span: 2, glow: "white",
    text: "Accédez aux résultats détaillés de chacune des 35 000 communes de France, classées par département." },
  { to: "/comparer", title: "Comparer", icon: GitCompare, span: 2, glow: "red",
    text: "Comparez les résultats de deux communes côte à côte : participation, scores des candidats, écarts." },
  { to: "/parrainages", title: "Parrainages", icon: Users, span: 2, glow: "blue",
    text: "Découvrez qui a parrainé quel candidat dans votre département ou votre région." },
  { to: "/analyse", title: "Sondages 2022", icon: LineChart, span: 2, glow: "red",
    text: "Chronologie des intentions au 1er tour (2022) : courbes lissées à partir des sondages après la liste officielle des candidats." },
  { title: "Open Data", icon: Globe, span: 6, glow: "blue",
    text: "Toutes nos données proviennent directement de data.gouv.fr et du Ministère de l'Intérieur." },
];

/** Bento des fonctionnalités du site. */
export default function FeatureBento() {
  return (
    <Section width="default" eyebrow="Tout PrésiFrance" title="Six façons de lire le vote" id="fonctionnalites">
      <BentoGrid>
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const body = (
            <GlowCard glow={f.glow} className="h-full min-h-[11rem]">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              {f.to && <span className="mt-4 inline-block text-sm font-semibold text-primary">Ouvrir →</span>}
            </GlowCard>
          );
          return (
            <BentoItem key={f.title} span={f.span}>
              <Reveal delay={(i % 3) * 0.08} className="h-full">
                {f.to ? (
                  <Link to={f.to} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </Reveal>
            </BentoItem>
          );
        })}
      </BentoGrid>
    </Section>
  );
}
