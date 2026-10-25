import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/legal/LegalLayout";

export default function MentionsLegales() {
  return (
    <LegalLayout
      seoTitle="Mentions légales"
      path="/mentions-legales"
      eyebrow="Informations légales"
      title="Mentions légales"
    >
      <section>
        <h2>Éditeur du site</h2>
        <ul>
          <li>Directeur de la publication : Florent Bonnet-Ligeon</li>
          <li>
            TVA intracommunautaire : TVA non applicable, art. 293 B du CGI
          </li>
          <li>Numéro SIREN : 799 308 408</li>
          <li>Téléphone : 06 48 77 06 63</li>
          <li>
            Email :{" "}
            <a href="mailto:contact@fbldigital.fr">contact@fbldigital.fr</a>
          </li>
          <li>
            Adresse du siège social : 15 impasse du pré vert, 38300 Succieu
          </li>
          <li>Forme juridique : Entreprise Individuelle</li>
          <li>Nom commercial : FBL Digital</li>
          <li>
            Raison sociale : Florent Bonnet-Ligeon, Entrepreneur Individuel (EI)
          </li>
        </ul>
      </section>

      <section>
        <h2>Hébergement</h2>
        <ul>
          <li>Hébergeur : Cloudflare, Inc.</li>
          <li>Adresse : 101 Townsend St, San Francisco, CA 94107, USA</li>
          <li>
            Site :{" "}
            <a
              href="https://www.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.cloudflare.com
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble de ce site relève de la législation française et
          internationale sur le droit d'auteur et la propriété intellectuelle.
          Tous les droits de reproduction sont réservés, y compris pour les
          documents téléchargeables et les représentations iconographiques et
          photographiques. La reproduction de tout ou partie de ce site sur un
          support électronique quel qu'il soit est formellement interdite sauf
          autorisation expresse du directeur de la publication.
        </p>
        <p>
          Les données affichées sur ce site proviennent de sources ouvertes
          (Open Data) et sont librement réutilisables conformément aux licences
          associées.
        </p>
      </section>

      <section>
        <h2>Données personnelles</h2>
        <p>
          Conformément à la loi « Informatique et Libertés » du 6 janvier 1978
          modifiée et au Règlement Européen 2016/679 du 27 avril 2016 (RGPD),
          vous disposez d'un droit d'accès, de rectification, de suppression et
          d'opposition sur les données vous concernant. Vous pouvez exercer ce
          droit en nous contactant à l'adresse email{" "}
          <a href="mailto:contact@fbldigital.fr">contact@fbldigital.fr</a>.
        </p>
        <p>
          Pour en savoir plus, consultez notre{" "}
          <Link to="/politique-de-confidentialite">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Le site PrésiFrance peut être amené à vous demander l'acceptation des
          cookies pour des besoins de statistiques et d'affichage. Un cookie est
          une information déposée sur votre disque dur par le serveur du site
          que vous visitez. Il contient plusieurs données qui sont stockées sur
          votre ordinateur dans un simple fichier texte auquel un serveur accède
          pour lire et enregistrer des informations.
        </p>
      </section>

      <section>
        <h2>Sources des données</h2>
        <p>
          Les données présentées sur PrésiFrance proviennent des sources
          officielles suivantes :
        </p>
        <ul>
          <li>
            <a
              href="https://data.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              data.gouv.fr
            </a>{" "}
            — Résultats des élections présidentielles, parrainages (Conseil
            constitutionnel)
          </li>
          <li>
            <a
              href="https://geo.api.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              geo.api.gouv.fr
            </a>{" "}
            — Données géographiques des communes
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}
