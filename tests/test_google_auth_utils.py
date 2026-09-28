from types import SimpleNamespace

from app.auth_utils import verify_google_token


class DummyResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise Exception("bad status")

    def json(self):
        return self._payload


def test_verify_google_token_accepts_id_token(monkeypatch):
    calls = []

    def fake_get(url, headers=None, timeout=None, params=None):
        calls.append((url, headers, params))
        if url.endswith("userinfo"):
            return DummyResponse(401, {})
        if url.endswith("tokeninfo"):
            return DummyResponse(200, {
                "email": "user@example.com",
                "name": "Example User",
                "email_verified": True,
            })
        return DummyResponse(500, {})

    monkeypatch.setattr("app.auth_utils.httpx.get", fake_get)

    result = verify_google_token("google-id-token")

    assert result["success"] is True
    assert result["data"]["email"] == "user@example.com"
    assert len(calls) == 1
