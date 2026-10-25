import { Link } from "react-router-dom";
import { BarChart3, Database, GitCompare, MapPin, Search, ShieldCheck } from "lucide-react";

import CommuneSearch from "@/components/CommuneSearch";
import JsonLd from "@/components/JsonLd";
import SEOHead from "@/components/SEOHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_YEAR } from "@/lib/elections";
import type { GeoCommune } from "@/lib/api/geoApi";

export default function ResultatsParCommunePage() {
  const handleSelect = (commune: GeoCommune) => {
    window.location.href = `/commune/${commune.code}?year=${DEFAULT_YEAR}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Résultats présidentielle par commune"
        description="Trouvez les résultats d'une élection présidentielle par commune : scores des candidats, participation, abstention et données officielles locales."
        path="/resultats-presidentielle-par-commune"
      />
      <JsonLd
        path="/resultats-presidentielle-par-commune"
        breadcrumbs={[
          { name: "Résultats présidentielle", path: "/resultats-presidentielle" },
          { name: "Résultats par commune", path: "/resultats-presidentielle-par-commune" },
        ]}
      />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1 container max-w-6xl mx-auto px-4 py-10">
        <header className="max-w-3xl mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Recherche locale</p>
          <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight mb-4">
            Résultats présidentielle par commune
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Recherchez une ville ou un village pour consulter les résultats présidentiels disponibles : scores des candidats, participation, abstention, évolution dans le temps et comparaison locale.
          </p>
        </header>

        <section className="mb-12 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black tracking-tight">Trouver une commune</h2>
          </div>
          <CommuneSearch onSelect={handleSelect} />
          <p className="text-sm text-muted-foreground mt-4">
            Par défaut, la recherche ouvre les résultats de la présidentielle {DEFAULT_YEAR}. Le sélecteur d'année permet ensuite de consulter les autres scrutins disponibles.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Une intention locale
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Chaque page commune répond à une recherche précise : connaître les résultats d'une présidentielle dans une ville donnée.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Scores et participation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Les fiches locales affichent les voix, les pourcentages, la participation et l'abstention quand les données sont disponibles.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Database className="h-5 w-5 text-primary" />
                Données officielles
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              PrésiFrance organise des données publiques issues de sources officielles pour faciliter l'exploration citoyenne.
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-12">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-2xl font-black tracking-tight mb-4">Comment trouver un résultat par commune ?</h2>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li><strong className="text-foreground">1.</strong> Recherchez le nom de la commune dans le champ dédié.</li>
              <li><strong className="text-foreground">2.</strong> Ouvrez la fiche locale pour consulter les scores des candidats.</li>
              <li><strong className="text-foreground">3.</strong> Changez d'année ou comparez avec une autre commune si besoin.</li>
            </ol>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-2xl font-black tracking-tight mb-4">Questions fréquentes</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Peut-on comparer deux communes ?</strong><br />
                Oui, l'outil de comparaison permet de mettre deux communes côte à côte.
              </p>
              <p>
                <strong className="text-foreground">Les données sont-elles officielles ?</strong><br />
                Les résultats sont structurés à partir de données publiques officielles quand elles sont disponibles.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link to="/resultats-presidentielle" className="block">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Voir le hub résultats
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Revenir à la page mère qui organise les présidentielles par année, commune et département.
              </CardContent>
            </Card>
          </Link>
          <Link to="/explorer" className="block">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Explorer par département
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Parcourir les communes via les départements lorsque vous ne partez pas d'une recherche directe.
              </CardContent>
            </Card>
          </Link>
          <Link to="/comparer" className="block">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <GitCompare className="h-5 w-5 text-primary" />
                  Comparer deux communes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Mesurer les écarts de participation et de vote entre deux territoires.
              </CardContent>
            </Card>
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
