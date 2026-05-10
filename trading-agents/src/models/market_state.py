"""Market state data models."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OHLCV(BaseModel):
    """OHLCV candlestick data."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class Fundamentals(BaseModel):
    """Fundamental data for a stock."""
    symbol: str
    pe_ratio: Optional[float] = None
    eps: Optional[float] = None
    market_cap: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    revenue: Optional[float] = None
    net_income: Optional[float] = None
    debt_to_equity: Optional[float] = None
    roe: Optional[float] = None
    gross_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    last_updated: datetime = Field(default_factory=datetime.now)


class NewsItem(BaseModel):
    """News article or sentiment data."""
    title: str
    content: str
    source: str
    published_at: datetime
    sentiment: Optional[str] = None  # positive, negative, neutral
    sentiment_score: Optional[float] = None  # -1 to 1


class TechnicalIndicators(BaseModel):
    """Technical analysis indicators."""
    # Trend indicators
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    
    # Momentum indicators
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    
    # Volatility indicators
    bollinger_upper: Optional[float] = None
    bollinger_middle: Optional[float] = None
    bollinger_lower: Optional[float] = None
    atr: Optional[float] = None
    
    # Volume indicators
    obv: Optional[float] = None
    vwap: Optional[float] = None


class TechnicalAnalysis(BaseModel):
    """Technical analysis summary."""
    trend: str = "neutral"  # up, down, neutral
    momentum: str = "neutral"  # strong, moderate, weak, neutral
    overbought: bool = False
    oversold: bool = False
    support_level: Optional[float] = None
    resistance_level: Optional[float] = None
    summary: str = ""
    signals: list[str] = Field(default_factory=list)


class FundamentalAnalysis(BaseModel):
    """Fundamental analysis summary."""
    valuation: str = "fair"  # cheap, fair, expensive
    quality: str = "neutral"  # high, medium, low, neutral
    growth: str = "neutral"  # high, medium, low, neutral
    key_strengths: list[str] = Field(default_factory=list)
    key_risks: list[str] = Field(default_factory=list)
    summary: str = ""


class SentimentAnalysis(BaseModel):
    """News and sentiment analysis."""
    overall_sentiment: str = "neutral"  # positive, negative, neutral
    sentiment_score: float = 0.0  # -1 to 1
    key_narratives: list[str] = Field(default_factory=list)
    news_count: int = 0
    summary: str = ""


class MarketState(BaseModel):
    """Complete market state for a symbol."""
    symbol: str
    timeframe: str = "1d"  # 1m, 5m, 15m, 1h, 1d, 1w
    
    # Raw data
    ohlcv: list[OHLCV] = Field(default_factory=list)
    fundamentals: Optional[Fundamentals] = None
    news: list[NewsItem] = Field(default_factory=list)
    
    # Computed features
    indicators: Optional[TechnicalIndicators] = None
    
    # Agent outputs
    technical_analysis: Optional[TechnicalAnalysis] = None
    fundamental_analysis: Optional[FundamentalAnalysis] = None
    sentiment_analysis: Optional[SentimentAnalysis] = None
    
    # Metadata
    fetched_at: datetime = Field(default_factory=datetime.now)
    data_quality: str = "good"  # good, partial, poor
    
    # Current price
    current_price: Optional[float] = None
    previous_close: Optional[float] = None
    price_change: Optional[float] = None
    price_change_percent: Optional[float] = None
