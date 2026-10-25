# Recette finale — volet 7 (25/10/2026)

Méthode : build de production servi par `vite preview` (port dédié, service worker bloqué), Playwright 1.64 installé hors du dépôt (/tmp), Chromium en cache, profil temporaire. 17 URL × sombre/clair × mobile 390 px / desktop 1440 px, axe-core (WCAG 2 A/AA) injecté, relevé des erreurs console.

## Résultats
- 17 pages × 4 combinaisons : aucune erreur console ni exception, pas de débordement horizontal, un seul `h1` par page, JSON-LD présent (sauf mentions/confidentialité/404/explorer, comme avant), mode sombre par défaut et mode clair OK.
- `/comparer` (A=75056, B=69123) et `/parrainages` : rendu complet, sans erreur.
- Menu mobile : s'ouvre, Échap le ferme. Navigation clavier : focus visible partout ; lien « Aller au contenu » ajouté.
- `prefers-reduced-motion` : compteurs affichés directement à leur valeur finale.
- LCP accueil (CPU ralenti ×4, Chromium local) : ≈ 0,66 s mobile, 0,62 s desktop. Mesure de labo, polices Google chargées par `<link>` et non plus par `@import` CSS.
- Bundle : `vendor` 527 kB (168 gzip), `vendor-charts` 308 kB (78 gzip), `vendor-maps` 153 kB, `index` 51 kB ; pages chargées en lazy (inchangé). Prérendu : 123 routes HTML, 125 URL au sitemap.

## Corrections
- axe (avant → après) : `aria-prohibited-attr` (AnimatedNumber, 4+ pages), `definition-list`/`dlitem` (accueil), `color-contrast` (podium/évolution commune, badges promesses en clair), `link-in-text-block` (parrainages) → 0 violation sur toutes les pages.
- Couleurs des candidats 2022 : teintes distinctes (Macron bleu ciel, Le Pen indigo, Mélenchon cramoisi, Roussel rouge, Hidalgo orange, Lassalle or, Pécresse sarcelle, Dupont-Aignan violet…) ; gris `#404040`/`#666666` éclaircis pour rester lisibles en sombre ; doublons 2012 retirés pour que les valeurs 2022 s'appliquent.
- ComparerPage : lien « Retour à l'accueil » rétabli dans le hero.
- App.tsx : fallback de chargement de marque (logo, barre tricolore, `role="status"`).
- `theme-color` / `background_color` du manifeste alignés sur le fond sombre (plus de flash blanc).
- `id="contenu"` sur tous les `<main>` + lien d'évitement.

## Limites
- Les captures « avant » correspondent à l'état de `main` avant ce volet (mêmes pages, défauts axe ci-dessus) ; seules les captures « après » sont versionnées ici (échantillon sombre/clair, mobile/desktop).
- LCP mesuré en local, non sur le site déployé. Aucun déploiement effectué.
- Libellé « 1er tour » du graphique des sondages légèrement rogné à droite (cosmétique, non traité).

## Correctif après recette (25/10/2026)

Les fonds CARTO `dark_all` renvoient désormais une tuile « API KEY REQUIRED » sans clé : la carte de la fiche commune utilise de nouveau les tuiles OpenStreetMap standard, inversées par filtre CSS en thème sombre. Vérifié dans un Chromium de test isolé, en sombre et en clair, sans erreur console (`commune-map__dark__fix.png`).
