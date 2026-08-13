// Functional and layout checks for the map UI, driven over CDP.
//
//   node scripts/verify.mjs [url]
//
// Prints one diagnostic JSON object, validates it against the invariants at the
// bottom of this file, and exits non-zero when any check fails. Companion to
// bench.mjs, which measures speed rather than correctness.
//
// The app keeps its MapLibre objects in a closure and must not grow debug
// globals just to be testable, so constructors are wrapped before any script
// runs and the real instances are captured from outside the page.
import { spawn } from "node:child_process";
import { accessSync, constants, statSync } from "node:fs";
import { rm } from "node:fs/promises";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

function executablePath(candidate) {
  if (!candidate) return null;
  const expanded = candidate.startsWith("~/") ? join(homedir(), candidate.slice(2)) : candidate;
  const paths = expanded.includes("/")
    ? [expanded]
    : (process.env.PATH || "").split(delimiter).filter(Boolean).map((dir) => join(dir, expanded));
  for (const path of paths) {
    try {
      accessSync(path, constants.X_OK);
      if (statSync(path).isFile()) return path;
    } catch {}
  }
  return null;
}

function findChrome() {
  const override = process.env.CHROME_BIN?.trim();
  if (override) {
    const resolved = executablePath(override);
    if (resolved) return resolved;
    throw new Error(`CHROME_BIN is not an executable file: ${override}`);
  }

  const platformCandidates = process.platform === "darwin"
    ? [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        join(homedir(), "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        join(homedir(), "Applications/Chromium.app/Contents/MacOS/Chromium"),
        "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
        "google-chrome", "chromium",
      ]
    : [
        "google-chrome-stable", "google-chrome", "chromium", "chromium-browser",
        "/usr/bin/google-chrome-stable", "/usr/bin/google-chrome",
        "/usr/bin/chromium", "/usr/bin/chromium-browser",
        "/usr/local/bin/google-chrome", "/usr/local/bin/chromium",
        "/opt/google/chrome/chrome", "/snap/bin/chromium",
      ];
  for (const candidate of platformCandidates) {
    const resolved = executablePath(candidate);
    if (resolved) return resolved;
  }
  throw new Error(
    `Chrome or Chromium was not found on ${process.platform}. ` +
    "Install it or set CHROME_BIN to its executable path.",
  );
}

const CHROME = findChrome();
const URL_ = process.argv[2] || "http://127.0.0.1:8731/web/index.html";
const FILE_URL = new URL("../web/index.html", import.meta.url).href;
const freshURL = (tag) => {
  const url = new URL(URL_);
  url.searchParams.set("verify", tag);
  return url.href;
};
const localeURL = (tag, languages, country) => {
  const url = new URL(freshURL(tag));
  if (languages) url.searchParams.set("verifyLanguages", languages.join(","));
  if (country) url.searchParams.set("verifyCountry", country);
  return url.href;
};
const PORT = 9300 + (process.pid % 300);
const PROFILE = `/tmp/ui-${process.pid}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DPR = 2;
const innerW = 1500, innerH = 900;   // must match setDeviceMetricsOverride below
// Chrome divides an injected wheel deltaY by the emulated device scale factor,
// so asking for -120 under dpr 2 makes the page see -60 -- half a real notch.
const NOTCH = 120 * DPR;

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`, "--window-size=1500,900", "--no-first-run",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
  "--disable-backgrounding-occluded-windows", "about:blank"], { stdio: "ignore" });
let chromeLaunchError;
chrome.once("error", (error) => { chromeLaunchError = error; });

let wsUrl;
for (let i = 0; i < 100; i++) {
  if (chromeLaunchError) break;
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const p = (await r.json()).filter((t) => t.type === "page");
    if (p[0]?.webSocketDebuggerUrl) { wsUrl = p[0].webSocketDebuggerUrl; break; }
  } catch {}
  await sleep(100);
}
if (!wsUrl) {
  chrome.kill();
  await rm(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
  throw new Error(chromeLaunchError
    ? `Could not launch Chrome at ${CHROME}: ${chromeLaunchError.message}`
    : `Chrome at ${CHROME} did not expose a debuggable page on port ${PORT}`);
}
const ws = new WebSocket(wsUrl);
await new Promise((r) => { ws.onopen = r; });
let id = 0; const pend = new Map();
const errors = [];
ws.onmessage = (m) => {
  const x = JSON.parse(m.data);
  if (x.id && pend.has(x.id)) { pend.get(x.id)(x.result); pend.delete(x.id); }
  if (x.method === "Runtime.exceptionThrown")
    errors.push(x.params.exceptionDetails?.exception?.description?.split("\n")[0] || "exception");
  if (x.method === "Runtime.consoleAPICalled" && x.params.type === "error")
    errors.push(x.params.args.map((a) => a.value || a.description).join(" "));
};
const send = (method, params = {}) =>
  new Promise((res) => { pend.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (e, aw = false) => {
  const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: aw });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "eval failed");
  return r.result.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  Object.defineProperty(window, 'maplibregl', {
    configurable: true,
    set: function (v) {
      window.__markers = [];
      v.Map = new Proxy(v.Map, { construct: function (Target, args, NewTarget) {
        var instance = Reflect.construct(Target, args, NewTarget);
        window.__map = instance;
        return instance;
      }});
      v.Marker = new Proxy(v.Marker, { construct: function (Target, args, NewTarget) {
        var instance = Reflect.construct(Target, args, NewTarget);
        window.__markers.push(instance);
        return instance;
      }});
      Object.defineProperty(window, 'maplibregl', {
        value: v, writable: true, configurable: true
      });
    },
    get: function () { return undefined; }
  });
  // Proves the page never asks for a location unprompted.
  window.__geoAsked = 0;
  if (navigator.geolocation) {
    var g = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = function () {
      window.__geoAsked++; return g.apply(null, arguments);
    };
  }
  // Locale/IP scenarios use the production resolver and fetch path while
  // keeping the suite deterministic and never sending the test request.
  var verifyParams = new URLSearchParams(location.search);
  if (verifyParams.has('verifyStorageFail')) {
    var unavailable = function () { throw new DOMException('Storage unavailable', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { configurable: true, get: unavailable });
    Object.defineProperty(window, 'sessionStorage', { configurable: true, get: unavailable });
  }
  var verifyLanguages = verifyParams.get('verifyLanguages');
  if (verifyLanguages) {
    var values = verifyLanguages.split(',');
    Object.defineProperty(navigator, 'languages', { configurable: true, get: () => values });
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => values[0] });
  }
  var verifyCountry = verifyParams.get('verifyCountry');
  if (verifyCountry) {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, options) {
      if (String(input) !== 'https://api.country.is/') return nativeFetch(input, options);
      options = options || {};
      window.__countryRequest = {
        url: String(input),
        method: options.method || 'GET',
        credentials: options.credentials,
        referrerPolicy: options.referrerPolicy,
        headers: options.headers || null,
        started: performance.now(),
        aborted: false,
        abortDelayMs: null
      };
      if (verifyCountry === 'FAIL') return Promise.reject(new TypeError('mock failure'));
      if (verifyCountry === 'HTTP_ERROR') {
        return Promise.resolve({ ok: false, json: function () {
          return Promise.resolve({ ip: '203.0.113.1', country: 'US' });
        }});
      }
      if (verifyCountry === 'BAD_JSON') {
        return Promise.resolve({ ok: true, json: function () {
          return Promise.reject(new SyntaxError('mock invalid JSON'));
        }});
      }
      if (verifyCountry === 'STALL') {
        return new Promise(function (_, reject) {
          var abort = function () {
            window.__countryRequest.aborted = true;
            window.__countryRequest.abortDelayMs =
              performance.now() - window.__countryRequest.started;
            reject(new DOMException('Aborted', 'AbortError'));
          };
          if (options.signal && options.signal.aborted) abort();
          else if (options.signal) options.signal.addEventListener('abort', abort, { once: true });
        });
      }
      var country = verifyCountry === 'MALFORMED' ? 'USA' : verifyCountry;
      return Promise.resolve({ ok: true, json: function () {
        return Promise.resolve({ ip: '203.0.113.1', country: country });
      }});
    };
  }
` });
await send("Emulation.setDeviceMetricsOverride",
  { width: innerW, height: innerH, deviceScaleFactor: DPR, mobile: false });

async function load(hash = "", base = URL_) {
  errors.length = 0;
  await send("Page.navigate", { url: base + hash });
  for (let i = 0; i < 200; i++) {
    if (await ev(`!!window.__map && __map.isStyleLoaded() &&
      document.querySelectorAll('.pin').length === ICONIC.site_count`)) break;
    await sleep(100);
  }
  await sleep(800);
}

const out = {};
const click = (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})||{click(){}}).click(), 1`);
const type = (s) => ev(`(() => { const q = document.getElementById('q');
  q.value = ${JSON.stringify(s)}; q.dispatchEvent(new Event('input', {bubbles:true})); return 1; })()`);
const frame2 = () => ev(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`, true);
const rows = `[...document.querySelectorAll('.item')].filter(e => !e.hidden)`;

// Where each pin IS drawn, against where it BELONGS.
//
// Every other geometry check in this file projects BOTH sides -- they ask
// __map.project() where a site should be and compare that against a card, never
// against the marker actually on screen. So a stylesheet rule that knocked 52 of
// 53 markers out of position, the worst by 1,248px, passed all 402 assertions
// without a murmur. This is the one check that looks at the rendered result.
//
// Paired through the Marker instances rather than by index: marker DOM order is
// badge order, not ICONIC.sites order, so zipping the two lists silently
// compares unrelated pairs and reports large offsets on a correct build.
// Markers are anchor:"center", so the element's centre is the projected point.
const markersPlaced = `(() => {
  let worst = 0, off = 0, checked = 0, example = null;
  __markers.forEach((m) => {
    const el = m.getElement();
    const r = el.getBoundingClientRect();
    if (!r.width) return;                       // filtered off the map
    const q = __map.project(m.getLngLat());
    const d = Math.hypot(r.left + r.width / 2 - q.x, r.top + r.height / 2 - q.y);
    checked++;
    if (d > 2) { off++; if (!example || d > example.by) {
      example = { by: Math.round(d), drawnAt: [Math.round(r.left + r.width / 2),
        Math.round(r.top + r.height / 2)], belongsAt: [Math.round(q.x), Math.round(q.y)] }; } }
    if (d > worst) worst = d;
  });
  // Without this the check can pass VACUOUSLY. __markers accumulates every
  // Marker ever constructed, so a refactor that rebuilds them leaves a stale,
  // detached generation here -- every rect comes back zero-width, all of them
  // are skipped, and "0 misplaced" reads like a pass while nothing was looked
  // at. The count has to be asserted, not just the offsets.
  const live = __markers.filter(m => m.getElement().getBoundingClientRect().width > 0);
  return { markerPosition: live.length ? getComputedStyle(live[0].getElement()).position : 'NONE LIVE',
           coarsePointer: matchMedia('(pointer: coarse)').matches,
           checked: checked, allMarkersChecked: checked === ICONIC.site_count,
           misplacedOver2px: off,
           worstOffsetPx: Math.round(worst), worstExample: example };
})()`;

// --------------------------------------------------------- 1. load & shell --
await load();
out.consoleClean = errors.length === 0 ? true : errors.slice(0, 4);
out.mapIsFullBleed = await ev(`(() => {
  const m = document.getElementById('map').getBoundingClientRect();
  return m.width === innerWidth && m.height === innerHeight;
})()`);
out.cardsAreMapSiblings = await ev(`(() => {
  return ['panel','detail'].every(id => {
    const el = document.getElementById(id);
    return el && el.parentElement.id !== 'map' && !el.closest('.maplibregl-ctrl');
  });
})()`);
out.panelOnTheRight = await ev(`(() => {
  const p = document.getElementById('panel').getBoundingClientRect();
  return { right: Math.round(innerWidth - p.right), left: Math.round(p.left), w: Math.round(p.width) };
})()`);
out.detailHiddenAtRest = await ev(`document.getElementById('detail').hidden`);
out.rowsBuilt = await ev(`document.querySelectorAll('.item').length`);
out.markersOnMap = await ev(`document.querySelectorAll('.pin').length`);
out.footNote = await ev(`/total stalls, not live availability/.test(document.querySelector('.foot').textContent)`);
out.noLegend = await ev(`!document.querySelector('.legend')`);
out.zoomBtnShape = await ev(`(() => {
  const s = getComputedStyle(document.querySelector('.maplibregl-ctrl-zoom-in'));
  return s.width + '/' + s.height + ' r=' + s.borderTopLeftRadius;
})()`);
out.attributionPresent = await ev(`/OpenStreetMap/.test(document.body.textContent)`);
out.mapEngine = await ev(`({
  name: 'MapLibre GL JS', version: maplibregl.getVersion(),
  openFreeMapVectorSources: Object.values(__map.getStyle().sources)
    .filter(s => s.type === 'vector' && /tiles\\.openfreemap\\.org\\/planet/.test(s.url || '')).length,
  minZoom: __map.getMinZoom(), maxZoom: __map.getMaxZoom()
})`);
out.programmaticZoomBounds = await ev(`(() => {
  const start = {center: __map.getCenter().toArray(), zoom: __map.getZoom(),
                 bearing: __map.getBearing()};
  const min = __map.getMinZoom(), max = __map.getMaxZoom();
  __map.jumpTo({zoom: min - 10}); const below = __map.getZoom();
  __map.jumpTo({zoom: max + 10}); const above = __map.getZoom();
  const zoomInDisabled = document.querySelector('.maplibregl-ctrl-zoom-in').disabled;
  __map.jumpTo(start);
  return {below, above, lowerClamped: Math.abs(below - min) < 1e-6,
          upperClamped: Math.abs(above - max) < 1e-6, zoomInDisabled};
})()`);
out.buildings3D = await ev(`(() => {
  const layer = __map.getLayer('iconic-3d-buildings');
  const layers = __map.getStyle().layers;
  const light = __map.getLight();
  const layerIndex = layers.findIndex(x => x.id === layer.id);
  const styleLayer = layers[layerIndex];
  const flatBuildings = layers.filter(x => x.id !== layer.id && x.source === layer.source &&
    x['source-layer'] === 'building');
  const nextTextLabel = layers.slice(layerIndex + 1)
    .find(x => x.type === 'symbol' && x.layout && x.layout['text-field']);
  return {
    exists: !!layer,
    type: layer && layer.type,
    sourceLayer: layer && layer.sourceLayer,
    aboveBaseBuildings: flatBuildings.length > 0 && flatBuildings.every(x =>
      layers.findIndex(y => y.id === x.id) < layerIndex),
    nextTextLabel: nextTextLabel && nextTextLabel.id,
    belowRoadLabels: !!nextTextLabel && layerIndex < layers.findIndex(x => x.id === nextTextLabel.id),
    minZoom: styleLayer && styleLayer.minzoom,
    color: layer && __map.getPaintProperty(layer.id, 'fill-extrusion-color'),
    heightReveal: layer && __map.getPaintProperty(layer.id, 'fill-extrusion-height'),
    baseReveal: layer && __map.getPaintProperty(layer.id, 'fill-extrusion-base'),
    opacity: layer && __map.getPaintProperty(layer.id, 'fill-extrusion-opacity'),
    verticalGradient: layer && __map.getPaintProperty(layer.id, 'fill-extrusion-vertical-gradient'),
    globalLightAnchor: light.anchor,
    globalLightPosition: light.position,
    globalLightColor: light.color,
    globalLightIntensity: light.intensity,
    readyFlag: __map.getContainer().dataset.buildings3d
  };
})()`);
out.markerAlignment = await ev(`({
  count: __markers.length,
  pitch: __markers.every(m => m.getPitchAlignment() === 'viewport'),
  rotation: __markers.every(m => m.getRotationAlignment() === 'viewport')
})`);

// Exercise the shipped z15+ pipeline, including its pitch curve, building
// geometry and lighting contract, under the real z19 product ceiling.
out.altitudePitch = await ev(`(() => {
  const sample = (center) => {
    const cutoff = __map.calculateCameraOptionsFromCameraLngLatAltRotation(center, 1000, 0, 0).zoom;
    __map.jumpTo({center, zoom: cutoff - 0.01, bearing: 0}); const above = __map.getPitch();
    __map.jumpTo({center, zoom: cutoff + 0.5, bearing: 0}); const midway = __map.getPitch();
    __map.jumpTo({center, zoom: cutoff + 1, bearing: 0}); const close = __map.getPitch();
    __map.jumpTo({center, zoom: cutoff - 0.01, bearing: 0}); const backOut = __map.getPitch();
    return {cutoff: +cutoff.toFixed(3), above: +above.toFixed(2), midway: +midway.toFixed(2),
            close: +close.toFixed(2), backOut: +backOut.toFixed(2)};
  };
  return {equator: sample([0, 0]), highLatitude: sample([0, 65])};
})()`);

// Dense urban data proves the layer is not merely present in the style: it
// produces real rendered building features while the altitude rule is pitched.
await ev(`(() => {
  const center = [-73.9855,40.7484];
  const cutoff = __map.calculateCameraOptionsFromCameraLngLatAltRotation(center, 1000, 28, 0).zoom;
  __map.jumpTo({center, zoom: cutoff + 1, bearing:28});
  return 1;
})()`);
const urbanReady = await ev(`new Promise(resolve => {
  let checks = 0;
  const check = () => {
    const count = __map.queryRenderedFeatures(undefined,
      {layers:['iconic-3d-buildings']}).length;
    if (count > 0) return resolve(true);
    if (++checks >= 150) return resolve(false);
    setTimeout(check, 100);
  };
  requestAnimationFrame(() => requestAnimationFrame(check));
})`, true);
out.urban3D = {
  ready: urbanReady,
  renderedBuildings: await ev(`__map.queryRenderedFeatures(undefined,
    {layers:['iconic-3d-buildings']}).length`),
  pitch: await ev(`+__map.getPitch().toFixed(2)`),
  bearingBeforeCompass: await ev(`+__map.getBearing().toFixed(2)`)
};
await click(".maplibregl-ctrl-compass");
await sleep(1100);
Object.assign(out.urban3D, {
  bearingAfterCompass: await ev(`+__map.getBearing().toFixed(2)`),
  pitchAfterCompass: await ev(`+__map.getPitch().toFixed(2)`),
  consoleClean: errors.length === 0 ? true : errors.slice(0, 4)
});

await load("#Tesla%20Diner");
await click('.item[data-badge="Tesla Diner"]');
const selectionReady = await ev(`new Promise(resolve => {
  let checks = 0;
  const check = () => {
    const count = __map.queryRenderedFeatures(undefined,
      {layers:['iconic-3d-buildings']}).length;
    if (!__map.isMoving() && __map.getPitch() > 49.9 && count > 0) return resolve(true);
    if (++checks >= 150) return resolve(false);
    setTimeout(check, 100);
  };
  requestAnimationFrame(() => requestAnimationFrame(check));
})`, true);
out.selection3D = {
  ready: selectionReady,
  zoom: await ev(`+__map.getZoom().toFixed(3)`),
  pitch: await ev(`+__map.getPitch().toFixed(2)`),
  renderedBuildings: await ev(`__map.queryRenderedFeatures(undefined,
    {layers:['iconic-3d-buildings']}).length`)
};
await ev(`(() => {
  const s = ICONIC.sites.find(x => x.badge === 'Tesla Diner');
  const center = [s.longitude, s.latitude];
  const cutoff = __map.calculateCameraOptionsFromCameraLngLatAltRotation(center, 1000, 22, 0).zoom;
  __map.jumpTo({center, zoom:cutoff + 1, bearing:22}); return 1;
})()`);
await frame2();
out.pitchedMarker = await ev(`(() => {
  const under = (q) => ['panel','detail'].some(id => {
    const el = document.getElementById(id); if (!el || el.hidden) return false;
    const r = el.getBoundingClientRect();
    return q.x > r.left && q.x < r.right && q.y > r.top && q.y < r.bottom;
  });
  const s = ICONIC.sites.find(x => x.badge === 'Tesla Diner');
  const q = __map.project([s.longitude, s.latitude]);
  return {pitch:+__map.getPitch().toFixed(2), selected:document.querySelectorAll('.pin.is-selected').length,
          clearOfCards:!under(q), position:{x:Math.round(q.x),y:Math.round(q.y)}};
})()`);
// Rendered position under 50 degrees of pitch and a rotated camera. The check
// above projects both sides, like every other geometry check here, so it cannot
// see a marker that is drawn somewhere other than where it belongs -- and
// markers are pitchAlignment/rotationAlignment "viewport", which is a different
// path from the flat overview where markersPlaced otherwise runs.
out.pitchedMarker.placed = await ev(markersPlaced);
await ev(`__map.setBearing(40), 1`);
await frame2();
out.pitchedMarker.placedRotated = await ev(markersPlaced);
await ev(`__map.setBearing(0), 1`);
await frame2();

await click(".pin.is-selected");
await frame2();
Object.assign(out.pitchedMarker, {
  clickable: await ev(`!document.getElementById('detail').hidden &&
    document.getElementById('d-title').textContent === 'Tesla Diner'`)
});

// Restore the world view before exercising the product flows below.
await load();

// ------------------------------------------- 2. nothing framed under panel --
// Both cards overlay the map now, so "clear" means clear of whichever are
// actually on screen -- the panel on the right, the detail card on the left.
const behind = `(q) => {
  const hit = (el) => {
    if (!el || el.hidden) return false;
    const r = el.getBoundingClientRect();
    return q.x > r.left && q.x < r.right && q.y > r.top && q.y < r.bottom;
  };
  return hit(document.getElementById('panel')) || hit(document.getElementById('detail'));
}`;
const clearOfCards = `(() => {
  const under = ${behind};
  const pts = ICONIC.sites.map(s => __map.project([s.longitude, s.latitude]));
  const onScreen = pts.filter(q => q.x > -40 && q.x < innerWidth + 40 && q.y > -40 && q.y < innerHeight + 40);
  return { onScreen: onScreen.length, behindACard: onScreen.filter(under).length };
})()`;

const overviewState = `(() => {
  const p = document.getElementById('panel').getBoundingClientRect();
  const sheet = innerWidth <= 820 && innerHeight > 500;
  const raw = sheet
    ? {top:24, right:24, bottom:innerHeight - p.top + 24, left:24}
    : {top:24, right:innerWidth - p.left + 24, bottom:24, left:24};
  const limitX = innerWidth * 0.7, limitY = innerHeight * 0.7;
  const kx = raw.left + raw.right > limitX ? limitX / (raw.left + raw.right) : 1;
  const ky = raw.top + raw.bottom > limitY ? limitY / (raw.top + raw.bottom) : 1;
  const pad = {top:raw.top * ky, right:raw.right * kx,
               bottom:raw.bottom * ky, left:raw.left * kx};
  const pts = ICONIC.sites.map(s => __map.project([s.longitude, s.latitude]));
  const within = pts.filter(q =>
    q.x >= pad.left - 1 && q.x <= innerWidth - pad.right + 1 &&
    q.y >= pad.top - 1 && q.y <= innerHeight - pad.bottom + 1).length;
  return {zoom:__map.getZoom(), minZoom:__map.getMinZoom(), maxZoom:__map.getMaxZoom(),
          atFloor:Math.abs(__map.getZoom() - __map.getMinZoom()) < 1e-6,
          zoomOutDisabled:document.querySelector('.maplibregl-ctrl-zoom-out').disabled,
          sitesWithinPadding:within};
})()`;
out.initialFitClearOfCards = await ev(clearOfCards);
out.markersPlaced = await ev(markersPlaced);
out.initialOverview = await ev(overviewState);
// Same test the narrow run does, on the side the panel now occupies.
out.controlsReachable = await ev(`(() => {
  const under = ${behind};
  const mid = (el) => { const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r }; };
  const z = mid(document.querySelector('.maplibregl-ctrl-zoom-in'));
  const a = mid(document.querySelector('.maplibregl-ctrl-attrib'));
  const onScreen = (q) => q.r.width > 0 && q.r.right <= innerWidth && q.r.bottom <= innerHeight;
  return { zoom: !under(z) && onScreen(z), attribution: !under(a) && onScreen(a),
           corner: document.querySelector('.maplibregl-ctrl-zoom-in').closest('.maplibregl-ctrl-top-right, .maplibregl-ctrl-bottom-right').className };
})()`);

// ------------------------------------------------------------- 3. search ---
await type("yosemite"); await frame2();
out.search = {
  visibleRows: await ev(`${rows}.length`),
  markers: await ev(`document.querySelectorAll('.pin').length`),
  clearShown: await ev(`!document.getElementById('clear').hidden`),
  count: await ev(`document.getElementById('count').textContent`)
};
await type("moab"); await frame2();
out.searchMatchesSiteName = await ev(`${rows}.map(e => e.dataset.badge)`);
await type("flagship"); await frame2();
out.searchMatchesReasonText = await ev(`${rows}.length`);
await click("#clear"); await frame2();
out.clearRestores = {
  rows: await ev(`${rows}.length`),
  value: await ev(`document.getElementById('q').value`),
  clearHidden: await ev(`document.getElementById('clear').hidden`)
};
await type("zzzzzz"); await frame2();
out.noMatch = {
  emptyShown: await ev(`!document.querySelector('.empty').hidden`),
  rows: await ev(`${rows}.length`),
  markers: await ev(`document.querySelectorAll('.pin').length`)
};
await type(""); await frame2();

// -------------------------------------------------------------- 4. chips ---
// Additive: All is the resting state, the first tap narrows, further taps add.
const pressed = (r) =>
  ev(`document.querySelector('.chip[data-region="${r}"]').getAttribute('aria-pressed')`);
out.chips = {
  restingAllPressed: await ev(`document.querySelector('.chips .chip').getAttribute('aria-pressed')`),
  restingRegionsQuiet: await ev(
    `[...document.querySelectorAll('.chip[data-region]')].every(c => c.getAttribute('aria-pressed') === 'false')`)
};
await click('.chip[data-region="Europe"]'); await frame2();
out.chips.afterPickEurope = { rows: await ev(`${rows}.length`), europe: await pressed("Europe"),
  all: await ev(`document.querySelector('.chips .chip').getAttribute('aria-pressed')`) };
await click('.chip[data-region="Asia"]'); await frame2();
out.chips.plusAsia = { rows: await ev(`${rows}.length`), asia: await pressed("Asia") };
await click('.chip[data-region="Asia"]'); await frame2();
out.chips.minusAsia = { rows: await ev(`${rows}.length`) };
await click(".chips .chip"); await frame2();          // "All"
out.chips.afterAll = {
  rows: await ev(`${rows}.length`),
  all: await ev(`document.querySelector('.chips .chip').getAttribute('aria-pressed')`),
  regionsQuiet: await ev(
    `[...document.querySelectorAll('.chip[data-region]')].every(c => c.getAttribute('aria-pressed') === 'false')`)
};
// Ticking every region one by one must collapse back to All, not look filtered.
for (const r of ["North America", "Europe", "Asia", "Oceania"]) {
  await click(`.chip[data-region="${r}"]`); await frame2();
}
out.chips.allFourCollapsesToAll = {
  rows: await ev(`${rows}.length`),
  all: await ev(`document.querySelector('.chips .chip').getAttribute('aria-pressed')`)
};

// ------------------------------------------------- 5. detail from a row ----
await load();
await ev(`document.querySelector('.item[data-badge="Tesla Diner"]').click(), 1`);
await sleep(2300);
out.detailFromRow = {
  detailShown: await ev(`!document.getElementById('detail').hidden`),
  // The whole point of this round: the list must survive being selected from.
  listStillVisible: await ev(`!!document.getElementById('list').offsetParent`),
  listStillScrollable: await ev(`(() => { const l = document.getElementById('list');
    return l.scrollHeight > l.clientHeight; })()`),
  detailAtTopLeft: await ev(`(() => {
    const d = document.getElementById('detail').getBoundingClientRect();
    const p = document.getElementById('panel').getBoundingClientRect();
    return { left: Math.round(d.left), top: Math.round(d.top),
             clearOfPanel: d.right < p.left };
  })()`),
  title: await ev(`document.getElementById('d-title').textContent`),
  meta: await ev(`document.getElementById('d-meta').textContent`),
  stats: await ev(`[...document.querySelectorAll('#d-stats .stat')].map(e => e.textContent)`),
  facts: await ev(`[...document.querySelectorAll('#d-facts dt')].map(e => e.textContent)`),
  actions: await ev(`[...document.querySelectorAll('#d-actions .btn')].map(e => e.textContent.trim())`),
  primaryHref: await ev(`document.querySelector('#d-actions .btn.primary').getAttribute('href')`),
  teslaHref: await ev(`(document.querySelectorAll('#d-actions .btn')[1]||{}).href || null`),
  focusMovedToClose: await ev(`document.activeElement.id`),
  hash: await ev(`decodeURIComponent(location.hash)`),
  ariaCurrentRows: await ev(`document.querySelectorAll('.item[aria-current="true"]').length`),
  markerSelected: await ev(`document.querySelectorAll('.pin.is-selected').length`),
  noPopupAnywhere: await ev(`!document.querySelector('.maplibregl-popup')`),
  // Has to clear BOTH cards now, not just the panel.
  siteClearOfCards: await ev(`(() => {
    const under = ${behind};
    const d = document.getElementById('detail').getBoundingClientRect();
    const p = document.getElementById('panel').getBoundingClientRect();
    const marker = document.querySelector('.pin.is-selected');
    const r = marker && marker.getBoundingClientRect();
    const q = r && {x:r.left + r.width / 2, y:r.top + r.height / 2};
    const onScreen = !!q && r.width > 0 && q.x >= 0 && q.x <= innerWidth &&
      q.y >= 0 && q.y <= innerHeight;
    return { x: q ? Math.round(q.x) : null,
             gap: [Math.round(d.right), Math.round(p.left)],
             onScreen:onScreen, clear:onScreen && !under(q) };
  })()`)
};

await click("#dclose"); await frame2();
out.close = {
  listShown: await ev(`!!document.getElementById('list').offsetParent`),
  detailHidden: await ev(`document.getElementById('detail').hidden`),
  focusReturnedToRow: await ev(`document.activeElement.dataset ? document.activeElement.dataset.badge : null`),
  hashCleared: await ev(`location.hash === ''`),
  pinStaysSelected: await ev(`document.querySelectorAll('.pin.is-selected').length`)
};

// Escape closes it too.
await ev(`document.querySelector('.item[data-badge="Waikiki"]').click(), 1`);
await sleep(2300);
const escOpen = await ev(`!document.getElementById('detail').hidden`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await frame2();
out.escapeCloses = { wasOpen: escOpen, nowClosed: await ev(`document.getElementById('detail').hidden`) };

// ------------------------------------------------- 6. detail from a pin ----
await load();
await ev(`(() => { const els = [...document.querySelectorAll('.pin')];
  const t = els.find(e => (e.textContent||'').indexOf('80') >= 0) || els[0];
  t.dispatchEvent(new MouseEvent('click', {bubbles:true})); return 1; })()`);
await sleep(2300);
out.detailFromPin = {
  detailShown: await ev(`!document.getElementById('detail').hidden`),
  title: await ev(`document.getElementById('d-title').textContent`)
};

// ------------------------------------------- 7. deep link + multi-site -----
await load("#Great%20Barrier%20Reef");
out.deepLink = {
  detailShown: await ev(`!document.getElementById('detail').hidden`),
  title: await ev(`document.getElementById('d-title').textContent`),
  siteRows: await ev(`document.querySelectorAll('#d-sites .srow').length`),
  stats: await ev(`[...document.querySelectorAll('#d-stats .stat')].map(e => e.textContent)`),
  currentSite: await ev(`document.querySelector('#d-sites .srow[aria-current="true"] .snm').textContent`),
  factsPointAtIt: await ev(`document.querySelector('#d-facts dd').textContent`),
  allNineClearOfCards: await ev(`(() => {
    const under = ${behind};
    return ICONIC.sites.filter(s => s.badge === 'Great Barrier Reef')
      .every(s => !under(__map.project([s.longitude, s.latitude])));
  })()`)
};
await ev(`document.querySelectorAll('#d-sites .srow')[3].click(), 1`);
await sleep(1700);
out.deepLink.afterPickingSite4 = {
  current: await ev(`document.querySelector('#d-sites .srow[aria-current="true"] .snm').textContent`),
  factsFollowed: await ev(`document.querySelector('#d-facts dd').textContent`),
  clearOfCards: await ev(`(() => {
    const under = ${behind};
    const nm = document.querySelector('#d-sites .srow[aria-current="true"] .snm').textContent;
    const s = ICONIC.sites.find(x => x.name === nm);
    return !under(__map.project([s.longitude, s.latitude]));
  })()`)
};

// -------------------------------- 8. filtering the selection away ----------
await load("#Stonehenge");
out.filterAwaySelection = {
  detailWasOpen: await ev(`!document.getElementById('detail').hidden`)
};
// Narrow to Asia, which drops Stonehenge (Europe) out of the list entirely.
await click('.chip[data-region="Asia"]');
await frame2(); await frame2();
Object.assign(out.filterAwaySelection, {
  detailClosed: await ev(`document.getElementById('detail').hidden`),
  staleAriaCurrent: await ev(`document.querySelectorAll('.item[aria-current="true"]').length`),
  selectedMarkers: await ev(`document.querySelectorAll('.pin.is-selected').length`)
});

// ------------------------------------------------------ 9. wheel isolation -
await load();
out.minInputClamp = await (async () => {
  const z0 = await ev(`__map.getZoom()`);
  await click('.maplibregl-ctrl-zoom-out');
  const afterButton = await ev(`__map.getZoom()`);
  for (let i = 0; i < 4; i++) {
    await send("Input.dispatchMouseEvent",
      { type: "mouseWheel", x: 620, y: 500, deltaX: 0, deltaY: NOTCH, buttons: 0 });
    await sleep(60);
  }
  await sleep(500);
  const afterWheel = await ev(`__map.getZoom()`);
  return {start:z0, afterButton, afterWheel,
          buttonUnchanged:Math.abs(afterButton - z0) < 1e-6,
          wheelUnchanged:Math.abs(afterWheel - z0) < 1e-6,
          zoomOutDisabled:await ev(`document.querySelector('.maplibregl-ctrl-zoom-out').disabled`)};
})();
out.wheelOverPanel = await (async () => {
  const z0 = await ev(`__map.getZoom()`);
  await ev(`document.getElementById('list').scrollTop = 0, 1`);
  for (let i = 0; i < 4; i++) {
    await send("Input.dispatchMouseEvent",
      { type: "mouseWheel", x: innerW - 190, y: 520, deltaX: 0, deltaY: NOTCH, buttons: 0 });
    await sleep(60);
  }
  await sleep(800);
  return {
    listScrolled: (await ev(`document.getElementById('list').scrollTop`)) > 0,
    mapZoomUnchanged: (await ev(`__map.getZoom()`)) === z0
  };
})();
// The detail card is a second sibling overlay -- it must swallow the wheel too.
out.wheelOverDetail = await (async () => {
  await load("#Great%20Barrier%20Reef");
  const z0 = await ev(`__map.getZoom()`);
  for (let i = 0; i < 4; i++) {
    await send("Input.dispatchMouseEvent",
      { type: "mouseWheel", x: 190, y: 520, deltaX: 0, deltaY: NOTCH, buttons: 0 });
    await sleep(60);
  }
  await sleep(800);
  return {
    cardScrolled: (await ev(`document.querySelector('#detail .dbody').scrollTop`)) > 0,
    mapZoomUnchanged: (await ev(`__map.getZoom()`)) === z0
  };
})();
await load();
out.wheelOverMap = await (async () => {
  const z0 = await ev(`__map.getZoom()`);
  await ev(`(() => { window.__z = []; window.__on = true;
    (function t(){ if(!window.__on) return; window.__z.push(__map.getZoom());
      requestAnimationFrame(t); })(); return 1; })()`);
  for (let i = 0; i < 6; i++) {
    await send("Input.dispatchMouseEvent",
      { type: "mouseWheel", x: 620, y: 500, deltaX: 0, deltaY: -NOTCH, buttons: 0 });
    await sleep(55);
  }
  await sleep(1100);
  const s = await ev(`(() => { window.__on = false;
    return { distinct: new Set(window.__z).size, frames: window.__z.length }; })()`);
  const z1 = await ev(`__map.getZoom()`);
  return { gained: +(z1 - z0).toFixed(3), fractionalRest: Math.abs(z1 - Math.round(z1)) > 0.001,
           continuity: s };
})();

await ev(`__map.jumpTo({center:[0,0], zoom:__map.getMaxZoom(), bearing:0}), 1`);
await frame2();
out.maxInputClamp = await (async () => {
  const z0 = await ev(`__map.getZoom()`);
  const zoomInDisabled = await ev(`document.querySelector('.maplibregl-ctrl-zoom-in').disabled`);
  await click('.maplibregl-ctrl-zoom-in');
  const afterButton = await ev(`__map.getZoom()`);
  for (let i = 0; i < 4; i++) {
    await send("Input.dispatchMouseEvent",
      { type: "mouseWheel", x: 620, y: 450, deltaX: 0, deltaY: -NOTCH, buttons: 0 });
    await sleep(60);
  }
  await sleep(400);
  const afterWheel = await ev(`__map.getZoom()`);

  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 2 });
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [
    {x:570, y:450, radiusX:1, radiusY:1, force:1, id:1},
    {x:670, y:450, radiusX:1, radiusY:1, force:1, id:2}
  ]});
  for (let i = 1; i <= 5; i++) {
    await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [
      {x:570 - i * 8, y:450, radiusX:1, radiusY:1, force:1, id:1},
      {x:670 + i * 8, y:450, radiusX:1, radiusY:1, force:1, id:2}
    ]});
    await sleep(40);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(500);
  const afterTouch = await ev(`__map.getZoom()`);
  await send("Emulation.setTouchEmulationEnabled", { enabled: false });
  return {start:z0, afterButton, afterWheel, afterTouch, zoomInDisabled,
          buttonUnchanged:Math.abs(afterButton - z0) < 1e-6,
          wheelUnchanged:Math.abs(afterWheel - z0) < 1e-6,
          touchUnchanged:Math.abs(afterTouch - z0) < 1e-6};
})();

// ------------------------------------------------------------ 10. near me --
await load();
out.nearMe = { promptedOnLoad: await ev(`window.__geoAsked`) };
await send("Browser.grantPermissions",
  { origin: new URL(URL_).origin, permissions: ["geolocation"] });
await send("Emulation.setGeolocationOverride",
  { latitude: 51.1789, longitude: -1.8262, accuracy: 20 });     // Stonehenge
await click("#near");
await sleep(1600);
out.nearMe.granted = {
  asked: await ev(`window.__geoAsked`),
  pressed: await ev(`document.getElementById('near').getAttribute('aria-pressed')`),
  firstFour: await ev(`${rows}.slice(0,4).map(e => e.dataset.badge)`),
  firstDistance: await ev(`${rows}[0].querySelector('.dist').textContent`),
  distancesShown: await ev(`[...document.querySelectorAll('.dist')].filter(e => !e.hidden).length`),
  headersHidden: await ev(`[...document.querySelectorAll('.region-head')].every(e => e.hidden)`),
  ascending: await ev(`(() => {
    const v = ${rows}.map(e => parseFloat(e.querySelector('.dist').textContent.replace(/,/g,'')));
    return v.every((x,i) => i === 0 || x >= v[i-1]);
  })()`),
  rowCount: await ev(`${rows}.length`)
};
await type("niagara"); await frame2();
out.nearMe.searchStillWorksWhileSorted = await ev(`${rows}.map(e => e.dataset.badge)`);
await type(""); await frame2();
await ev(`document.querySelector('.item[data-badge="Stonehenge"]').click(), 1`);
await sleep(2300);
out.nearMe.detailShowsDistance =
  await ev(`[...document.querySelectorAll('#d-stats .stat')].map(e => e.textContent)`);
await click("#dclose"); await frame2();
await click("#near"); await frame2();
out.nearMe.toggledOff = {
  pressed: await ev(`document.getElementById('near').getAttribute('aria-pressed')`),
  firstBadge: await ev(`${rows}[0].dataset.badge`),
  headersBack: await ev(`[...document.querySelectorAll('.region-head')].some(e => !e.hidden)`),
  distancesHidden: await ev(`[...document.querySelectorAll('.dist')].every(e => e.hidden)`),
  rowCount: await ev(`${rows}.length`)
};

await load();
await send("Browser.setPermission",
  { origin: new URL(URL_).origin, permission: { name: "geolocation" }, setting: "denied" });
await click("#near");
await sleep(1600);
out.nearMe.denied = {
  msg: await ev(`document.getElementById('nearmsg').textContent.trim()`),
  msgShown: await ev(`!document.getElementById('nearmsg').hidden`),
  pressed: await ev(`document.getElementById('near').getAttribute('aria-pressed')`),
  buttonUsableAgain: await ev(`!document.getElementById('near').disabled`),
  labelRestored: await ev(`document.getElementById('nearlbl').textContent`),
  stillRegionOrder: await ev(`[...document.querySelectorAll('.region-head')].some(e => !e.hidden)`)
};
await send("Browser.setPermission",
  { origin: new URL(URL_).origin, permission: { name: "geolocation" }, setting: "prompt" });

// ---------------------------------------------------- 11. colour discipline -
// Deliberately run with a card OPEN and a row selected, so the two intentional
// saturated surfaces actually exist in the DOM to be judged. Checking the bare
// list view would pass trivially -- the blue button is not built until then.
await load("#Tesla%20Diner");
out.colourContext = {
  detailOpen: await ev(`!document.getElementById('detail').hidden`),
  primaryButton: await ev(`(() => {
    const b = document.querySelector('.btn.primary'); if (!b) return 'MISSING';
    const s = getComputedStyle(b);
    return { bg: s.backgroundColor, text: s.color };
  })()`)
};
out.achromaticPanel = await ev(`(() => {
  // Every colour actually painted inside the panel, so a stray saturated hue
  // cannot hide in a rule nobody reads.
  const chroma = (c) => {
    const m = c.match(/[\\d.]+/g); if (!m || m.length < 3) return null;
    if (m.length > 3 && parseFloat(m[3]) === 0) return null;           // transparent
    const [r,g,b] = m.slice(0,3).map(Number);
    return Math.max(r,g,b) - Math.min(r,g,b);
  };
  // The only two saturated surfaces the design allows, both as FILLS:
  //   .btn.primary   Tesla blue, the single reserved accent
  //   .item[aria-current] .ico   the pin's gold, echoing the selected marker
  const allowed = (el, prop) => prop === 'backgroundColor' &&
    (el.classList.contains('primary') ||
     (el.classList.contains('ico') && el.closest('[aria-current="true"]')));
  const bad = [];
  document.querySelectorAll('#panel, #panel *, #detail, #detail *').forEach(el => {
    const s = getComputedStyle(el);
    ['color','backgroundColor','borderTopColor','outlineColor'].forEach(p => {
      const ch = chroma(s[p]);
      if (ch !== null && ch > 24 && !allowed(el, p))
        bad.push((el.className||el.id) + ' ' + p + '=' + s[p]);
    });
  });
  return [...new Set(bad)];
})()`);
out.blueUsage = await ev(`(() => {
  // The accent may be a fill or a ring, never coloured text.
  const hits = [];
  document.querySelectorAll('#panel, #panel *, #detail, #detail *').forEach(el => {
    const s = getComputedStyle(el);
    if (/62, 106, 225|91, 130, 240/.test(s.color)) hits.push('TEXT ' + (el.className||el.id));
  });
  return hits;
})()`);

// -------------------------------------------------------- 12. narrow view --
await send("Emulation.setDeviceMetricsOverride",
  { width: 430, height: 900, deviceScaleFactor: 2, mobile: true });
await load("#Waikiki");
out.narrow = {
  panelIsBottomSheet: await ev(`(() => {
    const p = document.getElementById('panel').getBoundingClientRect();
    return { bottomAnchored: Math.abs(innerHeight - p.bottom) < 20,
             spansWidth: p.width > innerWidth * 0.9,
             maxHeightOk: p.height <= innerHeight * 0.7 };
  })()`),
  // The card overlays the sheet in the same footprint rather than adding a
  // second one and squeezing the map.
  detailOverlaysSheet: await ev(`(() => {
    const d = document.getElementById('detail').getBoundingClientRect();
    const p = document.getElementById('panel').getBoundingClientRect();
    return { open: !document.getElementById('detail').hidden,
             sameFootprint: Math.abs(d.left - p.left) < 2 && Math.abs(d.bottom - p.bottom) < 2,
             onTop: getComputedStyle(document.getElementById('detail')).zIndex >
                    getComputedStyle(document.getElementById('panel')).zIndex };
  })()`),
  siteAboveSheet: await ev(`(() => {
    const under = ${behind};
    const s = ICONIC.sites.find(x => x.badge === 'Waikiki');
    const q = __map.project([s.longitude, s.latitude]);
    const d = document.getElementById('detail').getBoundingClientRect();
    return { y: Math.round(q.y), cardTop: Math.round(d.top), clear: !under(q) };
  })()`),
  consoleClean: errors.length === 0 ? true : errors.slice(0, 3)
};
// The pre-existing bug: on a phone the sheet covered the bottom-right corner
// where both of these live, so neither was reachable and the attribution --
// which is a licence requirement -- could not be seen at all.
await click("#dclose"); await frame2();
out.narrow.controlsReachable = await ev(`(() => {
  const under = ${behind};
  const mid = (el) => { const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r }; };
  const z = mid(document.querySelector('.maplibregl-ctrl-zoom-in'));
  const a = mid(document.querySelector('.maplibregl-ctrl-attrib'));
  const onScreen = (q) => q.r.width > 0 && q.r.top >= 0 && q.r.bottom <= innerHeight;
  return { zoom: !under(z) && onScreen(z), attribution: !under(a) && onScreen(a),
           corner: document.querySelector('.maplibregl-ctrl-zoom-in').closest('.maplibregl-ctrl-top-right, .maplibregl-ctrl-bottom-right').className };
})()`);

/* ------------------------------------------- 12b. the phone, specifically ---
   Every defect below exists only on a touch device, so the emulation has to be
   a real one: `mobile: true` alone does not make (pointer: coarse) match, and
   without that the hit-area and hover rules under test are never applied and
   the section passes vacuously. */
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

// A real finger. The sheet is driven by touch events and pointer capture, so a
// synthesised .click() would bypass most of what is being tested here.
async function touchDrag(sel, dy, steps, gapMs) {
  const p = await ev(`(() => {
    const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const at = (y) => [{ x: p.x, y, radiusX: 8, radiusY: 8, force: 1 }];
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(p.y) });
  for (let i = 1; i <= steps; i++) {
    await send("Input.dispatchTouchEvent",
      { type: "touchMove", touchPoints: at(p.y + (dy * i) / steps) });
    if (gapMs) await sleep(gapMs);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(620);
}
async function touchTap(x, y) {
  const at = [{ x, y, radiusX: 8, radiusY: 8, force: 1 }];
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at });
  await sleep(60);
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
// Geometry of a sheet at rest, plus the two things that must stay true of it at
// every detent: it stays welded to the bottom edge, and it never covers the
// control column.
const sheetGeom = (id) => `(() => {
  const el = document.getElementById('${id}');
  const r = el.getBoundingClientRect();
  const z = document.querySelector('.maplibregl-ctrl-zoom-in').getBoundingClientRect();
  const a = document.querySelector('.maplibregl-ctrl-attrib').getBoundingClientRect();
  return { h: Math.round(r.height), top: Math.round(r.top),
           bottomPinned: r.bottom >= innerHeight - 12 && r.bottom <= innerHeight,
           zoomClear: z.bottom <= r.top, attribClear: a.bottom <= r.top,
           expanded: document.getElementById('${id}-grab').getAttribute('aria-expanded') };
})()`;

await load();
out.touch = {
  // The check that matters most here, and the one this suite did not have: a
  // `.pin { position: relative }` added for the hit box below silently beat
  // MapLibre's `.maplibregl-marker { position: absolute }` -- same specificity,
  // later stylesheet -- and scattered every marker, on touch devices only.
  markersPlaced: await ev(markersPlaced),
  mediaApplies: await ev(`({ coarse: matchMedia('(pointer: coarse)').matches,
    hoverNone: matchMedia('(hover: none)').matches,
    dvhSupported: CSS.supports('height', '100dvh') })`),

  // iOS zooms the page in on any focused input under 16px, and does not zoom
  // back out. One value, and the difference between a working search field and
  // a permanently magnified app.
  searchFontPx: await ev(`parseFloat(getComputedStyle(document.getElementById('q')).fontSize)`),

  // 44px is the documented floor on both platforms. Two documented exceptions,
  // named rather than hidden behind a loose threshold:
  //   #clear   40, because it sits inside a 48px-tall field and 44 would clip
  //            its own focus ring
  //   attrib   MapLibre's own attribution links, which are 12px vendor text.
  //            Enlarging them means restyling the licence notice; they are
  //            reference links, not controls on the path to anything.
  //   .grab    drawn 28px tall but padded out to 44 by a pseudo-element, which
  //            an element rect cannot see. Measured properly below instead.
  tapTargetsUnder44: await ev(`(() => {
    const allowed = { clear: 40 };
    const bad = [];
    document.querySelectorAll('button, a, input, .chip, .srow, .item').forEach((e) => {
      if (e.hidden || e.offsetParent === null || e.classList.contains('pin')) return;
      if (e.classList.contains('grab')) return;
      if (e.closest('.maplibregl-ctrl-attrib')) return;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const min = Math.min(r.width, r.height);
      if (min < (allowed[e.id] || 44) - 0.5) {
        bad.push((e.id || e.className.split(' ')[0]) + ':' + Math.round(min));
      }
    });
    return bad;
  })()`),

  // Two hit boxes that are bigger than their elements, so a rect cannot measure
  // them: the 24px pin capsule and the 28px grabber, both padded out to ~44 by
  // a pseudo-element.
  //
  // elementsFromPoint, not elementFromPoint: the plural returns the whole stack
  // at that point, so a neighbour painted on top cannot report this element's
  // hit box as absent. At the world view all 53 markers overlap -- no pin has
  // 70px of clear space around it -- and the singular form was reading 4px on
  // one side and 12px on the others purely from who happened to be on top.
  hitBoxes: await ev(`(() => {
    const grew = (el) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const owns = (x, y) => [...document.elementsFromPoint(x, y)].some(e => e === el);
      const reach = (dx, dy) => { let d = 0;
        for (let i = 1; i <= 20; i++) {
          if (owns(cx + dx * (r.width / 2 + i), cy + dy * (r.height / 2 + i))) d = i; else break;
        } return d; };
      const up = reach(0, -1), down = reach(0, 1), left = reach(-1, 0), right = reach(1, 0);
      return { visual: [Math.round(r.width), Math.round(r.height)],
               up: up, down: down, left: left, right: right,
               effective: [Math.round(r.width) + left + right,
                           Math.round(r.height) + up + down] };
    };
    const cards = [document.getElementById('panel'), document.getElementById('detail')]
      .filter(e => !e.hidden).map(e => e.getBoundingClientRect().top);
    const ceiling = Math.min.apply(null, cards.concat([innerHeight]));
    const pin = [...document.querySelectorAll('.pin')].find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.left > 40 && r.right < innerWidth - 40 &&
             r.top > 60 && r.bottom < ceiling - 40;
    });
    return { pin: pin ? grew(pin) : 'no pin clear of the cards',
             grabber: grew(document.getElementById('panel-grab')) };
  })()`)
};

// The stuck-hover defect. A touchscreen applies :hover on tap and keeps it, so
// before the hover rules were gated behind (hover: hover) this left a pin's
// name label stranded over the map after every single tap.
const pinAt = await ev(`(() => {
  const ceiling = document.getElementById('panel').getBoundingClientRect().top;
  const p = [...document.querySelectorAll('.pin')].find((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.left > 40 && r.right < innerWidth - 40 &&
           r.top > 60 && r.bottom < ceiling - 40; });
  if (!p) return null;
  const r = p.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);
if (pinAt) {
  await touchTap(pinAt.x, pinAt.y);
  await sleep(1700);
  out.touch.afterPinTap = await ev(`(() => {
    const lit = [...document.querySelectorAll('.tip')]
      .filter(t => parseFloat(getComputedStyle(t).opacity) > 0.01).length;
    const d = document.getElementById('detail');
    const r = d.getBoundingClientRect();
    const a = document.querySelector('.btn.primary');
    return { detailOpened: !d.hidden, strandedTooltips: lit,
             // Opening at the middle detent is what leaves a strip of map to
             // frame the site into; a full-height card would leave none.
             mapStripAbove: Math.round(r.top),
             leavesUsableMap: r.top > innerHeight * 0.25,
             primaryActionOnScreen: !!a &&
               a.getBoundingClientRect().bottom <= innerHeight + 1 &&
               a.getBoundingClientRect().top >= 0 };
  })()`);
}

// Detents, driven through the grabber -- the same path a tap takes, and the one
// that has to work for anyone who cannot perform a drag.
await load();
out.sheetDetents = [];
for (let i = 0; i < 4; i++) {
  await ev(`document.getElementById('panel-grab').click()`);
  await sleep(620);
  out.sheetDetents.push(await ev(sheetGeom("panel")));
}

// The padding clamp. The tallest detent is the case that made the un-clamped
// ask reach 82% of the viewport, which is not a camera cameraForBounds can
// produce -- so the invariant asserted at EVERY detent is that the clamped
// padding fits and the camera stays finite.
//
// siteInVisibleBand is asserted only at the detent the card OPENS at. Dragging
// the card taller afterwards can cover the site, and that is correct: the map
// did not move, the card grew over it. Re-framing on a drag would haul the map
// around underneath someone who is reading, which is not what a sheet does.
await load("#Arches");
await sleep(1500);
out.sheetFraming = await (async () => {
  const seen = [];
  for (let i = 0; i < 3; i++) {
    seen.push(await ev(`(() => {
      const d = document.getElementById('detail').getBoundingClientRect();
      const s = ICONIC.sites.find(x => x.badge === 'Arches');
      const q = __map.project([s.longitude, s.latitude]);
      const raw = 24 + (innerHeight - d.top) + 24;
      const k = raw > innerHeight * 0.7 ? innerHeight * 0.7 / raw : 1;
      return { detent: document.getElementById('detail-grab').getAttribute('aria-expanded'),
               cardH: Math.round(d.height), rawPadPct: Math.round(raw / innerHeight * 100),
               clampedPadPct: Math.round(raw * k / innerHeight * 100),
               clampedFits: raw * k <= innerHeight * 0.7 + 0.5,
               cameraFinite: isFinite(__map.getZoom()) && isFinite(__map.getCenter().lat),
               siteInVisibleBand: q.y > 0 && q.y < d.top && q.x > 0 && q.x < innerWidth };
    })()`));
    await ev(`document.getElementById('detail-grab').click()`);
    await sleep(620);
  }
  return { asOpened: seen[0], afterDragging: seen.slice(1),
           clampHoldsEverywhere: seen.every((s) => s.clampedFits && s.cameraFinite),
           framedWhereItOpened: seen[0].siteInVisibleBand };
})();

// A throw downward dismisses the detail card. The list must survive the same
// throw: it is the primary surface, and there would be no gesture to bring it
// back.
await load("#Arches");
await sleep(1400);
await touchDrag("#detail-grab", 420, 4, 0);
out.flickDismiss = {
  detailGone: await ev(`document.getElementById('detail').hidden`),
  listSurvives: await ev(`document.getElementById('panel').getBoundingClientRect().height > 100`)
};
await touchDrag("#panel-grab", 800, 4, 0);
out.listNeverDismisses = await ev(`(() => {
  const r = document.getElementById('panel').getBoundingClientRect();
  return { stillOnScreen: r.height > 100, bottomPinned: r.bottom >= innerHeight - 12,
           searchReachable: (() => { const q = document.getElementById('q').getBoundingClientRect();
             return q.top >= 0 && q.bottom <= innerHeight; })() };
})()`);

// A slow drag places the sheet at the NEAREST detent; a throw goes to the next
// one along. Same distance, different outcome, which is the whole difference
// between flicking a sheet and nudging it.
await load();
await ev(`document.getElementById('panel-grab').click()`); await sleep(620);   // -> full
const beforeThrow = await ev(`Math.round(document.getElementById('panel').getBoundingClientRect().height)`);
await touchDrag("#panel-grab", 90, 3, 0);                                      // short, fast
const thrown = await ev(`Math.round(document.getElementById('panel').getBoundingClientRect().height)`);
await load();
await ev(`document.getElementById('panel-grab').click()`); await sleep(620);
await touchDrag("#panel-grab", 90, 14, 22);                                    // same, slow
const nudged = await ev(`Math.round(document.getElementById('panel').getBoundingClientRect().height)`);
out.throwVsNudge = { from: beforeThrow, thrown, nudged, differ: thrown !== nudged };

// Focusing the search is the one moment the list matters more than the map.
//
// Focus emulation is required, not optional: a headless page reports
// document.hasFocus() === false, so .focus() moves activeElement but fires no
// focus event at all. Without this the sheet never grows and the check passes
// or fails for a reason that has nothing to do with the app.
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await load();
out.keyboard = await (async () => {
  const before = await ev(`Math.round(document.getElementById('panel').getBoundingClientRect().height)`);
  await ev(`document.getElementById('q').focus()`);
  await sleep(620);
  const afterFocus = await ev(`Math.round(document.getElementById('panel').getBoundingClientRect().height)`);
  return {
    docHasFocus: await ev(`document.hasFocus()`),
    before, afterFocus, grew: afterFocus > before,
    // Nothing is covering the viewport in headless, so the inset must read zero
    // -- a non-zero resting value would shift the sheet on every desktop too.
    kbAtRest: await ev(`getComputedStyle(document.documentElement).getPropertyValue('--kb').trim()`)
  };
})();
await send("Emulation.setFocusEmulationEnabled", { enabled: false });

/* ------------------------------------------------- 12c. landscape phone -----
   <= 820px wide and 500px or shorter. This used to get the bottom sheet, which
   left a 115px strip of map and asked cameraForBounds for 333px of padding
   inside 375px of viewport. It docks to the right edge instead. */
await send("Emulation.setDeviceMetricsOverride",
  { width: 740, height: 390, deviceScaleFactor: 2, mobile: true });
await load("#Arches");
await sleep(1400);
out.landscapePhone = await ev(`(() => {
  const p = document.getElementById('panel').getBoundingClientRect();
  const d = document.getElementById('detail').getBoundingClientRect();
  const z = document.querySelector('.maplibregl-ctrl-zoom-in');
  const zr = z.getBoundingClientRect();
  const a = document.querySelector('.maplibregl-ctrl-attrib').getBoundingClientRect();
  const s = ICONIC.sites.find(x => x.badge === 'Arches');
  const q = __map.project([s.longitude, s.latitude]);
  const raw = 24 + (innerWidth - d.left) + 24;
  const k = raw > innerWidth * 0.7 ? innerWidth * 0.7 / raw : 1;
  return {
    mode: matchMedia('(max-width: 820px) and (max-height: 500px)').matches ? 'side' : 'NOT side',
    dockedRight: Math.abs(innerWidth - p.right) <= 12 && p.width <= 360,
    fullHeight: p.height >= innerHeight - 24,
    detailOverlays: Math.abs(d.right - p.right) < 2,
    corner: z.closest('.maplibregl-ctrl-top-left, .maplibregl-ctrl-top-right, .maplibregl-ctrl-bottom-right').className.trim(),
    controlsClearOfCard: zr.right < p.left && a.right < p.left,
    grabberHidden: getComputedStyle(document.getElementById('panel-grab')).display === 'none',
    rawPadPct: Math.round(raw / innerWidth * 100),
    clampedPadPct: Math.round(raw * k / innerWidth * 100),
    siteInVisibleBand: q.x > 0 && q.x < d.left && q.y > 0 && q.y < innerHeight,
    consoleClean: true
  };
})()`);
out.landscapePhone.consoleClean = errors.length === 0 ? true : errors.slice(0, 3);

await send("Emulation.setTouchEmulationEnabled", { enabled: false });
await send("Emulation.setDeviceMetricsOverride",
  { width: 430, height: 900, deviceScaleFactor: 2, mobile: true });

// A no-selection load exposes the responsive overview floor. Crossing the
// breakpoint while resting there must recompute and reframe it; crossing back
// while exploring must preserve the user's camera instead.
await load();
out.narrow.overviewFloor = await ev(overviewState);
const narrowFloorBeforeResize = out.narrow.overviewFloor.minZoom;
await send("Emulation.setDeviceMetricsOverride",
  { width: innerW, height: innerH, deviceScaleFactor: DPR, mobile: false });
await sleep(650);
out.resizeAtFloor = {
  narrowMinZoom: narrowFloorBeforeResize,
  desktop: await ev(overviewState)
};

await ev(`__map.jumpTo({center:[30,10], zoom:__map.getMinZoom() + 2, bearing:17}), 1`);
const exploringBeforeResize = await ev(`({center:__map.getCenter().toArray(),
  zoom:__map.getZoom(), bearing:__map.getBearing()})`);
await send("Emulation.setDeviceMetricsOverride",
  { width: 430, height: 900, deviceScaleFactor: 2, mobile: true });
await sleep(650);
const exploringAfterResize = await ev(`({center:__map.getCenter().toArray(),
  zoom:__map.getZoom(), bearing:__map.getBearing(), minZoom:__map.getMinZoom()})`);
out.resizeWhileZoomed = {
  before: exploringBeforeResize,
  after: exploringAfterResize,
  zoomPreserved: Math.abs(exploringAfterResize.zoom - exploringBeforeResize.zoom) < 1e-6,
  centerPreserved: exploringAfterResize.center.every((v, i) =>
    Math.abs(v - exploringBeforeResize.center[i]) < 1e-6),
  bearingPreserved: Math.abs(exploringAfterResize.bearing - exploringBeforeResize.bearing) < 1e-6
};

// A selected camera is still the user's camera. Crossing the responsive
// breakpoint updates the global floor and sheet geometry without re-running
// selection framing or changing the pitch reached by the 3D transition.
await send("Emulation.setDeviceMetricsOverride",
  { width: innerW, height: innerH, deviceScaleFactor: DPR, mobile: false });
await load("#Tesla%20Diner", freshURL("selected-resize"));
const selectedBeforeResize = await ev(`({center:__map.getCenter().toArray(),
  zoom:__map.getZoom(), bearing:__map.getBearing(), pitch:__map.getPitch(),
  minZoom:__map.getMinZoom()})`);
await send("Emulation.setDeviceMetricsOverride",
  { width: 430, height: 900, deviceScaleFactor: 2, mobile: true });
await sleep(650);
const selectedAfterResize = await ev(`({center:__map.getCenter().toArray(),
  zoom:__map.getZoom(), bearing:__map.getBearing(), pitch:__map.getPitch(),
  minZoom:__map.getMinZoom()})`);
out.resizeWithSelection = {
  before: selectedBeforeResize,
  after: selectedAfterResize,
  zoomPreserved: Math.abs(selectedAfterResize.zoom - selectedBeforeResize.zoom) < 1e-6,
  centerPreserved: selectedAfterResize.center.every((v, i) =>
    Math.abs(v - selectedBeforeResize.center[i]) < 1e-6),
  bearingPreserved: Math.abs(selectedAfterResize.bearing - selectedBeforeResize.bearing) < 1e-6,
  pitchPreserved: Math.abs(selectedAfterResize.pitch - selectedBeforeResize.pitch) < 1e-6,
  floorMatchesUnselected: Math.abs(selectedAfterResize.minZoom - narrowFloorBeforeResize) < 1e-6
};

// Recomputing while the list is filtered, detail is open and the underlying
// list sheet is away from its resting detent must still use the complete data
// set and resting list geometry.
await load("", freshURL("floor-independence"));
const independentFloorBefore = await ev(`__map.getMinZoom()`);
const restingPanelHeight = await ev(`document.getElementById('panel').getBoundingClientRect().height`);
await type("yosemite"); await frame2();
await click('.item[data-badge="Yosemite"]');
await click("#panel-grab");
await sleep(350);
await ev(`window.dispatchEvent(new Event('resize')), 1`);
await sleep(350);
out.overviewFloorIndependence = {
  before: independentFloorBefore,
  after: await ev(`__map.getMinZoom()`),
  floorPreserved: Math.abs((await ev(`__map.getMinZoom()`)) - independentFloorBefore) < 1e-6,
  filteredMarkers: await ev(`document.querySelectorAll('.pin').length`),
  detailOpen: await ev(`!document.getElementById('detail').hidden`),
  panelMovedFromRest: Math.abs((await ev(`document.getElementById('panel').getBoundingClientRect().height`)) -
    restingPanelHeight) > 1
};

// The one allowed disruption is a newly higher floor. Start just above the
// narrow floor, then return to desktop, whose overview needs a higher zoom.
await load("", freshURL("required-clamp"));
const beforeRequiredClamp = await ev(`(() => {
  __map.jumpTo({center:[0,0], zoom:__map.getMinZoom() + 0.1, bearing:11});
  return {zoom:__map.getZoom(), minZoom:__map.getMinZoom()};
})()`);
await send("Emulation.setDeviceMetricsOverride",
  { width: innerW, height: innerH, deviceScaleFactor: DPR, mobile: false });
await sleep(650);
const afterRequiredClamp = await ev(`({zoom:__map.getZoom(), minZoom:__map.getMinZoom()})`);
out.resizeRequiresClamp = {
  before: beforeRequiredClamp,
  after: afterRequiredClamp,
  floorRaised: afterRequiredClamp.minZoom > beforeRequiredClamp.zoom,
  clampedToFloor: Math.abs(afterRequiredClamp.zoom - afterRequiredClamp.minZoom) < 1e-6
};

// ------------------------------------------------------- 14. international --
// Keep this on the HTTP origin so local/session storage has normal origin
// semantics. The direct-file variant remains a separate check below.
await ev(`localStorage.setItem('iconic.locale.v1','en'); sessionStorage.clear()`);
await load("#Tesla%20Diner", freshURL("i18n-all"));
out.i18n = {};
out.i18n.allLocales = await ev(`(() => {
  const select = document.getElementById('language');
  return ICONIC_I18N.order.map(key => {
    select.value = key;
    select.dispatchEvent(new Event('change', {bubbles:true}));
    const catalog = ICONIC_I18N.locales[key];
    const field = __map.getLayoutProperty('place_city', 'text-field');
    const facts = [...document.querySelectorAll('#d-facts bdi')];
    return {
      key,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      selected: select.value,
      heading: document.getElementById('app-title').textContent === catalog.ui.heading,
      searchAria: document.getElementById('q').getAttribute('aria-label') === catalog.ui.searchAria,
      detailCopy: document.getElementById('d-why').textContent === catalog.badges['Tesla Diner'].why,
      controls: document.querySelector('.maplibregl-ctrl-zoom-in').getAttribute('aria-label') ===
        catalog.ui.zoomIn,
      mapLanguage: JSON.stringify(field).includes(catalog.mapNames[0]),
      shellDirection: getComputedStyle(document.getElementById('panel')).direction === catalog.dir,
      canonicalBidi: document.querySelector('.item bdi').dir === 'auto' &&
        facts.length >= 3 && facts[0].dir === 'auto' && facts[1].dir === 'auto' &&
        facts[2].dir === 'ltr',
      rows: document.querySelectorAll('.item').length,
      markers: document.querySelectorAll('.pin').length,
      canonicalHash: decodeURIComponent(location.hash.slice(1)) === 'Tesla Diner'
    };
  });
})()`);

// An in-place RTL switch is deliberately done with real controls and dirty UI
// state. Nothing here may reset just because every label changes.
await ev(`(() => {
  const q = document.getElementById('q');
  q.value='a'; q.dispatchEvent(new Event('input',{bubbles:true}));
  document.querySelector('.chip[data-region="North America"]').click();
  document.getElementById('list').scrollTop=120;
  document.querySelector('.dbody').scrollTop=40;
  document.getElementById('dclose').focus();
})()`);
await frame2();
const localeStateBefore = await ev(`({
  camera:{center:__map.getCenter().toArray(),zoom:__map.getZoom(),bearing:__map.getBearing(),pitch:__map.getPitch()},
  query:document.getElementById('q').value,
  listScroll:document.getElementById('list').scrollTop,
  detailScroll:document.querySelector('.dbody').scrollTop,
  hash:location.hash,
  href:document.querySelector('#d-actions .primary').href,
  selected:document.querySelectorAll('.pin.is-selected').length,
  near:document.getElementById('near').getAttribute('aria-pressed')
})`);
await ev(`(() => { const s=document.getElementById('language'); s.value='ar';
  s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
await frame2();
const localeStateAfter = await ev(`({
  camera:{center:__map.getCenter().toArray(),zoom:__map.getZoom(),bearing:__map.getBearing(),pitch:__map.getPitch()},
  query:document.getElementById('q').value,
  listScroll:document.getElementById('list').scrollTop,
  detailScroll:document.querySelector('.dbody').scrollTop,
  hash:location.hash,
  href:document.querySelector('#d-actions .primary').href,
  selected:document.querySelectorAll('.pin.is-selected').length,
  near:document.getElementById('near').getAttribute('aria-pressed'),
  focus:document.activeElement.id,
  lang:document.documentElement.lang,
  dir:document.documentElement.dir,
  panelLeft:Math.round(document.getElementById('panel').getBoundingClientRect().left),
  detailRight:Math.round(innerWidth-document.getElementById('detail').getBoundingClientRect().right)
})`);
out.i18n.inPlace = {
  before: localeStateBefore,
  after: localeStateAfter,
  cameraPreserved: JSON.stringify(localeStateAfter.camera) === JSON.stringify(localeStateBefore.camera),
  queryPreserved: localeStateAfter.query === localeStateBefore.query,
  listScrollPreserved: localeStateAfter.listScroll === localeStateBefore.listScroll,
  detailScrollPreserved: localeStateAfter.detailScroll === localeStateBefore.detailScroll,
  canonicalStatePreserved: localeStateAfter.hash === localeStateBefore.hash &&
    localeStateAfter.href === localeStateBefore.href && localeStateAfter.selected === localeStateBefore.selected,
  rtlMirrored: localeStateAfter.panelLeft === 16 && localeStateAfter.detailRight === 16,
  detailFocusPreserved: localeStateAfter.focus === 'dclose'
};

// A translated-only query can disappear from the rebuilt search index when
// the locale changes. The open detail is independent user state: changing the
// language must preserve it even though the corresponding result row and map
// marker are no longer part of the filtered result set.
await ev(`localStorage.setItem('iconic.locale.v1','fr'); sessionStorage.clear()`);
await load("", freshURL("i18n-translated-query-switch"));
await type("cheminées");
await click('.chip[data-region="North America"]');
await frame2();
const frenchTranslatedMatches = await ev(`
  [...document.querySelectorAll('.item')].filter(e => !e.hidden).map(e => e.dataset.badge)`);
await click('.item[data-badge="Bryce Canyon"]');
for (let i = 0; i < 30; i++) {
  if (await ev(`!__map.isMoving()`)) break;
  await sleep(100);
}
const translatedSwitchBefore = await ev(`({
  locale:__ICONIC_I18N__.locale,
  camera:{center:__map.getCenter().toArray(),zoom:__map.getZoom(),
    bearing:__map.getBearing(),pitch:__map.getPitch()},
  query:document.getElementById('q').value,
  filters:[...document.querySelectorAll('.chip')].map(e =>
    [e.dataset.region || 'all', e.getAttribute('aria-pressed')]),
  rowCurrent:document.querySelector('.item[data-badge="Bryce Canyon"]')
    .getAttribute('aria-current'),
  selectedPins:__markers.filter(m => m.getElement().classList.contains('is-selected')).length,
  detailOpen:!document.getElementById('detail').hidden,
  detailTitle:document.getElementById('d-title').textContent,
  hash:location.hash,
  focus:document.activeElement.id
})`);
await ev(`(() => { const s=document.getElementById('language'); s.value='ar';
  s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
await frame2();
const translatedSwitchAfter = await ev(`({
  locale:__ICONIC_I18N__.locale,
  dir:document.documentElement.dir,
  camera:{center:__map.getCenter().toArray(),zoom:__map.getZoom(),
    bearing:__map.getBearing(),pitch:__map.getPitch()},
  query:document.getElementById('q').value,
  filters:[...document.querySelectorAll('.chip')].map(e =>
    [e.dataset.region || 'all', e.getAttribute('aria-pressed')]),
  visible:[...document.querySelectorAll('.item')].filter(e => !e.hidden)
    .map(e => e.dataset.badge),
  rowHidden:document.querySelector('.item[data-badge="Bryce Canyon"]').hidden,
  rowCurrent:document.querySelector('.item[data-badge="Bryce Canyon"]')
    .getAttribute('aria-current'),
  selectedPins:__markers.filter(m => m.getElement().classList.contains('is-selected')).length,
  detailOpen:!document.getElementById('detail').hidden,
  detailTitle:document.getElementById('d-title').textContent,
  hash:location.hash,
  focus:document.activeElement.id
})`);
const sameTranslatedSwitchCamera = translatedSwitchAfter.camera.center.every((value, index) =>
  Math.abs(value - translatedSwitchBefore.camera.center[index]) < 1e-7) &&
  ["zoom", "bearing", "pitch"].every((key) =>
    Math.abs(translatedSwitchAfter.camera[key] - translatedSwitchBefore.camera[key]) < 1e-7);
await click("#dclose");
await frame2();
const translatedCloseAfter = await ev(`({
  focus:document.activeElement.id,
  detailHidden:document.getElementById('detail').hidden,
  rowHidden:document.querySelector('.item[data-badge="Bryce Canyon"]').hidden
})`);
out.i18n.translatedQuerySwitch = {
  frenchMatches: frenchTranslatedMatches,
  before: translatedSwitchBefore,
  after: translatedSwitchAfter,
  afterClose: translatedCloseAfter,
  queryPreserved: translatedSwitchAfter.query === translatedSwitchBefore.query,
  filterPreserved: JSON.stringify(translatedSwitchAfter.filters) ===
    JSON.stringify(translatedSwitchBefore.filters),
  cameraPreserved: sameTranslatedSwitchCamera,
  selectionPreserved: translatedSwitchAfter.rowCurrent === translatedSwitchBefore.rowCurrent &&
    translatedSwitchAfter.selectedPins === translatedSwitchBefore.selectedPins,
  detailPreserved: translatedSwitchAfter.detailOpen === translatedSwitchBefore.detailOpen &&
    translatedSwitchAfter.detailTitle === translatedSwitchBefore.detailTitle,
  hashPreserved: translatedSwitchAfter.hash === translatedSwitchBefore.hash,
  focusPreserved: translatedSwitchAfter.focus === translatedSwitchBefore.focus,
  oldTranslationHidden: translatedSwitchAfter.rowHidden && translatedSwitchAfter.visible.length === 0,
  closeFocusFallback: translatedCloseAfter.detailHidden && translatedCloseAfter.rowHidden &&
    translatedCloseAfter.focus === 'q'
};

// English source copy remains indexed alongside the active catalog. In an
// Arabic UI the canonical English country display name should still find
// exactly the badges whose source sites are in the United States.
await type("United States");
await frame2();
out.i18n.canonicalEnglishCountrySearch = await ev(`(() => {
  const visible = [...document.querySelectorAll('.item')].filter(e => !e.hidden)
    .map(e => e.dataset.badge).sort();
  const expected = [...new Set(ICONIC.sites.filter(s => s.country === 'USA')
    .map(s => s.badge))].sort();
  return {locale:__ICONIC_I18N__.locale, dir:document.documentElement.dir,
    query:document.getElementById('q').value, visible, expected,
    exact:JSON.stringify(visible) === JSON.stringify(expected)};
})()`);

// A user-selected locale wins across reloads. Returning to Automatic clears
// it without changing the canonical URL interface.
await load("", freshURL("i18n-saved"));
out.i18n.savedChoice = await ev(`({
  locale:__ICONIC_I18N__.locale,
  stored:localStorage.getItem('iconic.locale.v1'),
  selected:document.getElementById('language').value,
  urlHasLanguage:/[?&]lang=/.test(location.search)
})`);
await ev(`sessionStorage.setItem('iconic.country.v1', JSON.stringify({country:'CA',
  expires:Date.now()+3600000})); (() => { const s=document.getElementById('language');
  s.value='auto'; s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
out.i18n.automaticReset = await ev(`({
  locale:__ICONIC_I18N__.locale,
  stored:localStorage.getItem('iconic.locale.v1'),
  selected:document.getElementById('language').value,
  country:__ICONIC_I18N__.country
})`);

async function ipLocaleScenario(tag, languages, country, settle = 80) {
  await ev(`localStorage.removeItem('iconic.locale.v1'); sessionStorage.clear()`);
  await load("", localeURL(tag, languages, country));
  await sleep(settle);
  const result = await ev(`({
    locale:__ICONIC_I18N__.locale,
    country:__ICONIC_I18N__.country,
    miles:__ICONIC_I18N__.miles,
    request:window.__countryRequest || null,
    rows:document.querySelectorAll('.item').length,
    markers:document.querySelectorAll('.pin').length,
    styleLoaded:__map.isStyleLoaded(),
    lang:document.documentElement.lang,
    dir:document.documentElement.dir,
    storedCountry:sessionStorage.getItem('iconic.country.v1')
  })`);
  result.consoleClean = errors.length === 0 ? true : errors.slice(0, 4);
  return result;
}
out.i18n.ip = {
  usSpanish: await ipLocaleScenario('ip-us-es', ['es-MX','en-US'], 'US'),
  canadaFrench: await ipLocaleScenario('ip-ca-fr', ['fr-CA','en-CA'], 'CA'),
  hongKongCantonese: await ipLocaleScenario('ip-hk-yue', ['yue-HK','zh-HK','en-HK'], 'HK'),
  malformed: await ipLocaleScenario('ip-malformed', ['de-DE'], 'MALFORMED'),
  rejected: await ipLocaleScenario('ip-rejected', ['fr-FR'], 'FAIL'),
  httpError: await ipLocaleScenario('ip-http-error', ['ko-KR'], 'HTTP_ERROR'),
  badJson: await ipLocaleScenario('ip-bad-json', ['zh-TW'], 'BAD_JSON'),
  stalled: await ipLocaleScenario('ip-stalled', ['ja-JP'], 'STALL', 1700)
};

// Cache and explicit-choice cases are separate from provider outcomes: these
// prove that a valid cache or a saved language suppresses the request, while an
// expired or malformed cache is discarded and does not become trusted state.
await ev(`localStorage.removeItem('iconic.locale.v1');
  sessionStorage.setItem('iconic.country.v1', JSON.stringify({country:'CA',
    expires:Date.now()+3600000}))`);
await load("", localeURL('ip-valid-cache', ['fr-FR'], 'US'));
out.i18n.validCountryCache = await ev(`({locale:__ICONIC_I18N__.locale,
  country:__ICONIC_I18N__.country, miles:__ICONIC_I18N__.miles,
  request:window.__countryRequest || null,
  storedCountry:sessionStorage.getItem('iconic.country.v1')})`);

await ev(`localStorage.setItem('iconic.locale.v1','de'); sessionStorage.clear()`);
await load("", localeURL('ip-saved-suppresses', ['fr-FR'], 'US'));
out.i18n.savedChoiceSuppressesLookup = await ev(`({locale:__ICONIC_I18N__.locale,
  country:__ICONIC_I18N__.country, request:window.__countryRequest || null,
  stored:localStorage.getItem('iconic.locale.v1')})`);

await ev(`localStorage.removeItem('iconic.locale.v1');
  sessionStorage.setItem('iconic.country.v1', JSON.stringify({country:'CA',
    expires:Date.now()-1}))`);
await load("", localeURL('ip-expired-cache', ['fr-FR'], 'CA'));
out.i18n.expiredCountryCache = await ev(`({locale:__ICONIC_I18N__.locale,
  country:__ICONIC_I18N__.country, request:window.__countryRequest || null,
  storedCountry:sessionStorage.getItem('iconic.country.v1')})`);

await ev(`localStorage.removeItem('iconic.locale.v1');
  sessionStorage.setItem('iconic.country.v1','not-json')`);
await load("", localeURL('ip-malformed-cache', ['ja-JP'], 'FAIL'));
out.i18n.malformedCountryCache = await ev(`({locale:__ICONIC_I18N__.locale,
  country:__ICONIC_I18N__.country, request:window.__countryRequest || null,
  storedCountry:sessionStorage.getItem('iconic.country.v1')})`);

// Malformed persisted state is ignored and removed before first render.
await ev(`localStorage.setItem('iconic.locale.v1','not-a-locale');
  sessionStorage.setItem('iconic.country.v1', JSON.stringify({country:'US',expires:Date.now()+3600000}))`);
await load("", freshURL("i18n-malformed-storage"));
out.i18n.malformedSavedChoice = await ev(`({locale:__ICONIC_I18N__.locale,
  stored:localStorage.getItem('iconic.locale.v1'), rows:document.querySelectorAll('.item').length})`);

// Object-prototype property names are not catalog keys. This catches locale
// validation that accidentally trusts inherited properties instead of own
// entries, a particularly dangerous case because "__proto__" is otherwise a
// syntactically valid persisted string.
await ev(`localStorage.setItem('iconic.locale.v1','__proto__');
  sessionStorage.setItem('iconic.country.v1', JSON.stringify({country:'US',expires:Date.now()+3600000}))`);
await load("", freshURL("i18n-prototype-storage"));
out.i18n.prototypeSavedChoice = await ev(`({locale:__ICONIC_I18N__.locale,
  stored:localStorage.getItem('iconic.locale.v1'), rows:document.querySelectorAll('.item').length,
  markers:document.querySelectorAll('.pin').length, styleLoaded:__map.isStyleLoaded()})`);
out.i18n.prototypeSavedChoice.consoleClean = errors.length === 0 ? true : errors.slice(0, 4);

const storageFailureURL = new URL(localeURL('i18n-storage-fail', ['fr-FR'], 'FAIL'));
storageFailureURL.searchParams.set('verifyStorageFail', '1');
await load("", storageFailureURL.href);
out.i18n.storageUnavailable = await ev(`({locale:__ICONIC_I18N__.locale,
  rows:document.querySelectorAll('.item').length, markers:document.querySelectorAll('.pin').length})`);

// Hash navigation is also a selection-removal path. Verify both an explicitly
// cleared fragment and an unknown fragment after proving each case started
// with a real open selection, so the assertions cannot pass vacuously.
await load("#Tesla%20Diner", freshURL("hash-selection-invalidation"));
const hashSelectionState = `({
  hash:location.hash,
  detailOpen:!document.getElementById('detail').hidden,
  detailTitle:document.getElementById('d-title').textContent,
  ariaCurrent:document.querySelectorAll('.item[aria-current="true"]').length,
  selectedPins:__markers.filter(m => m.getElement().classList.contains('is-selected')).length
})`;
const selectedBeforeHashClear = await ev(hashSelectionState);
await ev(`location.hash=''`);
await frame2();
const afterHashClear = await ev(hashSelectionState);
await ev(`location.hash='#Arches'`);
await frame2();
const selectedBeforeInvalidHash = await ev(hashSelectionState);
await ev(`location.hash='#not-a-badge'`);
await frame2();
const afterInvalidHash = await ev(hashSelectionState);
out.i18n.hashSelectionInvalidation = {
  beforeClear: selectedBeforeHashClear,
  afterClear: afterHashClear,
  beforeInvalid: selectedBeforeInvalidHash,
  afterInvalid: afterInvalidHash,
  clearRemovedStaleState: !afterHashClear.detailOpen &&
    afterHashClear.ariaCurrent === 0 && afterHashClear.selectedPins === 0,
  invalidRemovedStaleState: !afterInvalidHash.detailOpen &&
    afterInvalidHash.ariaCurrent === 0 && afterInvalidHash.selectedPins === 0
};

// Locale changes can move the usable viewport even though the map container
// itself stays full-bleed. Verify the camera follows both a mirrored desktop
// panel and a mirrored landscape detail card using the rendered markers --
// canonical longitudes are not reliable once MapLibre wraps the world.
await send("Emulation.setDeviceMetricsOverride",
  { width: innerW, height: innerH, deviceScaleFactor: DPR, mobile: false });
await ev(`localStorage.setItem('iconic.locale.v1','en'); sessionStorage.clear()`);
await load("", freshURL("i18n-rtl-overview-reframe"));
await ev(`(() => { const s=document.getElementById('language'); s.value='he';
  s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
await frame2();
out.i18n.localeGeometry = {
  overview: await ev(`(() => {
    const panel = document.getElementById('panel').getBoundingClientRect();
    const points = [...document.querySelectorAll('.pin')].map((el) => {
      const r = el.getBoundingClientRect();
      return {x:r.left + r.width / 2, y:r.top + r.height / 2};
    });
    const onScreen = points.filter((q) => q.x >= 0 && q.x <= innerWidth &&
      q.y >= 0 && q.y <= innerHeight).length;
    const behindPanel = points.filter((q) => q.x >= panel.left && q.x <= panel.right &&
      q.y >= panel.top && q.y <= panel.bottom).length;
    return {lang:document.documentElement.lang, dir:document.documentElement.dir,
      markers:points.length, onScreen:onScreen, behindPanel:behindPanel,
      atFloor:Math.abs(__map.getZoom() - __map.getMinZoom()) < 1e-6};
  })()`)
};

await send("Emulation.setDeviceMetricsOverride",
  { width: 740, height: 390, deviceScaleFactor: 2, mobile: true });
await ev(`localStorage.setItem('iconic.locale.v1','en'); sessionStorage.clear()`);
await load("#Tesla%20Diner", freshURL("i18n-rtl-landscape-reframe"));
for (let i = 0; i < 30; i++) {
  if (await ev(`!__map.isMoving()`)) break;
  await sleep(100);
}
const landscapeLocaleBefore = await ev(`({zoom:__map.getZoom(), hash:location.hash,
  title:document.getElementById('d-title').textContent})`);
await ev(`(() => { const s=document.getElementById('language'); s.value='he';
  s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
await frame2();
out.i18n.localeGeometry.landscapeSelection = await ev(`(() => {
  const marker = document.querySelector('.pin.is-selected');
  const r = marker && marker.getBoundingClientRect();
  const detail = document.getElementById('detail').getBoundingClientRect();
  const q = r && {x:r.left + r.width / 2, y:r.top + r.height / 2};
  const onScreen = !!q && r.width > 0 && q.x >= 0 && q.x <= innerWidth &&
    q.y >= 0 && q.y <= innerHeight;
  const clear = onScreen && !(q.x >= detail.left && q.x <= detail.right &&
    q.y >= detail.top && q.y <= detail.bottom);
  return {lang:document.documentElement.lang, dir:document.documentElement.dir,
    onScreen:onScreen, clear:clear, zoom:__map.getZoom(), hash:location.hash,
    title:document.getElementById('d-title').textContent,
    selected:document.querySelectorAll('.pin.is-selected').length};
})()`);
out.i18n.localeGeometry.landscapeSelection.statePreserved =
  Math.abs(out.i18n.localeGeometry.landscapeSelection.zoom - landscapeLocaleBefore.zoom) < 1e-6 &&
  out.i18n.localeGeometry.landscapeSelection.hash === landscapeLocaleBefore.hash &&
  out.i18n.localeGeometry.landscapeSelection.title === landscapeLocaleBefore.title &&
  out.i18n.localeGeometry.landscapeSelection.selected === 1;

// A translated header can be taller than the one that established the current
// peek detent. The active sheet must be remeasured in place so its search field
// remains inside the card rather than being clipped by overflow:hidden.
await send("Emulation.setDeviceMetricsOverride",
  { width: 375, height: 667, deviceScaleFactor: 2, mobile: true });
await ev(`localStorage.setItem('iconic.locale.v1','en'); sessionStorage.clear()`);
await load("", freshURL("i18n-sheet-detent-relabel"));
await click("#panel-grab"); await sleep(350); // half -> full
await click("#panel-grab"); await sleep(350); // full -> peek
const sheetLocaleBefore = await ev(`document.getElementById('panel').getBoundingClientRect().height`);
await ev(`(() => { const s=document.getElementById('language'); s.value='ja';
  s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
await frame2();
out.i18n.localeGeometry.sheetDetent = await ev(`(() => {
  const panel = document.getElementById('panel').getBoundingClientRect();
  const search = document.querySelector('.search').getBoundingClientRect();
  return {lang:document.documentElement.lang, height:panel.height,
    grew:panel.height > ${sheetLocaleBefore} + 1,
    searchInside:search.top >= panel.top - 1 && search.bottom <= panel.bottom + 1,
    atPeek:document.getElementById('panel-grab').getAttribute('aria-expanded') === 'false'};
})()`);

// Exercise the RTL control/card mirroring at both responsive breakpoints. The
// desktop switch above verifies state preservation; these cases guard the CSS
// and control-corner contracts that exist only on phones.
await load("", freshURL("i18n-rtl-storage-reset"));
await ev(`localStorage.clear(); sessionStorage.clear()`);
const rtlResponsiveState = `(() => {
  const p = document.getElementById('panel').getBoundingClientRect();
  const d = document.getElementById('detail').getBoundingClientRect();
  const nav = document.querySelector('.maplibregl-ctrl-zoom-in');
  const attr = document.querySelector('.maplibregl-ctrl-attrib');
  const n = nav.getBoundingClientRect(), a = attr.getBoundingClientRect();
  const facts = [...document.querySelectorAll('#d-facts bdi')];
  return {lang:document.documentElement.lang, dir:document.documentElement.dir,
    panel:{left:Math.round(p.left),right:Math.round(innerWidth-p.right)},
    detail:{left:Math.round(d.left),right:Math.round(innerWidth-d.right)},
    sameFootprint:Math.abs(p.left-d.left)<2 && Math.abs(p.right-d.right)<2,
    navCorner:nav.closest('[class*="maplibregl-ctrl-top-"], [class*="maplibregl-ctrl-bottom-"]').className.trim(),
    attrCorner:attr.closest('[class*="maplibregl-ctrl-top-"], [class*="maplibregl-ctrl-bottom-"]').className.trim(),
    controlsAbove:n.bottom <= d.top && a.bottom <= d.top,
    controlsRight:n.left >= d.right && a.left >= d.right,
    canonicalBidi:facts.length >= 3 && facts[0].dir === 'auto' &&
      facts[1].dir === 'auto' && facts[2].dir === 'ltr'};
})()`;
await send("Emulation.setDeviceMetricsOverride",
  { width: 430, height: 900, deviceScaleFactor: 2, mobile: true });
await load("#Tesla%20Diner", localeURL("i18n-rtl-portrait", ["he-IL"], "FAIL"));
out.i18n.rtlResponsive = { portrait: await ev(rtlResponsiveState) };
await send("Emulation.setDeviceMetricsOverride",
  { width: 740, height: 390, deviceScaleFactor: 2, mobile: true });
await sleep(650);
out.i18n.rtlResponsive.landscape = await ev(rtlResponsiveState);

// The classic vendored build is intentional: this app promises that opening
// the HTML file directly still works, with only the basemap using the network.
await send("Emulation.setDeviceMetricsOverride",
  { width: innerW, height: innerH, deviceScaleFactor: DPR, mobile: false });
await load("", FILE_URL);
out.directFile = {
  protocol: await ev(`location.protocol`),
  styleLoaded: await ev(`__map.isStyleLoaded()`),
  rows: await ev(`document.querySelectorAll('.item').length`),
  markers: await ev(`document.querySelectorAll('.pin').length`),
  buildings3D: await ev(`!!__map.getLayer('iconic-3d-buildings')`),
  locales: await ev(`ICONIC_I18N.order.length`),
  locale: await ev(`__ICONIC_I18N__.locale`),
  rtlPluginStatus: await ev(`maplibregl.getRTLTextPluginStatus()`),
  errorHidden: await ev(`document.getElementById('map-error').hidden`),
  consoleClean: errors.length === 0 ? true : errors.slice(0, 4)
};
await ev(`(() => { const s=document.getElementById('language'); s.value='ar';
  s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
for (let i = 0; i < 40; i++) {
  if (await ev(`maplibregl.getRTLTextPluginStatus() === 'loaded'`)) break;
  await sleep(100);
}
out.directFile.rtl = await ev(`({
  lang:document.documentElement.lang,
  dir:document.documentElement.dir,
  status:maplibregl.getRTLTextPluginStatus(),
  stored:localStorage.getItem('iconic.locale.v1'),
  mapField:__map.getLayoutProperty('place_city','text-field')
})`);
await load("", FILE_URL);
out.directFile.savedOverrideReload = await ev(`({locale:__ICONIC_I18N__.locale,
  lang:document.documentElement.lang, dir:document.documentElement.dir,
  rows:document.querySelectorAll('.item').length, markers:document.querySelectorAll('.pin').length})`);
await ev(`localStorage.removeItem('iconic.locale.v1'); sessionStorage.clear()`);

// The primary README startup path is file://, so run Automatic there too. The
// provider is mocked exactly as it is for HTTP: this proves the production
// fetch, resolver and storage path without leaking the test runner's IP.
const directAutomaticURL = new URL(FILE_URL);
directAutomaticURL.searchParams.set("verify", "file-auto-country");
directAutomaticURL.searchParams.set("verifyLanguages", "fr-CA,en-CA");
directAutomaticURL.searchParams.set("verifyCountry", "CA");
await load("", directAutomaticURL.href);
out.directFile.automaticCountry = await ev(`({locale:__ICONIC_I18N__.locale,
  lang:document.documentElement.lang, country:__ICONIC_I18N__.country,
  miles:__ICONIC_I18N__.miles, request:window.__countryRequest || null,
  storedCountry:sessionStorage.getItem('iconic.country.v1'),
  rows:document.querySelectorAll('.item').length,
  markers:document.querySelectorAll('.pin').length})`);
out.directFile.automaticCountry.consoleClean = errors.length === 0 ? true : errors.slice(0, 4);
await ev(`localStorage.removeItem('iconic.locale.v1'); sessionStorage.clear()`);

// With the remote style unavailable, the map reports an accessible failure but
// the local charger UI remains navigable and can still open detail cards.
await send("Network.enable");
await send("Network.clearBrowserCache");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Network.emulateNetworkConditions", {
  offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0
});
errors.length = 0;
await send("Page.navigate", { url: FILE_URL });
for (let i = 0; i < 80; i++) {
  if (await ev(`document.querySelectorAll('.item').length === 40`)) break;
  await sleep(100);
}
await sleep(1200);
await click('.item[data-badge="Tesla Diner"]');
await frame2();
out.offlineFallback = {
  errorShown: await ev(`!document.getElementById('map-error').hidden`),
  errorText: await ev(`document.getElementById('map-error').textContent.replace(/\\s+/g,' ').trim()`),
  rows: await ev(`document.querySelectorAll('.item').length`),
  detailOpens: await ev(`!document.getElementById('detail').hidden`)
};
await send("Network.emulateNetworkConditions", {
  offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1
});
await send("Network.setCacheDisabled", { cacheDisabled: false });

// ----------------------------------------------------------- assertions -----
// Keep the rich object above for diagnosis, but make every product contract a
// real gate. A false value must never be left for a human to notice in CI logs.
const failures = [];
const brief = (value) => {
  let rendered;
  try { rendered = JSON.stringify(value); } catch { rendered = String(value); }
  if (rendered === undefined) rendered = String(value);
  return rendered.length > 180 ? rendered.slice(0, 177) + "..." : rendered;
};
const check = (condition, label, actual) => {
  if (!condition) failures.push(`${label} (got ${brief(actual)})`);
};
const valueAt = (path) => path.split(".").reduce((value, key) => value && value[key], out);
const requireTrue = (path) => check(valueAt(path) === true, `${path} must be true`, valueAt(path));
const requireEqual = (path, expected) =>
  check(valueAt(path) === expected, `${path} must equal ${brief(expected)}`, valueAt(path));
const requireEmpty = (path) => {
  const value = valueAt(path);
  check(Array.isArray(value) && value.length === 0, `${path} must be empty`, value);
};
const requireClean = (path) => requireTrue(path);
const requireMarkerPlacement = (value, label, coarse) => {
  check(value && value.markerPosition === "absolute", `${label}.markerPosition`, value);
  check(value && value.coarsePointer === coarse, `${label}.coarsePointer`, value);
  check(value && value.checked === out.markersOnMap, `${label}.checked`, value);
  check(value && value.allMarkersChecked === true, `${label}.allMarkersChecked`, value);
  check(value && value.misplacedOver2px === 0, `${label}.misplacedOver2px`, value);
  check(value && value.worstOffsetPx <= 2, `${label}.worstOffsetPx`, value);
  check(value && value.worstExample == null, `${label}.worstExample`, value);
};
const requireOverview = (value, label) => {
  check(value && value.atFloor === true, `${label}.atFloor`, value);
  check(value && value.zoomOutDisabled === true, `${label}.zoomOutDisabled`, value);
  check(value && value.sitesWithinPadding === out.markersOnMap,
    `${label}.sitesWithinPadding`, value);
  check(value && Number.isFinite(value.zoom) && Number.isFinite(value.minZoom),
    `${label} finite zooms`, value);
};
const parseCountryCache = (raw, label, expectedCountry, sixHours = false) => {
  let entry = null;
  try { entry = JSON.parse(raw); } catch {}
  check(entry && entry.country === expectedCountry, `${label}.country`, raw);
  check(entry && Number.isFinite(entry.expires) && entry.expires > Date.now(),
    `${label}.expires must be in the future`, raw);
  check(entry && JSON.stringify(Object.keys(entry).sort()) === '["country","expires"]',
    `${label} must retain only country and expiry`, raw);
  if (sixHours && entry) {
    const remaining = entry.expires - Date.now();
    check(remaining > 5.5 * 60 * 60 * 1000 && remaining <= 6 * 60 * 60 * 1000 + 60000,
      `${label} must use the six-hour TTL`, remaining);
  }
  return entry;
};
const requirePrivateRequest = (request, label) => {
  check(request && request.url === "https://api.country.is/", `${label}.url`, request);
  check(request && request.method === "GET", `${label}.method`, request);
  check(request && request.credentials === "omit", `${label}.credentials`, request);
  check(request && request.referrerPolicy === "no-referrer", `${label}.referrerPolicy`, request);
  check(request && request.headers == null, `${label}.headers`, request);
};

[
  "consoleClean", "mapIsFullBleed", "cardsAreMapSiblings", "detailHiddenAtRest",
  "footNote", "noLegend", "attributionPresent",
  "programmaticZoomBounds.lowerClamped", "programmaticZoomBounds.upperClamped",
  "programmaticZoomBounds.zoomInDisabled", "buildings3D.exists",
  "buildings3D.aboveBaseBuildings", "buildings3D.belowRoadLabels",
  "markerAlignment.pitch", "markerAlignment.rotation", "urban3D.ready",
  "urban3D.consoleClean", "selection3D.ready",
  "pitchedMarker.clearOfCards", "pitchedMarker.clickable",
  "initialOverview.atFloor", "initialOverview.zoomOutDisabled",
  "controlsReachable.zoom", "controlsReachable.attribution", "search.clearShown",
  "clearRestores.clearHidden", "noMatch.emptyShown", "chips.restingRegionsQuiet",
  "chips.afterAll.regionsQuiet", "detailFromRow.detailShown",
  "detailFromRow.listStillVisible", "detailFromRow.listStillScrollable",
  "detailFromRow.detailAtTopLeft.clearOfPanel", "detailFromRow.noPopupAnywhere",
  "detailFromRow.siteClearOfCards.onScreen", "detailFromRow.siteClearOfCards.clear",
  "close.listShown", "close.detailHidden",
  "close.hashCleared", "escapeCloses.wasOpen", "escapeCloses.nowClosed",
  "detailFromPin.detailShown", "deepLink.detailShown", "deepLink.allNineClearOfCards",
  "deepLink.afterPickingSite4.clearOfCards", "filterAwaySelection.detailWasOpen",
  "filterAwaySelection.detailClosed", "minInputClamp.buttonUnchanged",
  "minInputClamp.wheelUnchanged", "minInputClamp.zoomOutDisabled",
  "wheelOverPanel.listScrolled", "wheelOverPanel.mapZoomUnchanged",
  "wheelOverDetail.cardScrolled", "wheelOverDetail.mapZoomUnchanged",
  "wheelOverMap.fractionalRest", "maxInputClamp.zoomInDisabled",
  "maxInputClamp.buttonUnchanged", "maxInputClamp.wheelUnchanged",
  "maxInputClamp.touchUnchanged", "nearMe.granted.headersHidden",
  "nearMe.granted.ascending", "nearMe.toggledOff.headersBack",
  "nearMe.toggledOff.distancesHidden", "nearMe.denied.msgShown",
  "nearMe.denied.buttonUsableAgain", "nearMe.denied.stillRegionOrder",
  "colourContext.detailOpen", "narrow.panelIsBottomSheet.bottomAnchored",
  "narrow.panelIsBottomSheet.spansWidth", "narrow.panelIsBottomSheet.maxHeightOk",
  "narrow.detailOverlaysSheet.open", "narrow.detailOverlaysSheet.sameFootprint",
  "narrow.detailOverlaysSheet.onTop", "narrow.siteAboveSheet.clear",
  "narrow.consoleClean", "narrow.controlsReachable.zoom",
  "narrow.controlsReachable.attribution", "touch.mediaApplies.coarse",
  "touch.mediaApplies.hoverNone", "touch.mediaApplies.dvhSupported",
  "touch.afterPinTap.detailOpened", "touch.afterPinTap.leavesUsableMap",
  "touch.afterPinTap.primaryActionOnScreen", "sheetFraming.clampHoldsEverywhere",
  "sheetFraming.framedWhereItOpened", "flickDismiss.detailGone",
  "flickDismiss.listSurvives", "listNeverDismisses.stillOnScreen",
  "listNeverDismisses.bottomPinned", "listNeverDismisses.searchReachable",
  "throwVsNudge.differ", "keyboard.docHasFocus", "keyboard.grew",
  "landscapePhone.dockedRight", "landscapePhone.fullHeight",
  "landscapePhone.detailOverlays", "landscapePhone.controlsClearOfCard",
  "landscapePhone.grabberHidden", "landscapePhone.siteInVisibleBand",
  "landscapePhone.consoleClean", "resizeWhileZoomed.zoomPreserved",
  "resizeWhileZoomed.centerPreserved", "resizeWhileZoomed.bearingPreserved",
  "resizeWithSelection.zoomPreserved", "resizeWithSelection.centerPreserved",
  "resizeWithSelection.bearingPreserved", "resizeWithSelection.pitchPreserved",
  "resizeWithSelection.floorMatchesUnselected", "overviewFloorIndependence.floorPreserved",
  "overviewFloorIndependence.detailOpen", "overviewFloorIndependence.panelMovedFromRest",
  "resizeRequiresClamp.floorRaised", "resizeRequiresClamp.clampedToFloor",
  "i18n.inPlace.cameraPreserved", "i18n.inPlace.queryPreserved",
  "i18n.inPlace.listScrollPreserved", "i18n.inPlace.detailScrollPreserved",
  "i18n.inPlace.canonicalStatePreserved", "i18n.inPlace.rtlMirrored",
  "i18n.inPlace.detailFocusPreserved",
  "i18n.translatedQuerySwitch.queryPreserved",
  "i18n.translatedQuerySwitch.filterPreserved",
  "i18n.translatedQuerySwitch.cameraPreserved",
  "i18n.translatedQuerySwitch.selectionPreserved",
  "i18n.translatedQuerySwitch.detailPreserved",
  "i18n.translatedQuerySwitch.hashPreserved",
  "i18n.translatedQuerySwitch.focusPreserved",
  "i18n.translatedQuerySwitch.oldTranslationHidden",
  "i18n.translatedQuerySwitch.closeFocusFallback",
  "i18n.canonicalEnglishCountrySearch.exact",
  "i18n.prototypeSavedChoice.styleLoaded",
  "i18n.prototypeSavedChoice.consoleClean",
  "i18n.hashSelectionInvalidation.clearRemovedStaleState",
  "i18n.hashSelectionInvalidation.invalidRemovedStaleState",
  "i18n.localeGeometry.overview.atFloor",
  "i18n.localeGeometry.landscapeSelection.onScreen",
  "i18n.localeGeometry.landscapeSelection.clear",
  "i18n.localeGeometry.landscapeSelection.statePreserved",
  "i18n.localeGeometry.sheetDetent.grew",
  "i18n.localeGeometry.sheetDetent.searchInside",
  "i18n.localeGeometry.sheetDetent.atPeek",
  "directFile.styleLoaded",
  "directFile.buildings3D", "directFile.errorHidden", "directFile.consoleClean",
  "offlineFallback.errorShown", "offlineFallback.detailOpens"
].forEach(requireTrue);

requireEqual("panelOnTheRight.right", 16);
requireEqual("panelOnTheRight.w", 372);
requireEqual("rowsBuilt", 40);
requireEqual("markersOnMap", 53);
requireEqual("zoomBtnShape", "40px/40px r=50%");
requireEqual("mapEngine.name", "MapLibre GL JS");
requireEqual("mapEngine.version", "5.24.0");
requireEqual("mapEngine.openFreeMapVectorSources", 1);
requireEqual("mapEngine.maxZoom", 19);
requireEqual("buildings3D.type", "fill-extrusion");
requireEqual("buildings3D.sourceLayer", "building");
requireEqual("buildings3D.nextTextLabel", "highway_name_other");
requireEqual("buildings3D.minZoom", 15);
requireEqual("buildings3D.color", "#787876");
requireEqual("buildings3D.opacity", 1);
requireEqual("buildings3D.verticalGradient", false);
requireEqual("buildings3D.globalLightAnchor", "viewport");
check(JSON.stringify(out.buildings3D.globalLightPosition) === '[1.15,210,30]',
  "buildings3D.globalLightPosition must equal [1.15,210,30]",
  out.buildings3D.globalLightPosition);
requireEqual("buildings3D.globalLightColor", "#ffffff");
requireEqual("buildings3D.globalLightIntensity", 0.08);
requireEqual("buildings3D.readyFlag", "ready");
check(JSON.stringify(out.buildings3D.heightReveal).includes("render_height"),
  "buildings3D.heightReveal must use render_height", out.buildings3D.heightReveal);
check(JSON.stringify(out.buildings3D.baseReveal).includes("render_min_height"),
  "buildings3D.baseReveal must use render_min_height", out.buildings3D.baseReveal);
requireEqual("markerAlignment.count", 53);
Object.entries(out.altitudePitch).forEach(([name, sample]) => {
  check(sample.above === 0 && Math.abs(sample.midway - 25) < 0.1 &&
    Math.abs(sample.close - 50) < 0.1 && sample.backOut === 0,
    `altitudePitch.${name} must exercise the 0/25/50/0 curve`, sample);
});
check(out.urban3D.renderedBuildings > 0,
  "urban3D.renderedBuildings must be positive", out.urban3D.renderedBuildings);
check(Math.abs(out.urban3D.pitch - 50) < 0.1, "urban3D.pitch", out.urban3D.pitch);
check(Math.abs(out.urban3D.bearingBeforeCompass - 28) < 0.1,
  "urban3D.bearingBeforeCompass", out.urban3D.bearingBeforeCompass);
check(Math.abs(out.urban3D.bearingAfterCompass) < 0.1,
  "urban3D.bearingAfterCompass", out.urban3D.bearingAfterCompass);
check(Math.abs(out.urban3D.pitchAfterCompass - 50) < 0.1,
  "urban3D.pitchAfterCompass", out.urban3D.pitchAfterCompass);
check(out.selection3D.zoom > 15 && out.selection3D.zoom <= 19,
  "selection3D.zoom must reach the extrusion range", out.selection3D.zoom);
check(Math.abs(out.selection3D.pitch - 50) < 0.1,
  "selection3D.pitch", out.selection3D.pitch);
check(out.selection3D.renderedBuildings > 0,
  "selection3D.renderedBuildings must be positive", out.selection3D.renderedBuildings);
check(Math.abs(out.pitchedMarker.pitch - 50) < 0.1,
  "pitchedMarker.pitch", out.pitchedMarker.pitch);
requireEqual("pitchedMarker.selected", 1);
requireMarkerPlacement(out.markersPlaced, "markersPlaced", false);
requireMarkerPlacement(out.pitchedMarker.placed, "pitchedMarker.placed", false);
requireMarkerPlacement(out.pitchedMarker.placedRotated, "pitchedMarker.placedRotated", false);
requireMarkerPlacement(out.touch.markersPlaced, "touch.markersPlaced", true);
check(out.initialFitClearOfCards.onScreen === out.markersOnMap &&
  out.initialFitClearOfCards.behindACard === 0, "initialFitClearOfCards", out.initialFitClearOfCards);
requireOverview(out.initialOverview, "initialOverview");
requireOverview(out.narrow.overviewFloor, "narrow.overviewFloor");
requireOverview(out.resizeAtFloor.desktop, "resizeAtFloor.desktop");

requireEqual("search.visibleRows", 1);
requireEqual("search.markers", 1);
check(JSON.stringify(out.searchMatchesSiteName) === '["Arches"]',
  "searchMatchesSiteName", out.searchMatchesSiteName);
check(out.searchMatchesReasonText > 0, "searchMatchesReasonText", out.searchMatchesReasonText);
requireEqual("clearRestores.rows", 40);
requireEqual("clearRestores.value", "");
requireEqual("noMatch.rows", 0);
requireEqual("noMatch.markers", 0);
requireEqual("chips.restingAllPressed", "true");
requireEqual("chips.afterPickEurope.rows", 13);
requireEqual("chips.afterPickEurope.europe", "true");
requireEqual("chips.afterPickEurope.all", "false");
requireEqual("chips.plusAsia.rows", 21);
requireEqual("chips.minusAsia.rows", 13);
requireEqual("chips.afterAll.rows", 40);
requireEqual("chips.allFourCollapsesToAll.rows", 40);
requireEqual("chips.allFourCollapsesToAll.all", "true");

requireEqual("detailFromRow.title", "Tesla Diner");
requireEqual("detailFromRow.focusMovedToClose", "dclose");
requireEqual("detailFromRow.hash", "#Tesla Diner");
requireEqual("detailFromRow.ariaCurrentRows", 1);
requireEqual("detailFromRow.markerSelected", 1);
requireEqual("close.focusReturnedToRow", "Tesla Diner");
requireEqual("close.pinStaysSelected", 1);
requireEqual("detailFromPin.title", "Tesla Diner");
requireEqual("deepLink.title", "Great Barrier Reef");
requireEqual("deepLink.siteRows", 9);
check(out.deepLink.currentSite === out.deepLink.factsPointAtIt,
  "deepLink facts must follow current site", out.deepLink);
check(out.deepLink.afterPickingSite4.current === out.deepLink.afterPickingSite4.factsFollowed,
  "deepLink facts must follow picked site", out.deepLink.afterPickingSite4);
requireEqual("filterAwaySelection.staleAriaCurrent", 0);
requireEqual("filterAwaySelection.selectedMarkers", 0);
check(out.wheelOverMap.gained > 2.5 && out.wheelOverMap.gained < 3.5,
  "wheelOverMap.gained must be about three zoom levels", out.wheelOverMap.gained);
check(out.wheelOverMap.continuity.distinct > 3,
  "wheelOverMap must animate continuously", out.wheelOverMap.continuity);

requireEqual("nearMe.promptedOnLoad", 0);
requireEqual("nearMe.granted.asked", 1);
requireEqual("nearMe.granted.pressed", "true");
requireEqual("nearMe.granted.rowCount", 40);
requireEqual("nearMe.granted.distancesShown", 40);
requireEqual("nearMe.granted.firstFour.0", "Stonehenge");
check(JSON.stringify(out.nearMe.searchStillWorksWhileSorted) === '["Niagara Falls"]',
  "nearMe.searchStillWorksWhileSorted", out.nearMe.searchStillWorksWhileSorted);
requireEqual("nearMe.toggledOff.pressed", "false");
requireEqual("nearMe.toggledOff.rowCount", 40);
requireEqual("nearMe.denied.pressed", "false");
check(/permission/i.test(out.nearMe.denied.msg), "nearMe.denied message", out.nearMe.denied.msg);
requireEmpty("achromaticPanel");
requireEmpty("blueUsage");

check(out.touch.searchFontPx >= 16, "touch.searchFontPx", out.touch.searchFontPx);
requireEmpty("touch.tapTargetsUnder44");
check(Array.isArray(out.touch.hitBoxes.pin.effective) &&
  out.touch.hitBoxes.pin.effective[0] >= 48 && out.touch.hitBoxes.pin.effective[1] >= 48,
  "touch.hitBoxes.pin effective target", out.touch.hitBoxes.pin);
check(out.touch.hitBoxes.grabber.effective[1] >= 43,
  "touch.hitBoxes.grabber effective target", out.touch.hitBoxes.grabber);
requireEqual("touch.afterPinTap.strandedTooltips", 0);
check(out.sheetDetents.length === 4, "sheetDetents length", out.sheetDetents);
out.sheetDetents.forEach((state, index) => {
  check(state.bottomPinned && state.zoomClear && state.attribClear,
    `sheetDetents.${index} geometry`, state);
});
check(new Set(out.sheetDetents.map((state) => state.h)).size === 3,
  "sheetDetents must visit all three heights", out.sheetDetents);
requireEqual("sheetDetents.1.expanded", "false");
requireEqual("keyboard.kbAtRest", "0px");
requireEqual("landscapePhone.mode", "side");
requireEqual("landscapePhone.corner", "maplibregl-ctrl-top-left");
requireEqual("overviewFloorIndependence.filteredMarkers", 1);

// Locale rendering, bidi isolation and state preservation.
check(out.i18n.allLocales.length === 18, "i18n.allLocales length", out.i18n.allLocales.length);
out.i18n.allLocales.forEach((entry) => {
  const expectedDir = entry.key === "he" || entry.key === "ar" ? "rtl" : "ltr";
  check(entry.lang === entry.key && entry.selected === entry.key,
    `i18n.${entry.key} selected language`, entry);
  check(entry.dir === expectedDir, `i18n.${entry.key} direction`, entry);
  ["heading", "searchAria", "detailCopy", "controls", "mapLanguage",
    "shellDirection", "canonicalBidi", "canonicalHash"].forEach((field) =>
    check(entry[field] === true, `i18n.${entry.key}.${field}`, entry[field]));
  check(entry.rows === out.rowsBuilt && entry.markers === out.markersOnMap,
    `i18n.${entry.key} data survives relabel`, entry);
});
requireEqual("i18n.inPlace.after.lang", "ar");
requireEqual("i18n.inPlace.after.dir", "rtl");
check(JSON.stringify(out.i18n.translatedQuerySwitch.frenchMatches) === '["Bryce Canyon"]',
  "i18n.translatedQuerySwitch French-only result", out.i18n.translatedQuerySwitch);
requireEqual("i18n.translatedQuerySwitch.before.locale", "fr");
requireEqual("i18n.translatedQuerySwitch.before.query", "cheminées");
requireEqual("i18n.translatedQuerySwitch.before.rowCurrent", "true");
requireEqual("i18n.translatedQuerySwitch.before.selectedPins", 1);
requireEqual("i18n.translatedQuerySwitch.before.detailOpen", true);
requireEqual("i18n.translatedQuerySwitch.before.detailTitle", "Bryce Canyon");
requireEqual("i18n.translatedQuerySwitch.before.hash", "#Bryce%20Canyon");
requireEqual("i18n.translatedQuerySwitch.before.focus", "dclose");
requireEqual("i18n.translatedQuerySwitch.after.locale", "ar");
requireEqual("i18n.translatedQuerySwitch.after.dir", "rtl");
requireEqual("i18n.translatedQuerySwitch.after.rowCurrent", "true");
requireEqual("i18n.translatedQuerySwitch.after.selectedPins", 1);
requireEqual("i18n.translatedQuerySwitch.after.detailOpen", true);
requireEqual("i18n.translatedQuerySwitch.after.detailTitle", "Bryce Canyon");
requireEqual("i18n.translatedQuerySwitch.after.focus", "dclose");
requireEqual("i18n.translatedQuerySwitch.afterClose.focus", "q");
requireEqual("i18n.translatedQuerySwitch.afterClose.detailHidden", true);
requireEqual("i18n.translatedQuerySwitch.afterClose.rowHidden", true);
requireEqual("i18n.localeGeometry.overview.lang", "he");
requireEqual("i18n.localeGeometry.overview.dir", "rtl");
requireEqual("i18n.localeGeometry.overview.markers", 53);
requireEqual("i18n.localeGeometry.overview.onScreen", 53);
requireEqual("i18n.localeGeometry.overview.behindPanel", 0);
requireEqual("i18n.localeGeometry.landscapeSelection.lang", "he");
requireEqual("i18n.localeGeometry.landscapeSelection.dir", "rtl");
requireEqual("i18n.localeGeometry.landscapeSelection.selected", 1);
requireEqual("i18n.localeGeometry.landscapeSelection.title", "Tesla Diner");
requireEqual("i18n.localeGeometry.sheetDetent.lang", "ja");
requireEqual("i18n.canonicalEnglishCountrySearch.locale", "ar");
requireEqual("i18n.canonicalEnglishCountrySearch.dir", "rtl");
requireEqual("i18n.canonicalEnglishCountrySearch.query", "United States");
requireEqual("i18n.canonicalEnglishCountrySearch.expected.length", 15);
requireEqual("i18n.canonicalEnglishCountrySearch.visible.length", 15);
requireEqual("i18n.savedChoice.locale", "ar");
requireEqual("i18n.savedChoice.stored", "ar");
requireEqual("i18n.savedChoice.selected", "ar");
requireEqual("i18n.savedChoice.urlHasLanguage", false);
requireEqual("i18n.automaticReset.stored", null);
requireEqual("i18n.automaticReset.selected", "auto");
requireEqual("i18n.automaticReset.country", "CA");
check(["en", "fr"].includes(out.i18n.automaticReset.locale),
  "i18n.automaticReset locale must be valid for Canada", out.i18n.automaticReset);

const successfulIp = [
  ["usSpanish", "es", "US", true],
  ["canadaFrench", "fr", "CA", false],
  ["hongKongCantonese", "yue-Hant", "HK", false]
];
successfulIp.forEach(([name, locale, country, miles]) => {
  const state = out.i18n.ip[name];
  check(state.locale === locale && state.lang === locale, `i18n.ip.${name}.locale`, state);
  check(state.country === country && state.miles === miles, `i18n.ip.${name}.country/units`, state);
  requirePrivateRequest(state.request, `i18n.ip.${name}.request`);
  check(state.request.aborted === false, `i18n.ip.${name}.request.aborted`, state.request);
  parseCountryCache(state.storedCountry, `i18n.ip.${name}.storedCountry`, country, true);
  check(state.rows === out.rowsBuilt && state.markers === out.markersOnMap &&
    state.styleLoaded === true && state.consoleClean === true,
    `i18n.ip.${name} app remains healthy`, state);
});
[
  ["malformed", "de"], ["rejected", "fr"], ["httpError", "ko"],
  ["badJson", "zh-Hant"], ["stalled", "ja"]
].forEach(([name, locale]) => {
  const state = out.i18n.ip[name];
  check(state.locale === locale && state.lang === locale, `i18n.ip.${name} fallback locale`, state);
  check(state.country == null && state.storedCountry == null,
    `i18n.ip.${name} must not retain invalid country data`, state);
  requirePrivateRequest(state.request, `i18n.ip.${name}.request`);
  check(state.rows === out.rowsBuilt && state.markers === out.markersOnMap &&
    state.styleLoaded === true && state.consoleClean === true,
    `i18n.ip.${name} silent healthy fallback`, state);
});
check(out.i18n.ip.stalled.request.aborted === true,
  "i18n.ip.stalled request must be aborted", out.i18n.ip.stalled.request);
check(out.i18n.ip.stalled.request.abortDelayMs >= 1400 &&
  out.i18n.ip.stalled.request.abortDelayMs <= 2000,
  "i18n.ip.stalled abort must occur around 1.5 seconds", out.i18n.ip.stalled.request);

check(out.i18n.validCountryCache.locale === "fr" &&
  out.i18n.validCountryCache.country === "CA" && out.i18n.validCountryCache.miles === false,
  "i18n.validCountryCache must drive locale and units", out.i18n.validCountryCache);
check(out.i18n.validCountryCache.request == null,
  "i18n.validCountryCache must suppress lookup", out.i18n.validCountryCache);
parseCountryCache(out.i18n.validCountryCache.storedCountry,
  "i18n.validCountryCache.storedCountry", "CA");
check(out.i18n.savedChoiceSuppressesLookup.locale === "de" &&
  out.i18n.savedChoiceSuppressesLookup.stored === "de" &&
  out.i18n.savedChoiceSuppressesLookup.country == null &&
  out.i18n.savedChoiceSuppressesLookup.request == null,
  "i18n.savedChoiceSuppressesLookup", out.i18n.savedChoiceSuppressesLookup);
requirePrivateRequest(out.i18n.expiredCountryCache.request,
  "i18n.expiredCountryCache.request");
check(out.i18n.expiredCountryCache.locale === "fr" &&
  out.i18n.expiredCountryCache.country === "CA",
  "i18n.expiredCountryCache must refresh", out.i18n.expiredCountryCache);
parseCountryCache(out.i18n.expiredCountryCache.storedCountry,
  "i18n.expiredCountryCache.storedCountry", "CA", true);
requirePrivateRequest(out.i18n.malformedCountryCache.request,
  "i18n.malformedCountryCache.request");
check(out.i18n.malformedCountryCache.locale === "ja" &&
  out.i18n.malformedCountryCache.country == null &&
  out.i18n.malformedCountryCache.storedCountry == null,
  "i18n.malformedCountryCache must be removed", out.i18n.malformedCountryCache);
requireEqual("i18n.malformedSavedChoice.stored", null);
requireEqual("i18n.malformedSavedChoice.rows", 40);
requireEqual("i18n.prototypeSavedChoice.locale", "en");
requireEqual("i18n.prototypeSavedChoice.stored", null);
requireEqual("i18n.prototypeSavedChoice.rows", 40);
requireEqual("i18n.prototypeSavedChoice.markers", 53);
requireEqual("i18n.storageUnavailable.locale", "fr");
requireEqual("i18n.storageUnavailable.rows", 40);
requireEqual("i18n.storageUnavailable.markers", 53);
requireEqual("i18n.hashSelectionInvalidation.beforeClear.detailOpen", true);
requireEqual("i18n.hashSelectionInvalidation.beforeClear.detailTitle", "Tesla Diner");
requireEqual("i18n.hashSelectionInvalidation.beforeClear.ariaCurrent", 1);
requireEqual("i18n.hashSelectionInvalidation.beforeClear.selectedPins", 1);
requireEqual("i18n.hashSelectionInvalidation.afterClear.hash", "");
requireEqual("i18n.hashSelectionInvalidation.beforeInvalid.detailOpen", true);
requireEqual("i18n.hashSelectionInvalidation.beforeInvalid.detailTitle", "Arches");
requireEqual("i18n.hashSelectionInvalidation.beforeInvalid.ariaCurrent", 1);
requireEqual("i18n.hashSelectionInvalidation.beforeInvalid.selectedPins", 2);
requireEqual("i18n.hashSelectionInvalidation.afterInvalid.hash", "");

const portraitRtl = out.i18n.rtlResponsive.portrait;
check(portraitRtl.lang === "he" && portraitRtl.dir === "rtl" &&
  portraitRtl.panel.left <= 12 && portraitRtl.panel.right <= 12 &&
  portraitRtl.sameFootprint && portraitRtl.controlsAbove && portraitRtl.canonicalBidi,
  "i18n.rtlResponsive.portrait", portraitRtl);
check(portraitRtl.navCorner === "maplibregl-ctrl-top-left" &&
  portraitRtl.attrCorner === "maplibregl-ctrl-top-right",
  "i18n.rtlResponsive.portrait control corners", portraitRtl);
const landscapeRtl = out.i18n.rtlResponsive.landscape;
check(landscapeRtl.lang === "he" && landscapeRtl.dir === "rtl" &&
  landscapeRtl.panel.left <= 12 && landscapeRtl.detail.left <= 12 &&
  landscapeRtl.sameFootprint && landscapeRtl.controlsRight && landscapeRtl.canonicalBidi,
  "i18n.rtlResponsive.landscape", landscapeRtl);
check(landscapeRtl.navCorner === "maplibregl-ctrl-top-right" &&
  landscapeRtl.attrCorner === "maplibregl-ctrl-bottom-right",
  "i18n.rtlResponsive.landscape control corners", landscapeRtl);

// Direct-file startup is a first-class product path, including RTL shaping,
// saved overrides and Automatic's privacy/storage behavior.
requireEqual("directFile.protocol", "file:");
requireEqual("directFile.rows", 40);
requireEqual("directFile.markers", 53);
requireEqual("directFile.locales", 18);
check(["deferred", "loaded"].includes(out.directFile.rtlPluginStatus),
  "directFile.rtlPluginStatus", out.directFile.rtlPluginStatus);
requireEqual("directFile.rtl.lang", "ar");
requireEqual("directFile.rtl.dir", "rtl");
requireEqual("directFile.rtl.status", "loaded");
requireEqual("directFile.rtl.stored", "ar");
check(JSON.stringify(out.directFile.rtl.mapField).includes("name:ar"),
  "directFile.rtl.mapField", out.directFile.rtl.mapField);
requireEqual("directFile.savedOverrideReload.locale", "ar");
requireEqual("directFile.savedOverrideReload.dir", "rtl");
requireEqual("directFile.savedOverrideReload.rows", 40);
requireEqual("directFile.savedOverrideReload.markers", 53);
const fileAuto = out.directFile.automaticCountry;
check(fileAuto.locale === "fr" && fileAuto.lang === "fr" &&
  fileAuto.country === "CA" && fileAuto.miles === false,
  "directFile.automaticCountry locale and units", fileAuto);
requirePrivateRequest(fileAuto.request, "directFile.automaticCountry.request");
parseCountryCache(fileAuto.storedCountry,
  "directFile.automaticCountry.storedCountry", "CA", true);
check(fileAuto.rows === 40 && fileAuto.markers === 53 && fileAuto.consoleClean === true,
  "directFile.automaticCountry app remains healthy", fileAuto);
requireEqual("offlineFallback.rows", 40);
check(/map unavailable/i.test(out.offlineFallback.errorText),
  "offlineFallback accessible error text", out.offlineFallback.errorText);

out.verification = { passed: failures.length === 0, failures };
console.log(JSON.stringify(out, null, 1));
ws.close(); chrome.kill();
await rm(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
if (failures.length) {
  console.error(`verification failed (${failures.length})`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
}

// Expectations, so a future run does not have to re-derive them:
//   consoleClean true · mapIsFullBleed true · cardsAreMapSiblings true
//   panelOnTheRight {right:16, left:1112, w:372} · detailHiddenAtRest true
//   rowsBuilt 40 · markersOnMap 53 · initialFitClearOfCards.behindACard 0
//   controlsReachable {zoom:true, attribution:true} on BOTH desktop and narrow
//   mapEngine MapLibre 5.24.0 / one OpenFreeMap vector source / responsive min / max 19
//   initialOverview atFloor/zoomOutDisabled true, sitesWithinPadding 53
//   programmaticZoomBounds both clamped and zoomInDisabled true
//   buildings3D aboveBaseBuildings/belowRoadLabels true, nextTextLabel highway_name_other,
//     minZoom 15 / color #787876 / height+base reveal 0 at z15 to source values at z16,
//     opacity 1 / gradient false / viewport light [1.15,210,30], white, intensity .08
//   the shipped z19 ceiling exercises altitudePitch 0/25/50/0, live z15+
//     buildings and selection while z14 source tiles overzoom normally
//   urban3D/selection3D ready true, render buildings at pitch 50
//   pitchedMarker selected/clear/clickable true at pitch 50
//   search.visibleRows 1 · searchMatchesSiteName ["Arches"] · noMatch.markers 0
//   chips: resting All pressed + regions quiet · Europe 13 · +Asia 21 · All 40
//   detailFromRow: listStillVisible true (the point of the whole round),
//     detailAtTopLeft.clearOfPanel true, focusMovedToClose "dclose",
//     ariaCurrentRows 1, markerSelected 1, noPopupAnywhere true,
//     siteClearOfCards.clear true
//   close.focusReturnedToRow "Tesla Diner" · hashCleared true · escapeCloses both
//   deepLink.siteRows 9 · allNineClearOfCards true · site 4 repoints the facts
//   filterAwaySelection: detailClosed true, staleAriaCurrent 0, selectedMarkers 0
//   wheelOverPanel / wheelOverDetail: the card scrolls, map zoom unchanged
//   minInputClamp: button/wheel cannot cross the floor; maxInputClamp adds pinch at z19
//   wheelOverMap: gained about 3, fractionalRest true, continuity.distinct >> 3
//   nearMe.promptedOnLoad 0 · granted.firstFour starts "Stonehenge" · ascending true
//   nearMe.denied.msg mentions permission · achromaticPanel [] · blueUsage []
//   narrow: panelIsBottomSheet/detailOverlaysSheet all true · overviewFloor atFloor/53 sites
//   markersPlaced (desktop, touch, pitched and pitched+rotated): markerPosition
//     "absolute", allMarkersChecked true, misplacedOver2px 0, worstOffsetPx 0,
//     worstExample null. allMarkersChecked is the guard against a VACUOUS pass:
//     __markers holds every Marker ever built, so a stale generation would make
//     every rect zero-width and "0 misplaced" would mean "0 looked at". Never set
//     `position` on .pin -- it is the MapLibre marker element, and winning that
//     cascade drops all 53 into normal flow. Every OTHER geometry check here
//     projects both sides, so this is the only one that can see it.
//   touch.mediaApplies all true -- if coarse is false the whole 12b section is
//     passing vacuously, because the rules it tests are not applied
//   touch.searchFontPx >= 16 (iOS zoom-on-focus) · tapTargetsUnder44 []
//   touch.hitBoxes: pin 38x24 visual grows about 12 a side to ~62x48;
//     grabber 28 tall grows 8 top and bottom to 44. Both are pseudo-element
//     hit boxes, so a rect-based audit cannot see them -- hence the exemptions.
//   touch.afterPinTap: detailOpened true, strandedTooltips 0, leavesUsableMap true
//   sheetDetents cycles full -> peek -> half -> full; at EVERY entry
//     bottomPinned/zoomClear/attribClear true, expanded "false" only at peek
//   sheetFraming: clampHoldsEverywhere true (raw reaches 82% at the tallest
//     detent and clamps to 70), framedWhereItOpened true
//   flickDismiss detailGone true, listSurvives true · listNeverDismisses all true
//   throwVsNudge.differ true -- same 90px, thrown skips a detent, nudged does not
//   keyboard.grew true · kbAtRest "0px"
//   landscapePhone: mode "side", dockedRight/fullHeight/detailOverlays true,
//     corner maplibregl-ctrl-top-left, controlsClearOfCard true, grabberHidden true,
//     siteInVisibleBand true
//   resizeAtFloor.desktop atFloor/sitesWithinPadding 53 · resizeWhileZoomed all preserved
//   resizeWithSelection all preserved/floorMatchesUnselected true
//   overviewFloorIndependence preserved with one marker/detail open/panel moved
//   resizeRequiresClamp floorRaised/clampedToFloor true
//   i18n: all 18 locales/controls/map fields, saved+automatic precedence,
//     in-place RTL state preservation, mocked IP outcomes and storage failures all pass
//   directFile includes 18 locales, loaded RTL plugin and saved override reload;
//     offlineFallback errorShown/detailOpens true
