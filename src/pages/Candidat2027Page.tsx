import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import JsonLd from "@/components/JsonLd";
import SEOHead from "@/components/SEOHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CandidateAvatar, GlowCard, PageHero, Section } from "@/components/design";
import { StatusBadge } from "@/components/presidentielle2027/StatusBadge";
import {
  findCandidateBySlug,
  formatPartialDate,
  getCandidateHistory,
  getCandidates2027,
  STATUS_LABEL,
} from "@/lib/api/presidential2027Api";
import NotFound from "@/pages/NotFound";

const HUB = "/presidentielle-2027";
const linkClass = "font-medium text-primary hover:underline";

const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

export default function Candidat2027Page() {
  const { slug } = useParams<{ slug: string }>();
  const list = useQuery({ queryKey: ["p2027-candidats"], queryFn: getCandidates2027, staleTime: 60 * 60 * 1000 });
  const candidate = list.data ? findCandidateBySlug(list.data.candidats, slug) : undefined;

  const history = useQuery({
    queryKey: ["p2027-historique", candidate?.slug],
    queryFn: () => getCandidateHistory(candidate!),
    enabled: !!candidate,
    staleTime: 60 * 60 * 1000,
  });

  if (list.data && !candidate) return <NotFound />;

  const name = candidate ? `${candidate.prenom} ${candidate.nom}` : "Candidat";
  const path = `${HUB}/candidats/${slug ?? ""}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={`${name} — présidentielle 2027`}
        description={
          candidate
            ? `Fiche de ${name}, ${STATUS_LABEL[candidate.statut].toLowerCase()} à la présidentielle 2027 : soutien, date de déclaration, source et historique électoral.`
            : "Fiche candidat de la présidentielle 2027."
        }
        path={path}
      />
      <JsonLd
        path={path}
        breadcrumbs={[
          { name: "Présidentielle 2027", path: HUB },
          { name, path },
        ]}
      />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Présidentielle 2027 · fiche candidat"
          title={name}
          aside={candidate && <CandidateAvatar prenom={candidate.prenom} nom={candidate.nom} size="xl" />}
          actions={<Link to={HUB} className={linkClass}>← Tous les candidats</Link>}
        />

        {list.isLoading && (
          <p className="flex items-center justify-center gap-2 py-20 text-muted-foreground" role="status">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> Chargement…
          </p>
        )}
        {list.isError && <p className="py-12 text-center text-destructive">Impossible de charger la fiche.</p>}

        {candidate && (
          <>
            <Section eyebrow="Présentation" title="Informations" width="narrow">
              <GlowCard className="p-6">
                <dl className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                  <dt className="text-sm text-muted-foreground">Statut</dt>
                  <dd><StatusBadge statut={candidate.statut} /></dd>
                  <dt className="text-sm text-muted-foreground">Parti ou soutien</dt>
                  <dd>{candidate.parti}</dd>
                  <dt className="text-sm text-muted-foreground">Date de déclaration</dt>
                  <dd>{formatPartialDate(candidate.dateDeclaration)}</dd>
                  {candidate.note && (
                    <>
                      <dt className="text-sm text-muted-foreground">Précision</dt>
                      <dd>{candidate.note}</dd>
                    </>
                  )}
                  <dt className="text-sm text-muted-foreground">Source</dt>
                  <dd>
                    <a href={candidate.sourceUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {candidate.sourceLabel}
                    </a>
                    <span className="block text-xs text-muted-foreground">
                      Vérifiée le {formatPartialDate(candidate.dateVerification)}
                    </span>
                  </dd>
                </dl>
              </GlowCard>
              <p className="mt-4 text-sm text-muted-foreground">
                Information issue de sources de presse, sans valeur officielle. La liste officielle des candidats sera
                publiée par le Conseil constitutionnel après validation des parrainages.
              </p>
            </Section>

            <Section eyebrow="Historique" title="Historique électoral (présidentielles)" width="narrow">
              {history.isLoading && (
                <p className="flex items-center gap-2 text-muted-foreground" role="status">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Chargement…
                </p>
              )}
              {history.data && history.data.length === 0 && (
                <p className="text-muted-foreground">
                  Aucune candidature à une élection présidentielle dans les données de PrésiFrance.
                </p>
              )}
              {history.data && history.data.length > 0 && (
                <ul className="space-y-3">
                  {history.data.map((h) => (
                    <li key={`${h.year}-${h.round}`}>
                      <GlowCard className="p-4">
                        <Link to={`/presidentielle-${h.year}`} className={linkClass}>
                          Présidentielle {h.year}, tour {h.round}
                        </Link>
                        <span className="ml-2 tabular-nums text-sm text-muted-foreground">
                          {pct(h.pourcentExprimes)} des exprimés · {h.voix.toLocaleString("fr-FR")} voix
                        </span>
                      </GlowCard>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Voir aussi" width="narrow">
              <ul className="space-y-2">
                <li><Link to="/parrainages?year=2027" className={linkClass}>Parrainages 2027</Link></li>
                <li><Link to="/sondages-presidentielle-2027" className={linkClass}>Sondages 2027</Link></li>
                <li><Link to={HUB} className={linkClass}>Présidentielle 2027 : tous les candidats et le calendrier</Link></li>
              </ul>
            </Section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
