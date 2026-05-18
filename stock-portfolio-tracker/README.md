# Stock Portfolio Tracker

A simple React-based stock portfolio tracker application for tracking your stock investments. This application uses mock data and can be deployed to any web server or run locally in your browser.

## Features

✅ **Add Stocks**: Track your stock purchases with shares and buy price
✅ **Portfolio Summary**: Real-time calculation of portfolio value, cost basis, and unrealized gains/losses
✅ **Interactive UI**: Modern gradient design with smooth animations
✅ **Stock Suggestions**: Auto-complete for stock symbols as you type
✅ **Responsive Design**: Works on mobile, tablet, and desktop
✅ **Sell Stocks**: Remove stocks from your portfolio
✅ **Hover Effects**: View detailed stock information with animations
✅ **Profit Tracking**: See your gains and losses instantly

## Sample Stocks Available

You can add any of these example stocks to your portfolio:

- **AAPL** - Apple Inc.
- **MSFT** - Microsoft Corp
- **GOOGL** - Alphabet Inc. (Google)
- **AMZN** - Amazon.com Inc.
- **TSLA** - Tesla Inc.
- **NVDA** - NVIDIA Corp
- **META** - Meta Platforms Inc. (Facebook)
- **JPM** - JPMorgan Chase
- **V** - Visa Inc.
- **WMT** - Walmart Inc.

## How to Use

### Running the Application


1. **Navigate to the project directory:**
```bash
cd stock-portfolio-tracker
```

2. **Install dependencies (if not already installed):**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
- The app will open automatically at `http://localhost:5174/`
- If it doesn't open automatically, manually visit: `http://localhost:5174/`

### Adding a Stock to Your Portfolio
1. Enter a stock symbol in the "Stock Symbol" field (e.g., "AAPL")
2. Select from the auto-complete suggestions OR press Enter to proceed with your input
3. Enter the number of shares you own
4. Enter the purchase price per share
5. Click "Add Stock" button

The stock will be added to your portfolio, and calculations will update automatically.

### Selling a Stock
- Click the **✕** (remove) button on any stock in your portfolio
- To add additional shares to an existing stock, enter the same symbol again with the new share amount

### Tracking Gains/Losses
- **Gain/Loss Amount**: Shows the difference between current value and cost basis
- **Gain/Loss Percentage**: Shows the percentage change from your purchase price
- **Current Value**: Real-time value of your holdings (uses mock data)

## Portfolio Metrics You Can Track

- **Total Cost Basis**: How much you've invested
- **Current Value**: What your stocks are worth now
- **Unrealized Gain/Loss**: Your profit or loss without selling
- **Overall Performance**: Percentage gain/loss on your entire portfolio
- **Number of Holdings**: Total stocks you're tracking

## Technical Details

- **Framework**: React 19
- **Bundler**: Vite 8
- **Styling**: CSS Modules
- **State Management**: React useState hook
- **Port**: 5174 (default Vite port)
- **Build Output**: Generates static files in `/dist` directory

## Production Build

To build for production:
```bash
npm run build
```

This generates optimized static files in the `/dist` directory that can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, AWS S3, Firebase Hosting, etc.).


After building, you can preview the production build locally:
```bash
npm run preview
```

## Development

- **Folder Structure**:
  - `/src` - Main application files
    - `/components` - Individual component files:
      - `StockPortfolioTracker.jsx` - Main component
      - `StockForm.jsx` - Add stock form
      - `StockList.jsx` - Stock holdings display
      - `PortfolioSummary.jsx` - Portfolio metrics
      - `*.css` - Component-specific styles
    - `App.jsx` - Root React component
    - `main.jsx` - React entry point
    - `App.css` - Global styles
    - `index.css` - Global CSS reset
  - `/dist` - Built files (auto-generated)
  - `/node_modules` - Project dependencies
  - `index.html` - HTML entry point
  - `vite.config.js` - Vite configuration

## Browser Requirements

- Modern browsers (Chrome 89+, Firefox 78+, Safari 14+, Edge 89+)
- JavaScript must be enabled
- Recommended screen resolution: 1024x768 or higher

## Limitations

This is a **prototype** with the following characteristics:

- Uses **mock stock data** (prices don't update in real-time)
- Portfolio data is stored in **browser memory** (clears when you refresh)
- Real-time data would require integration with a stock API (Alpha Vantage, Yahoo Finance, etc.)
- No account system or cloud saving
- Browser-based only (no mobile app)

## Future Enhancements

Potential features you could add:
- Real-time stock price fetching (API integration)
- Historical performance charts
- Portfolio diversification metrics
- News feed for tracked stocks
- Price alerts
- CSV export/import
- Share portfolio summary via link
- Dark mode

## Accessing the Application

Your Stock Portfolio Tracker is now running at:

**🌐 http://localhost:5174/**

Open this URL in any modern web browser to start tracking your stocks!

## Screenshots

The application features:
- Clean, modern interface with gradient colors
- Responsive layout for all device sizes
- Interactive buttons and hover effects
- Clear display of all portfolio metrics
- Easy add/edit functionality

## Troubleshooting

### Common Issues:

1. **Build fails with "Cannot resolve entry module"**
   - Solution: Ensure `index.html` is in the project root, not in `/src`

2. **Dev server doesn't start**
   - Solution: Run `npm install` to install dependencies, then try `npm run dev`

3. **Application doesn't load in browser**
   - Solution: Check that port 5174 is available, try `npm run dev` again

4. **Stock symbols not recognized**
   - Solution: Use the supported symbols listed above, or add more to the `mockStockData` object in `StockPortfolioTracker.jsx`

### Development Tips:

- Run `npm run dev` for live reloading during development
- Run `npm run build` to create production-ready files
- Run `npm run preview` to test the built version
- All CSS files are modular and scoped to their components
- Components are organized by functionality

---

📈 **Happy investing! Track your stocks effortlessly with this modern web application.**
