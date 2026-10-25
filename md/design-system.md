# Design system « Nuit électorale »

Contrat visuel et technique des volets 2 à 7. Source de vérité : `src/index.css` (tokens), `tailwind.config.ts`, `src/components/design/`.

## Principes
- **Sombre par défaut** (bleu nuit quasi-noir), mode clair conservé (`.light`). Géré par `next-themes` (`attribute="class"`, thèmes `dark` | `light`, pas de thème système). `:root` = sombre, donc le HTML prérendu est déjà sombre.
- **Tricolore en lumière**, jamais en aplats : bleu et rouge en halos (`night-bg`, `shadow-glow-*`), blanc pour le texte/liserés.
- **Mobile d'abord**, contraste AA, `prefers-reduced-motion` respecté partout.
- Ne jamais coder de couleur en dur (`bg-white`, `text-neutral-*`) dans une page refondue : utiliser les tokens.

## Palette (variables HSL, noms shadcn conservés)
| Token | Sombre | Clair | Usage |
|---|---|---|---|
| `background` | 228 45% 6% | 40 33% 97% | fond de page |
| `foreground` | 220 25% 94% | 228 40% 10% | texte |
| `card` | 228 38% 10% | blanc | surfaces |
| `primary` | 218 100% 68% | 224 78% 38% | bleu : liens, actions, états actifs |
| `accent` | 228 30% 18% | 220 25% 92% | surface de survol/sélection neutre (shadcn : hover des menus, ghost) — PAS le rouge |
| `tri-red` | 354 85% 58% | 354 75% 48% | rouge éditorial : `text-tri-red`, `bg-tri-red/15`, `shadow-glow-red` |
| `muted-foreground` | 220 15% 70% | 224 12% 38% | texte secondaire (AA sur background) |
| `border` | 228 28% 20% | 220 18% 85% | liserés |
| `success` / `warning` / `destructive` | — | — | états |
| `tri-blue` / `tri-white` / `tri-red` | — | — | tricolore, utilisables en Tailwind (`text-tri-red`) |
| `chart-*` | — | — | séries de graphiques, ajustées par thème |

Variables non-shadcn : `--glass`, `--glass-border`, `--grain-opacity`, `--glow-blue`, `--glow-red`, `--shadow-sm|md|lg`.
Couleurs des candidats : toujours `src/lib/candidateColors.ts` (jamais le tricolore).

## Typographie
- Display / titres : **Fraunces** (`font-heading`, `font-display`), variable, graisses 400–800. Sans : **Inter** (`font-body`, `font-sans`). Chargées via Google Fonts, `display=swap`, dans `src/index.css`.
- Échelle XXL (fluide, `clamp`) : `text-display-xxl` (hero d'accueil, 44→104px), `text-display-xl` (titre de page, 36→72px), `text-display-lg` (titre de section, 28→48px). Classes équivalentes `.display-xxl|xl|lg`. En dessous : échelle Tailwind classique.
- Titres de contenu `h1…h6` héritent Fraunces + `letter-spacing` serré. Chiffres de données : `tabular-nums`.
- Eyebrow : `text-xs font-semibold uppercase tracking-[0.2em] text-primary`.

## Espacements, rayons, ombres
- Conteneur : `max-w-6xl` (contenu) / `max-w-7xl` (large) / `max-w-3xl` (lecture), `px-4 sm:px-8`. Rythme vertical de section : `py-14 sm:py-20`.
- Rayon de base `--radius: 0.75rem` (`rounded-lg`), cartes `rounded-2xl`, contrôles/pastilles `rounded-full`.
- Ombres : `shadow-sm|md|lg` (tokens, adaptées au thème), `shadow-glow-blue`, `shadow-glow-red` pour états actifs/focus visuel.
- Utilitaires : `.night-bg` (fond halos tricolores), `.grain` (texture, nécessite `relative` ; ajoute un `::after`), `.glass` (verre), `.tricolor-bar`, `.text-gradient-tricolor`.

## Primitives (`@/components/design`)
Toutes importables depuis `@/components/design`.

- **`PageHero`** `{eyebrow, title, description, actions, aside, size: lg|xl|xxl}` — en-tête de page, porte le `<h1>` (un seul par page). Se glisse sous le header flottant (`-mt-[4.75rem]`) : le placer **immédiatement après `<SiteHeader />`**. `size="xxl"` réservé à l'accueil.
- **`Section`** `{eyebrow, title, description, width: narrow|default|wide, id}` — conteneur + en-tête éditorial (`h2`). Chaque bloc de page = une `Section`.
- **`GlowCard`** `{glow: blue|red|white, interactive}` — carte verre avec halo suivant le pointeur (désactivé tactile et en reduced-motion). Pour stats, listes, graphiques encadrés.
- **`BentoGrid` / `BentoItem`** `{span: 2|3|4|6, rows: 1|2}` — grille 1 col mobile, 2 col `sm`, 6 col `lg`. Typiquement `GlowCard` dans chaque `BentoItem`.
- **`AnimatedNumber`** `{value, decimals, prefix, suffix, duration}` — compteur déclenché à l'entrée dans le viewport (une fois). `aria-label` porte la valeur finale. Pour chiffres clés uniquement (≤ 6 par écran).
- **`Reveal`** `{delay, y, as}` — apparition au scroll (fade + 24px), une seule fois. Décaler les frères de 0.06–0.12 s.
- **`SegmentedControl`** `{options, value, onChange, label, size}` — sélection années/tours (radiogroup, flèches clavier, pastille animée). Pour des listes > 8 options, garder le `Select`.
- **`CandidateAvatar`** `{prenom, nom, color, size: sm|md|lg|xl}` — photo via `src/lib/candidatePhotos`, repli initiales (aussi sur erreur image). `color` = anneau (couleur candidat).

## Shell
- **`SiteHeader`** : barre flottante en verre (`sticky`, hauteur réservée 4.75rem), nav active animée (`layoutId`), sélecteur d'année (paramètre `?year=`), bascule de thème (`ThemeToggle`), menu mobile plein écran (Radix Dialog : focus piégé, Échap, `AnimatePresence`). Nav < `lg` = menu plein écran.
- **`SiteFooter`** : fond nuit + grain + liseré tricolore, mêmes liens qu'avant.
- Squelette de page : `<div className="min-h-screen flex flex-col bg-background"> <SEOHead/> <JsonLd/> <SiteHeader/> <main className="flex-1"> <PageHero/> <Section/>… </main> <SiteFooter/> </div>`.

## Règles d'animation
- Librairie : `framer-motion` uniquement (pas de nouvelle dépendance). Courbe : `[0.22, 1, 0.36, 1]`, durées 0.3–0.6 s, jamais > 1.4 s (compteurs).
- Toute animation doit se dégrader si `useReducedMotion()` (les primitives le font déjà). Les CSS `animate-*` sont neutralisées par la media query globale.
- Animer `opacity` et `transform` uniquement (pas de layout), `viewport={{ once: true }}`.
- Pas d'animation infinie sur du contenu lisible ; `animate-float-slow`/`animate-sheen` réservées à des éléments décoratifs.
- Pas d'animation bloquant le contenu : le texte SEO doit rester dans le DOM (opacity, pas `display:none`).

## Accessibilité
- Texte courant ≥ 4.5:1 sur `background`/`card` dans les deux thèmes ; ne pas descendre sous `text-muted-foreground` pour du texte utile.
- Focus visible global (`:focus-visible`), cibles tactiles ≥ 40px, `aria-label` sur les boutons icône.

## Checklist volet
1. Pas de couleur en dur ; tokens et primitives.
2. Un `h1` (PageHero), `Section` pour le reste, contenu SEO et JSON-LD intacts.
3. Vérifier thèmes sombre ET clair, mobile 375px et desktop.
4. `npm run lint && npm test && npm run build`.
