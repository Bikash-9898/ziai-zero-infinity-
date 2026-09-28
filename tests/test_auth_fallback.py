from fastapi.testclient import TestClient

from app import database
from app.main import app


def test_guest_login_works_without_database(monkeypatch):
    monkeypatch.setattr(database, "AsyncSessionLocal", None)

    client = TestClient(app)
    response = client.post(
        "/api/auth/guest",
        json={"client_guest_id": "test_guest_123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["verified"] is True
    assert payload["access_token"]
