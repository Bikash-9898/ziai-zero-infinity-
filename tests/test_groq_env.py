import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ZIAI_backend"))


def test_groq_key_and_model_registration(monkeypatch):
    monkeypatch.setenv("Groq_API_KEY", "test-groq-key")
    sys.modules.pop("app.services.ai_service", None)
    ai_service = importlib.import_module("app.services.ai_service")

    assert ai_service.get_groq_api_key() == "test-groq-key"
    assert "groq-llama3" in ai_service.AVAILABLE_MODELS
    assert ai_service.DEFAULT_MODEL == "groq-llama3"
