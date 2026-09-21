#!/usr/bin/env node
/**
 * Reports EN strings from locales/en.json still present as visible text in sl/*.html
 * (only checks elements with data-i18n that still contain EN values).
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.join(__dirname, "..");
const en = require(path.join(ROOT, "locales", "en.json"));
const sl = require(path.join(ROOT, "locales", "sl.json"));
const slPages = [
  "sl/index.html",
  "sl/waitlist.html",
  "sl/about.html",
  "sl/contact.html",
  "sl/faqs.html",
];

let failed = false;
for (const rel of slPages) {
  const html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const $ = cheerio.load(html);
  const leaks = [];
  $("[data-i18n]").each((_, el) => {
    const key = $(el).attr("data-i18n");
    const text = $(el).text().trim();
    if (en[key] && text === en[key] && sl[key] !== en[key]) leaks.push(key);
  });
  if (leaks.length) {
    failed = true;
    console.error(`${rel}: ${leaks.length} untranslated keys`, leaks.slice(0, 15).join(", "));
  } else {
    console.log(`✓ ${rel} — no stale EN on annotated nodes`);
  }
}

process.exit(failed ? 1 : 0);
