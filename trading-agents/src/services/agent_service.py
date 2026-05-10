"""AI Agent Service - OpenClaw-style multi-agent trading system with LLM."""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

app = FastAPI(title="AI Agent Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NVIDIA NIM API
NVIDIA_API_KEY = os.getenv("NVIDIA_NIM_API_KEY", "")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

# Service URLs
DATA_SERVICE_URL = "http://localhost:8001"
FEATURE_SERVICE_URL = "http://localhost:8002"


class AnalysisRequest(BaseModel):
    """Request for AI agent analysis."""
    symbols: list[str]
    mode: str = "research"
    portfolio_value: float = 100000


class AgentResponse(BaseModel):
    """Response from AI agent analysis."""
    run_id: str
    timestamp: str
    mode: str
    symbols_analyzed: int
    agents_results: dict
    signals: list
    approved_trades: list


def call_llm(prompt: str, system_prompt: str = None) -> str:
    """Call NVIDIA NIM LLM."""
    if not NVIDIA_API_KEY:
        return "Error: No NVIDIA API key configured"
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    try:
        response = requests.post(
            f"{NVIDIA_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {NVIDIA_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "nvidia/llama-3.1-nemotron-70b-instruct",
                "messages": messages,
                "temperature": 0.5,
                "max_tokens": 2048
            },
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            return f"Error: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Error calling LLM: {str(e)}"


class MarketDataAgent:
    """Agent 1: Fetch and normalize market data."""
    
    def run(self, symbol: str) -> dict:
        """Fetch market data for a symbol."""
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        try:
            response = requests.post(
                f"{DATA_SERVICE_URL}/data/ohlcv",
                json={
                    "symbol": symbol,
                    "start_date": start_date,
                    "end_date": end_date,
                    "interval": "1d"
                },
                timeout=30
            )
            
            if response.ok:
                data = response.json()
                return {
                    "status": "success",
                    "symbol": symbol,
                    "data": data.get("data", []),
                    "latest_price": data["data"][-1]["close"] if data.get("data") else None
                }
            else:
                return {"status": "error", "symbol": symbol, "error": response.text}
        except Exception as e:
            return {"status": "error", "symbol": symbol, "error": str(e)}


class FeatureEngineerAgent:
    """Agent 2: Compute technical indicators and features."""
    
    def run(self, symbol: str, ohlcv_data: list) -> dict:
        """Compute technical indicators."""
        try:
            response = requests.post(
                f"{FEATURE_SERVICE_URL}/features/indicators",
                json={"symbol": symbol, "ohlcv": ohlcv_data},
                timeout=30
            )
            
            if response.ok:
                data = response.json()
                return {
                    "status": "success",
                    "symbol": symbol,
                    "indicators": data.get("indicators", {})
                }
            else:
                return {"status": "error", "symbol": symbol, "error": response.text}
        except Exception as e:
            return {"status": "error", "symbol": symbol, "error": str(e)}


class TechnicalAnalystAgent:
    """Agent 3: Produce technical analysis using LLM."""
    
    def run(self, symbol: str, ohlcv_data: list, indicators: dict) -> dict:
        """Generate technical analysis using LLM."""
        
        latest = ohlcv_data[-1] if ohlcv_data else {}
        price_change = 0.0
        if len(ohlcv_data) >= 2:
            price_change = ((ohlcv_data[-1]["close"] - ohlcv_data[0]["open"]) / ohlcv_data[0]["open"]) * 100
        
        price_change_str = f"{price_change:.2f}%"
        
        indicators_summary = {
            "rsi": indicators.get("rsi"),
            "macd": indicators.get("macd"),
            "macd_signal": indicators.get("macd_signal"),
            "sma_20": indicators.get("sma_20"),
            "sma_50": indicators.get("sma_50"),
            "bb_upper": indicators.get("bb_upper"),
            "bb_lower": indicators.get("bb_lower"),
        }
        
        prompt = f"""You are a Technical Analyst Agent. Analyze the following stock data and provide a technical analysis.

Symbol: {symbol}
Latest Price: ${latest.get('close', 'N/A')}
Price Change (30d): {price_change_str}

Technical Indicators:
{json.dumps(indicators_summary, indent=2)}

Provide your analysis in JSON format:
{{
    "trend": "up/down/neutral",
    "momentum": "strong/moderate/weak",
    "overbought": true/false,
    "oversold": true/false,
    "summary": "2-3 sentence analysis",
    "signal": "bullish/bearish/neutral"
}}
"""
        
        result = call_llm(prompt, "You are an expert technical analysis AI agent.")
        
        try:
            if "{" in result and "}" in result:
                json_start = result.find("{")
                json_end = result.rfind("}") + 1
                analysis = json.loads(result[json_start:json_end])
            else:
                analysis = {"summary": result, "signal": "neutral"}
        except:
            analysis = {"summary": result[:200], "signal": "neutral"}
        
        return {
            "status": "success",
            "symbol": symbol,
            "analysis": analysis
        }


class FundamentalAnalystAgent:
    """Agent 4: Evaluate fundamentals using LLM."""
    
    def run(self, symbol: str) -> dict:
        """Generate fundamental analysis using LLM."""
        
        prompt = f"""You are a Fundamental Analyst Agent. Provide a brief fundamental analysis for {symbol}.

Since we don't have live fundamental data, provide a general analysis based on the stock symbol.
Consider what you know about {symbol} as a publicly traded company.

Provide JSON format:
{{
    "sector": "sector name",
    "valuation": "cheap/fair/expensive",
    "key_risks": ["risk1", "risk2"],
    "growth_outlook": "positive/neutral/negative",
    "summary": "2-3 sentence analysis",
    "signal": "bullish/bearish/neutral"
}}
"""
        
        result = call_llm(prompt, "You are an expert fundamental analysis AI agent.")
        
        try:
            if "{" in result and "}" in result:
                json_start = result.find("{")
                json_end = result.rfind("}") + 1
                analysis = json.loads(result[json_start:json_end])
            else:
                analysis = {"summary": result[:200], "signal": "neutral"}
        except:
            analysis = {"summary": result[:200], "signal": "neutral"}
        
        return {
            "status": "success",
            "symbol": symbol,
            "analysis": analysis
        }


class SignalEngineerAgent:
    """Agent 5: Combine analyses into trade signals using LLM."""
    
    def run(self, symbol: str, ta_analysis: dict, fa_analysis: dict, current_price: float) -> dict:
        """Generate trading signal using LLM."""
        
        prompt = f"""You are a Signal Engineer Agent. Combine technical and fundamental analysis to generate a trading signal.

Symbol: {symbol}
Current Price: ${current_price}

Technical Analysis:
{json.dumps(ta_analysis.get('analysis', {}), indent=2)}

Fundamental Analysis:
{json.dumps(fa_analysis.get('analysis', {}), indent=2)}

Generate a trading signal in JSON format:
{{
    "side": "long/short/neutral",
    "confidence": 0.0-1.0,
    "entry_zone_min": price,
    "entry_zone_max": price,
    "stop_loss": price,
    "take_profit": price,
    "expected_horizon_days": 1-10,
    "rationale": "detailed reason for the signal"
}}
"""
        
        result = call_llm(prompt, "You are an expert quantitative trading signal engineer.")
        
        try:
            if "{" in result and "}" in result:
                json_start = result.find("{")
                json_end = result.rfind("}") + 1
                signal = json.loads(result[json_start:json_end])
            else:
                signal = {"side": "neutral", "confidence": 0.5}
        except:
            signal = {"side": "neutral", "confidence": 0.5}
        
        signal.setdefault("entry_zone_min", current_price * 0.98)
        signal.setdefault("entry_zone_max", current_price * 1.02)
        signal.setdefault("stop_loss", current_price * 0.95)
        signal.setdefault("take_profit", current_price * 1.08)
        
        return {
            "status": "success",
            "symbol": symbol,
            "signal": signal
        }


class FundManagerAgent:
    """Orchestrator: Run the full multi-agent pipeline."""
    
    def __init__(self):
        self.market_data_agent = MarketDataAgent()
        self.feature_agent = FeatureEngineerAgent()
        self.ta_agent = TechnicalAnalystAgent()
        self.fa_agent = FundamentalAnalystAgent()
        self.signal_agent = SignalEngineerAgent()
    
    def run(self, symbols: list[str], mode: str = "research") -> dict:
        """Run the full agent pipeline."""
        
        results = {
            "run_id": f"RUN-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "mode": mode,
            "symbols_analyzed": len(symbols),
            "agents_results": {},
            "signals": [],
            "approved_trades": []
        }
        
        for symbol in symbols:
            symbol_results = {}
            
            # Agent 1: Market Data
            market_data = self.market_data_agent.run(symbol)
            symbol_results["market_data"] = market_data
            
            if market_data.get("status") != "success":
                results["agents_results"][symbol] = symbol_results
                continue
            
            ohlcv_data = market_data.get("data", [])
            current_price = market_data.get("latest_price", 100)
            
            # Agent 2: Feature Engineering
            features = self.feature_agent.run(symbol, ohlcv_data)
            symbol_results["features"] = features
            
            indicators = features.get("indicators", {})
            
            # Agent 3: Technical Analysis (LLM)
            ta_result = self.ta_agent.run(symbol, ohlcv_data, indicators)
            symbol_results["technical_analysis"] = ta_result
            
            # Agent 4: Fundamental Analysis (LLM)
            fa_result = self.fa_agent.run(symbol)
            symbol_results["fundamental_analysis"] = fa_result
            
            # Agent 5: Signal Engineering (LLM)
            signal_result = self.signal_agent.run(
                symbol, 
                ta_result, 
                fa_result, 
                current_price
            )
            symbol_results["signal"] = signal_result
            
            signal = signal_result.get("signal", {})
            if signal.get("side") != "neutral":
                signal["symbol"] = symbol
                signal["created_at"] = datetime.now().isoformat()
                results["signals"].append(signal)
                
                # In paper_trading mode, auto-approve high confidence trades
                if mode == "paper_trading" and signal.get("confidence", 0) > 0.6:
                    results["approved_trades"].append(signal)
            
            results["agents_results"][symbol] = symbol_results
        
        return results


# Initialize the fund manager
fund_manager = FundManagerAgent()


@app.get("/")
def root():
    return {"service": "ai_agents", "version": "1.0.0", "agents": [
        "MarketDataAgent",
        "FeatureEngineerAgent", 
        "TechnicalAnalystAgent",
        "FundamentalAnalystAgent",
        "SignalEngineerAgent",
        "FundManagerAgent"
    ]}


@app.get("/health")
def health():
    return {"status": "healthy", "llm_configured": bool(NVIDIA_API_KEY)}


@app.post("/agents/analyze", response_model=AgentResponse)
async def analyze(request: AnalysisRequest):
    """Run the full AI agent pipeline."""
    try:
        results = fund_manager.run(request.symbols, request.mode)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/market_data")
async def market_data_agent(symbol: str):
    """Run MarketDataAgent only."""
    agent = MarketDataAgent()
    return agent.run(symbol)


@app.post("/agents/technical_analysis")
async def technical_analysis(symbol: str, ohlcv: list, indicators: dict):
    """Run TechnicalAnalystAgent only."""
    agent = TechnicalAnalystAgent()
    return agent.run(symbol, ohlcv, indicators)


@app.post("/agents/signal")
async def signal_agent(symbol: str, ta_analysis: dict, fa_analysis: dict, current_price: float):
    """Run SignalEngineerAgent only."""
    agent = SignalEngineerAgent()
    return agent.run(symbol, ta_analysis, fa_analysis, current_price)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
