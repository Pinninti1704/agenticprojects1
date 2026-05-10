"""Data service for fetching market data."""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf

app = FastAPI(title="Data Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class OHLCVRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    interval: str = "1d"


class OHLCVResponse(BaseModel):
    symbol: str
    data: list[dict]
    fetched_at: str


class FundamentalsRequest(BaseModel):
    symbol: str


class FundamentalsResponse(BaseModel):
    symbol: str
    data: dict


class NewsRequest(BaseModel):
    symbol: str
    window_days: int = 7


class NewsResponse(BaseModel):
    symbol: str
    news: list[dict]


@app.get("/")
def root():
    return {"service": "data", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/data/ohlcv", response_model=OHLCVResponse)
async def fetch_ohlcv(request: OHLCVRequest):
    """Fetch OHLCV data for a symbol."""
    try:
        # Map interval to Yahoo Finance format
        interval_map = {
            "1m": "1m",
            "5m": "5m",
            "15m": "15m",
            "1h": "1h",
            "1d": "1d",
            "1w": "1wk",
        }
        yf_interval = interval_map.get(request.interval, "1d")
        
        # Use yfinance to fetch data
        ticker = yf.Ticker(request.symbol)
        df = ticker.history(start=request.start_date, end=request.end_date, interval=yf_interval)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found")
        
        ohlcv_data = []
        for idx, row in df.iterrows():
            ohlcv_data.append({
                "timestamp": idx.isoformat(),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"]),
            })
        
        return OHLCVResponse(
            symbol=request.symbol,
            data=ohlcv_data,
            fetched_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/data/fundamentals", response_model=FundamentalsResponse)
async def fetch_fundamentals(request: FundamentalsRequest):
    """Fetch fundamental data for a symbol."""
    try:
        # Use yfinance to fetch fundamentals
        ticker = yf.Ticker(request.symbol)
        info = ticker.info
        
        # Extract relevant fields
        fundamentals = {
            "pe_ratio": info.get("trailingPE"),
            "dividend_yield": info.get("dividendYield"),
            "beta": info.get("beta"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
            "eps": info.get("trailingEps"),
            "market_cap": info.get("marketCap"),
            "revenue": info.get("totalRevenue"),
            "net_income": info.get("netIncomeToCommon"),
            "debt_to_equity": info.get("debtToEquity"),
            "roe": info.get("returnOnEquity"),
            "gross_margin": info.get("grossMargins"),
            "operating_margin": info.get("operatingMargins"),
        }
        
        return FundamentalsResponse(
            symbol=request.symbol,
            data=fundamentals
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/data/news", response_model=NewsResponse)
async def fetch_news(request: NewsRequest):
    """Fetch recent news for a symbol."""
    try:
        # Use yfinance to fetch news
        ticker = yf.Ticker(request.symbol)
        news = ticker.news
        
        news_items = []
        if news:
            for item in news:
                published = item.get("providerPublishTime")
                if published:
                    try:
                        pub_date = datetime.fromtimestamp(published)
                        days_ago = (datetime.now() - pub_date).days
                        if days_ago > request.window_days:
                            continue
                    except:
                        pass
                
                news_items.append({
                    "title": item.get("title", ""),
                    "content": item.get("summary", ""),
                    "source": item.get("publisher", ""),
                    "published_at": str(published) if published else "",
                    "url": item.get("link", ""),
            })
        
        return NewsResponse(
            symbol=request.symbol,
            news=news_items
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
