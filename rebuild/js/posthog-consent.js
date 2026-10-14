/**
 * Analytics-consent helpers for PostHog boot.
 * Works in the browser and under node:test (UMD).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ZyflowPosthogConsent = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  function readCcCookieValue(cookieString) {
    var match = String(cookieString || "").match(/(?:^|; )cc_cookie=([^;]*)/);
    return match ? match[1] : "";
  }

  function parseCcCookie(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch (_e) {
      try {
        return JSON.parse(raw);
      } catch (_e2) {
        return null;
      }
    }
  }

  /**
   * @returns {"pending"|"granted"|"denied"}
   */
  function analyticsConsentState(cookieString) {
    var raw = readCcCookieValue(cookieString);
    if (!raw) return "pending";
    var cc = parseCcCookie(raw);
    if (!cc || !Array.isArray(cc.categories)) return "pending";
    return cc.categories.indexOf("analytics") !== -1 ? "granted" : "denied";
  }

  function persistenceForState(state) {
    return state === "granted" ? "localStorage+cookie" : "memory";
  }

  return {
    readCcCookieValue: readCcCookieValue,
    parseCcCookie: parseCcCookie,
    analyticsConsentState: analyticsConsentState,
    persistenceForState: persistenceForState,
  };
});
