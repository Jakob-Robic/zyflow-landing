# MapLibre vendor bundle

- `maplibre-gl.js` / `.css` — MapLibre GL JS 4.7.1
- `liberty-style.json` — OpenFreeMap Liberty style with absolute URLs

Refresh style when OpenFreeMap rotates tile endpoints:

```
curl -fsSL https://tiles.openfreemap.org/styles/liberty -o /tmp/liberty.json
curl -fsSL https://tiles.openfreemap.org/planet -o /tmp/planet.json
# then re-run the normalize script from the tour-map speed work
```
