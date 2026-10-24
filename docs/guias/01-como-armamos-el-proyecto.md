# Guía 01 · Cómo armamos el proyecto

Esta guía cuenta, paso a paso, cómo se armó la base de Órbita en el sprint 1: qué se hizo, por qué y con qué comandos. Sirve para dos cosas:

1. **Entender** qué hay en el repo y para qué sirve cada archivo.
2. **Replicarlo** desde cero en un repo de práctica (el reto está al final). Escribe los archivos a mano en lugar de copiarlos: así se aprende mucho más.

No hace falta entender todo a la primera. Lee un paso, hazlo, comprueba que funcionó y sigue con el siguiente. Si algo no queda claro, anótalo en tu bitácora y llévalo a la siguiente sesión.

> Las herramientas (Git, pyenv, nvm, Docker, VS Code, Workbench) se instalan como dice la sección 1 del [README](../../README.md). Esta guía asume que ya las tienes.

## El mapa

Antes de entrar en detalle, esto es lo que vamos a construir y cómo se conecta:

```
  Navegador
     │  http://localhost:5173
     ▼
  Frontend (React + Vite)  ── corre con: npm run dev
     │  pide datos a http://localhost:8000
     ▼
  Backend (FastAPI)        ── corre con: uvicorn, dentro del ambiente virtual
     │  se conecta a 127.0.0.1:3306
     ▼
  MySQL (contenedor de Docker) ── corre con: docker compose
```

Tres programas distintos, cada uno en su puerto. El navegador solo habla con el frontend; el frontend le pide datos al backend; el backend es el único que toca la base de datos.

---

## Paso 1 · La carpeta y el repositorio de git

**Conceptos.**

- **Repositorio:** una carpeta cuyo historial de cambios guarda git.
- **Commit:** una foto del proyecto en un momento dado, con un mensaje que explica qué cambió.
- **Rama:** una línea de commits. Permite trabajar en algo sin afectar lo que hacen los demás.

**Comandos.**

```bash
mkdir orbita && cd orbita
git init -b main      # crea el repositorio con la rama principal llamada main
git status            # qué ve git ahora mismo
```

**Comprobación:** `git status` dice `On branch main` y `No commits yet`.

---

## Paso 2 · Los archivos de la raíz

Antes de escribir código se crean tres archivos que ponen reglas para todo el repo.

**`.gitignore`: lo que git nunca debe subir.**

```gitignore
.env
.env.*
!.env.example
.venv/
node_modules/
```

- `.env` y `.env.*` tienen contraseñas: nunca se suben.
- `!.env.example` es la excepción (el `!` significa "esto sí"). Es la plantilla sin secretos, y sí se sube para que los demás sepan qué variables existen.
- `.venv/` y `node_modules/` son librerías instaladas: pesan mucho y cada quien las recrea en su máquina.

**`.editorconfig`: el mismo formato en todos los editores.** Dice cosas como "sangría de 4 espacios en Python y 2 en lo demás" y "los archivos terminan con un salto de línea". VS Code lo respeta con la extensión EditorConfig.

**`.gitattributes`: saltos de línea iguales para todos.** Windows y macOS marcan el fin de línea de forma distinta. Sin este archivo, git cree que cambiaron todas las líneas de un archivo aunque nadie las tocó. `* text=auto eol=lf` dice: guarda todo con el formato de Linux y macOS.

**Pruébalo.** Crea un archivo `.env` con cualquier texto y corre `git status`: git no lo ve. Ahora crea `prueba.txt`: ese sí aparece. Bórralos los dos.

---

## Paso 3 · MySQL dentro de Docker

**Conceptos.**

- **Imagen:** una plantilla con un programa ya instalado (por ejemplo, `mysql:8.4`). Se descarga una vez.
- **Contenedor:** una imagen corriendo. Es como una computadora pequeña y aislada dentro de la tuya.
- **Volumen:** una carpeta que guarda los datos del contenedor. Si borras el contenedor, los datos siguen en el volumen.
- **Puerto:** la "puerta" por la que se llega a un programa. `3306:3306` significa: lo que llegue al puerto 3306 de tu máquina, pásalo al 3306 del contenedor.

Ventaja: nadie instala MySQL a mano. Los dos tenemos exactamente la misma versión, configurada igual.

**`infra/docker-compose.yml`** describe los contenedores. Las partes importantes:

```yaml
services:
  mysql:
    image: mysql:8.4                       # qué imagen usar
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:?Falta MYSQL_ROOT_PASSWORD en infra/.env}
    ports:
      - "${MYSQL_PORT:-3306}:3306"         # puerto de tu máquina : puerto del contenedor
    volumes:
      - mysql-data:/var/lib/mysql          # aquí viven los datos
      - ./mysql/init:/docker-entrypoint-initdb.d:ro   # scripts de la primera vez
```

- `${VARIABLE}` toma el valor de `infra/.env`.
- `${VARIABLE:?mensaje}` hace que, si falta, Docker se detenga y muestre ese mensaje.
- `${MYSQL_PORT:-3306}` significa: usa `MYSQL_PORT` y, si no existe, 3306.

**`infra/mysql/init/01-esquemas.sh`** corre una sola vez, cuando el volumen está vacío. Crea un esquema (una base de datos) por módulo y un usuario por esquema: `neo_app` solo puede tocar `neo`. Así la regla "cada módulo solo toca sus datos" la hace cumplir la propia base de datos, no solo nuestra buena voluntad.

**Comandos.**

```bash
cp infra/.env.example infra/.env                    # tu copia con contraseñas
docker compose -f infra/docker-compose.yml up -d    # -d: en segundo plano
docker compose -f infra/docker-compose.yml ps       # estado; espera a "healthy"
docker compose -f infra/docker-compose.yml logs mysql   # ver qué dijo MySQL
docker compose -f infra/docker-compose.yml down     # apagar (los datos se quedan)
docker compose -f infra/docker-compose.yml down -v  # apagar y BORRAR los datos
```

**Comprobación.** En Workbench, conéctate como `neo_app` (contraseña `neo_local`, puerto 3306) y corre `SHOW DATABASES;`. Solo debe aparecer `neo`, además de bases internas de MySQL como `information_schema`. Conéctate como `root` y verás los cuatro esquemas.

---

## Paso 4 · El backend

### 4.1 La versión de Python

```bash
mkdir backend && cd backend
pyenv local 3.11      # crea .python-version: en esta carpeta se usa Python 3.11
python --version
```

`.python-version` se sube a git. Así, quien clone el repo usa la misma versión de Python sin tener que preguntar.

### 4.2 `pyproject.toml`: la ficha del proyecto

Es el archivo que describe el proyecto de Python. Tiene tres partes:

- `[project]`: nombre, versión, versión mínima de Python y **dependencias**, las librerías que la app necesita para funcionar (FastAPI, SQLAlchemy…).
- `[project.optional-dependencies] dev`: herramientas que solo usamos al programar (pytest, Ruff, mypy). En producción no se instalan.
- `[tool.ruff]`, `[tool.mypy]`, `[tool.pytest.ini_options]`: la configuración de cada herramienta.

Regla: si agregas una librería, la agregas aquí. Si no, funciona en tu máquina y falla en la de los demás.

En muchos proyectos de Python vas a ver un `requirements.txt`: una lista de librerías, una por línea, que se instala con `pip install -r requirements.txt`. Es el formato más antiguo y el más común. Aquí tenemos los dos: `pyproject.toml` manda, y `requirements.txt` y `requirements-dev.txt` repiten su lista para quien instale con `pip install -r` y para la imagen de Docker. Como tener la misma lista en dos lugares invita a que se desfasen, `tests/test_requirements.py` compara los archivos y falla si no coinciden.

### 4.3 La estructura `src/`

```
backend/
├── src/orbita/              # el código de la app
│   ├── __init__.py          # convierte la carpeta en un paquete de Python
│   ├── config.py
│   ├── main.py
│   └── modules/             # un paquete por módulo: identity, neo, watchlist, media, impact
│       └── neo/
│           ├── controllers/ # routers de FastAPI
│           ├── services/    # lógica de negocio
│           ├── repositories/  # acceso a la base y a la API de la NASA
│           ├── models/      # entidades SQLAlchemy y schemas Pydantic
│           ├── utils/       # funciones auxiliares sin estado
│           └── public.py    # lo único que otros módulos pueden importar
└── tests/                   # las pruebas, fuera del código de la app
```

El código va dentro de `src/` para que las pruebas usen el paquete instalado, igual que en producción, y no los archivos sueltos por casualidad.

Cada carpeta de `modules/` tiene un `__init__.py`, aunque esté vacío: así Python la reconoce como paquete y se puede importar (`from orbita.modules.neo.public import ...`). Por ahora las capas están vacías; se llenan desde el sprint 2. Qué va en cada capa y qué puede importar cada una está en [backend/src/orbita/modules/README.md](../../backend/src/orbita/modules/README.md).

### 4.4 El ambiente virtual

```bash
python -m venv .venv          # crea la carpeta .venv con un Python propio
source .venv/bin/activate     # actívalo: tu terminal muestra (.venv)
python -m pip install --upgrade pip
pip install -e ".[dev]"       # instala el proyecto y las herramientas de desarrollo
```

- `-e` significa *editable*: el paquete instalado apunta a tu carpeta `src/`, así que tus cambios se ven sin reinstalar.
- `".[dev]"` significa: este proyecto (`.`) más el grupo de dependencias `dev`.

**Comprobación:** `which python` debe terminar en `backend/.venv/bin/python`. Si no, el ambiente no está activo.

### 4.5 `config.py`: la configuración

```bash
cp .env.example .env
```

`Settings` es una clase de `pydantic-settings` que lee cada variable del archivo `.env` o del sistema y revisa que tenga el tipo correcto:

```python
class Settings(BaseSettings):
    app_env: Literal["local", "dev", "qa", "prod"] = "local"  # solo esos valores
    database_url_neo: str  # obligatoria: no tiene valor por defecto
    jwt_secret: SecretStr  # SecretStr no se imprime en los logs
```

Si falta una variable obligatoria o no es válida, la app **no arranca** y dice cuál es el problema. Es mejor fallar en el primer segundo que a media petición de un usuario.

**Pruébalo.** Deja `JWT_SECRET=CAMBIAME` en tu `.env` y arranca la API (paso 4.8). Lee el error: te dice qué hacer. Luego genera un secreto de verdad:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### 4.6 `main.py`: la app

- `create_app()` arma la aplicación de FastAPI. En el sprint 2, aquí se registran los routers de cada módulo.
- **CORS:** por seguridad, el navegador bloquea las peticiones de una página (`localhost:5173`) a otro origen (`localhost:8000`) salvo que el servidor diga que las permite. `CORS_ORIGINS` es esa lista de permitidos.
- `GET /health` responde `{"status": "ok", "env": "local"}`. Sirve para saber si la API está viva; los despliegues lo usan como prueba de humo.

### 4.7 Las pruebas

- `tests/conftest.py` corre antes que las pruebas y pone variables de entorno fijas, para que las pruebas no dependan del `.env` de nadie.
- Cada prueba sigue el patrón **preparar → actuar → comprobar**:

```python
def test_health_responde_ok() -> None:
    client = TestClient(app)  # preparar
    response = client.get("/health")  # actuar
    assert response.status_code == 200  # comprobar
```

```bash
pytest           # corre todas
pytest -v        # muestra el nombre de cada una
```

**Pruébalo.** Cambia `"ok"` por `"bien"` en `main.py`, corre `pytest` y lee cómo falla. Regrésalo.

### 4.8 Correr la API

```bash
uvicorn orbita.main:app --reload
```

- `orbita.main:app` significa: en el módulo `orbita/main.py`, usa la variable `app`.
- `--reload` reinicia la API cada vez que guardas un archivo.

**Comprobación:** abre http://localhost:8000/health y http://localhost:8000/docs.

### 4.9 Revisores automáticos

```bash
ruff check .     # errores comunes y estilo
ruff format .    # formatea el código
mypy src         # revisa que los tipos cuadren
```

---

## Paso 5 · El frontend

### 5.1 La versión de Node

`frontend/.nvmrc` contiene `24`. Dentro de `frontend/`, `nvm use` cambia a esa versión. Es lo mismo que `.python-version`, pero para Node.

### 5.2 Cómo nace un proyecto de Vite

Vite es la herramienta que sirve la página mientras programas y la compila para producción. Un proyecto nuevo se crea con:

```bash
npm create vite@latest frontend -- --template react-ts
```

Eso genera una base de React con TypeScript. En Órbita partimos de esa base y le hicimos estos cambios:

- **Dependencias nuevas:** TanStack Query (pide datos a la API y los guarda en caché), Zod (valida datos) y Vitest con Testing Library (pruebas).
- **Alias `@`** en `vite.config.ts` y `tsconfig.json`: permite escribir `@/shared/http/httpClient` en lugar de `../../../shared/http/httpClient`.
- **Reglas de capas en ESLint** (paso 5.6).
- **La carpeta `src/`** reorganizada en `app/`, `features/` y `shared/`.

### 5.3 `package.json` y `package-lock.json`

- `dependencies`: lo que la página necesita para funcionar (React, Zod…).
- `devDependencies`: herramientas para programar (TypeScript, ESLint, Vitest…).
- `scripts`: atajos. `npm run dev` ejecuta lo que dice `"dev"`.
- `package-lock.json` anota la versión **exacta** de cada librería instalada. Se sube a git.

| Comando | Cuándo |
| --- | --- |
| `npm ci` | Para instalar lo que ya está en el proyecto. Respeta el lock al pie de la letra |
| `npm install <paquete>` | Solo para agregar una dependencia nueva. Modifica `package.json` y el lock |

### 5.4 Variables de entorno del front

```bash
cp .env.example .env.local
```

Solo las variables que empiezan con `VITE_` llegan al código, y **terminan dentro del JavaScript que descarga el navegador**: cualquiera las puede leer. Por eso en el front nunca va un secreto.

`src/shared/config/env.ts` las valida con Zod al arrancar, igual que `Settings` en el backend.

### 5.5 Clean Architecture, siguiendo una petición

La feature `system` muestra si la API está en línea. Es pequeña a propósito: sirve de molde para todas las demás. Sigue el camino de una petición:

```
presentation/ApiStatusBadge.tsx     dibuja el resultado
        │ usa
presentation/useApiStatus.ts        pide el dato con useQuery
        │ llama al caso de uso con el repositorio que da container
application/checkApiStatus.ts       decide: ¿en línea o fuera de línea?
        │ usa la interfaz
domain/ApiStatus.ts                 HealthRepository: "necesito algo que me dé la salud de la API"
        ▲ la implementa
infrastructure/HttpHealthRepository.ts   la consigue con GET /health y la valida con Zod
        │ usa
shared/http/httpClient.ts           hace el fetch
```

Las ideas clave:

- **`domain` no sabe de dónde vienen los datos.** Solo define la interfaz `HealthRepository`. Mañana podrían venir de otra API, o de un archivo, y `domain` no cambiaría.
- **`application` recibe el repositorio por parámetro.** Por eso en las pruebas le pasamos uno falso y no hace falta tener la API corriendo.
- **`src/app/container.ts` es el único que arma las piezas reales:** crea el `HttpHealthRepository` y lo entrega. A esto se le llama *raíz de composición*.

### 5.6 Las reglas de capas

`eslint.config.js` prohíbe, por ejemplo:

- importar React dentro de `domain/` o `application/`;
- usar `fetch` o importar `infrastructure/` desde `presentation/`.

**Pruébalo.** En `ApiStatusBadge.tsx` agrega `fetch("/health");` y corre `npm run lint`. Lee el error y bórralo.

### 5.7 Pruebas del front

- `checkApiStatus.test.ts` prueba el caso de uso con un repositorio falso (un objeto con `getHealth`).
- `ApiStatusBadge.test.tsx` prueba el componente. `vi.mock` reemplaza el `container` real por uno falso, así la prueba no llama a la API.

```bash
npm test
```

### 5.8 Comprobación final

Con el backend corriendo, `npm run dev` y abre http://localhost:5173: debe decir "API en línea · ambiente local". Detén el backend con `Ctrl+C`; en menos de 30 segundos cambia a "API fuera de línea". Ese es el front hablando con el back.

### 5.9 ¿Y las carpetas con `.gitkeep`?

Git no guarda carpetas vacías. `.gitkeep` es un archivo vacío que se pone para que la carpeta exista en el repo. Cuando escribas el primer archivo real de esa capa, lo borras.

---

## Paso 6 · Revisiones antes de cada commit (pre-commit)

`.pre-commit-config.yaml` lista revisiones que corren solas cada vez que haces `git commit`:

| Revisión | Qué hace |
| --- | --- |
| `trailing-whitespace`, `end-of-file-fixer` | Limpian espacios sobrantes y el final de los archivos |
| `check-merge-conflict` | Detiene el commit si se quedó un `<<<<<<<` de un conflicto |
| `no-commit-to-branch` | Prohíbe hacer commit directo en `dev`, `qa` o `main` |
| `ruff-check`, `ruff-format` | Revisan y formatean el Python |
| `prettier` | Formatea el frontend |
| `gitleaks` | Detiene el commit si encuentra algo que parece una contraseña o una llave |

```bash
pre-commit install            # una vez por clon del repo
pre-commit run --all-files    # correr todo a mano
```

Si una revisión **arregla** un archivo (por ejemplo, lo formatea), el commit se cancela para que veas el cambio. Haz `git add` otra vez y repite el commit.

**Pruébalo.** Cámbiate a `dev` e intenta hacer un commit. Lee el mensaje de `no-commit-to-branch`.

---

## Paso 7 · VS Code

- `.vscode/extensions.json`: las extensiones recomendadas. VS Code las ofrece al abrir el proyecto.
- `.vscode/settings.json`: usa el Python de `backend/.venv` y formatea al guardar.
- `.vscode/launch.json`: configuraciones del **depurador**.

**Pruébalo con el depurador.**

1. Abre `backend/src/orbita/main.py` y haz clic a la izquierda del número de línea de `return {"status": "ok", ...}`. Aparece un punto rojo: eso es un *breakpoint*.
2. Panel Run and Debug → "Backend: API" → botón verde.
3. Abre http://localhost:8000/health. VS Code se detiene en tu línea.
4. Pasa el mouse sobre `settings` para ver sus valores. Continúa con F5.

Aprender a depurar te ahorra horas: en lugar de adivinar qué valor tiene una variable, lo ves.

---

## Paso 8 · GitHub

### 8.1 Lo que hay en `.github/`

| Archivo | Para qué |
| --- | --- |
| `pull_request_template.md` | El texto que aparece al abrir un PR, con el checklist de Definition of Done |
| `ISSUE_TEMPLATE/historia.yml` y `bug.yml` | Formularios para crear issues ordenados |
| `CODEOWNERS` | Quién tiene que aprobar los PR. Solo está JL: GitHub le pide la revisión automáticamente y sin su aprobación no se puede fusionar |
| `dependabot.yml` | Abre PRs solos cuando sale una versión nueva de una dependencia |
| `workflows/ci.yml` | El CI: revisa automáticamente cada PR (ver abajo) |

**El CI (`ci.yml`).** Cada vez que abres un PR o le subes un commit, GitHub corre en un servidor suyo lo mismo que tú corres en tu máquina: `ruff`, `mypy` y `pytest`. Así se ve:

```
changes  →  ¿cambió backend/?  ──sí──→  backend (Ruff, formato, mypy, pytest)
                                                     │
                                                     ▼
                                    ci-ok  (siempre corre y resume a los demás)
```

- `changes` mira qué carpetas tocó tu PR, para no revisar el frontend si solo cambiaste el backend.
- `ci-ok` es el único check que las ramas protegidas exigen. Si un job falló, `ci-ok` falla y el botón de merge queda bloqueado. Existe porque, si GitHub exigiera directamente el job `backend` y ese job se saltara por no tener cambios, el PR se quedaría esperando para siempre.
- En el sprint 2 vas a agregar el job `frontend`, copiando la forma del job `backend`.

Cuando el CI falla, abre el PR, pestaña **Checks**, entra al job en rojo y busca el paso que falló. El log muestra el mismo error que verías en tu terminal. Corre ese comando en tu máquina, arréglalo, haz commit y push: el CI vuelve a correr solo.

### 8.2 Crear el repo en GitHub y el primer commit

```bash
gh repo create orbita --public --source=. --remote=origin   # o desde github.com › New repository
git add .
git status          # REVISA: no debe aparecer ningún .env, ni .venv, ni node_modules
git commit -m "chore: estructura inicial del proyecto"
pre-commit install  # después del primer commit, no antes
```

¿Por qué `pre-commit install` va después? Porque `no-commit-to-branch` prohíbe hacer commits en `main`, y el primer commit tiene que ir ahí. Es la única excepción.

### 8.3 Ramas, protecciones, etiquetas y milestones

```bash
./infra/github/configurar-repo.sh usuario/orbita
```

El script:

1. Sube `main`, crea `qa` a partir de `main` y `dev` a partir de `qa`: cada rama nace de la que tiene encima en la cadena de promociones.
2. Pone `dev` como rama por defecto.
3. Protege `dev`, `qa` y `main`: nadie hace push directo, todo entra por PR con la aprobación de JL y con `ci-ok` en verde. En `dev`, además, tu rama tiene que estar al día con `dev` antes de fusionar. GitHub no deja aprobar el PR propio, así que JL, como administrador del repo, puede fusionar los suyos sin esperar una aprobación.
4. Crea las etiquetas (`backend`, `bug`, `qa`…) y un milestone por sprint.

Abre el script y léelo: cada bloque tiene un `echo` que dice qué hace.

A mano quedan dos cosas: el tablero en GitHub Projects y las fechas de los milestones.

### 8.4 Los issues del sprint

En el equipo nadie programa algo que no esté en un issue. Los issues de cada sprint se escriben como archivos en `infra/github/backlog/sprint-N/`: un archivo por issue, con un encabezado (título, etiquetas, a quién se asigna, milestone) y el cuerpo con la historia y los criterios de aceptación. Se crean en GitHub así:

```bash
./infra/github/crear-issues.sh usuario/orbita sprint-1 usuario_jl usuario_ella
```

Los **criterios de aceptación** son la lista de lo que tiene que ser cierto para dar el issue por terminado. Antes de abrir tu PR, revísalos uno por uno.

---

## Paso 9 · El primer ciclo completo

Así se ve un cambio desde que empieza hasta que llega a producción. Lo vas a repetir en cada sprint.

```bash
# 1. Rama de trabajo, siempre desde dev actualizado
git switch dev && git pull
git switch -c docs/3-corregir-readme

# 2. Cambios y commit
git add -p                       # revisa cada pedazo antes de agregarlo
git commit -m "docs: aclarar cómo activar el ambiente virtual"

# 3. Ponerse al día y subir
git fetch && git rebase origin/dev
git push

# 4. PR hacia dev
gh pr create --base dev --fill
```

Después, en GitHub:

1. El CI corre solo. Si `ci-ok` sale en rojo, arréglalo antes de pedir revisión.
2. JL revisa. Responde cada comentario, con un cambio o con una explicación. Cuando JL aprueba, se fusiona con **Squash and merge** y el issue se cierra si el PR dice `Cierra #N`. En los PR de JL es al revés: tú revisas y comentas, y JL los fusiona.
3. Al cierre del sprint: PR de `dev` hacia `qa`, fusionado con **Create a merge commit**. Se prueba con `docs/qa/checklist.md`.
4. PR de `qa` hacia `main`, también con **merge commit**.
5. Tag y release:

```bash
git switch main && git pull
git tag -a v0.1.0 -m "Sprint 1: estructura inicial"
git push origin v0.1.0
gh release create v0.1.0 --generate-notes
```

¿Por qué squash hacia `dev` y merge commit entre `dev`, `qa` y `main`? Está en [docs/adr/0001-ramas-dev-qa-main.md](../adr/0001-ramas-dev-qa-main.md).

---

## Reto: armarlo desde cero

En una carpeta nueva, `orbita-practica`, repite los pasos 1 a 7 escribiendo cada archivo tú misma, sin copiar y pegar, consultando el repo real solo cuando te atores. Marca cada punto cuando funcione:

- [ ] Repo de git con `.gitignore`, `.editorconfig` y `.gitattributes`
- [ ] MySQL en Docker con un esquema y un usuario propio, comprobado en Workbench
- [ ] Backend con `pyproject.toml`, `.venv`, `Settings` y `GET /health`
- [ ] Una prueba de pytest que pase y otra que hayas hecho fallar a propósito
- [ ] Frontend creado con `npm create vite@latest`, con `.env.local` validado por Zod
- [ ] Una feature con sus cuatro capas que muestre si la API está en línea
- [ ] Una prueba del caso de uso con un repositorio falso
- [ ] pre-commit instalado y bloqueando un commit en `main`
- [ ] Un breakpoint que se detenga en tu endpoint

Cuando termines, súbelo a tu GitHub: es el primer proyecto de tu portafolio.
