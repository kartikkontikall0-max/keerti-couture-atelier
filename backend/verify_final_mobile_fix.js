'use strict';

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\karti\\.gemini\\antigravity\\brain\\25efad69-a7fc-42a2-91ef-ba07f617a7b2';

const VIEWPORTS = [360, 375, 390, 414, 768, 1440, 1650];

(async () => {
  console.log('=== STARTING MULTI-VIEWPORT EMPIRICAL VERIFICATION ===\n');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const measurements = [];

  for (const width of VIEWPORTS) {
    const height = width >= 1024 ? 900 : (width >= 768 ? 1024 : 844);
    await page.setViewport({ width, height });
    await page.goto('http://localhost:3000/designs', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    const result = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyScrollW = document.body.scrollWidth;

      // Find any elements whose right edge strictly exceeds docW + 0.5px
      const offenders = [];
      const allEls = document.querySelectorAll('*');
      allEls.forEach(el => {
        const r = el.getBoundingClientRect();
        // If element is not an inside-scrollable container child that is clipped
        if (r.right > docW + 0.5) {
          offenders.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
            right: Math.round(r.right),
            width: Math.round(r.width),
            text: el.innerText ? el.innerText.trim().slice(0, 30) : ''
          });
        }
      });

      return {
        clientWidth: docW,
        scrollWidth: scrollW,
        bodyScrollWidth: bodyScrollW,
        hasPageHorizontalOverflow: scrollW > docW,
        overflowDelta: Math.max(0, scrollW - docW),
        totalOffenders: offenders.length,
        offenders: offenders.slice(0, 5)
      };
    });

    console.log(`[VIEWPORT ${width}px] clientWidth=${result.clientWidth}, scrollWidth=${result.scrollWidth}, overflow=${result.overflowDelta}px`);
    measurements.push(result);

    // Save screenshot for key viewports
    const shotPath = path.join(ARTIFACT_DIR, `fixed_viewport_${width}px.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
  }

  // ── RETEST FUNCTIONAL SUITE AT 390px (MOBILE) & 1440px (DESKTOP) ──
  console.log('\n=== RETESTING FUNCTIONAL SUITE ON 390px MOBILE ===');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/designs', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Search
  await page.focus('input[placeholder*="Search"]');
  await page.keyboard.type('Ikat', { delay: 50 });
  await new Promise(r => setTimeout(r, 600));
  const searchMatch = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('.group h3, .group h4')).map(e => e.innerText.trim());
    return titles.filter(t => t.length > 0);
  });
  console.log('Search "Ikat" match count:', searchMatch.length, searchMatch);

  // Clear search
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.querySelector('svg.lucide-x'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 2. Category Filter
  const catClickSuccess = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim().toUpperCase() === 'TRADITIONAL');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 600));
  const traditionalTitles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.group h3, .group h4')).map(e => e.innerText.trim()).filter(t => t.length > 0);
  });
  console.log('Category filter "Traditional" clicked:', catClickSuccess, 'Count:', traditionalTitles.length);

  // 3. Price Sorting
  await page.evaluate(() => {
    const sel = document.querySelector('select');
    if (sel) {
      sel.value = 'price-high';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 600));
  const sortedPrices = await page.evaluate(() => {
    const priceEls = Array.from(document.querySelectorAll('*')).filter(el => el.children.length === 0 && el.innerText && el.innerText.startsWith('₹'));
    return priceEls.map(p => p.innerText.trim()).slice(0, 3);
  });
  console.log('Price sort High to Low top 3:', sortedPrices);

  // 4. Wishlist Toggle
  const wishlistHeartToggled = await page.evaluate(() => {
    const heart = document.querySelector('button[aria-label="Save to Wishlist"]');
    if (heart) {
      heart.click();
      return heart.className.includes('rosewood') || heart.innerHTML.includes('fill-current');
    }
    return false;
  });
  console.log('Wishlist heart toggled:', wishlistHeartToggled);

  // 5. Product Detail & Customization Navigation
  await page.goto('http://localhost:3000/designs/6aed6521007cf4fbee56d498', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  const detailMeasurements = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1: document.querySelector('h1')?.innerText,
    hasAiBadge: document.body.innerText.includes('DESIGN INSPIRATION / AI CONCEPT')
  }));
  console.log('Pochampally Ikat detail metrics on 390px:', detailMeasurements);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fixed_detail_390px.png') });

  // Click customization CTA
  const customCta = await page.evaluate(() => {
    const cta = Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes('CUSTOMIZE NECKLINE'));
    return cta ? cta.href : null;
  });
  console.log('Customization CTA target href:', customCta);

  if (customCta) {
    await page.goto(customCta, { waitUntil: 'networkidle2' });
    const customizeMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      title: document.querySelector('h1')?.innerText || document.title
    }));
    console.log('Customization page metrics on 390px:', customizeMetrics);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fixed_customize_390px.png') });
  }

  // Write measurements json to backend
  fs.writeFileSync(path.join(__dirname, 'final_verification_measurements.json'), JSON.stringify(measurements, null, 2));

  await browser.close();
  console.log('\n=== VERIFICATION RUN COMPLETE ===');
})();

