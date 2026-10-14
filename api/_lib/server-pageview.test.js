'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  POSTHOG_API_HOST,
  POSTHOG_CAPTURE_URL,
  POSTHOG_PROJECT_KEY,
  EVENT_NAME,
  DISTINCT_ID,
  ALLOWED_PAYLOAD_KEYS,
  ALLOWED_PROPERTY_KEYS,
  middlewareConfig,
  localeFromPath,
  referrerHostOf,
  isHtmlPagePath,
  isBotUserAgent,
  isPrefetchRequest,
  shouldCapture,
  buildCapturePayload,
  captureHeaders,
  sendCapture,
  handleMiddleware,
  readClientPosthogProjectKey,
  readClientPosthogApiHost,
} = require('./server-pageview');

function request(url, { method = 'GET', headers = {} } = {}) {
  const headerMap = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)])
  );
  return {
    method,
    url,
    headers: {
      get(name) {
        return headerMap.get(String(name).toLowerCase()) || null;
      },
    },
  };
}

function page(url, headers) {
  return request(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      ...headers,
    },
  });
}

test('uses the same public PostHog EU key as analytics-config.js', () => {
  assert.equal(readClientPosthogProjectKey(), POSTHOG_PROJECT_KEY);
  assert.equal(readClientPosthogApiHost(), POSTHOG_API_HOST);
  assert.equal(POSTHOG_API_HOST, 'https://eu.i.posthog.com');
  assert.equal(POSTHOG_CAPTURE_URL, 'https://eu.i.posthog.com/i/v0/e/');
  assert.match(POSTHOG_PROJECT_KEY, /^phc_/);
});

test('payload is allowlisted: constant anonymous id, no IP, geoip off', () => {
  const payload = buildCapturePayload(
    page('https://www.zyflow.eu/about?utm_source=newsletter&email=rider@example.com', {
      referer: 'https://www.google.com/search?q=zyflow&hl=en',
      'user-agent': 'Mozilla/5.0 (secret-browser-build)',
      'x-forwarded-for': '203.0.113.50',
      'x-real-ip': '203.0.113.50',
      cookie: 'ph_phc_test=secret; cc_cookie=1',
    })
  );

  assert.deepEqual(Object.keys(payload), ALLOWED_PAYLOAD_KEYS);
  assert.deepEqual(Object.keys(payload.properties), ALLOWED_PROPERTY_KEYS);
  assert.equal(payload.event, EVENT_NAME);
  assert.equal(payload.event, 'server_pageview');
  assert.equal(payload.distinct_id, DISTINCT_ID);
  assert.equal(payload.distinct_id, 'anonymous');
  assert.equal(payload.api_key, POSTHOG_PROJECT_KEY);
  assert.equal(payload.properties.$process_person_profile, false);
  assert.equal(payload.properties.$ip, null);
  assert.equal(payload.properties.$geoip_disable, true);
  assert.equal(payload.properties.path, '/about');
  assert.equal(payload.properties.locale, 'en');
  assert.equal(payload.properties.referrer_host, 'www.google.com');

  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes('203.0.113.50'), false);
  assert.equal(serialized.includes('secret-browser-build'), false);
  assert.equal(serialized.includes('utm_source'), false);
  assert.equal(serialized.includes('rider@example.com'), false);
  assert.equal(serialized.includes('ph_phc_test'), false);
  assert.equal(serialized.includes('cc_cookie'), false);
  assert.equal(serialized.includes('x-forwarded-for'), false);
  assert.equal(serialized.includes('User-Agent') || serialized.includes('user-agent'), false);
});

test('locale is en/sl from the path only', () => {
  assert.equal(localeFromPath('/'), 'en');
  assert.equal(localeFromPath('/tours'), 'en');
  assert.equal(localeFromPath('/sl'), 'sl');
  assert.equal(localeFromPath('/sl/'), 'sl');
  assert.equal(localeFromPath('/sl/about'), 'sl');
  assert.equal(localeFromPath('/legal-pages/izbris-racuna'), 'sl');
  assert.equal(buildCapturePayload(page('https://www.zyflow.eu/sl/contact')).properties.locale, 'sl');
});

test('referrer is hostname only; missing or invalid referrer is empty', () => {
  assert.equal(
    referrerHostOf(page('https://www.zyflow.eu/', { referer: 'https://maps.google.com/maps?q=ljubljana' })),
    'maps.google.com'
  );
  assert.equal(referrerHostOf(page('https://www.zyflow.eu/', { referer: 'not a url' })), '');
  assert.equal(referrerHostOf(page('https://www.zyflow.eu/')), '');
});

test('HTML page paths are counted; assets, api, and metadata files are not', () => {
  assert.equal(isHtmlPagePath('/'), true);
  assert.equal(isHtmlPagePath('/about'), true);
  assert.equal(isHtmlPagePath('/sl/blog/e-bike-charging-at-hospitality-stops'), true);
  assert.equal(isHtmlPagePath('/about.html'), true);
  assert.equal(isHtmlPagePath('/api/contact'), false);
  assert.equal(isHtmlPagePath('/api'), false);
  assert.equal(isHtmlPagePath('/assets/images/home/hero.jpg'), false);
  assert.equal(isHtmlPagePath('/css/app.css'), false);
  assert.equal(isHtmlPagePath('/js/home.js'), false);
  assert.equal(isHtmlPagePath('/favicon.ico'), false);
  assert.equal(isHtmlPagePath('/sitemap.xml'), false);
  assert.equal(isHtmlPagePath('/robots.txt'), false);
  assert.equal(isHtmlPagePath('/manifest.json'), false);
});

test('shouldCapture skips non-GET, bots, prefetch, and static paths', () => {
  assert.equal(shouldCapture(page('https://www.zyflow.eu/')), true);
  assert.equal(shouldCapture(page('https://www.zyflow.eu/sl')), true);
  assert.equal(shouldCapture(request('https://www.zyflow.eu/', { method: 'HEAD' })), false);
  assert.equal(shouldCapture(request('https://www.zyflow.eu/', { method: 'POST' })), false);
  assert.equal(shouldCapture(page('https://www.zyflow.eu/api/contact')), false);
  assert.equal(shouldCapture(page('https://www.zyflow.eu/css/home.css')), false);
  assert.equal(
    shouldCapture(page('https://www.zyflow.eu/', { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' })),
    false
  );
  assert.equal(
    shouldCapture(page('https://www.zyflow.eu/', { 'user-agent': 'Mozilla/5.0 HeadlessChrome/129.0.0.0' })),
    false
  );
  assert.equal(
    shouldCapture(page('https://www.zyflow.eu/', { purpose: 'prefetch' })),
    false
  );
  assert.equal(
    shouldCapture(page('https://www.zyflow.eu/', { 'sec-purpose': 'prefetch' })),
    false
  );
  assert.equal(
    shouldCapture(page('https://www.zyflow.eu/', { 'sec-fetch-dest': 'empty' })),
    false
  );
  assert.equal(isBotUserAgent('Slackbot-LinkExpanding 1.0'), true);
  assert.equal(isPrefetchRequest(page('https://www.zyflow.eu/', { 'x-moz': 'prefetch' })), true);
});

test('capture fetch sends only Content-Type and the allowlisted JSON body', async () => {
  const calls = [];
  await sendCapture(page('https://www.zyflow.eu/tours', { referer: 'https://example.net/path?q=1' }), {
    fetchFn: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200 };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, POSTHOG_CAPTURE_URL);
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(Object.keys(calls[0].init.headers), ['Content-Type']);
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');

  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(Object.keys(body), ALLOWED_PAYLOAD_KEYS);
  assert.deepEqual(Object.keys(body.properties), ALLOWED_PROPERTY_KEYS);
  assert.equal(body.properties.path, '/tours');
  assert.equal(body.properties.referrer_host, 'example.net');
  assert.equal(body.properties.$ip, null);
});

test('handleMiddleware is fire-and-forget: returns undefined and uses waitUntil', () => {
  const jobs = [];
  let fetchStarted = false;
  let resolveFetch;
  const fetchFn = () => {
    fetchStarted = true;
    return new Promise((resolve) => {
      resolveFetch = resolve;
    });
  };

  const result = handleMiddleware(page('https://www.zyflow.eu/press'), { waitUntil: (job) => jobs.push(job) }, { fetchFn });
  assert.equal(result, undefined);
  assert.equal(jobs.length, 1);
  assert.equal(fetchStarted, true);
  if (resolveFetch) resolveFetch({ ok: true });
});

test('handleMiddleware never throws when capture or waitUntil fails', () => {
  const fetchFn = async () => {
    throw new Error('network down');
  };
  assert.equal(
    handleMiddleware(
      page('https://www.zyflow.eu/'),
      {
        waitUntil() {
          throw new Error('waitUntil boom');
        },
      },
      { fetchFn }
    ),
    undefined
  );
  assert.equal(handleMiddleware(null, { waitUntil() {} }, { fetchFn }), undefined);
  assert.doesNotThrow(() => handleMiddleware(page('https://www.zyflow.eu/'), null, { fetchFn }));
});

test('handleMiddleware does not schedule captures for skipped requests', () => {
  const jobs = [];
  const context = { waitUntil: (job) => jobs.push(job) };
  handleMiddleware(page('https://www.zyflow.eu/assets/images/home/hero.jpg'), context);
  handleMiddleware(page('https://www.zyflow.eu/', { purpose: 'prefetch' }), context);
  handleMiddleware(request('https://www.zyflow.eu/', { method: 'HEAD' }), context);
  assert.equal(jobs.length, 0);
});

test('middleware matcher skips api and hashed static prefixes', () => {
  assert.equal(middlewareConfig.runtime, 'nodejs');
  assert.ok(Array.isArray(middlewareConfig.matcher));
  const matcher = middlewareConfig.matcher.join(' ');
  assert.match(matcher, /api/);
  assert.match(matcher, /assets/);
  assert.match(matcher, /css/);
  assert.match(matcher, /js/);
});

test('root middleware.js schedules waitUntil and does not return a body', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', '..', 'middleware.js'), 'utf8');
  assert.match(source, /handleMiddleware/);
  assert.match(source, /export default/);
  assert.match(source, /server-pageview/);
  assert.equal(/new Response\(/.test(source), false);
  assert.equal(/set-cookie/i.test(source), false);
  assert.equal(/x-forwarded-for/i.test(source), false);
  assert.equal(/user-agent/i.test(source), false);
});
