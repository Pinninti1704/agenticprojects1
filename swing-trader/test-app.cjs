const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  
  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  try {
    console.log('Navigating to http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('Page loaded, waiting 5 seconds...');
    await page.waitForTimeout(5000);
    
    // Check page content
    const bodyContent = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log('Page body (first 500 chars):', bodyContent);
    
    // Check for console errors
    const errors = consoleMessages.filter(m => m.type === 'error');
    console.log('\nConsole errors:');
    errors.forEach(e => console.log('  -', e.text));
    
    // Check for page errors
    console.log('\nPage errors:');
    pageErrors.forEach(e => console.log('  -', e));
    
    // Check if page is blank
    const isBlank = await page.evaluate(() => document.body.innerHTML.trim() === '');
    console.log('\nIs page blank?', isBlank);
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
})();
