/**
 * Vercel Routing Middleware — anonymous server_pageview counter.
 *
 * Self-contained ESM (no imports) so a static / CJS repo still compiles.
 * Capture is fire-and-forget via waitUntil: never await, never return a
 * Response, never set cookies, never forward visitor IP / UA / headers.
 */
const POSTHOG_CAPTURE_URL = 'https://eu.i.posthog.com/i/v0/e/';
const POSTHOG_PROJECT_KEY = 'phc_Bidx6J3fgqBuQ92kHq68hJQcVkwXybr3MGvAEnvMGAme';
const EVENT_NAME = 'server_pageview';
const DISTINCT_ID = 'anonymous';
const CAPTURE_TIMEOUT_MS = 2500;
const MAX_PATH_LENGTH = 512;
const MAX_HOST_LENGTH = 253;

const STATIC_PREFIXES = ['/api/', '/assets/', '/css/', '/js/', '/fonts/', '/gtm/'];
const STATIC_FILES = new Set([
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/site.webmanifest',
]);

const BOT_UA_RE =
  /(?:^|[^a-z])(?:bot|crawler|spider|crawling|slurp|preview|prerender|lighthouse|pagespeed|pingdom|gtmetrix|headless|phantom|facebookexternalhit|facebot|twitterbot|slackbot|linkedinbot|whatsapp|telegram|applebot|bingbot|googlebot|duckduck|yandex|baidu|semrush|ahrefs|dotbot|petal|bytespider|gptbot|chatgpt|claudebot|ccbot|amazonbot|ia_archiver|uptime|monitor|wget|curl|httpclient|python-requests|axios\/|go-http-client|libwww)/i;

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!api(?:/|$)|assets/|css/|js/|fonts/|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|manifest\\.json$).*)',
  ],
};

function clip(value, max) {
  const text = String(value == null ? '' : value);
  return text.length > max ? text.slice(0, max) : text;
}

function headerValue(request, name) {
  if (!request || !name) return '';
  const headers = request.headers;
  if (!headers) return '';
  if (typeof headers.get === 'function') {
    return String(headers.get(name) || headers.get(name.toLowerCase()) || '');
  }
  const raw = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(raw)) return String(raw[0] || '');
  return raw == null ? '' : String(raw);
}

function normalizePathname(pathname) {
  if (!pathname) return '/';
  let next = String(pathname).split('?')[0].split('#')[0];
  if (!next.startsWith('/')) next = `/${next}`;
  if (next.length > 1 && next.endsWith('/')) next = next.slice(0, -1);
  return clip(next, MAX_PATH_LENGTH) || '/';
}

function pathnameOf(request) {
  try {
    if (!request || !request.url) return '/';
    return normalizePathname(new URL(String(request.url), 'https://www.zyflow.eu').pathname);
  } catch {
    return '/';
  }
}

function localeFromPath(pathname) {
  const pathName = normalizePathname(pathname);
  if (pathName === '/sl' || pathName.startsWith('/sl/')) return 'sl';
  if (pathName === '/legal-pages/izbris-racuna') return 'sl';
  return 'en';
}

function hostOnly(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    return clip(new URL(value).hostname || '', MAX_HOST_LENGTH);
  } catch {
    return '';
  }
}

function referrerHostOf(request) {
  const referer = headerValue(request, 'referer') || headerValue(request, 'referrer');
  if (referer) return hostOnly(referer);
  const fallback = request && typeof request.referrer === 'string' ? request.referrer : '';
  if (!fallback || fallback === 'about:client' || fallback === 'about:blank') return '';
  return hostOnly(fallback);
}

function isHtmlPagePath(pathname) {
  const pathName = normalizePathname(pathname);
  if (STATIC_FILES.has(pathName)) return false;
  for (let i = 0; i < STATIC_PREFIXES.length; i++) {
    const prefix = STATIC_PREFIXES[i];
    if (pathName === prefix.slice(0, -1) || pathName.startsWith(prefix)) return false;
  }
  const base = pathName.split('/').pop() || '';
  if (base.includes('.')) {
    const ext = base.slice(base.lastIndexOf('.') + 1).toLowerCase();
    return ext === 'html' || ext === 'htm';
  }
  return true;
}

function isBotUserAgent(userAgent) {
  return typeof userAgent === 'string' && userAgent !== '' && BOT_UA_RE.test(userAgent);
}

function isPrefetchRequest(request) {
  const purpose = `${headerValue(request, 'purpose')} ${headerValue(request, 'sec-purpose')} ${headerValue(request, 'x-purpose')}`.toLowerCase();
  if (purpose.includes('prefetch') || purpose.includes('prerender') || purpose.includes('preview')) {
    return true;
  }
  if (headerValue(request, 'next-router-prefetch') === '1') return true;
  if (headerValue(request, 'x-moz') === 'prefetch') return true;
  const dest = headerValue(request, 'sec-fetch-dest').toLowerCase();
  if (dest && dest !== 'document') return true;
  return headerValue(request, 'sec-fetch-mode').toLowerCase() === 'prefetch';
}

function shouldCapture(request) {
  if (!request) return false;
  if (String(request.method || 'GET').toUpperCase() !== 'GET') return false;
  if (!isHtmlPagePath(pathnameOf(request))) return false;
  if (isBotUserAgent(headerValue(request, 'user-agent'))) return false;
  if (isPrefetchRequest(request)) return false;
  return true;
}

function buildCapturePayload(request) {
  const pathName = pathnameOf(request);
  return {
    api_key: POSTHOG_PROJECT_KEY,
    event: EVENT_NAME,
    distinct_id: DISTINCT_ID,
    properties: {
      $process_person_profile: false,
      $ip: null,
      $geoip_disable: true,
      path: pathName,
      locale: localeFromPath(pathName),
      referrer_host: referrerHostOf(request),
    },
  };
}

function abortSignal() {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(CAPTURE_TIMEOUT_MS);
  }
  return undefined;
}

async function sendCapture(request) {
  try {
    await fetch(POSTHOG_CAPTURE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCapturePayload(request)),
      signal: abortSignal(),
    });
  } catch {
    // Best-effort. Never surface to the page response.
  }
}

export default function middleware(request, context) {
  try {
    if (!shouldCapture(request)) return;
    const job = sendCapture(request);
    if (context && typeof context.waitUntil === 'function') {
      context.waitUntil(job);
    } else if (job && typeof job.catch === 'function') {
      job.catch(() => {});
    }
  } catch {
    // Never throw or replace the static HTML response.
  }
}
