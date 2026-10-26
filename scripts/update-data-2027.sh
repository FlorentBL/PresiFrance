#!/usr/bin/env bash
# Mise à jour automatique des données 2027 (sondages, parrainages) puis mise en ligne.
#
# Usage : scripts/update-data-2027.sh [--no-deploy]
#
# Garde-fous :
#   - part de main propre et à jour ; seuls des changements sous public/data/ ou dans
#     scripts/data-sources-2027.json peuvent être présents (édition des candidats/calendrier) ;
#   - la mise en ligne n'a lieu que si TOUT ce qui diffère de la version en production
#     (tag git `prod`) est sous public/data/, docs/ (non servi) ou dans scripts/data-sources-2027.json :
#     du code non publié bloque la mise en ligne automatique (feu vert de Florent requis) ;
#   - sondages : refus si le nombre de sondages baisse (probable échec d'analyse de Wikipédia) ;
#   - typecheck, tests et build doivent passer avant le déploiement.
#
# Codes de sortie : 0 = à jour ou publié, 2 = état du dépôt invalide, 3 = anomalie de données,
# 4 = contrôles en échec, 5 = mise en ligne refusée (code non publié), 6 = échec du déploiement.
set -uo pipefail

cd "$(dirname "$0")/.."
DEPLOY=1
[ "${1:-}" = "--no-deploy" ] && DEPLOY=0
TODAY=$(date +%Y-%m-%d)
ALLOWED='^(public/data/|docs/|scripts/data-sources-2027\.json$)'
POLLS=public/data/presidential/polls-2027-round1.json

log() { echo "[data-2027] $*"; }
# Lit des chemins sur l'entrée standard ; vrai si tous sont autorisés (données).
only_allowed() { [ -z "$(grep -Ev "$ALLOWED")" ]; }

# 1. Dépôt : main, sans changement hors données, à jour.
[ "$(git branch --show-current)" = "main" ] || { log "ERREUR : la branche active n'est pas main."; exit 2; }
if ! git status --porcelain | cut -c4- | only_allowed; then
  log "ERREUR : changements hors données dans le dépôt :"; git status --porcelain; exit 2
fi
git fetch -q origin main || { log "ERREUR : git fetch impossible."; exit 2; }
if [ -z "$(git status --porcelain)" ]; then
  git merge -q --ff-only origin/main || { log "ERREUR : main diverge de origin/main."; exit 2; }
elif [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  log "ERREUR : données modifiées localement alors que main n'est pas à jour."; exit 2
fi
git rev-parse -q --verify refs/tags/prod >/dev/null || git fetch -q origin 'refs/tags/prod:refs/tags/prod' || true
git rev-parse -q --verify refs/tags/prod >/dev/null || { log "ERREUR : tag prod introuvable."; exit 2; }

# 2. Sondages.
cp "$POLLS" /tmp/presifrance-polls-before.json
if ! node scripts/build-polls-2027.mjs; then
  git checkout -- "$POLLS"; log "ERREUR : échec du script des sondages."; exit 3
fi
node -e '
const fs = require("fs");
const [before, after] = process.argv.slice(1).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
if (after.polls.length < before.polls.length || after.candidates.length === 0) {
  console.error(`[data-2027] ANOMALIE sondages : ${before.polls.length} -> ${after.polls.length} sondages, ${after.candidates.length} candidats.`);
  process.exit(3);
}
const same = JSON.stringify([before.polls, before.candidates]) === JSON.stringify([after.polls, after.candidates]);
console.log(`[data-2027] sondages : ${before.polls.length} -> ${after.polls.length}${same ? " (inchangés)" : ""}`);
process.exit(same ? 10 : 0);
' /tmp/presifrance-polls-before.json "$POLLS"
rc=$?
if [ $rc -eq 10 ]; then
  cp /tmp/presifrance-polls-before.json "$POLLS"   # seule la date de génération changerait
elif [ $rc -ne 0 ]; then
  cp /tmp/presifrance-polls-before.json "$POLLS"; exit 3
fi

# 3. Parrainages : seulement si l'URL de publication 2027 est renseignée.
PURL=$(node -p 'require("./scripts/data-sources-2027.json").parrainagesCsvUrl || ""')
if [ -n "$PURL" ]; then
  if ! PARRAINAGES_2027_URL="$PURL" node scripts/build-parrainages.mjs --year 2027; then
    git checkout -- public/data/parrainages; git clean -qf public/data/parrainages
    log "ERREUR : échec du script des parrainages."; exit 3
  fi
else
  log "parrainages 2027 : URL de publication non renseignée (publication à venir)."
fi

# 4. Rien de nouveau ?
if [ -z "$(git status --porcelain)" ]; then
  log "aucune donnée nouvelle."
  CHANGED=0
else
  CHANGED=1
  git status --porcelain | sed 's/^/[data-2027] modifié : /'
fi

# 5. Contrôles.
if [ $CHANGED -eq 1 ]; then
  npx tsc -b --noEmit || { log "ERREUR : typecheck."; exit 4; }
  NODE_ENV=test npx vitest run >/tmp/presifrance-tests.log 2>&1 || { tail -30 /tmp/presifrance-tests.log; log "ERREUR : tests."; exit 4; }
  git add -A public/data scripts/data-sources-2027.json
  git commit -q -m "Données 2027 : mise à jour automatique du $TODAY" || { log "ERREUR : commit."; exit 4; }
  git push -q origin main || { log "ERREUR : push."; exit 4; }
  log "commit $(git rev-parse --short HEAD) poussé."
fi

# 6. Mise en ligne si la production est en retard et que l'écart ne contient que des données.
if [ "$(git rev-parse HEAD)" = "$(git rev-parse prod)" ]; then
  log "production à jour ($(git rev-parse --short prod))."; exit 0
fi
if ! git diff --name-only prod HEAD | only_allowed; then
  log "MISE EN LIGNE REFUSÉE : du code non publié sépare la production ($(git rev-parse --short prod)) de main :"
  git diff --name-only prod HEAD | grep -Ev "$ALLOWED" | sed 's/^/  /'
  exit 5
fi
[ $DEPLOY -eq 1 ] || { log "--no-deploy : mise en ligne non lancée."; exit 0; }
npm run deploy >/tmp/presifrance-deploy.log 2>&1 || { tail -30 /tmp/presifrance-deploy.log; log "ERREUR : déploiement."; exit 6; }
for p in / /sondages-presidentielle-2027 /parrainages /presidentielle-2027; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://presifrance.fr$p")
  log "production $p : HTTP $code"
  [ "$code" = "200" ] || exit 6
done
log "mis en ligne : $(git rev-parse --short HEAD)."
