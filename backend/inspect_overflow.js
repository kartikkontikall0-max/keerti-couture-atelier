'use strict';

const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const viewports = [360, 375, 390, 414, 768, 1440, 1650];
  
  for (const width of viewports) {
    await page.setViewport({ width, height: 844 });
    await page.goto('http://localhost:3000/designs', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 500));

    const metrics = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyScrollW = document.body.scrollWidth;
      
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowing = [];
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 0.5) {
          overflowing.push({
            tag: el.tagName,
            id: el.id || undefined,
            className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: el.innerText ? el.innerText.trim().slice(0, 40) : undefined
          });
        }
      });
      
      return {
        clientWidth: docWidth,
        scrollWidth: scrollW,
        bodyScrollWidth: bodyScrollW,
        hasOverflow: scrollW > docWidth,
        offenderCount: overflowing.length,
        topOffenders: overflowing.slice(0, 8)
      };
    });

    console.log(`=== VIEWPORT ${width}px ===`);
    console.log(JSON.stringify(metrics, null, 2));
  }

  await browser.close();
})();

