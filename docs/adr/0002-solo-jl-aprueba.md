# 0002. Solo JL aprueba los Pull Requests

Fecha: 2026-10-24 · Estado: aceptada

## Contexto

Las protecciones de `dev`, `qa` y `main` pedían una aprobación de cualquier persona con acceso de escritura. En un equipo de dos, eso significaba que la aprobación de ella bastaba para fusionar los PR de JL y los de Dependabot. JL es el dueño del repo y responde por lo que llega a cada rama, así que quiere que ningún cambio entre sin pasar por él.

## Decisión

`.github/CODEOWNERS` lista solo a JL para todo el repo, y las tres ramas exigen la aprobación de un code owner. Como GitHub no deja aprobar el PR propio, `enforce_admins` queda en `false`: JL, que es administrador, fusiona sus propios PR saltándose la regla de aprobación.

## Consecuencias

- Los PR de ella y los de Dependabot solo se fusionan con la aprobación de JL. Ella puede revisar y comentar, y GitHub hasta le deja marcar "Approve", pero su aprobación no habilita el merge.
- Ella sigue revisando los PR de JL con comentarios: es parte de aprender a leer código ajeno.
- Como administrador, JL también puede hacer push directo o fusionar con el CI en rojo. Por acuerdo, no lo hace: sus cambios entran por PR y esperan a que `ci-ok` salga en verde.
- `CODEOWNERS` se lee desde la rama destino del PR. Hasta que el archivo llegue a `qa` y a `main` con la primera promoción, en esas ramas cuenta cualquier aprobación.
- El reparto de módulos del plan ya no se refleja en `CODEOWNERS`: el dueño de un módulo revisa los cambios a su fachada, pero no los aprueba.

## Alternativas consideradas

- Mantener una aprobación de cualquiera: la de ella bastaba para fusionar los cambios de JL.
- Dejar a ella con permiso de solo lectura para que no pueda aprobar: tampoco podría subir ramas, y trabajaría desde un fork.
- Rulesets con JL como único actor que puede saltarse las reglas, solo desde un PR: obliga a JL a abrir PR, pero hay que pasar las protecciones clásicas a rulesets y separar el check `ci-ok` en otro ruleset para que el salto no lo incluya. Se puede revisar más adelante.
