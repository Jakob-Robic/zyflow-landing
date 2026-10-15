# Featured routes — staging

Drop municipality GPX / images / copy here before we import into Zyflow and wire the website.

## Layout

```
featured-routes/
  _inbox/                 ← dump anything unsorted here first
  by-municipality/        ← raw material, grouped by občina
    kranj|cerklje|sencur|trzic|naklo|preddvor|jezersko/
      _inbox/             ← municipality dump
      <route-slug>/       ← one folder per route (copy from _template)
  featured/               ← curated set that will go on the site / into the app
    route-01 … route-06/  ← rename to real slugs when filled
  _template/              ← copy this when adding a new route
  INDEX.md                ← checklist / status
```

## Per-route folder (required files)

| File | Purpose |
|------|---------|
| `meta.txt` | Name, stats, category, source URL, status |
| `route.gpx` | Track file |
| `cover.jpg` (or `.png` / `.webp`) | Hero / card image |
| `description.sl.md` | Slovenian story / blurb |
| `description.en.md` | English story / blurb (can draft later) |
| `gallery/` | Extra photos (optional) |

## Workflow

1. Drop raw downloads into `_inbox/` or `by-municipality/<občina>/_inbox/`.
2. For each keepable route: copy `_template` → `by-municipality/<občina>/<slug>/`, fill files.
3. Promote the best ones into `featured/` (copy or move), rename `route-0N` → slug.
4. Mark status in `INDEX.md`: `raw` → `ready` → `imported` → `on-site`.
5. Then we import GPX into the Zyflow platform and build tour pages.

## Google Drive mirror

Same tree lives in Drive (shareable / backup):

**[Zyflow – Featured Routes (staging)](https://drive.google.com/drive/folders/16k7dqZdTYpU_jnVA9TVr8AEkiOo_vvfA)**

Source overview (municipality links): [kolesarske GPX poti](https://docs.google.com/document/d/1TneajqWWsYODxSjAAC7z0Mc43KZtklpQlx38rBcqUV4/edit)

## Naming

Use lowercase kebab-case slugs, e.g. `kamnicanka`, `od-jezera-do-jezera`, `udin-borst-loop`.
