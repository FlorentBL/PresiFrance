import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEOHead from "@/components/SEOHead";

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Politique de confidentialité" path="/politique-de-confidentialite" />
      <SiteHeader />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        <h1 className="text-3xl font-black font-heading text-foreground mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 8 mars 2026</p>

        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données collectées sur PrésiFrance est Florent Bonnet-Ligeon (FBL Digital), Entrepreneur Individuel, domicilié au 15 impasse du pré vert, 38300 Succieu. Contact : <a href="mailto:contact@fbldigital.fr" className="text-primary hover:underline">contact@fbldigital.fr</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">2. Données collectées</h2>
            <p>
              PrésiFrance est un site de consultation de données publiques qui ne requiert aucune inscription ni création de compte. Les données que nous pouvons être amenés à collecter sont :
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Stockage local</strong> : l'historique de recherche de communes est stocké uniquement dans le navigateur de l'utilisateur (localStorage) et n'est jamais transmis à nos serveurs</li>
              <li><strong>Données de navigation</strong> : adresse IP, type de navigateur, pages consultées, date et heure de visite (via logs serveur)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">3. Finalités du traitement</h2>
            <p>Les données collectées sont utilisées pour :</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Améliorer l'expérience utilisateur</li>
              <li>Établir des statistiques de fréquentation anonymes</li>
              <li>Assurer le bon fonctionnement technique du site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">4. Cookies</h2>
            <p>
              Le site utilise des cookies strictement nécessaires au fonctionnement (préférence de thème) ainsi que des outils de mesure d'audience pour établir des statistiques anonymes de navigation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">5. Partage des données</h2>
            <p>
              Nous ne vendons, ne louons et ne partageons aucune donnée personnelle avec des tiers. Les seuls tiers ayant potentiellement accès aux données de navigation sont :
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Outils de mesure d'audience — statistiques anonymes</li>
              <li>Cloudflare, Inc. — hébergeur du site et mesure d'audience sans cookie</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">6. Durée de conservation</h2>
            <p>
              Les logs serveur sont conservés pour une durée maximale de 12 mois. L'historique de recherche stocké dans votre navigateur est conservé jusqu'à ce que vous le supprimiez manuellement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">7. Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Droit d'opposition</li>
              <li>Droit à la portabilité</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à l'effacement</li>
              <li>Droit de rectification</li>
              <li>Droit d'accès à vos données</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à <a href="mailto:contact@fbldigital.fr" className="text-primary hover:underline">contact@fbldigital.fr</a>. Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CNIL</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">8. Modifications</h2>
            <p>
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
