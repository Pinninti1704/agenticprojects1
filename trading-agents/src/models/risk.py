"""Risk management models."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Position(BaseModel):
    """Current portfolio position."""
    symbol: str
    quantity: float
    entry_price: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    
    # Risk metrics
    weight: float = 0.0  # % of portfolio
    sector: Optional[str] = None


class PortfolioRisk(BaseModel):
    """Portfolio-level risk metrics."""
    total_value: float
    cash_available: float
    positions: list[Position] = Field(default_factory=list)
    
    # Risk metrics
    total_exposure: float = 0.0
    net_exposure: float = 0.0
    gross_exposure: float = 0.0
    
    # Sector exposure
    sector_exposures: dict[str, float] = Field(default_factory=dict)
    
    # Risk limits
    max_position_size: float = 0.10  # 10% max per position
    max_sector_exposure: float = 0.30  # 30% max per sector
    max_leverage: float = 1.0  # No leverage by default
    
    # Calculated at
    calculated_at: datetime = Field(default_factory=datetime.now)


class RiskEvaluation(BaseModel):
    """Risk evaluation result for a trade."""
    approved: bool
    resize_required: bool = False
    original_quantity: float
    approved_quantity: float
    
    # Risk checks
    position_size_ok: bool = True
    sector_exposure_ok: bool = True
    daily_loss_limit_ok: bool = True
    leverage_ok: bool = True
    
    # Warnings
    warnings: list[str] = Field(default_factory=list)
    
    # Portfolio impact
    new_position_size: float = 0.0
    new_sector_exposure: float = 0.0
    new_total_exposure: float = 0.0
    
    # Notes
    notes: str = ""
    evaluated_at: datetime = Field(default_factory=datetime.now)


class RiskConstraints(BaseModel):
    """Risk constraints configuration."""
    # Position limits
    max_position_percent: float = 0.10  # 10% max per position
    max_sector_percent: float = 0.30  # 30% max per sector
    
    # Loss limits
    max_daily_loss_percent: float = 0.02  # 2% max daily loss
    max_drawdown_percent: float = 0.10  # 10% max drawdown
    
    # Leverage
    max_leverage: float = 1.0
    allow_shorting: bool = False
    
    # Position sizing
    default_position_size: float = 0.05  # 5% default
    min_position_size: float = 0.01  # 1% minimum
    max_positions: int = 20
    
    # Risk-reward
    min_risk_reward: float = 1.5  # Minimum 1.5:1 R/R
    
    # Stop loss
    default_stop_loss_percent: float = 0.05  # 5% default stop


class BacktestResult(BaseModel):
    """Backtest performance results."""
    # Period
    start_date: datetime
    end_date: datetime
    trading_days: int
    
    # Returns
    total_return: float
    total_return_percent: float
    cagr: float  # Compound Annual Growth Rate
    
    # Risk metrics
    volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    max_drawdown_percent: float
    
    # Trade statistics
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    avg_win: float
    avg_loss: float
    profit_factor: float
    
    # Position metrics
    avg_holding_period_days: float
    
    # Metadata
    strategy_name: str = ""
    universe: list[str] = Field(default_factory=list)
    parameters: dict = Field(default_factory=dict)
