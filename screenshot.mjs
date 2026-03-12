import puppeteer from 'puppeteer';
import { mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir = join(__dirname, 'temporary screenshots');

mkdirSync(dir, { recursive: true });

const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-')).length;
const num = existing + 1;
const filename = label ? `screenshot-${num}-${label}.png` : `screenshot-${num}.png`;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Scroll down to trigger IntersectionObserver scroll-reveal animations
await page.evaluate(async () => {
  const distance = 400;
  const scrollHeight = document.body.scrollHeight;
  let pos = 0;
  while (pos < scrollHeight) {
    window.scrollBy(0, distance);
    pos += distance;
    await new Promise(r => setTimeout(r, 80));
  }
  // Force all reveal elements visible
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 600));
});

await page.screenshot({ path: join(dir, filename), fullPage: true });
await browser.close();

console.log(`Screenshot saved: temporary screenshots/${filename}`);
