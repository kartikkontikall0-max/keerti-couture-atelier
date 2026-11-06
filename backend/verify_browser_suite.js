'use strict';

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\karti\\.gemini\\antigravity\\brain\\25efad69-a7fc-42a2-91ef-ba07f617a7b2';

async function runBrowserVerification() {
  console.log('[Browser Verification] Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // Log console errors and network failures
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`  [Browser Console Error]`, msg.text());
    }
  });

  page.on('requestfailed', req => {
    console.error(`  [Network Failed] ${req.url()} (${req.failure()?.errorText})`);
  });

  // Viewports to test
  const viewports = [
    { name: 'desktop_1650px', width: 1650, height: 1800 },
    { name: 'laptop_1440px', width: 1440, height: 1600 },
    { name: 'tablet_768px', width: 768, height: 1400 },
    { name: 'mobile_390px', width: 390, height: 1200 },
  ];

  console.log('\n--- 1. Testing /designs across Viewports ---');
  for (const vp of viewports) {
    console.log(`Setting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3000/designs', { waitUntil: 'networkidle0', timeout: 20000 });

    // Wait for cards to appear
    await page.waitForSelector('h3', { timeout: 10000 });
    // Additional brief pause for images to load
    await new Promise(r => setTimeout(r, 1200));

    const shotPath = path.join(ARTIFACT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`  ✓ Saved screenshot: ${shotPath}`);
  }

  console.log('\n--- 2. Testing Specific Mandatory Blouses on Desktop ---');
  await page.setViewport({ width: 1650, height: 1600 });
  await page.goto('http://localhost:3000/designs', { waitUntil: 'networkidle0' });

  // Find IDs for the 3 required designs
  const designCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.group'));
    return cards.map(c => {
      const title = c.querySelector('h3')?.innerText || '';
      const link = c.querySelector('a')?.getAttribute('href') || '';
      const img = c.querySelector('img')?.getAttribute('src') || '';
      const badge = c.querySelector('.bg-black\\/70')?.innerText || '';
      return { title, link, img, badge };
    });
  });

  console.log(`Total rendered cards on /designs: ${designCards.length}`);

  const mandatoryNames = [
    'Pochampally Ikat Blouse',
    'Banarasi Silk Elegance',
    'Kanjivaram Silk Classic',
  ];

  for (const name of mandatoryNames) {
    const match = designCards.find(d => d.title.includes(name));
    if (match) {
      console.log(`\nInspecting Mandatory Blouse: "${name}"`);
      console.log(`  Link: ${match.link}`);
      console.log(`  Image: ${match.img}`);
      console.log(`  Provenance Badge: ${match.badge || 'None'}`);

      // Visit detail page
      await page.goto(`http://localhost:3000${match.link}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('h1', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 800));

      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const detailShot = path.join(ARTIFACT_DIR, `detail_${cleanName}.png`);
      await page.screenshot({ path: detailShot, fullPage: false });
      console.log(`  ✓ Saved detail screenshot: ${detailShot}`);
    } else {
      console.error(`  ❌ Mandatory design "${name}" not found on page!`);
    }
  }

  console.log('\n--- 3. Testing Category Filter and Search ---');
  await page.goto('http://localhost:3000/designs', { waitUntil: 'networkidle0' });

  // Click Bridal category tab
  console.log('Testing category filter: Clicking "Bridal Blouse"...');
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.innerText, tab);
    if (text.includes('BRIDAL BLOUSE')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }

  const bridalCount = await page.evaluate(() => {
    return document.querySelectorAll('.group').length;
  });
  console.log(`  ✓ Rendered cards under "Bridal Blouse": ${bridalCount}`);

  // Test search input
  console.log('Testing search: Searching "Ikat"...');
  await page.click('input[placeholder*="Search"]', { clickCount: 3 });
  await page.type('input[placeholder*="Search"]', 'Ikat');
  await new Promise(r => setTimeout(r, 600));

  const ikatSearchResults = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.group'));
    return cards.map(c => c.querySelector('h3')?.innerText || '');
  });
  console.log(`  ✓ Search results for "Ikat":`, ikatSearchResults);

  await browser.close();
  console.log('\n[Browser Verification] All browser checks and screenshots completed successfully!');
}

runBrowserVerification().catch(err => {
  console.error('[Browser Verification Fatal Error]', err);
  process.exit(1);
});

