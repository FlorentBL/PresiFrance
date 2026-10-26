# Donnees

Ce projet versionne les donnees generees dans `public/data` pour que le site puisse fonctionner sans backend. Au 25 octobre 2026, ce dossier contient environ 2 230 fichiers pour environ 37 Mo (536 Mo avant le passage au format compact).

Les donnees et assets tiers ne sont pas couverts par la licence MIT du code source. Consultez aussi [ATTRIBUTIONS.md](ATTRIBUTIONS.md) avant toute reutilisation.

## Sources principales

- Resultats presidentiels : Ministere de l'Interieur et ressources publiees via data.gouv.fr.
- Parrainages : Conseil constitutionnel (2022 et 2017 via data.gouv.fr ; 2027 : publication du Conseil constitutionnel, URL à confirmer).
- Geographie des communes : geo.api.gouv.fr.
- Sondages 2022 (archive, page `/analyse`) : tableau Wikipedia exploite par `scripts/build-polls-2022-round1.mjs`, avec prudence sur les sources primaires des instituts.
- Sondages 2027 (page `/sondages-presidentielle-2027`) : section « First round » de la page Wikipedia (en) `Opinion polling for the 2027 French presidential election`, exploitee par `scripts/build-polls-2027.mjs` (parseur dans `scripts/lib/polls-2027.mjs`). Chaque sondage porte ses hypotheses (listes de candidats testees), ses dates de terrain, son echantillon et le lien de notice de la source. Regeneration : `node scripts/build-polls-2027.mjs` (telechargement) ou `--input reponse-api.json`. Donnees relevees le 25 octobre 2026.
- Promesses / bilan : sources presse et institutionnelles referencees dans `public/data/presidential/macron-promises-bilan.json`.

## Points d'entree

- `public/data/presidential/manifest.json`
- `public/data/presidential/national-results.json`
- `public/data/presidential/home-map.json` (candidat en tête par département et par année, 1er tour ; carte de l'accueil, généré par `node scripts/build-home-map.mjs` après `build:data`)
- `public/data/geo/departements-paths.json` (tracés SVG simplifiés des 96 départements métropolitains pour la carte de l'accueil ; IGN Admin Express COG 2018, Licence Ouverte, via gregoiredavid/france-geojson ; généré par `node scripts/build-france-map.mjs`)
- `public/data/presidential/polls-2022-round1.json`
- `public/data/presidential/polls-2027-round1.json`
- `public/data/presidential/macron-promises-bilan.json`
- `public/data/parrainages/manifest.json`
- `public/data/parrainages/2017.json`
- `public/data/parrainages/2022.json`
- `public/data/parrainages/2027.json`, `2027-by-dep.json` et `2027-history.json` (créés à la première publication 2027 ; tant qu'ils n'existent pas, le manifest porte `pending: [2027]` et la page affiche « publication à venir »)

## Regeneration

Les scripts principaux sont :

```bash
npm run build:data
npm run build:parrainages
npm run build:photos
```

`npm run build:data` reconstruit les donnees presidentielles dans `public/data/presidential`.

Les fichiers `public/data/presidential/{annee}/t{tour}/{dep}.json` utilisent un format compact (voir `scripts/lib/compact-results.mjs`) : noms des candidats une seule fois par fichier, puis une ligne de comptes par commune. Les pourcentages sont recalcules dans le navigateur (`src/lib/api/compactResults.ts`). `npm run compact:data` convertit d'anciens fichiers au format compact. Si le format change, incrementer `DEP_FILE_VERSION` dans `src/lib/api/resultsApi.ts` pour contourner les caches navigateur.

`npm run build:parrainages` reconstruit les fichiers de parrainages dans `public/data/parrainages`. Les CSV sources locaux `parrainages*.csv` sont ignores par Git.

### Parrainages 2027 (suivi en direct)

L'URL de publication 2027 du Conseil constitutionnel n'est pas connue a ce jour : elle n'est donc volontairement pas codee en dur (en 2022 : `https://presidentielle2022.conseil-constitutionnel.fr/telechargement/parrainagestotal.csv`). Procedure de mise a jour a chaque publication :

1. Mettre a jour (sans pousser) : `PARRAINAGES_2027_URL=<url du CSV> npm run build:parrainages -- --year 2027`, ou depuis un CSV telecharge : `npm run build:parrainages -- --year 2027 --file chemin/vers/parrainages.csv` (variable `PARRAINAGES_2027_FILE` equivalente). Le CSV doit suivre le format 2022 (`Civilite;Nom;Prenom;Mandat;Circonscription;Departement;Candidat;Date de publication`). Si la source repond une erreur (404...), l'annee reste en « publication a venir ».
2. Verifier la sortie du script (parrainages, candidats, departements), que `public/data/parrainages/manifest.json` liste 2027 dans `years` (plus dans `pending`), que `2027-history.json` a gagne une ligne datee (le script n'ajoute une ligne que si le contenu a change), puis `npm test` et ouvrir `/parrainages?year=2027`.
3. En routine : renseigner l'URL du CSV dans `scripts/data-sources-2027.json` (`parrainagesCsvUrl`, avec sa source et sa date de verification) ; la mise a jour automatique (section suivante) la reprend chaque jour et met en ligne.

Validation de la chaine sans donnees reelles : `npm run build:parrainages -- --year 2027 --file scripts/fixtures/parrainages-sample-2022.csv` (fichier d'exemple fictif au format 2022). **Ne pas committer** les fichiers 2027 ainsi produits : supprimer `2027*.json` puis `git checkout public/data/parrainages/manifest.json` et relancer le script sans source pour retrouver l'etat « a venir ». Les tests (`npm test`) valident la chaine sans toucher a `public/`.

Regle de recevabilite affichee sur la page (`src/lib/parrainagesTracking.ts`) : 500 presentations, d'au moins 30 departements ou collectivites d'outre-mer, au plus 50 (un dixieme) d'un meme departement — loi n° 62-1292 du 6 novembre 1962, art. 3-I. Texte cite de memoire, non reverifie en ligne le 25 octobre 2026 : a controler sur Legifrance avant le scrutin.

`npm run build:photos` telecharge les portraits candidats depuis Wikipedia/Wikimedia. Les portraits doivent etre verifies fichier par fichier avant toute redistribution publique ou commerciale.

### Mise a jour automatique des donnees 2027

Decision de Florent du 25 octobre 2026 : les mises a jour **de donnees** (sondages, parrainages, candidats, calendrier) sont mises en ligne sans feu vert individuel si tous les controles passent ; toute modification de **code** reste soumise a son feu vert.

- Script : `npm run update:data` (`scripts/update-data-2027.sh`, option `--no-deploy`). Il part de `main` a jour, regenere les sondages (refus si le nombre de sondages baisse, la date de generation seule n'est pas consideree comme un changement), les parrainages si `parrainagesCsvUrl` est renseignee dans `scripts/data-sources-2027.json`, puis lance typecheck et tests, commit, push et `npm run deploy`.
- Garde-fou de mise en ligne : le tag git `prod` marque la version en production (`postdeploy` le deplace a chaque `npm run deploy`). Le script ne deploie que si tout ce qui separe `prod` de `main` est sous `public/data/` ou dans `scripts/data-sources-2027.json` ; sinon il s'arrete (code de sortie 5) et la mise en ligne attend le feu vert de Florent.
- Codes de sortie : 0 a jour ou publie, 2 depot invalide, 3 anomalie de donnees, 4 controles en echec, 5 mise en ligne refusee (code non publie), 6 echec du deploiement.
- Routines Timon (agent `presifrance.coder`, taches `chore`) : chaque jour a 7 h le script ; chaque lundi a 7 h 30 la verification editoriale de `candidats.json`, `calendrier.json` et de l'URL des parrainages 2027, suivie du script.
- Les routines tournent sur le poste de Florent (daemon Timon) : machine eteinte = pas de mise a jour ce jour-la.

## Regles de contribution

- Documenter toute nouvelle source dans [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
- Garder dans la pull request l'URL source, la licence, les obligations d'attribution et, si utile, la date de consultation.
- Ne pas supprimer de donnees ou d'assets sans expliquer l'impact fonctionnel et la source de remplacement.
- Verifier les changements avec `npm test`, `npm run typecheck` et `npm run build`.

## Strategie de taille

Le depot est volontairement autonome, mais `public/data` represente la grande majorite des fichiers suivis. Si la taille devient bloquante, les options a etudier dans cet ordre sont :

1. compresser les fichiers publics servis en production (fait : format compact, octobre 2026) ;
2. decouper les donnees les plus consultees des archives completes ;
3. publier les donnees volumineuses en GitHub Releases ;
4. separer les donnees dans un depot ou package dedie ;
5. utiliser Git LFS seulement si le flux contributeur reste simple.

## Présidentielle 2027 (hub et fiches candidats)

- `public/data/presidential/2027/candidats.json` : candidats déclarés, pressentis ou retirés, édités à la main. Chaque entrée porte `sourceUrl`, `sourceLabel` et `dateVerification` ; une date ou un soutien inconnu vaut `null` ou « à confirmer », jamais une valeur supposée. Ordre d'affichage : alphabétique (nom, prénom), calculé à l'affichage.
- `public/data/presidential/2027/calendrier.json` : seules les dates officielles sourcées (service-public.fr) sont renseignées ; les autres événements restent `date: null`, `statut: "a_confirmer"`.
- Ajouter un candidat ajoute automatiquement sa fiche `/presidentielle-2027/candidats/<slug>` au prérendu et au sitemap (`scripts/seo-routes.mjs` lit le JSON). L'historique électoral est déduit de `national-results.json` par nom.
- Les sources de presse ne valent pas liste officielle : la liste officielle viendra du Conseil constitutionnel après validation des parrainages. Dernière vérification : 2026-10-26 (primaire de la gauche du 11/10/2026 et retraits intégrés, recoupement avec le trombinoscope franceinfo au 22/10/2026).
