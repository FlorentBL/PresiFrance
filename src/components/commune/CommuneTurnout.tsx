import { AnimatedNumber, BentoGrid, BentoItem, GlowCard } from "@/components/design";
import type { ElectionResult } from "@/lib/api/resultsApi";
import { fmtInt } from "./format";

function Meter({ value, tone }: { value: number; tone: "blue" | "red" | "white" }) {
  const cls = tone === "blue" ? "bg-primary" : tone === "red" ? "bg-tri-red" : "bg-foreground/60";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted" role="presentation">
      <div className={`h-full rounded-full ${cls}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/** Participation, abstention, blancs/nuls. */
export function CommuneTurnout({ results }: { results: ElectionResult }) {
  const blancsNuls = results.blancs + results.nuls;
  const blancsNulsPct = results.votants > 0 ? (blancsNuls / results.votants) * 100 : 0;
  return (
    <BentoGrid>
      <BentoItem span={2}>
        <GlowCard glow="blue" className="h-full p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Participation</p>
          <p className="mt-3 font-heading text-5xl font-extrabold tabular-nums"><AnimatedNumber value={results.votantsPourcent} decimals={1} suffix=" %" /></p>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">{fmtInt(results.votants)} votants sur {fmtInt(results.inscrits)} inscrits</p>
          <Meter value={results.votantsPourcent} tone="blue" />
        </GlowCard>
      </BentoItem>
      <BentoItem span={2}>
        <GlowCard glow="red" className="h-full p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tri-red">Abstention</p>
          <p className="mt-3 font-heading text-5xl font-extrabold tabular-nums"><AnimatedNumber value={results.abstentionsPourcent} decimals={1} suffix=" %" /></p>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">{fmtInt(results.abstentions)} inscrits n'ont pas voté</p>
          <Meter value={results.abstentionsPourcent} tone="red" />
        </GlowCard>
      </BentoItem>
      <BentoItem span={2}>
        <GlowCard glow="white" className="h-full p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Blancs &amp; nuls</p>
          <p className="mt-3 font-heading text-5xl font-extrabold tabular-nums"><AnimatedNumber value={blancsNuls} /></p>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">{blancsNulsPct.toFixed(1).replace(".", ",")} % des votants</p>
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted" role="presentation">
            <div className="bg-foreground/70" style={{ width: `${results.blancsPourcentVotants}%` }} />
            <div className="bg-foreground/35" style={{ width: `${results.nulsPourcentVotants}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Blancs {fmtInt(results.blancs)} · Nuls {fmtInt(results.nuls)}</p>
        </GlowCard>
      </BentoItem>
    </BentoGrid>
  );
}

export default CommuneTurnout;
