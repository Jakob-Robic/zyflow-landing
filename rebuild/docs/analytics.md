# Marketing site analytics

The rebuild site (`www.zyflow.eu`) ships two analytics stacks. Google Tag Manager is unchanged. PostHog loads on every page.

## Consent

The vanilla-cookieconsent banner (categories `necessary` / `analytics` / `advertisement`) and Google Consent Mode v2 stay as they were. The banner **does** auto-show; there is no additional banner in this change.

PostHog was previously fully blocked until the visitor clicked Accept. That produced **zero** `$pageview` events from marketing URLs (home, about, tours, …) because almost nobody completed the banner. The loader now counts anonymous page views without cookies until a choice is recorded.

| Choice | Behaviour |
| --- | --- |
| No choice yet (pending) | GTM stays in denied Consent Mode. `posthog-js` **does** load from `eu-assets.i.posthog.com` with `persistence: 'memory'` — no PostHog cookies or `localStorage`. Autocapture is off. `$pageview` is sent for the current page only. Store links may still receive first-party UTM query values (no `ph_id`). |
| Accept **analytics** | Consent Mode sets `analytics_storage=granted`. GA4 can fire via GTM. PostHog switches to `persistence: 'localStorage+cookie'` and `cross_subdomain_cookie: true`, then `opt_in_capturing()`. Autocapture turns on. |
| Reject optional / withdraw analytics | Consent Mode returns to denied. `opt_out_capturing()` runs and persistence returns to `memory`. PostHog cookies matching `ph_*` / `phc_*` are auto-cleared. Store links are rewritten without `ph_id`. |
| Accept **advertisement** | Unchanged: Meta / ChatGPT Ads pixels via GTM. `oppref` is still captured in `sessionStorage` for dataLayer events. |

### Why memory, not `cookieless_mode`

[PostHog cookieless tracking](https://posthog.com/tutorials/cookieless-tracking) (`cookieless_mode: 'on_reject'` / `'always'`) still **does not capture events until the visitor accepts or rejects**. That would not fix ignored banners. `cookieless_mode: 'always'` also requires **Cookieless server hash mode** in project settings (currently off; cookieless events would be discarded). Memory persistence counts the page view without device storage and does not need that project flag.

This is **not** a substitute for a CMP. The banner remains the way to opt into cookies, GTM/GA4, and identified PostHog. Legal review: ePrivacy/ZEKom-2 is about storing/accessing information on the device; memory persistence does not write PostHog cookies. Sending the page URL and request metadata to PostHog EU is still personal-data processing under GDPR (IP is anonymised in this project). Jakob / Legal should confirm legitimate interest vs consent for that pre-choice request.

PostHog init:

- `api_host`: `https://eu.i.posthog.com`
- Project key: `ZYFLOW_ANALYTICS.posthogProjectKey` in `js/analytics-config.js` (public ingestion key)
- `person_profiles: 'identified_only'` (anonymous marketing page views do not create person profiles)
- `capture_pageview: true` — this site is multi-page, not an SPA; full loads record `$pageview`. No `history_change` capture.
- Pending/denied: `persistence: 'memory'`, `cross_subdomain_cookie: false`, `autocapture: false`
- After analytics consent: `persistence: 'localStorage+cookie'`, `cross_subdomain_cookie: true` (cookie on `.zyflow.eu` so www / navigate / app can share the visitor id)
- `opt_out_capturing_by_default: true` only when `cc_cookie` already records a rejection
- `disable_session_recording: true` — no session recording on the marketing site
- Super property `platform=website`

## First-touch UTMs

`js/attribution.js` stores the first `utm_source` / `utm_medium` / `utm_campaign` (or referrer host, or `direct`) in:

- `sessionStorage.zyflow_ft` — survives in-tab navigation
- first-party cookie `zyflow_ft` (90 days, `SameSite=Lax`, `Domain=.zyflow.eu` on production)

At click time, **current URL** `utm_*` params win; otherwise the stored first-touch values are used.

## Events and properties

### Automatic (PostHog)

| Event | When | Properties of interest |
| --- | --- | --- |
| `$pageview` | Pending (memory) and after analytics consent | `$current_url`, `$referrer`, `utm_source`, `utm_medium`, `utm_campaign`, plus registered `platform=website` |

### Custom (PostHog, analytics consent only)

| Event | Properties |
| --- | --- |
| `app_store_click` | `store` (`ios` \| `android` \| `other`), `utm_source`, `utm_medium`, `utm_campaign`, `placement` (`app_modal`, `nav`, `footer`, `announcement`, `app_banner`, `app_stage`, `hero`, `features`, `tour`, `page`) |

### dataLayer (unchanged, still consumed by GTM)

| Event | Properties |
| --- | --- |
| `app_store_click` | `event_id`, `store`, `cta_location`, `cta_label`, `link_url`, `oppref` |
| `app_cta_click` | `event_id`, `cta_location`, `cta_label`, `link_url`, `oppref` |
| `contact_submit` | `event_id`, `form_id`, `form_topic`, `oppref` |
| `newsletter_subscribe` | `event_id`, `form_id`, `oppref` |

Do not edit the GTM container from this repo. Snippets under `rebuild/gtm/` are documentation for tags that already live in GTM-W8XX2TWZ.

## Store-link attribution

Applied on load (after first-touch persist) and again at click, for real App Store / Play anchors (not `[data-app-modal-open]` CTAs).

**Google Play** — `referrer` query param, URL-encoded, containing `utm_source`, `utm_medium`, `utm_campaign`. When analytics consent is granted and PostHog has a distinct id, also `ph_id=<distinct_id>`. Without consent, UTMs only (no ids).

**App Store** — `ct=<campaign token>` derived from `utm_campaign` (sanitized). Existing query params, including `oppref` if present on the store URL, are kept.

## Files

- `js/analytics-config.js` — IDs (GTM, GA4, PostHog)
- `js/attribution.js` — first-touch + store URL rewrite
- `js/posthog-consent.js` — `cc_cookie` pending / granted / denied
- `js/posthog-boot.js` — memory-until-consent loader
- `js/analytics-events.js` — dataLayer + PostHog `app_store_click`
- `js/cookieconsent-config.js` — banner, Consent Mode, PostHog grant/withdraw
