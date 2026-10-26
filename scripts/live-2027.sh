#!/usr/bin/env bash
# Mise à jour des résultats en direct de la soirée électorale 2027 (voir docs/soiree-electorale-2027.md).
#
# Usage : scripts/live-2027.sh            # récupère uniquement (rien n'est commité ni publié)
#         LIVE_2027_PUBLISH=1 scripts/live-2027.sh   # récupère, commite, pousse et met en ligne
#
# Double interrupteur, tous deux désactivés par défaut :
#   1. "enabled": true dans scripts/live-2027.config.json (sinon aucune récupération) ;
#   2. LIVE_2027_PUBLISH=1 dans l'environnement de la routine (sinon aucune publication).
# La mise en ligne reprend le garde-fou de update-data-2027.sh : si du code non publié sépare la
# production (tag git `prod`) de main, rien n'est déployé (feu vert de Florent requis avant le soir).
#
# Codes de sortie : 0 ok (ou désactivé), 2 dépôt invalide, 3 source rejetée, 5 mise en ligne refusée,
# 6 échec du déploiement.
set -uo pipefail

cd "$(dirname "$0")/.."
LIVE=public/data/live-2027
ALLOWED='^(public/data/|docs/|scripts/data-sources-2027\.json$|scripts/live-2027\.config\.json$)'
log() { echo "[live-2027] $*"; }
only_allowed() { [ -z "$(grep -Ev "$ALLOWED")" ]; }

[ "$(node -p 'require("./scripts/live-2027.config.json").enabled === true')" = "true" ] \
  || { log "désactivé (enabled = false) : rien à faire."; exit 0; }

if [ "${LIVE_2027_PUBLISH:-0}" = "1" ]; then
  [ "$(git branch --show-current)" = "main" ] || { log "ERREUR : la branche active n'est pas main."; exit 2; }
  git fetch -q origin main || { log "ERREUR : git fetch impossible."; exit 2; }
  git status --porcelain | cut -c4- | only_allowed || { log "ERREUR : changements hors données dans le dépôt."; exit 2; }
  [ -n "$(git status --porcelain)" ] || git merge -q --ff-only origin/main || { log "ERREUR : main diverge de origin/main."; exit 2; }
fi

node scripts/fetch-live-2027.mjs || exit $?

if [ "${LIVE_2027_PUBLISH:-0}" != "1" ]; then log "LIVE_2027_PUBLISH non défini : rien n'est publié."; exit 0; fi

# Seul le dossier des résultats en direct est commité (les autres changements restent en l'état).
git add -A "$LIVE"
if git diff --cached --quiet; then log "aucun changement depuis la dernière publication."; exit 0; fi
git commit -q -m "Résultats en direct 2027 : relevé du $(date '+%Y-%m-%d %H:%M')" -- "$LIVE" || { log "ERREUR : commit."; exit 2; }
git push -q origin main || { log "ERREUR : push."; exit 2; }

if ! git diff --name-only prod HEAD | only_allowed; then
  log "MISE EN LIGNE REFUSÉE : du code non publié sépare la production de main :"
  git diff --name-only prod HEAD | grep -Ev "$ALLOWED" | sed 's/^/  /'
  exit 5
fi
npm run deploy >/tmp/presifrance-live-deploy.log 2>&1 || { tail -30 /tmp/presifrance-live-deploy.log; log "ERREUR : déploiement."; exit 6; }
code=$(curl -s -o /dev/null -w '%{http_code}' "https://presifrance.fr/data/live-2027/status.json")
log "mis en ligne : $(git rev-parse --short HEAD) (status.json : HTTP $code)."
[ "$code" = "200" ] || exit 6
