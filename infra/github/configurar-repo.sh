#!/usr/bin/env bash
# Configura el repo de Órbita en GitHub: ramas dev/qa/main, protecciones, etiquetas y milestones.
#
# Requisitos:
#   - gh instalado y autenticado (gh auth login)
#   - el repo ya existe en GitHub, `origin` apunta a él y main tiene al menos un commit
#   - las protecciones de rama solo funcionan en repos públicos o con GitHub Pro/Team
#
# Uso, desde la raíz del repo:
#   ./infra/github/configurar-repo.sh usuario/orbita
#
# Se puede correr varias veces: lo que ya existe se actualiza o se salta.
set -euo pipefail

REPO="${1:?Uso: $0 usuario/orbita}"

echo "→ Ramas largas: qa sale de main, y dev sale de qa"
# El código sube por promociones (dev → qa → main) y baja por back-merges (main → qa → dev),
# así que cada rama nace de la que tiene encima.
git push -u origin main

# crear_rama <nueva> <de dónde sale>
crear_rama() {
  if git show-ref --verify --quiet "refs/heads/$1"; then
    echo "  $1 ya existía en tu máquina"
  else
    git branch "$1" "$2"
    echo "  $1 creada desde $2"
  fi
  git push -u origin "$1" 2>/dev/null || echo "  $1 ya existía en GitHub"
}
crear_rama qa main
crear_rama dev qa

echo "→ Ajustes del repo"
gh repo edit "$REPO" \
  --default-branch dev \
  --enable-squash-merge \
  --enable-merge-commit \
  --enable-rebase-merge=false \
  --delete-branch-on-merge

echo "→ Protección de dev, qa y main"
# El check obligatorio es `ci-ok` (.github/workflows/ci.yml). En dev, además, la rama del PR
# tiene que estar al día con dev antes de fusionar: eso obliga a hacer rebase.
for rama in dev qa main; do
  if [ "$rama" = "dev" ]; then al_dia=true; else al_dia=false; fi
  gh api --method PUT "repos/$REPO/branches/$rama/protection" --input - >/dev/null <<JSON
{
  "required_status_checks": { "strict": $al_dia, "contexts": ["ci-ok"] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "required_conversation_resolution": true,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
  echo "  $rama protegida"
done

echo "→ Etiquetas"
etiqueta() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }
etiqueta backend          "1d76db" "Código del backend"
etiqueta frontend         "5319e7" "Código del frontend"
etiqueta infra            "0e8a16" "Docker, CI/CD, AWS"
etiqueta docs             "c5def5" "Documentación"
etiqueta good-first-issue "7057ff" "Buena para empezar"
etiqueta bug              "d73a4a" "Algo no funciona"
etiqueta qa               "fbca04" "Encontrado en el QA manual"
etiqueta hotfix           "b60205" "Corrección urgente en producción"
etiqueta dependencias     "ededed" "Actualizaciones de Dependabot"

echo "→ Milestones (un sprint cada uno)"
for sprint in \
  "Sprint 0 · Fundamentos" \
  "Sprint 1 · Arranque" \
  "Sprint 2 · Esqueleto modular y dominio" \
  "Sprint 3 · Integración NASA y ambientes" \
  "Sprint 4 · Módulo identity" \
  "Sprint 5 · Frontend base" \
  "Sprint 6 · Funcionalidades núcleo" \
  "Sprint 7 · Calidad y seguridad" \
  "Sprint 8 · Release 1.0"; do
  gh api "repos/$REPO/milestones" -f title="$sprint" >/dev/null 2>&1 \
    && echo "  $sprint" || echo "  $sprint (ya existía)"
done

echo "Listo. Falta a mano: el tablero (GitHub Projects) y las fechas de cada milestone."
