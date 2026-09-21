#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { en, sl } = require("./locale-data");

const localesDir = path.join(__dirname, "..", "locales");
fs.mkdirSync(localesDir, { recursive: true });

const enKeys = Object.keys(en);
const slKeys = Object.keys(sl);
const missingInSl = enKeys.filter((k) => !(k in sl));
const missingInEn = slKeys.filter((k) => !(k in en));
if (missingInSl.length) {
  console.error("Missing SL keys:", missingInSl.join(", "));
  process.exit(1);
}
if (missingInEn.length) {
  console.error("Extra SL keys:", missingInEn.join(", "));
  process.exit(1);
}

fs.writeFileSync(
  path.join(localesDir, "en.json"),
  JSON.stringify(en, null, 2) + "\n"
);
fs.writeFileSync(
  path.join(localesDir, "sl.json"),
  JSON.stringify(sl, null, 2) + "\n"
);
console.log(`Wrote ${enKeys.length} keys to locales/en.json and locales/sl.json`);
