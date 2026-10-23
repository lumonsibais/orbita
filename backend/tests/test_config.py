import pytest
from pydantic import ValidationError

from orbita.config import Settings


def test_rechaza_jwt_secret_corto() -> None:
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        Settings(jwt_secret="CAMBIAME")


def test_separa_los_origenes_de_cors() -> None:
    settings = Settings(cors_origins="http://localhost:5173, https://orbita.dev")

    assert settings.cors_origin_list == ["http://localhost:5173", "https://orbita.dev"]
