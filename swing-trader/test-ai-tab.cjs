const { chromium } = require('playwright');

(async () => {
  console.log('Starting test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  try {
    console.log('Navigating to http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded');
    
    // Wait for content
    await page.waitForTimeout(3000);
    
    // Get all buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('All buttons on page:', buttons.join(' | '));
    
    // Click on AI Analysis tab
    console.log('Clicking AI Analysis tab...');
    await page.click('button:has-text("AI Analysis")');
    await page.waitForTimeout(2000);
    
    // Get visible text
    const text = await page.evaluate(() => document.body.innerText);
    console.log('\n=== Page Text ===');
    console.log(text);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
