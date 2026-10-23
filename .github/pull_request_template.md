## Qué cambia

<!-- Una o dos frases. -->

## Por qué

Cierra #

## Cómo probarlo

<!-- Pasos para que la otra persona lo pruebe en su máquina o en dev. -->

1.

## Capturas

<!-- Solo si toca la interfaz. -->

## Checklist (Definition of Done)

- [ ] Cumple los criterios de aceptación del issue
- [ ] Tiene pruebas nuevas o actualizadas y el CI está en verde
- [ ] Mi rama está rebasada sobre `dev` actualizado y sin conflictos
- [ ] Respeta las fronteras: no importa el interior de otro módulo ni lee tablas de otro esquema
- [ ] Si agrego una variable de entorno: está en `.env.example`, en `config.py` y en los secretos de dev y qa
- [ ] Si agrego una dependencia: está en `pyproject.toml` o `package.json`
- [ ] Si cambia el esquema: incluye migración de Alembic probada hacia arriba y hacia abajo
- [ ] Sin secretos, credenciales ni datos personales en el código o los logs
- [ ] Documentación actualizada si cambia la API o el arranque
