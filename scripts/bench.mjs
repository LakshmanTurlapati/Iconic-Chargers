// Measures how the map actually feels: frame cadence under a real drag and a
// real wheel-zoom, plus the main-thread cost of a search keystroke.
//
//   node scripts/bench.mjs [url] [--runs=N] [--cpu=6] [--net=3g] [--headful]
//
// Input is dispatched through CDP, not synthesised in-page, so MapLibre's real
// drag/zoom handlers run. Frames are sampled with requestAnimationFrame inside
// the page -- which is why this must not run in a background tab: hidden tabs
// throttle rAF and every number comes back a fiction.
//
// Default to --cpu=6: unthrottled on a fast Mac against a local server, every
// interaction already sits at the renderer's ceiling and the run reports no
// jank whatever the code does. Throttling is what makes the numbers move.
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
const args = process.argv.slice(2);
const URL_ = args.find((a) => !a.startsWith("--")) ||
  "http://127.0.0.1:8731/web/index.html";
const flag = (name, dflt) =>
  (args.find((a) => a.startsWith(`--${name}=`)) || `--${name}=${dflt}`).split("=")[1];
const RUNS = Number(flag("runs", 3));
const CPU = Number(flag("cpu", 6));
const NET = flag("net", "none");
const DPR = Number(flag("dpr", 2));
const NOTCH = 120 * DPR; // CDP divides wheel deltas by the emulated scale factor
const HEADFUL = args.includes("--headful");
const PORT = 9222 + (process.pid % 500);
const PROFILE = `/tmp/bench-chrome-${process.pid}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  HEADFUL ? "--new-window" : "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  "--window-size=1500,900",
  "--no-first-run", "--no-default-browser-check",
  // Without these the page can be treated as backgrounded and rAF stops.
  "--disable-background-timer-throttling",
  "--disable-renderer-backgrounding",
  "--disable-backgrounding-occluded-windows",
  "about:blank",
], { stdio: "ignore" });
let chromeLaunchError;
chrome.once("error", (error) => { chromeLaunchError = error; });

async function target() {
  for (let i = 0; i < 100; i++) {
    if (chromeLaunchError) break;
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages = (await r.json()).filter((t) => t.type === "page");
      if (pages[0]?.webSocketDebuggerUrl) return pages[0].webSocketDebuggerUrl;
    } catch {}
    await sleep(100);
  }
  chrome.kill();
  await rm(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
  throw new Error(chromeLaunchError
    ? `Could not launch Chrome at ${CHROME}: ${chromeLaunchError.message}`
    : `Chrome at ${CHROME} did not expose a debuggable page on port ${PORT}`);
}

const ws = new WebSocket(await target());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
  }
};
const send = (method, params = {}) =>
  new Promise((res, rej) => { pending.set(++id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });

async function evaluate(expr, awaitPromise = false) {
  const r = await send("Runtime.evaluate", {
    expression: expr, returnByValue: true, awaitPromise,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "eval failed");
  return r.result.value;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  var nativeFetch = window.fetch.bind(window);
  window.__countryRequests = 0;
  window.__countrySettledMs = null;
  window.fetch = function (input, options) {
    if (String(input) !== 'https://api.country.is/') return nativeFetch(input, options);
    window.__countryRequests++;
    return nativeFetch(input, options).finally(function () {
      window.__countrySettledMs = performance.now();
    });
  };
  Object.defineProperty(window, 'maplibregl', {
    configurable: true,
    set: function (v) {
      v.Map = new Proxy(v.Map, { construct: function (Target, args, NewTarget) {
        var instance = Reflect.construct(Target, args, NewTarget);
        window.__map = instance;
        instance.once('load', function () { performance.mark('maplibre-style-ready'); });
        return instance;
      }});
      Object.defineProperty(window, 'maplibregl', {
        value: v, writable: true, configurable: true
      });
    },
    get: function () { return undefined; }
  });
` });

// Frame sampler. Resolves with the distribution once `ms` has elapsed.
const PROBE = `
window.__probe = (ms) => new Promise((res) => {
  const t = []; let last = performance.now(); const stop = last + ms;
  (function tick(now) {
    t.push(now - last); last = now;
    if (now < stop) requestAnimationFrame(tick);
    else {
      const s = t.slice(3).sort((a, b) => a - b);
      const q = (p) => +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(1);
      res({ frames: s.length, median: q(0.5), p95: q(0.95), worst: +s[s.length - 1].toFixed(1),
            janky: s.filter((x) => x > 20).length });
    }
  })(performance.now());
});`;

const NET_STATS = `(() => {
  const r = performance.getEntriesByType('resource');
  const mapAssets = r.filter((x) => {
    try { return new URL(x.name).host === 'tiles.openfreemap.org'; } catch { return false; }
  });
  const vectors = mapAssets.filter((x) => /\\.pbf(?:\\?|$)/.test(x.name));
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint');
  const styleReady = performance.getEntriesByName('maplibre-style-ready')[0];
  const end = (x) => x.startTime + x.duration;
  // transferSize is 0 for cross-origin responses without Timing-Allow-Origin,
  // so fall back to the decoded body -- an over-estimate for compressed text,
  // but never the silent 0 that made the first run look free.
  const bytes = (x) => x.transferSize || x.decodedBodySize || 0;
  // The local GL bundle gates map construction; the style mark includes the
  // first complete vector render and is the real useful-map milestone.
  const lib = r.filter((x) => /maplibre-gl\\.js$/.test(x.name)).map(end);
  const hosts = [...new Set(r.map((x) => new URL(x.name).host))];
  const vectorSources = Object.values(__map.getStyle().sources).filter((s) =>
    s.type === 'vector' && /tiles\\.openfreemap\\.org\\/planet/.test(s.url || '')).length;
  return { requests: r.length, mapAssets: mapAssets.length, vectorTiles: vectors.length,
           vectorSources, countryRequests: window.__countryRequests || 0,
           countrySettledMs: window.__countrySettledMs == null
             ? null : +window.__countrySettledMs.toFixed(0),
           origins: hosts.length,
           thirdParty: hosts.filter((h) => !h.startsWith('127.')),
           kb: +(r.reduce((a, x) => a + bytes(x), 0) / 1024).toFixed(1),
           fcpMs: fcp ? +fcp.startTime.toFixed(0) : null,
           maplibreReadyMs: lib.length ? +Math.max(...lib).toFixed(0) : 0,
           styleReadyMs: styleReady ? +styleReady.startTime.toFixed(0) : null,
           lastMapAssetMs: mapAssets.length ? +Math.max(...mapAssets.map(end)).toFixed(0) : null,
           domReadyMs: +nav.domContentLoadedEventEnd.toFixed(0) };
})()`;

const mouse = (type, x, y, extra = {}) =>
  send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1, ...extra });

async function drag() {
  await mouse("mousePressed", 750, 480);
  for (let i = 1; i <= 45; i++) {
    await mouse("mouseMoved", 750 - i * 11, 480 + i * 5);
    await sleep(8);
  }
  await mouse("mouseReleased", 750 - 45 * 11, 480 + 45 * 5);
}

async function wheelZoom() {
  for (let i = 0; i < 9; i++) {
    await send("Input.dispatchMouseEvent", {
      type: "mouseWheel", x: 750, y: 480, deltaX: 0, deltaY: -NOTCH, buttons: 0,
    });
    await sleep(110);
  }
}

const NET_PROFILES = {
  none: null,
  // Roughly Chrome DevTools' "Fast 3G".
  "3g": { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 },
  "4g": { offline: false, latency: 40, downloadThroughput: 9e6 / 8, uploadThroughput: 3e6 / 8 },
};

async function once() {
  // Cold cache each run, so load numbers describe a first visit.
  await send("Network.enable");
  await send("Network.clearBrowserCache");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  if (/^https?:/.test(URL_)) {
    await send("Storage.clearDataForOrigin", {
      origin: new URL(URL_).origin,
      storageTypes: "local_storage,session_storage"
    });
  }
  const profile = NET_PROFILES[NET];
  if (profile) await send("Network.emulateNetworkConditions", { ...profile, connectionType: "cellular4g" });
  if (CPU > 1) await send("Emulation.setCPUThrottlingRate", { rate: CPU });
  // Headless defaults to dpr 1, which understates the WebGL fill and label
  // workload on the retina Mac this UI is designed for.
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1500, height: 900, deviceScaleFactor: DPR, mobile: false,
  });

  await send("Page.navigate", { url: URL_ });
  // Wait for the vector style and markers, then let tiles settle so we measure
  // steady-state interaction rather than first paint.
  for (let i = 0; i < 120; i++) {
    if (await evaluate(`window.__map && __map.isStyleLoaded() &&
      document.querySelectorAll('.pin').length === 53`)) break;
    await sleep(100);
  }
  await sleep(2500);
  await evaluate(PROBE);

  const hidden = await evaluate(`document.hidden`);
  if (hidden) throw new Error("page is hidden -- rAF is throttled, numbers would be meaningless");

  // Snapshot load cost BEFORE touching anything: dragging and zooming pull down
  // their own tiles, and folding those into the load figure overstates it ~6x.
  const net = await evaluate(NET_STATS);
  await evaluate(`performance.clearResourceTimings()`);

  const idle = await evaluate(`__probe(500)`, true);

  const dragP = evaluate(`__probe(1200)`, true);
  await drag();
  const dragR = await dragP;

  await sleep(500);
  const zoomStart = await evaluate(`__map.getZoom()`);
  const zoomP = evaluate(`__probe(1500)`, true);
  await wheelZoom();
  const zoomR = await zoomP;
  const zoomEnd = await evaluate(`__map.getZoom()`);

  // Keystroke cost: full synchronous handler time + DOM churn it causes.
  // Cost of a keystroke INCLUDING work the handler defers to a rAF. Measuring
  // only the synchronous handler would score a deferred render as free.
  // Cost of typing, counted as DOM churn rather than wall clock. Wall clock is
  // not comparable here: a handler that renders synchronously is fully charged
  // for its work, while one that defers to a rAF would score ~0 for the same
  // work. Mutations are charged either way, so both designs are measured on
  // the same basis.
  const key = await evaluate(`(async () => {
    const q = document.getElementById('q');
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    let mutations = 0;
    // Accumulate from the callback AND drain at the end: the callback fires
    // during the awaited frames and empties the queue, so takeRecords() alone
    // reports zero no matter how much churn happened.
    const mo = new MutationObserver((recs) => { mutations += recs.length; });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });
    let syncMs = 0;
    for (const s of ['y', 'yo', 'yos', 'yose', '']) {
      const t0 = performance.now();
      q.value = s; q.dispatchEvent(new Event('input', { bubbles: true }));
      syncMs += performance.now() - t0;
      await frame();
    }
    mutations += mo.takeRecords().length;
    mo.disconnect();
    return { syncMs: +syncMs.toFixed(1), mutations };
  })()`, true);

  // Give the worker/source pipeline time to schedule destination tiles before
  // snapshotting interaction-driven network work.
  await sleep(1000);

  // Everything requested since the snapshot above is interaction-driven.
  const during = await evaluate(`(() => {
    const t = performance.getEntriesByType('resource').filter((x) => /\\.pbf(?:\\?|$)/.test(x.name));
    return { tiles: t.length,
             lastMs: t.length ? +Math.max(...t.map((x) => x.startTime + x.duration)).toFixed(0) : 0 };
  })()`);

  return { idle, drag: dragR, zoom: zoomR, zoomGain: +(zoomEnd - zoomStart).toFixed(3),
           key, net, during };
}

const runs = [];
for (let i = 0; i < RUNS; i++) runs.push(await once());

const med = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const pick = (path) => med(runs.map((r) => path.split(".").reduce((o, k) => o[k], r)));

const out = {
  url: URL_, runs: RUNS, cpuThrottle: `${CPU}x`, network: NET,
  idle:  { median: pick("idle.median"), p95: pick("idle.p95") },
  drag:  { median: pick("drag.median"), p95: pick("drag.p95"), worst: pick("drag.worst"), janky: pick("drag.janky") },
  zoom:  { median: pick("zoom.median"), p95: pick("zoom.p95"), worst: pick("zoom.worst"), janky: pick("zoom.janky") },
  wheelZoomGain: pick("zoomGain"),
  key:   { mutations: pick("key.mutations"), syncMs: pick("key.syncMs") },
  load:  { requests: pick("net.requests"), mapAssets: pick("net.mapAssets"),
           vectorTiles: pick("net.vectorTiles"), vectorSources: pick("net.vectorSources"),
           countryRequests: pick("net.countryRequests"),
           countrySettledMs: pick("net.countrySettledMs"),
           origins: pick("net.origins"), kb: pick("net.kb"),
           fcpMs: pick("net.fcpMs"), maplibreReadyMs: pick("net.maplibreReadyMs"),
           styleReadyMs: pick("net.styleReadyMs"), lastMapAssetMs: pick("net.lastMapAssetMs"),
           domReadyMs: pick("net.domReadyMs"),
           thirdParty: runs[0].net.thirdParty },
  interactionTiles: pick("during.tiles"),
};
console.log(JSON.stringify(out, null, 2));

ws.close();
chrome.kill();
// Chrome writes to the profile as it exits; a failed cleanup must not fail the run.
await rm(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
