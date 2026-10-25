import { useEffect, useState } from "react";
import type { ParrainageEntry } from "@/lib/api/parrainagesApi";

const PAGE = 50;

/** Liste des parrains : tableau dès `md`, cartes empilées sur mobile. Affichage progressif. */
export function SponsorList({ entries }: { entries: ParrainageEntry[] }) {
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [entries]);
  const rows = entries.slice(0, shown);

  return (
    <div>
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Parrain</th>
                <th scope="col" className="px-4 py-3 font-semibold">Mandat</th>
                <th scope="col" className="px-4 py-3 font-semibold">Commune / Circonscription</th>
                <th scope="col" className="px-4 py-3 font-semibold">Département</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={i} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{p.prenom} {p.nom}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.mandat}</td>
                  <td className="px-4 py-2.5">{p.circonscription || "—"}</td>
                  <td className="px-4 py-2.5">{p.dep || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-2 md:hidden">
        {rows.map((p, i) => (
          <li key={i} className="rounded-xl border border-border bg-card/60 p-3">
            <p className="font-medium">{p.prenom} {p.nom}</p>
            <p className="text-xs text-muted-foreground">{p.mandat}</p>
            <p className="mt-1 text-sm">
              {p.circonscription || "—"} <span className="text-muted-foreground">· {p.dep || "—"}</span>
            </p>
          </li>
        ))}
      </ul>

      {shown < entries.length && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE)}
          className="mx-auto mt-4 flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium hover:border-primary/50"
        >
          Afficher plus ({entries.length - shown} restants)
        </button>
      )}
    </div>
  );
}
