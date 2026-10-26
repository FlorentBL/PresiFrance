# PresiFrance

PresiFrance est une application web React/Vite pour explorer les resultats des elections presidentielles francaises, les parrainages, la participation, l'abstention et quelques jeux de donnees editoriaux relies aux elections.

Le projet s'appuie principalement sur des donnees publiques issues de data.gouv.fr, du Ministere de l'Interieur, du Conseil constitutionnel, de geo.api.gouv.fr et de sources citees dans les jeux de donnees.

## Statut open source

Le code source est distribue sous licence MIT. Les donnees, images et contenus tiers ne sont pas relicencies sous MIT : ils restent soumis aux licences et conditions de leurs sources respectives. Consultez [ATTRIBUTIONS.md](ATTRIBUTIONS.md) avant toute redistribution, publication commerciale ou extraction des assets.

## Prerequis

- Node.js 20 ou plus recent recommande
- npm

## Installation

```bash
npm install
```

Copiez les variables publiques si necessaire :

```bash
cp .env.example .env.local
```

La variable principale est `VITE_SITE_URL`, utilisee pour les URL canoniques, Open Graph, JSON-LD et sitemap.

## Developpement

```bash
npm run dev
```

## Scripts utiles

```bash
npm run build
npm run lint
npm test
npm audit
npm run build:data
npm run build:parrainages
npm run build:photos
```

- `build` compile le site et genere les pages SEO prerenderisees.
- `audit` verifie les vulnerabilites connues des dependances npm via `npm audit`.
- `build:data` reconstruit les donnees presidentielles dans `public/data/presidential`.
- `build:parrainages` reconstruit les donnees de parrainages dans `public/data/parrainages`.
- `build:photos` telecharge les portraits candidats depuis les pages Wikipedia/Wikimedia configurees dans le script.

## Hebergement

Le site est servi par le Worker Cloudflare `presifrance` : fichiers statiques (Workers Static Assets, dossier `dist`) et un petit script (`worker/index.js`). Configuration dans `wrangler.jsonc`, en-tetes dans `public/_headers`. Deploiement :

```bash
npm run deploy
```

### Worker (`worker/`)

Sans lui, `not_found_handling: single-page-application` renvoyait l'accueil en 200 pour toute adresse inconnue (soft 404) et les ~25 000 communes non prerendues recevaient le titre de l'accueil. Le Worker (binding `ASSETS`, **sans** `run_worker_first`) :

- sert d'abord le fichier statique s'il existe (pages prerendues, assets, `/data`) ;
- sinon repond un **vrai 404** avec le gabarit de l'application (`dist/app-shell.html`, qui affiche la page 404 du site), `X-Robots-Tag: noindex`, pour toute route inconnue, tout code commune ou departement inexistant ;
- pour une **commune existante mais non prerendue** (`/commune/<code>`), habille le gabarit : titre « Resultats des elections a <Ville> », description, canonique, `og:*`, et un resume chiffre de la presidentielle 2022 (1er tour), d'apres l'index `dist/data/communes/<dep>.json` ; sans resultats 2022 la page est en `noindex` ;
- sert `/embed/carte` et `/embed/commune/<code>` avec les en-tetes des embeds (`frame-ancestors *`, `noindex`), repris dans le Worker car le gabarit est servi sous un autre chemin ;
- redirige les adresses a slash final (308) et repond 404 a `/app-shell`. Les collectivites d'outre-mer (codes 98xxx) n'ont pas d'index fiable : page 200 en `noindex`.

L'index est genere au build (`postbuild` : `scripts/build-commune-index.mjs`, `scripts/lib/commune-index.mjs`) a partir de `public/data/presidential` ; le sitemap (`sitemap-communes*.xml`) liste les communes prerendues et celles qui ont des resultats 2022. **Pas de `run_worker_first`** : avec `main` et `not_found_handling: "none"`, Workers Assets sert directement et gratuitement tout fichier existant (pages prerendues, assets, `/data`) et n'invoque le Worker que pour une adresse sans fichier (communes non prerendues, 404, `/embed/*`). Le quota de l'offre gratuite (100 000 requetes Worker par jour) ne porte donc que sur ces adresses, pas sur le trafic des pages prerendues (les requetes de fichiers statiques sont gratuites et illimitees). `/mentions-legales` et `/politique-de-confidentialite` sont prerendues pour cette raison. Le Worker garde sa propre lecture des fichiers (`ASSETS.fetch`) par securite, sans effet sur le comptage ; les fichiers de `dist` restent sous la limite de Workers Assets (20 000 fichiers en gratuit, controle par `verify-seo-build.mjs`).

Tests : `npx vitest run worker`. Essai local : construire (`npm run build`) puis `npx wrangler@4 dev --port 8799`, interroger avec `curl -i`, puis arreter le processus (l'observateur de fichiers de wrangler peut se desactiver sur un `dist` de plus de 10 000 dossiers, sans gravite).

## Design et recette

Le contrat visuel (« Nuit électorale ») est décrit dans `md/design-system.md` ; le rapport de recette finale et les captures sont dans `md/refonte-captures/`.

## Donnees

Les fichiers de donnees generes sont versionnes dans `public/data` afin que le site fonctionne rapidement sans dependance serveur. Les CSV sources locaux (`parrainages*.csv`) et caches temporaires ne sont pas versionnes.

La provenance, la regeneration et la strategie de taille sont detaillees dans [DATA.md](DATA.md).

Les principaux points d'entree sont :

- `public/data/presidential/manifest.json`
- `public/data/parrainages/manifest.json`
- `public/data/presidential/polls-2022-round1.json`
- `public/data/presidential/polls-2027-round1.json`
- `public/data/presidential/macron-promises-bilan.json`

## Contribution

Les contributions sont bienvenues. Avant d'ouvrir une pull request :

```bash
npm run lint
npm test
npm run build
```

Merci de garder les changements limites au sujet traite et de documenter toute nouvelle source de donnees ou tout nouvel asset tiers dans [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

## Publication du depot

Avant de passer le depot GitHub en public, relisez [OPEN_SOURCE_CHECKLIST.md](OPEN_SOURCE_CHECKLIST.md).

## Securite

Pour signaler une vulnerabilite, consultez [SECURITY.md](SECURITY.md).

---

# PresiFrance - English

PresiFrance is a React/Vite web application for exploring French presidential election results, endorsements, turnout, abstention and a few editorial datasets related to elections.

The project mainly relies on public data from data.gouv.fr, the French Ministry of the Interior, the Constitutional Council, geo.api.gouv.fr and sources cited in the datasets.

## Open Source Status

The source code is released under the MIT license. Data files, images and third-party content are not relicensed under MIT by this repository: they remain subject to the licenses and terms of their original sources. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) before redistributing, using commercially or extracting assets.

## Requirements

- Node.js 20 or newer recommended
- npm

## Installation

```bash
npm install
```

Copy public environment variables if needed:

```bash
cp .env.example .env.local
```

The main variable is `VITE_SITE_URL`, used for canonical URLs, Open Graph metadata, JSON-LD and the sitemap.

## Development

```bash
npm run dev
```

## Useful Scripts

```bash
npm run build
npm run lint
npm test
npm audit
npm run build:data
npm run build:parrainages
npm run build:photos
```

- `build` compiles the site and generates prerendered SEO pages.
- `audit` checks known npm dependency vulnerabilities through `npm audit`.
- `build:data` rebuilds presidential election data in `public/data/presidential`.
- `build:parrainages` rebuilds endorsement data in `public/data/parrainages`.
- `build:photos` downloads candidate portraits from the Wikipedia/Wikimedia pages configured in the script.

## Hosting

The site is served by the Cloudflare Worker `presifrance`: static assets plus a small script (`worker/index.js`) that returns real 404s for unknown routes and commune codes and fills in title, description and canonical for communes that are not prerendered (see the French section above). Config in `wrangler.jsonc`, headers in `public/_headers`. Deploy with `npm run deploy`.

## Data

Generated data files are versioned in `public/data` so the site can run quickly without a backend dependency. Local source CSV files (`parrainages*.csv`) and temporary caches are not versioned.

Main entry points:

- `public/data/presidential/manifest.json`
- `public/data/parrainages/manifest.json`
- `public/data/presidential/polls-2022-round1.json`
- `public/data/presidential/polls-2027-round1.json`
- `public/data/presidential/macron-promises-bilan.json`

## Contributing

Contributions are welcome. Before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

Please keep changes focused and document any new data source or third-party asset in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

## Repository Publication

Before making the GitHub repository public, review [OPEN_SOURCE_CHECKLIST.md](OPEN_SOURCE_CHECKLIST.md).

## Security

To report a vulnerability, see [SECURITY.md](SECURITY.md).
