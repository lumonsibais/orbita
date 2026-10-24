# Proyecto Órbita — Plan de desarrollo

22 de octubre de 2026 · José Luis Ramírez Monsibais

## Resumen

**Órbita** es una web (y después app móvil) para seguir asteroides que pasan cerca de la Tierra: cada usuario arma su lista de vigilancia, recibe alertas de acercamientos y calcula la energía de un impacto hipotético. Los datos vienen de APIs públicas de la NASA y del JPL, y se guardan en MySQL. El backend es un monolito modular: un solo despliegue dividido en módulos con fronteras de microservicio, que se pueden extraer cuando haga falta.

La elegimos porque obliga a tocar todo lo que tiene un proyecto real: consumir APIs externas, modelar una base de datos, autenticación con JWT, roles, tareas programadas, pruebas, CI/CD y despliegue. Además tiene física de verdad (energía cinética, escalamiento de cráteres, órbitas), así que el dominio les resulta natural y el código de negocio es interesante de diseñar con POO.

Es una mentoría para una trainee sin experiencia previa en programación, pero no es un curso: trabajamos como un equipo pequeño de verdad, con tareas repartidas, Pull Requests revisados, conflictos entre ramas, rebase y tres ambientes (dev, qa y producción). Los errores y los imprevistos son parte del temario.

El plan arranca con un **sprint 0 de fundamentos (3 semanas)** y sigue con **8 sprints de 2 semanas** hasta la v1.0, pensado para medio tiempo, más una fase de despliegue en AWS. Cada sprint cierra con un release etiquetado en GitHub. Con cero experiencia, el ritmo lo marca lo que ella entiende y no el calendario: si hace falta, se recorta alcance antes que saltarse una explicación.

## Funcionalidades

El MVP (v1.0) es todo lo marcado como MVP; lo demás queda para la fase 2 o la app móvil.

| Funcionalidad | Qué hace | Fuente de datos | Alcance |
| --- | --- | --- | --- |
| Registro e inicio de sesión | Cuentas con email y contraseña, JWT, cierre de sesión | Propia | MVP |
| Roles | `user` y `admin`; el admin fuerza sincronizaciones y ve métricas | Propia | MVP |
| Feed de asteroides | Lista de objetos cercanos por rango de fechas, con filtros (peligroso, tamaño, distancia) | [NeoWs](https://api.nasa.gov/) | MVP |
| Detalle de asteroide | Diámetro estimado, velocidad, distancia mínima, historial de acercamientos | NeoWs + [JPL CAD](https://ssd-api.jpl.nasa.gov/doc/cad.html) | MVP |
| Lista de vigilancia | El usuario guarda asteroides y les pone notas | Propia | MVP |
| Calculadora de impacto | Energía cinética en megatones de TNT y diámetro aproximado de cráter según diámetro, densidad y velocidad | Lógica propia (física) | MVP |
| Imagen astronómica del día | Portada con la APOD y archivo navegable | [APOD](https://api.nasa.gov/) | MVP |
| Alertas de acercamiento | Aviso cuando un asteroide vigilado se acerca a menos de X distancias lunares | Job propio sobre NeoWs | Fase 2 |
| Clima espacial | Línea de tiempo de fulguraciones y eyecciones de masa coronal | [DONKI](https://api.nasa.gov/) | Fase 2 |
| Bitácora de observación | El usuario registra observaciones con fecha, lugar y foto | Propia | Fase 2 |
| App móvil | Feed, vigilancia y alertas push | Misma API | Fase 2 |

La API de fotos de los rovers de Marte [fue archivada](https://github.com/nasa/api-docs/pull/243) en 2025, así que la dejamos fuera. Con llave registrada, api.nasa.gov permite unas 1,000 peticiones por hora; por eso el backend guarda los datos en MySQL y sincroniza una vez al día en lugar de consultar a la NASA en cada visita.

## Stack y arquitectura

Backend en Python con FastAPI, organizado como monolito modular, y frontend en React con TypeScript dividido por los mismos módulos. Dentro de cada módulo, el backend usa cuatro capas clásicas (controllers, services, repositories y models) más una carpeta de utils. Todo vive en un monorepo y se levanta en local con Docker Compose.

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Backend | Python 3.11, FastAPI, Pydantic v2 | Tipado, OpenAPI automático, muy usado en vacantes |
| Acceso a datos | SQLAlchemy 2.0 + Alembic | ORM estándar y migraciones versionadas |
| Base de datos | MySQL 8 + MySQL Workbench | Lo que piden; Workbench para diagramas EER y consultas |
| Tareas programadas | APScheduler dentro del backend (luego, un cron en AWS) | Sincronización diaria con la NASA |
| Frontend | React + TypeScript + Vite | Ecosistema más pedido en el mercado |
| Estado y datos en el front | TanStack Query + Zod | Caché de peticiones y validación de respuestas |
| Pruebas | pytest, Vitest, Playwright | Unitarias, de integración y end to end |
| Calidad | Ruff, mypy, ESLint, Prettier, pre-commit | Estilo y tipos revisados antes de cada commit |
| Entorno de Python | `venv` + `pip`, dependencias en `pyproject.toml` y la misma lista en `requirements.txt` y `requirements-dev.txt` | Lo estándar; enseña qué es un ambiente virtual antes de usar atajos |
| Configuración | `pydantic-settings` + archivos `.env` | Variables por ambiente, validadas al arrancar |
| Infraestructura local | Docker + Docker Compose | Mismo entorno para los dos |
| Móvil (fase 2) | React Native con Expo | Reutiliza las capas de dominio y casos de uso del front |

```mermaid
flowchart LR
    FE["Frontend<br/>React + TS, por módulos"] -- "HTTPS + JWT" --> BE
    subgraph BE["Backend · FastAPI · un solo proceso"]
        watchlist["watchlist<br/>listas y notas"] -- "fachada pública" --> neo["neo<br/>asteroides y sync"]
        identity["identity<br/>usuarios, JWT, roles"]
        impact["impact<br/>calculadora, sin BD"]
        media["media<br/>imagen del día"]
        alerts["alerts · fase 2<br/>reacciona a eventos"]
        neo -- publica --> BUS[["Bus de eventos en memoria<br/>CloseApproachDetected, AsteroidWatched"]]
        BUS -- escucha --> alerts
    end
    neo --> NASA["APIs NASA / JPL<br/>NeoWs, APOD, CAD"]
    BE -- "cada módulo, solo su esquema" --> DB
    subgraph DB["MySQL 8 · un esquema por módulo"]
        s1[(identity)]
        s2[(neo)]
        s3[(watchlist)]
        s4[(media)]
        s5[(alerts · fase 2)]
    end
```

Los módulos se hablan solo por fachadas públicas o eventos, y cada uno escribe únicamente en su esquema; eso es lo que permite extraer uno como microservicio sin reescribir los demás.

**Backend como monolito modular.** Un solo proceso y un solo despliegue, pero partido en módulos que se comportan como microservicios: cada uno es dueño de sus datos, expone una interfaz pública y nunca toca el interior de otro. Así se aprende a diseñar fronteras de servicio sin pagar todavía el costo operativo de redes, colas y muchos despliegues.

| Módulo | Responsabilidad | Datos propios (esquema MySQL) | Lo que ofrece a otros módulos |
| --- | --- | --- | --- |
| `identity` | Registro, login, JWT, roles | `identity`: users, refresh_tokens | `get_user(id)`, validación de token |
| `neo` | Asteroides y acercamientos; sincroniza con NeoWs y JPL CAD | `neo`: asteroids, close_approaches | `get_asteroid(id)`, evento `CloseApproachDetected` |
| `watchlist` | Listas de vigilancia y notas | `watchlist`: watchlist_items | Evento `AsteroidWatched` |
| `impact` | Calculadora de impacto, sin estado | Ninguno | `calculate(diameter, density, velocity)` |
| `media` | Imagen astronómica del día | `media`: apod_entries | Nada (solo su API HTTP) |
| `alerts` (fase 2) | Avisos de acercamiento | `alerts`: alerts | Consume `CloseApproachDetected` |
| `space_weather` (fase 2) | Eventos de DONKI | `space_weather`: events | Nada (solo su API HTTP) |

**Capas dentro de cada módulo.** Las dependencias van en un solo sentido: controllers → services → repositories → models. Una capa nunca llama a la de arriba.

| Capa | Qué contiene | Puede usar |
| --- | --- | --- |
| `controllers/` | Routers de FastAPI: reciben la petición, la validan con un schema, llaman a un service y devuelven la respuesta. Sin lógica de negocio. | services, models (schemas) |
| `services/` | La lógica de negocio en clases: `AsteroidService`, `ImpactCalculator`, `AuthService`. Reciben sus repositorios por el constructor (inyección de dependencias). | repositories, models, utils |
| `repositories/` | Acceso a datos: consultas SQLAlchemy al esquema del módulo y clientes de APIs externas (`NeoWsClient`). | models, utils |
| `models/` | Entidades SQLAlchemy (`entities.py`) y schemas Pydantic de entrada y salida (`schemas.py`). | Ninguna de las otras capas |
| `utils/` | Funciones auxiliares sin estado: conversiones de unidades (km a distancias lunares, julios a megatones) y, en `identity`, hashing y firma de JWT. No es una capa: todos pueden usarla y ella no usa a nadie. | Nada del módulo |

Para que el POO no se pierda, los services dependen de una clase base abstracta del repositorio (`AsteroidRepository`) y no de la implementación concreta; así se pueden probar con un repositorio falso en memoria.

Reglas de las fronteras:

- Cada módulo usa las capas de la tabla anterior, con la misma estructura de carpetas.
- Otros módulos solo pueden usar su fachada pública (`modules/neo/public.py`) o escuchar sus eventos en un bus en memoria. Importar `orbita.modules.neo.repositories` desde `watchlist` está prohibido.
- Un esquema MySQL por módulo, con un usuario de base de datos que solo tiene permisos sobre su esquema. Sin `JOIN` ni llaves foráneas entre esquemas: `watchlist` guarda `asteroid_id` y le pide los datos a `neo`.
- Un `shared_kernel/` mínimo con tipos comunes (ids, `DomainEvent`, reloj), sin lógica de negocio.
- Las fronteras se vigilan en CI con [import-linter](https://import-linter.readthedocs.io/): un contrato de independencia entre módulos y un contrato de capas dentro de cada uno. Si alguien se los salta, el build falla.
- Cada módulo tiene sus propias migraciones de Alembic y sus propias pruebas, así podría vivir solo el día que se extraiga.

**Frontend con Clean Architecture.**

- `domain/`: tipos y entidades (`Asteroid`, `User`) e interfaces de repositorio. TypeScript puro.
- `application/`: casos de uso (`login`, `getNeoFeed`, `calculateImpact`) que reciben repositorios por parámetro.
- `infrastructure/`: adaptadores HTTP que implementan esos repositorios contra la API, más almacenamiento del token.
- `presentation/`: componentes, páginas, hooks y rutas. Solo llama casos de uso, nunca `fetch` directo.

El front se organiza con los mismos módulos que el back: `features/auth`, `features/neo`, `features/watchlist`, `features/impact`, `features/media`, cada uno con sus cuatro capas, más un `shared/` para componentes de interfaz genéricos.

La recompensa de esta separación llega en la fase 2: la app de Expo copia `domain/` y `application/` tal cual y solo reescribe `presentation/`.

**Un buen primer ejercicio de POO:** `ImpactCalculator` recibe un `Asteroid` y una estrategia de densidad (`RockyDensity`, `MetallicDensity`), calcula la masa con m = ρ·(π/6)·D³ y la energía con E = ½·m·v², y la convierte a megatones. Es fácil de probar con pytest y enseña composición, polimorfismo e inyección de dependencias.

## Modelo de datos en MySQL

Cada módulo tiene su propio esquema dentro de la misma instancia de MySQL; dentro de un esquema hay llaves foráneas normales, entre esquemas solo ids. Ella diseña primero un diagrama EER por esquema en MySQL Workbench; después se traduce a modelos SQLAlchemy y migraciones Alembic, que son la fuente de verdad (Workbench queda para visualizar y consultar, no para cambiar el esquema a mano).

| Esquema · tabla | Campos clave | Relaciones |
| --- | --- | --- |
| `identity.users` | id, email (único), password_hash, role, created_at | 1:N con refresh_tokens |
| `identity.refresh_tokens` | id, user_id, token_hash, expires_at, revoked_at | N:1 con users |
| `neo.asteroids` | id, neo_reference_id (único), name, diameter_min_m, diameter_max_m, is_hazardous, absolute_magnitude | 1:N con close_approaches |
| `neo.close_approaches` | id, asteroid_id, approach_date, miss_distance_km, relative_velocity_kms, orbiting_body | N:1 con asteroids |
| `watchlist.watchlist_items` | user_id, asteroid_id, note, alert_threshold_ld, created_at | Guarda ids de identity y neo, sin llave foránea |
| `media.apod_entries` | date (PK), title, explanation, media_type, url | Ninguna |
| `alerts.alerts` (fase 2) | id, user_id, asteroid_id, approach_date, sent_at, read_at | Ids de otros módulos, sin llave foránea |
| `space_weather.events` (fase 2) | id, type (FLR/CME), start_time, class_type, source_url | Ninguna |
| `observations` (fase 2, dentro de `watchlist`) | id, user_id, asteroid_id (opcional), observed_at, location, notes, image_url | Ids de otros módulos |

Que no haya `JOIN` entre esquemas obliga a resolver cosas como "mis asteroides vigilados con su próximo acercamiento" en la capa de services: `watchlist` obtiene los ids y le pide a `neo` los datos por su fachada. Es justo el tipo de decisión que se toma en microservicios.

Para practicar SQL de verdad, cada sprint de backend incluye al menos una consulta escrita a mano y probada en Workbench antes de llevarla al ORM: por ejemplo, los 10 asteroides peligrosos más cercanos del mes con un `JOIN` y `ORDER BY`, o cuántos usuarios vigilan cada asteroide con `GROUP BY`. También conviene ver índices (`EXPLAIN`) sobre `approach_date` y `miss_distance_km`.

## Autenticación y seguridad

Login con email y contraseña, un access token JWT de vida corta (15 minutos) y un refresh token de 7 días que rota en cada uso. Es el esquema que van a encontrar en casi cualquier empresa.

**Flujo.**

1. `POST /auth/register`: valida email y fortaleza de contraseña, guarda el hash con Argon2 (nunca la contraseña).
2. `POST /auth/login`: verifica el hash y responde con el access token en el cuerpo y el refresh token en una cookie `HttpOnly`, `Secure`, `SameSite=Strict`.
3. El front manda `Authorization: Bearer <access>` en cada petición y guarda el access token solo en memoria, no en `localStorage`.
4. `POST /auth/refresh`: con la cookie, emite un par nuevo y revoca el refresh anterior (rotación). Si alguien reutiliza un refresh ya revocado, se revocan todos los de ese usuario.
5. `POST /auth/logout`: revoca el refresh token y borra la cookie.
6. Rutas protegidas con una dependencia `get_current_user`; rutas de admin con `require_role("admin")`.

**Detalles que vale la pena que aprenda.**

- Qué hay dentro de un JWT (header, payload, firma) y por qué el payload no es secreto: decodificar uno en jwt.io.
- Claims mínimos: `sub` (id de usuario), `role`, `exp`, `iat`, `jti`. Firma HS256 con un secreto de 32+ bytes fuera del repo.
- En la base solo se guarda el hash del refresh token, igual que con contraseñas.
- Límite de intentos en `/auth/login` (por ejemplo con `slowapi`) para frenar fuerza bruta.
- CORS restringido al dominio del front; secretos en variables de entorno (`.env` en local, nunca en git; Secrets Manager en AWS).
- Revisar juntos la [hoja de trucos de OWASP sobre JWT](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html) y el [OWASP Top 10](https://owasp.org/www-project-top-ten/) como checklist del sprint de seguridad.

## Entorno de desarrollo local

Lo primero que hace cualquier persona al entrar a un equipo es levantar el proyecto en su máquina siguiendo el README. Ella lo va a hacer igual: si algún paso del README no funciona, lo corrige en un PR, y esa es su primera contribución real.

**Herramientas.**

| Herramienta | Para qué | Notas |
| --- | --- | --- |
| Git | Control de versiones | En macOS viene con `xcode-select --install`. En Windows, todo el proyecto vive dentro de WSL2 con Ubuntu |
| VS Code | Editor | Extensiones: Python, Pylance, Ruff, ESLint, Prettier, Docker, GitLens |
| Python 3.11 | Backend | Con `pyenv`, compilado con `openssl@3` y `xz` de Homebrew (detalle en el README); la versión queda fijada en `backend/.python-version` |
| Node LTS | Frontend | Con `nvm`; la versión queda fijada en `frontend/.nvmrc` |
| Docker Desktop | MySQL y la app en contenedores | Hay que abrirlo antes de `docker compose up` |
| MySQL Workbench | Ver y consultar la base | Se conecta al MySQL del contenedor en `localhost:3306` |
| GitHub CLI (`gh`) | PRs e issues desde la terminal | Opcional, desde el sprint 2 |

**Git, una sola vez por máquina.**

```bash
git config --global user.name "Su Nombre"
git config --global user.email "su-correo@ejemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase true          # git pull rebasea en lugar de crear merges
git config --global push.autoSetupRemote true # el primer push de una rama crea su rama remota
git config --global core.editor "code --wait" # rebase -i y los mensajes de commit abren VS Code
ssh-keygen -t ed25519 -C "su-correo@ejemplo.com"   # luego se pega la llave pública en GitHub › Settings › SSH keys
```

**Ambiente virtual de Python.** Un ambiente virtual es una carpeta (`.venv/`) con su propio Python y sus propias librerías. Sirve para que cada proyecto tenga las versiones que necesita sin ensuciar el Python del sistema ni chocar con otros proyectos.

```bash
cd backend
python3.11 -m venv .venv          # crearlo, una sola vez
source .venv/bin/activate         # activarlo, en cada terminal nueva; el prompt muestra (.venv)
python -m pip install --upgrade pip
pip install -e ".[dev]"           # instala el proyecto y las herramientas de desarrollo de pyproject.toml
pre-commit install                # activa los revisores automáticos antes de cada commit
deactivate                        # salir del ambiente
```

- `.venv/` está en `.gitignore`: el ambiente no se sube; se sube `pyproject.toml`, que dice cómo recrearlo.
- `requirements.txt` (lo que la API necesita para correr) y `requirements-dev.txt` (eso más las herramientas) repiten la lista de `pyproject.toml` para `pip install -r` y para la imagen de Docker del sprint 3. `tests/test_requirements.py` falla si se desfasan.
- Toda librería nueva se agrega a `pyproject.toml` y al `requirements` que corresponda, en el mismo PR. Un `pip install algo` sin anotarlo funciona en tu máquina y rompe en la de la otra persona y en el CI.
- Si el prompt no muestra `(.venv)`, el ambiente no está activo y `pip` instala en el lugar equivocado. Nunca `sudo pip install`.
- En VS Code: `Python: Select Interpreter` → `backend/.venv`, para que el editor y el depurador usen el mismo Python.
- El equivalente en el front es `node_modules/`: se instala con `nvm use` y `npm ci` (que respeta el `package-lock.json` exacto), no con `npm install`, salvo cuando se agrega una dependencia.
- npm 11 no corre los scripts de instalación de las dependencias hasta que alguien los aprueba. La decisión queda en `allowScripts` de `frontend/package.json` y entra por PR como cualquier cambio. Hoy solo está `fsevents`, denegado porque ya trae su binario compilado.
- Ejercicio: borrar `.venv/` y `node_modules/` y recrearlos solo con el README. Si no se puede, el README está incompleto.

**Variables de entorno y archivos `.env`.** Todo lo que cambia entre ambientes (direcciones de la base, contraseñas, llaves de API) vive fuera del código, en variables de entorno ([factor III de las doce](https://12factor.net/es/config)). El código es el mismo en local, dev, qa y prod; solo cambian las variables.

| Archivo | ¿Va en git? | Para qué |
| --- | --- | --- |
| `backend/.env.example` | Sí | Plantilla con todas las variables del backend y valores de ejemplo |
| `backend/.env` | No | Los valores reales de tu máquina |
| `frontend/.env.example` | Sí | Plantilla del front |
| `frontend/.env.local` | No | Valores del front en tu máquina |
| `infra/.env.example` | Sí | Contraseñas de MySQL que usa `docker-compose` |
| `infra/.env` | No | Las reales de tu máquina |

Variables del backend (`backend/.env.example`):

| Variable | Valor de ejemplo | Nota |
| --- | --- | --- |
| `APP_ENV` | `local` | `local`, `dev`, `qa` o `prod` |
| `DATABASE_URL_IDENTITY` | `mysql+pymysql://identity_app:cambiar@localhost:3306/identity` | Una por módulo, cada una con su usuario de MySQL |
| `DATABASE_URL_NEO`, `DATABASE_URL_WATCHLIST`, `DATABASE_URL_MEDIA` | igual que la anterior | |
| `JWT_SECRET` | `generar-con-el-comando-de-abajo` | 32+ bytes, distinto en cada ambiente |
| `JWT_ACCESS_TTL_MINUTES` / `JWT_REFRESH_TTL_DAYS` | `15` / `7` | |
| `NASA_API_KEY` | `DEMO_KEY` | `DEMO_KEY` sirve para empezar pero tiene un límite muy bajo; cada quien registra la suya |
| `CORS_ORIGINS` | `http://localhost:5173` | Dominio del front permitido |
| `LOG_LEVEL` | `DEBUG` | `INFO` en qa y prod |

En el front basta `VITE_API_URL=http://localhost:8000`.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp infra/.env.example infra/.env
python -c "import secrets; print(secrets.token_urlsafe(48))"   # el resultado va en JWT_SECRET
```

Reglas:

- El backend lee las variables con una clase `Settings` de `pydantic-settings`. Si falta una obligatoria, la app no arranca y dice cuál falta: es mejor fallar al inicio que a media petición.
- Toda variable nueva se agrega en el mismo PR a `.env.example`, a `Settings` y a los secretos de los ambientes dev y qa en GitHub.
- En el front, todo lo que empieza con `VITE_` termina dentro del JavaScript que descarga el navegador, así que cualquiera lo puede leer. Ahí nunca va un secreto.
- En los servidores nadie copia `.env` a mano: los valores viven en los GitHub Environments (`dev`, `qa`) y después en Secrets Manager (prod), y el workflow de despliegue los inyecta.
- Simulacro: si un secreto llega a git, borrarlo del archivo no basta porque sigue en el historial. Primero se rota (se genera uno nuevo y se invalida el viejo), y después se limpia. Para prevenirlo, `gitleaks` en pre-commit y, si el repo es público, la protección de push de secret scanning de GitHub.

## Organización en GitHub

Un solo repositorio (`orbita`) con tres ramas largas, `dev`, `qa` y `main`, una por ambiente. Todo cambio entra por Pull Request, y solo se fusiona con la aprobación de JL, el dueño del repo ([ADR 0002](docs/adr/0002-solo-jl-aprueba.md)).

**Estructura del monorepo.**

```
orbita/
├── backend/
│   ├── src/orbita/
│   │   ├── main.py              # arma la app y registra los routers de cada módulo
│   │   ├── shared_kernel/       # ids, DomainEvent, bus de eventos, reloj
│   │   └── modules/
│   │       ├── identity/
│   │       │   ├── controllers/  # routers FastAPI
│   │       │   ├── services/     # lógica de negocio
│   │       │   ├── repositories/ # SQLAlchemy y clientes externos
│   │       │   ├── models/       # entities.py (SQLAlchemy), schemas.py (Pydantic)
│   │       │   ├── utils/        # helpers sin estado (aquí: hashing, JWT)
│   │       │   ├── migrations/   # Alembic, solo el esquema identity
│   │       │   └── public.py     # única puerta para otros módulos
│   │       ├── neo/              # misma forma
│   │       ├── watchlist/
│   │       ├── impact/           # sin repositories ni migrations: no guarda datos
│   │       └── media/
│   ├── tests/<módulo>/           # pruebas por módulo
│   ├── scripts/seed.py           # carga asteroides de ejemplo sin llamar a la NASA
│   ├── pyproject.toml            # dependencias y configuración de Ruff, mypy y pytest
│   ├── requirements.txt          # las mismas dependencias, para pip install -r y Docker
│   ├── requirements-dev.txt      # requirements.txt más las herramientas de desarrollo
│   ├── .dockerignore             # lo que no entra a la imagen (.venv, .env, cachés)
│   ├── .python-version
│   ├── .env.example              # plantilla de variables (el .env real no se sube)
│   └── .importlinter             # contratos de módulos y de capas
├── frontend/
│   ├── src/app/                  # App, providers y container (raíz de composición)
│   ├── src/features/             # system (ejemplo), auth, neo, watchlist, impact, media
│   ├── src/shared/               # config (variables validadas), http (cliente), ui
│   ├── eslint.config.js          # incluye las reglas de capas de Clean Architecture
│   ├── .nvmrc
│   ├── .dockerignore             # lo que no entra a la imagen (node_modules, dist, .env)
│   └── .env.example
├── mobile/                       # Expo, fase 2
├── infra/                        # docker-compose.yml y .env.example; luego Terraform
│   └── github/                   # scripts de configuración y backlog de issues por sprint
├── docs/                         # ADRs, diagramas EER por esquema, checklist de QA
├── .vscode/                      # launch.json para depurar backend y front, extensiones recomendadas
├── .github/                      # workflows/ci.yml, plantillas, CODEOWNERS (JL), Dependabot
├── .pre-commit-config.yaml
├── .editorconfig
└── .gitattributes                # saltos de línea LF para todos, aunque alguien use Windows
```

**Ramas y ambientes.** Cada rama larga corresponde a un ambiente, y el código avanza siempre en el mismo sentido: rama de trabajo → `dev` → `qa` → `main`.

| Rama | Ambiente | Se despliega | Entra por | Tipo de merge | Protección |
| --- | --- | --- | --- | --- | --- |
| `feat/*`, `fix/*`, `chore/*` | Tu máquina | — | Se crea desde `dev` | — | Ninguna: es tuya, puedes rebasear y hacer `push --force-with-lease` |
| `dev` (rama por defecto) | dev | Automático en cada merge (desde el sprint 3) | PR de una rama de trabajo | Squash | Aprobación de JL, `ci-ok` en verde, rama actualizada con `dev` |
| `qa` | qa | Automático en cada merge (desde el sprint 3) | PR de promoción `dev → qa` | Merge commit | Aprobación de JL y `ci-ok` en verde |
| `main` | Producción (local hasta el sprint 9) | Al publicar un release | PR de promoción `qa → main` | Merge commit + tag | Aprobación de JL, `ci-ok` en verde y checklist de QA firmado |
| `hotfix/*` | — | — | Se crea desde `main`; PR a `main` | Squash | Después, back-merge `main → qa → dev` |

```mermaid
gitGraph
    commit id: "v0.3.0"
    branch qa
    branch dev
    branch feat/12-login
    commit id: "login"
    commit id: "pruebas"
    checkout dev
    merge feat/12-login
    checkout qa
    merge dev tag: "freeze"
    checkout main
    merge qa tag: "v0.4.0"
    branch hotfix/40-cors
    commit id: "fix cors"
    checkout main
    merge hotfix/40-cors tag: "v0.4.1"
    checkout qa
    merge main
    checkout dev
    merge qa
```

Squash solo de una rama de trabajo hacia `dev`. Entre ramas largas (`dev → qa → main`) siempre merge commit: con squash, git pierde la pista de qué commits ya pasaron y en cada promoción reaparecen conflictos fantasma.

**Ciclo de un sprint.**

1. Días 1 a 8: las funcionalidades entran a `dev`, que se despliega solo, y se prueban integradas.
2. Día 9, code freeze: PR de promoción `dev → qa`. Desde aquí, a `qa` solo entran correcciones.
3. Días 9 y 10: QA manual en el ambiente qa con el checklist de `docs/qa/`. Cada bug es un issue con la etiqueta `qa`; se corrige en una rama `fix/*` y vuelve a pasar por `dev → qa` (o, si es urgente, sale de `qa` y luego se hace back-merge a `dev`).
4. Día 10: PR de promoción `qa → main`, tag, release con notas, demo y retro.

**Reglas de git.**

- Nunca se rebasea ni se hace force push sobre una rama compartida (`dev`, `qa`, `main`). En tu propia rama, sí.
- Antes de abrir un PR y antes de fusionarlo: `git fetch` y `git rebase origin/dev`. Los conflictos se resuelven en tu rama y en tu máquina, no en el botón de GitHub.
- Siempre `git push --force-with-lease` y nunca `--force` a secas: si alguien más subió algo a tu rama, se niega a borrarlo.
- Antes de un rebase difícil, `git branch respaldo/<rama>`: es gratis y quita el miedo.

**Reglas del repo.**

- Ninguna rama larga acepta push directo, ni siquiera de JL.
- Ramas con prefijo y número de issue: `feat/12-login-endpoint`, `fix/31-cors`, `chore/5-ruff-config`, `hotfix/40-cors`.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/): `feat(auth): add refresh token rotation`.
- Versiones semánticas con tags (`v0.3.0`) solo sobre `main`, y un GitHub Release con notas al cierre de cada sprint. Un hotfix sube el último número (`v0.4.1`).
- `.editorconfig` y `.gitattributes` desde el primer commit, para que los saltos de línea y las sangrías no generen diferencias falsas.

**Gestión del trabajo.**

- Un GitHub Project (tablero) con columnas Backlog, Sprint, En progreso, En revisión, Hecho.
- Cada sprint es un Milestone con fecha de entrega.
- Todo el trabajo entra por issues, también el de ella desde el primer día: nadie programa algo que no esté en el tablero. Su primer día no es "lee la guía", sino tres issues asignados ("Preparar mi entorno", "Levantar Órbita y corregir el README" y la kata de POO), y la guía queda como documentación de referencia.
- Los issues de cada sprint se escriben en `infra/github/backlog/sprint-N/`, uno por archivo, y se crean en GitHub con `infra/github/crear-issues.sh`. JL los escribe en los sprints 1 a 3; desde el sprint 4, cuando ella facilita la planeación, los escriben juntos.
- Plantillas de issue para historia de usuario (con criterios de aceptación) y bug; plantilla de PR con checklist.
- Etiquetas: `backend`, `frontend`, `infra`, `docs`, `good-first-issue`, `bug`, `qa`, `hotfix`.
- Decisiones importantes documentadas como ADR cortos en `docs/adr/` (por ejemplo, "por qué FastAPI y no Django").

**Ceremonias ligeras.** Planeación de 30 minutos al inicio del sprint, un check-in breve a mitad y una demo con retro al final. Las retros son donde más se aprende: qué salió mal en un PR, qué costó entender.

## Roles y reparto de trabajo

JL hace de tech lead y dueño de la plataforma (CI/CD, Docker, AWS); ella es desarrolladora full stack y es dueña de una funcionalidad completa por sprint, de la tabla en MySQL hasta la pantalla. JL es el único que aprueba PR. Ella revisa los de JL y los comenta, pero su aprobación no habilita el merge.

| Responsabilidad | JL | Ella |
| --- | --- | --- |
| Arquitectura y ADRs | Propone y documenta | Cuestiona y propone cambios |
| Infraestructura, CI/CD, AWS | Construye el primer ciclo | Lo replica en el siguiente (por ejemplo, ella agrega el job del front al CI copiando el del back) |
| Funcionalidades | Una pieza de soporte por sprint | La pieza principal del sprint, de punta a punta |
| Revisión de código | Revisa y aprueba todos los PR; en los de ella, con comentarios explicativos | Revisa todos los de JL y deja al menos un comentario por PR, aunque sea una pregunta; no aprueba |
| Tablero y planeación | Facilita los primeros sprints | Facilita desde el sprint 4 |
| Promociones y releases | Hace las de los sprints 1 a 4 explicando cada paso | Hace las promociones `dev → qa → main` y las notas de release desde el sprint 5 |
| QA manual | Escribe el primer checklist | Prueba en qa los cambios de JL, y JL los de ella: nadie prueba su propio trabajo |

La idea es que el andamiaje difícil lo ponga JL una vez, y que ella lo repita después con menos ayuda. Hacia el sprint 6 los papeles se invierten en algunas tareas: ella hace la pieza de seguridad o infraestructura y JL la revisa como lo haría un senior exigente.

Los módulos se reparten como si fueran equipos distintos:

| Módulo | Dueño | Por qué |
| --- | --- | --- |
| `shared_kernel`, bus de eventos | JL | Es la base de todos; conviene que lo diseñe quien ya lo ha hecho |
| `neo`, `impact`, `media` | Ella | Datos reales, física y una integración externa: el núcleo de la app |
| `identity` | JL los JWT, ella los casos de uso | Seguridad delicada, pero ella debe entenderla de punta a punta |
| `watchlist` | Ella | Su primer módulo que consume a otro por fachada y eventos |
| `alerts` (fase 2) | Ella | Candidato a extraerse como microservicio en AWS |

Cuando un módulo necesita algo de otro, se abre un issue al dueño pidiendo el cambio en su fachada, igual que entre equipos reales. El dueño revisa el PR de ese cambio, pero la aprobación siempre es de JL; por eso `CODEOWNERS` no sigue esta tabla y solo lista a JL.

Una regla útil para aprender: cuando ella se atore más de 45 minutos, abre un comentario en el PR o issue explicando qué intentó. Así practica pedir ayuda por escrito, que es como se trabaja en equipos remotos.

## Plan por sprints

Un sprint 0 de fundamentos y ocho sprints de dos semanas llevan a la v1.0, con los ambientes dev y qa desplegados desde el sprint 3; producción llega en la fase de AWS (más abajo). Desde el sprint 1, cada sprint sigue el ciclo `dev → qa → main` y termina con demo, retro y release etiquetado.

| Sprint | Objetivo | JL | Ella | Entregable |
| --- | --- | --- | --- | --- |
| 0 · Fundamentos (3 semanas) | Que pueda leer y escribir código sencillo | Prepara ejercicios cortos y los revisa con ella | Terminal (carpetas, rutas, variables de entorno); Git local (`init`, `add`, `commit`, `log`, `branch`, `merge`) con Learn Git Branching; Python básico (tipos, funciones, listas, diccionarios, clases, excepciones); qué son HTTP y JSON, probando la API de la NASA con el navegador y con `curl`; SQL básico (`SELECT`, `WHERE`, `JOIN`) en un MySQL de prueba | Repo personal `orbita-katas` con sus ejercicios y su primer conflicto de merge resuelto sola |
| 1 · Arranque | Entorno y forma de trabajo | Crea el repo con `dev`, `qa` y `main` y sus protecciones, tablero y plantillas; `docker-compose` con MySQL 8 y un esquema por módulo; `.env.example`, `.editorconfig`, `.gitattributes`, pre-commit y `launch.json`; esqueleto del front (Vite + React + TS, ESLint con reglas de capas, Prettier, Vitest) con la feature de ejemplo `system`; carpetas de los módulos del backend (`identity`, `neo`, `watchlist`, `media`, `impact`) con sus capas y su `public.py`, todavía vacías; CI del backend (`ci.yml`) con el check `ci-ok` obligatorio en las tres ramas; issues del sprint en el tablero | Sus tres issues: preparar su entorno (Git, llave SSH, Python, Node, Docker, Workbench); levantar Órbita siguiendo solo el README y corregir lo que falle en su primer PR, con el CI en verde; kata de POO (`Vector3`, `Orbit`) con pytest y depurador en `orbita-katas`. Además, su primera revisión de código: comentar un PR abierto de JL o de Dependabot | README probado por ella desde cero · primera promoción `dev → qa → main` · v0.1.0 |
| 2 · Esqueleto modular y dominio | Fronteras y lógica de negocio | Base del monolito modular sobre las carpetas del sprint 1: `shared_kernel`, bus de eventos en memoria, registro de los routers de cada módulo en `main.py`, contratos de import-linter (y su paso en el CI), Alembic por módulo | Job del frontend en `ci.yml` (ESLint, tipos, Vitest y build), copiando la forma del job del backend; EER de los esquemas `neo` y `media`; models y services de `neo` (`Asteroid`, `CloseApproach`) y módulo `impact` (`ImpactCalculator`) con pruebas | ADR de los módulos · services con 90%+ de cobertura · v0.2.0 |
| 3 · Integración NASA y ambientes | Traer y guardar datos reales; dev y qa en línea | MySQL como servicio en el CI, ahora que las pruebas usan la base; servidor de dev y qa (una EC2 pequeña con dos stacks de Docker Compose, cada uno con su base y sus secretos) y `deploy.yml` hacia cada uno | Módulo `neo`: cliente NeoWs, repositorios, sincronización diaria, `GET /asteroids`, `scripts/seed.py`; módulo `media`: APOD y `GET /apod`; `GET /health` que también verifica la conexión a MySQL | Datos reales en MySQL · Swagger navegable en dev y qa · v0.3.0 |
| 4 · Módulo identity | Usuarios y JWT | Emisión y validación de JWT; fachada `identity.public` con `get_current_user` para los demás módulos; primer hotfix simulado | Casos de uso de registro, login, refresh con rotación, logout, `GET /me`; pruebas de cada caso de error; primer QA manual en qa | Flujo completo de auth probado con pytest · v0.4.0 y v0.4.1 |
| 5 · Frontend base | Autenticación en el front | Router con rutas protegidas, interceptor de refresh en el cliente HTTP | `features/auth` con sus cuatro capas; pantallas de login y registro; rutas protegidas | Login funcionando contra la API · v0.5.0 |
| 6 · Funcionalidades núcleo | Lo que hace útil a la app | Historial de JPL CAD en `neo`; rol admin | Módulo `watchlist` (usa la fachada de `neo` y publica `AsteroidWatched`); `features/neo`, `features/watchlist` y `features/impact` en el front | Demo de MVP navegable · v0.6.0 |
| 7 · Calidad y seguridad | Endurecer | Revisión OWASP, límite de intentos, cabeceras de seguridad | Pruebas e2e con Playwright de los 3 flujos clave; pruebas de contrato de las fachadas públicas; manejo de errores en el front | Reporte de checklist OWASP · v0.7.0 |
| 8 · Release 1.0 | Pulir y documentar | Imagen Docker de producción del backend, workflow de release | `features/media`, documentación de la API por módulo, README final con capturas | **v1.0.0** en `main`, verificada en qa · video de demo |

Si un sprint se atrasa, se recorta alcance (se mueve un issue al siguiente milestone), no se alarga el sprint. Eso también es parte de aprender a trabajar en un proyecto real.

## Práctica de Git: conflictos, rebase y emergencias

Los conflictos no se esperan, se provocan: JL reparte las tareas para que los dos toquen lo mismo. Los primeros se anuncian ("hoy va a pasar algo"); después llegan sin aviso, como en un equipo real.

| Sprint | Situación | Cómo se provoca | Qué aprende |
| --- | --- | --- | --- |
| 0 | Primer conflicto | En su repo de katas, dos ramas cambian la misma línea | Leer los marcadores `<<<<<<<`, `=======` y `>>>>>>>`, decidir y hacer commit |
| 1 | Rama desactualizada | JL fusiona algo en `dev` mientras ella trabaja | `git fetch`, `git rebase origin/dev`, `git push --force-with-lease` |
| 1 | Cambios a medias | Le piden revisar un PR urgente mientras trabaja | `git stash` y `git stash pop` |
| 2 | Conflicto en el mismo archivo | Los dos registran un router en `main.py` el mismo día | Resolver durante un rebase: `git rebase --continue` y `--abort` |
| 2 | Historia sucia | Su rama tiene commits "wip", "ya", "ahora sí" | `git rebase -i` para unir y renombrar commits antes del PR |
| 3 | Dos migraciones en paralelo | Los dos crean una migración de Alembic en el mismo módulo desde el mismo punto | Git no ve conflicto, Alembic sí: `alembic heads` y `alembic merge` |
| 4 | Hotfix en producción | JL "descubre" un bug en `main` | Rama `hotfix/*` desde `main`, tag de parche, back-merge a `qa` y `dev` |
| 5 | Conflicto en `package-lock.json` | Los dos agregan una dependencia npm | No se resuelve a mano: se toma una versión y se corre `npm install` |
| 5 | Commit en la rama equivocada | Hace commit en `dev` local sin darse cuenta | `git switch -c`, `git reset` y `git cherry-pick` |
| 6 | Conflicto semántico | Uno renombra una función de `neo/public.py` y el otro la usa en un PR paralelo | Git fusiona sin quejarse y se rompen las pruebas: por qué el CI también corre después del merge |
| 6 | Bug que llegó a qa | Aparece en el QA manual | Corregir desde `qa` con back-merge a `dev`, o volver a promover |
| 7 | ¿Qué commit lo rompió? | JL mete un bug sutil varios commits atrás en una rama de práctica | `git bisect` con una prueba automatizada |
| 7 | Deshacer un PR ya fusionado | Una funcionalidad sale mal en dev | `git revert`, nunca `reset` en una rama compartida |
| 8 | "Perdí mi trabajo" | `git reset --hard` o borrar una rama en una copia de práctica | `git reflog` para recuperarlo |

## CI/CD con GitHub Actions

El CI existe desde el sprint 1, antes del primer PR de ella: en un equipo real nadie fusiona sin que algo automático haya revisado el cambio. Un workflow de integración continua bloquea el merge si falla; uno despliega a dev y qa desde el sprint 3; uno crea el release con cada tag, y el despliegue a producción en AWS se agrega en la fase final. Cada ambiente es un GitHub Environment con sus propios secretos.

| Workflow | Se dispara con | Pasos |
| --- | --- | --- |
| `ci.yml` (sprint 1) | PR hacia `dev`, `qa` o `main`, y cada push a `dev` | Job `changes`: detecta si cambió `backend/` o `frontend/` → job `backend`, solo si cambió: Ruff, formato, mypy y pytest (import-linter desde el sprint 2, MySQL como servicio desde el 3) → job `frontend`, solo si cambió (lo agrega ella en el sprint 2): ESLint, `tsc`, Vitest y `vite build` → job `ci-ok`: siempre corre, resume a los demás y es el único check obligatorio en las ramas protegidas |
| `deploy.yml` (sprint 3) | Push a `dev` o a `qa` | Construir la imagen → entrar al servidor por SSH → escribir el `.env` desde los secretos del ambiente → `docker compose up` del stack correspondiente → migraciones → prueba de humo contra `/health` |
| `release.yml` | Tag `v*` sobre `main` | Construir imagen Docker del backend → publicarla en GitHub Container Registry → crear el GitHub Release con notas generadas |
| `deploy-prod.yml` (fase AWS) | Release publicado, con aprobación manual | Autenticarse en AWS con OIDC (sin llaves guardadas) → subir imagen a ECR → actualizar el servicio → migraciones → prueba de humo |

Cosas para enseñarle aquí: por qué existe `ci-ok` (si un check obligatorio se salta porque no hubo cambios en su carpeta, GitHub deja el PR esperando para siempre; un job final que siempre corre lo evita); leer el log de un job que falló y reproducir el error en local con el mismo comando; `pre-commit` para que Ruff y Prettier corran antes del push y el CI rara vez falle por estilo; y Dependabot apuntando a `dev`, que genera PR reales para revisar. Está configurado para no hacer ruido: en el backend solo propone versiones fuera del rango de `pyproject.toml`, y en el front ignora TypeScript ≥ 6.1 (hasta que `typescript-eslint` lo soporte) y los saltos mayores de `@types/node`, que siguen a Node 24.

## Despliegue en AWS

El servidor de dev y qa nace en el sprint 3 (ver sprints), así que las reglas de la cuenta del final de esta sección aplican desde ahí. Producción se hace en cinco etapas, de lo más manual a lo más automatizado, para que entienda qué resuelve cada servicio antes de usarlo. Cada etapa cabe en un sprint de dos semanas.

1. **Producción a mano (sprint 9).** Una instancia EC2 propia para producción, con Docker Compose, Nginx como proxy inverso y HTTPS con Let's Encrypt. Aprende SSH, grupos de seguridad, variables de entorno en servidor y logs. Primero lo hace JL guiándola; luego ella lo reconstruye sola desde cero.
2. **Servicios administrados (sprint 10).** MySQL pasa a RDS (con respaldos automáticos) y la imagen del backend a ECR; el backend corre en ECS Fargate detrás de un Application Load Balancer. Secretos en Secrets Manager. Ella se conecta a RDS con Workbench a través de un túnel SSH.
3. **Frontend y pipeline (sprint 11).** El front compilado en S3 + CloudFront; `deploy-prod.yml` despliega solo al publicar un release, autenticado por OIDC.
4. **Ambientes con Terraform (sprint 12).** dev, qa y prod quedan descritos en Terraform dentro de `infra/`, con la misma arquitectura en tamaños distintos; dev y qa dejan el servidor compartido. `dev` y `qa` se siguen desplegando en cada merge, y producción solo con release aprobado.
5. **Extraer el primer microservicio (sprint 13).** El módulo `alerts` sale del monolito y corre como servicio aparte en ECS, con su propia base de datos. El bus en memoria se reemplaza para ese evento por Amazon SNS + SQS: `neo` publica `CloseApproachDetected` en un tema de SNS y `alerts` lo consume de su cola. Como `alerts` nunca importó a nadie ni leyó otro esquema, el cambio toca solo su infraestructura y la del bus. Aquí aprende lo que el monolito modular le ahorró hasta ahora: reintentos, mensajes duplicados (consumidores idempotentes), colas de mensajes fallidos y trazas entre servicios.

Antes de crear cualquier recurso: activar MFA en la cuenta raíz, crear usuarios IAM para cada uno y configurar una alerta de AWS Budgets. Revisen los precios vigentes de RDS, Fargate y el balanceador, que son lo que más cobra; apagar dev y qa cuando no se usen ahorra bastante.

## Buenas prácticas y Definition of Done

Un issue solo pasa a Hecho cuando cumple esta lista; vale la pena copiarla en la plantilla de PR.

- Cumple los criterios de aceptación del issue.
- Tiene pruebas nuevas o actualizadas, y el CI está en verde.
- La rama está rebasada sobre `dev` actualizado y sin conflictos.
- Funcionó en dev antes de promoverse a qa, y pasó el checklist de QA antes de llegar a `main`.
- Si agrega una variable de entorno, está en `.env.example`, en `Settings` y en los secretos de dev y qa.
- Si agrega una dependencia, está en `pyproject.toml` o `package.json`, no solo instalada en una máquina.
- Sin errores de Ruff, mypy, ESLint ni `tsc`.
- Respeta las fronteras: no importa el interior de otro módulo ni lee tablas de otro esquema; si necesita algo, usa la fachada pública o un evento.
- Si cambia la fachada pública o un evento de un módulo, también lo revisa el dueño de ese módulo.
- El PR describe qué cambia, por qué y cómo probarlo, con captura si toca la interfaz.
- Aprobado por JL; todos los comentarios respondidos.
- Si cambia el esquema, incluye migración de Alembic del módulo, probada hacia arriba y hacia abajo.
- Sin secretos, credenciales ni datos personales en el código o los logs.
- Documentación actualizada si cambia la API o el arranque del proyecto.

**Hábitos de código para trabajar desde el día uno.** Nombres que expliquen la intención; funciones cortas con una sola responsabilidad; tipos en todo el código Python y TypeScript; inyección de dependencias en lugar de instanciar adentro; errores de negocio propios (`AsteroidNotFound`) lanzados en los services y traducidos a HTTP solo en los controllers; y PR pequeños, de menos de 400 líneas cambiadas, que se revisan en 15 minutos.

## Cómo llevar la mentoría

- **Ella maneja el teclado.** En las sesiones en pareja, ella escribe y JL guía con preguntas. Si JL toma el teclado, ella mira, pero no aprende.
- **Primero el depurador, luego la pregunta.** Desde el sprint 1 usa breakpoints en VS Code (backend y front) y lee los tracebacks de abajo hacia arriba. La regla de los 45 minutos aplica después de intentarlo así.
- **Datos sin depender de la NASA.** `scripts/seed.py` carga asteroides de ejemplo desde un JSON, y las pruebas simulan la API con `respx`. Así se puede trabajar sin red, sin llave y sin gastar el límite de peticiones.
- **Comentarios de revisión con etiqueta.** `nit:` (detalle opcional), `pregunta:` (quiero entender) y `bloqueante:` (hay que cambiarlo), siempre con el porqué y, si se puede, un enlace a la documentación. Así sabe qué es importante y qué no.
- **IA con reglas.** Sin asistentes de código durante el sprint 0 y los sprints 1 y 2, para que construya bases. Después se permiten, con una condición: ella explica en el PR cada línea que se generó, y si no puede, no entra.
- **Bitácora semanal.** En su repo de katas, una nota por semana: qué aprendió, qué le costó y qué preguntas le quedaron. Sirve para las retros y, al final, para ver cuánto avanzó.
- **Separar papeles.** Sesiones con horario fijo, y la crítica en un PR es sobre el código, nunca sobre la persona. En las retros se evalúa también la mentoría: qué explicó mal JL o qué le gustaría hacer distinto a ella.
- **Pensar en su portafolio.** El repo, el README con capturas, el video de demo y los ADR son evidencia concreta para entrevistas. Desde el sprint 8 vale la pena preparar cómo lo va a contar.

## Recursos

Documentación oficial para tener a mano, en el orden en que la van a necesitar.

| Tema | Recurso | Sprint |
| --- | --- | --- |
| Git, práctica visual | [Learn Git Branching](https://learngitbranching.js.org/?locale=es_ES) (ramas, rebase, cherry-pick en el navegador) | 0–2 |
| Git a fondo | [Pro Git en español](https://git-scm.com/book/es/v2), capítulos 2, 3 y 7 | 0–8 |
| GitHub | [GitHub Docs: flujo de GitHub](https://docs.github.com/es/get-started/using-github/github-flow) (la base del flujo con ramas y PRs) | 1 |
| Python desde cero | [Tutorial oficial de Python](https://docs.python.org/es/3/tutorial/) | 0 |
| Ambientes virtuales | [Documentación de `venv`](https://docs.python.org/es/3/library/venv.html) | 1 |
| Configuración | [Doce factores: configuración](https://12factor.net/es/config) y [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) | 1 |
| Python y POO | [Tutorial oficial de Python, clases](https://docs.python.org/es/3/tutorial/classes.html) | 1–2 |
| MySQL | [Manual de MySQL Workbench](https://dev.mysql.com/doc/workbench/en/) | 2 |
| SQLAlchemy | [Tutorial unificado de SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/tutorial/) | 2–3 |
| FastAPI | [Tutorial de FastAPI](https://fastapi.tiangolo.com/es/tutorial/) (incluye seguridad con OAuth2 y JWT) | 3–4 |
| APIs de la NASA | [api.nasa.gov](https://api.nasa.gov/) (llave gratuita) y [JPL Close Approach Data](https://ssd-api.jpl.nasa.gov/doc/cad.html) | 3 |
| Seguridad | [OWASP Top 10](https://owasp.org/www-project-top-ten/) | 4, 7 |
| React | [react.dev, Aprende](https://es.react.dev/learn) | 5 |
| CI/CD | [GitHub Actions](https://docs.github.com/es/actions) | 3, 5, 8 |
| AWS | [Documentación de Amazon ECS](https://docs.aws.amazon.com/ecs/) | 9–13 |
