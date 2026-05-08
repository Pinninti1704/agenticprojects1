IMPORTANT: Ensure you've thoroughly reviewed the [AGENTS.md](AGENTS.md) file before beginning any work.

## Azure AI Foundry Provider Setup (reference: branch `azure-foundry-working`)

### Overview

The Azure AI Foundry provider maps incoming Anthropic Messages API requests to Azure's OpenAI-compatible endpoints. A custom `AzureFoundryProvider` client in `providers/azure_foundry/` handles message conversion and streaming.

### Key files
- `providers/azure_foundry/__init__.py` - exports `AzureFoundryProvider`
- `providers/azure_foundry/client.py` - `AzureFoundryProvider` class with `_build_request_body()` and streaming via OpenAI-compat `_stream_response_impl`
- `config/settings.py` - Pydantic model with `azure_foundry_api_key`, `azure_foundry_base_url`, `azure_foundry_proxy` fields (lines 116-121, 176)
- `config/provider_catalog.py` - maps provider id `"azure_foundry"` to `AzureFoundryProvider`
- `config/provider_ids.py` - `SUPPORTED_PROVIDER_IDS` includes `"azure_foundry"`
- `.env.example` - Azur Foundry env var documentation (lines 29-33)
- `providers/base.py` - `ProviderConfig` base class with shared streaming/error logic
- `providers/defaults.py` - `PROXY_CAPABLE_PROVIDERS` includes `"azure_foundry"`
- `providers/registry.py` - `ModelRegistry` mapping "azure_foundry" to `AzureFoundryProvider`

### Environment variables (`.env`)
```
AZURE_FOUNDRY_API_KEY="your-api-key"
AZURE_FOUNDRY_BASE_URL="https://your-resource.services.ai.azure.com"
AZURE_FOUNDRY_PROXY=""
```

### Model config
```
MODEL="azure_foundry/DeepSeek-V4-Flash"
MODEL_OPUS="azure_foundry/DeepSeek-V4-Flash"
MODEL_SONNET="azure_foundry/DeepSeek-V4-Flash"
MODEL_HAIKU="azure_foundry/DeepSeek-V4-Flash"
```

### How model routing works
1. Incoming Claude model name (e.g. `claude-sonnet-4-6`) hits `Settings.resolve_model()` (settings.py:453). It checks opus/sonnet/haiku substrings, returning MODEL_OPUS/MODEL_SONNET/MODEL_HAIKU if set, otherwise fallback MODEL.
2. The resolved string `azure_foundry/DeepSeek-V4-Flash` is split into provider_id=`azure_foundry` and model_id=`DeepSeek-V4-Flash`.
3. ModelRegistry (registry.py) dispatches to `AzureFoundryProvider`.
4. `AzureFoundryProvider._build_request_body()` (client.py:55) converts Anthropic messages to OpenAI format.
5. Streaming is handled by OpenAI-compat `_stream_response_impl` in `providers/openai_compat.py`.

### Server
- Runs on `http://0.0.0.0:8082` via `uv run uvicorn server:app --host 0.0.0.0 --port 8082`
- Requires `ANTHROPIC_AUTH_TOKEN="freecc"` in `.env`
- Client connects with: `claude --proxy http://localhost:8082`

### Rate limits (Azure AI Foundry free tier)
- 20 requests/min
- 20000 tokens/min
- When exceeded, API returns 429 with `x-ratelimit-remaining-tokens: -NNNN`. The rate limiter (providers/rate_limit.py) retries up to 3 times with backoff, then sets a 60s global block.

### Verification
- Check `server.log` for SSE events and response status
- Each request logs: `MODEL MAPPING: 'claude-sonnet-4-6' -> 'DeepSeek-V4-Flash'`, then `API_REQUEST:`, then `HTTP Response: ... 200 OK` (or 429)