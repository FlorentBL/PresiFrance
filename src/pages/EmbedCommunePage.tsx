import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EmbedFrame } from "@/components/embed/EmbedFrame";
import { fmtInt, fmtPct } from "@/components/commune/format";
import { getCommuneByCode } from "@/lib/api/geoApi";
import { getCommuneResults } from "@/lib/api/resultsApi";
import { getCandidateColor } from "@/lib/candidateColors";
import { isValidCommuneCode, parseEmbedYear } from "@/lib/embed";

/** Résultats d'une commune intégrables : participation et classement du 1er tour. */
export default function EmbedCommunePage() {
  const { code = "" } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const year = parseEmbedYear(params.get("year"));
  const valid = isValidCommuneCode(code);

  const { data: geo, isLoading: geoLoading } = useQuery({
    queryKey: ["geo-basic", code],
    queryFn: () => getCommuneByCode(code),
    enabled: valid,
  });
  const { data: results, isLoading } = useQuery({
    queryKey: ["results", code, 1, year],
    queryFn: () => getCommuneResults(code, 1, year),
    enabled: valid,
  });

  const sourcePath = valid ? `/commune/${code}?year=${year}` : "/explorer";
  const name = geo?.nom ?? results?.nomCommune ?? "Commune";
  const isDep = results?.niveau === "departement";

  return (
    <EmbedFrame title={valid ? `${name} — présidentielle ${year}, 1er tour` : "Commune introuvable"} sourcePath={sourcePath}>
      {!valid || (!isLoading && !geoLoading && !results) ? (
        <p role="alert" className="py-8 text-center text-sm text-muted-foreground">
          Résultats indisponibles pour cette commune et cette année.
        </p>
      ) : !results ? (
        <p role="status" className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <>
          {isDep && (
            <p className="mb-2 text-xs text-muted-foreground">
              Résultats du département {results.nomDepartement} (pas de données communales pour {year}).
            </p>
          )}
          <p className="mb-3 text-sm text-muted-foreground">
            Participation <strong className="text-foreground">{fmtPct(results.votantsPourcent)}</strong> · abstention{" "}
            <strong className="text-foreground">{fmtPct(results.abstentionsPourcent)}</strong> · {fmtInt(results.inscrits)} inscrits
          </p>
          <ol className="space-y-1.5">
            {results.candidates.map((c, i) => (
              <li key={`${c.nom}-${i}`} className="text-sm">
                <div className="flex justify-between gap-2">
                  <span className="truncate">{c.prenom} <span className="font-semibold uppercase">{c.nom}</span></span>
                  <span className="tabular-nums font-semibold">{fmtPct(c.pourcentExprimes)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, c.pourcentExprimes)}%`, background: getCandidateColor(c.prenom, c.nom, i) }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </EmbedFrame>
  );
}
