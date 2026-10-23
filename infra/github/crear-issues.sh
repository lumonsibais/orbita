#!/usr/bin/env bash
# Crea en GitHub los issues de un sprint a partir de los archivos de infra/github/backlog/<sprint>/.
#
# Cada archivo empieza con un encabezado entre líneas "---":
#   title: Título del issue
#   labels: docs,good-first-issue
#   asignar: ella        (ella | jl)
#   milestone: Sprint 1 · Arranque
# y después va el cuerpo del issue en Markdown.
#
# Uso, desde la raíz del repo y con gh autenticado:
#   ./infra/github/crear-issues.sh usuario/orbita sprint-1 USUARIO_JL USUARIO_ELLA
set -euo pipefail

REPO="${1:?Uso: $0 usuario/orbita sprint-N usuario_jl usuario_ella}"
SPRINT="${2:?Falta el sprint, por ejemplo sprint-1}"
USUARIO_JL="${3:?Falta el usuario de GitHub de JL}"
USUARIO_ELLA="${4:?Falta el usuario de GitHub de ella}"
CARPETA="$(dirname "$0")/backlog/$SPRINT"

# Lee un campo del encabezado: campo archivo nombre
campo() { awk -v k="$2" '/^---$/{n++; next} n==1 && index($0, k": ")==1 {print substr($0, length(k)+3); exit}' "$1"; }
# Todo lo que va después del encabezado
cuerpo() { awk 'n<2 && /^---$/{n++; next} n>=2' "$1"; }

for archivo in "$CARPETA"/*.md; do
  titulo="$(campo "$archivo" title)"
  case "$(campo "$archivo" asignar)" in
    jl) asignado="$USUARIO_JL" ;;
    ella) asignado="$USUARIO_ELLA" ;;
    *) echo "  $archivo: 'asignar' debe ser jl o ella" >&2; exit 1 ;;
  esac

  cuerpo "$archivo" | gh issue create --repo "$REPO" \
    --title "$titulo" \
    --body-file - \
    --label "$(campo "$archivo" labels)" \
    --milestone "$(campo "$archivo" milestone)" \
    --assignee "$asignado"
done
