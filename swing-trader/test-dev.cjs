const { chromium } = require('playwright');

(async () => {
  console.log('Starting test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  try {
    console.log('Navigating to http://localhost:5180...');
    await page.goto('http://localhost:5180', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Page loaded, waiting for content...');
    
    // Wait for React to render
    await page.waitForTimeout(5000);
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get all button text
    const buttons = await page.locator('button').allTextContents();
    console.log('Buttons found:', buttons.join(' | '));
    
    // Click AI Analysis tab
    console.log('Clicking AI Analysis...');
    const aiButton = page.locator('button:has-text("AI Analysis")');
    await aiButton.click();
    
    // Wait for tab to switch
    await page.waitForTimeout(3000);
    
    // Get page text
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== BODY TEXT (first 3000 chars) ===');
    console.log(bodyText.substring(0, 3000));
    
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
    console.log('\nTest complete');
  }
})();
