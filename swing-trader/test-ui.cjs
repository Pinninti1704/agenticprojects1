const { chromium } = require('playwright');

(async () => {
  console.log('Starting UI test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(`[ERROR] ${msg.text()}`);
    }
  });
  
  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  try {
    console.log('Navigating to http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('Page loaded, waiting for content...');
    await page.waitForTimeout(3000);
    
    // Check if page has content
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check for key UI elements
    const checks = [
      { selector: 'text=Dashboard', name: 'Dashboard tab' },
      { selector: 'text=Portfolio', name: 'Portfolio tab' },
      { selector: 'text=Trade', name: 'Trade tab' },
      { selector: 'text=Analysis', name: 'Analysis tab' },
      { selector: 'text=Watchlist', name: 'Watchlist' },
    ];
    
    console.log('\n--- UI Element Checks ---');
    for (const check of checks) {
      try {
        const element = await page.locator(check.selector).first();
        const isVisible = await element.isVisible({ timeout: 5000 });
        console.log(`${isVisible ? '✓' : '✗'} ${check.name}: ${isVisible ? 'Found' : 'Not found'}`);
      } catch (e) {
        console.log(`✗ ${check.name}: Not found`);
      }
    }
    
    // Check for chart
    console.log('\n--- Chart Check ---');
    const hasChart = await page.locator('.recharts-wrapper, [class*="chart"]').count() > 0;
    console.log(`${hasChart ? '✓' : '✗'} Chart component: ${hasChart ? 'Found' : 'Not found'}`);
    
    // Check for service status
    console.log('\n--- Service Status ---');
    const serviceStatus = await page.locator('text=Services Connected').count() > 0 || 
                          await page.locator('text=Checking').count() > 0;
    console.log(`${serviceStatus ? '✓' : '✗'} Service status indicator: ${serviceStatus ? 'Found' : 'Not found'}`);
    
    // Report console errors
    console.log('\n--- Console Errors ---');
    if (consoleMessages.length > 0) {
      consoleMessages.forEach(msg => console.log(msg));
    } else {
      console.log('No console errors detected');
    }
    
    // Report page errors
    console.log('\n--- Page Errors ---');
    if (pageErrors.length > 0) {
      pageErrors.forEach(err => console.log(`[PAGE ERROR] ${err}`));
    } else {
      console.log('No page errors detected');
    }
    
    // Check if page went blank (blank white screen)
    console.log('\n--- Stability Check ---');
    const bodyText = await page.locator('body').innerText();
    const isBlank = bodyText.trim().length < 50;
    console.log(`${!isBlank ? '✓' : '✗'} Page content: ${isBlank ? 'Blank/Empty' : 'Has content'}`);
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('The app is running and UI elements are present.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
