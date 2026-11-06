'use strict';

const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/designs', { waitUntil: 'networkidle2' });

  // 1. Initial count
  const initialCards = await page.evaluate(() => document.querySelectorAll('a[href^="/designs/6"]').length);
  console.log('Initial cards count:', initialCards);

  // 2. Search test
  await page.type('input[placeholder*="Search"]', 'Ikat');
  await new Promise(r => setTimeout(r, 600));
  const searchCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('a[href^="/designs/6"]'));
    return cards.map(c => c.innerText.trim());
  });
  console.log('Search results for "Ikat":', searchCards.length);

  // 3. Clear search and test Category Filter
  await page.click('input[placeholder*="Search"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await new Promise(r => setTimeout(r, 600));

  // Click 'Bridal' category
  const bridalClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const bridalBtn = btns.find(b => b.innerText.includes('Bridal'));
    if (bridalBtn) {
      bridalBtn.click();
      return true;
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 600));
  const bridalCount = await page.evaluate(() => document.querySelectorAll('a[href^="/designs/6"]').length);
  console.log('Bridal button clicked:', bridalClicked, 'Count after Bridal filter:', bridalCount);

  // 4. Test Sorting: High to Low
  const sortSuccess = await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      select.value = 'price-desc';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 600));
  const prices = await page.evaluate(() => {
    const priceEls = Array.from(document.querySelectorAll('*')).filter(el => el.children.length === 0 && el.innerText && el.innerText.startsWith('₹'));
    return priceEls.map(p => p.innerText).slice(0, 5);
  });
  console.log('Sort price-desc success:', sortSuccess, 'Top 5 prices:', prices);

  // 5. Test Wishlist toggle
  const wishlistBefore = await page.evaluate(() => {
    const hearts = Array.from(document.querySelectorAll('button[aria-label="Save to Wishlist"]'));
    return hearts.length;
  });
  await page.click('button[aria-label="Save to Wishlist"]');
  await new Promise(r => setTimeout(r, 300));
  const likedState = await page.evaluate(() => {
    const heart = document.querySelector('button[aria-label="Save to Wishlist"]');
    return heart ? heart.className : null;
  });
  console.log('Wishlist buttons count:', wishlistBefore, 'Heart active style:', likedState && likedState.includes('rosewood'));

  // 6. Navigate to Pochampally Ikat detail and verify customize button
  await page.goto('http://localhost:3000/designs/6aed6521007cf4fbee56d498', { waitUntil: 'networkidle2' });
  const customizeBtn = await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes('CUSTOMIZE NECKLINE'));
    return link ? { text: link.innerText, href: link.href } : null;
  });
  console.log('Customize Button:', customizeBtn);

  await browser.close();
})();

