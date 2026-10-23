---
title: Kata de POO: Vector3 y Orbit
labels: backend,good-first-issue
asignar: ella
milestone: Sprint 1 · Arranque
---
## Historia

Como desarrolladora del equipo, quiero practicar clases, pruebas y el depurador con un problema pequeño antes de tocar el dominio de Órbita.

## Criterios de aceptación

- [ ] Clase `Vector3` inmutable (`@dataclass(frozen=True)`) con `x`, `y`, `z`; suma, resta, multiplicación por un número, magnitud y producto punto
- [ ] Clase `Orbit` para una órbita circular: recibe el radio (m) y la masa del cuerpo central (kg), y calcula la velocidad orbital `v = √(G·M / r)` y el periodo `T = 2πr / v`
- [ ] Pruebas con pytest: al menos un caso por método, y la órbita de la Estación Espacial Internacional (400 km sobre la Tierra, radio terrestre 6 371 km, masa 5.972 × 10²⁴ kg) da unos 7.67 km/s y 92.4 minutos, comprobado con `pytest.approx`
- [ ] Tipos en todo el código y `mypy` sin errores
- [ ] Una captura en el PR del depurador detenido dentro de `Orbit`
- [ ] PR en tu repo `orbita-katas`, con JL como revisor

## Notas técnicas

- Se hace en `orbita-katas`, no en este repo: es práctica y no forma parte del producto.
- Usa un ambiente virtual propio en ese repo, igual que en `backend/`.
- `G = 6.674 × 10⁻¹¹ m³/(kg·s²)`. Trabaja en metros y segundos, y convierte solo al final.
- Escribe primero la prueba de la Estación Espacial y luego la clase: así sabes cuándo terminaste.
