# Donnees

Ce projet versionne les donnees generees dans `public/data` pour que le site puisse fonctionner sans backend. Au 26 octobre 2026, ce dossier contient environ 3 280 fichiers pour environ 62 Mo (536 Mo avant le passage au format compact), dont 1 039 fichiers et 24 Mo pour les autres scrutins (`public/data/scrutins`).

Les donnees et assets tiers ne sont pas couverts par la licence MIT du code source. Consultez aussi [ATTRIBUTIONS.md](ATTRIBUTIONS.md) avant toute reutilisation.

## Sources principales

- Resultats presidentiels : Ministere de l'Interieur et ressources publiees via data.gouv.fr.
- Autres scrutins par commune (legislatives 2022 et 2024, europeennes 2019 et 2024, municipales 2020 et 2026) : Ministere de l'Interieur via data.gouv.fr, voir la section « Autres scrutins par commune » ci-dessous.
- Parrainages : Conseil constitutionnel (2022 et 2017 via data.gouv.fr ; 2027 : publication du Conseil constitutionnel, URL à confirmer).
- Geographie des communes : geo.api.gouv.fr.
- Sondages 2022 (archive, page `/analyse`) : tableau Wikipedia exploite par `scripts/build-polls-2022-round1.mjs`, avec prudence sur les sources primaires des instituts.
- Sondages 2027 (page `/sondages-presidentielle-2027`) : section « First round » de la page Wikipedia (en) `Opinion polling for the 2027 French presidential election`, exploitee par `scripts/build-polls-2027.mjs` (parseur dans `scripts/lib/polls-2027.mjs`). Chaque sondage porte ses hypotheses (listes de candidats testees), ses dates de terrain, son echantillon et le lien de notice de la source. Regeneration : `node scripts/build-polls-2027.mjs` (telechargement) ou `--input reponse-api.json`. Donnees relevees le 25 octobre 2026.
- Promesses / bilan : sources presse et institutionnelles referencees dans `public/data/presidential/macron-promises-bilan.json`.

## Points d'entree

- `public/data/presidential/manifest.json`
- `public/data/scrutins/manifest.json` (autres scrutins : tours, nombre de fichiers, communes, poids, source et licence de chaque jeu)
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
npm run build:scrutins
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
- Garde-fou de mise en ligne : le tag git `prod` marque la version en production (`postdeploy` le deplace a chaque `npm run deploy`). Le script ne deploie que si tout ce qui separe `prod` de `main` est sous `public/data/`, `docs/` (documentation non servie) ou dans `scripts/data-sources-2027.json` ; sinon il s'arrete (code de sortie 5) et la mise en ligne attend le feu vert de Florent.
- Codes de sortie : 0 a jour ou publie, 2 depot invalide, 3 anomalie de donnees, 4 controles en echec, 5 mise en ligne refusee (code non publie), 6 echec du deploiement.
- Routines Timon (agent `presifrance.coder`, taches `chore`) : chaque jour a 7 h le script ; chaque lundi a 7 h 30 la verification editoriale de `candidats.json`, `calendrier.json` et de l'URL des parrainages 2027, suivie du script.
- Les routines tournent sur le poste de Florent (daemon Timon) : machine eteinte = pas de mise a jour ce jour-la.

### Resultats en direct de la soiree electorale 2027

`public/data/live-2027/` (statut + fichiers compacts par tour) est ecrit par `scripts/fetch-live-2027.mjs`, **desactive par defaut** (`scripts/live-2027.config.json`). Format, procedure du soir et retour arriere : [docs/soiree-electorale-2027.md](docs/soiree-electorale-2027.md). `scripts/update-data-2027.sh` ne l'alimente pas.

## Autres scrutins par commune (volet SEO 5.5, 26/10/2026)

Fichiers `public/data/scrutins/<scrutin>/t<tour>/<departement>.json` (code INSEE du departement, trois caracteres pour 971-988), un par scrutin, tour et departement, **separes du format presidentiel** (`DEP_FILE_VERSION` inchange ; les fichiers scrutins ont leur propre version `SCRUTIN_FILE_VERSION` dans `src/lib/scrutinsCore.mjs`). Regeneration manuelle : `npm run build:scrutins` (telecharge les sources dans `$TMPDIR/presifrance-scrutins`, option `--cache DIR`, `--only id1,id2`). **Non branche sur `npm run update:data`** : les resultats passes ne changent plus ; les routines 2027 ne le lancent pas.

| Scrutin | Tours | Source (data.gouv.fr, ministere de l'Interieur) | Licence affichee sur data.gouv.fr |
| --- | --- | --- | --- |
| Legislatives 2022 | 1, 2 | jeux 62a8c3f9… (1er tour) et 62b1e903… (2nd tour), fichiers « subcom » definitifs | **non renseignee** |
| Legislatives 2024 | 1, 2 | jeux 6682d0c2… et 668b4092…, fichiers « par commune » definitifs | Licence Ouverte 2.0 |
| Europeennes 2019 | unique | jeu 5ceba293…, « resultats-definitifs-par-commune » | Licence Ouverte 1.0 |
| Europeennes 2024 | unique | jeu 666b1337…, « resultats-definitifs-par-commune » | Licence Ouverte 2.0 |
| Municipales 2020 | 1, 2 | jeux 5e7102d5… et 5efa23af…, communes de 1 000 habitants et plus | **non renseignee** |
| Municipales 2026 | 1, 2 | jeux 69b82a7d… et 69c17fed…, « Resultats - Communes » | Licence Ouverte 2.0 |

URL exactes (ressources horodatees) et date de verification (26/10/2026) : `scripts/scrutins-sources.json`. Pour les jeux sans licence renseignee, le ministere est l'editeur et les donnees sont des informations publiques de l'Etat reutilisables librement (code des relations entre le public et l'administration, art. L321-1 et suivants), comme les resultats presidentiels 2022 deja publies (memes conditions) ; a confirmer aupres du ministere avant toute reutilisation commerciale. Aucun scrutin n'a ete ecarte. Une version « 1er tour » provisoire sous Licence Ouverte (jeu 62a6eb85…) existe pour les legislatives 2022 mais differe des resultats definitifs (2 664 lignes) : les definitifs sont utilises.

- **Format** (`scripts/lib/scrutins.mjs`) : une ligne par commune `[nom, inscrits, abstentions, votants, blancs, nuls, exprimes, ...]`. Trois genres (`kind`) : `nuance` (legislatives : les candidats changent selon la circonscription, les voix sont additionnees par nuance politique sur toutes les circonscriptions recoupant la commune ; en-tete `entries: [[nuance, libelle]]`), `list` (europeennes : memes listes partout, `entries: [[libelle abrege, libelle complet, nuance, tete de liste]]`, une voix par entree, `null` si absente) et `local` (municipales : les listes de chaque commune dans sa ligne, `[[libelle, nuance, voix, sieges, tete de liste], ...]`).
- **Codes** : normalises en codes INSEE a 5 caracteres (fichiers 2019-2022 : departement et commune separes, DOM en ZA-ZD, ZM, ZS, ZX, collectivites ZN et ZP ; 2024 : codes non completes a zero). Les Francais de l'etranger (ZZ) et Wallis-et-Futuna 2019-2022 (ZW, code non fiable) sont ecartes. Paris, Lyon et Marseille : les arrondissements sont regroupes sous 75056, 69123 et 13055 quand un fichier est publie par arrondissement.
- **Portee** : legislatives et europeennes pour toutes les communes publiees (environ 35 000) ; municipales pour les communes de 1 000 habitants et plus seulement (scrutin de liste ; filtre `scripts/data/communes-1000.json` pour 2026). Les communes issues d'une fusion posterieure au scrutin n'ont pas de resultat sous leur code actuel (ex. municipales 2020 : 9 817 des 10 099 communes de 1 000 habitants et plus).
- **Garde-fou** : une commune dont la somme des voix s'ecarte des exprimes de plus de 2 % (et de plus de 5 voix) est ecartee et listee par le script (anomalie de la source : 4 communes en 2020 et 2026 au 1er tour, par exemple 24229 et 63327).
- **Poids** : 1 039 fichiers, 23,9 Mo bruts (plus gros fichier 117 Ko) ; `dist` passe de 12 522 a 13 677 fichiers (limite Workers Assets 20 000, controle a 19 000 par `verify-seo-build.mjs`).
- **Libelles des nuances** : `src/content/nuances.json` (grilles de nuances du ministere), partage entre l'interface et le prerendu.
- Tests : `scripts/lib/scrutins.test.mjs` (echantillons `scripts/fixtures/scrutins/`, extraits des vrais fichiers avec leur encodage d'origine) et `src/lib/scrutinsCore.test.ts`.

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
- Champ facultatif `fonction` (fonction actuelle ou passée) : `{ "libelle": "…", "sourceUrl": "…", "sourceLabel": "…", "dateVerification": "AAAA-MM-JJ" }`. À renseigner **uniquement avec une source datée** ; absent ou omis sinon (jamais de valeur supposée). Il s'affiche sur la fiche et n'est pas requis : un `candidats.json` sans ce champ reste valide (aucun candidat ne l'a à ce jour). Le champ `note` (précision sourcée, facultatif) alimente la fiche et la FAQ.
- Fiche `/presidentielle-2027/candidats/<slug>` (volet SEO 2, 26/10/2026) : titre « <Prénom Nom> : candidature présidentielle 2027, sondages et parcours », H1 au nom, statut sourcé, bloc sondages calculé depuis `polls-2027-round1.json` (identifiant sondage = slug avec `_` à la place de `-` ; moyenne glissante de 30 jours pondérée par l'échantillon à la date du dernier terrain, dernier sondage, courbe, nombre de sondages ; message « aucun sondage » sinon), historique par nom depuis `national-results.json`, parrainages depuis `public/data/parrainages/2027.json` (« non publiés » tant que le fichier n'existe pas), FAQ de 4 questions et JSON-LD `FAQPage` dans `<head>`, liens vers 3 candidats les plus testés + 3 voisins alphabétiques. Le HTML prérendu est produit par `scripts/lib/seo-content/candidate-2027.mjs` ; la page React reprend les mêmes textes via `src/lib/candidate2027Content.ts` (`candidate2027Content.test.ts` vérifie la parité : toute modification d'un texte se fait dans les deux fichiers). Les sondages et parrainages se rafraîchissent à chaque build/déploiement.
- Ajouter un candidat ajoute automatiquement sa fiche `/presidentielle-2027/candidats/<slug>` au prérendu et au sitemap (`scripts/seo-routes.mjs` lit le JSON). L'historique électoral est déduit de `national-results.json` par nom.
- Les sources de presse ne valent pas liste officielle : la liste officielle viendra du Conseil constitutionnel après validation des parrainages. Dernière vérification : 2026-10-26 (primaire de la gauche du 11/10/2026 et retraits intégrés, recoupement avec le trombinoscope franceinfo au 22/10/2026).

## HTML prérendu et fiches commune (SEO)

Mis en place le 26/10/2026 (volet SEO 1).

- `npm run build` enchaîne, en `postbuild` : `generate-sitemap.js` (sitemap.xml = index vers `sitemap-pages.xml` et `sitemap-communes.xml`, robots.txt), `prerender-seo-pages.mjs`, puis `verify-seo-build.mjs`.
- Le prérendu écrit dans `#root` un `<main>` (H1, introduction, tableaux de chiffres, liens internes) généré depuis `public/data` ; React le remplace au montage. Un constructeur de contenu par type de route : `scripts/lib/seo-content/` (`index.mjs` enregistre `communes`, `years`, `departments` ; `static-pages.mjs` couvre l'accueil, les hubs, la page 2027 et les fiches candidats, à enrichir dans les volets suivants).
- `/sondages-presidentielle-2027` (`scripts/lib/seo-content/sondages.mjs`) : bloc « Dernier sondage » (sondage à la fin de terrain la plus récente ; hypothèse principale = liste de candidats la plus souvent testée sur les 30 derniers jours), tableau de la moyenne (même calcul que `src/lib/api/polls2027Api.ts` : fenêtre de 30 jours, pondération par l'échantillon, toutes hypothèses ; le test `polls2027Api.test.ts` vérifie la concordance), liens vers les fiches par correspondance de nom, FAQ + JSON-LD FAQPage. La FAQ vit dans `src/content/sondages-faq.json`, partagée avec la page React. Régénéré à chaque build, donc à chaque `npm run update:data`.
- Fiches `/commune/<code>` (volet 5.5, 26/10/2026) : titre « Résultats des élections à <Ville> », H1 identique, description et introduction citant les scrutins réellement disponibles pour la commune (législatives 2022 et 2024, européennes 2019 et 2024, municipales 2020 et 2026), section « Législatives, européennes et municipales à <Ville> » (phrase du dernier tour de chaque scrutin et tableau de synthèse), FAQ visible et JSON-LD `FAQPage` bâtis sur ces résultats par `communeScrutinsFaq` (`src/lib/scrutinsCore.mjs`, importé par le prérendu ET par l'interface : les textes ne peuvent pas diverger). Les pages `/explorer/<dep>` ajoutent un tableau des scrutins du département. `verify-seo-build.mjs` contrôle titre, description et FAQPage des fiches. Le Worker (communes non prérendues) reprend le titre sans détail des scrutins.
- Les fiches `/commune/<code>` ne sont prérendues que pour les communes de 1 000 habitants et plus ayant des résultats 2022 au 1er tour (10 026 sur 10 099). Les populations viennent de l'instantané `scripts/data/communes-1000.json` (geo.api.gouv.fr), à rafraîchir avec `npm run build:communes` (réseau requis) puis à committer ; le build ne fait aucun appel réseau.
- `dist/index.html` sert aussi de fallback SPA (`not_found_handling`) : il ne porte volontairement aucun canonical, SEOHead le pose côté client.
- Pages `/presidentielle-<année>` (1965-2022) et `/resultats-presidentielle` (volet SEO 5, 26/10/2026) : H1 « Résultats de l'élection présidentielle <année> », élu, scores et voix des deux tours, participation et abstention (100 − participation), nombre de candidats au 1er tour, liens vers les départements et les 8 plus grandes communes, FAQ de 5 questions et JSON-LD `FAQPage`. Tous les chiffres viennent de `national-results.json` et de `src/content/years-facts.json` (nombre de candidats au 1er tour, départements disposant d'un fichier, niveau commune ou département), ce dernier étant généré depuis `public/data` par `npm run build:year-facts` (à relancer si un fichier de `public/data/presidential/<année>/t1` change ; `seo-content.test.mjs` échoue s'il est périmé). Seuls les départements disposant d'un fichier pour l'année sont listés, sans mention d'éventuels manques. Textes dans `scripts/lib/seo-content/years-content.mjs` et `year-meta.mjs` (HTML prérendu), miroir `src/lib/yearContent.ts` (page React, `yearContent.test.ts` vérifie la parité : modifier les deux ensemble). `national-results.json` ne liste que les principaux candidats du 1er tour pour les anciennes années : les tableaux affichent ce qu'il contient.
- `verify-seo-build.mjs` fait échouer le build si une route prérendue n'a pas un canonical unique et exact, un title unique, un seul H1 et au moins 80 mots visibles (500 pour `/presidentielle-1965` à `/presidentielle-2022` et `/resultats-presidentielle`, avec un JSON-LD `FAQPage` d'au moins 3 questions), si robots.txt bloque de nouveau un robot d'IA, si une fiche commune manque au sitemap, ou si `dist` dépasse 19 000 fichiers (`SEO_MAX_DIST_FILES`). Limite Cloudflare Workers Static Assets consultée le 26/10/2026 : 20 000 fichiers par version (offre gratuite), 100 000 (offre payante), 25 MiB par fichier ; au 26/10/2026 `dist` compte 12 522 fichiers.
