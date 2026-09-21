#!/usr/bin/env node
/**
 * Wires locale keys that annotate-html.js cannot match (Framer nesting,
 * missing FAQ SSR answers, meta tags, mis-tagged rider stats).
 * Run before: npm run locales:export && npm run annotate:i18n
 */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.join(__dirname, "..");
const faqPageLocale = require("./faq-page-i18n");

function loadEn() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "locales", "en.json"), "utf8"));
}

let en = loadEn();

const PAGE_META = {
  "index.html": { title: "meta.home.title", description: "meta.home.description" },
  "waitlist.html": { title: "meta.waitlist.title", description: "meta.waitlist.description" },
  "about.html": { title: "meta.about.title", description: "meta.about.description" },
  "contact.html": { title: "meta.contact.title", description: "meta.contact.description" },
  "faqs.html": { title: "meta.faqs.title", description: "meta.faqs.description" },
};

function wireMeta(file, meta) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });

  const titleEl = $("title").first();
  if (titleEl.length) {
    titleEl.attr("data-i18n", meta.title);
  }

  $('meta[name="description"]').each((_, el) => {
    $(el).attr("data-i18n", meta.description);
  });

  fs.writeFileSync(filePath, $.html());
  console.log(`✓ Meta wired on ${file}`);
}

function wireRidersDescentDistance(file) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, "utf8");
  html = html.replace(
    /(data-i18n="riders\.descent\.elevation"[\s\S]*?data-i18n=")riders\.demo\.distance/g,
    "$1riders.descent.distance"
  );
  // First 134 km in the riders block is the demo route stat; the second is Long descent.
  let n = 0;
  html = html.replace(/data-i18n="riders\.descent\.distance">134 km/g, () => {
    n += 1;
    return n === 1
      ? 'data-i18n="riders.demo.distance">134 km'
      : 'data-i18n="riders.descent.distance">134 km';
  });
  const demo = (html.match(/data-i18n="riders\.demo\.distance"/g) || []).length;
  const descent = (html.match(/data-i18n="riders\.descent\.distance"/g) || []).length;
  fs.writeFileSync(filePath, html);
  console.log(`✓ riders distance keys on ${file}: demo=${demo}, descent=${descent}`);
}

function wireFaqAnswers(file) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes('data-zf-faq-wire')) {
    console.log(`✓ FAQ wire block already on ${file}`);
    return;
  }

  const keys = ["faq.a2", "faq.a3", "faq.a4", "faq.a5"];
  const paras = keys
    .map(
      (key) =>
        `<p class="framer-text" data-i18n="${key}">${en[key].replace(/"/g, "&quot;")}</p>`
    )
    .join("");

  const block = `<div data-zf-faq-wire hidden aria-hidden="true" style="display:none">${paras}</div>`;
  const anchor = 'data-i18n="faq.title"';
  const idx = html.indexOf(anchor);
  if (idx < 0) {
    console.error(`Could not find FAQ section in ${file}`);
    process.exit(1);
  }
  html = html.slice(0, idx) + block + html.slice(idx);
  fs.writeFileSync(filePath, html);
  console.log(`✓ FAQ answers wired on ${file}`);
}

function wireContact(file) {
  const filePath = path.join(ROOT, file);
  const $ = cheerio.load(fs.readFileSync(filePath, "utf8"), { decodeEntities: false });
  let n = 0;

  $("h1").each((_, el) => {
    const $el = $(el);
    const t = $el.text().replace(/\s+/g, " ").trim();
    if (t === en["contact.page.title"] && !$el.attr("data-i18n")) {
      $el.attr("data-i18n", "contact.page.title");
      n++;
    }
  });

  $("p").each((_, el) => {
    const $el = $(el);
    const t = $el.text().replace(/\s+/g, " ").trim();
    if (t === en["contact.page.intro"] && !$el.attr("data-i18n")) {
      $el.attr("data-i18n", "contact.page.intro");
      n++;
    }
  });

  fs.writeFileSync(filePath, $.html());
  console.log(`✓ contact.page.* wired on ${file} (${n} elements)`);
}

function wireAboutWhy(file) {
  const filePath = path.join(ROOT, file);
  const $ = cheerio.load(fs.readFileSync(filePath, "utf8"), { decodeEntities: false });
  let n = 0;

  $("p").each((_, el) => {
    const $el = $(el);
    const t = $el.text().replace(/\s+/g, " ").trim();
    if (t === en["about.page.why.body"] && !$el.attr("data-i18n")) {
      $el.attr("data-i18n", "about.page.why.body");
      n++;
    }
  });

  fs.writeFileSync(filePath, $.html());
  console.log(`✓ about.page.why.body wired on ${file} (${n} elements)`);
}

function normalizeText(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function wireTextNodes(file, key, expectedEn) {
  const filePath = path.join(ROOT, file);
  const $ = cheerio.load(fs.readFileSync(filePath, "utf8"), { decodeEntities: false });
  const target = normalizeText(expectedEn);
  let n = 0;

  $("p, span, div, h1, h2, h3, h4, h5, h6, a, button, label, li").each((_, el) => {
    const $el = $(el);
    if ($el.attr("data-i18n") || $el.attr("data-i18n-placeholder")) return;
    const direct = normalizeText(
      $el
        .contents()
        .filter((_, node) => node.type === "text")
        .text()
    );
    if (direct === target) {
      $el.attr("data-i18n", key);
      n++;
    }
  });

  fs.writeFileSync(filePath, $.html());
  return n;
}

function wirePlaceholders(file, mappings) {
  const filePath = path.join(ROOT, file);
  const $ = cheerio.load(fs.readFileSync(filePath, "utf8"), { decodeEntities: false });
  let n = 0;

  $("input[placeholder], textarea[placeholder]").each((_, el) => {
    const $el = $(el);
    if ($el.attr("data-i18n-placeholder")) return;
    const ph = ($el.attr("placeholder") || "").trim();
    for (const [key, value] of mappings) {
      if (ph === value || ph === normalizeText(value)) {
        $el.attr("data-i18n-placeholder", key);
        n++;
        break;
      }
    }
  });

  fs.writeFileSync(filePath, $.html());
  return n;
}

function wireFaqPage(file) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });
  let qCount = 0;

  for (let i = 1; i <= 23; i++) {
    const key = `faq.page.q${i}`;
    const text = normalizeText(en[key] || faqPageLocale.en[key]);
    $("div, p, span, h2, h3, h4, h5, h6").each((_, el) => {
      const $el = $(el);
      if ($el.attr("data-i18n")) return;
      const direct = normalizeText(
        $el
          .contents()
          .filter((_, node) => node.type === "text")
          .text()
      );
      if (direct === text) {
        $el.attr("data-i18n", key);
        qCount++;
      }
    });
  }

  const ctaKey = "faq.page.cta";
  const ctaText = normalizeText(en[ctaKey] || faqPageLocale.en[ctaKey]);
  $("div, p, span, h2, h3, h4, h5, h6").each((_, el) => {
    const $el = $(el);
    if ($el.attr("data-i18n")) return;
    const direct = normalizeText(
      $el
        .contents()
        .filter((_, node) => node.type === "text")
        .text()
    );
    if (direct === ctaText) {
      $el.attr("data-i18n", ctaKey);
      qCount++;
    }
  });

  const outHtml = $.html();
  if (!outHtml.includes("data-zf-faq-page-wire")) {
    const paras = Array.from({ length: 23 }, (_, idx) => {
      const key = `faq.b${idx + 1}`;
      const text = (en[key] || faqPageLocale.en[key] || "").replace(/"/g, "&quot;");
      return `<p class="framer-text" data-i18n="${key}">${text}</p>`;
    }).join("");
    const block = `<div data-zf-faq-page-wire hidden aria-hidden="true" style="display:none">${paras}</div>`;
    const anchor = 'data-i18n="faqs.page.title"';
    const idx = outHtml.indexOf(anchor);
    if (idx < 0) {
      console.error(`Could not find FAQ page anchor in ${file}`);
      process.exit(1);
    }
    fs.writeFileSync(filePath, outHtml.slice(0, idx) + block + outHtml.slice(idx));
    console.log(`✓ FAQ answer wire block added on ${file}`);
  } else {
    fs.writeFileSync(filePath, outHtml);
  }

  console.log(`✓ faq.page.q* wired on ${file} (${qCount} question nodes)`);
}

function wireWaitlistPlaceholder(file) {
  const filePath = path.join(ROOT, file);
  const $ = cheerio.load(fs.readFileSync(filePath, "utf8"), { decodeEntities: false });
  let n = 0;

  $("input[placeholder], textarea[placeholder]").each((_, el) => {
    const $el = $(el);
    const ph = ($el.attr("placeholder") || "").trim();
    if (
      (ph === en["waitlist.email.placeholder"] || ph === "Enter your email") &&
      !$el.attr("data-i18n-placeholder")
    ) {
      $el.attr("data-i18n-placeholder", "waitlist.email.placeholder");
      n++;
    }
  });

  fs.writeFileSync(filePath, $.html());
  console.log(`✓ waitlist.email.placeholder wired on ${file} (${n} inputs)`);
}

for (const [file, meta] of Object.entries(PAGE_META)) {
  wireMeta(file, meta);
}

wireRidersDescentDistance("index.html");
wireFaqAnswers("index.html");
wireContact("contact.html");
wireAboutWhy("about.html");
wireWaitlistPlaceholder("waitlist.html");
wireFaqPage("faqs.html");

console.log(
  `✓ home.body.battery on index.html (${wireTextNodes("index.html", "home.body.battery", en["home.body.battery"])} nodes)`
);
console.log(
  `✓ home.mock.plan on index.html (${wireTextNodes("index.html", "home.mock.plan", en["home.mock.plan"])} nodes)`
);
console.log(
  `✓ home.mock.tidy on index.html (${wireTextNodes("index.html", "home.mock.tidy", en["home.mock.tidy"])} nodes)`
);
console.log(
  `✓ about.feature.weather on about.html (${wireTextNodes("about.html", "about.feature.weather", en["about.feature.weather"])} nodes)`
);
console.log(
  `✓ about.team.title on about.html (${wireTextNodes("about.html", "about.team.title", en["about.team.title"])} nodes)`
);
console.log(
  `✓ contact.form.topic on contact.html (${wirePlaceholders("contact.html", [["contact.form.topic", en["contact.form.topic"]]])} inputs)`
);
console.log(
  `✓ contact.form.message on contact.html (${wirePlaceholders("contact.html", [["contact.form.message", en["contact.form.message"]]])} inputs)`
);
console.log(
  `✓ home.body.routing on index.html (${wireTextNodes("index.html", "home.body.routing", en["home.body.routing"])} nodes)`
);
console.log(
  `✓ home.body.charging on index.html (${wireTextNodes("index.html", "home.body.charging", en["home.body.charging"])} nodes)`
);
console.log(
  `✓ about.body.fullday on about.html (${wireTextNodes("about.html", "about.body.fullday", en["about.body.fullday"])} nodes)`
);

console.log("\nWire pass complete.");
