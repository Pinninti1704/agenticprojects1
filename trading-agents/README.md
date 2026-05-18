# Multi-Agent Stock Trading System

A production-ready multi-agent stock trading research system based on the architecture from the attached specification.

## Architecture

This system implements the following layers:

1. **Orchestration** - FundManagerAgent coordinates the trading pipeline
2. **Agent Logic** - Specialized agents for data, features, analysis, signals, risk, execution
3. **Services** - FastAPI microservices for data, features, strategy, risk, execution
4. **Storage** - DuckDB for prices, features, signals, trades

## Project Structure

```
trading-agents/
├── src/
│   ├── models/          # Data models (MarketState, Signals, Risk)
│   ├── services/        # FastAPI microservices
│   │   ├── data_service.py      # OHLCV, fundamentals, news
│   │   ├── feature_service.py   # Technical indicators
│   │   ├── strategy_service.py  # Signal generation
│   │   ├── risk_service.py      # Risk evaluation
│   │   └── execution_service.py # Paper trading
│   └── agents/
│       └── fund_manager.py      # Main orchestrator
├── config/              # Configuration files
├── notebooks/           # Jupyter notebooks for research
├── tests/               # Test files
├── docker-compose.yml   # Docker orchestration
├── Dockerfile.service   # Service container
└── requirements.txt     # Python dependencies
```

## Quick Start

### Option 1: Run services individually (development)

```bash
# Install dependencies
pip install -r requirements.txt

# Start each service in separate terminals
python -m uvicorn src.services.data_service:app --port 8001
python -m uvicorn src.services.feature_service:app --port 8002
python -m uvicorn src.services.strategy_service:app --port 8003
python -m uvicorn src.services.risk_service:app --port 8004
python -m uvicorn src.services.execution_service:app --port 8005

# Run the trading pipeline
python -m src.agents.fund_manager
```

### Option 2: Docker Compose

```bash
docker-compose up --build
```

## API Endpoints

### Data Service (port 8001)
- `POST /data/ohlcv` - Fetch OHLCV data
- `POST /data/fundamentals` - Fetch fundamentals
- `POST /data/news` - Fetch news

### Feature Service (port 8002)
- `POST /features/indicators` - Compute technical indicators
- `POST /features/factors` - Compute factor scores
- `POST /features/sentiment` - Compute sentiment features

### Strategy Service (port 8003)
- `POST /strategy/rule_signal` - Generate rule-based signals
- `POST /strategy/backtest` - Run backtests

### Risk Service (port 8004)
- `POST /risk/evaluate` - Evaluate trade risk
- `POST /risk/portfolio` - Compute portfolio risk

### Execution Service (port 8005)
- `POST /execution/paper_order` - Submit paper trade
- `GET /execution/orders` - List orders
- `POST /execution/log_trade` - Log trade

## Usage Example

```python
from src.agents.fund_manager import run_analysis

# Run analysis on stocks
symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
results = run_analysis(symbols, mode="research")

print(f"Signals: {len(results['signals'])}")
for signal in results['signals']:
    print(f"  {signal['symbol']}: {signal['side']} @ {signal['confidence']:.2%}")
```

## Modes

- **research**: Generates signals and logs but does not submit orders
- **paper_trading**: Submits to paper trading API only

## Agent Roles

1. **MarketDataAgent** - Fetches market data
2. **FeatureEngineerAgent** - Computes indicators
3. **TechnicalAnalystAgent** - Technical analysis
4. **FundamentalAnalystAgent** - Fundamental analysis
5. **NewsSentimentAgent** - Sentiment analysis
6. **SignalEngineerAgent** - Generates trade signals
7. **RiskManagerAgent** - Risk evaluation
8. **ExecutionAgent** - Trade execution
9. **FundManagerAgent** - Orchestrates the pipeline

## Safety

- Paper trading only by default
- Risk limits enforced (position size, sector exposure, etc.)
- All trades logged for backtesting
