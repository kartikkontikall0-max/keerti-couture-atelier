'use strict';

const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/designs', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[placeholder*="Search"]');
  
  // Wait 1.5s for hydration
  await new Promise(r => setTimeout(r, 1500));
  
  // Focus and type with delay
  await page.focus('input[placeholder*="Search"]');
  await page.keyboard.type('Ikat', { delay: 100 });
  await new Promise(r => setTimeout(r, 1000));
  
  const searchResults = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.group h3, .group h4'));
    return Array.from(new Set(cards.map(c => c.innerText.trim()).filter(t => t.length > 2)));
  });
  console.log('Search names after typing Ikat:', searchResults);

  // Clear search via clear button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const clearBtn = btns.find(b => b.querySelector('svg.lucide-x') || b.innerHTML.includes('lucide-x'));
    if (clearBtn) clearBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Category filter: click 'Traditional'
  const clickedCat = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.trim().toUpperCase() === 'TRADITIONAL');
    if (target) {
      target.click();
      return target.innerText.trim();
    }
    return null;
  });
  await new Promise(r => setTimeout(r, 1000));

  const traditionalDesigns = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.group h3, .group h4'));
    return Array.from(new Set(cards.map(c => c.innerText.trim()).filter(t => t.length > 2)));
  });
  console.log('Category clicked:', clickedCat, 'Traditional designs count:', traditionalDesigns.length, 'Designs:', traditionalDesigns);

  await browser.close();
})();

