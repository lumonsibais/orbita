---
title: Release v0.1.0: primera promoción dev → qa → main
labels: infra
asignar: jl
milestone: Sprint 1 · Arranque
---
## Historia

Como equipo, queremos cerrar el sprint 1 con un release etiquetado, recorriendo por primera vez el ciclo completo de ramas.

## Criterios de aceptación

- [ ] Code freeze: PR `dev → qa` fusionado con merge commit
- [ ] QA hecho por ella con `docs/qa/checklist.md`, copiado como comentario en el PR de promoción
- [ ] PR `qa → main` con merge commit, revisado por ella y fusionado por JL
- [ ] Tag `v0.1.0` en `main` y GitHub Release con notas generadas
- [ ] Demo y retro del sprint

## Notas técnicas

- Hasta el sprint 3 no existe el ambiente qa: el QA se hace en local, sobre la rama `qa`.
- Hacer la promoción en pantalla compartida, explicando cada paso: desde el sprint 5 las hace ella.
- Pasos del tag y el release: sección "Paso 9" de `docs/guias/01-como-armamos-el-proyecto.md`.
