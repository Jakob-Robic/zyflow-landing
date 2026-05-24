#!/usr/bin/env node
/**
 * Copies the static site into public/ for Vercel (Output Directory: public).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public");

const EXCLUDE = new Set([
  "node_modules",
  "scripts",
  "locales",
  "public",
  ".vercel",
  ".git",
  "package.json",
  "package-lock.json",
  ".gitignore",
  "serve.py",
]);

function shouldSkip(name) {
  return EXCLUDE.has(name) || name.startsWith(".");
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (shouldSkip(name)) continue;
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
}
fs.mkdirSync(OUT);

for (const name of fs.readdirSync(ROOT)) {
  if (shouldSkip(name)) continue;
  copyRecursive(path.join(ROOT, name), path.join(OUT, name));
}

console.log("✓ Prepared public/ for Vercel deploy");
