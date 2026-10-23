# Checklist de QA

Se copia en un comentario del PR de promoción `dev → qa` y se llena probando en el ambiente qa. El PR `qa → main` no se fusiona hasta que todo esté marcado o tenga su issue de bug abierto.

Release: vX.Y.Z · Probó: · Fecha:

## Siempre

- [ ] `/health` responde `{"status": "ok", "env": "qa"}`
- [ ] Swagger (`/docs`) carga y muestra los endpoints nuevos
- [ ] Los cambios de este release, uno por uno (agrega una línea por cada PR):
  - [ ] #

## Desde el sprint 4

- [ ] Registro de una cuenta nueva
- [ ] Login, refresh y logout
- [ ] Una ruta protegida rechaza peticiones sin token

## Desde el sprint 6

- [ ] Feed de asteroides con filtros
- [ ] Agregar y quitar un asteroide de la lista de vigilancia
- [ ] Calculadora de impacto con un caso conocido

## Bugs encontrados

| Issue | Severidad | ¿Bloquea el release? |
| --- | --- | --- |
| # | | |
