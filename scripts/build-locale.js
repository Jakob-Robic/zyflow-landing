#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const BASE_URL = "https://zyflow.eu";
const ROOT = path.join(__dirname, "..");
const SL_DIR = path.join(ROOT, "sl");

const en = JSON.parse(fs.readFileSync(path.join(ROOT, "locales", "en.json"), "utf8"));
const sl = JSON.parse(fs.readFileSync(path.join(ROOT, "locales", "sl.json"), "utf8"));

const slKeys = Object.keys(sl);
for (const key of Object.keys(en)) {
  if (!(key in sl)) {
    console.error(`Missing SL translation for key: ${key}`);
    process.exit(1);
  }
}

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

const SL_RUNTIME_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "sl-runtime-template.js"),
  "utf8"
);

function buildSlRuntimeScript() {
  let script = SL_RUNTIME_TEMPLATE;
  for (const [marker, data] of [
    ["__ZF_SL_LOCALE__", sl],
    ["__ZF_EN_LOCALE__", en],
  ]) {
    const parts = script.split(marker);
    if (parts.length !== 2) {
      throw new Error(`sl-runtime-template.js must contain exactly one ${marker}`);
    }
    script = parts[0] + JSON.stringify(data) + parts[1];
  }
  return script;
}

const LANG_SWITCHER_CSS = fs.readFileSync(
  path.join(ROOT, "css", "lang-switcher.css"),
  "utf8"
);

const LANG_SWITCHER_JS = `(function() {
  var switcher = document.querySelector('#zf-switcher-portal .zf-lang-switcher');
  if (!switcher) return;
  var btn = switcher.querySelector('.zf-lang-btn');
  var menu = switcher.querySelector('.zf-lang-menu');
  var isSL = location.pathname.startsWith('/sl');

  menu.querySelectorAll('li').forEach(function(li) {
    if (li.dataset.lang === (isSL ? 'sl' : 'en')) {
      li.setAttribute('aria-selected', 'true');
    }
  });

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    menu.hidden = open;
  });

  document.addEventListener('click', function() {
    btn.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
  });

  menu.querySelectorAll('li').forEach(function(li) {
    li.addEventListener('click', function(e) {
      e.stopPropagation();
      if (li.dataset.lang === (isSL ? 'sl' : 'en')) return;
      var currentPath = location.pathname.replace(/\\/index\\.html$/, '/') || '/';
      var target;
      if (li.dataset.lang === 'sl' && !isSL) {
        var enPath = currentPath.replace(/\\.html$/, '') || '/';
        target = enPath === '/' ? '/sl/' : '/sl' + enPath;
      } else if (li.dataset.lang === 'en' && isSL) {
        target = currentPath.replace(/^\\/sl/, '') || '/';
        if (target !== '/' && !target.endsWith('.html')) target += '/';
      } else {
        return;
      }
      location.href = target;
    });
  });
})();`;

function langSwitcherHtml(isSl) {
  const current = isSl ? "SL" : "EN";
  return `<div class="zf-lang-switcher" role="navigation" aria-label="Language">
  <button class="zf-lang-btn" type="button" aria-expanded="false" aria-haspopup="listbox">
    <span class="zf-lang-current">${current}</span>
    <svg class="zf-lang-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>
  <ul class="zf-lang-menu" role="listbox" hidden>
    <li role="option" data-lang="en">English</li>
    <li role="option" data-lang="sl">Slovenščina</li>
  </ul>
</div>`;
}

function urlPathForFile(relFile, localePrefix) {
  let p = relFile.replace(/index\.html$/, "").replace(/\.html$/, "");
  if (!p.endsWith("/") && p.includes("/")) {
    // legal-pages/privacy-policy -> legal-pages/privacy-policy
  } else if (p === "") {
    p = "";
  }
  const base = p ? `/${p}` : "/";
  if (localePrefix === "sl") {
    return p ? `/sl${base}` : "/sl/";
  }
  return base === "/" ? "/" : base;
}

function injectHreflang($, relFile) {
  const enPath = urlPathForFile(relFile, "en");
  const slPath = urlPathForFile(relFile, "sl");
  const enUrl = `${BASE_URL}${enPath === "/" ? "" : enPath}`.replace(/\/$/, "") || BASE_URL;
  const slUrl = `${BASE_URL}${slPath}`.replace(/\/$/, "") || `${BASE_URL}/sl`;
  const enHref = enPath === "/" ? `${BASE_URL}/` : `${BASE_URL}${enPath}`;
  const slHref = slPath.endsWith("/") ? `${BASE_URL}${slPath}` : `${BASE_URL}${slPath}`;

  $("link[data-zf-hreflang]").remove();
  $("head").append(
    `<link rel="alternate" hreflang="en" href="${enHref}" data-zf-hreflang>` +
      `<link rel="alternate" hreflang="sl" href="${slHref}" data-zf-hreflang>` +
      `<link rel="alternate" hreflang="x-default" href="${enHref}" data-zf-hreflang>`
  );
}

function injectSlRuntime($) {
  $("#zf-sl-runtime").remove();
  const script = buildSlRuntimeScript();
  $("head").append(`<script id="zf-sl-runtime">${script}</script>`);
}

function injectLangAssets($, isSl) {
  $("#zf-lang-switcher-css").remove();
  $("head").append(`<style id="zf-lang-switcher-css">${LANG_SWITCHER_CSS}</style>`);
  $("#zf-lang-switcher-js").remove();
  $("body").append(`<script id="zf-lang-switcher-js">${LANG_SWITCHER_JS}</script>`);
}

function injectLangSwitcher($, isSl) {
  $("#main .zf-lang-switcher").remove();
  $("#zf-switcher-portal").remove();
  const portal = `<div id="zf-switcher-portal">${langSwitcherHtml(isSl)}</div>`;
  const main = $("#main");
  if (main.length) {
    main.after(portal);
  } else {
    $("body").append(portal);
  }
}

function isInsideSkip($el) {
  return $el.closest("[data-i18n-skip]").length > 0;
}

function applyTranslations($, locale, relFile) {
  const dict = locale === "sl" ? sl : en;
  const isChangelog = relFile === "changelog.html";

  $("[data-i18n]").each((_, el) => {
    const $el = $(el);
    if (locale === "sl" && isInsideSkip($el)) return;
    if (locale === "sl" && isChangelog && isInsideSkip($el)) return;

    const key = $el.attr("data-i18n");
    if (!dict[key]) {
      throw new Error(`Missing translation for key "${key}" in ${relFile}`);
    }
    if (locale === "sl") {
      $el.text(dict[key]);
    }
  });

  $("[data-i18n-placeholder]").each((_, el) => {
    const $el = $(el);
    if (locale === "sl" && isInsideSkip($el)) return;
    const key = $el.attr("data-i18n-placeholder");
    if (!dict[key]) throw new Error(`Missing placeholder key "${key}"`);
    if (locale === "sl") $el.attr("placeholder", dict[key]);
  });

  $("[data-i18n-alt]").each((_, el) => {
    const $el = $(el);
    const key = $el.attr("data-i18n-alt");
    if (!dict[key]) throw new Error(`Missing alt key "${key}"`);
    if (locale === "sl") $el.attr("alt", dict[key]);
  });

  if (locale === "sl") {
    const head = $("head");
    const titleKey = head.attr("data-i18n-title");
    const descKey = head.attr("data-i18n-meta-description");
    if (titleKey && dict[titleKey]) $("title").text(dict[titleKey]);
    if (descKey && dict[descKey]) {
      $('meta[name="description"]').attr("content", dict[descKey]);
    }
  }
}

function rewriteInternalLinks($, isSl) {
  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    if (!href) return;
    if (
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#") ||
      href.includes("testflight") ||
      href.includes("apple.com") ||
      href.includes("instagram") ||
      href.includes("linkedin") ||
      href.includes("facebook")
    ) {
      return;
    }

    if (!isSl) return;

    if (href === "./" || href === "/") {
      $el.attr("href", "/sl/");
      return;
    }
    if (href.startsWith("./#")) {
      $el.attr("href", "/sl/" + href.slice(2));
      return;
    }
    if (href.startsWith("./")) {
      const rest = href.slice(2);
      if (rest.startsWith("#")) {
        $el.attr("href", "/sl/" + rest);
      } else {
        $el.attr("href", "/sl/" + rest.replace(/\.html$/, ""));
      }
      return;
    }
    if (href.startsWith("/") && !href.startsWith("/sl")) {
      $el.attr("href", "/sl" + href.replace(/\.html$/, ""));
    }
  });
}

function main() {
  fs.mkdirSync(SL_DIR, { recursive: true });

  for (const relFile of SOURCE_PAGES) {
    const srcPath = path.join(ROOT, relFile);
    const originalHtml = fs.readFileSync(srcPath, "utf8");

    // Slovenian output
    const $sl = cheerio.load(originalHtml, { decodeEntities: false });
    const $head = $sl("head");
    const $html = $sl("html");
    const titleKey = $head.attr("data-i18n-title");
    const descKey = $head.attr("data-i18n-meta-description");
    if (titleKey) $html.attr("data-i18n-title", titleKey);
    if (descKey) $html.attr("data-i18n-meta-description", descKey);
    $html.attr("lang", "sl");
    applyTranslations($sl, "sl", relFile);
    rewriteInternalLinks($sl, true);
    injectLangSwitcher($sl, true);
    injectHreflang($sl, relFile);
    injectLangAssets($sl, true);
    injectSlRuntime($sl);
    const slOut = path.join(SL_DIR, relFile);
    fs.mkdirSync(path.dirname(slOut), { recursive: true });
    fs.writeFileSync(slOut, $sl.html());
    console.log(`✓ Generated sl/${relFile}`);

    // English: hreflang + switcher only (idempotent)
    const $en = cheerio.load(originalHtml, { decodeEntities: false });
    $en("html").attr("lang", "en");
    injectHreflang($en, relFile);
    injectLangAssets($en, false);
    injectLangSwitcher($en, false);
    fs.writeFileSync(srcPath, $en.html());
    console.log(`✓ Updated ${relFile}`);
  }

  console.log(`\nDone. Generated ${SOURCE_PAGES.length} Slovenian pages in sl/`);
}

main();
