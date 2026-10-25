import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { PageHero, Section, SegmentedControl } from "@/components/design";
import CommuneSearch from "@/components/CommuneSearch";
import JsonLd from "@/components/JsonLd";
import SEOHead from "@/components/SEOHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { toast } from "@/components/ui/sonner";
import { DEFAULT_YEAR, PRESIDENTIAL_YEARS_DESC, type PresidentialYear } from "@/lib/elections";
import {
  EMBED_DEFAULT_HEIGHT,
  buildEmbedPath,
  buildIframeCode,
  type EmbedKind,
  type EmbedOptions,
} from "@/lib/embed";

const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

export default function IntegrerPage() {
  const [kind, setKind] = useState<EmbedKind>("carte");
  const [year, setYear] = useState<PresidentialYear>(DEFAULT_YEAR);
  const [commune, setCommune] = useState<{ code: string; nom: string } | null>(null);
  const [height, setHeight] = useState<number>(EMBED_DEFAULT_HEIGHT.carte);
  const [copied, setCopied] = useState(false);

  const ready = kind === "carte" || !!commune;
  const opts: EmbedOptions = { kind, year, round: 1, code: commune?.code, height };
  const code = ready ? buildIframeCode(opts) : "";
  const previewSrc = ready ? buildEmbedPath(opts) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copié dans le presse-papier");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible : sélectionnez le code manuellement");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Intégrer nos cartes et résultats sur votre site"
        description="Médias, blogs locaux : intégrez gratuitement les cartes et résultats de la présidentielle de PrésiFrance sur votre site avec un simple code iframe."
        path="/integrer"
      />
      <JsonLd path="/integrer" breadcrumbs={[{ name: "Intégrer", path: "/integrer" }]} />
      <SiteHeader />
      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Médias et blogs locaux"
          title="Intégrer nos cartes et résultats"
          description="Insérez la carte des départements ou les résultats d'une commune dans votre article. Le rendu est léger, sans publicité, et renvoie vers PrésiFrance."
        />

        <Section eyebrow="Générateur" title="Générer le code d'intégration" width="default">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <SegmentedControl<EmbedKind>
                label="Type d'intégration"
                value={kind}
                onChange={(k) => {
                  setKind(k);
                  setHeight(EMBED_DEFAULT_HEIGHT[k]);
                }}
                options={[
                  { value: "carte", label: "Carte" },
                  { value: "commune", label: "Commune" },
                ]}
              />
              <div>
                <label htmlFor="embed-year" className="mb-1 block text-sm font-medium">Année de l'élection</label>
                <select id="embed-year" className={field} value={year} onChange={(e) => setYear(Number(e.target.value) as PresidentialYear)}>
                  {PRESIDENTIAL_YEARS_DESC.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {kind === "commune" && (
                <div>
                  <p className="mb-1 text-sm font-medium">Commune</p>
                  <CommuneSearch onSelect={(c) => setCommune({ code: c.code, nom: c.nom })} />
                  <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                    {commune ? `Sélection : ${commune.nom} (${commune.code})` : "Recherchez puis sélectionnez une commune."}
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="embed-height" className="mb-1 block text-sm font-medium">Hauteur (pixels)</label>
                <input
                  id="embed-height"
                  type="number"
                  min={300}
                  max={1200}
                  step={10}
                  className={field}
                  value={height}
                  onChange={(e) => setHeight(Math.min(1200, Math.max(300, Number(e.target.value) || 300)))}
                />
              </div>
              <div>
                <label htmlFor="embed-code" className="mb-1 block text-sm font-medium">Code à copier</label>
                <textarea
                  id="embed-code"
                  readOnly
                  rows={6}
                  className={`${field} font-mono text-xs`}
                  value={code || "Sélectionnez d'abord une commune."}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={copy}
                  disabled={!ready}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  Copier le code
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Aperçu</h3>
              {ready ? (
                <iframe
                  key={previewSrc}
                  src={previewSrc}
                  title="Aperçu de l'intégration"
                  width="100%"
                  height={height}
                  className="max-w-full rounded-lg border border-border"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  L'aperçu apparaît après le choix d'une commune.
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section eyebrow="Conditions" title="Bon à savoir" width="narrow">
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>L'intégration est gratuite ; le lien « Source : PrésiFrance » affiché dans le cadre doit rester visible.</li>
            <li>La carte indique le candidat arrivé en tête au 1er tour dans chaque département métropolitain.</li>
            <li>Les résultats par commune sont disponibles pour les scrutins publiés par commune ; pour les plus anciens, le cadre affiche le département.</li>
            <li>Les cadres intégrés ne sont pas indexés par les moteurs de recherche et ne déposent aucun traceur propre.</li>
            <li>Données : sources officielles en open data (data.gouv.fr), voir les mentions légales.</li>
          </ul>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
