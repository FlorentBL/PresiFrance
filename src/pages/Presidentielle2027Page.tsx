import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import CommuneSearch from "@/components/CommuneSearch";
import JsonLd from "@/components/JsonLd";
import SEOHead from "@/components/SEOHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CandidateAvatar, GlowCard, PageHero, Section } from "@/components/design";
import { StatusBadge } from "@/components/presidentielle2027/StatusBadge";
import { buildFaq2027, frDate } from "@/lib/faq2027";
import {
  STATUS_GROUP_TITLE,
  formatPartialDate,
  getCalendar2027,
  getCandidates2027,
  groupCandidatesByStatus,
} from "@/lib/api/presidential2027Api";
import type { GeoCommune } from "@/lib/api/geoApi";
import { getLiveStatus, isLiveVisible } from "@/lib/api/live2027Api";
import { DEFAULT_YEAR } from "@/lib/elections";
import { DEPENSES_DETTE_FRANCE_URL, DEPENSES_PUBLIQUES_NAME } from "@/lib/partnerSites";

const PATH = "/presidentielle-2027";
const linkClass = "font-medium text-primary hover:underline";

export default function Presidentielle2027Page() {
  const navigate = useNavigate();
  const candidates = useQuery({ queryKey: ["p2027-candidats"], queryFn: getCandidates2027, staleTime: 60 * 60 * 1000 });
  const calendar = useQuery({ queryKey: ["p2027-calendrier"], queryFn: getCalendar2027, staleTime: 60 * 60 * 1000 });

  const live = useQuery({ queryKey: ["live2027-status"], queryFn: getLiveStatus, staleTime: 60 * 1000 });
  const liveVisible = isLiveVisible(live.data);

  const faq = candidates.data && calendar.data ? buildFaq2027(candidates.data, calendar.data) : [];
  const firstRound = calendar.data?.evenements.find((e) => e.id === "t1");
  const secondRound = calendar.data?.evenements.find((e) => e.id === "t2");

  const handleSelect = (commune: GeoCommune) => navigate(`/commune/${commune.code}?year=${DEFAULT_YEAR}`);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Présidentielle 2027 : date, candidats, calendrier"
        description="Présidentielle 2027 : 1er tour le 18 avril, 2nd tour le 2 mai 2027. Candidats déclarés et pressentis, calendrier du scrutin, parrainages, sondages et FAQ."
        path={PATH}
      />
      <JsonLd path={PATH} breadcrumbs={[{ name: "Présidentielle 2027", path: PATH }]} faq={faq} />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Élection 2027"
          title="Présidentielle 2027 : date, candidats et calendrier"
          description={
            firstRound?.date && secondRound?.date
              ? `L'élection présidentielle 2027 aura lieu le dimanche ${frDate(firstRound.date)} (1er tour) et le dimanche ${frDate(secondRound.date)} (2nd tour) — source : ${firstRound.sourceLabel}. Candidats déclarés et pressentis classés par ordre alphabétique et présentés selon un gabarit identique ; chaque information est sourcée et datée.`
              : "Candidats déclarés et pressentis, calendrier du scrutin et accès aux données. Les candidats sont classés par ordre alphabétique et présentés selon un gabarit identique ; chaque information est sourcée et datée."
          }
          actions={
            <>
              <Link to="/parrainages?year=2027" className={linkClass}>Parrainages 2027</Link>
              <Link to="/sondages-presidentielle-2027" className={linkClass}>Sondages 2027</Link>
              {liveVisible && <Link to={`${PATH}/resultats`} className={linkClass}>Résultats en direct</Link>}
            </>
          }
        />

        <Section
          eyebrow="Candidats"
          title="Candidats"
          description={candidates.data?.meta.avertissement}
        >
          {candidates.isLoading && (
            <p className="flex items-center gap-2 text-muted-foreground" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Chargement des candidats…
            </p>
          )}
          {candidates.isError && <p className="text-destructive">Impossible de charger la liste des candidats.</p>}
          {candidates.data &&
            groupCandidatesByStatus(candidates.data.candidats).map((group) => (
              <div key={group.statut} className="mb-10 last:mb-0">
                <h3 className="mb-4 font-heading text-xl font-semibold">
                  {STATUS_GROUP_TITLE[group.statut]}{" "}
                  <span className="text-base font-normal text-muted-foreground">({group.candidats.length})</span>
                </h3>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.candidats.map((c) => (
                    <li key={c.slug}>
                      <GlowCard interactive className={group.statut === "retire" ? "h-full p-5 opacity-80" : "h-full p-5"}>
                        <Link
                          to={`${PATH}/candidats/${c.slug}`}
                          className="flex items-center gap-4 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <CandidateAvatar prenom={c.prenom} nom={c.nom} size="md" />
                          <span className="min-w-0">
                            <span className="block font-heading text-lg font-semibold">
                              {c.prenom} {c.nom}
                            </span>
                            <span className="block text-sm text-muted-foreground">{c.parti}</span>
                            <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <StatusBadge statut={c.statut} />
                              {c.statut === "retire" ? (
                                c.note && <span>{c.note}</span>
                              ) : (
                                <span>Déclaration : {formatPartialDate(c.dateDeclaration)}</span>
                              )}
                            </span>
                          </span>
                        </Link>
                      </GlowCard>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </Section>

        <Section eyebrow="Calendrier" title="Calendrier du scrutin" width="narrow">
          {calendar.isLoading && (
            <p className="flex items-center gap-2 text-muted-foreground" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Chargement du calendrier…
            </p>
          )}
          {calendar.isError && <p className="text-destructive">Impossible de charger le calendrier.</p>}
          {calendar.data && (
            <ol className="space-y-4">
              {calendar.data.evenements.map((e) => (
                <li key={e.id}>
                  <GlowCard className="p-5">
                    <p className="font-heading text-lg font-semibold">{e.label}</p>
                    <p className="mt-1 text-sm tabular-nums">
                      {formatPartialDate(e.date)}
                      {e.statut === "a_confirmer" && " — date non officielle"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{e.detail}</p>
                    {e.sourceUrl && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Source :{" "}
                        <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {e.sourceLabel}
                        </a>
                        , vérifiée le {formatPartialDate(e.dateVerification)}.
                      </p>
                    )}
                  </GlowCard>
                </li>
              ))}
            </ol>
          )}
        </Section>

        {faq.length > 0 && (
          <Section eyebrow="FAQ" title="Questions fréquentes" width="narrow">
            {faq.map((f) => (
              <div key={f.q} className="mb-6 last:mb-0">
                <h3 className="font-heading text-lg font-semibold">{f.q}</h3>
                <p className="mt-2 text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </Section>
        )}

        <Section eyebrow="Données" title="Aller plus loin" width="narrow">
          <ul className="mb-8 space-y-2">
            {liveVisible && <li><Link to={`${PATH}/resultats`} className={linkClass}>Résultats en direct de la présidentielle 2027</Link></li>}
            <li><Link to="/parrainages?year=2027" className={linkClass}>Parrainages de la présidentielle 2027</Link></li>
            <li><Link to="/sondages-presidentielle-2027" className={linkClass}>Sondages de la présidentielle 2027</Link></li>
            <li><Link to="/resultats-presidentielle-par-commune" className={linkClass}>Résultats de la présidentielle par commune</Link></li>
            <li><Link to="/presidentielle-2022" className={linkClass}>Résultats de la présidentielle 2022</Link></li>
            <li><Link to="/presidentielle-2017" className={linkClass}>Résultats de la présidentielle 2017</Link></li>
            <li>
              <a href={DEPENSES_DETTE_FRANCE_URL} target="_blank" rel="noopener" className={linkClass}>
                Dette et dépenses publiques de la France, un enjeu de la campagne ({DEPENSES_PUBLIQUES_NAME})
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            </li>
          </ul>
          <h3 className="mb-3 font-heading text-xl font-semibold">Trouver une commune</h3>
          <CommuneSearch onSelect={handleSelect} />
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
