# AGENTS.md

## Cursor Cloud specific instructions

This is the **Zyflow landing/marketing site**: static HTML (Framer export) plus a Node/Cheerio
i18n build pipeline and Vercel serverless functions in `api/`. Dependencies are installed
automatically by the environment update script (`npm install`).

### Build / serve / checks

- Build: `npm run build` runs `scripts/build-locale.js` + `scripts/prepare-public.js`, which
  generates the localized pages and writes the deployable site to `public/`.
- There is **no dev-server script**. To preview locally, build first, then serve the output,
  e.g. `npx serve public` or `python3 -m http.server -d public 8080`.
- Secret-leak check: `npm run check:leaks`.

### Backend / forms

Static pages need no backend. The waitlist/contact **forms** post to the serverless functions
in `api/` (`waitlist.js`, `contact.js`, `brevo.js`), which require `SUPABASE_URL`,
`SUPABASE_SERVICE_KEY`, `BREVO_API_KEY`, and `NOTIFICATION_EMAIL`, and only run under
Vercel (`vercel dev` or a deployment) — plain static serving won't execute them. These
secrets are not present in this environment.
