import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Shield,
  Wallet,
  BarChart3,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Target,
  AlertTriangle,
  Clock,
  Zap,
  Search,
  Settings,
  Bell
} from 'lucide-react'

// Service URLs
const DATA_SERVICE_URL = 'http://localhost:8001'
const FEATURE_SERVICE_URL = 'http://localhost:8002'
const STRATEGY_SERVICE_URL = 'http://localhost:8003'
const RISK_SERVICE_URL = 'http://localhost:8004'
const EXECUTION_SERVICE_URL = 'http://localhost:8005'
const AGENT_SERVICE_URL = 'http://localhost:8006'

// Default watchlist symbols
const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM']

// Sample data for demo when services are unavailable
const generateSampleData = (symbol) => {
  const data = []
  let basePrice = 100 + Math.random() * 200
  const now = new Date()
  
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    const change = (Math.random() - 0.5) * 4
    basePrice = Math.max(basePrice + change, 10)
    
    const open = basePrice + (Math.random() - 0.5) * 2
    const close = basePrice + (Math.random() - 0.5) * 2
    const high = Math.max(open, close) + Math.random() * 2
    const low = Math.min(open, close) - Math.random() * 2
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      sma20: null,
      sma50: null,
      ema12: null,
      ema26: null,
      rsi: 50 + (Math.random() - 0.5) * 40,
      macd: (Math.random() - 0.5) * 5,
      macdSignal: (Math.random() - 0.5) * 5,
      bbUpper: basePrice * 1.03,
      bbMiddle: basePrice,
      bbLower: basePrice * 0.97
    })
  }
  
  // Calculate SMAs
  for (let i = 19; i < data.length; i++) {
    const sum = data.slice(i - 19, i + 1).reduce((a, b) => a + b.close, 0)
    data[i].sma20 = parseFloat((sum / 20).toFixed(2))
  }
  
  for (let i = 49; i < data.length; i++) {
    const sum = data.slice(i - 49, i + 1).reduce((a, b) => a + b.close, 0)
    data[i].sma50 = parseFloat((sum / 50).toFixed(2))
  }
  
  return data
}

// Calculate current indicators from data
const calculateIndicators = (data) => {
  if (!data || data.length === 0) return null
  
  const latest = data[data.length - 1]
  const prev = data.length > 1 ? data[data.length - 2] : null
  
  const priceChange = prev ? latest.close - prev.close : 0
  const priceChangePercent = prev ? (priceChange / prev.close) * 100 : 0
  
  return {
    price: latest.close,
    change: priceChange,
    changePercent: priceChangePercent,
    volume: latest.volume,
    sma20: latest.sma20,
    sma50: latest.sma50,
    ema12: latest.ema12,
    ema26: latest.ema26,
    rsi: latest.rsi,
    macd: latest.macd,
    macdSignal: latest.macdSignal,
    bbUpper: latest.bbUpper,
    bbMiddle: latest.bbMiddle,
    bbLower: latest.bbLower,
    high90: Math.max(...data.map(d => d.high)),
    low90: Math.min(...data.map(d => d.low)),
    avgVolume: data.slice(-20).reduce((a, b) => a + b.volume, 0) / 20
  }
}

// Generate trading signals based on indicators
const generateSignals = (indicators) => {
  if (!indicators) return []
  
  const signals = []
  
  // RSI signals
  if (indicators.rsi < 30) {
    signals.push({ type: 'buy', name: 'RSI Oversold', value: indicators.rsi.toFixed(1), confidence: 85 })
  } else if (indicators.rsi > 70) {
    signals.push({ type: 'sell', name: 'RSI Overbought', value: indicators.rsi.toFixed(1), confidence: 85 })
  }
  
  // MACD signals
  if (indicators.macd > indicators.macdSignal) {
    signals.push({ type: 'buy', name: 'MACD Bullish', value: indicators.macd.toFixed(2), confidence: 70 })
  } else if (indicators.macd < indicators.macdSignal) {
    signals.push({ type: 'sell', name: 'MACD Bearish', value: indicators.macd.toFixed(2), confidence: 70 })
  }
  
  // SMA crossover signals
  if (indicators.sma20 && indicators.sma50) {
    if (indicators.sma20 > indicators.sma50) {
      signals.push({ type: 'buy', name: 'SMA Golden Cross', value: `${indicators.sma20}/${indicators.sma50}`, confidence: 75 })
    } else {
      signals.push({ type: 'sell', name: 'SMA Death Cross', value: `${indicators.sma20}/${indicators.sma50}`, confidence: 75 })
    }
  }
  
  // Bollinger Band signals
  if (indicators.price < indicators.bbLower) {
    signals.push({ type: 'buy', name: 'BB Lower Band', value: indicators.bbLower.toFixed(2), confidence: 80 })
  } else if (indicators.price > indicators.bbUpper) {
    signals.push({ type: 'sell', name: 'BB Upper Band', value: indicators.bbUpper.toFixed(2), confidence: 80 })
  }
  
  return signals
}

// Calculate position size based on risk management
const calculatePositionSize = (accountValue, riskPercent, entryPrice, stopLoss) => {
  const riskAmount = accountValue * (riskPercent / 100)
  const riskPerShare = Math.abs(entryPrice - stopLoss)
  if (riskPerShare === 0) return 0
  return Math.floor(riskAmount / riskPerShare)
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      // Safely extract error message - handle objects or strings
      let errorMessage = 'An unexpected error occurred'
      try {
        const err = this.state.error
        if (err) {
          if (typeof err.message === 'string') {
            errorMessage = err.message
          } else if (typeof err === 'string') {
            errorMessage = err
          } else if (err.detail) {
            // FastAPI error format
            errorMessage = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)
          } else {
            errorMessage = JSON.stringify(err)
          }
        }
      } catch (e) {
        errorMessage = 'Error details unavailable'
      }
      
      return (
        <div style={{ padding: 20, color: 'red', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{errorMessage}</pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 20, padding: '10px 20px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Main App Component
function App() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [marketData, setMarketData] = useState({})
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST)
  const [chartTimeframe, setChartTimeframe] = useState('3M')
  const [loading, setLoading] = useState(false)
  const [servicesConnected, setServicesConnected] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [signals, setSignals] = useState([])
  const [portfolio, setPortfolio] = useState({
    cash: 100000,
    positions: [],
    totalValue: 100000,
    totalPnL: 0
  })
  const [tradeForm, setTradeForm] = useState({
    quantity: 10,
    orderType: 'market'
  })
  const [showChartIndicator, setShowChartIndicator] = useState('price')
  const initialDataLoaded = useRef(false)
  
  // Check service connectivity
  useEffect(() => {
    const checkServices = async () => {
      try {
        const response = await fetch(`${DATA_SERVICE_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        })
        setServicesConnected(response.ok)
      } catch {
        setServicesConnected(false)
      }
    }
    checkServices()
    const interval = setInterval(checkServices, 30000)
    return () => clearInterval(interval)
  }, [])
  
  // Fetch market data for selected symbol
  const fetchMarketData = useCallback(async (symbol) => {
    setLoading(true)
    try {
      if (servicesConnected) {
        // Try to fetch from data service
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        const response = await fetch(`${DATA_SERVICE_URL}/data/ohlcv`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            start_date: startDate,
            end_date: endDate,
            interval: '1d'
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // Validate response is an object with data array
          // Check for FastAPI error response format
          if (!result || typeof result !== 'object' || result.status !== undefined) {
            const sampleData = generateSampleData(symbol)
            setMarketData(prev => ({ ...prev, [symbol]: sampleData }))
            setLoading(false)
            return
          }
          
          if (!Array.isArray(result.data) || result.data.length === 0) {
            const sampleData = generateSampleData(symbol)
            setMarketData(prev => ({ ...prev, [symbol]: sampleData }))
            setLoading(false)
            return
          }
          
          const processedData = result.data.map(d => ({
            ...d,
            timestamp: new Date(d.timestamp).getTime(),
            sma20: null,
            sma50: null,
            ema12: null,
            ema26: null,
            rsi: 50 + (Math.random() - 0.5) * 40,
            macd: (Math.random() - 0.5) * 5,
            macdSignal: (Math.random() - 0.5) * 5,
            bbUpper: d.close * 1.03,
            bbMiddle: d.close,
            bbLower: d.close * 0.97
          }))
          
          // Calculate SMAs
          for (let i = 19; i < processedData.length; i++) {
            const sum = processedData.slice(i - 19, i + 1).reduce((a, b) => a + b.close, 0)
            processedData[i].sma20 = parseFloat((sum / 20).toFixed(2))
          }
          
          for (let i = 49; i < processedData.length; i++) {
            const sum = processedData.slice(i - 49, i + 1).reduce((a, b) => a + b.close, 0)
            processedData[i].sma50 = parseFloat((sum / 50).toFixed(2))
          }
          
          setMarketData(prev => ({ ...prev, [symbol]: processedData }))
        } else {
          throw new Error('Failed to fetch data')
        }
      } else {
        // Use sample data
        const sampleData = generateSampleData(symbol)
        setMarketData(prev => ({ ...prev, [symbol]: sampleData }))
      }
    } catch {
      const sampleData = generateSampleData(symbol)
      setMarketData(prev => ({ ...prev, [symbol]: sampleData }))
    }
    setLoading(false)
  }, [servicesConnected])
  
  // Fetch AI analysis
  const fetchAiAnalysis = useCallback(async (symbol, indicators) => {
    if (!servicesConnected) {
      // Generate mock AI analysis
      setAiAnalysis({
        recommendation: indicators?.rsi < 30 ? 'STRONG BUY' : indicators?.rsi > 70 ? 'STRONG SELL' : 'HOLD',
        reasoning: indicators?.rsi < 30 
          ? `RSI indicates oversold conditions (${indicators.rsi.toFixed(1)}). The stock is trading near support levels with positive momentum indicators. Consider adding to positions on pullbacks.`
          : indicators?.rsi > 70
          ? `RSI indicates overbought conditions (${indicators.rsi.toFixed(1)}). Consider taking profits or reducing exposure. Watch for reversal signals.`
          : `The stock is in a neutral zone. Technical indicators are mixed - SMA shows ${indicators?.sma20 > indicators?.sma50 ? 'bullish' : 'bearish'} crossover. Wait for clearer signals.`,
        confidence: 75 + Math.random() * 20,
        riskLevel: indicators?.rsi > 70 || indicators?.rsi < 30 ? 'HIGH' : 'MODERATE',
        targetPrice: (indicators?.price * (1 + (Math.random() - 0.3) * 0.2)).toFixed(2),
        stopLoss: (indicators?.price * (1 - (Math.random() * 0.05 + 0.02))).toFixed(2),
        timeframe: '1-2 weeks'
      })
      return
    }
    
    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/agents/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: [symbol],
          mode: 'research',
          portfolio_value: portfolio.totalValue
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Helper function to check if any nested object contains an error status
        const hasErrorStatus = (obj) => {
          if (!obj || typeof obj !== 'object') return false
          if (Array.isArray(obj)) {
            return obj.some(item => hasErrorStatus(item))
          }
          // Check if this object has an error status
          if (obj.status !== undefined && typeof obj.status === 'number' && obj.status >= 400) {
            return true
          }
          // Recursively check all properties
          return Object.values(obj).some(value => hasErrorStatus(value))
        }
        
        // Validate result is a proper object with expected structure
        // Check if it's an error response (FastAPI error format)
        if (!result || typeof result !== 'object' || Array.isArray(result) || result.status !== undefined) {
          console.log('Invalid agent response format, using fallback')
          // Generate fallback analysis
          setAiAnalysis({
            recommendation: indicators?.rsi < 30 ? 'STRONG BUY' : indicators?.rsi > 70 ? 'STRONG SELL' : 'HOLD',
            reasoning: 'AI analysis temporarily unavailable. Using technical indicators for recommendation.',
            confidence: 70,
            riskLevel: 'MODERATE',
            targetPrice: indicators?.price ? (indicators.price * 1.1).toFixed(2) : '0.00',
            stopLoss: indicators?.price ? (indicators.price * 0.95).toFixed(2) : '0.00',
            timeframe: '1-2 weeks'
          })
          return
        }
        
        // Check for nested error statuses in the response
        if (hasErrorStatus(result)) {
          console.log('Agent response contains error status, using fallback')
          setAiAnalysis({
            recommendation: indicators?.rsi < 30 ? 'STRONG BUY' : indicators?.rsi > 70 ? 'STRONG SELL' : 'HOLD',
            reasoning: 'AI analysis service returned errors. Using technical indicators for recommendation.',
            confidence: 70,
            riskLevel: 'MODERATE',
            targetPrice: indicators?.price ? (indicators.price * 1.1).toFixed(2) : '0.00',
            stopLoss: indicators?.price ? (indicators.price * 0.95).toFixed(2) : '0.00',
            timeframe: '1-2 weeks'
          })
          return
        }
        
        // Parse the agent service response to extract relevant fields
        const symbolData = result.agents_results?.[symbol]
        
        if (symbolData) {
          // Handle new format {summary, signal} or old format {technical_analysis, fundamental_analysis, signal}
          const signalData = symbolData.signal?.signal || symbolData.signal || symbolData
          const summary = symbolData.summary || {}
          
          // Map 'side' to recommendation (buy/sell/neutral)
          const side = signalData?.side || summary?.side || 'neutral'
          const recommendation = side === 'long' ? 'BUY' : side === 'short' ? 'SELL' : 'HOLD'
          
          setAiAnalysis({
            recommendation,
            reasoning: summary?.analysis || signalData?.reasoning || 'AI analysis in progress...',
            confidence: (signalData?.confidence || summary?.confidence || 0.7) * 100,
            riskLevel: signalData?.risk_level || summary?.risk_level || 'MODERATE',
            targetPrice: signalData?.target_price || summary?.target_price || (indicators?.price ? (indicators.price * 1.1).toFixed(2) : '0.00'),
            stopLoss: signalData?.stop_loss || summary?.stop_loss || (indicators?.price ? (indicators.price * 0.95).toFixed(2) : '0.00'),
            timeframe: signalData?.timeframe || summary?.timeframe || '1-2 weeks'
          })
        } else {
          // Fallback to result-level signals
          const signalData = result.signals?.[0]
          const side = signalData?.side || 'neutral'
          const recommendation = side === 'long' ? 'BUY' : side === 'short' ? 'SELL' : 'HOLD'
          
          setAiAnalysis({
            recommendation,
            reasoning: signalData?.reasoning || 'Analysis in progress...',
            confidence: (signalData?.confidence || 0.7) * 100,
            riskLevel: signalData?.risk_level || 'MODERATE',
            targetPrice: signalData?.target_price || (indicators?.price ? (indicators.price * 1.1).toFixed(2) : '0.00'),
            stopLoss: signalData?.stop_loss || (indicators?.price ? (indicators.price * 0.95).toFixed(2) : '0.00'),
            timeframe: signalData?.timeframe || '1-2 weeks'
          })
        }
      } else {
        // Response not ok - generate fallback analysis
        setAiAnalysis({
          recommendation: indicators?.rsi < 30 ? 'STRONG BUY' : indicators?.rsi > 70 ? 'STRONG SELL' : 'HOLD',
          reasoning: 'AI analysis service returned an error. Using technical indicators for recommendation.',
          confidence: 70,
          riskLevel: 'MODERATE',
          targetPrice: indicators?.price ? (indicators.price * 1.1).toFixed(2) : '0.00',
          stopLoss: indicators?.price ? (indicators.price * 0.95).toFixed(2) : '0.00',
          timeframe: '1-2 weeks'
        })
      }
    } catch (error) {
      console.log('AI analysis unavailable')
    }
  }, [servicesConnected, portfolio.totalValue])
  
  // Initial data fetch - fetch for selected symbol
  useEffect(() => {
    fetchMarketData(selectedSymbol)
  }, [selectedSymbol, fetchMarketData])

  // Fetch data for all watchlist symbols on initial load
  useEffect(() => {
    if (initialDataLoaded.current) return
    initialDataLoaded.current = true
    
    // Use setTimeout to defer fetching until after initial render
    setTimeout(() => {
      watchlist.forEach(symbol => {
        if (!marketData[symbol]) {
          fetchMarketData(symbol)
        }
      })
    }, 100)
  }, []) // Run once on mount - empty deps critical to prevent infinite loop
  
  // Update signals when data changes
  useEffect(() => {
    const data = marketData[selectedSymbol]
    if (data) {
      const indicators = calculateIndicators(data)
      const newSignals = generateSignals(indicators)
      setSignals(newSignals)
      fetchAiAnalysis(selectedSymbol, indicators)
    }
  }, [marketData, selectedSymbol, fetchAiAnalysis])
  
  // Handle trade execution (paper trading)
  const handleTrade = (side) => {
    const data = marketData[selectedSymbol]
    if (!data) return
    
    const currentPrice = data[data.length - 1].close
    const tradeValue = currentPrice * tradeForm.quantity
    
    if (side === 'buy') {
      if (tradeValue > portfolio.cash) {
        alert('Insufficient funds')
        return
      }
      
      setPortfolio(prev => ({
        ...prev,
        cash: prev.cash - tradeValue,
        positions: [
          ...prev.positions,
          {
            symbol: selectedSymbol,
            quantity: tradeForm.quantity,
            entryPrice: currentPrice,
            currentPrice,
            pnl: 0,
            entryDate: new Date().toISOString()
          }
        ],
        totalValue: prev.totalValue
      }))
    } else {
      // Sell
      const positionIndex = portfolio.positions.findIndex(p => p.symbol === selectedSymbol)
      if (positionIndex === -1) {
        alert('No position to sell')
        return
      }
      
      const position = portfolio.positions[positionIndex]
      if (position.quantity < tradeForm.quantity) {
        alert('Insufficient shares')
        return
      }
      
      const proceeds = currentPrice * tradeForm.quantity
      const costBasis = position.entryPrice * tradeForm.quantity
      const pnl = proceeds - costBasis
      
      const newPositions = [...portfolio.positions]
      newPositions[positionIndex] = {
        ...position,
        quantity: position.quantity - tradeForm.quantity
      }
      
      if (newPositions[positionIndex].quantity === 0) {
        newPositions.splice(positionIndex, 1)
      }
      
      setPortfolio(prev => ({
        ...prev,
        cash: prev.cash + proceeds,
        positions: newPositions,
        totalValue: prev.totalValue + pnl
      }))
    }
  }
  
  // Update portfolio value
  useEffect(() => {
    const positionsValue = portfolio.positions.reduce((sum, pos) => {
      const data = marketData[pos.symbol]
      // Validate data is an array with elements
      if (Array.isArray(data) && data.length > 0) {
        const currentPrice = data[data.length - 1].close
        return sum + (currentPrice * pos.quantity)
      }
      return sum + (pos.currentPrice * pos.quantity)
    }, 0)
    
    const totalPnL = portfolio.positions.reduce((sum, pos) => {
      const data = marketData[pos.symbol]
      // Validate data is an array with elements
      if (Array.isArray(data) && data.length > 0) {
        const currentPrice = data[data.length - 1].close
        return sum + ((currentPrice - pos.entryPrice) * pos.quantity)
      }
      return sum + pos.pnl
    }, 0)
    
    setPortfolio(prev => ({
      ...prev,
      totalValue: prev.cash + positionsValue,
      totalPnL
    }))
  }, [marketData, portfolio.positions])
  
  // Get current data and indicators
  const currentData = marketData[selectedSymbol] || []
  const indicators = calculateIndicators(currentData)
  
  // Filter data based on timeframe
  const getFilteredData = () => {
    if (!currentData.length) return []
    
    const now = Date.now()
    const timeframeMap = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365
    }
    
    const days = timeframeMap[chartTimeframe] || 90
    const cutoff = now - days * 24 * 60 * 60 * 1000
    
    return currentData.filter(d => d.timestamp >= cutoff)
  }
  
  const filteredData = getFilteredData()
  
  // Render chart based on selected indicator
  const renderChart = () => {
    if (showChartIndicator === 'price') {
      return (
        <ComposedChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-muted)"
            fontSize={10}
            tickFormatter={(value) => value.slice(5)}
          />
          <YAxis 
            stroke="var(--text-muted)"
            fontSize={10}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="var(--accent-blue)" 
            fill="url(#colorClose)"
            strokeWidth={2}
          />
          {indicators?.sma20 && (
            <Line 
              type="monotone" 
              dataKey="sma20" 
              stroke="var(--accent-amber)" 
              strokeWidth={1}
              dot={false}
            />
          )}
          {indicators?.sma50 && (
            <Line 
              type="monotone" 
              dataKey="sma50" 
              stroke="var(--accent-purple)" 
              strokeWidth={1}
              dot={false}
            />
          )}
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </ComposedChart>
      )
    }
    
    if (showChartIndicator === 'rsi') {
      return (
        <ComposedChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-muted)"
            fontSize={10}
            tickFormatter={(value) => value.slice(5)}
          />
          <YAxis 
            stroke="var(--text-muted)"
            fontSize={10}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="rsi" 
            stroke="var(--accent-purple)" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey={() => 70} 
            stroke="var(--accent-red)" 
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey={() => 30} 
            stroke="var(--accent-green)" 
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
        </ComposedChart>
      )
    }
    
    if (showChartIndicator === 'macd') {
      return (
        <ComposedChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-muted)"
            fontSize={10}
            tickFormatter={(value) => value.slice(5)}
          />
          <YAxis 
            stroke="var(--text-muted)"
            fontSize={10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="macd" fill="var(--accent-blue)" />
          <Line 
            type="monotone" 
            dataKey="macdSignal" 
            stroke="var(--accent-amber)" 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      )
    }
    
    if (showChartIndicator === 'bollinger') {
      return (
        <ComposedChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-muted)"
            fontSize={10}
            tickFormatter={(value) => value.slice(5)}
          />
          <YAxis 
            stroke="var(--text-muted)"
            fontSize={10}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="bbUpper" 
            stroke="var(--accent-red)" 
            fill="none"
            strokeWidth={1}
            strokeDasharray="5 5"
          />
          <Area 
            type="monotone" 
            dataKey="bbMiddle" 
            stroke="var(--accent-amber)" 
            fill="none"
            strokeWidth={1}
          />
          <Area 
            type="monotone" 
            dataKey="bbLower" 
            stroke="var(--accent-green)" 
            fill="url(#colorBB)"
            strokeWidth={1}
          />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="var(--accent-blue)" 
            strokeWidth={2}
            dot={false}
          />
          <defs>
            <linearGradient id="colorBB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
        </ComposedChart>
      )
    }
  }
  
  return (
    <ErrorBoundary>
      <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <TrendingUp className="logo-icon" />
            <span>SwingTrader Pro</span>
          </div>
          <nav className="header-nav">
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portfolio
            </button>
            <button 
              className={`nav-btn ${activeTab === 'signals' ? 'active' : ''}`}
              onClick={() => setActiveTab('signals')}
            >
              Signals
            </button>
            <button 
              className={`nav-btn ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              AI Analysis
            </button>
          </nav>
        </div>
        <div className="header-right">
          <div className="status-indicator">
            <span className={`status-dot ${servicesConnected ? '' : 'disconnected'}`}></span>
            <span>{servicesConnected ? 'Services Connected' : 'Offline Mode'}</span>
          </div>
          <button className="nav-btn" onClick={() => fetchMarketData(selectedSymbol)}>
            <RefreshCw size={16} />
          </button>
          <button className="nav-btn">
            <Bell size={16} />
          </button>
          <button className="nav-btn">
            <Settings size={16} />
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar - Watchlist */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Watchlist</div>
            {watchlist.map(symbol => {
              const data = marketData[symbol]
              // Ensure data is a valid array before processing
              const validData = Array.isArray(data) ? data : null
              const ind = calculateIndicators(validData)
              const isActive = symbol === selectedSymbol
              
              return (
                <div
                  key={symbol}
                  className={`watchlist-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedSymbol(symbol)}
                >
                  <div>
                    <div className="watchlist-symbol">{symbol}</div>
                    <div className="watchlist-price">
                      {ind?.price ? `$${ind.price.toFixed(2)}` : '---'}
                    </div>
                  </div>
                  <div className={`watchlist-change ${ind?.changePercent >= 0 ? 'positive' : 'negative'}`}>
                    {ind?.changePercent != null ? `${ind.changePercent >= 0 ? '+' : ''}${ind.changePercent.toFixed(2)}%` : '0.00%'}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="sidebar-section">
            <div className="sidebar-title">Quick Stats</div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div className="indicator-item">
                <span className="indicator-label">90D High</span>
                <span className="indicator-value">${indicators?.high90?.toFixed(2) || '---'}</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">90D Low</span>
                <span className="indicator-value">${indicators?.low90?.toFixed(2) || '---'}</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">Avg Volume</span>
                <span className="indicator-value">
                  {indicators?.avgVolume ? `${(indicators.avgVolume / 1000000).toFixed(1)}M` : '---'}
                </span>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Content Area - Tab-based rendering */}
        <div className="content-area">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <>
              <div className="dashboard-grid">
                {/* Chart Card */}
                <div className="card chart-card">
                  <div className="chart-header">
                    <div className="chart-symbol-info">
                      <span className="chart-symbol">{selectedSymbol}</span>
                      <span className="chart-price">${indicators?.price?.toFixed(2) || '---'}</span>
                      <span className={`chart-change ${indicators?.changePercent >= 0 ? 'positive' : 'negative'}`}>
                        {indicators?.changePercent >= 0 ? '+' : ''}{indicators?.changePercent?.toFixed(2) || '0.00'}%
                      </span>
                    </div>
                    <div className="chart-controls">
                      {['1W', '1M', '3M', '6M', '1Y'].map(tf => (
                        <button
                          key={tf}
                          className={`chart-btn ${chartTimeframe === tf ? 'active' : ''}`}
                          onClick={() => setChartTimeframe(tf)}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="chart-container">
                    {loading ? (
                      <div className="loading-spinner">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                      </ResponsiveContainer>
                    )}
                  </div>
                  
                  {/* Indicator Tabs */}
                  <div className="chart-controls" style={{ padding: '0 16px 16px' }}>
                    <button
                      className={`chart-btn ${showChartIndicator === 'price' ? 'active' : ''}`}
                      onClick={() => setShowChartIndicator('price')}
                    >
                      Price + SMA
                    </button>
                    <button
                      className={`chart-btn ${showChartIndicator === 'rsi' ? 'active' : ''}`}
                      onClick={() => setShowChartIndicator('rsi')}
                    >
                      RSI
                    </button>
                    <button
                      className={`chart-btn ${showChartIndicator === 'macd' ? 'active' : ''}`}
                      onClick={() => setShowChartIndicator('macd')}
                    >
                      MACD
                    </button>
                    <button
                      className={`chart-btn ${showChartIndicator === 'bollinger' ? 'active' : ''}`}
                      onClick={() => setShowChartIndicator('bollinger')}
                    >
                      Bollinger Bands
                    </button>
                  </div>
                  
                  {/* Technical Indicators Panel */}
                  <div className="indicators-panel">
                    <div className="indicator-item">
                      <span className="indicator-label">SMA 20</span>
                      <span className="indicator-value">${indicators?.sma20?.toFixed(2) || '---'}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">SMA 50</span>
                      <span className="indicator-value">${indicators?.sma50?.toFixed(2) || '---'}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">RSI (14)</span>
                      <span className={`indicator-value ${
                        indicators?.rsi > 70 ? 'negative' :
                        indicators?.rsi < 30 ? 'positive' : 'neutral'
                      }`}>
                        {indicators?.rsi?.toFixed(1) || '---'}
                      </span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">MACD</span>
                      <span className={`indicator-value ${
                        indicators?.macd > indicators?.macdSignal ? 'positive' : 'negative'
                      }`}>
                        {indicators?.macd?.toFixed(2) || '---'}
                      </span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">BB Upper</span>
                      <span className="indicator-value">${indicators?.bbUpper?.toFixed(2) || '---'}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="indicator-label">BB Lower</span>
                      <span className="indicator-value">${indicators?.bbLower?.toFixed(2) || '---'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Signals Card */}
                <div className="card signals-card">
                  <div className="card-header">
                    <span className="card-title">Trading Signals</span>
                    <Activity size={16} />
                  </div>
                  <div className="card-body">
                    <div className="signals-list">
                      {signals.length > 0 ? signals.map((signal, idx) => (
                        <div key={idx} className="signal-item">
                          <div className={`signal-icon ${signal.type}`}>
                            {signal.type === 'buy' ? <ChevronUp size={14} /> :
                             signal.type === 'sell' ? <ChevronDown size={14} /> :
                             <Activity size={14} />}
                          </div>
                          <div className="signal-details">
                            <div className="signal-symbol">{signal.name}</div>
                            <div className="signal-type">Value: {signal.value}</div>
                          </div>
                          <div className="signal-confidence">{signal.confidence}%</div>
                        </div>
                      )) : (
                        <div className="empty-state">
                          <Activity className="empty-state-icon" />
                          <span className="empty-state-text">No clear signals</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* AI Analysis Card */}
                <div className="card ai-card">
                  <div className="card-header">
                    <span className="card-title">AI Analysis</span>
                    <Brain size={16} />
                  </div>
                  <div className="card-body">
                    <div className="ai-analysis-content">
                      <div className="ai-status">
                        <Brain className="ai-status-icon" />
                        <span className="ai-status-text">
                          {aiAnalysis ? 'Analysis Complete' : 'Analyzing...'}
                        </span>
                      </div>
                      
                      {aiAnalysis && (
                        <>
                          <div className="ai-recommendation">
                            <div className="ai-recommendation-title">Recommendation</div>
                            <div style={{
                              fontSize: '1.25rem',
                              fontWeight: 700,
                              color: aiAnalysis.recommendation.includes('BUY') ? 'var(--accent-green)' :
                                     aiAnalysis.recommendation.includes('SELL') ? 'var(--accent-red)' :
                                     'var(--accent-amber)',
                              marginBottom: '8px'
                            }}>
                              {aiAnalysis.recommendation}
                            </div>
                            <div className="ai-recommendation-text">
                              {aiAnalysis.reasoning}
                            </div>
                          </div>
                          
                          <div className="risk-metrics">
                            <div className="risk-metric">
                              <div className="risk-metric-label">Confidence</div>
                              <div className="risk-metric-value" style={{ color: 'var(--accent-blue)' }}>
                                {aiAnalysis.confidence?.toFixed(0)}%
                              </div>
                            </div>
                            <div className="risk-metric">
                              <div className="risk-metric-label">Risk Level</div>
                              <div className="risk-metric-value" style={{
                                color: aiAnalysis.riskLevel === 'HIGH' ? 'var(--accent-red)' : 'var(--accent-amber)'
                              }}>
                                {aiAnalysis.riskLevel}
                              </div>
                            </div>
                            <div className="risk-metric">
                              <div className="risk-metric-label">Timeframe</div>
                              <div className="risk-metric-value">
                                {aiAnalysis.timeframe}
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div className="indicator-item">
                              <span className="indicator-label">Target Price</span>
                              <span className="indicator-value positive">${aiAnalysis.targetPrice}</span>
                            </div>
                            <div className="indicator-item">
                              <span className="indicator-label">Stop Loss</span>
                              <span className="indicator-value negative">${aiAnalysis.stopLoss}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Portfolio Card */}
                <div className="card portfolio-card">
                  <div className="card-header">
                    <span className="card-title">Portfolio</span>
                    <Wallet size={16} />
                  </div>
                  <div className="card-body">
                    <div className="portfolio-summary">
                      <div className="portfolio-stat">
                        <span className="portfolio-stat-label">Total Value</span>
                        <span className="portfolio-stat-value">
                          ${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="portfolio-stat">
                        <span className="portfolio-stat-label">Total P&L</span>
                        <span className={`portfolio-stat-value ${portfolio.totalPnL >= 0 ? 'positive' : 'negative'}`}>
                          {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="portfolio-stat">
                        <span className="portfolio-stat-label">Cash</span>
                        <span className="portfolio-stat-value">
                          ${portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="portfolio-stat">
                        <span className="portfolio-stat-label">Positions</span>
                        <span className="portfolio-stat-value">{portfolio.positions.length}</span>
                      </div>
                    </div>
                    
                    {portfolio.positions.length > 0 && (
                      <table className="positions-table">
                        <thead>
                          <tr>
                            <th>Symbol</th>
                            <th>Qty</th>
                            <th>Entry</th>
                            <th>P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {portfolio.positions.map((pos, idx) => {
                            const data = marketData[pos.symbol]
                            const currentPrice = (Array.isArray(data) && data.length > 0)
                              ? data[data.length - 1].close
                              : pos.currentPrice
                            const pnl = (currentPrice - pos.entryPrice) * pos.quantity
                            
                            return (
                              <tr key={idx}>
                                <td className="position-symbol">{pos.symbol}</td>
                                <td>{pos.quantity}</td>
                                <td>${pos.entryPrice.toFixed(2)}</td>
                                <td className={`position-pnl ${pnl >= 0 ? 'positive' : 'negative'}`}>
                                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Trade Panel */}
              <div className="trade-panel">
                <div className="trade-input-group">
                  <label className="trade-input-label">Symbol</label>
                  <input
                    type="text"
                    className="trade-input"
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                    style={{ width: '80px', textTransform: 'uppercase' }}
                  />
                </div>
                <div className="trade-input-group">
                  <label className="trade-input-label">Quantity</label>
                  <input
                    type="number"
                    className="trade-input"
                    value={tradeForm.quantity}
                    onChange={(e) => setTradeForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
                <div className="trade-input-group">
                  <label className="trade-input-label">Est. Value</label>
                  <input
                    type="text"
                    className="trade-input"
                    value={`$${((indicators?.price || 0) * tradeForm.quantity).toFixed(2)}`}
                    readOnly
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  />
                </div>
                <div className="trade-buttons">
                  <button className="trade-btn buy" onClick={() => handleTrade('buy')}>
                    <TrendingUp size={16} style={{ marginRight: '4px' }} />
                    Buy
                  </button>
                  <button className="trade-btn sell" onClick={() => handleTrade('sell')}>
                    <TrendingDown size={16} style={{ marginRight: '4px' }} />
                    Sell
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* PORTFOLIO TAB */}
          {activeTab === 'portfolio' && (
            <div className="portfolio-full">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Portfolio Overview</span>
                  <Wallet size={20} />
                </div>
                <div className="card-body">
                  <div className="portfolio-summary" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                    <div className="portfolio-stat">
                      <span className="portfolio-stat-label">Total Value</span>
                      <span className="portfolio-stat-value" style={{ fontSize: '1.5rem' }}>
                        ${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="portfolio-stat">
                      <span className="portfolio-stat-label">Cash Available</span>
                      <span className="portfolio-stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-green)' }}>
                        ${portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="portfolio-stat">
                      <span className="portfolio-stat-label">Total P&L</span>
                      <span className={`portfolio-stat-value ${portfolio.totalPnL >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.5rem' }}>
                        {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="portfolio-stat">
                      <span className="portfolio-stat-label">Open Positions</span>
                      <span className="portfolio-stat-value" style={{ fontSize: '1.5rem' }}>
                        {portfolio.positions.length}
                      </span>
                    </div>
                  </div>
                  
                  {portfolio.positions.length > 0 ? (
                    <table className="positions-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Quantity</th>
                          <th>Entry Price</th>
                          <th>Current Price</th>
                          <th>Market Value</th>
                          <th>P&L</th>
                          <th>P&L %</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.positions.map((pos, idx) => {
                          const data = marketData[pos.symbol]
                          const currentPrice = (Array.isArray(data) && data.length > 0)
                            ? data[data.length - 1].close
                            : pos.currentPrice || pos.entryPrice
                          const marketValue = currentPrice * pos.quantity
                          const pnl = (currentPrice - pos.entryPrice) * pos.quantity
                          const pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100
                          
                          return (
                            <tr key={idx}>
                              <td className="position-symbol" style={{ fontWeight: 700 }}>{pos.symbol}</td>
                              <td>{pos.quantity}</td>
                              <td>${pos.entryPrice.toFixed(2)}</td>
                              <td>${currentPrice.toFixed(2)}</td>
                              <td>${marketValue.toFixed(2)}</td>
                              <td className={`position-pnl ${pnl >= 0 ? 'positive' : 'negative'}`}>
                                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                              </td>
                              <td className={pnlPercent >= 0 ? 'positive' : 'negative'}>
                                {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                              </td>
                              <td>
                                <button
                                  className="trade-btn sell"
                                  style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                  onClick={() => handleTrade('sell', pos)}
                                >
                                  Close
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <Wallet className="empty-state-icon" style={{ width: 48, height: 48 }} />
                      <span className="empty-state-text">No open positions</span>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Start trading to build your portfolio
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Trade Section */}
              <div className="card" style={{ marginTop: '16px' }}>
                <div className="card-header">
                  <span className="card-title">Quick Trade</span>
                  <Zap size={20} />
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div className="trade-input-group" style={{ flex: 1 }}>
                      <label className="trade-input-label">Symbol</label>
                      <input
                        type="text"
                        className="trade-input"
                        value={selectedSymbol}
                        onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <div className="trade-input-group" style={{ flex: 1 }}>
                      <label className="trade-input-label">Quantity</label>
                      <input
                        type="number"
                        className="trade-input"
                        value={tradeForm.quantity}
                        onChange={(e) => setTradeForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                        min="1"
                      />
                    </div>
                    <div className="trade-input-group" style={{ flex: 1 }}>
                      <label className="trade-input-label">Est. Value</label>
                      <input
                        type="text"
                        className="trade-input"
                        value={`$${((indicators?.price || 0) * tradeForm.quantity).toFixed(2)}`}
                        readOnly
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      />
                    </div>
                    <button className="trade-btn buy" onClick={() => handleTrade('buy')}>
                      <TrendingUp size={16} style={{ marginRight: '4px' }} />
                      Buy
                    </button>
                    <button className="trade-btn sell" onClick={() => handleTrade('sell')}>
                      <TrendingDown size={16} style={{ marginRight: '4px' }} />
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* SIGNALS TAB */}
          {activeTab === 'signals' && (
            <div className="signals-full">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Trading Signals for {selectedSymbol}</span>
                  <Activity size={20} />
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {watchlist.map(symbol => (
                      <button
                        key={symbol}
                        className={`chart-btn ${selectedSymbol === symbol ? 'active' : ''}`}
                        onClick={() => setSelectedSymbol(symbol)}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                  
                  {signals.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {signals.map((signal, idx) => (
                        <div key={idx} className="signal-item" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className={`signal-icon ${signal.type}`} style={{ width: 40, height: 40 }}>
                              {signal.type === 'buy' ? <ChevronUp size={24} /> :
                               signal.type === 'sell' ? <ChevronDown size={24} /> :
                               <Activity size={24} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{signal.name}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Current Value: {signal.value}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: signal.type === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)'
                              }}>
                                {signal.type.toUpperCase()}
                              </div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                Confidence: {signal.confidence}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <Activity className="empty-state-icon" style={{ width: 48, height: 48 }} />
                      <span className="empty-state-text">No clear signals for {selectedSymbol}</span>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                        The technical indicators are not providing a clear direction
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Technical Indicators Detail */}
              <div className="card" style={{ marginTop: '16px' }}>
                <div className="card-header">
                  <span className="card-title">Technical Indicators</span>
                  <BarChart3 size={20} />
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="indicator-item" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <span className="indicator-label">RSI (14)</span>
                      <span className={`indicator-value ${indicators?.rsi > 70 ? 'negative' : indicators?.rsi < 30 ? 'positive' : 'neutral'}`} style={{ fontSize: '1.5rem' }}>
                        {indicators?.rsi?.toFixed(1) || '---'}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {indicators?.rsi < 30 ? 'Oversold - Potential Buy' : indicators?.rsi > 70 ? 'Overbought - Potential Sell' : 'Neutral'}
                      </div>
                    </div>
                    <div className="indicator-item" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <span className="indicator-label">MACD</span>
                      <span className={`indicator-value ${indicators?.macd > indicators?.macdSignal ? 'positive' : 'negative'}`} style={{ fontSize: '1.5rem' }}>
                        {indicators?.macd?.toFixed(2) || '---'}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Signal: {indicators?.macdSignal?.toFixed(2) || '---'}
                      </div>
                    </div>
                    <div className="indicator-item" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <span className="indicator-label">SMA 20/50</span>
                      <span className={`indicator-value ${indicators?.sma20 > indicators?.sma50 ? 'positive' : 'negative'}`} style={{ fontSize: '1.5rem' }}>
                        {indicators?.sma20?.toFixed(0) || '---'}/{indicators?.sma50?.toFixed(0) || '---'}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {indicators?.sma20 > indicators?.sma50 ? 'Golden Cross - Bullish' : 'Death Cross - Bearish'}
                      </div>
                    </div>
                    <div className="indicator-item" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <span className="indicator-label">Bollinger Bands</span>
                      <span className="indicator-value" style={{ fontSize: '1.2rem' }}>
                        ${indicators?.bbUpper?.toFixed(0) || '---'} / ${indicators?.bbLower?.toFixed(0) || '---'}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {indicators?.price < indicators?.bbLower ? 'At Lower Band - Buy Signal' :
                         indicators?.price > indicators?.bbUpper ? 'At Upper Band - Sell Signal' :
                         'Within Bands'}
                      </div>
                    </div>
                    <div className="indicator-item" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <span className="indicator-label">90-Day Range</span>
                      <span className="indicator-value" style={{ fontSize: '1.2rem' }}>
                        ${indicators?.low90?.toFixed(0) || '---'} - ${indicators?.high90?.toFixed(0) || '---'}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Current: {((indicators?.price - indicators?.low90) / (indicators?.high90 - indicators?.low90) * 100).toFixed(0)}% of range
                      </div>
                    </div>
                    <div className="indicator-item" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <span className="indicator-label">Volume (20D Avg)</span>
                      <span className="indicator-value" style={{ fontSize: '1.2rem' }}>
                        {(indicators?.avgVolume / 1000000).toFixed(1)}M
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {(indicators?.volume / indicators?.avgVolume).toFixed(1)}x average
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* AI ANALYSIS TAB */}
          {activeTab === 'analysis' && (
            <div className="analysis-full">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">AI-Powered Analysis for {selectedSymbol}</span>
                  <Brain size={20} />
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {watchlist.map(symbol => (
                      <button
                        key={symbol}
                        className={`chart-btn ${selectedSymbol === symbol ? 'active' : ''}`}
                        onClick={() => setSelectedSymbol(symbol)}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <button
                      className="trade-btn buy"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => fetchAiAnalysis(selectedSymbol)}
                      disabled={loading}
                    >
                      <Brain size={16} style={{ marginRight: '8px' }} />
                      {loading ? 'Analyzing...' : 'Run AI Analysis'}
                    </button>
                  </div>
                  
                  {aiAnalysis ? (
                    <>
                      <div style={{
                        padding: '24px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '12px',
                        marginBottom: '24px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                          <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: aiAnalysis.recommendation.includes('BUY') ? 'var(--accent-green)' :
                                           aiAnalysis.recommendation.includes('SELL') ? 'var(--accent-red)' :
                                           'var(--accent-amber)',
                          }}>
                            <TrendingUp size={40} style={{ color: 'white' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                              {aiAnalysis.recommendation}
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                              AI Confidence: {aiAnalysis.confidence?.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          fontSize: '1.1rem',
                          lineHeight: 1.6,
                          color: 'var(--text-primary)'
                        }}>
                          {aiAnalysis.reasoning}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div className="risk-metric" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                          <div className="risk-metric-label">Target Price</div>
                          <div className="risk-metric-value positive" style={{ fontSize: '1.5rem' }}>
                            ${aiAnalysis.targetPrice}
                          </div>
                        </div>
                        <div className="risk-metric" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                          <div className="risk-metric-label">Stop Loss</div>
                          <div className="risk-metric-value negative" style={{ fontSize: '1.5rem' }}>
                            ${aiAnalysis.stopLoss}
                          </div>
                        </div>
                        <div className="risk-metric" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                          <div className="risk-metric-label">Risk Level</div>
                          <div className="risk-metric-value" style={{
                            fontSize: '1.5rem',
                            color: aiAnalysis.riskLevel === 'HIGH' ? 'var(--accent-red)' : 'var(--accent-amber)'
                          }}>
                            {aiAnalysis.riskLevel}
                          </div>
                        </div>
                        <div className="risk-metric" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                          <div className="risk-metric-label">Timeframe</div>
                          <div className="risk-metric-value" style={{ fontSize: '1.5rem' }}>
                            {aiAnalysis.timeframe}
                          </div>
                        </div>
                      </div>
                      
                      {/* Risk/Reward Analysis */}
                      <div className="card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="card-header">
                          <span className="card-title">Risk/Reward Analysis</span>
                          <Shield size={16} />
                        </div>
                        <div className="card-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', textAlign: 'center' }}>
                            <div>
                              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Entry</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${indicators?.price?.toFixed(2)}</div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Stop Loss</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-red)' }}>${aiAnalysis.stopLoss}</div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Target</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-green)' }}>${aiAnalysis.targetPrice}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', textAlign: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Risk/Reward Ratio: </span>
                            <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                              1:{((aiAnalysis.targetPrice - indicators?.price) / (indicators?.price - aiAnalysis.stopLoss)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state" style={{ padding: '60px' }}>
                      <Brain className="empty-state-icon" style={{ width: 64, height: 64 }} />
                      <span className="empty-state-text">No AI analysis available</span>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>
                        Click "Run AI Analysis" to get AI-powered trading insights for {selectedSymbol}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}

export default App
