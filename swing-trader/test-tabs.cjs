const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  console.log('Navigating to http://localhost:4173...');
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Test each tab
  const tabs = ['Dashboard', 'Portfolio', 'Signals', 'AI Analysis'];
  
  for (const tab of tabs) {
    console.log(`\n=== Testing ${tab} tab ===`);
    
    // Click the tab button
    await page.click(`.nav-btn:has-text("${tab}")`);
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: `swing-trader/tab-${tab.toLowerCase().replace(' ', '-')}.png` });
    console.log(`Screenshot saved: tab-${tab.toLowerCase().replace(' ', '-')}.png`);
    
    // Analyze the tab content
    const tabContent = await page.evaluate((tabName) => {
      const results = {
        tab: tabName,
        visible: false,
        elements: [],
        issues: []
      };
      
      // Get main content area
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        results.visible = true;
        
        // Get all text content
        const text = mainContent.textContent.trim();
        if (text.length > 0) {
          results.elements.push(text.substring(0, 200));
        }
        
        // Check for empty sections
        const sections = mainContent.querySelectorAll('.card, .panel, .section, .content-card');
        sections.forEach((section, i) => {
          if (section.offsetParent !== null && section.textContent.trim().length < 10) {
            results.issues.push(`Empty section ${i}: class=${section.className}`);
          }
        });
      }
      
      return results;
    }, tab);
    
    console.log('Tab visible:', tabContent.visible);
    console.log('Content preview:', tabContent.elements[0]?.substring(0, 100));
    if (tabContent.issues.length > 0) {
      console.log('Issues:', tabContent.issues);
    }
  }
  
  // Test trade form
  console.log('\n=== Testing Trade Form ===');
  const tradeFormExists = await page.evaluate(() => {
    const buyBtn = document.querySelector('button:has-text("Buy")');
    const sellBtn = document.querySelector('button:has-text("Sell")');
    return { buyBtn: !!buyBtn, sellBtn: !!sellBtn };
  });
  console.log('Buy button exists:', tradeFormExists.buyBtn);
  console.log('Sell button exists:', tradeFormExists.sellBtn);
  
  // Try clicking Buy
  await page.click('button:has-text("Buy")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'swing-trader/tab-after-buy.png' });
  console.log('After Buy click screenshot saved');
  
  if (errors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\nNo console errors!');
  }
  
  await browser.close();
  console.log('\nAll tests complete!');
})();
