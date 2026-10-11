'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetRateLimits } = require('./security');
const handler = require('../csp-report');

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    end() {
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader() {},
  };
}

test('csp-report accepts a report and logs no query string', async () => {
  resetRateLimits();
  const logs = [];
  const original = console.info;
  console.info = function (...args) {
    logs.push(args.map(String).join(' '));
  };
  try {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.20' },
      body: {
        'csp-report': {
          'document-uri': 'https://www.zyflow.eu/contact?email=hidden@example.com',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.example/x.js?token=secret',
          disposition: 'report',
        },
      },
      socket: { remoteAddress: '198.51.100.20' },
    };
    const res = mockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 204);
    assert.equal(logs.some((line) => line.includes('hidden@example.com')), false);
    assert.equal(logs.some((line) => line.includes('token=secret')), false);
    assert.equal(logs.some((line) => line.includes('script-src')), true);
    assert.equal(logs.some((line) => line.includes('https://www.zyflow.eu/contact')), true);
  } finally {
    console.info = original;
  }
});

test('csp-report drops oversized bodies', async () => {
  resetRateLimits();
  const req = {
    method: 'POST',
    headers: { 'x-forwarded-for': '198.51.100.21' },
    body: { pad: 'x'.repeat(9000) },
    socket: { remoteAddress: '198.51.100.21' },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 204);
});
