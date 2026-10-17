'use strict';

/**
 * Shared form rate limiter (Supabase / Postgres).
 *
 * Fixed windows, per endpoint (`contact` | `waitlist`):
 *   - IP:    5 requests / 10 minutes
 *   - email: 3 requests / 1 hour  (normalized: trim + lowercase)
 *
 * Identifiers are stored as SHA-256(salt || kind || value), never raw IP
 * or email. Salt comes from RATE_LIMIT_IP_SALT.
 *
 * Fails closed: any error (missing salt, missing Supabase env, RPC
 * failure) is treated as unavailable — callers must return 503, not 200.
 *
 * Cleanup: the SQL function deletes expired rows (bounded). Optional
 * pg_cron is documented in the migration file.
 */

const crypto = require('crypto');
const { getSupabase } = require('./supabase');

const RATE_LIMIT_WINDOWS = {
  ip: { max: 5, windowSeconds: 10 * 60 },
  email: { max: 3, windowSeconds: 60 * 60 },
};

function rateLimitSalt() {
  return (process.env.RATE_LIMIT_IP_SALT || '').trim();
}

function hashIdentifier(kind, identifier) {
  const salt = rateLimitSalt();
  if (!salt) return null;
  return crypto
    .createHash('sha256')
    .update(salt)
    .update('\0')
    .update(String(kind))
    .update('\0')
    .update(String(identifier))
    .digest('hex');
}

function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  const value = email.trim().toLowerCase();
  if (!value || !value.includes('@')) return '';
  return value;
}

function parseRpcPayload(data) {
  let payload = data;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.allowed !== 'boolean') return null;
  return payload;
}

async function consumeRateLimit({ kind, bucket, identifier }) {
  const window = RATE_LIMIT_WINDOWS[kind];
  if (!window || !bucket || identifier == null || identifier === '') {
    console.error('Rate limit: invalid arguments');
    return { ok: false };
  }
  if (!rateLimitSalt()) {
    console.error('Rate limit: RATE_LIMIT_IP_SALT is not set');
    return { ok: false };
  }
  const digest = hashIdentifier(kind, identifier);
  if (!digest) {
    console.error('Rate limit: RATE_LIMIT_IP_SALT is not set');
    return { ok: false };
  }
  const key = `${bucket}:${kind}:${digest}`;
  try {
    const { data, error } = await getSupabase().rpc('check_and_increment_rate_limit', {
      p_key: key,
      p_max: window.max,
      p_window_seconds: window.windowSeconds,
    });
    if (error) {
      console.error('Rate limit: check failed');
      return { ok: false };
    }
    const payload = parseRpcPayload(data);
    if (!payload) {
      console.error('Rate limit: check failed');
      return { ok: false };
    }
    if (!payload.allowed) {
      const retry = Number(payload.retry_after_seconds);
      return {
        ok: false,
        limited: true,
        retryAfterSec: Number.isFinite(retry) && retry > 0 ? Math.ceil(retry) : window.windowSeconds,
      };
    }
    return { ok: true };
  } catch {
    console.error('Rate limit: check failed');
    return { ok: false };
  }
}

function sendRateLimitResult(res, result) {
  if (result.ok) return true;
  if (result.limited) {
    res.setHeader('Retry-After', String(result.retryAfterSec || 1));
    res.status(429).json({ error: 'Too many requests' });
    return false;
  }
  res.status(503).json({ error: 'Service unavailable' });
  return false;
}

async function enforceIpRateLimit(res, bucket, ip) {
  const result = await consumeRateLimit({
    kind: 'ip',
    bucket,
    identifier: ip,
  });
  return sendRateLimitResult(res, result);
}

async function enforceEmailRateLimit(res, bucket, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return true;
  const result = await consumeRateLimit({
    kind: 'email',
    bucket,
    identifier: normalized,
  });
  return sendRateLimitResult(res, result);
}

module.exports = {
  RATE_LIMIT_WINDOWS,
  hashIdentifier,
  normalizeEmail,
  consumeRateLimit,
  enforceIpRateLimit,
  enforceEmailRateLimit,
};
