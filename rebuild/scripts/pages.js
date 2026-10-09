/**
 * Single source of truth for rebuild routes, SEO, and locale output.
 */
const { ARTICLE_PAGES } = require("./articles");

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://www.zyflow.eu";
const LOCALES = ["en", "sl"];
const DEFAULT_LOCALE = "en";

/** @typedef {{ id: string, file: string, out: string, path: string, indexable: boolean, locales?: string[], preloadHero?: boolean }} PageDef */

/** @type {PageDef[]} */
const PAGES = [
  {
    id: "home",
    file: "home.html",
    out: "index.html",
    path: "/",
    indexable: true,
    preloadHero: true,
  },
  {
    id: "about",
    file: "about.html",
    out: "about.html",
    path: "/about",
    indexable: true,
  },
  {
    id: "tours",
    file: "tours.html",
    out: "tours.html",
    path: "/tours",
    indexable: true,
  },
  {
    id: "tour",
    file: "tour.html",
    out: "tour.html",
    path: "/tour",
    indexable: true,
  },
  {
    id: "blog",
    file: "blog.html",
    out: "blog.html",
    path: "/blog",
    // HIDDEN FOR DEPLOY: Journal — set true when Journal is public again
    indexable: false,
  },
  ...ARTICLE_PAGES,
  {
    id: "contact",
    file: "contact.html",
    out: "contact.html",
    path: "/contact",
    indexable: true,
  },
  {
    id: "business",
    file: "business.html",
    out: "business.html",
    path: "/business",
    indexable: true,
  },
  {
    id: "press",
    file: "press.html",
    out: "press.html",
    path: "/press",
    indexable: true,
  },
  {
    id: "legal",
    file: "legal.html",
    out: "legal.html",
    path: "/legal",
    indexable: true,
  },
  {
    id: "legal-privacy",
    file: "legal-privacy.html",
    out: "legal-privacy.html",
    path: "/legal-privacy",
    indexable: true,
  },
  {
    id: "legal-cookies",
    file: "legal-cookies.html",
    out: "legal-cookies.html",
    path: "/legal-cookies",
    indexable: true,
  },
  {
    id: "legal-terms",
    file: "legal-terms.html",
    out: "legal-terms.html",
    path: "/legal-terms",
    indexable: true,
  },
  {
    id: "404",
    file: "404.html",
    out: "404.html",
    path: "/404",
    indexable: false,
  },
  {
    id: "styleguide",
    file: "styleguide.html",
    out: "styleguide.html",
    path: "/styleguide",
    indexable: false,
    locales: ["en"],
  },
];

function pageLocales(page) {
  return page.locales || LOCALES;
}

function localizedPath(pagePath, locale) {
  if (locale === DEFAULT_LOCALE) return pagePath;
  if (pagePath === "/") return `/${locale}`;
  return `/${locale}${pagePath}`;
}

function absoluteUrl(pagePath, locale) {
  const p = localizedPath(pagePath, locale);
  return p === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${p}`;
}

function hrefForPage(pagePath, locale) {
  // Clean URLs for production / serve.py; keep trailing-slash-free.
  return localizedPath(pagePath, locale);
}

module.exports = {
  SITE_ORIGIN,
  LOCALES,
  DEFAULT_LOCALE,
  PAGES,
  pageLocales,
  localizedPath,
  absoluteUrl,
  hrefForPage,
};
