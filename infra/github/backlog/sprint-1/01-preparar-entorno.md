---
title: Preparar mi entorno de desarrollo
labels: infra,good-first-issue
asignar: ella
milestone: Sprint 1 · Arranque
---
## Historia

Como nueva integrante del equipo, quiero tener mi máquina lista para poder trabajar en Órbita.

## Criterios de aceptación

- [ ] Git configurado con tu nombre y correo (`git config --global --list` los muestra)
- [ ] Llave SSH agregada en GitHub (`ssh -T git@github.com` te saluda con tu usuario)
- [ ] Instalados: pyenv con Python 3.11, nvm con Node 24, Docker Desktop, VS Code con las extensiones recomendadas y MySQL Workbench
- [ ] Repo clonado y en la rama `dev`

## Notas técnicas

- Sigue las secciones 1 y 2 del README.
- Si algún paso del README no te funcionó o le faltaba algo, anótalo: lo corriges en el siguiente issue.
- Este issue no lleva PR. Se cierra con un comentario con la salida de `python --version`, `node --version` y `docker --version`.
