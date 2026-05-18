import './StockList.css'

function StockList({ stocks, stockData, onSell, getStockInfo }) {
  return (
    <div className="stock-list-container">
      <h2>📋 Your Holdings ({stocks.length})</h2>

      <div className="stock-list">
        {stocks.map((stock, index) => {
          // Use stockData prop for latest prices, fallback to stock's cached data
          const stockInfo = stockData?.[stock.symbol] || getStockInfo(stock.symbol)

          if (!stockInfo) return null

          const currentValue = stockInfo.price * stock.shares
          const costBasis = stock.avgPrice * stock.shares
          const gainLoss = currentValue - costBasis
          const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0

          return (
            <div key={index} className="stock-item">
              <div className="stock-header">
                <div className="stock-symbol">{stock.symbol}</div>
                <div className="stock-name">{stock.name}</div>
                <button
                  className="sell-button"
                  onClick={() => onSell(index)}
                  title="Remove this stock from portfolio"
                >
                  ✕
                </button>
              </div>

              <div className="stock-details">
                <div className="detail-row">
                  <span className="label">Shares:</span>
                  <span className={`value ${gainLoss >= 0 ? 'positive' : 'negative'}`}>{stock.shares.toFixed(2)}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Avg. Price:</span>
                  <span className="value">${stock.avgPrice.toFixed(2)}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Current Price:</span>
                  <span className="value">${stockInfo.price.toFixed(2)}</span>
                  <span className={`change ${stockInfo.change >= 0 ? 'positive' : 'negative'}`}>
                    {stockInfo.change >= 0 ? '▲' : '▼'} ${Math.abs(stockInfo.change).toFixed(2)} ({Math.abs(stockInfo.changePercent).toFixed(2)}%)
                  </span>
                </div>

                <div className="detail-row">
                  <div className="separator"></div>
                </div>

                <div className="detail-row">
                  <span className="label">Cost Basis:</span>
                  <span className="value">${costBasis.toFixed(2)}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Current Value:</span>
                  <span className={`value current-value ${gainLoss >= 0 ? 'positive' : 'negative'}`}>
                    ${currentValue.toFixed(2)}
                  </span>
                </div>

                <div className={`gain-loss ${gainLoss >= 0 ? 'positive' : 'negative'}`}>
                  {gainLoss >= 0 ? '📈 ' : '📉 '}
                  {gainLoss >= 0 ? 'Gain' : 'Loss'}:
                  <span className="amount">${gainLoss.toFixed(2)}</span>
                  ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                </div>

                <div className="date-info">
                  <small>Added: {new Date(stock.dateAdded).toLocaleDateString()}</small>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StockList
