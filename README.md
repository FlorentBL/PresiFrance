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

Le site est servi par Cloudflare Workers (fichiers statiques uniquement, configuration dans `wrangler.jsonc`, en-tetes de cache dans `public/_headers`). Deploiement :

```bash
npm run deploy
```

## Donnees

Les fichiers de donnees generes sont versionnes dans `public/data` afin que le site fonctionne rapidement sans dependance serveur. Les CSV sources locaux (`parrainages*.csv`) et caches temporaires ne sont pas versionnes.

La provenance, la regeneration et la strategie de taille sont detaillees dans [DATA.md](DATA.md).

Les principaux points d'entree sont :

- `public/data/presidential/manifest.json`
- `public/data/parrainages/manifest.json`
- `public/data/presidential/polls-2022-round1.json`
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

The site is served by Cloudflare Workers static assets (`wrangler.jsonc`, cache headers in `public/_headers`). Deploy with `npm run deploy`.

## Data

Generated data files are versioned in `public/data` so the site can run quickly without a backend dependency. Local source CSV files (`parrainages*.csv`) and temporary caches are not versioned.

Main entry points:

- `public/data/presidential/manifest.json`
- `public/data/parrainages/manifest.json`
- `public/data/presidential/polls-2022-round1.json`
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
