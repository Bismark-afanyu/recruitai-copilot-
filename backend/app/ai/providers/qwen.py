"""Qwen Cloud provider — wraps the DashScope OpenAI-compatible API.

Qwen Cloud supports structured output via response_format={"type": "json_object"}
in non-thinking mode. This provider handles JSON repair via a fast model when needed.
"""
import json
import logging
import time
from typing import Any

from openai import OpenAI, APIStatusError, RateLimitError, AuthenticationError

log = logging.getLogger("recruitai.qwen")

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
DEFAULT_MODEL_QUALITY = "qwen3.7-plus"
DEFAULT_MODEL_FAST = "qwen3.6-flash"
DEFAULT_MODEL_REASONING = "qwen3.7-max"

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.0


class QwenError(Exception):
    """Raised when a Qwen API request fails after retries."""
    pass


class QwenProvider:
    """Thin wrapper around the Qwen Cloud OpenAI-compatible API.

    Usage:
        provider = QwenProvider(api_key="sk-xxx")
        result = provider.json_request(
            system="You are a helpful assistant.",
            user="Extract the name.",
            schema={"type": "object", "properties": {"name": {"type": "string"}}},
        )
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = DEFAULT_BASE_URL,
        model_quality: str = DEFAULT_MODEL_QUALITY,
        model_fast: str = DEFAULT_MODEL_FAST,
        model_reasoning: str = DEFAULT_MODEL_REASONING,
    ):
        self.api_key = api_key or ""
        self.base_url = base_url
        self.model_quality = model_quality
        self.model_fast = model_fast
        self.model_reasoning = model_reasoning

        self._client: OpenAI | None = None
        self._ensure_client()

    def _ensure_client(self):
        """Lazily initialize the OpenAI client."""
        if self._client is None:
            self._client = OpenAI(
                api_key=self.api_key or "dummy-key",
                base_url=self.base_url,
            )

    def _get_model(self, tier: str = "quality") -> str:
        """Return the model name for the requested tier."""
        if tier == "fast":
            return self.model_fast
        if tier == "reasoning":
            return self.model_reasoning
        return self.model_quality

    def _create_with_retry(
        self,
        model: str,
        messages: list[dict],
        response_format: dict | None = None,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        """Call the Qwen API with retry logic for rate limits and server errors."""
        last_exc = None

        for attempt in range(_MAX_RETRIES):
            try:
                kwargs: dict[str, Any] = {
                    "model": model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                }
                if response_format:
                    kwargs["response_format"] = response_format

                completion = self._client.chat.completions.create(**kwargs)
                content = completion.choices[0].message.content or ""
                return {"content": content, "finish_reason": completion.choices[0].finish_reason}

            except AuthenticationError:
                raise QwenError(
                    "Qwen API key is missing or invalid. "
                    "Set DASHSCOPE_API_KEY in your .env file."
                )
            except RateLimitError as exc:
                last_exc = exc
                if attempt < _MAX_RETRIES - 1:
                    delay = _RETRY_BASE_DELAY * (2 ** attempt)
                    log.warning("Qwen rate limited, retrying in %.1fs (attempt %d/%d)", delay, attempt + 1, _MAX_RETRIES)
                    time.sleep(delay)
                    continue
            except APIStatusError as exc:
                if exc.status_code >= 500 and attempt < _MAX_RETRIES - 1:
                    last_exc = exc
                    delay = _RETRY_BASE_DELAY * (2 ** attempt)
                    log.warning("Qwen server error %d, retrying in %.1fs", exc.status_code, delay)
                    time.sleep(delay)
                    continue
                raise QwenError(f"Qwen API request failed ({exc.status_code}): {exc}")
            except Exception as exc:
                raise QwenError(f"Qwen API request failed: {exc}")

        raise QwenError(f"Qwen API request failed after {_MAX_RETRIES} retries: {last_exc}")

    # -------------------------------------------------------------------------
    # High-level request methods
    # -------------------------------------------------------------------------

    def json_request(
        self,
        system: str,
        user: str,
        schema: dict,
        tier: str = "quality",
        max_tokens: int = 4096,
    ) -> dict:
        """Send a request expecting structured JSON output.

        Uses response_format={"type": "json_object"} for guaranteed valid JSON.
        Validates the schema after parsing.
        """
        messages = [
            {"role": "system", "content": f"{system}\n\nReturn the result as JSON."},
            {"role": "user", "content": user},
        ]

        result = self._create_with_retry(
            model=self._get_model(tier),
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=max_tokens,
        )

        return self._parse_json(result["content"], schema)

    def text_request(
        self,
        system: str,
        user: str,
        tier: str = "quality",
        max_tokens: int = 1500,
    ) -> str:
        """Send a request expecting plain text output."""
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]

        result = self._create_with_retry(
            model=self._get_model(tier),
            messages=messages,
            max_tokens=max_tokens,
        )

        return result["content"]

    def conversation_request(
        self,
        system: str,
        messages: list[dict],
        response_format: dict | None = None,
        tier: str = "quality",
        max_tokens: int = 1024,
    ) -> dict | str:
        """Send a multi-turn conversation request.

        If response_format is provided, returns parsed dict.
        Otherwise returns plain text string.
        """
        full_messages = [{"role": "system", "content": system}] + messages

        result = self._create_with_retry(
            model=self._get_model(tier),
            messages=full_messages,
            response_format=response_format,
            max_tokens=max_tokens,
        )

        if response_format:
            return self._parse_json(result["content"])
        return result["content"]

    # -------------------------------------------------------------------------
    # JSON parsing with repair
    # -------------------------------------------------------------------------

    def _parse_json(self, raw: str, schema: dict | None = None) -> dict:
        """Parse JSON from model output, with repair fallback if needed."""
        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            log.warning("Model returned invalid JSON, attempting repair with fast model")
            result = self._repair_json(raw)

        # Basic type validation if schema provided
        if schema:
            self._validate_schema(result, schema)

        return result

    def _repair_json(self, raw: str) -> dict:
        """Use the fast model to repair malformed JSON."""
        repair_result = self._create_with_retry(
            model=self.model_fast,
            messages=[
                {"role": "system", "content": "Fix this to valid JSON. Return only the JSON, nothing else."},
                {"role": "user", "content": raw},
            ],
            response_format={"type": "json_object"},
            max_tokens=4096,
        )

        try:
            return json.loads(repair_result["content"])
        except json.JSONDecodeError:
            raise QwenError("AI returned malformed JSON that could not be repaired.")

    def _validate_schema(self, data: dict, schema: dict) -> None:
        """Basic validation that required keys exist."""
        required = schema.get("required", [])
        missing = [k for k in required if k not in data]
        if missing:
            log.warning("JSON missing required keys: %s", missing)


# -------------------------------------------------------------------------
# Singleton provider instance (initialized lazily)
# -------------------------------------------------------------------------
_provider: QwenProvider | None = None


def get_qwen_provider() -> QwenProvider:
    """Get or create the singleton Qwen provider from app settings."""
    global _provider
    if _provider is None:
        from app.core.config import get_settings
        settings = get_settings()
        _provider = QwenProvider(
            api_key=settings.dashscope_api_key,
            model_quality=settings.qwen_model_quality,
            model_fast=settings.qwen_model_fast,
            model_reasoning=settings.qwen_model_reasoning,
        )
    return _provider


def reset_qwen_provider():
    """Reset the singleton (useful for testing or config changes)."""
    global _provider
    _provider = None
