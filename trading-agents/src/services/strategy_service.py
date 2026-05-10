"""Strategy service for generating trading signals."""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np


app = FastAPI(title="Strategy Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignalRequest(BaseModel):
    """Request for generating a trade signal."""
    symbol: str
    indicators: dict
    technical_analysis: Optional[dict] = None
    fundamental_analysis: Optional[dict] = None
    sentiment_analysis: Optional[dict] = None
    current_price: float


class SignalResponse(BaseModel):
    """Response with generated signal."""
    symbol: str
    signal: dict


class BacktestRequest(BaseModel):
    """Request for backtesting a strategy."""
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float = 100000
    strategy_params: dict = Field(default_factory=dict)


class BacktestResponse(BaseModel):
    """Backtest results."""
    results: dict


def calculate_risk_reward(entry: float, stop: float, target: float, side: str) -> float:
    """Calculate risk-reward ratio."""
    if side == "long":
        risk = entry - stop
        reward = target - entry
    else:
        risk = stop - entry
        reward = entry - target
    
    if risk <= 0:
        return 0
    
    return reward / risk


def generate_technical_signal(indicators: dict, current_price: float) -> dict:
    """Generate signal based on technical indicators."""
    signals = []
    score = 0
    
    # RSI
    rsi = indicators.get("rsi")
    if rsi:
        if rsi < 30:
            signals.append("RSI oversold")
            score += 1
        elif rsi > 70:
            signals.append("RSI overbought")
            score -= 1
    
    # MACD
    macd = indicators.get("macd")
    macd_signal = indicators.get("macd_signal")
    if macd and macd_signal:
        if macd > macd_signal:
            signals.append("MACD bullish")
            score += 1
        else:
            signals.append("MACD bearish")
            score -= 1
    
    # Moving averages
    sma_20 = indicators.get("sma_20")
    sma_50 = indicators.get("sma_50")
    if sma_20 and sma_50:
        if sma_20 > sma_50:
            signals.append("Price above SMA (uptrend)")
            score += 1
        else:
            signals.append("Price below SMA (downtrend)")
            score -= 1
    
    # Price vs SMA
    if sma_20:
        if current_price > sma_20:
            signals.append("Price above SMA20")
            score += 0.5
        else:
            signals.append("Price below SMA20")
            score -= 0.5
    
    # Bollinger Bands
    bb_upper = indicators.get("bollinger_upper")
    bb_lower = indicators.get("bollinger_lower")
    if bb_upper and bb_lower:
        if current_price <= bb_lower:
            signals.append("Near lower Bollinger Band (oversold)")
            score += 1
        elif current_price >= bb_upper:
            signals.append("Near upper Bollinger Band (overbought)")
            score -= 1
    
    # Determine signal
    if score >= 2:
        side = "long"
        confidence = min(0.5 + (score - 2) * 0.15, 0.95)
    elif score <= -2:
        side = "short"
        confidence = min(0.5 + (abs(score) - 2) * 0.15, 0.95)
    else:
        side = "neutral"
        confidence = 0.5
    
    return {
        "side": side,
        "confidence": confidence,
        "score": score,
        "signals": signals
    }


def generate_combined_signal(
    symbol: str,
    indicators: dict,
    technical_analysis: Optional[dict],
    fundamental_analysis: Optional[dict],
    sentiment_analysis: Optional[dict],
    current_price: float
) -> dict:
    """Generate combined signal from all analyses."""
    
    # Get technical signal
    tech_signal = generate_technical_signal(indicators, current_price)
    
    # Adjust confidence based on fundamental analysis
    fundamental_boost = 0
    if fundamental_analysis:
        valuation = fundamental_analysis.get("valuation", "fair")
        if valuation == "cheap":
            fundamental_boost = 0.1
        elif valuation == "expensive":
            fundamental_boost = -0.1
    
    # Adjust based on sentiment
    sentiment_boost = 0
    if sentiment_analysis:
        sentiment_score = sentiment_analysis.get("sentiment_score", 0)
        sentiment_boost = sentiment_score * 0.1
    
    # Combine
    final_confidence = tech_signal["confidence"] + fundamental_boost + sentiment_boost
    final_confidence = max(0.1, min(0.95, final_confidence))
    
    # Determine side
    side = tech_signal["side"]
    if side == "neutral":
        if final_confidence > 0.6:
            side = "long"
        elif final_confidence < 0.4:
            side = "short"
    
    # Calculate entry, stop loss, take profit
    if side == "long":
        entry_min = current_price * 0.98
        entry_max = current_price * 1.02
        stop_loss = current_price * 0.95
        take_profit = current_price * 1.10
    elif side == "short":
        entry_min = current_price * 0.98
        entry_max = current_price * 1.02
        stop_loss = current_price * 1.05
        take_profit = current_price * 0.90
    else:
        entry_min = current_price
        entry_max = current_price
        stop_loss = current_price
        take_profit = current_price
    
    # Calculate risk-reward
    risk_reward = calculate_risk_reward(current_price, stop_loss, take_profit, side)
    
    # Build rationale
    rationale_parts = []
    if tech_signal["signals"]:
        rationale_parts.append(f"Technical: {', '.join(tech_signal['signals'][:3])}")
    if fundamental_analysis and fundamental_analysis.get("summary"):
        rationale_parts.append(f"Fundamental: {fundamental_analysis['summary'][:100]}")
    if sentiment_analysis and sentiment_analysis.get("summary"):
        rationale_parts.append(f"Sentiment: {sentiment_analysis['summary'][:100]}")
    
    rationale = ". ".join(rationale_parts) if rationale_parts else "Combined analysis"
    
    return {
        "symbol": symbol,
        "side": side,
        "confidence": final_confidence,
        "expected_horizon_days": 3,
        "rationale": rationale,
        "entry_zone_min": entry_min,
        "entry_zone_max": entry_max,
        "stop_loss": stop_loss,
        "take_profit": take_profit,
        "risk_reward_ratio": risk_reward,
        "technical_signals": tech_signal["signals"],
    }


@app.get("/")
def root():
    return {"service": "strategy", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/strategy/rule_signal", response_model=SignalResponse)
async def generate_rule_signal(request: SignalRequest):
    """Generate rule-based trading signal."""
    try:
        signal = generate_combined_signal(
            request.symbol,
            request.indicators,
            request.technical_analysis,
            request.fundamental_analysis,
            request.sentiment_analysis,
            request.current_price
        )
        
        return SignalResponse(
            symbol=request.symbol,
            signal=signal
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/strategy/backtest", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest):
    """Run a simple backtest."""
    # Placeholder for backtesting
    # In production, this would run a full backtest
    return BacktestResponse(results={
        "total_return": 0.0,
        "total_trades": 0,
        "win_rate": 0.0,
        "sharpe_ratio": 0.0,
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
