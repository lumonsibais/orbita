# Órbita

Web para seguir asteroides que pasan cerca de la Tierra: lista de vigilancia, alertas de acercamiento y calculadora de impacto, con datos de la NASA y del JPL. El plan completo está en [Plan orbita.md](Plan%20orbita.md).

Este README es la guía para levantar el proyecto en una máquina nueva. Si algún paso no te funciona, no es tu culpa: es un bug del README. Anota qué pasó, encuentra cómo resolverlo y corrígelo en un PR.

Para entender cómo y por qué se armó el proyecto, y para practicar armándolo desde cero, está la guía [docs/guias/01-como-armamos-el-proyecto.md](docs/guias/01-como-armamos-el-proyecto.md).

## Qué hay en el repo

| Carpeta | Qué contiene |
| --- | --- |
| `backend/` | La API en Python con FastAPI |
| `frontend/` | La web en React con TypeScript y Vite |
| `infra/` | `docker-compose.yml` con MySQL y la configuración de GitHub |
| `docs/` | Decisiones de arquitectura (ADR) y el checklist de QA |
| `.github/` | El CI, plantillas de issues y PRs, dueños del código, Dependabot |
| `.vscode/` | Configuración del depurador y extensiones recomendadas |

## 1. Instalar las herramientas (una sola vez)

Estas instrucciones son para macOS. En Windows, instala primero [WSL2 con Ubuntu](https://learn.microsoft.com/es-es/windows/wsl/install) y haz todo lo demás dentro de Ubuntu.

1. **Herramientas de línea de comandos** (incluyen Git): `xcode-select --install`
2. **[Homebrew](https://brew.sh/es/)**, el instalador de paquetes de macOS. Sigue las instrucciones de su página.
3. **Python 3.11 con pyenv**, que permite tener varias versiones de Python sin pelearse entre ellas:
   ```bash
   brew install pyenv openssl@3
   echo 'eval "$(pyenv init - zsh)"' >> ~/.zshrc   # para que la terminal encuentre pyenv
   exec zsh                                        # recarga la terminal
   PYTHON_BUILD_HOMEBREW_OPENSSL_FORMULA=openssl@3 pyenv install 3.11
   ```
   La variable del último comando le dice a pyenv que compile Python con OpenSSL 3. Sin ella, pyenv usa OpenSSL 4 (el que trae Homebrew por defecto), con el que Python 3.11 no compila, y la instalación falla con `ModuleNotFoundError: No module named '_ssl'`. Tarda unos minutos y es normal que no muestre nada mientras compila.
4. **Node 24 con nvm**, lo mismo que pyenv pero para Node (lo que corre el frontend):
   ```bash
   brew install nvm
   mkdir -p ~/.nvm
   echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
   echo '[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"' >> ~/.zshrc
   exec zsh
   nvm install 24
   ```
5. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**. Ábrelo una vez y déjalo corriendo; sin él, `docker compose` no funciona.
6. **[VS Code](https://code.visualstudio.com/)**. Al abrir el proyecto te ofrecerá instalar las extensiones recomendadas: acepta.
7. **[MySQL Workbench](https://dev.mysql.com/downloads/workbench/)**, para ver la base de datos.

**Configura Git** con tu nombre y tu correo de GitHub:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo@ejemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global push.autoSetupRemote true
git config --global core.editor "code --wait"
```

**Crea tu llave SSH** para que GitHub te reconozca sin pedir contraseña:

```bash
ssh-keygen -t ed25519 -C "tu-correo@ejemplo.com"   # Enter a todo
cat ~/.ssh/id_ed25519.pub                           # copia lo que imprime
```

Pégala en GitHub › Settings › SSH and GPG keys › New SSH key. Comprueba con `ssh -T git@github.com`.

## 2. Clonar el repo

```bash
mkdir -p ~/Developer && cd ~/Developer   # la carpeta para tus proyectos
git clone git@github.com:USUARIO/orbita.git
cd orbita
git switch dev                           # se trabaja siempre a partir de dev
```

No clones el repo dentro de Documentos ni del Escritorio. Si iCloud sincroniza esas carpetas (pasa a menudo en Mac), daña el ambiente virtual y llena `.git` de archivos duplicados como `index 2`.

## 3. Levantar MySQL

```bash
cp infra/.env.example infra/.env
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps    # espera a que diga "healthy"
```

La primera vez, MySQL crea un esquema por módulo (`identity`, `neo`, `watchlist`, `media`) y un usuario para cada uno con permisos solo sobre su esquema.

**Conectarte con Workbench:** nueva conexión con host `127.0.0.1`, puerto `3306`, usuario `root` y la contraseña de `MYSQL_ROOT_PASSWORD` en `infra/.env`. Para ver lo mismo que ve la app, crea otra con el usuario `neo_app` y verás que solo tiene acceso al esquema `neo`.

## 4. Backend: ambiente virtual y `.env`

Un **ambiente virtual** es una carpeta (`.venv/`) con su propio Python y sus propias librerías, para que este proyecto no choque con otros ni con el Python del sistema.

```bash
cd backend
pyenv local 3.11                  # usa Python 3.11 en esta carpeta
python -m venv .venv              # crea el ambiente (una sola vez)
source .venv/bin/activate         # actívalo; tu terminal ahora muestra (.venv)
python -m pip install --upgrade pip
pip install -e ".[dev]"           # instala la app y las herramientas de desarrollo
pre-commit install                # revisiones automáticas antes de cada commit
```

`.venv/` está en `.gitignore`: no se sube a GitHub, y cada quien lo crea en su máquina con estos comandos.

Las librerías están en `pyproject.toml`, que es lo que lee `pip install -e ".[dev]"`. La misma lista está en `requirements.txt` (lo que la API necesita para correr) y en `requirements-dev.txt` (eso más las herramientas de desarrollo), para quien instale con `pip install -r` y, desde el sprint 3, para la imagen de Docker. Si agregas una librería, ponla en `pyproject.toml` y en el `requirements` que corresponda, en el mismo PR. Si los archivos no coinciden, `pytest` falla.

Ahora el **archivo `.env`**, con la configuración de tu máquina. Se copia de la plantilla y nunca se sube a git:

```bash
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Abre `backend/.env` y pega el resultado del segundo comando en `JWT_SECRET`, en lugar de `CAMBIAME`. Si quieres tu propia llave de la NASA, regístrala gratis en [api.nasa.gov](https://api.nasa.gov/) y ponla en `NASA_API_KEY`.

## 5. Correr la API y las pruebas

Con el ambiente activado y dentro de `backend/`:

```bash
uvicorn orbita.main:app --reload    # la API queda en http://localhost:8000
```

- [http://localhost:8000/health](http://localhost:8000/health) debe responder `{"status":"ok","env":"local"}`.
- [http://localhost:8000/docs](http://localhost:8000/docs) muestra la documentación interactiva (Swagger).
- `Ctrl+C` detiene la API.

En otra terminal (activando otra vez el ambiente):

```bash
pytest          # corre las pruebas
ruff check .    # revisa el estilo
mypy src        # revisa los tipos
```

**Depurar en VS Code:** pon un punto rojo a la izquierda de una línea, abre el panel Run and Debug y elige "Backend: API" o "Backend: pruebas del archivo abierto". El programa se detiene ahí y puedes ver el valor de cada variable.

## 6. Frontend

En otra terminal, desde la raíz del repo:

```bash
cd frontend
nvm use                         # usa la versión de Node de .nvmrc
npm ci                          # instala las dependencias exactas de package-lock.json
cp .env.example .env.local      # configuración del front en tu máquina
npm run dev                     # la web queda en http://localhost:5173
```

Con el backend corriendo, la página muestra "API en línea · ambiente local". Si lo detienes, en menos de 30 segundos cambia a "API fuera de línea": así compruebas que el front y el back se hablan.

`node_modules/` es para el front lo que `.venv/` es para el back: no se sube a git y se recrea con `npm ci`. Usa `npm install <paquete>` solo para agregar una dependencia nueva; eso cambia `package.json` y `package-lock.json`, y los dos van en tu PR.

Otros comandos, dentro de `frontend/`:

```bash
npm test               # pruebas con Vitest
npm run lint           # ESLint, incluidas las reglas de capas
npm run typecheck      # revisa los tipos de TypeScript
npm run format         # formatea con Prettier
npm run build          # compila la versión de producción en dist/
```

## 7. Levantar back y front juntos

El front, en el puerto 5173, le pide datos al back, en el 8000. Cada uno corre en su propia terminal, y las dos se quedan abiertas mientras trabajas.

**Terminal 1, el backend:**

```bash
cd ~/Developer/orbita/backend
source .venv/bin/activate          # el prompt muestra (.venv)
uvicorn orbita.main:app --reload   # se queda corriendo; no cierres esta terminal
```

Está listo cuando aparece `Application startup complete`.

**Terminal 2, el frontend.** Abre otra terminal (en VS Code, el botón `+` del panel de terminal; en la app Terminal, `Cmd+T`):

```bash
cd ~/Developer/orbita/frontend
nvm use
npm run dev                        # se queda corriendo; no cierres esta terminal
```

Está listo cuando muestra `Local: http://localhost:5173/`.

**Comprueba que se hablan:**

1. Abre [http://localhost:5173](http://localhost:5173). Debe decir **API en línea · ambiente local**.
2. Detén el backend con `Ctrl+C` en la terminal 1. En menos de 30 segundos la página cambia a **API fuera de línea**.
3. Arráncalo otra vez (flecha arriba y Enter) y la página vuelve a "en línea".

El front sabe dónde está el back por `VITE_API_URL` en `frontend/.env.local` (`http://localhost:8000`). El back acepta las llamadas del front porque `CORS_ORIGINS` en `backend/.env` incluye `http://localhost:5173`. Si cambias un puerto, cambia los dos archivos.

Por ahora la API no usa MySQL, así que esto funciona aunque Docker esté apagado.

Para terminar, `Ctrl+C` en cada terminal.

## El día a día

Cada vez que vayas a trabajar, levanta MySQL y luego el back y el front como en la sección 7:

```bash
cd ~/Developer/orbita
docker compose -f infra/docker-compose.yml up -d
```

Para empezar un issue (por ejemplo, el #12):

```bash
git switch dev
git pull                                   # trae lo último de dev
git switch -c feat/12-descripcion-corta    # tu rama de trabajo
# ... programas, pruebas ...
git add -p                                 # revisa cada cambio antes de agregarlo
git commit -m "feat(neo): descripción en inglés del cambio"
git fetch && git rebase origin/dev         # ponte al día antes de abrir el PR
git push                                   # la primera vez crea la rama en GitHub
```

Luego abre el Pull Request hacia `dev` en GitHub y llena la plantilla. El CI revisa el PR solo; si el check `ci-ok` sale en rojo, abre la pestaña **Checks**, busca el paso que falló y corre ese mismo comando en tu máquina. El flujo completo de ramas está en el plan, sección "Ramas y ambientes".

## Problemas comunes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `ValidationError` al arrancar, menciona `JWT_SECRET` | Sigue el valor `CAMBIAME` o es muy corto | Genera uno con el comando del paso 4 |
| `ValidationError` con `Field required` | Falta `backend/.env` o una variable | `cp .env.example .env` dentro de `backend/` |
| `pip` instala pero luego "no module named..." | El ambiente no estaba activado | `source .venv/bin/activate` y vuelve a instalar |
| `port is already allocated` en el 3306 | Ya tienes otro MySQL en tu máquina | En `infra/.env` pon `MYSQL_PORT=3307` y cambia el puerto en las URLs de `backend/.env` |
| `Access denied for user` | Cambiaste contraseñas después del primer arranque | Borra el volumen y vuelve a crearlo (abajo) |
| `Cannot connect to the Docker daemon` | Docker Desktop está cerrado | Ábrelo y espera a que arranque |
| El commit falla con `no-commit-to-branch` | Estás en `dev`, `qa` o `main` | `git switch -c feat/NN-nombre` y haz el commit ahí |
| El commit falla en el hook `prettier (frontend)` | No has instalado las dependencias del front | `cd frontend && npm ci` |
| Página en blanco y en la consola del navegador `VITE_API_URL debe ser una URL` | Falta `frontend/.env.local` | `cp .env.example .env.local` y reinicia `npm run dev` |
| "API fuera de línea" con el backend corriendo | El backend no está en el puerto 8000, o `CORS_ORIGINS` no incluye `http://localhost:5173` | Revisa `VITE_API_URL` en el front y `CORS_ORIGINS` en `backend/.env` |
| `nvm: command not found` | Faltan las líneas de nvm en `~/.zshrc` | Repite el paso 4 de las herramientas |
| `pyenv install` falla con `No module named '_ssl'` o `Missing the OpenSSL lib?` | Python 3.11 no compila con OpenSSL 4 | `brew install openssl@3`, borra el intento fallido con la versión que mostró el error (por ejemplo `pyenv uninstall -f 3.11.17`) y repite la instalación con la variable del paso 3 de las herramientas |
| `No module named 'orbita'` al arrancar la API o al correr `pytest`, aunque ya hiciste `pip install -e`; o aparecen archivos como `index 2` dentro de `.git` | El repo está en Documentos o en el Escritorio, y iCloud los sincroniza: oculta archivos del ambiente virtual y Python deja de verlos | Clona el repo otra vez en `~/Developer` (sección 2), copia tus `backend/.env` y `frontend/.env.local` y vuelve a crear el ambiente (sección 4) |
| La terminal muestra `(base)` y `python --version` no dice 3.11 | Conda (Anaconda o Miniconda) activa su propio Python en cada terminal | `conda deactivate`; para que no vuelva a pasar, `conda config --set auto_activate_base false` |

**Empezar la base desde cero** (borra todos los datos locales):

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d
```
