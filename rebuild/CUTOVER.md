# Rebuild cutover checklist

Foundation is ready under `rebuild/dist/`. Production still deploys the Framer tree via `npm run build` → `public/`. Do **not** flip production until this list is green.

## Before go-live

1. **Content & icons** — finish marketing copy, SL translations (replace EN scaffold in `rebuild/locales/sl.json`), and icon set.
2. **Indexable build** — run `SITE_INDEX=true npm run build:rebuild` so pages emit `index, follow` (styleguide / 404 stay noindex).
3. **Point hosting at rebuild dist**
   - Either set Vercel `buildCommand` to `npm run build:rebuild` and `outputDirectory` to `rebuild/dist`, **or**
   - Keep the preview project (`zyflow-rebuild-preview`) and swap DNS / production project when ready.
4. **Apply [`vercel.rebuild.json`](vercel.rebuild.json)** settings (clean URLs, security headers, cache for `/assets`, `/css`, `/js`). Merge into root `vercel.json` on cutover.
5. **Legacy redirects** (if old URLs must survive):
   - `/legal-pages/privacy-policy` → `/legal-privacy`
   - `/legal-pages/cookie-policy` → `/legal-cookies`
   - `/legal-pages/terms-conditions` → `/legal-terms`
   - `/faqs`, `/changelog`, `/waitlist` → chosen destinations
6. **Verify**
   - EN `/` and SL `/sl` render
   - Language switcher swaps correctly
   - Canonical + hreflang on a sample of pages
   - `/sitemap.xml` and `/robots.txt`
   - Unknown path returns branded `404.html` (and `/sl/...` → `sl/404.html`)
   - Favicon + OG image resolve
7. **Analytics** — fill the `<!-- analytics -->` slot in `rebuild/components/head.html`.

## Notes

- `scripts/prepare-public.js` excludes `rebuild/` so source/stubs never leak into production `public/`.
- Local preview: `npm run build:rebuild && npm run serve:rebuild` → http://localhost:8090
- Default builds stay `noindex` until `SITE_INDEX=true`.
