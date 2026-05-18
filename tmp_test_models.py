import subprocess, json, sys, time

api_key = sys.argv[1]

models = [
    "01-ai/yi-large",
    "google/gemma-3-27b-it",
    "google/gemma-3n-e2b-it",
    "google/gemma-3n-e4b-it",
    "google/gemma-4-31b-it",
    "meta/llama-4-maverick-17b-128e-instruct",
    "microsoft/phi-3.5-moe-instruct",
    "microsoft/phi-4-mini-instruct",
    "minimaxai/minimax-m2.5",
    "minimaxai/minimax-m2.7",
    "mistralai/codestral-22b-instruct-v0.1",
    "mistralai/devstral-2-123b-instruct-2512",
    "mistralai/magistral-small-2506",
    "mistralai/ministral-14b-instruct-2512",
    "mistralai/mistral-large",
    "mistralai/mistral-large-2-instruct",
    "mistralai/mistral-large-3-675b-instruct-2512",
    "mistralai/mistral-medium-3.5-128b",
    "mistralai/mistral-medium-3-instruct",
    "mistralai/mistral-nemotron",
    "mistralai/mistral-small-4-119b-2603",
    "mistralai/mixtral-8x7b-instruct-v0.1",
    "mistralai/mixtral-8x22b-instruct-v0.1",
    "moonshotai/kimi-k2.6",
    "moonshotai/kimi-k2-instruct",
    "moonshotai/kimi-k2-thinking",
    "nv-mistralai/mistral-nemo-12b-instruct",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen2.5-coder-32b-instruct",
    "qwen/qwen3.5-122b-a10b",
    "qwen/qwen3.5-397b-a17b",
    "qwen/qwen3-coder-480b-a35b-instruct",
    "qwen/qwen3-next-80b-a3b-instruct",
    "qwen/qwen3-next-80b-a3b-thinking",
    "sarvamai/sarvam-m",
    "stepfun-ai/step-3.5-flash",
    "stockmark/stockmark-2-100b-instruct",
    "upstage/solar-10.7b-instruct",
    "writer/palmyra-creative-122b",
    "writer/palmyra-fin-70b-32k",
    "z-ai/glm4.7",
    "z-ai/glm5",
    "z-ai/glm-5.1",
    "zyphra/zamba2-7b-instruct",
]

# Pre-tested working models (from yesterday)
already_working = [
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.2-11b-vision-instruct",
    "meta/llama-3.2-1b-instruct",
    "meta/llama-3.2-3b-instruct",
    "meta/llama-3.2-90b-vision-instruct",
    "meta/llama-3.3-70b-instruct",
    "mistralai/mistral-7b-instruct-v0.3",
    "qwen/qwen3-next-80b-a3b-instruct",
    "qwen/qwen3-next-80b-a3b-thinking",
    "qwen/qwen3.5-122b-a10b",
]

results = {}
all_models = sorted(set(models + already_working))

for i, model in enumerate(all_models):
    model = model.strip()
    if not model:
        continue

    print(f"[{i+1}/{len(all_models)}] Testing {model}... ", end="", flush=True)

    body = json.dumps({"model": model, "messages": [{"role": "user", "content": "say hi in 3 words"}], "max_tokens": 10})

    try:
        result = subprocess.run(
            ["curl", "-s", "-w", "\n%{http_code}",
             "https://integrate.api.nvidia.com/v1/chat/completions",
             "-H", f"Authorization: Bearer {api_key}",
             "-H", "Content-Type: application/json",
             "-d", body],
            capture_output=True, text=True, timeout=30
        )
        output = result.stdout.strip()
        parts = output.rsplit("\n", 1)
        http_code = parts[-1].strip() if len(parts) > 1 else "000"

        if http_code == "200":
            print("OK")
            results[model] = "chat_ok"
        elif http_code == "429":
            print("RATE_LIMITED")
            results[model] = "rate_limited"
            time.sleep(5)
        else:
            print(f"FAIL [{http_code}]")
            results[model] = f"fail_{http_code}"
    except subprocess.TimeoutExpired:
        print("TIMEOUT")
        results[model] = "timeout"
    except Exception as e:
        print(f"ERROR: {e}")
        results[model] = "error"

    time.sleep(0.5)

print("\n\n=== RESULTS ===")
for model, status in sorted(results.items()):
    print(f"  {model}: {status}")
print(f"\nWorking chat: {sum(1 for s in results.values() if s == 'chat_ok')}/{len(results)}")