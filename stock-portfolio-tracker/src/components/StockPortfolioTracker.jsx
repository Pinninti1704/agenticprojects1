import { useState, useEffect, useCallback } from 'react'
import StockForm from './StockForm.jsx'
import StockList from './StockList.jsx'
import PortfolioSummary from './PortfolioSummary.jsx'
import './StockPortfolioTracker.css'

// CORS proxy to bypass browser restrictions
const CORS_PROXY = 'https://corsproxy.io/?'

// Free stock API - using Yahoo Finance with CORS proxy
const fetchStockQuote = async (symbol) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0]
      const meta = result.meta
      
      return {
        name: meta.shortName || meta.symbol,
        price: meta.regularMarketPrice || 0,
        change: meta.regularMarketChange || 0,
        changePercent: meta.regularMarketChangePercent || 0,
        previousClose: meta.previousClose || meta.chartPreviousClose || 0,
        open: meta.regularMarketOpen || 0,
        high: meta.regularMarketDayHigh || 0,
        low: meta.regularMarketDayLow || 0,
        volume: meta.regularMarketVolume || 0
      }
    }
    return null
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error)
    return null
  }
}

// Fetch multiple stocks at once
const fetchMultipleStocks = async (symbols) => {
  const results = {}
  await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await fetchStockQuote(symbol)
      if (quote) {
        results[symbol.toUpperCase()] = quote
      }
    })
  )
  return results
}

// Default stocks categorized by sector (Top 10 across different sectors)
const defaultStocks = [
  // Technology
  'AAPL',   // Apple - Consumer Electronics
  'MSFT',   // Microsoft - Software
  'NVDA',   // NVIDIA - Semiconductors
  // Finance
  'JPM',    // JPMorgan Chase - Banking
  'V',      // Visa - Payments
  // Healthcare
  'JNJ',    // Johnson & Johnson - Pharmaceuticals
  'UNH',    // UnitedHealth - Health Insurance
  // Consumer
  'AMZN',   // Amazon - E-commerce
  'WMT',    // Walmart - Retail
  // Energy
  'XOM'     // Exxon Mobil - Oil & Gas
]

// Sector mapping for display
const stockSectors = {
  'AAPL': 'Technology',
  'MSFT': 'Technology',
  'NVDA': 'Technology',
  'JPM': 'Finance',
  'V': 'Finance',
  'JNJ': 'Healthcare',
  'UNH': 'Healthcare',
  'AMZN': 'Consumer',
  'WMT': 'Consumer',
  'XOM': 'Energy'
}

function StockPortfolioTracker() {
  const [stocks, setStocks] = useState([])
  const [stockData, setStockData] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetchingQuotes, setFetchingQuotes] = useState(false)
  const [error, setError] = useState(null)
  const [searchSymbol, setSearchSymbol] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch stock quotes
  const refreshQuotes = useCallback(async (symbolsToFetch = null) => {
    const symbols = symbolsToFetch || [...new Set(stocks.map(s => s.symbol))]
    
    if (symbols.length === 0) return
    
    setFetchingQuotes(true)
    try {
      const quotes = await fetchMultipleStocks(symbols)
      setStockData(prev => ({ ...prev, ...quotes }))
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error refreshing quotes:', err)
    } finally {
      setFetchingQuotes(false)
    }
  }, [stocks])

  // Initial load - fetch default stocks
  useEffect(() => {
    const loadDefaultStocks = async () => {
      setLoading(true)
      try {
        const quotes = await fetchMultipleStocks(defaultStocks)
        setStockData(quotes)
        setLastUpdated(new Date())
      } catch (err) {
        setError('Failed to load stock data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadDefaultStocks()
  }, [])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (stocks.length > 0) {
        refreshQuotes()
      }
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [stocks, refreshQuotes])

  const handleAddStock = async (symbol, shares, buyPrice) => {
    setLoading(true)
    setError(null)

    const upperSymbol = symbol.toUpperCase()
    
    // Fetch the stock quote
    const quote = await fetchStockQuote(upperSymbol)
    
    if (!quote) {
      setError(`Could not find stock "${symbol}". Please check the symbol and try again.`)
      setLoading(false)
      return
    }

    const newStock = {
      symbol: upperSymbol,
      name: quote.name,
      shares: parseFloat(shares),
      avgPrice: parseFloat(buyPrice),
      currentPrice: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      dateAdded: new Date().toISOString()
    }

    // Check if stock already exists
    const existsIndex = stocks.findIndex(s => s.symbol === newStock.symbol)
    let updatedStocks

    if (existsIndex >= 0) {
      const existingStock = stocks[existsIndex]
      const totalShares = existingStock.shares + newStock.shares
      const totalValue = (existingStock.avgPrice * existingStock.shares) + (newStock.avgPrice * newStock.shares)
      const newAvgPrice = totalValue / totalShares

      updatedStocks = [...stocks]
      updatedStocks[existsIndex] = {
        ...existingStock,
        shares: totalShares,
        avgPrice: newAvgPrice,
        dateAdded: new Date().toISOString()
      }
    } else {
      updatedStocks = [...stocks, newStock]
    }

    setStocks(updatedStocks)
    setStockData(prev => ({ ...prev, [upperSymbol]: quote }))
    setSearchSymbol('')
    setLoading(false)
  }

  const handleSellStock = (index) => {
    const updatedStocks = [...stocks]
    updatedStocks.splice(index, 1)
    setStocks(updatedStocks)
  }

  const handleRefresh = () => {
    refreshQuotes()
  }

  const calculatePortfolioValue = () => {
    return stocks.reduce((total, stock) => {
      const quote = stockData[stock.symbol]
      const price = quote?.price || stock.currentPrice
      return total + (price * stock.shares)
    }, 0)
  }

  const calculatePortfolioCost = () => {
    return stocks.reduce((total, stock) => {
      return total + (stock.avgPrice * stock.shares)
    }, 0)
  }

  const calculateTotalGainLoss = () => {
    const value = calculatePortfolioValue()
    const cost = calculatePortfolioCost()
    return value - cost
  }

  const calculateTotalGainLossPercent = () => {
    const value = calculatePortfolioValue()
    const cost = calculatePortfolioCost()
    return cost > 0 ? ((value - cost) / cost) * 100 : 0
  }

  const getStockBySymbol = (symbol) => {
    return stockData[symbol.toUpperCase()] || null
  }

  return (
    <div className="stock-tracker-container">
      <header className="portfolio-header">
        <div className="header-content">
          <div>
            <h1>📈 Stock Portfolio Tracker</h1>
            <p>Track your stock investments in real-time</p>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn" 
              onClick={handleRefresh}
              disabled={fetchingQuotes}
            >
              {fetchingQuotes ? '⟳ Updating...' : '🔄 Refresh'}
            </button>
            {lastUpdated && (
              <span className="last-updated">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      {loading && <div className="loading-overlay">Loading stock data...</div>}
      
      {error && <div className="error-message">{error}</div>}

      {!stocks.length ? (
        <div className="empty-portfolio">
          <p className="empty-message">Your portfolio is empty. Add stocks to get started!</p>
          <div className="market-overview">
            <h3>Market Overview - Top 10 Stocks by Sector</h3>
            
            {/* Group stocks by sector */}
            {['Technology', 'Finance', 'Healthcare', 'Consumer', 'Energy'].map(sector => {
              const sectorStocks = defaultStocks.filter(s => stockSectors[s] === sector)
              if (sectorStocks.length === 0) return null
              
              return (
                <div key={sector} className="sector-group">
                  <h4 className="sector-title">{sector}</h4>
                  <div className="market-stocks">
                    {sectorStocks.map(symbol => {
                      const quote = stockData[symbol]
                      return (
                        <div key={symbol} className="market-stock">
                          <span className="stock-symbol">{symbol}</span>
                          <span className="stock-price">${quote?.price?.toFixed(2) || '—'}</span>
                          <span className={`stock-change ${quote?.change >= 0 ? 'positive' : 'negative'}`}>
                            {quote ? `${quote.change >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%` : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="portfolio-all">
          <PortfolioSummary
            totalValue={calculatePortfolioValue()}
            totalCost={calculatePortfolioCost()}
            gainLoss={calculateTotalGainLoss()}
            gainLossPercent={calculateTotalGainLossPercent()}
            stockCount={stocks.length}
          />

          <StockList
            stocks={stocks}
            stockData={stockData}
            onSell={handleSellStock}
            getStockInfo={getStockBySymbol}
          />
        </div>
      )}

      <StockForm
        onAddStock={handleAddStock}
        loading={loading}
        error={error}
        searchSymbol={searchSymbol}
        setSearchSymbol={setSearchSymbol}
        availableSymbols={Object.keys(stockData)}
      />

      <div className="disclaimer">
        <p><small>📊 Real-time data from Yahoo Finance. Auto-refreshes every 60 seconds.</small></p>
      </div>
    </div>
  )
}

export default StockPortfolioTracker
