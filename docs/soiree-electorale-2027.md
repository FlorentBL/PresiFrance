# Soirée électorale 2027 : résultats en direct

Page : `/presidentielle-2027/resultats`. Tâche 5.6 (vague 5), rédigé le 26/10/2026. Tout ce qui suit est
**désactivé par défaut** : rien n'est récupéré ni publié sans décision de Florent.

## 1. Le flux officiel du ministère de l'Intérieur

### Ce qui est vérifié (présidentielle 2022)

- Producteur : ministère de l'Intérieur, sur data.gouv.fr, **Licence Ouverte 2.0** (réutilisation libre, attribution
  de la source et de la date). Jeux de données :
  - 1er tour, soirée du 10/04/2022 : [Résultats du 1er tour](https://www.data.gouv.fr/fr/datasets/election-presidentielle-des-10-et-24-avril-2022-resultats-du-1er-tour/),
    créé le 11/04/2022 (« ces résultats sont ceux de la soirée électorale »), page lue le 26/10/2026 ;
  - 2nd tour : jeu « résultats définitifs du 2nd tour » (même producteur, slug
    `election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-2nd-tour`).
- Format : fichiers texte CSV (séparateur `;`, **Windows-1252/ISO-8859-1**, fins de ligne CRLF, décimales à la virgule),
  aussi en xlsx, nommés `resultats-par-niveau-<niveau>-t<tour>-<périmètre>`. Niveaux : `fe` (France entière, aussi
  métropole et outre-mer séparés), `reg`, `dpt`, `subcom` (**commune**), `cirlg` (circonscription législative) et
  `burvot` (bureau de vote, 2nd tour définitif). Le dépôt n'utilise que `fe`, `dpt`, `subcom`.
- Colonnes : territoire (`Code du département`, `Libellé du département`, `Code de la commune`, `Libellé de la commune`,
  ou `Code du niveau`/`Libellé du niveau` pour la France entière), `Etat saisie`, `Inscrits`, `Abstentions`, `Votants`,
  `Blancs`, `Nuls`, `Exprimés` (chacun suivi de ses pourcentages), puis **un bloc répété par candidat** :
  `N°Panneau;Sexe;Nom;Prénom;Voix;% Voix/Ins;% Voix/Exp` (sans `N°Panneau` au niveau département).
- `Etat saisie` : « Complet » pour un territoire dont le décompte est terminé. Les valeurs intermédiaires de la
  soirée (partiel, non saisi) ne figurent pas dans les fichiers 2022 conservés : **le comportement exact d'un fichier
  de soirée non terminé reste à valider le 18 avril 2027** (le récupérateur ne retient que « Complet »).
- Codes territoire : départements métropolitains et Corse (`2A`, `2B`), outre-mer en `ZA` (Guadeloupe), `ZB`
  (Martinique), `ZC` (Guyane), `ZD` (La Réunion), `ZM` (Mayotte), `ZN`, `ZP`, `ZS`, `ZW`, `ZX` (Saint-Martin et
  Saint-Barthélemy), `ZZ` (Français de l'étranger). Code commune de PrésiFrance = code département + code commune du
  fichier (`01001`, `75056`, `ZA101`), comme dans les archives `public/data/presidential/`.
- Taille 2022 : environ 17,6 Mo pour les communes du 1er tour (35 035 lignes), 54 Ko pour les départements, moins de
  1 Ko pour la France entière.

### Ce qui n'est PAS connu avant 2027 (donc paramétrable, jamais supposé)

- **L'URL exacte des fichiers 2027** : jeux data.gouv.fr de 2027 non encore créés ; leur identifiant de ressource change à
  chaque publication. Elle se renseigne dans `scripts/live-2027.config.json` (`sources.t1|t2.national|departements|communes`)
  ou par `LIVE_2027_URL_NATIONAL|_DEPARTEMENTS|_COMMUNES`. Une URL de ressource data.gouv.fr stable
  (`https://www.data.gouv.fr/api/1/datasets/r/<id>`) redirige vers le fichier courant.
- **La cadence de publication** : en 2022 le jeu a été publié une fois (créé le 11/04/2022, soir de l'élection) ; le site
  web du ministère se rafraîchit en continu mais son API JSON n'est pas documentée publiquement. Non vérifié : le
  site `resultats-elections.interieur.gouv.fr` renvoie des redirections (301) le 26/10/2026, ses chemins JSON 2022
  n'ont donc pas pu être contrôlés. Ne rien coder sur ces chemins sans les avoir lus le soir même.
- Le fichier de la soirée peut changer de format. Le parseur lit les colonnes **par leur nom** et refuse le fichier
  (code de sortie 3, rien n'est écrit) si une colonne manque ou si les comptes sont incohérents
  (somme des voix ≠ exprimés, exprimés + blancs + nuls ≠ votants, votants + abstentions ≠ inscrits).

## 2. Récupérateur et données

- `scripts/lib/live-results.mjs` : lecture et normalisation (format compact de `scripts/lib/compact-results.mjs`).
- `scripts/fetch-live-2027.mjs` : récupération, contrôles, écriture dans `public/data/live-2027/`.
- Tests : `scripts/lib/live-results.test.mjs`, `scripts/fetch-live-2027.test.mjs`, sur des extraits **réels** des
  fichiers 2022 (`scripts/fixtures/live-2022/` : 1er et 2nd tour, France entière, 5 départements, 9 communes dont
  Paris et la Guadeloupe) ; les cas « partiel » sont fabriqués en changeant `Etat saisie` dans le test.
- Fichiers produits :
  - `status.json` : un bloc par tour (`t1`, `t2`) avec `state`, `couvertureInscrits` (%), communes complètes/total,
    `fetchedAt` (heure du relevé), `source` ; `current` = tour affiché par défaut. Les liens vers la page n'apparaissent
    que lorsqu'un tour n'est plus « avenir ».
  - `t<tour>/national.json` (clé `FE`), `t<tour>/departements.json` (+ `etat` par département),
    `t<tour>/communes/<dep>.json` (seules les communes « Complet » y figurent).
- États : `avenir` → `partiel` (« résultats partiels (x % des inscrits) ») → `complet-provisoire` (toutes les communes
  terminées, en attente de proclamation) → `definitif`. Le passage à `definitif` est **toujours une décision de
  l'opérateur** (`--final` ou `"final": true`) après proclamation par le Conseil constitutionnel : le fichier du
  ministère ne le dit pas. Aucune estimation n'est calculée ni affichée.
- `x %` = inscrits des communes « Complet » ÷ inscrits de toutes les communes du fichier (ou
  `inscritsReference` de la configuration si l'on veut figer le dénominateur sur un total officiel). **À vérifier
  avec le premier fichier réel** : si les communes non terminées n'y figurent pas, le pourcentage sera trop haut ;
  renseigner alors `inscritsReference` (nombre d'inscrits publié par le ministère).
- Garde-fous : couverture jamais en baisse, un tour `definitif` ne régresse pas, liste de candidats identique sur tous
  les niveaux.

## 3. La page

`/presidentielle-2027/resultats` (route `src/App.tsx`, déclarée dans `scripts/seo-routes.mjs` : sitemap + prérendu).
Onglets National / Département / Commune, choix du tour si les deux ont des résultats, rafraîchissement toutes les
60 s tant qu'un tour est en cours, fichiers servis sans cache. Elle affiche toujours l'état, l'horodatage du relevé
(heure de Paris) et la source. Liens depuis `/presidentielle-2027` et l'accueil (`Home2027`) : visibles seulement quand
`status.json` a un tour non « avenir ». Le HTML prérendu dit « à venir » tant que rien n'est publié (régénéré à chaque
build).

## 4. Mise à jour pendant la soirée : interrupteurs et procédure

Mécanisme : `scripts/live-2027.sh`, à lancer par une routine/un déclencheur Timon **créé le jour même**
(`trigger_create`, source schedule, fuseau Europe/Paris, toutes les 10 minutes, agent `presifrance.coder` ; ne pas
utiliser `routine_create`). Aucune routine n'est créée aujourd'hui. Il y a **deux interrupteurs, tous deux éteints** :

1. `"enabled": true` dans `scripts/live-2027.config.json` : sans lui, aucune récupération ;
2. `LIVE_2027_PUBLISH=1` dans l'environnement de la routine : sans lui, la récupération n'est jamais commitée ni déployée.

Chaque publication = commit `public/data/live-2027/` + `npm run deploy` (un déploiement complet, plusieurs minutes) ;
prévoir un intervalle d'au moins 10 minutes. Même garde-fou que `update-data-2027.sh` : si du code non publié sépare
`prod` de `main`, la mise en ligne est refusée (code 5). **Cette fonctionnalité doit donc être déployée avant le
soir, avec le feu vert de Florent**, dans un état « avenir ».

Alternative à étudier si 10 minutes est trop long : un Worker Cron qui écrit dans R2/KV et une page qui lit cette
source (hors périmètre, non réalisé).

### Avant le scrutin (J-7 à J-1)

1. Vérifier l'existence des jeux data.gouv.fr du ministère ; relever les URL des trois fichiers du tour.
2. Les inscrire dans `scripts/live-2027.config.json` (`sources.t1`, avec `label` et `verifiedOn`), `round: 1`, laisser
   `enabled: false`. Tester sans réseau : `node scripts/fetch-live-2027.mjs --round 1 --input-dir <dossier> --prefix t1- --out /tmp/essai`
   (fichiers `t1-national.txt`, `t1-departements.txt`, `t1-communes.txt`).
3. Déployer le code (feu vert de Florent), vérifier que `/presidentielle-2027/resultats` affiche « Résultats à venir ».

### Le soir

1. Sur décision de Florent : `enabled: true` dans la configuration, commit sur `main` (le script ne publie que le dossier
   `live-2027`, la configuration reste à commiter à part).
2. Créer le déclencheur (toutes les 10 min) lançant `LIVE_2027_PUBLISH=1 bash scripts/live-2027.sh`.
3. Au premier fichier réel : contrôler le pourcentage, les noms, un département et une commune connus.
4. Après proclamation par le Conseil constitutionnel : `node scripts/fetch-live-2027.mjs --round 1 --final`, publier,
   puis supprimer le déclencheur et remettre `enabled: false`.
5. 2nd tour : mêmes étapes avec `round: 2` et `sources.t2`.

### Retour arrière

- Arrêt immédiat : supprimer le déclencheur (`trigger_remove`) et/ou `enabled: false` ; rien ne se publie plus.
- Retirer les résultats déjà en ligne : `node scripts/fetch-live-2027.mjs --reset` (statut « à venir », supprime `t1/` et
  `t2/`), commit, `npm run deploy` : liens masqués et page revenue à « à venir ». Équivalent : `git revert` du dernier
  commit « Résultats en direct 2027 » puis déploiement.
- Un relevé suspect est refusé tout seul (code 3) ; l'ancien relevé reste en ligne.

## 5. Sources

- [Jeu de données 1er tour 2022 (data.gouv.fr)](https://www.data.gouv.fr/fr/datasets/election-presidentielle-des-10-et-24-avril-2022-resultats-du-1er-tour/) : licence `lov2`, producteur ministère de l'Intérieur, 14 fichiers (lu le 26/10/2026 via l'API data.gouv.fr).
- Jeu « résultats définitifs du 2nd tour » 2022, même producteur (API data.gouv.fr, 26/10/2026).
- En-têtes et structure des fichiers : lus directement sur les fichiers `resultats-par-niveau-fe|dpt|subcom-t1/t2` le 26/10/2026.
- Service-public.fr pour les dates du scrutin : voir `public/data/presidential/2027/calendrier.json`.
