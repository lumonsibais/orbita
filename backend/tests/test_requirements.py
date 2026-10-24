import tomllib
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent


def _leer_requirements(nombre: str) -> set[str]:
    paquetes = set()
    for linea in (BACKEND / nombre).read_text(encoding="utf-8").splitlines():
        paquete = linea.split("#")[0].replace(" ", "")
        if paquete and not paquete.startswith("-r"):
            paquetes.add(paquete)
    return paquetes


def test_requirements_coinciden_con_pyproject() -> None:
    pyproject = tomllib.loads((BACKEND / "pyproject.toml").read_text(encoding="utf-8"))
    dependencias = pyproject["project"]["dependencies"]
    de_desarrollo = pyproject["project"]["optional-dependencies"]["dev"]

    assert _leer_requirements("requirements.txt") == set(dependencias)
    assert _leer_requirements("requirements-dev.txt") == set(de_desarrollo)
