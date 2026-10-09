/**
 * CookieConsent + Google Consent Mode v2
 * @see https://cookieconsent.orestbida.com/advanced/google-consent-mode.html
 */
import * as CookieConsent from "/js/cookieconsent.esm.js";

const CAT_NECESSARY = "necessary";
const CAT_ANALYTICS = "analytics";
const CAT_ADVERTISEMENT = "advertisement";

const SERVICE_AD_STORAGE = "ad_storage";
const SERVICE_AD_USER_DATA = "ad_user_data";
const SERVICE_AD_PERSONALIZATION = "ad_personalization";
const SERVICE_ANALYTICS_STORAGE = "analytics_storage";

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}

function analyticsGranted() {
  return CookieConsent.acceptedService(
    SERVICE_ANALYTICS_STORAGE,
    CAT_ANALYTICS
  );
}

function ensureGa4Config() {
  const id =
    window.ZYFLOW_ANALYTICS && window.ZYFLOW_ANALYTICS.ga4MeasurementId;
  if (!id || !analyticsGranted()) return;
  if (document.querySelector(`script[src*="gtag/js?id=${id}"]`)) return;
  gtag("config", id);
}

function updateGtagConsent() {
  gtag("consent", "update", {
    [SERVICE_ANALYTICS_STORAGE]: analyticsGranted() ? "granted" : "denied",
    [SERVICE_AD_STORAGE]: CookieConsent.acceptedService(
      SERVICE_AD_STORAGE,
      CAT_ADVERTISEMENT
    )
      ? "granted"
      : "denied",
    [SERVICE_AD_USER_DATA]: CookieConsent.acceptedService(
      SERVICE_AD_USER_DATA,
      CAT_ADVERTISEMENT
    )
      ? "granted"
      : "denied",
    [SERVICE_AD_PERSONALIZATION]: CookieConsent.acceptedService(
      SERVICE_AD_PERSONALIZATION,
      CAT_ADVERTISEMENT
    )
      ? "granted"
      : "denied",
  });
  // If GTM's Google Tag stayed blocked after consent, load GA4 directly.
  window.setTimeout(ensureGa4Config, 750);
}

function siteLocale() {
  const lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  if (lang === "sl") return "sl";
  if (location.pathname === "/sl" || location.pathname.startsWith("/sl/")) return "sl";
  return "en";
}

const cookiePolicyPath = siteLocale() === "sl" ? "/sl/legal-cookies" : "/legal-cookies";
const privacyPolicyPath = siteLocale() === "sl" ? "/sl/legal-privacy" : "/legal-privacy";

CookieConsent.run({
  mode: "opt-in",
  autoShow: true,
  hideFromBots: true,
  revision: 1,

  cookie: {
    name: "cc_cookie",
    path: "/",
    sameSite: "Lax",
    expiresAfterDays: 182,
  },

  guiOptions: {
    consentModal: {
      layout: "box wide",
      position: "bottom center",
      equalWeightButtons: true,
      flipButtons: false,
    },
    preferencesModal: {
      layout: "box",
      equalWeightButtons: true,
      flipButtons: false,
    },
  },

  onFirstConsent: () => {
    updateGtagConsent();
  },
  onConsent: () => {
    updateGtagConsent();
  },
  onChange: () => {
    updateGtagConsent();
  },

  categories: {
    [CAT_NECESSARY]: {
      enabled: true,
      readOnly: true,
    },
    [CAT_ANALYTICS]: {
      autoClear: {
        cookies: [{ name: /^_ga/ }, { name: "_gid" }, { name: /^_ga_/ }],
      },
      services: {
        [SERVICE_ANALYTICS_STORAGE]: {
          label: "Google Analytics (GA4)",
        },
      },
    },
    [CAT_ADVERTISEMENT]: {
      autoClear: {
        cookies: [
          { name: /^_fbp/ },
          { name: /^_fbc/ },
          { name: /^fr$/ },
          { name: "oppref" },
        ],
      },
      services: {
        [SERVICE_AD_STORAGE]: {
          label: "Advertising storage (Meta, ChatGPT Ads, Google Ads)",
        },
        [SERVICE_AD_USER_DATA]: {
          label: "Ad user data",
        },
        [SERVICE_AD_PERSONALIZATION]: {
          label: "Ad personalization",
        },
      },
    },
  },

  language: {
    default: siteLocale(),
    translations: {
      en: {
        consentModal: {
          title: "We use cookies",
          description:
            "We use essential cookies to run zyflow.eu and optional analytics and advertising cookies to understand traffic and measure campaigns. Optional cookies are set only after you choose.",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject optional",
          showPreferencesBtn: "Manage preferences",
          footer: `<a href="${privacyPolicyPath}">Privacy Policy</a><a href="${cookiePolicyPath}">Cookie Policy</a>`,
        },
        preferencesModal: {
          title: "Cookie preferences",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject optional",
          savePreferencesBtn: "Save preferences",
          closeIconLabel: "Close",
          serviceCounterLabel: "Service|Services",
          sections: [
            {
              title: "Your choices",
              description:
                "Essential cookies keep the site working. Analytics and advertising cookies help us improve Zyflow and measure ads. You can change your mind anytime via Cookie preferences in the footer.",
            },
            {
              title: "Strictly necessary",
              description:
                "Required for security, load balancing, and remembering this consent choice. These cannot be turned off.",
              linkedCategory: CAT_NECESSARY,
            },
            {
              title: "Analytics",
              description:
                "Google Analytics 4 (via Google Tag Manager) helps us understand how visitors use the site — pages viewed, traffic sources, and key actions such as contact form submissions.",
              linkedCategory: CAT_ANALYTICS,
              cookieTable: {
                headers: {
                  name: "Name",
                  domain: "Service",
                  description: "Description",
                  expiration: "Expiration",
                },
                body: [
                  {
                    name: "_ga / _ga_*",
                    domain: "Google Analytics",
                    description: "Distinguishes users for analytics",
                    expiration: "Up to 2 years",
                  },
                  {
                    name: "_gid",
                    domain: "Google Analytics",
                    description: "Distinguishes users for 24 hours",
                    expiration: "24 hours",
                  },
                ],
              },
            },
            {
              title: "Advertising",
              description:
                "Used for Meta (Facebook) Pixel, ChatGPT Ads measurement, and similar ad platforms so we can measure campaigns and improve relevance. Loaded only through Google Tag Manager after you opt in.",
              linkedCategory: CAT_ADVERTISEMENT,
            },
            {
              title: "More information",
              description: `Read our <a href="${cookiePolicyPath}">Cookie Policy</a> and <a href="${privacyPolicyPath}">Privacy Policy</a>, or email <a href="mailto:legal@zyflow.eu">legal@zyflow.eu</a>.`,
            },
          ],
        },
      },
      sl: {
        consentModal: {
          title: "Uporabljamo piškotke",
          description:
            "Nujne piškotke uporabljamo za delovanje zyflow.eu, neobvezne pa za analitiko in oglaševanje. Neobvezni piškotki se nastavijo šele po vaši izbiri.",
          acceptAllBtn: "Sprejmi vse",
          acceptNecessaryBtn: "Zavrni neobvezne",
          showPreferencesBtn: "Upravljaj nastavitve",
          footer: `<a href="${privacyPolicyPath}">Politika zasebnosti</a><a href="${cookiePolicyPath}">Politika piškotkov</a>`,
        },
        preferencesModal: {
          title: "Nastavitve piškotkov",
          acceptAllBtn: "Sprejmi vse",
          acceptNecessaryBtn: "Zavrni neobvezne",
          savePreferencesBtn: "Shrani nastavitve",
          closeIconLabel: "Zapri",
          serviceCounterLabel: "Storitev|Storitve",
          sections: [
            {
              title: "Vaše izbire",
              description:
                "Nujni piškotki omogočajo delovanje strani. Analitični in oglaševalski piškotki nam pomagajo izboljšati Zyflow in meriti kampanje. Izbire lahko kadarkoli spremenite prek povezave v nogi strani.",
            },
            {
              title: "Nujno potrebni",
              description:
                "Potrebni za varnost, delovanje in shranjevanje te privolitve. Teh ni mogoče izklopiti.",
              linkedCategory: CAT_NECESSARY,
            },
            {
              title: "Analitika",
              description:
                "Google Analytics 4 (prek Google Tag Managerja) nam pomaga razumeti uporabo strani — oglede, vire prometa in ključna dejanja, npr. oddajo kontaktnega obrazca.",
              linkedCategory: CAT_ANALYTICS,
            },
            {
              title: "Oglaševanje",
              description:
                "Za Meta (Facebook) Pixel, merjenje ChatGPT Ads in podobne platforme, da merimo kampanje. Naložijo se samo prek GTM po privolitvi.",
              linkedCategory: CAT_ADVERTISEMENT,
            },
            {
              title: "Več informacij",
              description: `Preberite <a href="${cookiePolicyPath}">Politiko piškotkov</a> in <a href="${privacyPolicyPath}">Politiko zasebnosti</a> ali pišite na <a href="mailto:legal@zyflow.eu">legal@zyflow.eu</a>.`,
            },
          ],
        },
      },
    },
  },
});
