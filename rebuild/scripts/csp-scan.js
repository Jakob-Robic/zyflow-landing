#!/usr/bin/env node
/**
 * Headless scan of built pages with vercel.json headers applied.
 * Grants analytics + advertising cookies so GTM/GA4/PostHog/Meta can load.
 */
'use strict';

const pages = [
  '/',
  '/tours',
  '/tour',
  '/about',
  '/contact',
  '/business',
  '/legal',
  '/legal-pages/privacy-policy',
  '/legal-pages/terms',
  '/legal-pages/cookie-policy',
  '/legal-pages/impressum',
  '/blog',
  '/sl',
  '/sl/tours',
  '/sl/tour',
  '/sl/about',
  '/sl/contact',
  '/sl/business',
  '/sl/legal',
  '/sl/legal-pages/privacy-policy',
  '/sl/legal-pages/terms',
  '/sl/legal-pages/cookie-policy',
  '/sl/legal-pages/impressum',
  '/sl/blog',
];

const CONSENT = encodeURIComponent(
  JSON.stringify({
    categories: ['necessary', 'analytics', 'advertisement'],
    revision: 1,
    data: null,
    rfc_cookie: false,
  })
);

async function main() {
  const puppeteerModule = process.env.PUPPETEER_MODULE || 'puppeteer-core';
  const puppeteer = require(puppeteerModule);
  const origin = process.env.SCAN_ORIGIN || 'http://127.0.0.1:4173';
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const summary = [];

  for (const pagePath of pages) {
    const page = await browser.newPage();
    const violations = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (/content security policy|refused to/i.test(text)) {
        violations.push(text);
      }
    });
    page.on('pageerror', (err) => pageErrors.push(String(err.message || err)));
    await page.setCookie({
      name: 'cc_cookie',
      value: CONSENT,
      url: origin,
    });
    const url = origin + pagePath;
    const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2500));
    const headers = response ? response.headers() : {};
    const fontsOk = await page.evaluate(() => {
      const faces = [...document.fonts].map((f) => f.family);
      return faces.some((f) => /DM Sans|Tanker|Courier/i.test(f)) || document.fonts.size > 0;
    });
    summary.push({
      path: pagePath,
      status: response && response.status(),
      acao: headers['access-control-allow-origin'] || null,
      csp: headers['content-security-policy-report-only'] ? 'present' : 'missing',
      reporting: headers['reporting-endpoints'] || null,
      fontsOk,
      violations,
      pageErrors: pageErrors.slice(0, 5),
    });
    await page.close();
  }

  // Form posts against local handlers
  const page = await browser.newPage();
  await page.setCookie({ name: 'cc_cookie', value: CONSENT, url: origin });
  await page.goto(origin + '/contact', { waitUntil: 'networkidle0', timeout: 45000 });
  await page.type('#contact-first', 'Ada');
  await page.type('#contact-last', 'Lovelace');
  await page.type('#contact-email', 'ada@zyflow.eu');
  await page.type('#contact-message', 'Header-server form check');
  await page.click('form.contact-form__form button[type="submit"]');
  await page.waitForFunction(() => {
    const s = document.querySelector('form.contact-form__form .form-status');
    return s && s.textContent.trim().length > 0;
  }, { timeout: 8000 });
  const contactStatus = await page.evaluate(() => {
    const s = document.querySelector('form.contact-form__form .form-status');
    return { text: s.textContent.trim(), state: s.dataset.state };
  });
  await page.type('#footer-email', 'news@zyflow.eu');
  await page.click('form.footer__email button[type="submit"]');
  await page.waitForFunction(() => {
    const s = document.querySelector('form.footer__email .form-status');
    return s && s.textContent.trim().length > 0;
  }, { timeout: 8000 });
  const waitlistStatus = await page.evaluate(() => {
    const s = document.querySelector('form.footer__email .form-status');
    return { text: s.textContent.trim(), state: s.dataset.state };
  });
  await page.close();
  await browser.close();

  const out = { pages: summary, contactStatus, waitlistStatus };
  console.log(JSON.stringify(out, null, 2));
  const bad = summary.filter((p) => (p.violations && p.violations.length) || p.status >= 400);
  if (bad.length) {
    console.error(`\n${bad.length} page(s) had CSP console violations or HTTP errors`);
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
