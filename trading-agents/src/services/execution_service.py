"""Execution service for paper trading and order management."""

from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uuid


app = FastAPI(title="Execution Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory order storage (would be DB in production)
orders_db = {}
trades_db = {}


class OrderRequest(BaseModel):
    """Request to submit an order."""
    symbol: str
    side: str  # long, short
    quantity: float
    order_type: str = "limit"  # market, limit
    price: Optional[float] = None
    stop_price: Optional[float] = None
    is_paper: bool = True


class OrderResponse(BaseModel):
    """Order submission response."""
    order_id: str
    status: str
    symbol: str
    side: str
    quantity: float
    price: Optional[float]
    created_at: str
    is_paper: bool


class TradeLogRequest(BaseModel):
    """Request to log a trade."""
    trade_id: str
    symbol: str
    side: str
    quantity: float
    entry_price: float
    exit_price: Optional[float] = None
    pnl: Optional[float] = None
    notes: str = ""


class TradeLogResponse(BaseModel):
    """Trade log response."""
    trade_id: str
    logged_at: str


@app.get("/")
def root():
    return {"service": "execution", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/execution/paper_order", response_model=OrderResponse)
async def submit_paper_order(request: OrderRequest):
    """Submit a paper trading order."""
    try:
        # Generate order ID
        order_id = f"PAPER-{uuid.uuid4().hex[:8].upper()}"
        
        # Create order
        order = {
            "order_id": order_id,
            "status": "pending",
            "symbol": request.symbol,
            "side": request.side,
            "quantity": request.quantity,
            "order_type": request.order_type,
            "price": request.price,
            "stop_price": request.stop_price,
            "is_paper": request.is_paper,
            "created_at": datetime.now().isoformat(),
            "submitted_at": None,
            "filled_at": None,
        }
        
        # Store order
        orders_db[order_id] = order
        
        # Simulate order execution (in production, this would connect to broker)
        # For paper trading, we immediately fill limit orders at requested price
        if request.order_type == "limit" and request.price:
            order["status"] = "filled"
            order["filled_price"] = request.price
            order["filled_quantity"] = request.quantity
            order["submitted_at"] = datetime.now().isoformat()
            order["filled_at"] = datetime.now().isoformat()
        elif request.order_type == "market":
            # Market orders fill at current price (would fetch in production)
            order["status"] = "filled"
            order["filled_price"] = request.price or 0  # Would fetch real price
            order["filled_quantity"] = request.quantity
            order["submitted_at"] = datetime.now().isoformat()
            order["filled_at"] = datetime.now().isoformat()
        
        return OrderResponse(
            order_id=order["order_id"],
            status=order["status"],
            symbol=order["symbol"],
            side=order["side"],
            quantity=order["quantity"],
            price=order.get("filled_price") or order.get("price"),
            created_at=order["created_at"],
            is_paper=order["is_paper"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/execution/order/{order_id}")
async def get_order(order_id: str):
    """Get order status."""
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders_db[order_id]


@app.get("/execution/orders")
async def list_orders():
    """List all orders."""
    return list(orders_db.values())


@app.post("/execution/log_trade", response_model=TradeLogResponse)
async def log_trade(request: TradeLogRequest):
    """Log a trade for record keeping."""
    try:
        trade = {
            "trade_id": request.trade_id,
            "symbol": request.symbol,
            "side": request.side,
            "quantity": request.quantity,
            "entry_price": request.entry_price,
            "exit_price": request.exit_price,
            "pnl": request.pnl,
            "notes": request.notes,
            "logged_at": datetime.now().isoformat(),
        }
        
        trades_db[request.trade_id] = trade
        
        return TradeLogResponse(
            trade_id=request.trade_id,
            logged_at=trade["logged_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/execution/trades")
async def list_trades():
    """List all trades."""
    return list(trades_db.values())


@app.get("/execution/trade/{trade_id}")
async def get_trade(trade_id: str):
    """Get trade details."""
    if trade_id not in trades_db:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trades_db[trade_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
