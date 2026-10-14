const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const consent = require("../js/posthog-consent.js");
const { PAGES, LOCALES, pageLocales } = require("./pages");

function ccCookie(categories) {
  return (
    "cc_cookie=" +
    encodeURIComponent(
      JSON.stringify({
        categories: categories,
        revision: 1,
        data: null,
      })
    )
  );
}

test("pending visitors have no cc_cookie and use memory persistence", () => {
  assert.equal(consent.analyticsConsentState(""), "pending");
  assert.equal(consent.analyticsConsentState("zyflow_ft=abc"), "pending");
  assert.equal(consent.persistenceForState("pending"), "memory");
});

test("analytics category in cc_cookie is granted and uses cookies", () => {
  assert.equal(
    consent.analyticsConsentState(ccCookie(["necessary", "analytics"])),
    "granted"
  );
  assert.equal(consent.persistenceForState("granted"), "localStorage+cookie");
});

test("reject-optional cc_cookie is denied and stays on memory", () => {
  assert.equal(consent.analyticsConsentState(ccCookie(["necessary"])), "denied");
  assert.equal(consent.persistenceForState("denied"), "memory");
});

test("posthog-boot loads immediately and captures pageviews before opt-in", () => {
  const boot = fs.readFileSync(path.join(__dirname, "..", "js", "posthog-boot.js"), "utf8");
  assert.match(boot, /capture_pageview:\s*true/);
  assert.match(boot, /persistence:\s*persistence/);
  assert.match(boot, /\bboot\(\)/);
  assert.match(boot, /opt_out_capturing_by_default:\s*state === "denied"/);
  assert.match(boot, /person_profiles:\s*"identified_only"/);
  assert.doesNotMatch(boot, /fetched only after the analytics category is granted/);
});

test("analytics-config points at EU Cloud, not US", () => {
  const cfg = fs.readFileSync(
    path.join(__dirname, "..", "js", "analytics-config.js"),
    "utf8"
  );
  assert.match(cfg, /posthogApiHost:\s*"https:\/\/eu\.i\.posthog\.com"/);
  assert.match(cfg, /posthogProjectKey:\s*"phc_/);
  assert.doesNotMatch(cfg, /us\.i\.posthog\.com/);
});

test("every page ships the PostHog boot scripts in EN and SL dist", () => {
  const dist = path.join(__dirname, "..", "dist");
  assert.equal(fs.existsSync(dist), true, "run npm run build:rebuild:prod first");
  const bootHtml = fs.readFileSync(
    path.join(__dirname, "..", "components", "analytics-boot.html"),
    "utf8"
  );
  assert.match(bootHtml, /posthog-consent\.js/);
  assert.match(bootHtml, /posthog-boot\.js/);
  assert.match(bootHtml, /cookieconsent-config\.js/);

  const missing = [];
  for (const locale of LOCALES) {
    for (const page of PAGES) {
      if (!pageLocales(page).includes(locale)) continue;
      const rel =
        locale === "en" || page.localePrefix === false
          ? page.out
          : path.join(locale, page.out);
      const file = path.join(dist, rel);
      if (!fs.existsSync(file)) {
        missing.push(rel + " (missing file)");
        continue;
      }
      const html = fs.readFileSync(file, "utf8");
      if (!html.includes("analytics-config.js")) missing.push(rel + " analytics-config");
      if (!html.includes("posthog-boot.js")) missing.push(rel + " posthog-boot");
      if (!html.includes("posthog-consent.js")) missing.push(rel + " posthog-consent");
      if (!html.includes("cookieconsent-config.js")) {
        missing.push(rel + " cookieconsent-config");
      }
    }
  }
  assert.deepEqual(missing, []);
});
