"""Punto de entrada de la API. Se levanta con: uvicorn orbita.main:app --reload"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from orbita.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    app = FastAPI(title="Órbita API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["sistema"])
    def health() -> dict[str, str]:
        return {"status": "ok", "env": settings.app_env}

    # En el sprint 2 aquí se registran los routers de cada módulo.
    return app


app = create_app()
