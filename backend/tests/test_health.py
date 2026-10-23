from fastapi.testclient import TestClient

from orbita.main import app


def test_health_responde_ok() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "env": "local"}
