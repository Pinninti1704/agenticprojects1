# Free Claude Code Setup (via compilefuture.com Guide)

Based on: [https://compilefuture.com/blog/how-to-use-claude-code-free-unlimited/](https://compilefuture.com/blog/how-to-use-claude-code-free-unlimited/)

**Branch:** `docs/experiment-compilefuture-guide`

Use this repo as a proxy to run Claude Code for free using NVIDIA NIM, OpenRouter, or DeepSeek APIs.

---

## Quick Start

### 1. Install Claude Code CLI

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

(Do not run Claude Code yet — configure the proxy first.)

### 2. Install uv & Python

```bash
# Install uv (Windows PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Update uv
uv self update

# Install Python 3.14
uv python install 3.14
```

### 3. Clone & Configure This Repo

```bash
git clone https://github.com/Alishahryar1/free-claude-code.git nvidia-nim
cd nvidia-nim

# Copy env template
# Windows PowerShell:
Copy-Item .env.example .env
# MacOS/Linux:
# cp .env.example .env

# Open in VS Code
code .
```

### 4. Get Free API Keys

#### (A) NVIDIA NIM (Recommended — ~40 req/min free)
1. Go to https://build.nvidia.com/settings/api-keys
2. Create account, verify phone number
3. Generate API key, copy to `.env`:
   ```
   NVIDIA_NIM_API_KEY="your-key-here"
   ```

#### (B) OpenRouter (Optional)
1. Go to https://openrouter.ai/keys
2. Generate key, copy to `.env`:
   ```
   OPENROUTER_API_KEY="your-key-here"
   ```

#### (C) DeepSeek (Optional)
1. Go to https://platform.deepseek.com/api_keys
2. Create key, copy to `.env`:
   ```
   DEEPSEEK_API_KEY="your-key-here"
   ```

### 5. Configure Model Mappings in `.env`

Map Claude model slots to your free models:

```env
MODEL="nvidia_nim/z-ai/glm4.7"
MODEL_OPUS="nvidia_nim/z-ai/glm4.7"
MODEL_SONNET="openrouter/google/gemma-2-27b-it"
MODEL_HAIKU="deepseek/deepseek-reasoner"
```

- `nvidia_nim/` prefix for NVIDIA NIM models
- `openrouter/` prefix for OpenRouter models  
- `deepseek/` prefix for DeepSeek models
- Format: `provider_type/model/name`

### 6. Start the Proxy Server

```bash
# Terminal 1: Start the server (keep running)
uv run uvicorn server:app --host 0.0.0.0 --port 8082
```

### 7. Start Claude Code

Open a **new terminal** and run:

**PowerShell:**
```powershell
$env:ANTHROPIC_AUTH_TOKEN="freecc"; $env:ANTHROPIC_BASE_URL="http://localhost:8082"; claude
```

**Bash (Mac/Linux):**
```bash
ANTHROPIC_AUTH_TOKEN="freecc" ANTHROPIC_BASE_URL="http://localhost:8082" claude
```

Select your mapped Opus model (e.g., GLM 4.7) and start coding.

---

## Pro Tip: Sandbox Mode with Auto-Allow

To avoid Claude Code asking permission for every file change:

1. Inside Claude Code, type `/sandbox`
2. Select **Sandbox with auto-allow**

This restricts Claude to your project folder but allows automatic file edits without prompts. Always use Git for version control.

---

## Branch Structure

| Branch | Purpose |
|--------|---------|
| `main` | Production branch |
| `azure-foundry-working` | Azure AI Foundry provider setup + full rollback guide |
| `docs/experiment-compilefuture-guide` | This branch — experiment with compilefuture.com guide |

---

## Video Reference

Watch the full walkthrough: [Use Claude Code FREE UNLIMITED (No GPU, No Limits!)](https://www.youtube.com/watch?v=VwW-VcWdPSA)

---

## Links

- [Free Claude Code Repo](https://github.com/Alishahryar1/free-claude-code)
- [NVIDIA NIM API Keys](https://build.nvidia.com/settings/api-keys)
- [OpenRouter API Keys](https://openrouter.ai/keys)
- [DeepSeek API Keys](https://platform.deepseek.com/api_keys)