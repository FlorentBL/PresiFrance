import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { CandidateAvatar, Reveal, Section } from "@/components/design";
import { getCandidateColor } from "@/lib/candidateColors";
import { PRESIDENTIAL_YEARS_DESC } from "@/lib/elections";
import { useNationalAll } from "./homeData";

const YEARS_ASC = [...PRESIDENTIAL_YEARS_DESC].reverse();

/** Frise 1965 → 2022 : l'élu, son adversaire et le score du 2nd tour, avec une ligne qui se dessine au scroll. */
export default function ElectionTimeline() {
  const { data } = useNationalAll();
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <Section
      id="frise"
      width="default"
      eyebrow="1965 → 2022"
      title="Onze élections, onze élus"
      description="Remontez le temps : le vainqueur de chaque 2nd tour, son adversaire et l'écart final."
    >
      <div className="relative">
        <div aria-hidden="true" className="absolute bottom-0 left-5 top-0 w-px bg-border md:left-1/2" />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0 left-5 top-0 w-px origin-top bg-gradient-to-b from-tri-blue via-tri-white to-tri-red md:left-1/2"
          style={{ scaleY: reduce ? 1 : scaleY }}
        />
        <ol ref={ref} className="relative space-y-10 sm:space-y-14">
          {YEARS_ASC.map((year, i) => {
            const t2 = data?.[String(year)]?.t2;
            const [winner, loser] = t2?.candidates ?? [];
            const left = i % 2 === 0;
            return (
              <li key={year} className="relative pl-14 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
                <span
                  aria-hidden="true"
                  className="absolute left-5 top-6 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-glow-blue ring-4 ring-background md:left-1/2"
                />
                <Reveal className={left ? "md:col-start-1 md:text-right" : "md:col-start-2"} y={20}>
                  <Link
                    to={`/presidentielle-${year}`}
                    className="group block rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-sm transition-colors hover:border-primary/50"
                  >
                    <p className="font-heading text-4xl font-extrabold tabular-nums text-primary sm:text-5xl">{year}</p>
                    {winner ? (
                      <>
                        <div className={`mt-4 flex items-center gap-4 ${left ? "md:flex-row-reverse" : ""}`}>
                          <CandidateAvatar
                            prenom={winner.prenom}
                            nom={winner.nom}
                            size="lg"
                            color={getCandidateColor(winner.prenom, winner.nom, 0)}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Élu</p>
                            <p className="font-heading text-xl font-semibold leading-tight sm:text-2xl">
                              {winner.prenom} {winner.nom}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                          <span className="font-bold tabular-nums text-foreground">{winner.pourcentExprimes.toFixed(1)} %</span>
                          {loser && (
                            <>
                              {" "}
                              contre <span className="tabular-nums">{loser.pourcentExprimes.toFixed(1)} %</span> pour {loser.prenom} {loser.nom}
                            </>
                          )}{" "}
                          au 2nd tour
                        </p>
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
                    )}
                    <p className="mt-3 text-sm font-semibold text-primary group-hover:underline">Résultats {year} →</p>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
