# Zyflow landing (Astro)

Static marketing site for [zyflow.eu](https://www.zyflow.eu).

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output: `dist/` (Vercel `outputDirectory`).

## Copy

- `locales/en.json` + `locales/sl.json` are the chrome/marketing copy source of truth.
- Store URLs: `src/lib/stores.ts`

## Blog

Content collection is ready at `src/content/blog/`. Add MDX/MD with frontmatter (`title`, `description`, `date`, `locale`, `draft`) and set `draft: false` to publish. Nav link is not shown until you add one.

## APIs

Vercel serverless routes in `api/` (`/api/contact`, `/api/waitlist`) — unchanged.
