import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import JsonLd from "@/components/JsonLd";
import SEOHead from "@/components/SEOHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { GlowCard, PageHero, Section, SegmentedControl } from "@/components/design";
import { decodeCompactRow } from "@/lib/api/compactResults";
import {
  getLiveCommunes,
  getLiveDepartments,
  getLiveNational,
  getLiveStatus,
  roundsWithResults,
  stateHeadline,
  type LiveRound,
  type LiveRoundStatus,
} from "@/lib/api/live2027Api";
import type { ElectionResult } from "@/lib/api/resultsApi";
import { ELECTION_2027 } from "@/lib/election2027";

const PATH = "/presidentielle-2027/resultats";
const REFRESH_MS = 60_000;
const nf = new Intl.NumberFormat("fr-FR");
const pf = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const selectClass = "h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm";

type Scope = "national" | "departement" | "commune";

const titleCase = (s: string) => s.toLocaleLowerCase("fr").replace(/(^|[\s'’-])(\p{L})/gu, (_, a, b) => a + b.toLocaleUpperCase("fr"));

function ResultsTable({ result, caption }: { result: ElectionResult; caption: string }) {
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left font-heading text-lg font-semibold">{caption}</caption>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th scope="col" className="py-2 pr-4">Candidat</th>
              <th scope="col" className="py-2 pr-4 text-right">Voix</th>
              <th scope="col" className="py-2 pr-4 text-right">% des exprimés</th>
              <th scope="col" className="py-2 text-right">% des inscrits</th>
            </tr>
          </thead>
          <tbody>
            {result.candidates.map((c) => (
              <tr key={`${c.nom}${c.prenom}`} className="border-b border-border/60">
                <th scope="row" className="py-2 pr-4 text-left font-medium">{c.prenom} {titleCase(c.nom)}</th>
                <td className="py-2 pr-4 text-right tabular-nums">{nf.format(c.voix)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{pf.format(c.pourcentExprimes)} %</td>
                <td className="py-2 text-right tabular-nums">{pf.format(c.pourcentInscrits)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Inscrits", nf.format(result.inscrits)],
          ["Votants", `${nf.format(result.votants)} (${pf.format(result.votantsPourcent)} %)`],
          ["Abstentions", `${nf.format(result.abstentions)} (${pf.format(result.abstentionsPourcent)} %)`],
          ["Blancs", nf.format(result.blancs)],
          ["Nuls", nf.format(result.nuls)],
          ["Exprimés", nf.format(result.exprimes)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Loading({ what }: { what: string }) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Chargement : {what}…
    </p>
  );
}

function DepartmentView({ round }: { round: LiveRound }) {
  const deps = useQuery({ queryKey: ["live2027-dep", round], queryFn: () => getLiveDepartments(round), refetchInterval: REFRESH_MS });
  const [code, setCode] = useState("");
  const options = useMemo(
    () => Object.entries(deps.data?.deps ?? {}).map(([k, v]) => ({ code: k, nom: v[1] })).sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [deps.data],
  );
  if (deps.isLoading) return <Loading what="départements" />;
  if (!deps.data) return <p className="text-destructive">Impossible de charger les départements.</p>;
  const result = code ? decodeCompactRow(deps.data, code) : null;
  const etat = code ? deps.data.etat[code] : null;
  return (
    <div className="space-y-6">
      <label className="block text-sm font-medium">
        Département
        <select className={`${selectClass} mt-1 block`} value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="">Choisir un département</option>
          {options.map((o) => <option key={o.code} value={o.code}>{o.nom} ({o.code})</option>)}
        </select>
      </label>
      {result && etat && (
        <>
          {etat !== "Complet" && <p role="status" className="text-sm font-medium">Décompte en cours dans ce département : les chiffres sont partiels.</p>}
          <ResultsTable result={result} caption={`${result.nomDepartement} : résultats du ${round === 1 ? "1er" : "2nd"} tour`} />
        </>
      )}
    </div>
  );
}

function CommuneView({ round }: { round: LiveRound }) {
  const deps = useQuery({ queryKey: ["live2027-dep", round], queryFn: () => getLiveDepartments(round), refetchInterval: REFRESH_MS });
  const [dep, setDep] = useState("");
  const [commune, setCommune] = useState("");
  const communes = useQuery({
    queryKey: ["live2027-communes", round, dep],
    queryFn: () => getLiveCommunes(round, dep),
    enabled: dep !== "",
    refetchInterval: REFRESH_MS,
  });
  const options = useMemo(
    () => Object.entries(communes.data?.rows ?? {}).map(([k, r]) => ({ code: k, nom: r[0] })).sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [communes.data],
  );
  const depOptions = useMemo(
    () => Object.entries(deps.data?.deps ?? {}).map(([k, v]) => ({ code: k, nom: v[1] })).sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [deps.data],
  );
  if (deps.isLoading) return <Loading what="départements" />;
  const result = communes.data && commune ? decodeCompactRow(communes.data, commune) : null;
  return (
    <div className="space-y-6">
      <label className="block text-sm font-medium">
        Département
        <select className={`${selectClass} mt-1 block`} value={dep} onChange={(e) => { setDep(e.target.value); setCommune(""); }}>
          <option value="">Choisir un département</option>
          {depOptions.map((o) => <option key={o.code} value={o.code}>{o.nom} ({o.code})</option>)}
        </select>
      </label>
      {dep && communes.isLoading && <Loading what="communes" />}
      {dep && !communes.isLoading && options.length === 0 && (
        <p role="status" className="text-sm">Aucune commune de ce département n'a encore publié son décompte.</p>
      )}
      {options.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {nf.format(options.length)} commune{options.length > 1 ? "s" : ""} avec décompte terminé dans ce département ; les autres s'ajoutent au fil de la soirée.
          </p>
          <label className="block text-sm font-medium">
            Commune
            <select className={`${selectClass} mt-1 block`} value={commune} onChange={(e) => setCommune(e.target.value)}>
              <option value="">Choisir une commune</option>
              {options.map((o) => <option key={o.code} value={o.code}>{o.nom}</option>)}
            </select>
          </label>
        </>
      )}
      {result && (
        <>
          <ResultsTable result={result} caption={`${result.nomCommune} : résultats du ${round === 1 ? "1er" : "2nd"} tour`} />
          <p className="text-sm">
            <Link to={`/commune/${result.codeCommune}`} className="font-medium text-primary hover:underline">
              Historique de {result.nomCommune} aux présidentielles précédentes
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

function Banner({ s, round }: { s: LiveRoundStatus; round: LiveRound }) {
  const when = new Date(s.fetchedAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });
  return (
    <GlowCard className="p-5">
      <p className="font-heading text-xl font-semibold" role="status">
        {round === 1 ? "1er tour" : "2nd tour"} : {stateHeadline(s)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Décomptes publiés par le ministère de l'Intérieur, relevés le <time dateTime={s.fetchedAt}>{when}</time> (heure de Paris) ;{" "}
        {nf.format(s.communesCompletes)} communes sur {nf.format(s.communesTotal)} ont terminé leur décompte.
        {s.source.url ? (
          <> Source : <a href={s.source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{s.source.label}</a>.</>
        ) : (
          <> Source : {s.source.label}.</>
        )}{" "}
        Ce sont des chiffres provisoires, sans aucune estimation ni projection ; seul le Conseil constitutionnel proclame les résultats définitifs.
      </p>
    </GlowCard>
  );
}

export default function Resultats2027Page() {
  const [params, setParams] = useSearchParams();
  const status = useQuery({
    queryKey: ["live2027-status"],
    queryFn: getLiveStatus,
    refetchInterval: (q) => (q.state.data?.current ? REFRESH_MS : false),
  });
  const available = status.data ? roundsWithResults(status.data) : [];
  const wanted = Number(params.get("tour"));
  const round = (available.includes(wanted as LiveRound) ? wanted : status.data?.current ?? 1) as LiveRound;
  const [scope, setScope] = useState<Scope>("national");
  const roundStatus = status.data?.rounds[`t${round}`];
  const live = roundStatus && roundStatus.state !== "avenir" ? roundStatus : null;
  const national = useQuery({
    queryKey: ["live2027-national", round],
    queryFn: () => getLiveNational(round),
    enabled: live !== null,
    refetchInterval: REFRESH_MS,
  });

  useEffect(() => {
    if (status.data?.current && !params.get("tour")) setParams({ tour: String(status.data.current) }, { replace: true });
  }, [status.data, params, setParams]);

  const firstRound = ELECTION_2027.firstRoundDate
    ? new Date(`${ELECTION_2027.firstRoundDate}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "avril 2027";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Résultats en direct de la présidentielle 2027"
        description="Résultats de la présidentielle 2027 le soir du scrutin : national, département et commune, avec le taux de décompte, l'horodatage et la source officielle."
        path={PATH}
      />
      <JsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Présidentielle 2027", path: "/presidentielle-2027" },
          { name: "Résultats en direct", path: PATH },
        ]}
      />
      <SiteHeader />
      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Soirée électorale 2027"
          title="Présidentielle 2027 : résultats en direct"
          description={`Le soir de chaque tour, cette page reprend les résultats provisoires publiés par le ministère de l'Intérieur, du national à la commune. Le 1er tour a lieu le ${firstRound}. Aucune estimation n'est présentée comme un résultat.`}
          actions={
            available.length > 1 ? (
              <SegmentedControl
                label="Tour de scrutin"
                options={available.map((r) => ({ value: r, label: r === 1 ? "1er tour" : "2nd tour" }))}
                value={round}
                onChange={(r) => setParams({ tour: String(r) })}
              />
            ) : undefined
          }
        />
        <Section width="default">
          {status.isLoading && <Loading what="statut des résultats" />}
          {status.isError && <p className="text-destructive">Impossible de charger le statut des résultats en direct.</p>}
          {status.data && !live && (
            <GlowCard className="p-5">
              <p className="font-heading text-xl font-semibold" role="status">Résultats à venir</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Aucun résultat n'est encore publié. Les résultats provisoires apparaîtront ici dès que le ministère de l'Intérieur les diffusera, le soir du scrutin.
                En attendant : <Link to="/presidentielle-2027" className="text-primary hover:underline">candidats et calendrier</Link>,{" "}
                <Link to="/sondages-presidentielle-2027" className="text-primary hover:underline">sondages</Link> et{" "}
                <Link to="/presidentielle-2022" className="text-primary hover:underline">résultats de 2022</Link>.
              </p>
            </GlowCard>
          )}
          {live && (
            <div className="space-y-8">
              <Banner s={live} round={round} />
              <SegmentedControl
                label="Niveau géographique"
                options={[
                  { value: "national", label: "National" },
                  { value: "departement", label: "Département" },
                  { value: "commune", label: "Commune" },
                ]}
                value={scope}
                onChange={(v) => setScope(v as Scope)}
              />
              {scope === "national" && (
                <>
                  {national.isLoading && <Loading what="résultats nationaux" />}
                  {national.data && <ResultsTable result={national.data} caption="France entière (métropole, outre-mer et Français de l'étranger)" />}
                  {national.isError && <p className="text-destructive">Impossible de charger les résultats nationaux.</p>}
                </>
              )}
              {scope === "departement" && <DepartmentView round={round} />}
              {scope === "commune" && <CommuneView round={round} />}
            </div>
          )}
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
