import { Link } from "react-router-dom";
import { CalendarClock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/design";
import { getLiveStatus, isLiveVisible } from "@/lib/api/live2027Api";
import { ELECTION_2027, daysUntilFirstRound } from "@/lib/election2027";

/** Encart du hero : compte à rebours si la date du 1er tour est officielle, sinon « printemps 2027 ». */
export function ElectionCountdown() {
  const days = daysUntilFirstRound();
  return (
    <div className="glass w-full rounded-3xl p-6 text-center lg:w-80">
      <CalendarClock className="mx-auto mb-3 h-7 w-7 text-primary" aria-hidden="true" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">1er tour</p>
      {days !== null ? (
        <>
          <p className="mt-2 font-heading text-5xl font-extrabold tabular-nums">{days}</p>
          <p className="text-sm text-muted-foreground">jour{days > 1 ? "s" : ""} avant le 1er tour</p>
          {ELECTION_2027.firstRoundDate && (
            <p className="mt-2 text-sm font-medium first-letter:uppercase">
              {new Date(`${ELECTION_2027.firstRoundDate}T12:00:00`).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 font-heading text-3xl font-extrabold capitalize">{ELECTION_2027.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">Date officielle à confirmer</p>
        </>
      )}
    </div>
  );
}

const LIVE_ENTRY = {
  to: "/presidentielle-2027/resultats",
  title: "Résultats en direct",
  text: "Les résultats provisoires de la soirée électorale, du national à la commune.",
} as const;

const ENTRIES = [
  { to: "/presidentielle-2027", title: "Présidentielle 2027", text: "Le hub de la campagne : candidats, calendrier et repères." },
  { to: "/parrainages?year=2027", title: "Parrainages 2027", text: "Qui parraine qui, par département, au fil de la collecte." },
  { to: "/sondages-presidentielle-2027", title: "Sondages 2027", text: "Les intentions de vote publiées, avec leurs sources." },
] as const;

/** Entrées vers les contenus 2027. */
export default function Home2027() {
  const live = useQuery({ queryKey: ["live2027-status"], queryFn: getLiveStatus, staleTime: 60 * 1000 });
  const entries = isLiveVisible(live.data) ? [LIVE_ENTRY, ...ENTRIES] : ENTRIES;
  return (
    <section aria-labelledby="entrees-2027" className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <h2 id="entrees-2027" className="sr-only">Suivre la présidentielle 2027</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {entries.map((e, i) => (
            <li key={e.to}>
              <Reveal delay={i * 0.08} className="h-full">
                <Link
                  to={e.to}
                  className="group block h-full rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <h3 className="font-heading text-xl font-semibold">{e.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Ouvrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
