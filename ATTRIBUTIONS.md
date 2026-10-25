# Attributions et licences tierces

Ce fichier clarifie ce qui peut etre reutilise sous la licence MIT du depot et ce qui garde une licence distincte.

## Code source

Le code source du projet est distribue sous licence MIT. Voir [LICENSE](LICENSE).

## Donnees electorales et geographiques

Les donnees presentes dans `public/data` proviennent de sources tierces. Elles ne sont pas relicencies sous MIT par ce depot.

Sources principales :

- data.gouv.fr : resultats des elections presidentielles et jeux de donnees publics associes.
- Ministere de l'Interieur : resultats electoraux officiels publies en open data.
- Conseil constitutionnel via data.gouv.fr : parrainages des candidats.
- geo.api.gouv.fr : donnees geographiques des communes.
- IGN Admin Express COG 2018 (Licence Ouverte Etalab), via le depot gregoiredavid/france-geojson : contours simplifies des departements de la carte d'accueil (`public/data/geo/departements-paths.json`).
- Wikipedia : tableau de sondages 2022 utilise par `scripts/build-polls-2022-round1.mjs`, sous CC BY-SA pour le texte Wikipedia, avec prudence supplementaire pour les donnees issues des instituts.
- Wikipedia (en), « Opinion polling for the 2027 French presidential election » (https://en.wikipedia.org/wiki/Opinion_polling_for_the_2027_French_presidential_election), releve le 25 octobre 2026 par `scripts/build-polls-2027.mjs` : texte et tableaux sous licence CC BY-SA 4.0 (attribution aux contributeurs de la page, partage dans les memes conditions pour les donnees derivees `public/data/presidential/polls-2027-round1.json`). Les resultats et notices restent ceux des instituts de sondage et de la Commission des sondages.
- franceinfo et sources presse/institutionnelles citees dans `public/data/presidential/macron-promises-bilan.json`.

Les manifests de donnees conservent les URL sources quand elles sont disponibles, notamment `public/data/presidential/manifest.json`, `public/data/parrainages/manifest.json` et les champs `sources` des fichiers JSON editoriaux.

Avant toute reutilisation publique ou commerciale, verifier la licence exacte du jeu de donnees source, ses conditions d'attribution, sa date de consultation et les restrictions eventuelles.

## Images candidates

Les fichiers de `public/images/candidates` sont telecharges depuis Wikipedia/Wikimedia par `scripts/fetch-candidate-photos.mjs`. Ils ne sont pas couverts par la licence MIT du code.

Chaque image conserve sa licence d'origine publiee sur Wikimedia Commons ou sur la source associee a la page Wikipedia du candidat. Avant de redistribuer ces fichiers, verifier pour chaque image :

- la page source exacte ;
- l'auteur ou les auteurs ;
- la licence ;
- les obligations d'attribution ;
- les restrictions eventuelles d'usage de l'image, du nom ou de la personnalite representee.

Note de publication : les fichiers locaux peuvent differer des thumbnails actuellement exposes par les pages Wikipedia, car ces pages evoluent. Pour une publication sans ambiguite, regenerer les portraits avec des metadonnees d'attribution exactes ou remplacer les portraits par des assets dont la licence et l'attribution sont connues fichier par fichier.

## Cartographie

Les tuiles cartographiques et attributions OpenStreetMap sont affichees dans l'application avec l'attribution OpenStreetMap. Toute reutilisation doit respecter les conditions OpenStreetMap et celles du fournisseur de tuiles utilise.

## Dependances npm

Les dependances installees via npm gardent leurs propres licences. Pour auditer localement :

```bash
npm install
npm ls --all
npm audit
```
