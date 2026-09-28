import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers.billing_router import router
from app.database import get_db
from app.routers import billing_router as billing_router_module


@pytest.fixture
def client(monkeypatch):
    async def override_get_db():
        yield None

    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_db] = override_get_db

    async def fake_create_pending_payment(*args, **kwargs):
        return {"ok": True}

    async def fake_activate_subscription(*args, **kwargs):
        return {"ok": True}

    monkeypatch.setattr(billing_router_module, "create_pending_payment", fake_create_pending_payment)
    monkeypatch.setattr(billing_router_module, "activate_subscription", fake_activate_subscription)

    return TestClient(app)


def test_khalti_initiate_route_returns_payload(client):
    response = client.post(
        "/api/billing/khalti/initiate?plan=basic&user_id=4ac6348a-892f-4e10-8b29-92c624b46418"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["public_key"]
    assert data["product_identity"]
    assert data["transaction_uuid"]


def test_khalti_verify_route_returns_verified(client):
    response = client.post(
        "/api/billing/khalti/verify",
        json={
            "pidx": "test-pidx",
            "transaction_uuid": "test-transaction",
            "token": "test-token",
            "amount": 1000,
        },
    )

    assert response.status_code == 200
    assert response.json()["verified"] is True
