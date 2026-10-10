/**
 * Render legal markdown → HTML for rebuild pages.
 * Strips HTML comments, drops the unpublished account-deletion section,
 * and wraps leftover [PLACEHOLDER] / [VERIFY] spans without changing their text.
 */

const { marked } = require("marked");

const PLACEHOLDER_RE = /\[(?:PLACEHOLDER|VERIFY)[^\]]*\]/g;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
const UNPUBLISHED_DELETION_RE =
  /^#{1,3}[ \t]+Use after code fix ships\b[\s\S]*$/im;

function parseFrontmatter(raw) {
  const text = String(raw).replace(/^\uFEFF/, "");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: text };
  }
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, body: match[2] };
}

function stripHtmlComments(markdown) {
  return markdown.replace(HTML_COMMENT_RE, "");
}

function stripUnpublishedDeletionDraft(markdown) {
  return markdown.replace(UNPUBLISHED_DELETION_RE, "").replace(/\n{3,}/g, "\n\n");
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function wrapPlaceholders(html) {
  return html.replace(PLACEHOLDER_RE, (span) => {
    return `<mark class="placeholder">${span}</mark>`;
  });
}

function countPlaceholders(text) {
  const matches = String(text).match(PLACEHOLDER_RE);
  return matches ? matches.length : 0;
}

function collectHeadings(html) {
  const headings = [];
  const re = /<h2([^>]*)>([\s\S]*?)<\/h2>/gi;
  let match;
  while ((match = re.exec(html))) {
    const raw = match[2].replace(/<[^>]+>/g, "").trim();
    if (!raw) continue;
    const existingId = /id="([^"]+)"/.exec(match[1] || "");
    headings.push({
      id: existingId ? existingId[1] : slugify(raw),
      text: raw,
    });
  }
  return headings;
}

function ensureHeadingIds(html) {
  return html.replace(/<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    if (/\sid=/.test(attrs)) return full;
    const id = slugify(inner.replace(/<[^>]+>/g, ""));
    if (!id) return full;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

function renderToc(headings, locale) {
  if (headings.length < 3) return "";
  const label = locale === "sl" ? "Vsebina" : "Contents";
  const items = headings
    .map((h) => `<li><a href="#${h.id}">${h.text}</a></li>`)
    .join("");
  return `<nav class="legal-doc__toc" aria-label="${label}">
  <p class="legal-doc__toc-title">${label}</p>
  <ol>${items}</ol>
</nav>`;
}

function prepareMarkdown(raw, { dropUnpublishedDeletion = false } = {}) {
  const { meta, body } = parseFrontmatter(raw);
  let markdown = stripHtmlComments(body);
  if (dropUnpublishedDeletion) {
    markdown = stripUnpublishedDeletionDraft(markdown);
  }
  return { meta, markdown: markdown.trim() };
}

function renderLegalMarkdown(raw, { locale = "en", dropUnpublishedDeletion = false } = {}) {
  const { meta, markdown } = prepareMarkdown(raw, { dropUnpublishedDeletion });
  marked.setOptions({ gfm: true, breaks: false });
  let html = marked.parse(markdown);
  html = ensureHeadingIds(html);
  html = wrapPlaceholders(html);
  const headings = collectHeadings(html);
  const toc = renderToc(headings, locale);
  return {
    meta,
    html,
    toc,
    placeholderCount: countPlaceholders(markdown),
  };
}

module.exports = {
  parseFrontmatter,
  prepareMarkdown,
  renderLegalMarkdown,
  countPlaceholders,
  wrapPlaceholders,
};
