import './PortfolioSummary.css'

function PortfolioSummary({ totalValue, totalCost, gainLoss, gainLossPercent, stockCount }) {
  const isPositive = gainLoss >= 0

  return (
    <div className="portfolio-summary-container">
      <h2>💼 Portfolio Summary ({stockCount})</h2>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-title">Total Cost Basis</div>
          <div className="card-value">${totalCost.toFixed(2)}</div>
        </div>

        <div className="summary-card" style={{ backgroundColor: isPositive ? '#e8f5e9' : '#ffebee' }}>
          <div className="card-title">Current Value</div>
          <div className={`card-value ${isPositive ? 'positive' : 'negative'}`}>
            ${totalValue.toFixed(2)}
          </div>
        </div>

        <div className="summary-card large-success" style={{ backgroundColor: isPositive ? '#e8f5e9' : '#ffebee' }}>
          <div className="card-title">Unrealized {isPositive ? 'Gain' : 'Loss'}</div>
          <div className={`card-value ${isPositive ? 'positive' : 'negative'}`}>
            ${gainLoss.toFixed(2)}
            <div className="percentage">({isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioSummary
