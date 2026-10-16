/**
 * Tour detail hero map — embedded GPX route + stop pins.
 * MapLibre is self-hosted; Overpass enriches pins in the background (cached).
 */
(function () {
  const MAPLIBRE_CSS = "/assets/vendor/maplibre-gl/maplibre-gl.css";
  const MAPLIBRE_JS = "/assets/vendor/maplibre-gl/maplibre-gl.js";
  const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
  const STOP_COUNT = 12;
  const ROUTE_COLOR = "#e94b17";
  const STOPS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const STOPS_CACHE_PREFIX = "zyflow-tour-stops:v1:";

  let maplibrePromise = null;

  /** Last-resort style if OpenFreeMap is unreachable. */
  const FALLBACK_STYLE = {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#f0eee6" },
      },
    ],
  };

  function loadCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.maplibregl) {
        resolve();
        return;
      }
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureMapLibre() {
    if (!maplibrePromise) {
      loadCss(MAPLIBRE_CSS);
      maplibrePromise = loadScript(MAPLIBRE_JS);
    }
    return maplibrePromise;
  }

  function parseGpx(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("Invalid GPX");
    const pts = [...doc.querySelectorAll("trkpt, rtept")].map((el) => [
      parseFloat(el.getAttribute("lon")),
      parseFloat(el.getAttribute("lat")),
    ]);
    return pts.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  }

  function haversine(a, b) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function sampleAlong(coords, count) {
    if (coords.length <= count) return coords.slice();
    const seg = [];
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      const d = haversine(coords[i - 1], coords[i]);
      seg.push(d);
      total += d;
    }
    if (total <= 0) return coords.slice(0, count);
    const out = [];
    for (let i = 0; i < count; i++) {
      const target = (total * i) / (count - 1 || 1);
      let acc = 0;
      let picked = coords[coords.length - 1];
      for (let j = 0; j < seg.length; j++) {
        if (acc + seg[j] >= target) {
          const t = seg[j] === 0 ? 0 : (target - acc) / seg[j];
          const a = coords[j];
          const b = coords[j + 1];
          picked = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          break;
        }
        acc += seg[j];
      }
      out.push(picked);
    }
    return out;
  }

  function bboxOf(coords, pad = 0.02) {
    let minLon = Infinity;
    let minLat = Infinity;
    let maxLon = -Infinity;
    let maxLat = -Infinity;
    for (const [lon, lat] of coords) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
    const lonPad = Math.max((maxLon - minLon) * 0.12, pad);
    const latPad = Math.max((maxLat - minLat) * 0.12, pad);
    return [minLon - lonPad, minLat - latPad, maxLon + lonPad, maxLat + latPad];
  }

  function distToPolyline(point, line) {
    let best = Infinity;
    for (const c of line) {
      const d = haversine(point, c);
      if (d < best) best = d;
    }
    return best;
  }

  function readEmbeddedRoute(el) {
    const host = el.parentElement || el;
    const jsonEl = host.querySelector("[data-tour-route-json]");
    if (!jsonEl) return null;
    try {
      const data = JSON.parse(jsonEl.textContent || "null");
      if (!data || !Array.isArray(data.coords) || data.coords.length < 2) {
        return null;
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  function readStopsCache(slug) {
    if (!slug) return null;
    try {
      const raw = localStorage.getItem(STOPS_CACHE_PREFIX + slug);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.at || !Array.isArray(parsed.stops)) return null;
      if (Date.now() - parsed.at > STOPS_CACHE_TTL_MS) return null;
      return parsed.stops;
    } catch (_) {
      return null;
    }
  }

  function writeStopsCache(slug, stops) {
    if (!slug || !stops || !stops.length) return;
    try {
      localStorage.setItem(
        STOPS_CACHE_PREFIX + slug,
        JSON.stringify({ at: Date.now(), stops })
      );
    } catch (_) {
      /* quota / private mode */
    }
  }

  async function fetchNearbyStops(coords) {
    const [west, south, east, north] = bboxOf(coords, 0.015);
    const query = `
      [out:json][timeout:8];
      (
        node["amenity"~"cafe|restaurant|biergarten|fast_food|charging_station"](${south},${west},${north},${east});
        node["tourism"~"hotel|guest_house|apartment|camp_site|hostel"](${south},${west},${north},${east});
        node["shop"="bicycle"](${south},${west},${north},${east});
      );
      out body ${STOP_COUNT * 8};
    `;
    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];
    for (const url of endpoints) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 9000);
        const res = await fetch(url, {
          method: "POST",
          body: `data=${encodeURIComponent(query)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!res.ok) continue;
        const data = await res.json();
        const els = (data.elements || [])
          .filter((el) => el.type === "node" && el.lat != null && el.lon != null)
          .map((el) => {
            const pt = [el.lon, el.lat];
            return {
              id: el.id,
              coordinates: pt,
              name: (el.tags && (el.tags.name || el.tags["name:en"])) || "",
              kind:
                (el.tags &&
                  (el.tags.amenity || el.tags.tourism || el.tags.shop)) ||
                "stop",
              dist: distToPolyline(pt, coords),
            };
          })
          .filter((s) => s.dist < 3500)
          .sort((a, b) => a.dist - b.dist);

        const picked = [];
        for (const s of els) {
          if (picked.length >= STOP_COUNT) break;
          const tooClose = picked.some(
            (p) => haversine(p.coordinates, s.coordinates) < 400
          );
          if (!tooClose) picked.push(s);
        }
        if (picked.length >= 4) return picked.slice(0, STOP_COUNT);
      } catch (_) {
        /* try next */
      }
    }
    return null;
  }

  function fallbackStops(coords) {
    return sampleAlong(coords, STOP_COUNT).map((coordinates, i) => ({
      id: `sample-${i}`,
      coordinates,
      name: "",
      kind: i === 0 ? "start" : i === STOP_COUNT - 1 ? "end" : "stop",
      dist: 0,
    }));
  }

  function stopColor(kind) {
    if (
      kind === "cafe" ||
      kind === "restaurant" ||
      kind === "biergarten" ||
      kind === "fast_food"
    ) {
      return "#c45c26";
    }
    if (
      kind === "hotel" ||
      kind === "guest_house" ||
      kind === "apartment" ||
      kind === "hostel" ||
      kind === "camp_site"
    ) {
      return "#2f5d50";
    }
    if (kind === "charging_station") return "#1f6feb";
    if (kind === "bicycle") return "#5b4fcf";
    if (kind === "start") return "#1a1a1a";
    if (kind === "end") return ROUTE_COLOR;
    return ROUTE_COLOR;
  }

  function addStopMarkers(map, stops, markerBag) {
    for (const m of markerBag.splice(0, markerBag.length)) {
      m.remove();
    }
    for (const stop of stops) {
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "tour-hero__stop";
      pin.style.setProperty("--stop-color", stopColor(stop.kind));
      pin.title = stop.name || stop.kind;
      pin.setAttribute("aria-label", stop.name || "Stop on route");
      const marker = new maplibregl.Marker({ element: pin, anchor: "bottom" })
        .setLngLat(stop.coordinates)
        .addTo(map);
      markerBag.push(marker);
    }
  }


  function mountMap(el, coords, stops) {
    const map = new maplibregl.Map({
      container: el,
      style: STYLE_URL,
      attributionControl: { compact: true },
      interactive: true,
      cooperativeGestures: true,
      fadeDuration: 0,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    const markers = [];
    let routeReady = false;
    let usedFallback = false;

    function paintRoute() {
      try {
        if (!map.isStyleLoaded()) return;
        if (!map.getSource("route")) {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: coords },
            },
          });
          map.addLayer({
            id: "route-halo",
            type: "line",
            source: "route",
            paint: {
              "line-color": "#ffffff",
              "line-width": 8,
              "line-opacity": 0.9,
            },
            layout: { "line-cap": "round", "line-join": "round" },
          });
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            paint: {
              "line-color": ROUTE_COLOR,
              "line-width": 4,
              "line-opacity": 1,
            },
            layout: { "line-cap": "round", "line-join": "round" },
          });
        }
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 36, maxZoom: 13, duration: 0 });
        addStopMarkers(map, stops, markers);
        routeReady = true;
      } catch (err) {
        console.warn("[tour-map] paintRoute", err);
      }
    }

    map.on("load", paintRoute);
    map.on("style.load", paintRoute);

    // If OpenFreeMap never becomes ready, show route on a plain background.
    setTimeout(() => {
      if (routeReady || usedFallback) return;
      usedFallback = true;
      map.once("style.load", paintRoute);
      map.setStyle(FALLBACK_STYLE);
    }, 6000);

    // Resize only when the box actually changes — avoids infinite height loops.
    let lastW = 0;
    let lastH = 0;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0] && entries[0].contentRect;
      if (!cr) return;
      const w = Math.round(cr.width);
      const h = Math.round(cr.height);
      if (w === lastW && h === lastH) return;
      if (w < 2 || h < 2) return;
      lastW = w;
      lastH = h;
      map.resize();
    });
    ro.observe(el);

    return {
      map,
      setStops(next) {
        const apply = () => addStopMarkers(map, next, markers);
        if (routeReady || map.isStyleLoaded()) apply();
        else map.once("load", apply);
      },
    };
  }

  async function resolveCoords(el) {
    const embedded = readEmbeddedRoute(el);
    if (embedded) {
      const stops =
        Array.isArray(embedded.stops) && embedded.stops.length
          ? embedded.stops
          : fallbackStops(embedded.coords);
      return { coords: embedded.coords, stops };
    }

    const gpxUrl = el.getAttribute("data-gpx");
    if (!gpxUrl) throw new Error("No route data");
    const gpxRes = await fetch(gpxUrl);
    if (!gpxRes.ok) throw new Error(`GPX ${gpxRes.status}`);
    const coords = parseGpx(await gpxRes.text());
    if (coords.length < 2) throw new Error("Route too short");
    return { coords, stops: fallbackStops(coords) };
  }

  async function upgradeStops(slug, coords, mapApi) {
    const cached = readStopsCache(slug);
    if (cached && cached.length >= 4) {
      mapApi.setStops(cached);
      return;
    }
    const nearby = await fetchNearbyStops(coords);
    if (nearby && nearby.length) {
      writeStopsCache(slug, nearby);
      mapApi.setStops(nearby);
    }
  }

  async function initOne(el) {
    const slug = el.getAttribute("data-slug") || "";
    el.classList.add("is-loading");

    const maplibreReady = ensureMapLibre();

    try {
      const [{ coords, stops }] = await Promise.all([
        resolveCoords(el),
        maplibreReady,
      ]);

      el.innerHTML = "";
      el.classList.remove("is-loading");
      el.classList.add("is-ready");
      const mapApi = mountMap(el, coords, stops);
      upgradeStops(slug, coords, mapApi);
    } catch (err) {
      console.warn("[tour-map]", err);
      el.classList.remove("is-loading");
      el.classList.add("is-error");
      el.innerHTML =
        '<p class="tour-hero__map-fallback">Map unavailable. Open the route in Zyflow to explore.</p>';
    }
  }

  function boot() {
    ensureMapLibre();
    document.querySelectorAll("[data-tour-map]").forEach((el) => {
      void initOne(el);
    });
  }

  if (document.readyState === "loading") {
    ensureMapLibre();
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
