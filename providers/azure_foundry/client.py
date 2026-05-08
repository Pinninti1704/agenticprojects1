"""Azure AI Foundry provider implementation.

Azure AI Foundry model deployments expose an OpenAI-compatible ``/chat/completions``
endpoint. This adapter converts Anthropic Messages-API requests to OpenAI format
and streams them back in Anthropic SSE format.
"""

from typing import Any

from loguru import logger

from core.anthropic import ReasoningReplayMode, build_base_request_body
from core.anthropic.conversion import OpenAIConversionError
from providers.base import ProviderConfig
from providers.defaults import AZURE_FOUNDRY_DEFAULT_BASE
from providers.exceptions import InvalidRequestError
from providers.openai_compat import OpenAIChatTransport


class AzureFoundryProvider(OpenAIChatTransport):
    """Azure AI Foundry provider using OpenAI-compatible chat completions.

    Azure Foundry has two model spaces:
    - Foundation models (e.g. ``grok-3-mini``, ``Meta-Llama-3-70B``) returned
      by the ``/models`` endpoint.
    - Custom deployments (e.g. ``DeepSeek-V4-Flash``) that exist only on the
      inference endpoint.

    We tag known custom deployments from the config so that startup model
    validation doesn't reject them.
    """

    def __init__(self, config: ProviderConfig):
        super().__init__(
            config,
            provider_name="AZURE_FOUNDRY",
            base_url=config.base_url or AZURE_FOUNDRY_DEFAULT_BASE,
            api_key=config.api_key,
        )
        self._extra_model_ids: frozenset[str] = frozenset()

    def set_extra_model_ids(self, model_ids: frozenset[str]) -> None:
        """Inject deployment model names not discoverable via /models."""
        self._extra_model_ids = model_ids

    async def list_model_ids(self) -> frozenset[str]:
        """Return foundation models plus any extra custom deployment IDs."""
        base_ids = await super().list_model_ids()
        return frozenset(base_ids | self._extra_model_ids)

    def _build_request_body(
        self, request: Any, thinking_enabled: bool | None = None
    ) -> dict:
        """Build OpenAI-format request body from Anthropic request."""
        logger.debug(
            "AZURE_FOUNDRY_REQUEST: conversion start model={} msgs={}",
            getattr(request, "model", "?"),
            len(getattr(request, "messages", [])),
        )

        try:
            body = build_base_request_body(
                request,
                reasoning_replay=ReasoningReplayMode.REASONING_CONTENT
                if thinking_enabled
                else ReasoningReplayMode.DISABLED,
            )
        except OpenAIConversionError as exc:
            raise InvalidRequestError(str(exc)) from exc

        model = getattr(request, "model", None)
        if model:
            body["model"] = model

        logger.debug(
            "AZURE_FOUNDRY_REQUEST: conversion done model={} msgs={} tools={}",
            body.get("model"),
            len(body.get("messages", [])),
            len(body.get("tools", [])),
        )
        return body
