# Marketing site analytics

The rebuild site (`www.zyflow.eu`) ships two analytics stacks. Google Tag Manager is unchanged. Client PostHog is loaded from this repo only after cookie consent. A separate **server-side** page-view counter (no client script) records anonymous HTML hits independently of consent.

## Server-side page views (no cookies, no identifiers)

Vercel Routing Middleware (`server-pageview-middleware.js`) counts HTML GET requests by fire-and-forget `waitUntil` POSTing to PostHog EU (`https://eu.i.posthog.com/i/v0/e/`, project 168051, same public ingestion key as `js/analytics-config.js`).

This path does **not** load `posthog-js`, does not set cookies, and does not store an IP or visitor id. It must never delay or rewrite the page response. Consent-gated client PostHog is unchanged. The public policy sentence is in Privacy Policy §12 and Cookie Policy §2 (EN + SL).

### When a hit is captured

Counted: `GET` requests whose path looks like an HTML page (`/`, `/about`, `/sl/...`, `*.html`).

Skipped where feasible: `/api/*`, `/assets/*`, `/css/*`, `/js/*`, `/fonts/*`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `manifest.json`, non-GET methods, bot-like User-Agents, and prefetch/prerender (`Purpose` / `Sec-Purpose` / `Sec-Fetch-Dest` not `document`). User-Agent and prefetch headers are read only to skip the request — they are never sent to PostHog.

### Exactly what is sent

`POST` `https://eu.i.posthog.com/i/v0/e/` with header `Content-Type: application/json` only. No `X-Forwarded-For`, no client `User-Agent`, no cookies, no other visitor headers.

```json
{
  "api_key": "<public key from js/analytics-config.js>",
  "event": "server_pageview",
  "distinct_id": "anonymous",
  "properties": {
    "$process_person_profile": false,
    "$ip": null,
    "$geoip_disable": true,
    "path": "/about",
    "locale": "en",
    "referrer_host": "www.google.com"
  }
}
```

| Field | Value |
| --- | --- |
| `api_key` | Public project key (same as `ZYFLOW_ANALYTICS.posthogProjectKey`) |
| `event` | `server_pageview` |
| `distinct_id` | Constant `anonymous` (not a visitor id) |
| `$process_person_profile` | `false` |
| `$ip` | `null` (do not store the capture-request IP) |
| `$geoip_disable` | `true` (do not geoip the Vercel egress IP) |
| `path` | URL pathname only (no query, hash, or host) |
| `locale` | `en` or `sl` from the path (`/sl` prefix, or `/legal-pages/izbris-racuna`) |
| `referrer_host` | Referer hostname only, or `""` |

Nothing else is included: no client IP, no User-Agent string, no cookies, no UTMs, no `$current_url`, no city/country.

Implementation: `server-pageview-middleware.js` (CommonJS, scheduled with `waitUntil`) plus `vercel.json` `proxy.entrypoint` so this static build uses Node.js routing middleware. Helpers and tests live in `api/_lib/server-pageview.js`.

## Consent

The vanilla-cookieconsent banner (categories `necessary` / `analytics` / `advertisement`) and Google Consent Mode v2 stay as they were.

| Choice | Behaviour |
| --- | --- |
| No choice yet / reject optional | GTM stays in denied Consent Mode. `posthog-js` is **not** downloaded. Store links may still receive first-party UTM query values (no `ph_id`). |
| Accept **analytics** | Consent Mode sets `analytics_storage=granted`. GA4 can fire via GTM. `posthog-js` is fetched from `eu-assets.i.posthog.com`, then `opt_in_capturing()` runs. |
| Withdraw analytics | Consent Mode returns to denied. `opt_out_capturing()` runs. PostHog cookies matching `ph_*` / `phc_*` are auto-cleared. Store links are rewritten without `ph_id`. |
| Accept **advertisement** | Unchanged: Meta / ChatGPT Ads pixels via GTM. `oppref` is still captured in `sessionStorage` for dataLayer events. |

PostHog init (after consent only):

- `api_host`: `https://eu.i.posthog.com`
- Project key: `ZYFLOW_ANALYTICS.posthogProjectKey` in `js/analytics-config.js` (public ingestion key)
- `person_profiles: 'always'`
- `capture_pageview: true` (records `$current_url`, `$referrer`, `utm_*`)
- `cross_subdomain_cookie: true` (cookie on `.zyflow.eu` so www / navigate / app can share the visitor id)
- `persistence: 'localStorage+cookie'`
- `opt_out_capturing_by_default: true`, then `opt_in_capturing()` / `opt_out_capturing()` from `onConsent` / `onChange`
- `disable_session_recording: true` — no session recording on the marketing site
- Super property `platform=website`

The script is injected with `async` + `defer` only after consent so the first paint does not wait on PostHog.

## First-touch UTMs

`js/attribution.js` stores the first `utm_source` / `utm_medium` / `utm_campaign` (or referrer host, or `direct`) in:

- `sessionStorage.zyflow_ft` — survives in-tab navigation
- first-party cookie `zyflow_ft` (90 days, `SameSite=Lax`, `Domain=.zyflow.eu` on production)

At click time, **current URL** `utm_*` params win; otherwise the stored first-touch values are used.

## Events and properties

### Automatic (PostHog, analytics consent only)

| Event | Properties of interest |
| --- | --- |
| `$pageview` | `$current_url`, `$referrer`, `utm_source`, `utm_medium`, `utm_campaign`, plus registered `platform=website` |

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
- `js/posthog-boot.js` — consent-gated loader
- `js/analytics-events.js` — dataLayer + PostHog `app_store_click`
- `js/cookieconsent-config.js` — banner, Consent Mode, PostHog grant/withdraw
- `server-pageview-middleware.js` + `api/_lib/server-pageview.js` — server-side `server_pageview` (no client script)
