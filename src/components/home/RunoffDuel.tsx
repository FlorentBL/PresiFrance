import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CandidateAvatar, GlowCard, Section, SegmentedControl } from "@/components/design";
import { getCandidateColor } from "@/lib/candidateColors";
import { PRESIDENTIAL_YEARS_DESC, type PresidentialYear, type Round } from "@/lib/elections";
import { nf, useNationalAll } from "./homeData";

interface RunoffDuelProps {
  year: PresidentialYear;
  round: Round;
  onYearChange: (y: PresidentialYear) => void;
  onRoundChange: (r: Round) => void;
}

const YEAR_OPTIONS = PRESIDENTIAL_YEARS_DESC.map((y) => ({ value: y, label: String(y) }));
const ROUND_OPTIONS = [
  { value: 1 as Round, label: "1er tour" },
  { value: 2 as Round, label: "2nd tour" },
];

/** Face-à-face des deux premiers (barre) + podium national, pilotés par l'année (?year) et le tour. */
export default function RunoffDuel({ year, round, onYearChange, onRoundChange }: RunoffDuelProps) {
  const { data, isLoading } = useNationalAll();
  const reduce = useReducedMotion();
  const result = data?.[String(year)]?.[round === 1 ? "t1" : "t2"];
  const [a, b] = result?.candidates ?? [];
  const total = a && b ? a.pourcentExprimes + b.pourcentExprimes : 0;
  const leftPct = useMemo(() => (total ? (a.pourcentExprimes / total) * 100 : 50), [a, total]);

  return (
    <Section
      id="duel"
      width="default"
      eyebrow="Face-à-face"
      title={round === 2 ? "Le duel du 2nd tour" : "Les deux premiers du 1er tour"}
      description="Choisissez une élection : le rapport de force national se redessine."
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl label="Année de l'élection" options={YEAR_OPTIONS} value={year} onChange={onYearChange} size="sm" />
        <SegmentedControl label="Tour de scrutin" options={ROUND_OPTIONS} value={round} onChange={onRoundChange} size="sm" />
      </div>

      <GlowCard glow="red" interactive={false} className="p-6 sm:p-10">
        {isLoading || !result ? (
          <p className="py-16 text-center text-muted-foreground">{isLoading ? "Chargement des résultats…" : "Résultat national indisponible pour cette élection."}</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Présidentielle {year} · {round === 1 ? "1er" : "2nd"} tour
              </span>
              <span>Participation {result.participation.toFixed(1)} %</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${year}-${round}`}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
                  {[a, b].map((c, idx) => (
                    <div key={idx} className={`flex flex-col items-center gap-3 text-center ${idx === 1 ? "col-start-3" : "col-start-1"}`}>
                      <CandidateAvatar prenom={c.prenom} nom={c.nom} size="xl" color={getCandidateColor(c.prenom, c.nom, idx)} className="!h-24 !w-24 sm:!h-32 sm:!w-32" />
                      <p className="font-heading text-lg font-semibold leading-tight sm:text-2xl">
                        {c.prenom} <span className="whitespace-nowrap">{c.nom}</span>
                      </p>
                      <p className="font-heading text-3xl font-extrabold tabular-nums sm:text-5xl">{c.pourcentExprimes.toFixed(1)} %</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{nf.format(c.voix)} voix</p>
                    </div>
                  ))}
                  <span className="col-start-2 row-start-1 font-heading text-xl font-bold text-muted-foreground sm:text-3xl" aria-hidden="true">
                    VS
                  </span>
                </div>

                <div
                  className="relative mt-8 flex h-5 overflow-hidden rounded-full bg-muted ring-1 ring-border"
                  role="img"
                  aria-label={`${a.prenom} ${a.nom} ${a.pourcentExprimes.toFixed(1)} % contre ${b.prenom} ${b.nom} ${b.pourcentExprimes.toFixed(1)} %`}
                >
                  <div className="h-full transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${leftPct}%`, background: getCandidateColor(a.prenom, a.nom, 0) }} />
                  <div className="h-full flex-1" style={{ background: getCandidateColor(b.prenom, b.nom, 1) }} />
                  <span aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-background transition-[left] duration-700 motion-reduce:transition-none" style={{ left: `${leftPct}%` }} />
                </div>
              </motion.div>
            </AnimatePresence>

            {round === 1 && result.candidates.length > 2 && (
              <ol className="mt-8 space-y-2 border-t border-border pt-6">
                {result.candidates.slice(2, 5).map((c, i) => (
                  <li key={`${c.nom}-${i}`} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-xs font-bold text-muted-foreground">#{i + 3}</span>
                    <CandidateAvatar prenom={c.prenom} nom={c.nom} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {c.prenom} {c.nom}
                    </span>
                    <span className="font-bold tabular-nums text-primary">{c.pourcentExprimes.toFixed(1)} %</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-8 text-center">
              <Link to={`/presidentielle-${year}`} className="text-sm font-semibold text-primary hover:underline">
                Tous les résultats {year} →
              </Link>
            </div>
          </>
        )}
      </GlowCard>
    </Section>
  );
}
