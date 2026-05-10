# Free Claude Code Proxy — Complete Setup & Reference

> **Primary branch:** `working-nim-setup` (NVIDIA NIM + Azure Foundry hybrid)  
> **Other branches:** `azure-foundry-working` (Azure-only), `docs/experiment-compilefuture-guide` (original experiment)  
> **Latest commit:** `661d773` — removed 7 unreliable NIM models

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Model Routing](#model-routing)
4. [NVIDIA NIM Model Catalog](#nvidia-nim-model-catalog)
5. [Key Files](#key-files)
6. [How Model Routing Works](#how-model-routing-works)
7. [Request Flow](#request-flow)
8. [Rate Limits & Error Handling](#rate-limits--error-handling)
9. [Troubleshooting](#troubleshooting)
10. [Server Logs & Monitoring](#server-logs--monitoring)
11. [Claude Code Model Picker](#claude-code-model-picker)
12. [Switching Models](#switching-models)
13. [Rollback Instructions](#rollback-instructions)

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────────┐     ┌──────────────────┐
│  Claude Code CLI │────▶│  FastAPI Proxy            │────▶│  NVIDIA NIM      │
│  (claude --proxy)│     │  (localhost:8082)          │     │  (free tier)     │
└─────────────────┘     │                           │     └──────────────────┘
                        │  Model Routing:            │     ┌──────────────────┐
                        │  - Opus    → NVIDIA NIM    │────▶│  Azure Foundry   │
                        │  - Sonnet  → Azure Foundry  │     │  (GitHub Models) │
                        │  - Haiku   → Azure Foundry  │     └──────────────────┘
                        │  - Fallback→ Azure Foundry  │
                        └──────────────────────────┘
```

---

## Quick Start

### 1. Prerequisites

- Python 3.14 (`uv python install 3.14`)
- Claude Code CLI installed
- API keys in `.env`

### 2. Start the Server

```powershell
uv run uvicorn server:app --host 0.0.0.0 --port 8082
```

### 3. Connect Claude Code

```powershell
$env:CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY="1"; claude --proxy http://localhost:8082
```

Or via VS Code `settings.json`:
```json
"claudeCode.environmentVariables": [
  { "name": "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY", "value": "1" }
]
```

---

## Model Routing

Current `.env` configuration:

| Tier     | Provider        | Model                              |
|----------|-----------------|------------------------------------|
| Opus     | NVIDIA NIM      | `meta/llama-3.3-70b-instruct`      |
| Sonnet   | Azure Foundry   | `DeepSeek-V4-Flash`                |
| Haiku    | Azure Foundry   | `DeepSeek-V4-Flash`                |
| Fallback | Azure Foundry   | `DeepSeek-V4-Flash`                |

```env
MODEL_OPUS="nvidia_nim/meta/llama-3.3-70b-instruct"
MODEL_SONNET="azure_foundry/DeepSeek-V4-Flash"
MODEL_HAIKU="azure_foundry/DeepSeek-V4-Flash"
MODEL="azure_foundry/DeepSeek-V4-Flash"
```

### Alternative providers

Swap `nvidia_nim/` with any of these prefixes:
- `open_router/` — OpenRouter (Anthropic-native transport)
- `deepseek/` — DeepSeek (Anthropic-native transport)
- `kimi/` — Moonshot Kimi (OpenAI-compat transport)
- `lmstudio/` — Local LM Studio (Anthropic-native, no key needed)
- `llamacpp/` — Local llama.cpp (Anthropic-native, no key needed)
- `ollama/` — Local Ollama (Anthropic-native, no key needed)

---

## NVIDIA NIM Model Catalog

All models below are confirmed working (tested 2026-05-08) and tagged as `[tools]` — full Claude Code capability with tool calls. Sorted by response speed.

### Full Model List (23 models)

| Model | Speed | Type |
|-------|-------|------|
| `meta/llama-4-maverick-17b-128e-instruct` | **455ms** | Tools |
| `qwen/qwen3-next-80b-a3b-thinking` | **465ms** | Tools (thinking) |
| `meta/llama-3.2-1b-instruct` | **507ms** | Tools |
| `upstage/solar-10.7b-instruct` | **514ms** | Tools |
| `stepfun-ai/step-3.5-flash` | **619ms** | Tools |
| `meta/llama-3.2-11b-vision-instruct` | **622ms** | Tools (vision) |
| `qwen/qwen3-next-80b-a3b-instruct` | **641ms** | Tools |
| `meta/llama-3.1-70b-instruct` | **696ms** | Tools |
| `moonshotai/kimi-k2.6` | **701ms** | Tools |
| `minimaxai/minimax-m2.5` | **722ms** | Tools |
| `meta/llama-3.2-3b-instruct` | **749ms** | Tools |
| `meta/llama-3.3-70b-instruct` | **869ms** | Tools (current Opus) |
| `moonshotai/kimi-k2-instruct` | **895ms** | Tools |
| `mistralai/ministral-14b-instruct-2512` | **1030ms** | Tools |
| `mistralai/devstral-2-123b-instruct-2512` | **1040ms** | Tools |
| `qwen/qwen3.5-122b-a10b` | **1107ms** | Tools (122B) |
| `mistralai/mistral-nemotron` | **1154ms** | Tools |
| `mistralai/mixtral-8x22b-instruct-v0.1` | **1190ms** | Tools |
| `mistralai/mistral-small-4-119b-2603` | **1477ms** | Tools |
| `meta/llama-3.1-8b-instruct` | **2386ms** | Tools |
| `mistralai/mistral-large-3-675b-instruct-2512` | **4130ms** | Tools (largest) |
| `meta/llama-3.2-90b-vision-instruct` | **696ms** | Tools (vision) |
| `mistralai/mixtral-8x7b-instruct-v0.1` | **598ms** | Tools |

### Speed Tiers

| Tier | Range | Best Picks |
|------|-------|------------|
| Fastest | < 600ms | `llama-4-maverick`, `qwen-thinking`, `solar`, `step-f5` |
| Fast | 600-900ms | `qwen-80b`, `llama-70b`, `kimi-k2.6`, `minimax`, `llama-3.3-70b` |
| Medium | 900ms-2s | `ministral`, `devstral`, `mixtral`, `mistral-small` |
| Slow | > 2s | `mistral-large-675b` (4.1s) |

### Recommendations by Use Case

| Use Case | Recommended Model | Speed | Why |
|----------|------------------|-------|-----|
| Best all-around | `meta/llama-3.3-70b-instruct` | 869ms | Strong quality at good speed |
| Fastest coding | `meta/llama-4-maverick-17b-128e-instruct` | 455ms | Fastest + excellent tool support |
| Reasoning tasks | `qwen/qwen3-next-80b-a3b-thinking` | 465ms | Built-in thinking, very fast |
| Large context | `qwen/qwen3.5-122b-a10b` | 1107ms | Biggest context window |
| Vision tasks | `meta/llama-3.2-90b-vision-instruct` | 696ms | Vision-capable |
| Max quality | `mistralai/mistral-large-3-675b-instruct-2512` | 4130ms | Largest model, slowest |

### Removed Models

These were tested and removed because they don't work with the proxy:

| Model | Reason Removed |
|-------|---------------|
| `google/gemma-3-4b-it` | 422 on tool schemas |
| `google/gemma-3-12b-it` | 422 on tool schemas |
| `sarvamai/sarvam-m` | 400 on tool schemas |
| `stockmark/stockmark-10b` | 400 errors |
| `phi-4-mini` | Intermittent timeouts |
| `qwen/qwen2.5-coder-32b-instruct` | Intermittent timeouts |
| `qwen/qwen3-coder-32b-instruct` | Intermittent timeouts |
| `mistralai/mistral-medium-3.5` | Intermittent timeouts |
| All DeepSeek models on NIM (v4-flash, v4-pro, coder-6.7b) | Timeout or 404 |

---

## Key Files

| File | Purpose |
|------|---------|
| `.env` | API keys, model routing, rate limits, all config |
| `config/provider_catalog.py` | `NVIDIA_NIM_FREE_MODELS`, `NVIDIA_NIM_MODEL_SPEEDS`, provider descriptors |
| `config/settings.py` | `Settings.resolve_model()` tier mapping, env var Pydantic fields |
| `api/routes.py` | `/v1/models` model list endpoint + `_build_models_list_response()` filtering |
| `api/model_router.py` | Maps Claude model names → provider/model |
| `providers/nvidia_nim/client.py` | `NvidiaNimProvider` — OpenAI-compat transport with retry handlers |
| `providers/nvidia_nim/request.py` | Request builder, schema sanitizer, Mistral tool-merge retry logic |
| `providers/azure_foundry/client.py` | `AzureFoundryProvider` — Azure Foundry OpenAI-compat transport |
| `providers/registry.py` | `ModelRegistry` — factory dispatch for all provider types |
| `providers/openai_compat.py` | `OpenAIChatTransport` — shared SSE streaming, tool detection, rate limiting |
| `providers/base.py` | `ProviderConfig`, `BaseProvider` abstract class |
| `providers/defaults.py` | Default base URLs for all providers |
| `providers/rate_limit.py` | `GlobalRateLimiter` — retry + backoff + global block |
| `providers/error_mapping.py` | HTTP error → Anthropic error type mapping |
| `C:\Users\satya\.claude\settings.json` | Claude Code env vars + model picker config |

---

## How Model Routing Works

```
Incoming request: "claude-sonnet-4-6"
  │
  ▼
Settings.resolve_model("claude-sonnet-4-6")   [config/settings.py:453]
  │
  ├─ Checks model_opus  → "opus" in name? → no
  ├─ Checks model_sonnet→ "sonnet" in name? → yes
  │     → returns "azure_foundry/DeepSeek-V4-Flash"
  ├─ Checks model_haiku → "haiku" in name? → no
  └─ Falls back to MODEL → "azure_foundry/DeepSeek-V4-Flash"
  │
  ▼
Split "azure_foundry/DeepSeek-V4-Flash"
  ├─ provider_id = "azure_foundry"
  └─ model_id = "DeepSeek-V4-Flash"
  │
  ▼
ModelRegistry.get("azure_foundry", settings)   [providers/registry.py]
  │
  ├─ Looks up PROVIDER_FACTORIES["azure_foundry"]
  ├─ Builds ProviderConfig from catalog descriptor
  │   (api_key, base_url, proxy, rate_limit, ...)
  └─ Calls _create_azure_foundry(config, settings)
       → AzureFoundryProvider(config)
       → Injects extra model IDs from configured refs
  │
  ▼
provider.stream_response(request, input_tokens)
  → OpenAIChatTransport._stream_response_impl()
    → AzureFoundryProvider._build_request_body(request)
      → build_base_request_body(request, reasoning_replay)
        (Anthropic messages → OpenAI format)
    → POST {base_url}/chat/completions (stream=true)
    → Parse SSE chunks → Anthropic-format SSE events
    → Emit back to client
```

### Direct Provider Model (Gateway /model picker)

When a model is selected via `/model` in Claude Code, the model ID comes in as a
gateway-formatted ID (e.g. `anthropic/nvidia_nim/meta/llama-3.3-70b-instruct`).
`model_router.py` checks for the `anthropic/` prefix and extracts the provider
and model directly, bypassing `Settings.resolve_model()`.

---

## Request Flow

```
claude CLI                          FastAPI Proxy                      Provider API
    │                                    │                                │
    │  POST /v1/messages                  │                                │
    │  (Anthropic format)                 │                                │
    ├───────────────────────────────────► │                                │
    │                                    │                                │
    │                                    ├─ resolve_model("claude-...")  │
    │                                    ├─ get_provider("azure_foundry")│
    │                                    ├─ convert to OpenAI format      │
    │                                    │                                │
    │                                    │  POST /chat/completions         │
    │                                    ├──────────────────────────────► │
    │                                    │                                │
    │                                    │  ◄── SSE stream ─────────────┤
    │  ◄── SSE stream ──────────────┤    │                                │
    │  (Anthropic format)                │                                │
```

SSE events emitted to Claude Code:
1. `message_start` — initial message metadata
2. `content_block_start` (text) — first text block
3. `content_block_delta` (text) — streaming text deltas
4. `content_block_stop` — end of text block
5. `message_delta` — stop_reason, usage stats
6. `message_stop` — end of message

---

## Rate Limits & Error Handling

### Current configuration (`.env`)

```env
PROVIDER_RATE_LIMIT=40       # Max requests per window
PROVIDER_RATE_WINDOW=60      # Window in seconds
PROVIDER_MAX_CONCURRENCY=10  # Max concurrent requests
HTTP_READ_TIMEOUT=300        # Read timeout (seconds)
HTTP_WRITE_TIMEOUT=60
HTTP_CONNECT_TIMEOUT=60
```

### NVIDIA NIM free tier
- ~40 requests/minute
- Retry handler for known 400 errors:
  - `reasoning_budget` → retry without reasoning_budget
  - `chat_template` → retry without chat_template
  - `reasoning_content` → retry without reasoning_content
  - `unexpected role user after tool` (Mistral family) → retry with tool→user merged

### Azure AI Foundry free tier
- 20 requests/min, 20000 tokens/min
- HTTP 429 → `GlobalRateLimiter` retries 3× with exponential backoff → 60s global block

### HTTP error → Anthropic error mapping

| HTTP Status | Anthropic Error Type |
|-------------|---------------------|
| 401 | `authentication_error` |
| 403 | `permission_error` |
| 429 | `rate_limit_error` / `provider_overloaded_error` |
| 422 | `invalid_request_error` |
| 5xx | `api_error` |
| Timeout | `gateway_timeout_error` |

---

## Troubleshooting

### Server won't start

**Check:** Python version, dependencies
```powershell
uv run python --version  # Must be 3.14
uv sync  # Reinstall dependencies
```

### "Provider API request failed"

**Check server.log** for the request_id. Common causes:

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| 400 `reasoning_budget` | Model doesn't support reasoning budget | Handled by retry handler automatically |
| 400 `unexpected role user after tool` | Mistral family chat template | Handled by retry handler (merged tool→user) |
| 422 | Boolean schema values in tool defs | Handled by `_sanitize_nim_tool_schemas()` |
| Timeout | Model overloaded or rate limited | Wait 30s, try a different model |
| 429 | Rate limit exceeded | Wait 60s, reduce `PROVIDER_RATE_LIMIT` |

### Models not showing in /model list

1. Ensure `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1` is set when starting Claude Code
2. Check the server is running: `curl http://localhost:8082/v1/models -H "x-api-key: freecc"`
3. Verify the model is in `NVIDIA_NIM_FREE_MODELS` in `config/provider_catalog.py`
4. Restart the server after any catalog changes

### Azure Foundry: "Connection refused"

Ensure `AZURE_FOUNDRY_BASE_URL` points to your resource endpoint (from Azure portal's "Consume" tab), not `https://ai.azure.com`.

### Mistral models fail after a few turns

The "Unexpected role 'user' after role 'tool'" error is handled by the retry handler in `providers/nvidia_nim/client.py`. The handler merges tool results into the following user message. If it still fails, check `server.log` for the retry attempt — the retry is only attempted once per request.

---

## Server Logs & Monitoring

### Log file

All logs go to `server.log` in the project root. Each log line is JSON with:

```json
{"time": "...", "level": "INFO", "message": "...", "module": "...", "function": "...", "line": 123}
```

### Key log lines to watch

| Log Message | What It Means |
|-------------|---------------|
| `MODEL MAPPING: 'claude-sonnet-4-6' -> 'DeepSeek-V4-Flash'` | Model routing resolved |
| `API_REQUEST: request_id=... model=... messages=N` | Incoming request |
| `NIM_REQUEST: conversion start model=... msgs=N` | NVIDIA NIM body build start |
| `NIM_REQUEST: conversion done model=... msgs=N tools=N` | NVIDIA NIM body build complete |
| `NIM_STREAM: request_id=... model=... msgs=N tools=N` | Stream started |
| `NIM_STREAM: retrying without reasoning_budget after 400 error` | Retry handler active |
| `NIM_STREAM: retrying with merged tool->user messages after role ordering error` | Mistral retry active |
| `NIM_ERROR: request_id=... exc_type=... http_status=...` | Provider returned an error |
| `SSE_EVENT: event_type=message_stop` | Request completed successfully |
| `HTTP Response: ... 200 OK` | Upstream response |
| `HTTP Response: ... 429` | Rate limited |

### Monitoring commands

**Tail recent errors:**
```powershell
Select-String -Path server.log -Pattern "ERROR|error|429|timeout" | Select-Object -Last 20
```

**Check a specific request:**
```powershell
Select-String -Path server.log -Pattern "req_<request_id>" | ForEach-Object { $_.Line }
```

**Count requests by model:**
```powershell
Select-String -Path server.log -Pattern "MODEL MAPPING" | ForEach-Object { 
    if ($_ -match "-> '(.+?)'") { $matches[1] } 
} | Group-Object | Sort-Object Count -Descending
```

---

## Claude Code Model Picker

### Enabling the model picker

The `/model` command in Claude Code shows all available models. To enable it:

1. Set `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1` in Claude Code's env (not the proxy's `.env`)
2. Use the proxy: `claude --proxy http://localhost:8082`
3. Run `/model` inside Claude Code

### What appears in the picker

- **Configured models** from `.env` (`MODEL_OPUS`, `MODEL_SONNET`, `MODEL_HAIKU`, `MODEL`)
- **Discovered models** from provider `/v1/models` endpoints (filtered to free NIM models only)
- **Hardcoded Claude models** (`claude-opus-4`, `claude-sonnet-4`, etc. — these will route through your `.env` mapping)
- Models tagged with speed annotation like `[869ms]` in their display name

### NVIDIA NIM model filtering

- Proxy fetches NVIDIA NIM's `/v1/models` endpoint
- Only models in `NVIDIA_NIM_FREE_MODELS` (the `NVIDIA_NIM_TOOL_MODELS` set) are shown
- Models removed from the catalog (gemma, sarvamai, stockmark, failing models) don't appear
- Azure Foundry discovered models are hidden — only configured ones show

---

## Switching Models

### Via /model in Claude Code

1. Run `/model` to see all available models
2. Select any model with tool capabilities
3. Claude Code will use it for the current session

### Via .env (permanent)

Change the model ID in `.env`:
```env
MODEL_OPUS="nvidia_nim/meta/llama-4-maverick-17b-128e-instruct"
```

Then restart the server.

---

## Rollback Instructions

### To the main branch

```bash
git checkout main
```

### To a previous commit on this branch

```bash
# List recent commits
git log --oneline

# Soft reset (keep changes as unstaged)
git reset --soft <commit-hash>

# OR hard reset (discard all changes since)
git reset --hard <commit-hash>
```

### Revert individual files

```bash
git checkout main -- config/provider_catalog.py
git checkout main -- api/routes.py
git checkout main -- providers/nvidia_nim/request.py
git checkout main -- providers/nvidia_nim/client.py
git checkout main -- .env
```

### Remove the Azure Foundry files

```bash
rm -rf providers/azure_foundry/
git checkout main -- config/provider_catalog.py config/settings.py providers/registry.py
```

---

## Periodic Model Check

Claude Code's built-in scheduler runs a weekly check:
```
/cron weekly "Check NVIDIA NIM free tier models and update config/provider_catalog.py"
```

To manually test a model:
```powershell
curl -s "https://integrate.api.nvidia.com/v1/chat/completions" `
  -H "Authorization: Bearer $env:NVIDIA_NIM_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{"model":"meta/llama-3.3-70b-instruct","messages":[{"role":"user","content":"hi"}],"max_tools":5}'
```

---

## Git History (Working-NIM-Setup Branch)

```
661d773 fix: remove intermittently failing NIM models from catalog
aa6048b chore: add tic-tac-toe and old logs to gitignore
db692a3 fix: add Mistral NIM role-ordering retry + all 30 working models with speed tags
5445bc9 feat: add NVIDIA NIM free model filtering and setup reference
2f9dad9 docs: add CompileFuture free Claude Code setup guide (experiment branch)
69a7b23 docs: add comprehensive Azure Foundry setup and rollback guide
b269a8f feat: add Azure AI Foundry provider support
```

*Generated from branch `working-nim-setup`, commit `661d773`*