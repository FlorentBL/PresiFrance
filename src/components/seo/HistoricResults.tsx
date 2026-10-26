import { Link } from "react-router-dom";

import { Section } from "@/components/design";
import type { NationalResult } from "@/lib/api/nationalResultsApi";
import { getDepartmentName } from "@/lib/departments";
import {
  abstention,
  candidateName,
  fmtInt,
  fmtPct,
  TOP_COMMUNES,
  YEAR_FACTS,
  yearSummary,
  yearsAsc,
  type NationalByYear,
} from "@/lib/yearContent";
import { useHubFaq, useNationalAll, useYearFaq } from "@/lib/yearQueries";

const linkClass = "text-primary hover:underline";

function RoundTable({ year, round, data }: { year: number; round: 1 | 2; data: NationalResult }) {
  const label = round === 1 ? "1er tour" : "2nd tour";
  return (
    <Section eyebrow={label} title={`Résultats du ${label} de la présidentielle ${year}`} width="narrow" className="pt-0 sm:pt-0">
      <p className="mb-4 text-muted-foreground">
        Participation : {fmtPct(data.participation)} ; abstention : {fmtPct(abstention(data.participation))}.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{`Résultats nationaux du ${label} ${year}`}</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-4">Candidat</th>
              <th scope="col" className="py-2 pr-4">Voix</th>
              <th scope="col" className="py-2">% des exprimés</th>
            </tr>
          </thead>
          <tbody>
            {data.candidates.map((c) => (
              <tr key={`${c.prenom}${c.nom}`} className="border-b border-border/50">
                <th scope="row" className="py-2 pr-4 font-medium">{candidateName(c)}</th>
                <td className="py-2 pr-4 tabular-nums">{fmtInt(c.voix)}</td>
                <td className="py-2 tabular-nums">{fmtPct(c.pourcentExprimes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function FaqSection({ faq }: { faq: { q: string; a: string }[] }) {
  if (faq.length === 0) return null;
  return (
    <Section eyebrow="FAQ" title="Questions fréquentes" width="narrow" className="pt-0 sm:pt-0">
      {faq.map((f) => (
        <div key={f.q} className="mb-6 last:mb-0">
          <h3 className="font-heading text-lg font-semibold">{f.q}</h3>
          <p className="mt-2 text-muted-foreground">{f.a}</p>
        </div>
      ))}
    </Section>
  );
}

function TopCommunes() {
  return (
    <Section eyebrow="Communes" title="Résultats dans les grandes communes" width="narrow" className="pt-0 sm:pt-0">
      <p className="mb-3 text-muted-foreground">Les résultats des présidentielles sont aussi consultables dans les plus grandes communes de France :</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {TOP_COMMUNES.map((c) => (
          <li key={c.code}><Link to={`/commune/${c.code}`} className={linkClass}>Résultats à {c.nom}</Link></li>
        ))}
      </ul>
    </Section>
  );
}

/** Corps enrichi de /presidentielle-AAAA : tableaux des deux tours, départements, grandes communes, FAQ, autres années. */
export function YearResults({ year }: { year: number }) {
  const { data } = useNationalAll();
  const s = data ? yearSummary(year, data as NationalByYear) : null;
  const yf = YEAR_FACTS[year];
  const faq = useYearFaq(year);
  if (!data || !s || !yf) return null;
  const others = yearsAsc(data as NationalByYear).filter((y) => y !== year);
  return (
    <>
      <RoundTable year={year} round={1} data={s.t1} />
      <RoundTable year={year} round={2} data={s.t2} />
      <Section eyebrow="Départements" title={`Résultats de la présidentielle ${year} par département`} width="narrow" className="pt-0 sm:pt-0">
        <p className="mb-3 text-muted-foreground">Choisissez un département pour afficher les scores des candidats, la participation et l'abstention locales.</p>
        <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {yf.deps.map((c) => (
            <li key={c}><Link to={`/explorer/${c}`} className={linkClass}>{getDepartmentName(c)} ({c})</Link></li>
          ))}
        </ul>
      </Section>
      <TopCommunes />
      <FaqSection faq={faq} />
      <Section eyebrow="Archives" title="Les autres élections présidentielles" width="narrow" className="pt-0 sm:pt-0">
        <ul className="grid gap-2 sm:grid-cols-2">
          {others.map((y) => (
            <li key={y}><Link to={`/presidentielle-${y}`} className={linkClass}>Résultats de la présidentielle {y}</Link></li>
          ))}
        </ul>
        <p className="mt-4"><Link to="/resultats-presidentielle" className={linkClass}>Toutes les élections présidentielles</Link></p>
      </Section>
    </>
  );
}

/** Corps enrichi de /resultats-presidentielle : tableau de toutes les élections, grandes communes, FAQ. */
export function HubResults() {
  const { data } = useNationalAll();
  const faq = useHubFaq();
  if (!data) return null;
  const rows = yearsAsc(data as NationalByYear)
    .map((y) => yearSummary(y, data as NationalByYear))
    .filter((r) => r !== null)
    .reverse();
  return (
    <>
      <Section eyebrow="Synthèse" title="Résultats de chaque élection présidentielle" className="pt-0 sm:pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Élu, finaliste, participation et nombre de candidats par présidentielle</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4">Année</th>
                <th scope="col" className="py-2 pr-4">Élu</th>
                <th scope="col" className="py-2 pr-4">Score au 2nd tour</th>
                <th scope="col" className="py-2 pr-4">Finaliste</th>
                <th scope="col" className="py-2 pr-4">Score du finaliste</th>
                <th scope="col" className="py-2 pr-4">Participation 1er tour</th>
                <th scope="col" className="py-2 pr-4">Participation 2nd tour</th>
                <th scope="col" className="py-2">Candidats au 1er tour</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} className="border-b border-border/50">
                  <th scope="row" className="py-2 pr-4 font-medium"><Link to={`/presidentielle-${r.year}`} className={linkClass}>{r.year}</Link></th>
                  <td className="py-2 pr-4">{candidateName(r.winner)}</td>
                  <td className="py-2 pr-4 tabular-nums">{fmtPct(r.winner.pourcentExprimes)}</td>
                  <td className="py-2 pr-4">{candidateName(r.runnerUp)}</td>
                  <td className="py-2 pr-4 tabular-nums">{fmtPct(r.runnerUp.pourcentExprimes)}</td>
                  <td className="py-2 pr-4 tabular-nums">{fmtPct(r.t1.participation)}</td>
                  <td className="py-2 pr-4 tabular-nums">{fmtPct(r.t2.participation)}</td>
                  <td className="py-2 tabular-nums">{YEAR_FACTS[r.year]?.candidatsT1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <TopCommunes />
      <FaqSection faq={faq} />
    </>
  );
}
