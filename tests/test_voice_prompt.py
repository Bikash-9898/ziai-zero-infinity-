import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ZIAI_backend"))

from app.services.voice_prompt import PromptBuilder


def test_prompt_builder_includes_language_and_recent_context():
    builder = PromptBuilder()
    prompt = builder.build(
        user_message="What is the weather like?",
        language="ne",
        recent_messages=[
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"},
        ],
    )

    assert "ne" in prompt.lower()
    assert "what is the weather like?" in prompt.lower()
    assert "hello" in prompt.lower()


def test_prompt_builder_includes_identity_response_rule():
    builder = PromptBuilder()
    prompt = builder.build(
        user_message="Who are you?",
        language="en",
        recent_messages=[],
    )

    assert "hello, i'm ziai your ai assistant" in prompt.lower()
