---
title: Levantar Órbita en local y corregir el README
labels: docs,good-first-issue
asignar: ella
milestone: Sprint 1 · Arranque
---
## Historia

Como persona que entra al proyecto, quiero que el README me lleve de cero a la app corriendo sin pedir ayuda, para que quien llegue después tampoco la necesite.

## Criterios de aceptación

- [ ] MySQL corriendo en Docker. En Workbench, el usuario `neo_app` solo ve el esquema `neo`
- [ ] Backend: `.venv` creado, `.env` con un `JWT_SECRET` generado, `pytest` en verde y http://localhost:8000/health responde
- [ ] Frontend: dependencias instaladas con `npm ci`, `.env.local` creado y la página muestra "API en línea · ambiente local"
- [ ] Back y front corriendo a la vez en dos terminales (README, sección 7): al detener el backend, la página cambia a "API fuera de línea", y al arrancarlo vuelve a "en línea"
- [ ] `pre-commit install` hecho
- [ ] PR hacia `dev` con tus correcciones al README: pasos que faltaban, errores que te salieron y cómo los resolviste (agrégalos a "Problemas comunes")
- [ ] El check `ci-ok` está en verde y JL aprobó el PR

## Notas técnicas

- Clona el repo en `~/Developer`, no en Documentos ni en el Escritorio (README, sección 2).
- Rama: `docs/<número de este issue>-readme`.
- Commit con Conventional Commits, por ejemplo `docs(readme): aclarar cómo activar el ambiente virtual`.
- Si todo funcionó a la primera, agrega lo que a ti te habría servido saber antes de empezar. Siempre hay algo.
- Para entender el porqué de cada paso: `docs/guias/01-como-armamos-el-proyecto.md`.
- Si te atoras más de 45 minutos, comenta en este issue qué intentaste y qué error te salió.
