#!/usr/bin/env node
/**
 * Writes public/sitemap.xml and public/robots.txt after the site is copied to public/.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BASE_URL = "https://www.zyflow.eu";
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public");

const SOURCE_PAGES = [
  "index.html",
  "waitlist.html",
  "about.html",
  "contact.html",
  "faqs.html",
  "changelog.html",
  "legal-pages/privacy-policy.html",
  "legal-pages/cookie-policy.html",
  "legal-pages/terms-conditions.html",
];

function urlPathForFile(relFile, localePrefix) {
  let p = relFile.replace(/index\.html$/, "").replace(/\.html$/, "");
  const base = p ? `/${p}` : "/";
  if (localePrefix === "sl") {
    return p ? `/sl${base}` : "/sl/";
  }
  return base === "/" ? "/" : base;
}

function pageUrl(relFile, localePrefix) {
  const pagePath = urlPathForFile(relFile, localePrefix);
  if (localePrefix === "sl") {
    return pagePath.endsWith("/") ? `${BASE_URL}${pagePath}` : `${BASE_URL}${pagePath}`;
  }
  return pagePath === "/" ? `${BASE_URL}/` : `${BASE_URL}${pagePath}`;
}

function hreflangUrls(relFile) {
  return {
    en: pageUrl(relFile, "en"),
    sl: pageUrl(relFile, "sl"),
    xDefault: pageUrl(relFile, "en"),
  };
}

function getLastMod(relFile) {
  const candidates = [
    path.join(ROOT, relFile),
    path.join(ROOT, "sl", relFile),
  ];
  let newest = 0;
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const gitDate = execSync(`git log -1 --format=%cs -- "${filePath}"`, {
        cwd: ROOT,
        encoding: "utf8",
      }).trim();
      if (gitDate) {
        const ts = Date.parse(gitDate);
        if (!Number.isNaN(ts)) newest = Math.max(newest, ts);
        continue;
      }
    } catch {
      // fall through to mtime
    }
    newest = Math.max(newest, fs.statSync(filePath).mtimeMs);
  }
  if (newest > 0) {
    return new Date(newest).toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function xmlEscape(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemapXml() {
  const urls = [];
  for (const relFile of SOURCE_PAGES) {
    const lastmod = getLastMod(relFile);
    const alternates = hreflangUrls(relFile);
    for (const locale of ["en", "sl"]) {
      const loc = pageUrl(relFile, locale);
      urls.push({ loc, lastmod, alternates });
    }
  }

  const body = urls
    .map(({ loc, lastmod, alternates }) => {
      const links = [
        `<xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(alternates.en)}" />`,
        `<xhtml:link rel="alternate" hreflang="sl" href="${xmlEscape(alternates.sl)}" />`,
        `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(alternates.xDefault)}" />`,
      ].join("");
      return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    ${links}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;
}

function main() {
  if (!fs.existsSync(OUT)) {
    console.error("public/ not found — run prepare-public copy first");
    process.exit(1);
  }

  fs.writeFileSync(path.join(OUT, "sitemap.xml"), buildSitemapXml());
  fs.writeFileSync(
    path.join(OUT, "robots.txt"),
    "User-agent: *\nAllow: /\n\nSitemap: https://www.zyflow.eu/sitemap.xml\n"
  );
  console.log("✓ Generated public/sitemap.xml and public/robots.txt");
}

main();
