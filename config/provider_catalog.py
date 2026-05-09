"""Neutral provider catalog: IDs, credentials, defaults, proxy and capability metadata.

Adapter factories live in :mod:`providers.registry`; this module stays free of
provider implementation imports (see contract tests).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

TransportType = Literal["openai_chat", "anthropic_messages"]

# Default upstream base URLs (also re-exported via :mod:`providers.defaults`)
NVIDIA_NIM_DEFAULT_BASE = "https://integrate.api.nvidia.com/v1"

# Tested 2026-05-09 — models that responded to /v1/chat/completions.
# Models tagged in the /model picker as:
#   [tools] = confirmed tool_calls  [text] = basic chat only  [basic] = untested with tools
# Mistral/Llama models with [tools] work via the NIM role-ordering retry path.
NVIDIA_NIM_TOOL_MODELS: frozenset[str] = frozenset({
    # Confirmed working with chat + tools (tested 2026-05-09)
    "meta/llama-4-maverick-17b-128e-instruct",
    "minimaxai/minimax-m2.5",
    "qwen/qwen3-next-80b-a3b-instruct",
    "qwen/qwen3-next-80b-a3b-thinking",
    "stepfun-ai/step-3.5-flash",
    "moonshotai/kimi-k2-instruct",
    "qwen/qwen3.5-122b-a10b",
    "meta/llama-3.3-70b-instruct",
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.2-1b-instruct",
    "meta/llama-3.2-3b-instruct",
    "meta/llama-3.2-11b-vision-instruct",
    "meta/llama-3.2-90b-vision-instruct",
    # Mistral (role-ordering retry handles the chat template error)
    "mistralai/mistral-small-4-119b-2603",
    "mistralai/mixtral-8x7b-instruct-v0.1",
    "mistralai/mixtral-8x22b-instruct-v0.1",
    "mistralai/mistral-nemotron",
    "mistralai/ministral-14b-instruct-2512",
    "mistralai/mistral-large-3-675b-instruct-2512",
})
# Response speeds from testing on 2026-05-09 (model -> ms).
NVIDIA_NIM_MODEL_SPEEDS: dict[str, str] = {
    "meta/llama-3.2-1b-instruct": "201ms",
    "qwen/qwen3-next-80b-a3b-thinking": "309ms",
    "mistralai/mixtral-8x22b-instruct-v0.1": "379ms",
    "meta/llama-3.3-70b-instruct": "406ms",
    "mistralai/ministral-14b-instruct-2512": "409ms",
    "mistralai/mistral-nemotron": "465ms",
    "upstage/solar-10.7b-instruct": "495ms",
    "meta/llama-3.2-11b-vision-instruct": "496ms",
    "stepfun-ai/step-3.5-flash": "496ms",
    "mistralai/mistral-small-4-119b-2603": "537ms",
    "qwen/qwen2.5-coder-32b-instruct": "671ms",
    "meta/llama-4-maverick-17b-128e-instruct": "704ms",
    "meta/llama-3.2-3b-instruct": "799ms",
    "meta/llama-3.2-90b-vision-instruct": "830ms",
    "qwen/qwen3.5-122b-a10b": "913ms",
    "mistralai/mixtral-8x7b-instruct-v0.1": "1440ms",
    "meta/llama-3.1-8b-instruct": "1592ms",
    "moonshotai/kimi-k2-instruct": "2302ms",
    "qwen/qwen3-next-80b-a3b-instruct": "3063ms",
    "minimaxai/minimax-m2.5": "16769ms",
    "mistralai/mistral-large-3-675b-instruct-2512": "24883ms",
}
NVIDIA_NIM_FREE_MODELS: frozenset[str] = frozenset(NVIDIA_NIM_TOOL_MODELS)

KIMI_DEFAULT_BASE = "https://api.moonshot.ai/v1"
# DeepSeek Anthropic-compatible Messages API (not OpenAI ``/v1`` chat completions).
DEEPSEEK_ANTHROPIC_DEFAULT_BASE = "https://api.deepseek.com/anthropic"
# Historical export name: DeepSeek upstream is the native Anthropic path above.
DEEPSEEK_DEFAULT_BASE = DEEPSEEK_ANTHROPIC_DEFAULT_BASE
OPENROUTER_DEFAULT_BASE = "https://openrouter.ai/api/v1"
LMSTUDIO_DEFAULT_BASE = "http://localhost:1234/v1"
LLAMACPP_DEFAULT_BASE = "http://localhost:8080/v1"
OLLAMA_DEFAULT_BASE = "http://localhost:11434"
AZURE_FOUNDRY_DEFAULT_BASE = "https://ai.azure.com"


@dataclass(frozen=True, slots=True)
class ProviderDescriptor:
    """Metadata for building :class:`~providers.base.ProviderConfig` and factory wiring."""

    provider_id: str
    transport_type: TransportType
    capabilities: tuple[str, ...]
    credential_env: str | None = None
    credential_url: str | None = None
    credential_attr: str | None = None
    static_credential: str | None = None
    default_base_url: str | None = None
    base_url_attr: str | None = None
    proxy_attr: str | None = None


PROVIDER_CATALOG: dict[str, ProviderDescriptor] = {
    "nvidia_nim": ProviderDescriptor(
        provider_id="nvidia_nim",
        transport_type="openai_chat",
        credential_env="NVIDIA_NIM_API_KEY",
        credential_url="https://build.nvidia.com/settings/api-keys",
        credential_attr="nvidia_nim_api_key",
        default_base_url=NVIDIA_NIM_DEFAULT_BASE,
        proxy_attr="nvidia_nim_proxy",
        capabilities=("chat", "streaming", "tools", "thinking", "rate_limit"),
    ),
    "open_router": ProviderDescriptor(
        provider_id="open_router",
        transport_type="anthropic_messages",
        credential_env="OPENROUTER_API_KEY",
        credential_url="https://openrouter.ai/keys",
        credential_attr="open_router_api_key",
        default_base_url=OPENROUTER_DEFAULT_BASE,
        proxy_attr="open_router_proxy",
        capabilities=("chat", "streaming", "tools", "thinking", "native_anthropic"),
    ),
    "deepseek": ProviderDescriptor(
        provider_id="deepseek",
        transport_type="anthropic_messages",
        credential_env="DEEPSEEK_API_KEY",
        credential_url="https://platform.deepseek.com/api_keys",
        credential_attr="deepseek_api_key",
        default_base_url=DEEPSEEK_ANTHROPIC_DEFAULT_BASE,
        capabilities=("chat", "streaming", "tools", "thinking", "native_anthropic"),
    ),
    "lmstudio": ProviderDescriptor(
        provider_id="lmstudio",
        transport_type="anthropic_messages",
        static_credential="lm-studio",
        default_base_url=LMSTUDIO_DEFAULT_BASE,
        base_url_attr="lm_studio_base_url",
        proxy_attr="lmstudio_proxy",
        capabilities=("chat", "streaming", "tools", "native_anthropic", "local"),
    ),
    "llamacpp": ProviderDescriptor(
        provider_id="llamacpp",
        transport_type="anthropic_messages",
        static_credential="llamacpp",
        default_base_url=LLAMACPP_DEFAULT_BASE,
        base_url_attr="llamacpp_base_url",
        proxy_attr="llamacpp_proxy",
        capabilities=("chat", "streaming", "tools", "native_anthropic", "local"),
    ),
    "ollama": ProviderDescriptor(
        provider_id="ollama",
        transport_type="anthropic_messages",
        static_credential="ollama",
        default_base_url=OLLAMA_DEFAULT_BASE,
        base_url_attr="ollama_base_url",
        capabilities=(
            "chat",
            "streaming",
            "tools",
            "thinking",
            "native_anthropic",
            "local",
        ),
    ),
    "kimi": ProviderDescriptor(
        provider_id="kimi",
        transport_type="openai_chat",
        credential_env="KIMI_API_KEY",
        credential_url="https://platform.moonshot.cn/console/api-keys",
        credential_attr="kimi_api_key",
        default_base_url=KIMI_DEFAULT_BASE,
        proxy_attr="kimi_proxy",
        capabilities=("chat", "streaming", "tools"),
    ),
    "azure_foundry": ProviderDescriptor(
        provider_id="azure_foundry",
        transport_type="openai_chat",
        credential_env="AZURE_FOUNDRY_API_KEY",
        credential_url="https://ai.azure.com",
        credential_attr="azure_foundry_api_key",
        base_url_attr="azure_foundry_base_url",
        default_base_url=AZURE_FOUNDRY_DEFAULT_BASE,
        proxy_attr="azure_foundry_proxy",
        capabilities=("chat", "streaming", "tools"),
    ),
}

# Order matches docs / historical error text; must match PROVIDER_CATALOG keys.
SUPPORTED_PROVIDER_IDS: tuple[str, ...] = tuple(PROVIDER_CATALOG.keys())

if len(set(SUPPORTED_PROVIDER_IDS)) != len(SUPPORTED_PROVIDER_IDS):
    raise AssertionError("Duplicate provider ids in PROVIDER_CATALOG key order")
