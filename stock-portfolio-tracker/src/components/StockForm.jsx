import { useState, useEffect } from 'react'
import './StockForm.css'

function StockForm({ onAddStock, loading, error, searchSymbol, setSearchSymbol, availableSymbols }) {
  const [shares, setShares] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!selectedSymbol && !searchSymbol) {
      alert('Please enter a stock symbol')
      return
    }

    if (!shares || !buyPrice) {
      alert('Please enter both shares and buy price')
      return
    }

    const symbolToUse = selectedSymbol || searchSymbol
    onAddStock(symbolToUse, shares, buyPrice)

    // Reset form
    setShares('')
    setBuyPrice('')
    setSearchSymbol('')
    setSelectedSymbol('')
  }

  // Filter suggestions based on input
  useEffect(() => {
    if (searchSymbol.length === 0) {
      setSuggestions([])
      return
    }

    const filtered = availableSymbols
      .filter(s => s.toUpperCase().startsWith(searchSymbol.toUpperCase()))
      .slice(0, 5)
    setSuggestions(filtered)
  }, [searchSymbol, availableSymbols])

  const selectSuggestion = (symbol) => {
    setSearchSymbol(symbol)
    setSelectedSymbol(symbol)
    setSuggestions([])
  }

  return (
    <div className="stock-form-container">
      <form onSubmit={handleSubmit} className="stock-form">
        <h2>📊 Add Stock Transaction</h2>

        <div className="form-group">
          <label htmlFor="symbol">Stock Symbol</label>
          <input
            type="text"
            id="symbol"
            value={searchSymbol}
            onChange={(e) => {
              setSearchSymbol(e.target.value)
              setSelectedSymbol('')
            }}
            placeholder="e.g., AAPL, MSFT, TSLA"
            required
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map(symbol => (
                <li
                  key={symbol}
                  onClick={() => selectSuggestion(symbol)}
                >
                  {symbol}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="shares">Shares</label>
            <input
              type="number"
              id="shares"
              step="0.01"
              min="0.01"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="e.g., 10"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Purchase Price ($)</label>
            <input
              type="number"
              id="price"
              step="0.01"
              min="0.01"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="e.g., 150.25"
              required
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="add-button"
          disabled={loading}
        >
          {loading ? 'Adding...' : selectedSymbol ? 'Add Another Transaction' : 'Add Stock'}
        </button>
      </form>
    </div>
  )
}

export default StockForm
