# CompileFuture Free Claude Code Setup

## Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Claude Code CLI │────▶│  FastAPI Proxy       │────▶│  NVIDIA NIM      │
│  (claude --proxy)│     │  (localhost:8082)     │     │  (free tier)     │
└─────────────────┘     │                      │     └──────────────────┘
                        │  Model Router:        │     ┌──────────────────┐
                        │  - Opus → NVIDIA NIM  │────▶│  Azure Foundry   │
                        │  - Sonnet→Azure AI    │     │  (GitHub Models) │
                        │  - Haiku → Azure AI   │     └──────────────────┘
                        │  - Fallback→Azure AI  │
                        └─────────────────────┘
```

## Model Routing (`.env`)

| Tier     | Provider         | Model                              |
|----------|------------------|------------------------------------|
| Opus     | NVIDIA NIM       | `meta/llama-3.3-70b-instruct`      |
| Sonnet   | Azure Foundry    | `DeepSeek-V4-Flash`                |
| Haiku    | Azure Foundry    | `DeepSeek-V4-Flash`                |
| Fallback | Azure Foundry    | `DeepSeek-V4-Flash`                |

## NVIDIA NIM Free Models (tested 2026-05-08)

### Tools (confirmed tool_calls — full Claude Code capability)

| Model | Speed |
|-------|-------|
| `meta/llama-3.2-11b-vision-instruct` | 607ms |
| `meta/llama-4-maverick-17b-128e-instruct` | 774ms |
| `moonshotai/kimi-k2-instruct` | 781ms |
| `meta/llama-3.3-70b-instruct` | 800ms |
| `qwen/qwen3-next-80b-a3b-instruct` | 894ms |
| `qwen/qwen3.5-122b-a10b` | 1006ms |
| `qwen/qwen3-next-80b-a3b-thinking` | 1439ms |
| `meta/llama-3.1-70b-instruct` | 1620ms |
| `stepfun-ai/step-3.5-flash` | 4784ms |
| `moonshotai/kimi-k2.6` | 9546ms |

### Text (basic chat only, no tool calls)

| Model | Speed |
|-------|-------|
| `meta/llama-3.1-8b-instruct` | 958ms |
| `upstage/solar-10.7b-instruct` | 1696ms |

### Basic (chat responded, tools untested)

| Model | Speed |
|-------|-------|
| `google/gemma-2-2b-it` | 463ms |
| `meta/llama-3.2-1b-instruct` | 507ms |
| `sarvamai/sarvam-m` | 562ms |

## Key Files

| File | Purpose |
|------|---------|
| `.env` | Model routing, API keys, rate limits |
| `config/provider_catalog.py` | `NVIDIA_NIM_FREE_MODELS` + tier sets |
| `api/routes.py` | Model list endpoint (`/v1/models`) + filtering |
| `api/model_router.py` | Maps Claude model names → provider/model |
| `config/settings.py` | `resolve_model()` tier mapping |
| `C:\Users\satya\.claude\settings.json` | Claude Code env vars + model picker config |

## How the Model Picker Works

1. `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1` in `~/.claude/settings.json` enables `/model`
2. Claude Code calls `GET /v1/models` on the proxy
3. `_build_models_list_response()` in `api/routes.py` assembles the list:
   - Configured models from `.env` (`MODEL_OPUS`, `MODEL_SONNET`, etc.)
   - Discovered models from provider `/v1/models` endpoints
   - Hardcoded Claude models (`claude-opus-4`, etc.)
4. NVIDIA NIM discovered models are filtered against `NVIDIA_NIM_FREE_MODELS`
5. Azure Foundry discovered models are hidden (only configured ones show)
6. Models tagged `[tools]`, `[text]`, or `[basic]` in Claude Code's picker

## Switching Models

1. Run `/model` in Claude Code to see available models
2. Select any model with `[tools]` tag for full capability
3. Or update `.env`: `MODEL_OPUS="nvidia_nim/<model-id>"`

## Periodic Model Check Schedule

Claude Code's built-in scheduler (session-only, auto-expires after 7 days):

```
/cron weekly "Check NVIDIA NIM free tier models and update config/provider_catalog.py"
```

To manually check models:
```powershell
# Test basic chat
curl -s "https://integrate.api.nvidia.com/v1/chat/completions" `
  -H "Authorization: Bearer $env:NVIDIA_NIM_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{"model":"meta/llama-3.3-70b-instruct","messages":[{"role":"user","content":"hi"}],"max_tokens":5}'
```

## Starting the Server

```powershell
uv run uvicorn server:app --host 0.0.0.0 --port 8082 --reload
```

## Connecting Claude Code

```powershell
claude --proxy http://localhost:8082
```