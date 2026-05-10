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
  
  // Wait for data to load
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'swing-trader/ui-screenshot.png', fullPage: true });
  console.log('Screenshot saved to swing-trader/ui-screenshot.png');
  
  // Analyze the page structure
  const analysis = await page.evaluate(() => {
    const results = {
      header: null,
      navButtons: [],
      tabs: [],
      contentSections: [],
      visibleElements: []
    };
    
    // Check header
    const header = document.querySelector('.header');
    if (header) {
      results.header = header.textContent.substring(0, 100);
    }
    
    // Check nav buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      results.navButtons.push({
        text: btn.textContent.trim(),
        visible: btn.offsetParent !== null
      });
    });
    
    // Check main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      results.contentSections.push('main-content found');
    }
    
    // Check for visible text elements
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(div => {
      if (div.textContent.trim().length > 20 && div.offsetParent !== null) {
        results.visibleElements.push(div.textContent.trim().substring(0, 50));
      }
    });
    
    // Check for any obvious styling issues
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    results.bodyBg = computedStyle.backgroundColor;
    
    return results;
  });
  
  console.log('\n=== UI ANALYSIS ===');
  console.log('Header:', analysis.header);
  console.log('\nNav Buttons:', analysis.navButtons);
  console.log('\nBody Background:', analysis.bodyBg);
  console.log('\nVisible Elements (first 10):', analysis.visibleElements.slice(0, 10));
  
  if (errors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\nNo console errors!');
  }
  
  // Check if page looks "crappy" by checking for common issues
  const issues = await page.evaluate(() => {
    const issues = [];
    
    // Check for overlapping elements
    const allElements = document.querySelectorAll('*');
    let hasOverlapping = false;
    
    // Check for empty containers
    const containers = document.querySelectorAll('.card, .panel, .section');
    containers.forEach(c => {
      if (c.offsetParent !== null && c.textContent.trim().length === 0) {
        issues.push('Empty container found: ' + c.className);
      }
    });
    
    // Check for very small elements
    allElements.forEach(el => {
      if (el.offsetParent !== null) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) {
          if (el.tagName !== 'BR' && el.tagName !== 'IMG') {
            issues.push('Very small element: ' + el.tagName + ' class=' + el.className);
          }
        }
      }
    });
    
    return issues;
  });
  
  if (issues.length > 0) {
    console.log('\n=== UI ISSUES ===');
    issues.forEach(i => console.log(i));
  }
  
  await browser.close();
  console.log('\nTest complete!');
})();
