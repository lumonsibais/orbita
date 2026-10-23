# 0001. Tres ramas largas: dev, qa y main

Fecha: 2026-10-22 · Estado: aceptada

## Contexto

Órbita es un proyecto de aprendizaje, y queremos practicar lo que se vive en un equipo real: promover cambios entre ambientes, congelar código antes de un release, corregir bugs encontrados en QA y lanzar hotfixes. Con GitHub Flow (solo `main` y ramas de trabajo) nada de eso aparece.

## Decisión

Usamos tres ramas largas, una por ambiente: `dev` (integración, rama por defecto), `qa` (candidato a release) y `main` (producción). El trabajo diario sale de `dev` en ramas `feat/*`, `fix/*` o `chore/*` y vuelve por PR con squash. Las promociones `dev → qa` y `qa → main` son PR con merge commit. Los hotfixes salen de `main` y después se hace back-merge a `qa` y `dev`.

## Consecuencias

- Hay que mantener tres ramas sincronizadas y hacer back-merges después de cada hotfix.
- Las promociones usan merge commit y no squash: con squash, git pierde la pista de qué commits ya pasaron y aparecen conflictos fantasma.
- Cada release pasa por QA manual en un ambiente propio antes de llegar a producción.

## Alternativas consideradas

- GitHub Flow: más simple, pero no permite practicar ambientes ni promociones.
- Git Flow completo (con ramas `release/*`): demasiada ceremonia para dos personas.
