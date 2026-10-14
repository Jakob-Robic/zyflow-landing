/**
 * Vercel Routing Middleware — anonymous server_pageview counter.
 *
 * Runs on HTML page requests only (see matcher). Capture is scheduled with
 * waitUntil so the static response is never delayed or rewritten. No cookies,
 * no client identifiers, no forwarded IP / UA / headers.
 */
import pageview from './api/_lib/server-pageview.js';

export const config = pageview.middlewareConfig;

export default function middleware(request, context) {
  pageview.handleMiddleware(request, context);
}
