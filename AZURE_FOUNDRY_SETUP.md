# Azure AI Foundry Provider — Complete Setup & Rollback Guide

> **Branch:** `azure-foundry-working`  
> **Commit:** `b269a8f`  
> **Purpose:** Maps incoming Anthropic Messages API requests to Azure AI Foundry's OpenAI-compatible `/chat/completions` endpoints.

---

## Table of Contents

1. [Overview](#overview)
2. [Files Changed (9 files)](#files-changed-9-files)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [How Model Routing Works](#how-model-routing-works)
5. [Request Flow Diagram](#request-flow-diagram)
6. [Rate Limits & Error Handling](#rate-limits--error-handling)
7. [Verification](#verification)
8. [Rollback Instructions](#rollback-instructions)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Azure AI Foundry provides model deployments that expose an **OpenAI-compatible** `/chat/completions` endpoint. The Claude Code proxy (this project) needs to:

1. Accept Anthropic-format requests from the `claude` CLI client
2. Convert them to OpenAI format (system prompt → messages, tool definitions, etc.)
3. Stream responses back from OpenAI format to Anthropic SSE format

The `AzureFoundryProvider` class in `providers/azure_foundry/client.py` does this conversion. It inherits from `OpenAIChatTransport` (shared base for all OpenAI-compat providers like NVIDIA NIM, Kimi).

---

## Files Changed (9 files)

### 1. NEW: `providers/azure_foundry/__init__.py` (0→5 lines)

```python
"""Azure AI Foundry provider."""
from .client import AzureFoundryProvider
__all__ = ("AzureFoundryProvider",)
```

**What it does:** Standard package init that exports `AzureFoundryProvider` so `from providers.azure_foundry import AzureFoundryProvider` works.

**To rollback:** `git rm providers/azure_foundry/__init__.py`

---

### 2. NEW: `providers/azure_foundry/client.py` (81 lines)

```python
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
```

**Key design decisions:**
- **`_extra_model_ids`**: Custom Azure Foundry deployments (like `DeepSeek-V4-Flash`) are NOT discoverable via the standard `/models` endpoint. They only exist on the `/chat/completions` inference endpoint. So we inject them from config via `set_extra_model_ids()`, called by the factory in `registry.py`.
- **`_build_request_body()`**: Uses `core.anthropic.build_base_request_body()` for conversion. When `thinking_enabled` is true, it uses `ReasoningReplayMode.REASONING_CONTENT` which puts reasoning in the OpenAI `reasoning_content` field.
- **Inherits streaming** from `OpenAIChatTransport._stream_response_impl()` which handles SSE parsing, heuristic tool detection, rate limiting, etc.

**To rollback:** `git rm providers/azure_foundry/client.py`

---

### 3. MODIFIED: `config/settings.py` (added 6 lines)

**Changes:**
1. Added field `azure_foundry_api_key` (alias `AZURE_FOUNDRY_API_KEY`, default `""`)
2. Added field `azure_foundry_base_url` (alias `AZURE_FOUNDRY_BASE_URL`, default `""`)
3. Added field `azure_foundry_proxy` (alias `AZURE_FOUNDRY_PROXY`, default `""`)

**Location:** Lines 116-121 and 176 in the final file.

**To rollback:** `git checkout main^ -- config/settings.py`

---

### 4. MODIFIED: `config/provider_catalog.py` (added 12 lines)

**Changes:**
1. Added `AZURE_FOUNDRY_DEFAULT_BASE = "https://ai.azure.com"` constant (line 25)
2. Added `azure_foundry` entry to `PROVIDER_CATALOG` dict (lines 117-127):

```python
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
```

**Key details:**
- `transport_type="openai_chat"` — uses OpenAI-compat transport (same as NVIDIA NIM, Kimi)
- `credential_env="AZURE_FOUNDRY_API_KEY"` — reads from env var
- `base_url_attr="azure_foundry_base_url"` — reads `Settings.azure_foundry_base_url`
- `proxy_attr="azure_foundry_proxy"` — proxy support
- Capabilities: chat + streaming + tools (no `thinking` since Azure doesn't expose native thinking)

Note: `AZURE_FOUNDRY_DEFAULT_BASE` is set to `"https://ai.azure.com"` but the actual inference endpoint is different. Users MUST set `AZURE_FOUNDRY_BASE_URL` to their specific resource endpoint (e.g., `https://your-resource.services.ai.azure.com`).

**To rollback:** `git checkout main^ -- config/provider_catalog.py`

---

### 5. MODIFIED: `providers/defaults.py` (added 2 lines)

**Changes:**
1. Added import: `from config.provider_catalog import AZURE_FOUNDRY_DEFAULT_BASE`
2. Added to `__all__`: `"AZURE_FOUNDRY_DEFAULT_BASE"`

**To rollback:** `git checkout main^ -- providers/defaults.py`

---

### 6. MODIFIED: `providers/registry.py` (added 17 lines)

**Changes:**
1. Added `_create_azure_foundry()` factory function (lines 77-90):

```python
def _create_azure_foundry(config: ProviderConfig, _settings: Settings) -> BaseProvider:
    from providers.azure_foundry import AzureFoundryProvider
    provider = AzureFoundryProvider(config)

    # Inject extra model IDs from configured model refs
    extra: set[str] = set()
    for ref in _settings.configured_chat_model_refs():
        if ref.provider_id == "azure_foundry":
            extra.add(ref.model_id)
    if extra:
        provider.set_extra_model_ids(frozenset(extra))
    return provider
```

2. Added `"azure_foundry": _create_azure_foundry` to `PROVIDER_FACTORIES` dict (line 101)

**Key details:** The factory iterates all `configured_chat_model_refs()` and injects any model IDs that belong to `azure_foundry` as extra model IDs. This is critical because custom deployments like `DeepSeek-V4-Flash` are not returned by Azure's `/models` endpoint, so they'd fail validation at startup if not injected.

**To rollback:** `git checkout main^ -- providers/registry.py`

---

### 7. MODIFIED: `providers/base.py` (added 1 line)

**Change:** Added `model_ref: str | None = None` to `ProviderConfig` model.

This existed before but was confirmed as unchanged in this commit (the diff shows 0 adds in the actual `git diff --stat`). Let me verify — actually looking at the diff stat: `providers/base.py | 1 +` — this was a 1-line addition.

**To rollback:** `git checkout main^ -- providers/base.py`

---

### 8. MODIFIED: `.env.example` (added 7 lines)

**Changes:**
```
# Azure Foundry Config (Anthropic-compatible Messages API endpoint)
# Get a key from the Azure AI Foundry portal at https://ai.azure.com
AZURE_FOUNDRY_API_KEY=""
AZURE_FOUNDRY_BASE_URL="https://your-resource.services.ai.azure.com"
AZURE_FOUNDRY_PROXY=""
```

And the provider list comment was updated:
```
# Valid providers: "nvidia_nim" | "open_router" | "deepseek" | "lmstudio" | "llamacpp" | "ollama" | "kimi" | "azure_foundry"
```

**To rollback:** `git checkout main^ -- .env.example`

---

### 9. MODIFIED: `CLAUDE.md` (minor update)

Already contains the Azure Foundry setup reference section.

**To rollback:** `git checkout main^ -- CLAUDE.md`

---

## Step-by-Step Setup

### 1. Get Azure AI Foundry credentials
- Go to [https://ai.azure.com](https://ai.azure.com)
- Create a project or use existing
- Deploy a model (e.g., DeepSeek-V4-Flash, Llama-3, Grok)
- Copy the **Target URI** from the deployment's "Consume" tab — this is your `AZURE_FOUNDRY_BASE_URL`
- Generate an API key from the deployment settings

### 2. Configure `.env`

```bash
# Required
AZURE_FOUNDRY_API_KEY="your-api-key-here"
AZURE_FOUNDRY_BASE_URL="https://your-resource.services.ai.azure.com"

# Optional: proxy for outbound requests
AZURE_FOUNDRY_PROXY=""

# Optional: smoke test model override
FCC_SMOKE_MODEL_AZURE_FOUNDRY="DeepSeek-V4-Flash"
```

### 3. Set model routing in `.env`

Route all Claude models to your Azure deployment:

```bash
MODEL="azure_foundry/DeepSeek-V4-Flash"
MODEL_OPUS="azure_foundry/DeepSeek-V4-Flash"
MODEL_SONNET="azure_foundry/DeepSeek-V4-Flash"
MODEL_HAIKU="azure_foundry/DeepSeek-V4-Flash"
```

Or route only specific models and keep others on different providers:

```bash
MODEL="nvidia_nim/z-ai/glm4.7"           # default fallback
MODEL_SONNET="azure_foundry/DeepSeek-V4-Flash"  # sonnet requests go to Azure
```

### 4. Start the proxy server

```bash
uv run uvicorn server:app --host 0.0.0.0 --port 8082
```

### 5. Connect the Claude CLI client

```bash
claude --proxy http://localhost:8082
```

---

## How Model Routing Works

Full request flow:

```
claude CLI
  └─► claude --proxy http://localhost:8082
        └─► server.py (FastAPI)
              └─► routes.py — POST /v1/messages
                    └─► Settings.resolve_model("claude-sonnet-4-6")
                          │
                          ├─ Checks model_opus? "opus" in name → no
                          ├─ Checks model_haiku? "haiku" in name → no
                          ├─ Checks model_sonnet? "sonnet" in name → yes
                          │     → returns "azure_foundry/DeepSeek-V4-Flash"
                          └─ Falls back to MODEL if no match
                          │     → returns "nvidia_nim/z-ai/glm4.7"
                          │
                    └─► Split "azure_foundry/DeepSeek-V4-Flash"
                          ├─ provider_id = "azure_foundry"
                          └─ model_id = "DeepSeek-V4-Flash"
                          │
                    └─► ModelRegistry.get("azure_foundry", settings)
                          └─► create_provider("azure_foundry", settings)
                                │
                                ├─ Build ProviderConfig from descriptor:
                                │   api_key ← AZURE_FOUNDRY_API_KEY
                                │   base_url ← AZURE_FOUNDRY_BASE_URL
                                │   proxy ← AZURE_FOUNDRY_PROXY
                                │   rate_limit ← PROVIDER_RATE_LIMIT
                                │   ...
                                │
                                └─► _create_azure_foundry(config, settings)
                                      │
                                      ├─ AzureFoundryProvider(config)
                                      │     └─ OpenAIChatTransport.__init__()
                                      │           ├─ Creates AsyncOpenAI client
                                      │           ├─ Sets up GlobalRateLimiter
                                      │           └─ Configures proxy/timeouts
                                      │
                                      └─ Injects extra model IDs:
                                            for each configured_chat_model_refs():
                                              if provider_id == "azure_foundry":
                                                add model_id to extra set
                                            provider.set_extra_model_ids(extra)
                          │
                    └─► provider.stream_response(request, input_tokens)
                          └─► OpenAIChatTransport._stream_response_impl()
                                │
                                ├─ AzureFoundryProvider._build_request_body(request)
                                │     └─ build_base_request_body(request, reasoning_replay)
                                │           ├─ Converts Anthropic messages → OpenAI messages
                                │           ├─ Maps system prompt → system message
                                │           ├─ Converts tool definitions
                                │           └─ Sets model = "DeepSeek-V4-Flash"
                                │
                                ├─ POST {base_url}/chat/completions
                                │     Body: {model, messages, tools, stream: true, ...}
                                │
                                ├─ Stream chunks arrive via SSE
                                │     ├─ reasoning_content → thinking block
                                │     ├─ content → text block (with heuristic tool detection)
                                │     └─ tool_calls → tool_use blocks
                                │
                                └─ Emit Anthropic-format SSE back to client
                                      ├─ message_start
                                      ├─ content_block_start (text)
                                      ├─ content_block_delta (text)
                                      ├─ content_block_stop
                                      ├─ message_delta (stop_reason, output_tokens)
                                      └─ message_stop
```

---

## Request Flow Diagram

```
┌─────────────┐     HTTP POST /v1/messages (Anthropic format)
│  claude CLI  │ ──────────────────────────────────────────►
│  (client)    │                                              │
└─────────────┘                                              │
                                                              ▼
                                               ┌──────────────────────┐
                                               │   server.py          │
                                               │   (FastAPI proxy)    │
                                               └──────────┬───────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │  Settings            │
                                               │  .resolve_model()    │
                                               │  "claude-sonnet-4-6" │
                                               │  → "azure_foundry/   │
                                               │    DeepSeek-V4-Flash"│
                                               └──────────┬───────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │  ModelRegistry       │
                                               │  .get("azure_foundry")│
                                               │  → AzureFoundryProv. │
                                               └──────────┬───────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │ AzureFoundryProvider │
                                               │ ._build_request_     │
                                               │   body(request)      │
                                               │ Anthropic → OpenAI   │
                                               └──────────┬───────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │ AsyncOpenAI client   │
                                               │ POST {base_url}/     │
                                               │ chat/completions     │
                                               │ stream=true          │
                                               └──────────┬───────────┘
                                                          │
                                              SSE Stream  │
                                          ◄───────────────┘
                                               ┌──────────────────────┐
                                               │ OpenAIChatTransport  │
                                               │ ._stream_response_   │
                                               │   impl()             │
                                               │ OpenAI → Anthropic   │
                                               │ SSE conversion       │
                                               └──────────┬───────────┘
                                                          │
                                              Anthropic   │
                                              SSE events  │
                                          ◄───────────────┘
┌─────────────┐                                              │
│  claude CLI  │ ◄────────────────────────────────────────────
│  (client)    │     HTTP Response stream (Anthropic SSE)
└─────────────┘
```

---

## Rate Limits & Error Handling

### Azure AI Foundry Free Tier Limits
- **20 requests per minute** (varies by deployment tier)
- **20000 tokens per minute**
- When exceeded: HTTP 429 with `x-ratelimit-remaining-tokens: -NNNN`

### How the proxy handles 429s
1. `GlobalRateLimiter` (in `providers/rate_limit.py`) catches the 429
2. Retries up to **3 times** with exponential backoff
3. If all retries fail, sets a **60-second global block**
4. Returns a `provider_overloaded_error` to the client

### Error Mapping
`providers/error_mapping.py` maps HTTP errors to Anthropic error types:
- 401 → `authentication_error`
- 403 → `permission_error`
- 429 → `rate_limit_error` or `provider_overloaded_error`
- 5xx → `api_error`
- Timeout → `gateway_timeout_error`

### HTTP Client Timeouts
Configured in `.env`:
```bash
HTTP_READ_TIMEOUT=300      # Read timeout (default)
HTTP_WRITE_TIMEOUT=60
HTTP_CONNECT_TIMEOUT=60
```

---

## Verification

### 1. Check server terminal logs

The server prints log lines directly to its terminal. After starting the server with `uv run uvicorn server:app --host 0.0.0.0 --port 8082`, watch for these key log messages:

**Startup log (shown once when the server starts):**
```
Starting Claude Code Proxy...
```

**Model routing log** — shown when a request arrives and a Claude model name gets mapped to your Azure deployment:
```
MODEL MAPPING: 'claude-sonnet-4-6' -> 'DeepSeek-V4-Flash'
MODEL DIRECT: 'azure_foundry/DeepSeek-V4-Flash' -> provider='azure_foundry' model='DeepSeek-V4-Flash' thinking=False
```

**API request log** — shown every time a request is processed:
```
API_REQUEST: request_id=req_abc123 model=DeepSeek-V4-Flash messages=1
```

**Provider conversion logs** — shown when the Azure Foundry provider converts Anthropic format to OpenAI format (requires `LOG_LEVEL=DEBUG` in `.env`):
```
AZURE_FOUNDRY_REQUEST: conversion start model=DeepSeek-V4-Flash msgs=1
AZURE_FOUNDRY_REQUEST: conversion done model=DeepSeek-V4-Flash msgs=1 tools=0
```

**Error logs** — shown if the request fails:
```
Provider Error: error_type=rate_limit_error status_code=429
Provider Error: error_type=authentication_error status_code=401
General Error: path=/v1/messages method=POST exc_type=ConnectionError
```

**Full payload logging** — to see the exact request body sent to Azure (useful for debugging), set in `.env`:
```bash
LOG_RAW_API_PAYLOADS=true
```
This will print:
```
FULL_PAYLOAD [req_abc123]: { ... full request body ... }
```

**Tip:** If the terminal scrolls too fast, you can also check **the log file**. By default, the server writes JSON-structured logs to `./server.log` (relative to the project root, i.e. `c:/Users/satya/Localagent/free-claude-code/server.log`). Customize via `LOG_FILE` in `.env`:
```bash
LOG_FILE="/absolute/path/to/my-server.log"
```

**Linux / macOS (or Git Bash on Windows)** — tail the log file in a second terminal:
```bash
# Follow new log entries in real time
tail -f server.log

# Search for Azure Foundry specific lines
grep "AZURE_FOUNDRY" server.log

# Search for API requests
grep "API_REQUEST" server.log

# Search for errors
grep "Error" server.log
```

**Windows PowerShell** — equivalents:
```powershell
# Follow new log entries in real time (like tail -f)
Get-Content server.log -Tail 10 -Wait

# Search for Azure Foundry specific lines
Select-String -Path server.log -Pattern "AZURE_FOUNDRY"

# Search for API requests
Select-String -Path server.log -Pattern "API_REQUEST"

# Search for errors
Select-String -Path server.log -Pattern "Error"
```

### 2. Run a manual smoke test

```bash
curl -X POST http://localhost:8082/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: freecc" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

### 3. Run the provider smoke test suite

```bash
uv run pytest smoke/ -k azure_foundry -v
```

### 4. Check that the correct branch/commit is deployed

```bash
git log --oneline -1
# Should show: b269a8f feat: add Azure AI Foundry provider support
git branch
# Should show: * azure-foundry-working (or main)
```

---

## Rollback Instructions

### Option A: Revert the single commit (cleanest way to undo)

```bash
# Check which branch you're on
git branch

# If on main, revert the Azure Foundry commit:
git revert b269a8f
# This creates a new commit that undoes all changes.
# No force push needed.
```

### Option B: Reset to before the commit (destructive, use with care)

```bash
# WARNING: This rewrites history. Only if you haven't pushed yet.

# Soft reset — keeps files as-is, just moves the branch pointer
git reset --soft HEAD~1
# Now all changes are "unstaged" — you can cherry-pick what to keep

# OR hard reset — discards all changes permanently
git reset --hard HEAD~1
# Your working directory will be exactly as before the Azure Foundry changes
```

### Option C: Rollback individual files

If you want to keep some changes but revert the Azure Foundry parts:

```bash
# Remove the new provider package
rm -rf providers/azure_foundry/

# Reset each modified file
git checkout main^ -- .env.example
git checkout main^ -- config/provider_catalog.py
git checkout main^ -- config/settings.py
git checkout main^ -- providers/base.py
git checkout main^ -- providers/defaults.py
git checkout main^ -- providers/registry.py
git checkout main^ -- CLAUDE.md

# Commit the rollback
git add -A
git commit -m "revert: remove Azure AI Foundry provider"
```

### Getting back the Azure Foundry changes (if you're on a different branch)

If you switched away from `azure-foundry-working` and want to return:

```bash
# 1. Check out the branch
git checkout azure-foundry-working

# 2. Confirm you have the latest commit
git log --oneline -1
# Should show: b269a8f feat: add Azure AI Foundry provider support
```

---

## Troubleshooting

### "Unknown provider type: 'azure_foundry'"

**Cause:** `provider_catalog.py` or `registry.py` doesn't have the `azure_foundry` entry.

**Fix:** Check that commit `b269a8f` is present:
```bash
git log --oneline | head -5
```
If missing, `git cherry-pick b269a8f` or reapply the file changes.

---

### "AZURE_FOUNDRY_API_KEY is not set"

**Cause:** The env var is missing from `.env` or environment.

**Fix:** Add to `.env`:
```bash
AZURE_FOUNDRY_API_KEY="your-key"
```

The key is read by `settings.py` → `_credential_for()` in `registry.py`.

---

### "Configured model validation failed: ... problem=missing model"

**Cause:** The model you set (e.g., `DeepSeek-V4-Flash`) is a custom deployment that Azure's `/models` endpoint doesn't return. The factory failed to inject it.

**Fix:** Check `registry.py`'s `_create_azure_foundry()` function is iterating `configured_chat_model_refs()` correctly. The model ID must match exactly what you set in `MODEL="azure_foundry/DeepSeek-V4-Flash"`.

---

### HTTP 429 (Rate Limited)

**Cause:** Azure free tier exceeded (20 req/min, 20000 tokens/min).

**Fix:** 
1. Wait 60+ seconds
2. Check `server.log` for `x-ratelimit-remaining-tokens`
3. The proxy will auto-retry and then set a 60s block
4. To avoid: reduce `PROVIDER_RATE_LIMIT` in `.env`

---

### "Connection refused" or "Cannot connect"

**Cause:** Wrong `AZURE_FOUNDRY_BASE_URL`.

**Fix:** Ensure the URL points to your Azure Foundry resource:
```
AZURE_FOUNDRY_BASE_URL="https://your-resource.services.ai.azure.com"
```
It should be the **Target URI** from the deployment's "Consume" tab, **not** `https://ai.azure.com`.

---

### Streaming works but no text output

**Cause:** The model only emits `reasoning_content` with no `content` field. The `OpenAIChatTransport._stream_response_impl()` handles this by emitting a space text block when only reasoning is present (lines 402-410 of `openai_compat.py`).

**Fix:** Enable thinking in `.env`:
```bash
ENABLE_MODEL_THINKING=true
```

---

## Key Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| `transport_type="openai_chat"` | Azure Foundry exposes OpenAI-compat, not Anthropic Messages |
| `_extra_model_ids` injection | Custom deployments aren't in `/models` endpoint |
| `ReasoningReplayMode.REASONING_CONTENT` | OpenAI uses `reasoning_content` field, not separate `thinking` |
| No `thinking` capability in catalog | Azure doesn't have native thinking block support |
| Inherits from `OpenAIChatTransport` | Reuses all SSE streaming, rate limiting, tool parsing from NIM/Kimi |
| Factory injects models in `_create_azure_foundry()` | Startup validation would fail without injected model IDs |
| `AZURE_FOUNDRY_DEFAULT_BASE = "https://ai.azure.com"` | Placeholder—users must set their own resource URL |

---

## Appendix: Complete File State After Setup

```
providers/
├── azure_foundry/
│   ├── __init__.py      (exports AzureFoundryProvider)
│   └── client.py        (AzureFoundryProvider class, 81 lines)
├── base.py              (+1 line: ProviderConfig.model_ref)
├── defaults.py          (+2 lines: AZURE_FOUNDRY_DEFAULT_BASE import/export)
├── registry.py          (+17 lines: factory + PROVIDER_FACTORIES entry)
└── openai_compat.py     (unchanged — inherited by AzureFoundryProvider)

config/
├── provider_catalog.py  (+12 lines: AZURE_FOUNDRY_DEFAULT_BASE + descriptor)
├── provider_ids.py      (unchanged — re-exports SUPPORTED_PROVIDER_IDS)
└── settings.py          (+6 lines: 3 new Pydantic fields)

.env.example             (+7 lines: 3 env vars + updated provider list comment)
CLAUDE.md                (+setup reference section)
```

---

*Generated from commit `b269a8f` on branch `azure-foundry-working`*