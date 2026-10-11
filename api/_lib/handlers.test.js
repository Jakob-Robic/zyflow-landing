'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key';
process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || 'test-brevo-key';
process.env.NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'owner@example.com';
process.env.FORM_RATE_LIMIT_MAX = '20';
process.env.FORM_RATE_LIMIT_WINDOW_MS = '600000';
delete process.env.TURNSTILE_SECRET_KEY;

const inserts = [];
const emails = [];
let nextInsertError = null;

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '@supabase/supabase-js') {
    return {
      createClient() {
        return {
          from(table) {
            return {
              async insert(row) {
                inserts.push({ table, row });
                const error = nextInsertError;
                nextInsertError = null;
                return { error };
              },
            };
          },
        };
      },
    };
  }
  if (request === './brevo' || request.endsWith('/brevo')) {
    return {
      async sendBrevoEmail(opts) {
        emails.push(opts);
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const contact = require('../contact');
const waitlist = require('../waitlist');
const { resetRateLimits } = require('./security');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

async function call(handler, { method = 'POST', origin, body, ip } = {}) {
  const req = {
    method,
    headers: {
      origin,
      'x-forwarded-for': ip || '203.0.113.10',
    },
    body,
    socket: { remoteAddress: ip || '203.0.113.10' },
  };
  const res = mockRes();
  await handler(req, res);
  return res;
}

test.beforeEach(() => {
  inserts.length = 0;
  emails.length = 0;
  nextInsertError = null;
  resetRateLimits();
});

test('contact: valid submission saves and escapes HTML in the notification email', async () => {
  const res = await call(contact, {
    origin: 'https://www.zyflow.eu',
    body: {
      name: '<img src=x onerror=alert(1)>',
      email: 'rider@zyflow.eu',
      subject: 'Lead\r\nBcc: evil@example.com',
      message: 'Hello <a href="javascript:alert(1)">click</a>\nline two',
    },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
  assert.equal(inserts.length, 1);
  assert.equal(emails.length, 1);
  assert.match(emails[0].html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(emails[0].html, /&lt;a href=&quot;javascript:alert\(1\)&quot;&gt;click&lt;\/a&gt;/);
  assert.equal(emails[0].html.includes('<img'), false);
  assert.equal(/\r|\n/.test(emails[0].subject), false);
  assert.equal(emails[0].subject.includes('Bcc:'), true);
});

test('contact: too-long message is rejected', async () => {
  const res = await call(contact, {
    origin: 'https://www.zyflow.eu',
    body: { name: 'Ada', email: 'ada@zyflow.eu', message: 'x'.repeat(5001) },
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Input too long');
  assert.equal(inserts.length, 0);
});

test('contact: bad email is rejected without logging the address', async () => {
  const logs = [];
  const original = console.error;
  console.error = function (...args) {
    logs.push(args.map(String).join(' '));
  };
  try {
    const res = await call(contact, {
      origin: 'https://www.zyflow.eu',
      body: { name: 'Ada', email: 'not-an-email', message: 'Hi' },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Valid email required');
    assert.equal(logs.some((line) => line.includes('not-an-email')), false);
  } finally {
    console.error = original;
  }
});

test('contact: filled honeypot looks successful and stores nothing', async () => {
  const res = await call(contact, {
    origin: 'https://www.zyflow.eu',
    body: {
      name: 'Bot',
      email: 'bot@spam.test',
      message: 'spam',
      website: 'https://spam.test',
    },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
  assert.equal(inserts.length, 0);
  assert.equal(emails.length, 0);
});

test('contact: wrong origin is rejected', async () => {
  const res = await call(contact, {
    origin: 'https://evil.example',
    body: { name: 'Ada', email: 'ada@zyflow.eu', message: 'Hi' },
  });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'Origin not allowed');
  assert.equal(res.headers['Access-Control-Allow-Origin'], undefined);
  assert.equal(inserts.length, 0);
});

test('contact: OPTIONS from a site origin answers the preflight', async () => {
  const res = await call(contact, {
    method: 'OPTIONS',
    origin: 'https://zyflow.eu',
  });
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://zyflow.eu');
  assert.equal(res.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
});

test('waitlist: valid email succeeds', async () => {
  const res = await call(waitlist, {
    origin: 'https://www.zyflow.eu',
    body: { email: 'rider@zyflow.eu' },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
  assert.equal(inserts[0].table, 'waitlist');
  assert.match(emails[0].html, /rider@zyflow\.eu/);
});

test('waitlist: bad email does not log the submitted address', async () => {
  const logs = [];
  const original = console.error;
  console.error = function (...args) {
    logs.push(args.map(String).join(' '));
  };
  try {
    const res = await call(waitlist, {
      origin: 'https://www.zyflow.eu',
      body: { email: 'leaked-not-an-email' },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Valid email required');
    assert.equal(logs.some((line) => line.includes('leaked-not-an-email')), false);
  } finally {
    console.error = original;
  }
});

test('waitlist: HTML in the email is escaped in the notification', async () => {
  const res = await call(waitlist, {
    origin: 'http://localhost:4173',
    body: { email: 'ok@zyflow.eu' },
  });
  assert.equal(res.statusCode, 200);
  const evil = await call(waitlist, {
    origin: 'http://localhost:4173',
    ip: '203.0.113.11',
    body: { email: 'ok@zyflow.eu', website: '' },
  });
  assert.equal(evil.statusCode, 200);
  emails.length = 0;
  const htmlRes = await call(waitlist, {
    origin: 'http://localhost:4173',
    ip: '203.0.113.12',
    body: { email: 'a@b.co' },
  });
  assert.equal(htmlRes.statusCode, 200);
});

test('contact: invalid bodies still count toward the rate limit', async () => {
  process.env.FORM_RATE_LIMIT_MAX = '2';
  resetRateLimits();
  const bad = { name: 'Ada', email: 'nope', message: 'Hi' };
  const a = await call(contact, { origin: 'https://www.zyflow.eu', ip: '198.51.100.40', body: bad });
  const b = await call(contact, { origin: 'https://www.zyflow.eu', ip: '198.51.100.40', body: bad });
  const c = await call(contact, {
    origin: 'https://www.zyflow.eu',
    ip: '198.51.100.40',
    body: { name: 'Ada', email: 'ada@zyflow.eu', message: 'Hi' },
  });
  process.env.FORM_RATE_LIMIT_MAX = '20';
  assert.equal(a.statusCode, 400);
  assert.equal(b.statusCode, 400);
  assert.equal(c.statusCode, 429);
  assert.equal(inserts.length, 0);
});

test('contact: rate limit returns 429 after the window fills', async () => {
  process.env.FORM_RATE_LIMIT_MAX = '3';
  resetRateLimits();
  const body = { name: 'Ada', email: 'ada@zyflow.eu', message: 'Hi' };
  const a = await call(contact, { origin: 'https://www.zyflow.eu', ip: '198.51.100.9', body });
  const b = await call(contact, { origin: 'https://www.zyflow.eu', ip: '198.51.100.9', body });
  const c = await call(contact, { origin: 'https://www.zyflow.eu', ip: '198.51.100.9', body });
  const d = await call(contact, { origin: 'https://www.zyflow.eu', ip: '198.51.100.9', body });
  process.env.FORM_RATE_LIMIT_MAX = '20';
  assert.equal(a.statusCode, 200);
  assert.equal(b.statusCode, 200);
  assert.equal(c.statusCode, 200);
  assert.equal(d.statusCode, 429);
  assert.equal(d.body.error, 'Too many requests');
});
