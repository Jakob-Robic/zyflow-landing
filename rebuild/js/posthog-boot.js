/**
 * PostHog loader for the marketing site.
 *
 * Pending consent: load posthog-js immediately with persistence "memory"
 * (no cookies / localStorage) so anonymous $pageview still fires.
 * After analytics opt-in: upgrade to localStorage+cookie on .zyflow.eu.
 * After reject / withdraw: opt_out_capturing().
 */
(function () {
  var granted = false;
  var initialized = false;
  var loading = false;
  var loadWaiters = [];

  function analyticsIds() {
    return window.ZYFLOW_ANALYTICS || {};
  }

  function projectKey() {
    return analyticsIds().posthogProjectKey || "";
  }

  function apiHost() {
    return analyticsIds().posthogApiHost || "https://eu.i.posthog.com";
  }

  function assetsSrc() {
    return apiHost().replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
  }

  function consentHelpers() {
    return window.ZyflowPosthogConsent || null;
  }

  function consentState() {
    var helpers = consentHelpers();
    if (!helpers) return "pending";
    return helpers.analyticsConsentState(document.cookie || "");
  }

  function effectiveState() {
    if (granted) return "granted";
    return consentState();
  }

  function installStub() {
    if (window.posthog && window.posthog.__SV) return;
    var posthog = (window.posthog = window.posthog || []);
    posthog._i = posthog._i || [];
    posthog.init = function (token, config, name) {
      posthog._i.push([token, config, name]);
    };
    var methods =
      "capture register register_once identify reset get_distinct_id opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing set_config".split(
        " "
      );
    for (var i = 0; i < methods.length; i++) {
      (function (method) {
        posthog[method] = function () {
          posthog.push([method].concat(Array.prototype.slice.call(arguments)));
        };
      })(methods[i]);
    }
    posthog.__SV = 1;
  }

  function flushWaiters() {
    var q = loadWaiters;
    loadWaiters = [];
    for (var i = 0; i < q.length; i++) {
      try {
        q[i]();
      } catch (_e) {
        /* ignore */
      }
    }
  }

  function loadSdk(done) {
    if (window.posthog && window.posthog.__loaded) {
      done();
      return;
    }
    loadWaiters.push(done);
    if (loading) return;
    loading = true;
    installStub();
    if (document.querySelector("script[data-zyflow-posthog]")) return;

    var script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = assetsSrc();
    script.dataset.zyflowPosthog = "1";
    script.onload = function () {
      flushWaiters();
    };
    script.onerror = function () {
      loading = false;
      loadWaiters = [];
    };
    document.head.appendChild(script);
  }

  function applyAttribution() {
    if (!window.ZyflowAttribution) return;
    window.ZyflowAttribution.applyStoreLinks({
      analyticsConsent: granted,
      distinctId: granted ? getDistinctId() : "",
    });
  }

  function initConfig() {
    var state = effectiveState();
    var consented = state === "granted";
    var helpers = consentHelpers();
    var persistence = helpers
      ? helpers.persistenceForState(state)
      : consented
        ? "localStorage+cookie"
        : "memory";
    return {
      api_host: apiHost(),
      ui_host: "https://eu.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      autocapture: consented,
      cross_subdomain_cookie: consented,
      persistence: persistence,
      opt_out_capturing_by_default: state === "denied",
      disable_session_recording: true,
      loaded: function (ph) {
        try {
          ph.register({ platform: "website" });
        } catch (_e) {
          /* ignore */
        }
        if (state === "denied" && typeof ph.opt_out_capturing === "function") {
          try {
            ph.opt_out_capturing();
          } catch (_e) {
            /* ignore */
          }
        }
        applyAttribution();
      },
    };
  }

  function initOnce() {
    var key = projectKey();
    if (!key || !window.posthog || typeof window.posthog.init !== "function") return;
    if (initialized) return;
    window.posthog.init(key, initConfig());
    initialized = true;
  }

  function applyConsentedPersistence() {
    if (!window.posthog) return;
    try {
      if (typeof window.posthog.set_config === "function") {
        window.posthog.set_config({
          persistence: "localStorage+cookie",
          cross_subdomain_cookie: true,
          autocapture: true,
        });
      }
      if (typeof window.posthog.register === "function") {
        window.posthog.register({ platform: "website" });
      }
      if (typeof window.posthog.opt_in_capturing === "function") {
        window.posthog.opt_in_capturing();
      }
    } catch (_e) {
      /* ignore */
    }
    applyAttribution();
  }

  function grant() {
    granted = true;
    loadSdk(function () {
      initOnce();
      applyConsentedPersistence();
    });
  }

  function withdraw() {
    granted = false;
    if (window.posthog && typeof window.posthog.opt_out_capturing === "function") {
      try {
        window.posthog.opt_out_capturing();
        if (typeof window.posthog.set_config === "function") {
          window.posthog.set_config({
            persistence: "memory",
            cross_subdomain_cookie: false,
            autocapture: false,
          });
        }
      } catch (_e) {
        /* ignore */
      }
    }
    applyAttribution();
  }

  function hasAnalyticsConsent() {
    return granted;
  }

  function getDistinctId() {
    if (!granted || !window.posthog || typeof window.posthog.get_distinct_id !== "function") {
      return "";
    }
    try {
      return window.posthog.get_distinct_id() || "";
    } catch (_e) {
      return "";
    }
  }

  function capture(eventName, properties) {
    if (!granted || !window.posthog || typeof window.posthog.capture !== "function") return;
    try {
      window.posthog.capture(eventName, properties);
    } catch (_e) {
      /* ignore */
    }
  }

  function boot() {
    var state = consentState();
    if (state === "granted") {
      grant();
      return;
    }
    loadSdk(initOnce);
  }

  window.ZyflowPosthog = {
    grant: grant,
    withdraw: withdraw,
    hasAnalyticsConsent: hasAnalyticsConsent,
    getDistinctId: getDistinctId,
    capture: capture,
  };

  boot();
})();
