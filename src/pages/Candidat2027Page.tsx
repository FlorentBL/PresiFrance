import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import JsonLd from "@/components/JsonLd";
import SEOHead from "@/components/SEOHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CandidateAvatar, GlowCard, PageHero, Section } from "@/components/design";
import { StatusBadge } from "@/components/presidentielle2027/StatusBadge";
import { getPolls2027Round1 } from "@/lib/api/polls2027Api";
import {
  candidateFaq,
  candidateFullName,
  POLL_WINDOW_DAYS,
  pctText,
  relatedCandidates,
  sponsorshipAnswer,
  sponsorshipOf,
  summarizePolls,
  type SponsorshipStats,
} from "@/lib/candidate2027Content";
import {
  findCandidateBySlug,
  formatPartialDate,
  getCandidateHistory,
  getCandidates2027,
} from "@/lib/api/presidential2027Api";
import NotFound from "@/pages/NotFound";

const HUB = "/presidentielle-2027";
const linkClass = "font-medium text-primary hover:underline";

async function getSponsorship2027(): Promise<SponsorshipStats | null> {
  try {
    const res = await fetch("/data/parrainages/2027.json");
    if (!res.ok) return null;
    const data = (await res.json()) as SponsorshipStats;
    return Array.isArray(data.stats) ? data : null;
  } catch {
    return null; // fichier absent : le serveur renvoie la page d'accueil, pas du JSON
  }
}

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

  const polls = useQuery({ queryKey: ["p2027-sondages"], queryFn: getPolls2027Round1, staleTime: 60 * 60 * 1000 });
  const sponsorships = useQuery({ queryKey: ["p2027-parrainages"], queryFn: getSponsorship2027, staleTime: 60 * 60 * 1000 });

  if (list.data && !candidate) return <NotFound />;

  const pollSummary = candidate && polls.data ? summarizePolls(candidate, polls.data) : null;
  const sponsorship = candidate && sponsorships.data !== undefined ? sponsorshipOf(candidate, sponsorships.data) : null;
  const faq =
    candidate && pollSummary && history.data && sponsorship
      ? candidateFaq(candidate, { polls: pollSummary, history: history.data, sponsorship })
      : null;
  const related = candidate && polls.data && list.data ? relatedCandidates(candidate, list.data.candidats, polls.data) : null;

  const name = candidate ? `${candidate.prenom} ${candidate.nom}` : "Candidat";
  const path = `${HUB}/candidats/${slug ?? ""}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={candidate ? `${name} : candidature présidentielle 2027, sondages et parcours` : "Fiche candidat — présidentielle 2027"}
        fullTitle={!!candidate}
        description={
          candidate
            ? `${name} et la présidentielle 2027 : statut de la candidature, sondages de 1er tour, résultats aux présidentielles passées et parrainages, avec les sources.`
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
                  {candidate.fonction?.libelle && (
                    <>
                      <dt className="text-sm text-muted-foreground">Fonction</dt>
                      <dd>
                        {candidate.fonction.libelle}
                        <span className="block text-xs text-muted-foreground">
                          Source :{" "}
                          <a href={candidate.fonction.sourceUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                            {candidate.fonction.sourceLabel}
                          </a>
                          , vérifiée le {formatPartialDate(candidate.fonction.dateVerification)}
                        </span>
                      </dd>
                    </>
                  )}
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

            <Section eyebrow="Historique" title={`Parcours électoral : ${name} aux présidentielles`} width="narrow">
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

            <Section eyebrow="Sondages" title={`Sondages de la présidentielle 2027 : ${name}`} width="narrow">
              {polls.isLoading && (
                <p className="flex items-center gap-2 text-muted-foreground" role="status">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Chargement…
                </p>
              )}
              {polls.isError && <p className="text-destructive">Impossible de charger les sondages.</p>}
              {pollSummary && !pollSummary.pollCount && (
                <p className="text-muted-foreground">{faq?.[1].a}</p>
              )}
              {pollSummary && pollSummary.pollCount > 0 && pollSummary.latest && (
                <GlowCard className="p-6">
                  <dl className="grid gap-4 sm:grid-cols-[14rem_1fr]">
                    <dt className="text-sm text-muted-foreground">Nombre de sondages qui le testent</dt>
                    <dd>{pollSummary.pollCount.toLocaleString("fr-FR")}</dd>
                    <dt className="text-sm text-muted-foreground">
                      Moyenne récente ({POLL_WINDOW_DAYS} jours avant le {formatPartialDate(pollSummary.asOf)})
                    </dt>
                    <dd>
                      {pollSummary.recent
                        ? `${pctText(pollSummary.recent.value)} (${pollSummary.recent.pollCount} sondage${pollSummary.recent.pollCount > 1 ? "s" : ""})`
                        : "aucun sondage sur la période"}
                    </dd>
                    <dt className="text-sm text-muted-foreground">Dernier sondage</dt>
                    <dd>
                      {pollSummary.latest.pollster}, terrain terminé le {formatPartialDate(pollSummary.latest.fieldworkEnd)} :{" "}
                      {pollSummary.latest.min === pollSummary.latest.max
                        ? pctText(Math.round(pollSummary.latest.score * 10) / 10)
                        : `${pctText(Math.round(pollSummary.latest.min * 10) / 10)} à ${pctText(Math.round(pollSummary.latest.max * 10) / 10)} selon l'hypothèse`}
                      {pollSummary.latest.noticeUrl && (
                        <a href={pollSummary.latest.noticeUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} ml-2`}>
                          Notice
                        </a>
                      )}
                    </dd>
                  </dl>
                  {pollSummary.curve.length >= 2 && (
                    <table className="mt-6 w-full text-sm">
                      <caption className="mb-2 text-left font-medium">
                        Moyenne glissante de {POLL_WINDOW_DAYS} jours, {name}
                      </caption>
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th scope="col" className="py-1">Au</th>
                          <th scope="col">Moyenne</th>
                          <th scope="col">Sondages</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pollSummary.curve.map((p) => (
                          <tr key={p.date}>
                            <th scope="row" className="py-1 text-left font-normal">{formatPartialDate(p.date)}</th>
                            <td className="tabular-nums">{pctText(p.value)}</td>
                            <td className="tabular-nums">{p.pollCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </GlowCard>
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                Les listes de candidats testées diffèrent d&apos;un sondage à l&apos;autre : pour chaque sondage, le score
                retenu est la moyenne des hypothèses où le candidat figure. Détail et courbes de tous les candidats :{" "}
                <Link to="/sondages-presidentielle-2027" className={linkClass}>sondages de la présidentielle 2027</Link>.
              </p>
            </Section>

            {sponsorship && (
              <Section eyebrow="Parrainages" title="Parrainages 2027" width="narrow">
                <p>{sponsorshipAnswer(candidate, sponsorship)}</p>
                <p className="mt-2">
                  <Link to="/parrainages?year=2027" className={linkClass}>Parrainages 2027 : suivi détaillé</Link>
                </p>
              </Section>
            )}

            {faq && (
              <Section eyebrow="FAQ" title={`Questions fréquentes sur ${name}`} width="narrow">
                <div className="space-y-6">
                  {faq.map((f) => (
                    <div key={f.q}>
                      <h3 className="font-heading text-lg font-semibold">{f.q}</h3>
                      <p className="mt-2 text-muted-foreground leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {related && (
              <Section title="Autres candidats à la présidentielle 2027" width="narrow">
                {related.byPolls.length > 0 && (
                  <>
                    <h3 className="font-heading text-lg font-semibold">Les plus testés dans les sondages</h3>
                    <ul className="mt-2 space-y-2">
                      {related.byPolls.map((x) => (
                        <li key={x.slug}><Link to={`${HUB}/candidats/${x.slug}`} className={linkClass}>{candidateFullName(x)}</Link></li>
                      ))}
                    </ul>
                  </>
                )}
                <h3 className="mt-6 font-heading text-lg font-semibold">Autres fiches (ordre alphabétique)</h3>
                <ul className="mt-2 space-y-2">
                  {related.neighbours.map((x) => (
                    <li key={x.slug}><Link to={`${HUB}/candidats/${x.slug}`} className={linkClass}>{candidateFullName(x)}</Link></li>
                  ))}
                </ul>
              </Section>
            )}

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
