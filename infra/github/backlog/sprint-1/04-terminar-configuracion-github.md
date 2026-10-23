---
title: Terminar la configuración de GitHub
labels: infra
asignar: jl
milestone: Sprint 1 · Arranque
---
## Historia

Como equipo, queremos el repo listo para trabajar con tablero, dueños de código y protecciones comprobadas.

## Criterios de aceptación

- [ ] Ella tiene acceso de escritura al repo
- [ ] Tablero en GitHub Projects con las columnas Backlog, Sprint, En progreso, En revisión y Hecho, con los issues del sprint 1
- [ ] Fechas de entrega en los milestones de los sprints 0 a 8
- [ ] PR hacia `dev` con los usuarios reales en `.github/CODEOWNERS`, revisado y aprobado por ella
- [ ] Comprobado que un push directo a `dev` es rechazado y que un PR sin `ci-ok` en verde no se puede fusionar

## Notas técnicas

- El PR de CODEOWNERS es su primera revisión de código: explicar en la descripción qué hace el archivo y pedirle al menos un comentario.
