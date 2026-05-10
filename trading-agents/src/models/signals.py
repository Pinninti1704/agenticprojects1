"""Trade signal and decision models."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


class TradeSide(str, Enum):
    """Trade direction."""
    LONG = "long"
    SHORT = "short"


class SignalSource(str, Enum):
    """Source of the trading signal."""
    TECHNICAL = "technical"
    FUNDAMENTAL = "sentiment"
    COMBINED = "combined"
    ML_MODEL = "ml_model"
    RULE_BASED = "rule_based"


class TradeSignal(BaseModel):
    """A candidate trade signal."""
    symbol: str
    side: TradeSide
    confidence: float = Field(ge=0, le=1)
    expected_horizon_days: int = Field(ge=1, le=365)
    rationale: str
    
    # Entry/exit zones
    entry_zone_min: float
    entry_zone_max: float
    stop_loss: float
    take_profit: float
    
    # Metadata
    source: SignalSource = SignalSource.COMBINED
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    
    # Risk metrics
    risk_reward_ratio: Optional[float] = None
    position_size_percent: Optional[float] = None
    
    # Agent outputs
    technical_rationale: Optional[str] = None
    fundamental_rationale: Optional[str] = None
    sentiment_rationale: Optional[str] = None


class PortfolioProposal(BaseModel):
    """Collection of candidate trades before risk filtering."""
    signals: list[TradeSignal] = Field(default_factory=list)
    total_capital_required: float = 0.0
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Metadata
    universe: list[str] = Field(default_factory=list)
    analysis_period: str = ""


class TradeDecision(BaseModel):
    """Final approved trade after risk review."""
    signal: TradeSignal
    
    # Approved sizing
    approved_quantity: float
    approved_entry_price: float
    approved_stop_loss: float
    approved_take_profit: float
    
    # Status
    status: str = "pending"  # pending, submitted, filled, cancelled, rejected
    execution_id: Optional[str] = None
    
    # Timestamps
    approved_at: datetime = Field(default_factory=datetime.now)
    submitted_at: Optional[datetime] = None
    filled_at: Optional[datetime] = None
    
    # Risk review
    risk_approved: bool = True
    risk_notes: str = ""


class ExecutionOrder(BaseModel):
    """Order to be submitted for execution."""
    order_id: Optional[str] = None
    symbol: str
    side: TradeSide
    quantity: float
    order_type: str = "limit"  # market, limit, stop
    price: Optional[float] = None
    stop_price: Optional[float] = None
    
    # Status
    status: str = "pending"
    filled_price: Optional[float] = None
    filled_quantity: float = 0.0
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    submitted_at: Optional[datetime] = None
    filled_at: Optional[datetime] = None
    
    # Mode
    is_paper: bool = True  # Paper trading vs real


class TradeLog(BaseModel):
    """Complete log of a trade for record keeping."""
    trade_id: str
    symbol: str
    side: TradeSide
    quantity: float
    entry_price: float
    exit_price: Optional[float] = None
    
    # P&L
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None
    
    # Timestamps
    entry_date: datetime
    exit_date: Optional[datetime] = None
    holding_period_days: Optional[int] = None
    
    # Decision trail
    signal: Optional[TradeSignal] = None
    decision: Optional[TradeDecision] = None
    execution: Optional[ExecutionOrder] = None
    
    # Notes
    notes: str = ""
