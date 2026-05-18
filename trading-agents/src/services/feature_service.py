"""Feature service for computing technical indicators and factors."""

from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np


app = FastAPI(title="Feature Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IndicatorRequest(BaseModel):
    """Request for computing technical indicators."""
    ohlcv: list[dict]
    symbol: str


class IndicatorResponse(BaseModel):
    """Response with computed indicators."""
    symbol: str
    indicators: dict
    computed_at: str


def calculate_sma(prices: list, period: int) -> Optional[float]:
    """Calculate Simple Moving Average."""
    if len(prices) < period:
        return None
    return np.mean(prices[-period:])


def calculate_ema(prices: list, period: int) -> Optional[float]:
    """Calculate Exponential Moving Average."""
    if len(prices) < period:
        return None
    prices_array = np.array(prices)
    alpha = 2 / (period + 1)
    ema = prices_array[0]
    for price in prices_array[1:]:
        ema = alpha * price + (1 - alpha) * ema
    return ema


def calculate_rsi(prices: list, period: int = 14) -> Optional[float]:
    """Calculate Relative Strength Index."""
    if len(prices) < period + 1:
        return None
    
    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    
    if avg_loss == 0:
        return 100
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def calculate_macd(prices: list, fast: int = 12, slow: int = 26, signal: int = 9):
    """Calculate MACD."""
    if len(prices) < slow:
        return None, None, None
    
    ema_fast = calculate_ema(prices, fast)
    ema_slow = calculate_ema(prices, slow)
    
    if ema_fast is None or ema_slow is None:
        return None, None, None
    
    macd_line = ema_fast - ema_slow
    
    # Calculate signal line (EMA of MACD)
    macd_values = []
    for i in range(slow, len(prices) + 1):
        ef = calculate_ema(prices[:i], fast)
        es = calculate_ema(prices[:i], slow)
        if ef and es:
            macd_values.append(ef - es)
    
    if len(macd_values) < signal:
        return macd_line, None, None
    
    signal_line = calculate_ema(macd_values, signal)
    histogram = macd_line - signal_line if signal_line else None
    
    return macd_line, signal_line, histogram


def calculate_bollinger_bands(prices: list, period: int = 20, std_dev: float = 2.0):
    """Calculate Bollinger Bands."""
    if len(prices) < period:
        return None, None, None
    
    sma = calculate_sma(prices, period)
    if sma is None:
        return None, None, None
    
    std = np.std(prices[-period:])
    upper = sma + (std_dev * std)
    lower = sma - (std_dev * std)
    
    return upper, sma, lower


def calculate_atr(ohlcv: list, period: int = 14) -> Optional[float]:
    """Calculate Average True Range."""
    if len(ohlcv) < period + 1:
        return None
    
    true_ranges = []
    for i in range(1, len(ohlcv)):
        high = ohlcv[i]["high"]
        low = ohlcv[i]["low"]
        prev_close = ohlcv[i-1]["close"]
        
        tr = max(
            high - low,
            abs(high - prev_close),
            abs(low - prev_close)
        )
        true_ranges.append(tr)
    
    if len(true_ranges) < period:
        return None
    
    return np.mean(true_ranges[-period:])


def calculate_obv(ohlcv: list) -> Optional[float]:
    """Calculate On-Balance Volume."""
    if len(ohlcv) < 2:
        return None
    
    obv = 0
    for i in range(1, len(ohlcv)):
        if ohlcv[i]["close"] > ohlcv[i-1]["close"]:
            obv += ohlcv[i]["volume"]
        elif ohlcv[i]["close"] < ohlcv[i-1]["close"]:
            obv -= ohlcv[i]["volume"]
    
    return obv


def calculate_vwap(ohlcv: list) -> Optional[float]:
    """Calculate Volume Weighted Average Price."""
    if not ohlcv:
        return None
    
    total_pv = 0
    total_volume = 0
    
    for bar in ohlcv:
        typical_price = (bar["high"] + bar["low"] + bar["close"]) / 3
        pv = typical_price * bar["volume"]
        total_pv += pv
        total_volume += bar["volume"]
    
    if total_volume == 0:
        return None
    
    return total_pv / total_volume


@app.get("/")
def root():
    return {"service": "features", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/features/indicators", response_model=IndicatorResponse)
async def compute_indicators(request: IndicatorRequest):
    """Compute technical indicators from OHLCV data."""
    try:
        if not request.ohlcv:
            raise HTTPException(status_code=400, detail="No OHLCV data provided")
        
        # Extract close prices
        closes = [bar["close"] for bar in request.ohlcv]
        highs = [bar["high"] for bar in request.ohlcv]
        lows = [bar["low"] for bar in request.ohlcv]
        
        indicators = {}
        
        # Trend indicators
        indicators["sma_20"] = calculate_sma(closes, 20)
        indicators["sma_50"] = calculate_sma(closes, 50)
        indicators["sma_200"] = calculate_sma(closes, 200) if len(closes) >= 200 else None
        indicators["ema_12"] = calculate_ema(closes, 12)
        indicators["ema_26"] = calculate_ema(closes, 26)
        
        # Momentum indicators
        indicators["rsi"] = calculate_rsi(closes)
        macd, macd_signal, macd_hist = calculate_macd(closes)
        indicators["macd"] = macd
        indicators["macd_signal"] = macd_signal
        indicators["macd_histogram"] = macd_hist
        
        # Volatility indicators
        bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(closes)
        indicators["bollinger_upper"] = bb_upper
        indicators["bollinger_middle"] = bb_middle
        indicators["bollinger_lower"] = bb_lower
        indicators["atr"] = calculate_atr(request.ohlcv)
        
        # Volume indicators
        indicators["obv"] = calculate_obv(request.ohlcv)
        indicators["vwap"] = calculate_vwap(request.ohlcv)
        
        # Current price
        indicators["current_price"] = closes[-1] if closes else None
        indicators["price_change"] = closes[-1] - closes[0] if len(closes) > 1 else None
        indicators["price_change_percent"] = ((closes[-1] - closes[0]) / closes[0] * 100) if len(closes) > 1 and closes[0] != 0 else None
        
        return IndicatorResponse(
            symbol=request.symbol,
            indicators=indicators,
            computed_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/features/factors")
async def compute_factors(request: dict):
    """Compute factor scores from fundamentals."""
    # Placeholder for factor computation
    # In production, this would compute value, growth, quality factors
    return {
        "value_score": 0.5,
        "growth_score": 0.5,
        "quality_score": 0.5,
        "momentum_score": 0.5,
    }


@app.post("/features/sentiment")
async def compute_sentiment(request: dict):
    """Compute sentiment features from news."""
    # Placeholder for sentiment analysis
    # In production, this would use NLP to analyze news
    return {
        "sentiment_score": 0.0,
        "sentiment_label": "neutral",
        "key_narratives": [],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
