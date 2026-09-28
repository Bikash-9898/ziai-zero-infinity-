from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence


@dataclass
class PromptBuilder:
    """Build compact prompts for streaming voice conversations."""

    system_instruction: str = (
        "You are a helpful voice assistant. Hello, I'm ZIAI your AI assistant. "
        "Keep answers concise, conversational, and friendly. Answer in the user's language."
    )

    def build(self, *, user_message: str, language: str, recent_messages: Sequence[dict] | None = None) -> str:
        recent = recent_messages or []
        history = "\n".join(
            f"{item.get('role', 'user')}: {item.get('content', '')}" for item in recent[-6:]
        )
        return (
            f"{self.system_instruction}\n"
            f"User language code: {language}\n"
            f"Conversation history:\n{history}\n"
            f"Latest user message: {user_message}"
        )
