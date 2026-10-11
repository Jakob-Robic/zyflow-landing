'use strict';

const { rateLimit, jsonBody } = require('./_lib/security');

const MAX_BYTES = 8192;

function pathOnly(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value, 'https://www.zyflow.eu');
    return `${url.origin}${url.pathname}`;
  } catch {
    return '[invalid]';
  }
}

function hostOnly(value) {
  if (!value || typeof value !== 'string') return '';
  if (value === 'inline' || value === 'eval' || value === 'data' || value.startsWith('blob:')) {
    return value.split(':')[0];
  }
  try {
    return new URL(value, 'https://www.zyflow.eu').origin;
  } catch {
    return '[invalid]';
  }
}

function summarise(report) {
  if (!report || typeof report !== 'object') return null;
  const body = report['csp-report'] || report.body || report;
  if (!body || typeof body !== 'object') return null;
  return {
    directive: body['effective-directive'] || body.effectiveDirective || body['violated-directive'] || body.violatedDirective || '',
    blocked: hostOnly(body['blocked-uri'] || body.blockedURL || ''),
    document: pathOnly(body['document-uri'] || body.documentURL || ''),
    disposition: body.disposition || 'report',
  };
}

function collectReports(payload) {
  if (Array.isArray(payload)) return payload.map(summarise).filter(Boolean);
  const one = summarise(payload);
  return one ? [one] : [];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const limited = rateLimit('csp-report', req);
  if (!limited.ok) {
    res.status(204).end();
    return;
  }

  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (raw.length > MAX_BYTES) {
    res.status(204).end();
    return;
  }

  let payload = jsonBody(req);
  if (typeof req.body === 'string') {
    try {
      payload = JSON.parse(req.body);
    } catch {
      payload = {};
    }
  }

  const rows = collectReports(payload);
  if (rows.length) {
    console.info('csp-report', JSON.stringify(rows[0]));
  }

  res.status(204).end();
};
