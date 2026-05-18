import { useState, useEffect } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, AlertTriangle,
  Play, Pause, Settings, FileText, BarChart3, PieChart as PieChartIcon,
  RefreshCw, Shield, Clock, CheckCircle, XCircle
} from 'lucide-react'
import './App.css'

// Service URLs
const SERVICES = {
  data: 'http://localhost:8001',
  features: 'http://localhost:8002',
  strategy: 'http://localhost:8003',
  risk: 'http://localhost:8004',
  execution: 'http://localhost:8005',
  agents: 'http://localhost:8006'  // NEW: AI Agent Service with LLM
}

// Sample data for demo
const SAMPLE_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'V', 'WMT']

const COLORS = ['#4a90d9', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c']

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [mode, setMode] = useState('research') // research or paper_trading
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedStocks, setSelectedStocks] = useState(['AAPL', 'MSFT', 'GOOGL'])
  const [results, setResults] = useState(null)
  const [portfolio, setPortfolio] = useState({
    value: 100000,
    cash: 100000,
    positions: [],
    dailyPnL: 0,
    totalPnL: 0
  })
  const [signals, setSignals] = useState([])
  const [trades, setTrades] = useState([])
  const [serviceStatus, setServiceStatus] = useState({})

  // Check service health
  useEffect(() => {
    const checkServices = async () => {
      const status = {}
      for (const [name, url] of Object.entries(SERVICES)) {
        try {
          const res = await fetch(`${url}/health`, { method: 'GET' })
          status[name] = res.ok ? 'healthy' : 'error'
        } catch {
          status[name] = 'offline'
        }
      }
      setServiceStatus(status)
    }
    checkServices()
    const interval = setInterval(checkServices, 30000)
    return () => clearInterval(interval)
  }, [])

  // Check if AI agent service is configured
  const [agentConfigured, setAgentConfigured] = useState(false)
  useEffect(() => {
    fetch(`${SERVICES.agents}/health`)
      .then(res => res.json())
      .then(data => setAgentConfigured(data.llm_configured || false))
      .catch(() => setAgentConfigured(false))
  }, [])

  // Load existing trades from execution service
  useEffect(() => {
    const loadTrades = async () => {
      try {
        const res = await fetch(`${SERVICES.execution}/execution/orders`)
        if (res.ok) {
          const data = await res.json()
          // API returns list directly, not {orders: [...]}
          const orders = Array.isArray(data) ? data : []
          setTrades(orders.map(o => ({
            symbol: o.symbol,
            side: o.side,
            quantity: o.quantity,
            filled_price: o.filled_price || o.price,
            status: o.status,
            executed_at: o.filled_at || o.created_at
          })))
        }
      } catch (err) {
        console.error('Failed to load trades:', err)
      }
    }
    loadTrades()
  }, [])

  // Run analysis - uses OpenClaw AI Agents with LLM
  const runAnalysis = async () => {
    setLoading(true)
    setIsRunning(true)
    
    try {
      // Call the AI Agent service which runs the full OpenClaw pipeline
      const response = await fetch(`${SERVICES.agents}/agents/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: selectedStocks,
          mode: mode,
          portfolio_value: portfolio.value
        })
      })
      
      if (!response.ok) {
        throw new Error(`Agent service error: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Set signals from AI analysis
      setSignals(result.signals || [])
      
      // Execute approved trades in paper trading mode
      if (mode === 'paper_trading' && result.approved_trades) {
        for (const trade of result.approved_trades) {
          try {
            const quantity = Math.floor((portfolio.value * 0.1) / trade.entry_zone_min)
            
            const execResponse = await fetch(`${SERVICES.execution}/execution/paper_order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                symbol: trade.symbol,
                side: trade.side,
                quantity,
                order_type: 'limit',
                price: trade.entry_zone_min,
                is_paper: true
              })
            })
            
            if (execResponse.ok) {
              const execData = await execResponse.json()
              setTrades(prev => [{
                ...trade,
                status: execData.status || 'filled',
                filled_price: execData.price || trade.entry_zone_min,
                quantity,
                executed_at: new Date().toISOString()
              }, ...prev])
            }
          } catch (err) {
            console.error(`Error executing trade for ${trade.symbol}:`, err)
          }
        }
      }
      
      setResults({
        run_id: result.run_id,
        timestamp: result.timestamp,
        symbols_analyzed: result.symbols_analyzed,
        signals_generated: result.signals?.length || 0,
        approved_trades: result.approved_trades?.length || 0
      })
      
    } catch (err) {
      console.error('Analysis error:', err)
      alert('Error running AI analysis: ' + err.message)
    }
    
    setLoading(false)
    setIsRunning(false)
  }

  // Render dashboard
  const renderDashboard = () => (
    <div className="dashboard">
      {/* Portfolio Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Portfolio Value</span>
            <span className="card-value">${portfolio.value.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <Activity size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Daily P&L</span>
            <span className={`card-value ${portfolio.dailyPnL >= 0 ? 'positive' : 'negative'}`}>
              {portfolio.dailyPnL >= 0 ? '+' : ''}${portfolio.dailyPnL.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Total P&L</span>
            <span className={`card-value ${portfolio.totalPnL >= 0 ? 'positive' : 'negative'}`}>
              {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">
            <BarChart3 size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Active Signals</span>
            <span className="card-value">{signals.length}</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Portfolio Performance Chart */}
        <div className="chart-container">
          <h3>Portfolio Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[
              { day: 'Mon', value: 100000 },
              { day: 'Tue', value: 100500 },
              { day: 'Wed', value: 100200 },
              { day: 'Thu', value: 101000 },
              { day: 'Fri', value: 101500 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
              <Line type="monotone" dataKey="value" stroke="#4a90d9" strokeWidth={2} dot={{ fill: '#4a90d9' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Signal Distribution */}
        <div className="chart-container">
          <h3>Signal Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Long', value: signals.filter(s => s.side === 'long').length },
                  { name: 'Short', value: signals.filter(s => s.side === 'short').length },
                  { name: 'Neutral', value: signals.filter(s => s.side === 'neutral').length }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {[0, 1, 2].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Signals Table */}
      <div className="signals-section">
        <h3>Generated Signals</h3>
        <div className="signals-table">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th>Confidence</th>
                <th>Entry Zone</th>
                <th>Stop Loss</th>
                <th>Take Profit</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal, idx) => (
                <tr key={idx}>
                  <td className="symbol">{signal.symbol}</td>
                  <td>
                    <span className={`badge ${signal.side}`}>
                      {signal.side === 'long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {signal.side.toUpperCase()}
                    </span>
                  </td>
                  <td>{(signal.confidence * 100).toFixed(1)}%</td>
                  <td>${signal.entry_zone_min.toFixed(2)} - ${signal.entry_zone_max.toFixed(2)}</td>
                  <td className="negative">${signal.stop_loss.toFixed(2)}</td>
                  <td className="positive">${signal.take_profit.toFixed(2)}</td>
                  <td className="rationale">{signal.rationale.substring(0, 50)}...</td>
                </tr>
              ))}
              {signals.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty">No signals generated yet. Run analysis to generate signals.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // Render trades
  const renderTrades = () => (
    <div className="trades-view">
      <h3>Trade History</h3>
      <div className="trades-list">
        {trades.length > 0 ? trades.map((trade, idx) => (
          <div key={idx} className="trade-card">
            <div className="trade-header">
              <span className="trade-symbol">{trade.symbol}</span>
              <span className={`trade-side ${trade.side}`}>
                {trade.side === 'long' ? 'LONG' : 'SHORT'}
              </span>
              <span className={`trade-status ${trade.status}`}>
                {trade.status === 'filled' ? <CheckCircle size={14} /> : <Clock size={14} />}
                {trade.status.toUpperCase()}
              </span>
            </div>
            <div className="trade-details">
              <div className="trade-detail">
                <span>Quantity</span>
                <span>{trade.quantity}</span>
              </div>
              <div className="trade-detail">
                <span>Entry Price</span>
                <span>${trade.filled_price?.toFixed(2)}</span>
              </div>
              <div className="trade-detail">
                <span>Executed</span>
                <span>{new Date(trade.executed_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="empty-state">
            <FileText size={48} />
            <p>No trades executed yet</p>
          </div>
        )}
      </div>
    </div>
  )

  // Render reports
  const renderReports = () => (
    <div className="reports-view">
      <h3>Performance Reports</h3>
      
      <div className="report-cards">
        <div className="report-card">
          <h4>Win Rate</h4>
          <div className="report-value">65%</div>
          <div className="report-chart">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={[{ value: 65 }]}>
                <Bar dataKey="value" fill="#2ecc71" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="report-card">
          <h4>Profit Factor</h4>
          <div className="report-value">1.85</div>
          <div className="report-chart">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={[{ value: 1.85 }]}>
                <Bar dataKey="value" fill="#4a90d9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="report-card">
          <h4>Sharpe Ratio</h4>
          <div className="report-value">1.42</div>
          <div className="report-chart">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={[{ value: 1.42 }]}>
                <Bar dataKey="value" fill="#f39c12" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="report-card">
          <h4>Max Drawdown</h4>
          <div className="report-value negative">-8.5%</div>
          <div className="report-chart">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={[{ value: 8.5 }]}>
                <Bar dataKey="value" fill="#e74c3c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="monthly-performance">
        <h4>Monthly Performance</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { month: 'Jan', pnl: 2500 },
            { month: 'Feb', pnl: -1200 },
            { month: 'Mar', pnl: 3800 },
            { month: 'Apr', pnl: 1500 },
            { month: 'May', pnl: 4200 },
            { month: 'Jun', pnl: -800 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
            <Bar dataKey="pnl">
              {[
                { month: 'Jan', pnl: 2500 },
                { month: 'Feb', pnl: -1200 },
                { month: 'Mar', pnl: 3800 },
                { month: 'Apr', pnl: 1500 },
                { month: 'May', pnl: 4200 },
                { month: 'Jun', pnl: -800 }
              ].map((entry, index) => (
                <Cell key={index} fill={entry.pnl >= 0 ? '#2ecc71' : '#e74c3c'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  // Render settings
  const renderSettings = () => (
    <div className="settings-view">
      <h3>System Settings</h3>
      
      <div className="settings-section">
        <h4>Trading Mode</h4>
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'research' ? 'active' : ''}`}
            onClick={() => setMode('research')}
          >
            <FileText size={20} />
            Research
            <span className="mode-desc">Generate signals only, no trades</span>
          </button>
          <button 
            className={`mode-btn ${mode === 'paper_trading' ? 'active' : ''}`}
            onClick={() => setMode('paper_trading')}
          >
            <Shield size={20} />
            Paper Trading
            <span className="mode-desc">Execute paper trades</span>
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h4>Stock Selection</h4>
        <div className="stock-selector">
          {SAMPLE_STOCKS.map(stock => (
            <label key={stock} className="stock-checkbox">
              <input
                type="checkbox"
                checked={selectedStocks.includes(stock)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedStocks([...selectedStocks, stock])
                  } else {
                    setSelectedStocks(selectedStocks.filter(s => s !== stock))
                  }
                }}
              />
              {stock}
            </label>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h4>Service Status</h4>
        <div className="service-status">
          {Object.entries(serviceStatus).map(([name, status]) => (
            <div key={name} className={`service-item ${status}`}>
              {status === 'healthy' ? <CheckCircle size={16} /> : 
               status === 'error' ? <AlertTriangle size={16} /> : 
               <XCircle size={16} />}
              <span>{name}</span>
              <span className="status-text">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <Activity size={28} />
          <span>Trading AI</span>
        </div>
        
        <nav className="nav">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={20} />
            Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'trades' ? 'active' : ''}`}
            onClick={() => setActiveTab('trades')}
          >
            <FileText size={20} />
            Trades
          </button>
          <button 
            className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <PieChartIcon size={20} />
            Reports
          </button>
          <button 
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="mode-indicator">
            <Shield size={16} />
            {mode === 'research' ? 'Research Mode' : 'Paper Trading'}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'trades' && 'Trade History'}
              {activeTab === 'reports' && 'Performance Reports'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
          
          <div className="header-actions">
            <button 
              className={`run-btn ${isRunning ? 'running' : ''}`}
              onClick={runAnalysis}
              disabled={loading || isRunning}
            >
              {isRunning ? <RefreshCw className="spin" size={18} /> : <Play size={18} />}
              {isRunning ? 'Running...' : 'Run Analysis'}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'trades' && renderTrades()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>
    </div>
  )
}

export default App
