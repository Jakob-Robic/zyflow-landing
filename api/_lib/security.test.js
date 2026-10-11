'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  escapeHtml,
  stripCrlf,
  isValidEmail,
  isAllowedOrigin,
  honeypotFilled,
  readContactFields,
  readWaitlistFields,
} = require('./security');

test('escapeHtml encodes markup and quotes', () => {
  assert.equal(
    escapeHtml(`<img src=x onerror=alert(1) foo="bar" baz='q'>`),
    '&lt;img src=x onerror=alert(1) foo=&quot;bar&quot; baz=&#39;q&#39;&gt;'
  );
});

test('stripCrlf removes header-breaking characters', () => {
  assert.equal(stripCrlf('Hello\r\nBcc: evil@example.com'), 'Hello Bcc: evil@example.com');
});

test('isValidEmail accepts a normal address and rejects junk', () => {
  assert.equal(isValidEmail('rider@zyflow.eu'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail('a@b'), false);
  assert.equal(isValidEmail('a@b.c\nextra'), false);
});

test('isAllowedOrigin allows production, localhost, and preview hosts', () => {
  assert.equal(isAllowedOrigin('https://www.zyflow.eu'), true);
  assert.equal(isAllowedOrigin('https://zyflow.eu'), true);
  assert.equal(isAllowedOrigin('http://localhost:4173'), true);
  assert.equal(isAllowedOrigin('https://zyflow-landing-git-main.vercel.app'), true);
  assert.equal(isAllowedOrigin('https://evil.example'), false);
  assert.equal(isAllowedOrigin('https://evil.vercel.app'), false);
});

test('honeypotFilled is true only when the hidden field has a value', () => {
  assert.equal(honeypotFilled({ website: '' }), false);
  assert.equal(honeypotFilled({ website: 'http://spam.test' }), true);
});

test('readContactFields enforces type, length, and email format', () => {
  assert.equal(readContactFields({ name: 'Ada', email: 'ada@zyflow.eu', message: 'Hi' }).name, 'Ada');
  assert.equal(readContactFields({ name: 'Ada', email: 'nope', message: 'Hi' }).error, 'Valid email required');
  assert.equal(
    readContactFields({ name: 'Ada', email: 'ada@zyflow.eu', message: 'x'.repeat(5001) }).error,
    'Input too long'
  );
  assert.equal(
    readContactFields({ name: 1, email: 'ada@zyflow.eu', message: 'Hi' }).error,
    'Invalid input'
  );
});

test('readWaitlistFields keeps the existing invalid-email message', () => {
  assert.equal(readWaitlistFields({ email: 'bad' }).error, 'Valid email required');
  assert.equal(readWaitlistFields({ email: 'rider@zyflow.eu' }).email, 'rider@zyflow.eu');
});
