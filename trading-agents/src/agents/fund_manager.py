"""Fund Manager Agent - orchestrates the trading pipeline."""

from typing import Optional
from datetime import datetime
import requests

# Service URLs
DATA_SERVICE_URL = "http://localhost:8001"
FEATURE_SERVICE_URL = "http://localhost:8002"
STRATEGY_SERVICE_URL = "http://localhost:8003"
RISK_SERVICE_URL = "http://localhost:8004"
EXECUTION_SERVICE_URL = "http://localhost:8005"


class FundManagerAgent:
    """
    Fund Manager Agent - orchestrates the multi-agent trading pipeline.
    
    Coordinates:
    1. MarketDataAgent - fetches market data
    2. FeatureEngineerAgent - computes features
    3. TechnicalAnalystAgent - technical analysis
    4. FundamentalAnalystAgent - fundamental analysis
    5. NewsSentimentAgent - sentiment analysis
    6. SignalEngineerAgent - generates trade signals
    7. RiskManagerAgent - evaluates risk
    8. ExecutionAgent - executes trades
    """
    
    def __init__(self, mode: str = "research"):
        """
        Initialize Fund Manager.
        
        Args:
            mode: "research" (signals only) or "paper_trading" (executes trades)
        """
        self.mode = mode
        self.portfolio_value = 100000  # Default $100k portfolio
        self.cash_available = 100000
        
    def run_daily_pipeline(self, symbols: list[str]) -> dict:
        """
        Run the full daily trading pipeline for given symbols.
        
        Args:
            symbols: List of stock symbols to analyze
            
        Returns:
            Dictionary with analysis results and trade decisions
        """
        results = {
            "run_id": f"RUN-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "mode": self.mode,
            "symbols_analyzed": len(symbols),
            "signals": [],
            "approved_trades": [],
            "rejected_trades": [],
            "errors": []
        }
        
        for symbol in symbols:
            try:
                # Step 1: Fetch market data
                market_state = self._fetch_market_data(symbol)
                if not market_state:
                    results["errors"].append(f"{symbol}: Failed to fetch data")
                    continue
                
                # Step 2: Compute features
                market_state = self._compute_features(market_state)
                
                # Step 3: Generate signal
                signal = self._generate_signal(market_state)
                if signal and signal.get("side") != "neutral":
                    results["signals"].append(signal)
                    
                    # Step 4: Risk evaluation (if in trading mode)
                    if self.mode == "paper_trading":
                        risk_eval = self._evaluate_risk(signal)
                        if risk_eval.get("approved"):
                            # Step 5: Execute trade
                            execution = self._execute_trade(signal, risk_eval)
                            results["approved_trades"].append(execution)
                        else:
                            results["rejected_trades"].append({
                                "symbol": symbol,
                                "reason": risk_eval.get("notes", "Risk rejected")
                            })
                            
            except Exception as e:
                results["errors"].append(f"{symbol}: {str(e)}")
                
        return results
    
    def _fetch_market_data(self, symbol: str) -> Optional[dict]:
        """Fetch OHLCV, fundamentals, and news for a symbol."""
        try:
            # Fetch OHLCV
            end_date = datetime.now()
            start_date = end_date.replace(day=end_date.day - 90)  # 90 days
            
            ohlcv_response = requests.post(
                f"{DATA_SERVICE_URL}/data/ohlcv",
                json={
                    "symbol": symbol,
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "interval": "1d"
                },
                timeout=30
            )
            
            if ohlcv_response.status_code != 200:
                return None
                
            ohlcv_data = ohlcv_response.json().get("data", [])
            
            # Fetch fundamentals
            fund_response = requests.post(
                f"{DATA_SERVICE_URL}/data/fundamentals",
                json={"symbol": symbol},
                timeout=30
            )
            fundamentals = fund_response.json().get("data", {}) if fund_response.status_code == 200 else {}
            
            # Fetch news
            news_response = requests.post(
                f"{DATA_SERVICE_URL}/data/news",
                json={"symbol": symbol, "window_days": 7},
                timeout=30
            )
            news = news_response.json().get("news", []) if news_response.status_code == 200 else []
            
            current_price = ohlcv_data[-1]["close"] if ohlcv_data else None
            
            return {
                "symbol": symbol,
                "ohlcv": ohlcv_data,
                "fundamentals": fundamentals,
                "news": news,
                "current_price": current_price
            }
            
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            return None
    
    def _compute_features(self, market_state: dict) -> dict:
        """Compute technical indicators."""
        try:
            response = requests.post(
                f"{FEATURE_SERVICE_URL}/features/indicators",
                json={
                    "symbol": market_state["symbol"],
                    "ohlcv": market_state["ohlcv"]
                },
                timeout=30
            )
            
            if response.status_code == 200:
                market_state["indicators"] = response.json().get("indicators", {})
                
            return market_state
            
        except Exception as e:
            print(f"Error computing features: {e}")
            return market_state
    
    def _generate_signal(self, market_state: dict) -> Optional[dict]:
        """Generate trading signal."""
        try:
            response = requests.post(
                f"{STRATEGY_SERVICE_URL}/strategy/rule_signal",
                json={
                    "symbol": market_state["symbol"],
                    "indicators": market_state.get("indicators", {}),
                    "current_price": market_state.get("current_price", 0)
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json().get("signal")
                
        except Exception as e:
            print(f"Error generating signal: {e}")
            
        return None
    
    def _evaluate_risk(self, signal: dict) -> dict:
        """Evaluate risk for a trade."""
        try:
            response = requests.post(
                f"{RISK_SERVICE_URL}/risk/evaluate",
                json={
                    "portfolio_value": self.portfolio_value,
                    "cash_available": self.cash_available,
                    "positions": [],
                    "candidate_trade": {
                        "symbol": signal["symbol"],
                        "side": signal["side"],
                        "quantity": 100,  # Default quantity
                        "entry_price": signal.get("entry_zone_min", 0),
                        "stop_loss": signal.get("stop_loss", 0),
                        "take_profit": signal.get("take_profit", 0),
                        "sector": None
                    },
                    "constraints": {}
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
                
        except Exception as e:
            print(f"Error evaluating risk: {e}")
            
        return {"approved": False, "notes": str(e)}
    
    def _execute_trade(self, signal: dict, risk_eval: dict) -> dict:
        """Execute a trade (paper trading)."""
        try:
            response = requests.post(
                f"{EXECUTION_SERVICE_URL}/execution/paper_order",
                json={
                    "symbol": signal["symbol"],
                    "side": signal["side"],
                    "quantity": risk_eval.get("approved_quantity", 100),
                    "order_type": "limit",
                    "price": signal.get("entry_zone_min"),
                    "is_paper": True
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
                
        except Exception as e:
            print(f"Error executing trade: {e}")
            
        return {"error": str(e)}


def run_analysis(symbols: list[str], mode: str = "research") -> dict:
    """
    Convenience function to run the trading pipeline.
    
    Args:
        symbols: List of stock symbols to analyze
        mode: "research" or "paper_trading"
        
    Returns:
        Analysis results
    """
    agent = FundManagerAgent(mode=mode)
    return agent.run_daily_pipeline(symbols)


if __name__ == "__main__":
    # Example usage
    print("Running trading pipeline for Nifty 50 stocks...")
    
    # Test with a few symbols
    symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
    
    results = run_analysis(symbols, mode="research")
    
    print(f"\n{'='*50}")
    print(f"Run ID: {results['run_id']}")
    print(f"Mode: {results['mode']}")
    print(f"Symbols analyzed: {results['symbols_analyzed']}")
    print(f"Signals generated: {len(results['signals'])}")
    print(f"Approved trades: {len(results['approved_trades'])}")
    print(f"Errors: {len(results['errors'])}")
    
    if results["signals"]:
        print(f"\nSignals:")
        for signal in results["signals"]:
            print(f"  {signal['symbol']}: {signal['side']} @ {signal.get('confidence', 0):.2%}")
