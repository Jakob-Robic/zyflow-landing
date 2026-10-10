/**
 * Consent-gated PostHog loader for the marketing site.
 * posthog-js is fetched only after the analytics category is granted.
 */
(function () {
  var granted = false;
  var initialized = false;
  var loading = false;
  var loadWaiters = [];
  var capturedInitialPageview = false;

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

  function installStub() {
    if (window.posthog && window.posthog.__SV) return;
    var posthog = (window.posthog = window.posthog || []);
    posthog._i = posthog._i || [];
    posthog.init = function (token, config, name) {
      posthog._i.push([token, config, name]);
    };
    var methods =
      "capture register register_once identify reset get_distinct_id opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing".split(
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

  function initAndOptIn() {
    var key = projectKey();
    if (!key || !window.posthog || typeof window.posthog.init !== "function") return;

    if (!initialized) {
      window.posthog.init(key, {
        api_host: apiHost(),
        ui_host: "https://eu.posthog.com",
        person_profiles: "always",
        capture_pageview: true,
        cross_subdomain_cookie: true,
        persistence: "localStorage+cookie",
        opt_out_capturing_by_default: true,
        disable_session_recording: true,
        loaded: function (ph) {
          try {
            ph.register({ platform: "website" });
          } catch (_e) {
            /* ignore */
          }
          if (granted) {
            ph.opt_in_capturing();
            if (!capturedInitialPageview) {
              capturedInitialPageview = true;
              ph.capture("$pageview");
            }
          }
          applyAttribution();
        },
      });
      initialized = true;
      return;
    }

    try {
      window.posthog.register({ platform: "website" });
      window.posthog.opt_in_capturing();
    } catch (_e) {
      /* ignore */
    }
    applyAttribution();
  }

  function grant() {
    granted = true;
    loadSdk(initAndOptIn);
  }

  function withdraw() {
    granted = false;
    if (window.posthog && typeof window.posthog.opt_out_capturing === "function") {
      try {
        window.posthog.opt_out_capturing();
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

  window.ZyflowPosthog = {
    grant: grant,
    withdraw: withdraw,
    hasAnalyticsConsent: hasAnalyticsConsent,
    getDistinctId: getDistinctId,
    capture: capture,
  };
})();
