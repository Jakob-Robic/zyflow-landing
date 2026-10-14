'use strict';

/**
 * Vercel Routing Middleware entry (Node.js via vercel.json proxy).
 * CommonJS so this static / CJS repo compiles without type:module.
 * Capture is fire-and-forget: never await, never return a Response.
 */
const { handleMiddleware, middlewareConfig } = require('./api/_lib/server-pageview');

function middleware(request, context) {
  handleMiddleware(request, context);
}

module.exports = middleware;
module.exports.config = middlewareConfig;
