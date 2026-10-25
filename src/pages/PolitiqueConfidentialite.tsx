import { LegalLayout } from "@/components/legal/LegalLayout";

export default function PolitiqueConfidentialite() {
  return (
    <LegalLayout
      seoTitle="Politique de confidentialité"
      path="/politique-de-confidentialite"
      eyebrow="Vos données"
      title="Politique de confidentialité"
      updated="Dernière mise à jour : 8 mars 2026"
    >
      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données collectées sur PrésiFrance
          est Florent Bonnet-Ligeon (FBL Digital), Entrepreneur Individuel,
          domicilié au 15 impasse du pré vert, 38300 Succieu. Contact :{" "}
          <a href="mailto:contact@fbldigital.fr">contact@fbldigital.fr</a>.
        </p>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <p>
          PrésiFrance est un site de consultation de données publiques qui ne
          requiert aucune inscription ni création de compte. Les données que
          nous pouvons être amenés à collecter sont :
        </p>
        <ul>
          <li>
            <strong>Stockage local</strong> : l'historique de recherche de
            communes est stocké uniquement dans le navigateur de l'utilisateur
            (localStorage) et n'est jamais transmis à nos serveurs
          </li>
          <li>
            <strong>Données de navigation</strong> : adresse IP, type de
            navigateur, pages consultées, date et heure de visite (via logs
            serveur)
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Finalités du traitement</h2>
        <p>Les données collectées sont utilisées pour :</p>
        <ul>
          <li>Améliorer l'expérience utilisateur</li>
          <li>Établir des statistiques de fréquentation anonymes</li>
          <li>Assurer le bon fonctionnement technique du site</li>
        </ul>
      </section>

      <section>
        <h2>4. Cookies</h2>
        <p>
          Le site utilise des cookies strictement nécessaires au fonctionnement
          (préférence de thème) ainsi que des outils de mesure d'audience pour
          établir des statistiques anonymes de navigation.
        </p>
      </section>

      <section>
        <h2>5. Partage des données</h2>
        <p>
          Nous ne vendons, ne louons et ne partageons aucune donnée personnelle
          avec des tiers. Les seuls tiers ayant potentiellement accès aux
          données de navigation sont :
        </p>
        <ul>
          <li>Outils de mesure d'audience — statistiques anonymes</li>
          <li>
            Cloudflare, Inc. — hébergeur du site et mesure d'audience sans
            cookie
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Durée de conservation</h2>
        <p>
          Les logs serveur sont conservés pour une durée maximale de 12 mois.
          L'historique de recherche stocké dans votre navigateur est conservé
          jusqu'à ce que vous le supprimiez manuellement.
        </p>
      </section>

      <section>
        <h2>7. Vos droits</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li>Droit d'opposition</li>
          <li>Droit à la portabilité</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit à l'effacement</li>
          <li>Droit de rectification</li>
          <li>Droit d'accès à vos données</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à{" "}
          <a href="mailto:contact@fbldigital.fr">contact@fbldigital.fr</a>. Vous
          pouvez également introduire une réclamation auprès de la{" "}
          <a
            href="https://www.cnil.fr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CNIL
          </a>
          .
        </p>
      </section>

      <section>
        <h2>8. Modifications</h2>
        <p>
          Nous nous réservons le droit de modifier cette politique de
          confidentialité à tout moment. La date de dernière mise à jour est
          indiquée en haut de cette page.
        </p>
      </section>
    </LegalLayout>
  );
}
