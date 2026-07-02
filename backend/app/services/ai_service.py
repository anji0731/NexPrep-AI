import json
import logging
from typing import Any
import httpx
from ollama import Client, ResponseError
from ..config import settings

logger = logging.getLogger(__name__)

AI_SERVICE_BUSY_MESSAGE = (
    "AI Engine Busy\n\n"
    "Our AI service is currently experiencing high demand.\n"
    "Please try again in 5–10 minutes."
)

TIMEOUT = httpx.Timeout(10.0, read=300.0)


class AIServiceError(Exception):
    """Raised when the AI service cannot complete the request safely."""

    def __init__(self, message: str = AI_SERVICE_BUSY_MESSAGE):
        super().__init__(message)
        self.message = message


def _normalize_text(raw_text: Any) -> str:
    if raw_text is None:
        return ""
    if not isinstance(raw_text, str):
        raw_text = str(raw_text)

    cleaned = raw_text.strip()
    cleaned = cleaned.replace("```json", "")
    cleaned = cleaned.replace("```", "")
    return cleaned.strip()


def _extract_json_text(raw_text: str) -> str:
    raw_text = _normalize_text(raw_text)
    start = raw_text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in text.")

    braces = 0
    in_string = False
    escape = False
    for index, char in enumerate(raw_text[start:], start):
        if char == "\\" and not escape:
            escape = True
            continue

        if char == '"' and not escape:
            in_string = not in_string

        if not in_string:
            if char == "{":
                braces += 1
            elif char == "}":
                braces -= 1
                if braces == 0:
                    return raw_text[start : index + 1]

        escape = False

    raise ValueError("Failed to extract balanced JSON object.")


def _parse_json_content(raw_text: Any) -> dict[str, Any]:
    if isinstance(raw_text, dict):
        return raw_text

    raw_text_str = _normalize_text(raw_text)
    if not raw_text_str:
        raise ValueError("Empty response returned from AI provider.")

    try:
        return json.loads(raw_text_str)
    except json.JSONDecodeError:
        extracted = _extract_json_text(raw_text_str)
        return json.loads(extracted)


def _call_ollama(prompt: str, system_instruction: str = "") -> dict[str, Any]:
    # Configure Ollama Client based on presence of settings.OLLAMA_API_KEY
    # If API key is present, connect to cloud API directly.
    # Otherwise, connect to local daemon which handles cloud offloading.
    host = settings.OLLAMA_HOST or ("https://ollama.com" if settings.OLLAMA_API_KEY else "http://localhost:11434")
    
    headers = {}
    if settings.OLLAMA_API_KEY:
        headers["Authorization"] = f"Bearer {settings.OLLAMA_API_KEY}"
        
    client = Client(host=host, headers=headers, timeout=300.0)
    model_name = "gemma4:31b-cloud"

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    try:
        logger.info("Calling Ollama client. host=%s, model=%s", host, model_name)
        # We request format="json" to enforce JSON output structure from Ollama
        response = client.chat(
            model=model_name,
            messages=messages,
            format="json",
            stream=False
        )
        
        # Extract the content from response
        content = response.get("message", {}).get("content", "")
        if not content:
            raise ValueError("Ollama returned an empty response content.")
            
        return _parse_json_content(content)
        
    except ResponseError as e:
        logger.error("Ollama ResponseError: %s (status code: %s)", e.error, e.status_code, exc_info=e)
        raise AIServiceError()
    except Exception as e:
        logger.error("Ollama client connection failed: %s", str(e), exc_info=e)
        raise AIServiceError()


class AIService:
    @staticmethod
    def generate_structured_json(prompt: str, system_instruction: str = "") -> dict[str, Any]:
        if not prompt or not isinstance(prompt, str):
            logger.error("Invalid prompt supplied to AIService.")
            raise AIServiceError()

        logger.info("Ollama Cloud structured generation start. Prompt size: %s", len(prompt))
        try:
            result = _call_ollama(prompt, system_instruction)
            logger.info("Ollama Cloud structured generation success.")
            return result
        except AIServiceError:
            raise
        except Exception as e:
            logger.error("AIService generate_structured_json failed: %s", str(e), exc_info=e)
            raise AIServiceError()
