"""Arranca la API en modo desarrollo: python run.py, con el ambiente virtual activado."""

import os
from pathlib import Path

import uvicorn

if __name__ == "__main__":
    # La configuración se lee de .env en la carpeta actual; así funciona desde cualquier carpeta.
    os.chdir(Path(__file__).parent)
    uvicorn.run("orbita.main:app", reload=True)
