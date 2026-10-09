/**
 * dataLayer helpers + form conversion hooks for GTM / GA4 / Meta / ChatGPT Ads.
 */
(function () {
  var OPPREF_KEY = "zyflow_oppref";

  function dataLayerPush(payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }

  function eventId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "evt_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  /** Preserve ChatGPT Ads click reference across navigation. */
  function captureOppref() {
    try {
      var params = new URLSearchParams(window.location.search);
      var oppref = params.get("oppref");
      if (oppref) {
        sessionStorage.setItem(OPPREF_KEY, oppref);
      }
    } catch (_) {
      /* ignore */
    }
  }

  function getOppref() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get("oppref") || sessionStorage.getItem(OPPREF_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  /**
   * Single conversion event GTM maps to:
   * - GA4: contact_submit
   * - Meta: Lead
   * - ChatGPT Ads: lead_created
   */
  function pushContactSubmit(detail) {
    var id = eventId();
    dataLayerPush({
      event: "contact_submit",
      event_id: id,
      form_id: "contact",
      form_topic: (detail && detail.topic) || "",
      oppref: getOppref(),
    });
    return id;
  }

  function pushNewsletterSubscribe() {
    dataLayerPush({
      event: "newsletter_subscribe",
      event_id: eventId(),
      form_id: "footer_newsletter",
      oppref: getOppref(),
    });
  }

  function linkLabel(el) {
    if (!el) return "";
    var aria = el.getAttribute("aria-label");
    if (aria) return aria.trim();
    return (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
  }

  function ctaLocation(el) {
    if (!el) return "unknown";
    if (el.closest("#app-modal")) return "app_modal";
    if (el.closest(".nav")) return "nav";
    if (el.closest(".footer")) return "footer";
    if (el.closest(".announcement")) return "announcement";
    if (el.closest(".app-banner")) return "app_banner";
    if (el.closest(".app-stage")) return "app_stage";
    if (el.closest(".hero")) return "hero";
    if (el.closest(".features")) return "features";
    if (el.closest(".tour-hero") || el.closest(".tour-aside")) return "tour";
    return "page";
  }

  function storePlatform(href) {
    if (!href) return "";
    if (href.indexOf("apps.apple.com") !== -1) return "ios";
    if (href.indexOf("play.google.com") !== -1) return "android";
    return "other";
  }

  /** Download / Get the app CTAs that open the modal (or similar intent). */
  function pushAppCtaClick(el) {
    dataLayerPush({
      event: "app_cta_click",
      event_id: eventId(),
      cta_location: ctaLocation(el),
      cta_label: linkLabel(el),
      link_url: el.getAttribute("href") || "",
      oppref: getOppref(),
    });
  }

  /** Real App Store / Google Play outbound clicks. */
  function pushAppStoreClick(el) {
    var href = el.getAttribute("href") || "";
    dataLayerPush({
      event: "app_store_click",
      event_id: eventId(),
      store: storePlatform(href),
      cta_location: ctaLocation(el),
      cta_label: linkLabel(el),
      link_url: href,
      oppref: getOppref(),
    });
  }

  function initAppDownloadTracking() {
    document.addEventListener(
      "click",
      function (e) {
        var open = e.target.closest("[data-app-modal-open]");
        if (open) {
          pushAppCtaClick(open);
          return;
        }

        var store = e.target.closest(
          'a[href*="apps.apple.com"], a[href*="play.google.com"]'
        );
        if (store) {
          pushAppStoreClick(store);
        }
      },
      true
    );
  }

  function isLocalHost() {
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1";
  }

  function setFormStatus(form, message, isError) {
    var existing = form.querySelector(".form-status");
    if (!existing) {
      existing = document.createElement("p");
      existing.className = "form-status";
      existing.setAttribute("role", "status");
      form.appendChild(existing);
    }
    existing.textContent = message;
    existing.dataset.state = isError ? "error" : "ok";
  }

  function initContactForm() {
    var form = document.querySelector("form.contact-form__form");
    if (!form || form.dataset.analyticsBound === "1") return;
    form.dataset.analyticsBound = "1";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var first = (form.querySelector("#contact-first") || {}).value || "";
      var last = (form.querySelector("#contact-last") || {}).value || "";
      var email = (form.querySelector("#contact-email") || {}).value || "";
      var phone = (form.querySelector("#contact-phone") || {}).value || "";
      var topic = (form.querySelector("#contact-topic") || {}).value || "";
      var message = (form.querySelector("#contact-message") || {}).value || "";
      var name = (first + " " + last).trim();
      var subject = topic || "(no subject)";
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;

      var payload = {
        name: name,
        subject: subject,
        email: email.trim(),
        message: message.trim() + (phone ? "\n\nPhone: " + phone.trim() : ""),
      };

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok && data && data.success, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            pushContactSubmit({ topic: topic });
            setFormStatus(form, "Thanks — we got your message.", false);
            form.reset();
            return;
          }
          throw new Error((result.data && result.data.error) || "Failed");
        })
        .catch(function () {
          if (isLocalHost()) {
            pushContactSubmit({ topic: topic });
            setFormStatus(
              form,
              "Local preview: event tracked (API unavailable).",
              false
            );
            return;
          }
          setFormStatus(form, "Something went wrong. Please try again.", true);
        })
        .finally(function () {
          if (btn) btn.disabled = false;
        });
    });
  }

  function initNewsletterForm() {
    var form = document.querySelector("form.footer__email");
    if (!form || form.dataset.analyticsBound === "1") return;
    form.dataset.analyticsBound = "1";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var input = form.querySelector("#footer-email");
      var email = input ? input.value.trim() : "";
      if (!email) return;

      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok && data && data.success };
          });
        })
        .then(function (result) {
          if (result.ok) {
            pushNewsletterSubscribe();
            if (input) input.value = "";
            return;
          }
          throw new Error("fail");
        })
        .catch(function () {
          if (isLocalHost()) {
            pushNewsletterSubscribe();
            if (input) input.value = "";
          }
        });
    });
  }

  captureOppref();
  initAppDownloadTracking();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initContactForm();
      initNewsletterForm();
    });
  } else {
    initContactForm();
    initNewsletterForm();
  }

  window.ZyflowAnalytics = {
    pushContactSubmit: pushContactSubmit,
    pushNewsletterSubscribe: pushNewsletterSubscribe,
    pushAppCtaClick: pushAppCtaClick,
    pushAppStoreClick: pushAppStoreClick,
    getOppref: getOppref,
  };
})();
