"""Risk management service for evaluating and constraining trades."""

from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np


app = FastAPI(title="Risk Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PositionInput(BaseModel):
    """Position input for risk calculation."""
    symbol: str
    quantity: float
    entry_price: float
    current_price: float
    sector: Optional[str] = None


class TradeInput(BaseModel):
    """Trade candidate for risk evaluation."""
    symbol: str
    side: str  # long, short
    quantity: float
    entry_price: float
    stop_loss: float
    take_profit: float
    sector: Optional[str] = None


class RiskEvaluationRequest(BaseModel):
    """Request for risk evaluation."""
    portfolio_value: float
    cash_available: float
    positions: list[PositionInput] = Field(default_factory=list)
    candidate_trade: TradeInput
    constraints: dict = Field(default_factory=dict)


class RiskEvaluationResponse(BaseModel):
    """Risk evaluation response."""
    approved: bool
    resize_required: bool = False
    original_quantity: float
    approved_quantity: float
    position_size_ok: bool
    sector_exposure_ok: bool
    daily_loss_limit_ok: bool
    leverage_ok: bool
    warnings: list[str] = Field(default_factory=list)
    notes: str = ""


def calculate_portfolio_risk(
    portfolio_value: float,
    positions: list[PositionInput],
    candidate: TradeInput,
    constraints: dict
) -> RiskEvaluationResponse:
    """Evaluate risk for a candidate trade."""
    
    # Get constraints with defaults
    max_position_percent = constraints.get("max_position_percent", 0.10)
    max_sector_percent = constraints.get("max_sector_percent", 0.30)
    max_daily_loss_percent = constraints.get("max_daily_loss_percent", 0.02)
    min_risk_reward = constraints.get("min_risk_reward", 1.5)
    
    # Calculate current positions
    current_positions_value = sum(p.quantity * p.current_price for p in positions)
    current_exposure = current_positions_value / portfolio_value if portfolio_value > 0 else 0
    
    # Calculate candidate trade value
    trade_value = candidate.quantity * candidate.entry_price
    new_position_percent = trade_value / portfolio_value if portfolio_value > 0 else 0
    
    # Check position size
    position_size_ok = new_position_percent <= max_position_percent
    if not position_size_ok:
        # Resize to max allowed
        approved_quantity = (portfolio_value * max_position_percent) / candidate.entry_price
        resize_required = True
    else:
        approved_quantity = candidate.quantity
        resize_required = False
    
    # Check sector exposure
    sector_exposure_ok = True
    new_sector_exposure = current_exposure
    if candidate.sector:
        sector_positions = [p for p in positions if p.sector == candidate.sector]
        sector_value = sum(p.quantity * p.current_price for p in sector_positions)
        sector_value += approved_quantity * candidate.entry_price
        new_sector_exposure = sector_value / portfolio_value if portfolio_value > 0 else 0
        sector_exposure_ok = new_sector_exposure <= max_sector_percent
    
    # Check risk-reward
    risk_reward_ok = True
    if candidate.side == "long":
        risk = candidate.entry_price - candidate.stop_loss
        reward = candidate.take_profit - candidate.entry_price
    else:
        risk = candidate.stop_loss - candidate.entry_price
        reward = candidate.entry_price - candidate.take_profit
    
    if risk > 0:
        risk_reward = reward / risk
        if risk_reward < min_risk_reward:
            risk_reward_ok = False
    
    # Check cash availability
    cash_ok = trade_value <= (portfolio_value - current_positions_value + candidate.quantity * candidate.entry_price)
    
    # Generate warnings
    warnings = []
    if not position_size_ok:
        warnings.append(f"Position size exceeds {max_position_percent*100}% limit")
    if not sector_exposure_ok:
        warnings.append(f"Sector exposure exceeds {max_sector_percent*100}% limit")
    if not risk_reward_ok:
        warnings.append(f"Risk-reward ratio below {min_risk_reward}:1 minimum")
    if not cash_ok:
        warnings.append("Insufficient cash for trade")
    
    # Determine approval
    approved = position_size_ok and sector_exposure_ok and risk_reward_ok and cash_ok
    
    # Build notes
    notes = f"Position: {new_position_percent*100:.1f}% of portfolio. "
    notes += f"Sector: {new_sector_exposure*100:.1f}%. "
    if risk_reward_ok:
        notes += f"Risk-reward: {risk_reward:.2f}:1"
    
    return RiskEvaluationResponse(
        approved=approved,
        resize_required=resize_required,
        original_quantity=candidate.quantity,
        approved_quantity=approved_quantity,
        position_size_ok=position_size_ok,
        sector_exposure_ok=sector_exposure_ok,
        daily_loss_limit_ok=True,  # Placeholder
        leverage_ok=True,  # No leverage by default
        warnings=warnings,
        notes=notes
    )


@app.get("/")
def root():
    return {"service": "risk", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/risk/evaluate", response_model=RiskEvaluationResponse)
async def evaluate_risk(request: RiskEvaluationRequest):
    """Evaluate risk for a candidate trade."""
    try:
        result = calculate_portfolio_risk(
            request.portfolio_value,
            request.positions,
            request.candidate_trade,
            request.constraints
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/risk/portfolio")
async def compute_portfolio_risk(request: dict):
    """Compute overall portfolio risk metrics."""
    # Placeholder for portfolio risk computation
    return {
        "total_value": 0,
        "total_exposure": 0,
        "net_exposure": 0,
        "sector_exposures": {},
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
