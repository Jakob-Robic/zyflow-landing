/**
 * Client-side Slovenian translation runtime (inlined into sl/*.html at build time).
 */
(function () {
  "use strict";

  var SL = __ZF_SL_LOCALE__;
  var EN = __ZF_EN_LOCALE__;

  var TEXT_SELECTORS =
    "p, span, div, h1, h2, h3, h4, a, button, label, li, option";

  var enEntries = Object.keys(EN)
    .map(function (key) {
      return [key, EN[key]];
    })
    .sort(function (a, b) {
      return b[1].length - a[1].length;
    });

  function normalizeText(text) {
    return String(text)
      .replace(/\u00a0/g, " ")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getDirectText(el) {
    var text = "";
    for (var i = 0; i < el.childNodes.length; i++) {
      var node = el.childNodes[i];
      if (node.nodeType === 3) text += node.data;
    }
    return normalizeText(text);
  }

  function isSkipped(el) {
    return el && el.closest && el.closest("[data-i18n-skip]");
  }

  function applyMeta() {
    var root = document.documentElement;
    var head = document.head;
    var titleKey =
      root.getAttribute("data-i18n-title") ||
      (head && head.getAttribute("data-i18n-title"));
    var descKey =
      root.getAttribute("data-i18n-meta-description") ||
      (head && head.getAttribute("data-i18n-meta-description"));

    if (titleKey && SL[titleKey]) document.title = SL[titleKey];

    var titleTagged = document.querySelector("title[data-i18n]");
    if (titleTagged) {
      var tk = titleTagged.getAttribute("data-i18n");
      if (tk && SL[tk]) document.title = SL[tk];
    }

    if (descKey && SL[descKey]) {
      document.querySelectorAll('meta[name="description"]').forEach(function (meta) {
        meta.setAttribute("content", SL[descKey]);
      });
    }

    document.querySelectorAll('meta[name="description"][data-i18n]').forEach(function (meta) {
      var dk = meta.getAttribute("data-i18n");
      if (dk && SL[dk]) meta.setAttribute("content", SL[dk]);
    });
  }

  function applyAttributed() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (isSkipped(el)) return;
      var key = el.getAttribute("data-i18n");
      if (!key || SL[key] == null) return;
      if (el.tagName === "TITLE" || el.tagName === "META") return;
      el.textContent = SL[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      if (isSkipped(el)) return;
      var key = el.getAttribute("data-i18n-placeholder");
      if (key && SL[key] != null) el.setAttribute("placeholder", SL[key]);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      if (isSkipped(el)) return;
      var key = el.getAttribute("data-i18n-alt");
      if (key && SL[key] != null) el.setAttribute("alt", SL[key]);
    });
  }

  /** Re-wire nodes Framer replaced without data-i18n by matching EN copy. */
  function applyByTextMatch() {
    document.querySelectorAll(TEXT_SELECTORS).forEach(function (el) {
      if (isSkipped(el)) return;

      var direct = getDirectText(el);
      if (direct) {
        for (var i = 0; i < enEntries.length; i++) {
          var key = enEntries[i][0];
          var enText = enEntries[i][1];
          if (direct === normalizeText(enText)) {
            el.setAttribute("data-i18n", key);
            el.textContent = SL[key];
            return;
          }
        }
      }

      if (!el.hasAttribute("data-i18n-placeholder")) {
        var ph = (el.getAttribute("placeholder") || "").trim();
        if (ph) {
          for (var j = 0; j < enEntries.length; j++) {
            var pKey = enEntries[j][0];
            if (ph === enEntries[j][1] || ph === normalizeText(enEntries[j][1])) {
              el.setAttribute("data-i18n-placeholder", pKey);
              el.setAttribute("placeholder", SL[pKey]);
              return;
            }
          }
        }
      }
    });
  }

  function applyAll() {
    try {
      applyMeta();
      applyAttributed();
      applyByTextMatch();
    } catch (err) {
      console.error("[zf-sl-runtime] apply failed:", err);
    }
  }

  var debounceTimer;
  var observer;
  var burstTimer;
  var burstUntil = 0;

  function scheduleApply() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyAll, 50);
  }

  function startBurst() {
    burstUntil = Date.now() + 8000;
    if (burstTimer) return;
    burstTimer = setInterval(function () {
      applyAll();
      if (Date.now() > burstUntil) {
        clearInterval(burstTimer);
        burstTimer = null;
      }
    }, 150);
  }

  function startObserver() {
    if (!document.body || observer) return;
    observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function init() {
    applyAll();
    startObserver();
    startBurst();
    scheduleApply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", function () {
    applyAll();
    startBurst();
    scheduleApply();
  });
})();
