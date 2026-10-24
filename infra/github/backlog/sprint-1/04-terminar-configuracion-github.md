---
title: Terminar la configuración de GitHub
labels: infra
asignar: jl
milestone: Sprint 1 · Arranque
---
## Historia

Como equipo, queremos el repo listo para trabajar con tablero y protecciones comprobadas.

## Criterios de aceptación

- [ ] Ella tiene acceso de escritura al repo
- [ ] Tablero en GitHub Projects con las columnas Backlog, Sprint, En progreso, En revisión y Hecho, con los issues del sprint 1
- [ ] Fechas de entrega en los milestones de los sprints 0 a 8
- [ ] Ella deja su primera revisión de código: al menos un comentario en un PR abierto de JL o de Dependabot
- [ ] Comprobado que un push directo a `dev` es rechazado y que un PR sin `ci-ok` en verde no se puede fusionar
- [ ] Comprobado que la aprobación de ella no habilita el merge: solo cuenta la de JL, el code owner

## Notas técnicas

- Para su primera revisión, elegir un PR pequeño y explicarle en la descripción qué cambia y por qué. Un comentario que sea una pregunta también cuenta.
- La aprobación es solo de JL (`.github/CODEOWNERS` y `docs/adr/0002-solo-jl-aprueba.md`).
