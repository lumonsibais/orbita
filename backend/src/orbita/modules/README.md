# Módulos

El backend es un monolito modular: un solo proceso, partido en módulos que se comportan como microservicios. Cada módulo es dueño de su esquema de MySQL y los demás solo pueden usarlo a través de su `public.py`.

| Módulo | Responsabilidad | Esquema MySQL |
| --- | --- | --- |
| `identity` | Registro, login, JWT y roles | `identity` |
| `neo` | Asteroides y acercamientos, sincronizados con NeoWs y JPL CAD | `neo` |
| `watchlist` | Listas de vigilancia y notas | `watchlist` |
| `media` | Imagen astronómica del día (APOD) | `media` |
| `impact` | Calculadora de impacto | Ninguno: no guarda datos, por eso no tiene `repositories/` |

## Capas de cada módulo

Las dependencias van en un solo sentido: `controllers → services → repositories → models`. Una capa nunca llama a la de arriba.

| Carpeta | Qué va aquí | Puede usar |
| --- | --- | --- |
| `controllers/` | Routers de FastAPI: reciben la petición, la validan con un schema, llaman a un service y devuelven la respuesta. Sin lógica de negocio. | `services`, `models` |
| `services/` | La lógica de negocio en clases (`AsteroidService`, `ImpactCalculator`). Reciben sus repositorios por el constructor. | `repositories`, `models`, `utils` |
| `repositories/` | Acceso a datos: consultas SQLAlchemy al esquema del módulo y clientes de APIs externas (`NeoWsClient`). | `models`, `utils` |
| `models/` | Entidades SQLAlchemy (`entities.py`) y schemas Pydantic de entrada y salida (`schemas.py`). | Ninguna otra capa |
| `utils/` | Funciones auxiliares sin estado: conversiones de unidades y, en `identity`, hashing y JWT. | Nada del módulo |
| `public.py` | La fachada: lo único que otros módulos pueden importar. | Lo que el módulo quiera exponer |

## Reglas entre módulos

- Desde otro módulo solo se importa `public.py`: `from orbita.modules.neo.public import get_asteroid` está bien; `from orbita.modules.neo.repositories import ...` está prohibido.
- Sin `JOIN` ni llaves foráneas entre esquemas: `watchlist` guarda `asteroid_id` y le pide los datos a `neo` por su fachada.
- Si necesitas algo que otro módulo no expone, abre un issue a su dueño pidiendo el cambio en su `public.py`.

En el sprint 2 llegan `shared_kernel/` (tipos comunes y el bus de eventos), las migraciones de Alembic por módulo y los contratos de import-linter, que harán fallar el CI si alguien rompe estas reglas.
