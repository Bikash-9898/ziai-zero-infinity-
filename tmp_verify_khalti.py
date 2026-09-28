from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers.billing_router import router
from app.database import get_db
import app.routers.billing_router as billing_router_module

async def override_get_db():
    yield None

app = FastAPI()
app.include_router(router)
app.dependency_overrides[get_db] = override_get_db

async def fake_create_pending_payment(*args, **kwargs):
    return {'ok': True}

async def fake_activate_subscription(*args, **kwargs):
    return {'ok': True}

billing_router_module.create_pending_payment = fake_create_pending_payment
billing_router_module.activate_subscription = fake_activate_subscription

client = TestClient(app)
resp1 = client.post('/api/billing/khalti/initiate?plan=basic&user_id=4ac6348a-892f-4e10-8b29-92c624b46418')
print('INITIATE_STATUS', resp1.status_code)
print(resp1.text)
resp2 = client.post('/api/billing/khalti/verify', json={'transaction_uuid': 'abc', 'pidx': 'pidx-1', 'amount': 1000})
print('VERIFY_STATUS', resp2.status_code)
print(resp2.text)
