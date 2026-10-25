import { AnimatedNumber, GlowCard, Reveal, Section } from "@/components/design";
import { useNationalAll } from "./homeData";

/** Chiffres clés animés. Voix et participation viennent du 1er tour de 2022 (national-results.json). */
export default function StatsStrip() {
  const { data } = useNationalAll();
  const t1 = data?.["2022"]?.t1;
  const voix = t1 ? t1.candidates.reduce((s, c) => s + c.voix, 0) : 0;

  const stats = [
    { label: "voix exprimées au 1er tour 2022", value: voix / 1e6, decimals: 1, suffix: " M", glow: "blue" as const, show: voix > 0 },
    { label: "de participation au 1er tour 2022", value: t1?.participation ?? 0, decimals: 1, suffix: " %", glow: "red" as const, show: !!t1 },
    { label: "communes explorables", value: 35000, decimals: 0, suffix: "+", glow: "white" as const, show: true },
    { label: "élections présidentielles depuis 1965", value: 11, decimals: 0, suffix: "", glow: "blue" as const, show: true },
  ];

  return (
    <Section width="wide" className="py-10 sm:py-14" id="chiffres-cles">
      <h2 className="sr-only">Chiffres clés</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <GlowCard glow={s.glow} className="h-full">
              <dl className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-muted-foreground">{s.label}</dt>
              <dd className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl xl:text-5xl">
                {s.show ? <AnimatedNumber value={s.value} decimals={s.decimals} suffix={s.suffix} /> : <span aria-hidden="true">—</span>}
              </dd>
              </dl>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
