#!/usr/bin/env node
/**
 * Stitch HTML partials + inject locale strings → rebuild/dist/
 * Builds EN at dist/ and SL at dist/sl/, plus sitemap.xml / robots.txt.
 *
 * Include syntax: <!-- include:components/nav.html -->
 * Locale: data-i18n / data-i18n-html
 *
 * Usage:
 *   node rebuild/scripts/build.js
 *   SITE_INDEX=true node rebuild/scripts/build.js
 */

const fs = require("fs");
const path = require("path");
const {
  SITE_ORIGIN,
  LOCALES,
  DEFAULT_LOCALE,
  PAGES,
  pageLocales,
  absoluteUrl,
  hrefForPage,
  localizedPath,
} = require("./pages");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PAGES_DIR = path.join(ROOT, "pages");
const LOCALES_DIR = path.join(ROOT, "locales");
const SITE_INDEX = process.env.SITE_INDEX === "true";

const OG_IMAGE_PATH = "/assets/images/home/hero.jpg";
const OG_LOCALES = { en: "en_US", sl: "sl_SI" };

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rimrafContents(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    fs.rmSync(full, { recursive: true, force: true });
  }
}

function getByPath(obj, dotted) {
  return dotted.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    const index = Number(key);
    if (Array.isArray(acc) && Number.isInteger(index) && String(index) === key) {
      return acc[index];
    }
    return acc[key];
  }, obj);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function flattenKeys(obj, prefix = "", out = []) {
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
    if (prefix) out.push(prefix);
    return out;
  }
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      flattenKeys(value, next, out);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item != null && typeof item === "object") {
          flattenKeys(item, `${next}.${i}`, out);
        } else {
          out.push(`${next}.${i}`);
        }
      });
    } else {
      out.push(next);
    }
  }
  return out;
}

function assertLocaleParity(messagesByLocale) {
  const base = messagesByLocale[DEFAULT_LOCALE];
  const baseKeys = new Set(flattenKeys(base));
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    const keys = new Set(flattenKeys(messagesByLocale[locale]));
    const missing = [...baseKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !baseKeys.has(k));
    if (missing.length || extra.length) {
      const parts = [];
      if (missing.length) {
        parts.push(
          `missing in ${locale} (${missing.length}): ${missing.slice(0, 12).join(", ")}${
            missing.length > 12 ? "…" : ""
          }`
        );
      }
      if (extra.length) {
        parts.push(
          `extra in ${locale} (${extra.length}): ${extra.slice(0, 12).join(", ")}${
            extra.length > 12 ? "…" : ""
          }`
        );
      }
      throw new Error(`Locale key parity failed — ${parts.join("; ")}`);
    }
  }
}

function resolveIncludes(html, stack = []) {
  const pattern = /<!--\s*include:([^\s]+)\s*-->/g;
  return html.replace(pattern, (_, rel) => {
    const clean = rel.trim();
    if (stack.includes(clean)) {
      throw new Error(`Circular include: ${[...stack, clean].join(" → ")}`);
    }
    const filePath = path.join(ROOT, clean);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing include: ${clean}`);
    }
    const partial = read(filePath);
    return resolveIncludes(partial, [...stack, clean]);
  });
}

function applyI18n(html, messages) {
  html = html.replace(
    /(<([a-zA-Z0-9-]+)([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>)([\s\S]*?)(<\/\2>)/g,
    (match, open, _tag, _pre, key, _post, _inner, close) => {
      const value = getByPath(messages, key);
      if (value === undefined || value === null) return match;
      if (typeof value !== "string") return match;
      return `${open}${escapeHtml(value)}${close}`;
    }
  );

  html = html.replace(
    /(<([a-zA-Z0-9-]+)([^>]*?)\sdata-i18n-html="([^"]+)"([^>]*)>)([\s\S]*?)(<\/\2>)/g,
    (match, open, _tag, _pre, key, _post, _inner, close) => {
      const value = getByPath(messages, key);
      if (typeof value !== "string") return match;
      return `${open}${value}${close}`;
    }
  );

  return html;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function pageById(id) {
  return PAGES.find((p) => p.id === id);
}

function rewriteAssetPaths(html) {
  return html
    .replace(/(href|src)="\.\/(assets|css|js)\//g, '$1="/$2/')
    .replace(/(href|src)="(assets|css|js)\//g, '$1="/$2/');
}

function rewriteInternalLinks(html, locale) {
  // ./index.html or index.html → localized home
  html = html.replace(
    /\b(href)="(?:\.\/)?index\.html"/g,
    (_, attr) => `${attr}="${hrefForPage("/", locale)}"`
  );

  // ./about.html → /about or /sl/about (preserve ?query and #hash)
  html = html.replace(
    /\b(href)="(?:\.\/)?([a-z0-9-]+)\.html(\?[^"#]*)?(#[^"]*)?"/g,
    (match, attr, slug, query = "", hash = "") => {
      const page = PAGES.find((p) => p.out === `${slug}.html` || p.file === `${slug}.html`);
      if (!page) return match;
      const localeForPage = pageLocales(page).includes(locale) ? locale : DEFAULT_LOCALE;
      return `${attr}="${hrefForPage(page.path, localeForPage)}${query || ""}${hash || ""}"`;
    }
  );

  return html;
}

function injectLangSwitcher(html, page, locale) {
  const enHref = hrefForPage(page.path, "en");
  const slHref = pageLocales(page).includes("sl")
    ? hrefForPage(page.path, "sl")
    : hrefForPage("/", "sl");

  const switcher = `
      <div class="lang-switch" role="group" aria-label="Language">
        <a class="lang-switch__btn${locale === "en" ? " is-active" : ""}" href="${enHref}" hreflang="en" lang="en" data-lang="en"${locale === "en" ? ' aria-current="true"' : ""}>EN</a>
        <a class="lang-switch__btn${locale === "sl" ? " is-active" : ""}" href="${slHref}" hreflang="sl" lang="sl" data-lang="sl"${locale === "sl" ? ' aria-current="true"' : ""}>SL</a>
      </div>`;

  if (html.includes("<!-- lang-switch -->")) {
    return html.replaceAll("<!-- lang-switch -->", switcher);
  }
  // Insert before first theme toggle if marker missing
  return html.replace(
    /(<div class="theme-toggle")/,
    `${switcher}\n      $1`
  );
}

function buildHead(page, locale, messages) {
  const meta = getByPath(messages, `meta.pages.${page.id}`) || {};
  const title =
    meta.title ||
    getByPath(messages, "meta.brand") ||
    "Zyflow";
  const description =
    meta.description ||
    "Smart navigation for cyclists and e-bike riders.";
  const alwaysNoIndex = !page.indexable;
  const robots = alwaysNoIndex || !SITE_INDEX ? "noindex, nofollow" : "index, follow";
  const canonical = absoluteUrl(page.path, locale);
  const ogImage = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;
  const ogLocale = OG_LOCALES[locale] || "en_US";

  const localesForPage = pageLocales(page);
  const hreflang = localesForPage
    .map(
      (lang) =>
        `<link rel="alternate" hreflang="${lang}" href="${absoluteUrl(page.path, lang)}" />`
    )
    .concat(
      localesForPage.includes(DEFAULT_LOCALE)
        ? [
            `<link rel="alternate" hreflang="x-default" href="${absoluteUrl(
              page.path,
              DEFAULT_LOCALE
            )}" />`,
          ]
        : []
    )
    .join("\n");

  const ogLocaleAlts = localesForPage
    .filter((lang) => lang !== locale)
    .map(
      (lang) =>
        `<meta property="og:locale:alternate" content="${OG_LOCALES[lang] || lang}" />`
    )
    .join("\n");

  const preloads = [
    `<link rel="preload" href="/assets/fonts/DMSans.woff2" as="font" type="font/woff2" crossorigin />`,
    `<link rel="preload" href="/assets/fonts/Tanker-Regular.woff2" as="font" type="font/woff2" crossorigin />`,
  ];
  if (page.preloadHero) {
    preloads.push(
      `<link rel="preload" href="/assets/images/home/hero.jpg" as="image" fetchpriority="high" />`
    );
  }

  let head = read(path.join(ROOT, "components/head.html"));
  // Resolve theme-boot include inside head
  head = resolveIncludes(head);

  const themeColor = "#f9f8f4";
  const replacements = {
    title: escapeHtml(title),
    description: escapeAttr(description),
    robots,
    canonical: escapeAttr(canonical),
    hreflang,
    ogImage: escapeAttr(ogImage),
    ogLocale,
    ogLocaleAlts,
    themeColor,
    preloads: preloads.join("\n"),
  };

  return head.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    replacements[key] != null ? replacements[key] : ""
  );
}

function injectDocumentHead(html, page, locale, messages) {
  const headInner = buildHead(page, locale, messages);
  html = html.replace(/<html([^>]*)lang="[^"]*"([^>]*)>/i, `<html$1lang="${locale}"$2>`);
  html = html.replace(/<html(?![^>]*lang=)/i, `<html lang="${locale}"`);

  if (/<!--\s*include:components\/head\.html\s*-->/.test(html)) {
    // Already resolved by resolveIncludes — look for head markers
  }

  // Replace entire <head>...</head> content when page uses head include stub,
  // or replace placeholder block.
  if (html.includes("<!-- rebuild-head -->")) {
    return html.replace("<!-- rebuild-head -->", headInner);
  }

  return html.replace(/<head[^>]*>[\s\S]*?<\/head>/i, `<head>\n${headInner}\n  </head>`);
}

function writeSeoFiles() {
  const indexable = PAGES.filter((p) => p.indexable);
  const today = new Date().toISOString().slice(0, 10);

  const urls = [];
  for (const page of indexable) {
    for (const locale of pageLocales(page)) {
      const loc = absoluteUrl(page.path, locale);
      const alternates = pageLocales(page)
        .map(
          (lang) =>
            `    <xhtml:link rel="alternate" hreflang="${lang}" href="${absoluteUrl(
              page.path,
              lang
            )}" />`
        )
        .concat([
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(
            page.path,
            DEFAULT_LOCALE
          )}" />`,
        ])
        .join("\n");
      urls.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
${alternates}
  </url>`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

  const robots = `User-agent: *
Allow: /
Disallow: /styleguide
Disallow: /sl/styleguide

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;

  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap, "utf8");
  fs.writeFileSync(path.join(DIST, "robots.txt"), robots, "utf8");
  console.log("built sitemap.xml");
  console.log("built robots.txt");
}

function buildPage(page, locale, messages) {
  const sourcePath = path.join(PAGES_DIR, page.file);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing page file: ${page.file}`);
  }
  let html = read(sourcePath);
  html = resolveIncludes(html);
  html = applyI18n(html, messages);
  html = rewriteAssetPaths(html);
  html = rewriteInternalLinks(html, locale);
  html = injectLangSwitcher(html, page, locale);
  html = injectDocumentHead(html, page, locale, messages);

  // Ensure body knows locale for CSS/JS if needed
  if (!/\sdata-locale=/.test(html)) {
    html = html.replace(/<body([^>]*)>/i, `<body$1 data-locale="${locale}">`);
  } else {
    html = html.replace(/\sdata-locale="[^"]*"/, ` data-locale="${locale}"`);
  }

  const outDir =
    locale === DEFAULT_LOCALE ? DIST : path.join(DIST, locale);
  ensureDir(outDir);
  const outFile = path.join(outDir, page.out);
  fs.writeFileSync(outFile, html, "utf8");
  const label =
    locale === DEFAULT_LOCALE ? page.out : path.join(locale, page.out);
  console.log(`built ${label}`);
}

function build() {
  const messagesByLocale = {};
  for (const locale of LOCALES) {
    const localePath = path.join(LOCALES_DIR, `${locale}.json`);
    if (!fs.existsSync(localePath)) {
      console.error(`Locale not found: ${localePath}`);
      process.exit(1);
    }
    messagesByLocale[locale] = JSON.parse(read(localePath));
  }

  assertLocaleParity(messagesByLocale);

  ensureDir(DIST);
  rimrafContents(DIST);

  copyDir(path.join(ROOT, "assets"), path.join(DIST, "assets"));
  copyDir(path.join(ROOT, "css"), path.join(DIST, "css"));
  copyDir(path.join(ROOT, "js"), path.join(DIST, "js"));

  for (const locale of LOCALES) {
    const messages = messagesByLocale[locale];
    for (const page of PAGES) {
      if (!pageLocales(page).includes(locale)) continue;
      buildPage(page, locale, messages);
    }
  }

  writeSeoFiles();

  console.log(
    `\nRebuild complete → ${path.relative(process.cwd(), DIST)} (locales=${LOCALES.join(
      ","
    )}, index=${SITE_INDEX ? "on" : "off"})`
  );
}

build();
