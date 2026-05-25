#!/usr/bin/env node
/**
 * Adds data-i18n attributes to source HTML from locales/en.json.
 * Also fixes footer copyright and sets per-page head meta keys.
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.join(__dirname, "..");
const en = JSON.parse(fs.readFileSync(path.join(ROOT, "locales", "en.json"), "utf8"));

const COPYRIGHT_OLD =
  /All rights reserved by&nbsp;<!--\$--><a class="framer-text framer-styles-preset-10ftyxe" data-styles-preset="l15RgZ9AL" href="https:\/\/www\.webestica\.com\/" target="_blank" rel="noopener">Zyflow<\/a><!--\/\$-->/g;

const COPYRIGHT_NEW =
  '<span data-i18n="footer.copyright">© 2026 Zyflow. All rights reserved.</span>';

const PAGES = [
  {
    file: "index.html",
    scope: "full",
    metaTitle: "meta.home.title",
    metaDesc: "meta.home.description",
  },
  {
    file: "waitlist.html",
    scope: "full",
    metaTitle: "meta.waitlist.title",
    metaDesc: "meta.waitlist.description",
  },
  {
    file: "about.html",
    scope: "full",
    metaTitle: "meta.about.title",
    metaDesc: "meta.about.description",
  },
  {
    file: "contact.html",
    scope: "full",
    metaTitle: "meta.contact.title",
    metaDesc: "meta.contact.description",
  },
  {
    file: "faqs.html",
    scope: "full",
    metaTitle: "meta.faqs.title",
    metaDesc: "meta.faqs.description",
  },
  {
    file: "changelog.html",
    scope: "shared",
    metaTitle: "meta.changelog.title",
    metaDesc: "meta.changelog.description",
    skipMarker: true,
  },
  {
    file: "legal-pages/privacy-policy.html",
    scope: "shared",
    metaTitle: "meta.legal.privacy.title",
    metaDesc: "meta.home.description",
    legalStub: true,
  },
  {
    file: "legal-pages/cookie-policy.html",
    scope: "shared",
    metaTitle: "meta.legal.cookies.title",
    metaDesc: "meta.home.description",
    legalStub: true,
  },
  {
    file: "legal-pages/terms-conditions.html",
    scope: "shared",
    metaTitle: "meta.legal.terms.title",
    metaDesc: "meta.home.description",
    legalStub: true,
  },
];

const SHARED_PREFIXES = ["nav.", "footer.", "meta."];

function normalizeText(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getDirectText($, el) {
  const node = $(el).get(0);
  if (!node) return "";
  let text = "";
  for (const child of node.childNodes || []) {
    if (child.type === "text") text += child.data;
  }
  return normalizeText(text);
}

function shouldAnnotateKey(key, scope) {
  if (scope === "full") return true;
  return SHARED_PREFIXES.some((p) => key.startsWith(p));
}

function buildTextToKey(scope) {
  const entries = Object.entries(en).filter(([key]) => shouldAnnotateKey(key, scope));
  entries.sort((a, b) => b[1].length - a[1].length);
  return entries;
}

function annotateFile(page) {
  const filePath = path.join(ROOT, page.file);
  let html = fs.readFileSync(filePath, "utf8");
  html = html.replace(COPYRIGHT_OLD, COPYRIGHT_NEW);

  const $ = cheerio.load(html, { decodeEntities: false });
  const textToKey = buildTextToKey(page.scope);
  let annotated = 0;

  const selectors =
    "p, span, div, h1, h2, h3, a, button, label, li, option";

  $(selectors).each((_, el) => {
    const $el = $(el);
    if ($el.attr("data-i18n") || $el.attr("data-i18n-placeholder")) return;
    if ($el.closest("[data-i18n-skip]").length) return;

    const direct = getDirectText($, el);
    if (!direct) return;

    for (const [key, text] of textToKey) {
      if (direct === normalizeText(text)) {
        $el.attr("data-i18n", key);
        annotated++;
        break;
      }
    }
  });

  // Placeholders
  $("input[placeholder], textarea[placeholder]").each((_, el) => {
    const $el = $(el);
    if ($el.attr("data-i18n-placeholder")) return;
    const ph = ($el.attr("placeholder") || "").trim();
    for (const [key, text] of textToKey) {
      if (ph === text || ph === normalizeText(text)) {
        $el.attr("data-i18n-placeholder", key);
        annotated++;
        break;
      }
    }
  });

  // Head meta keys (build-locale reads these; data-i18n on nodes for wiring checks)
  $("head").attr("data-i18n-title", page.metaTitle);
  $("head").attr("data-i18n-meta-description", page.metaDesc);
  const titleEl = $("title").first();
  if (titleEl.length) titleEl.attr("data-i18n", page.metaTitle);
  $('meta[name="description"]').each((_, el) => {
    $(el).attr("data-i18n", page.metaDesc);
  });

  // Changelog: skip translating release notes body
  if (page.skipMarker) {
    const firstList = $('[data-framer-name="List"]').first();
    if (firstList.length && !firstList.attr("data-i18n-skip")) {
      firstList.attr("data-i18n-skip", "changelog");
      firstList.before("<!-- i18n: skip -->");
    }
  }

  if (page.legalStub) {
    const content = $('[data-framer-name="Content"]').first();
    if (content.length) content.attr("data-i18n-skip", "legal");
  }

  fs.writeFileSync(filePath, $.html());
  console.log(`✓ Annotated ${page.file} (${annotated} elements)`);
}

for (const page of PAGES) {
  annotateFile(page);
}

console.log("Annotation complete.");
