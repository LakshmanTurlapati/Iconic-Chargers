// Regenerates the README screenshots.
//
//   node scripts/shots.mjs [url]
//
// Waits for the vector style and GL renderer to settle before capturing -- a
// screenshot taken on DOMContentLoaded shows an empty map or half-placed labels.
import { spawn } from "node:child_process";
import { accessSync, constants, statSync } from "node:fs";
import { writeFile, mkdir, rm } from "node:fs/promises";
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
const URL_ = args.find((arg) => !arg.startsWith("--")) ||
  "http://127.0.0.1:8731/web/index.html";
const I18N_QA = args.includes("--i18n-qa");
const PORT = 9700 + (process.pid % 200);
const PROFILE = `/tmp/shot-${process.pid}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`, "--window-size=1500,900", "--no-first-run",
  "--hide-scrollbars", "--disable-background-timer-throttling",
  "--disable-renderer-backgrounding", "about:blank"], { stdio: "ignore" });
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
ws.onmessage = (m) => {
  const x = JSON.parse(m.data);
  if (x.id && pend.has(x.id)) { pend.get(x.id)(x.result); pend.delete(x.id); }
};
const send = (method, params = {}) =>
  new Promise((res) => { pend.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate",
  { expression: e, returnByValue: true })).result.value;

await send("Page.enable");
await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  // Documentation is deterministic regardless of the machine or IP running
  // it. Brazil has no charger in this atlas, so its valid cached code keeps
  // the intentional world overview without making an external lookup.
  try { localStorage.setItem('iconic.locale.v1', 'en'); } catch (e) {}
  try { sessionStorage.setItem('iconic.country.v1', JSON.stringify({
    country:'BR', expires:Date.now()+21600000
  })); } catch (e) {}
  Object.defineProperty(window, 'maplibregl', {
    configurable: true,
    set: function (v) {
      v.Map = new Proxy(v.Map, { construct: function (Target, args, NewTarget) {
        var instance = Reflect.construct(Target, args, NewTarget);
        window.__map = instance;
        return instance;
      }});
      Object.defineProperty(window, 'maplibregl', {
        value: v, writable: true, configurable: true
      });
    },
    get: function () { return undefined; }
  });
` });
await send("Emulation.setDeviceMetricsOverride",
  { width: 1500, height: 900, deviceScaleFactor: 2, mobile: false });

// Style complete, all currently required vector tiles loaded, and the camera
// at rest three checks in a row.
async function settled() {
  let calm = 0;
  for (let i = 0; i < 90; i++) {
    const done = await ev(`!!window.__map && __map.isStyleLoaded() &&
      __map.areTilesLoaded() && !__map.isMoving()`);
    calm = done ? calm + 1 : 0;
    if (calm >= 3) return true;
    await sleep(250);
  }
  return false;
}

async function shot(hash, file, after) {
  await send("Page.navigate", { url: URL_ + hash });
  for (let i = 0; i < 200; i++) {
    if (await ev(`window.__map && __map.isStyleLoaded() &&
      document.querySelectorAll('.pin').length === 53`)) break;
    await sleep(100);
  }
  await sleep(1000);
  if (after) { await ev(after); await sleep(1200); }
  await settled();
  await sleep(600);
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(file, Buffer.from(data, "base64"));
  console.log(file);
}

await shot("", "docs/screenshot.png");
await shot("#Great%20Barrier%20Reef", "docs/screenshot-detail.png");

// Use the real row-selection path under the shipped z19 ceiling so the
// reference image exercises the same z15–18 pitch and building behavior.
await shot("#Tesla%20Diner", "docs/screenshot-3d.png", `(() => {
  document.querySelector('.item[data-badge="Tesla Diner"]').click();
})()`);

// The phone layout, at iPhone 14 Pro Max metrics. Touch emulation is not
// cosmetic here: the coarse-pointer and hover rules only apply when the browser
// reports a touch device, so without it this would photograph a narrow desktop
// rather than the layout under test.
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Emulation.setDeviceMetricsOverride",
  { width: 430, height: 932, deviceScaleFactor: 3, mobile: true });
// Shown mid-sheet with a Supercharger open, because that is the state the whole
// layout is built around: card at its middle detent, the site framed in the
// strip of map above it, and the controls clear of both.
await shot("#Arches", "docs/screenshot-mobile.png");

// Optional review grid for long and bidirectional translations. These are
// deliberately gitignored QA artifacts, not documentation screenshots.
if (I18N_QA) {
  const qaLocales = ["fr", "de", "ar", "he", "ja", "zh-Hans", "zh-Hant", "yue-Hant", "mi"];
  await mkdir(".context/i18n-qa", { recursive: true });
  async function localeShot(locale, size) {
    await ev(`(() => { const s=document.getElementById('language'); s.value=${JSON.stringify(locale)};
      s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    await sleep(350);
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    const file = `.context/i18n-qa/${locale}-${size}.png`;
    await writeFile(file, Buffer.from(data, "base64"));
    console.log(file);
  }
  await send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await send("Emulation.setDeviceMetricsOverride",
    { width: 1500, height: 900, deviceScaleFactor: 2, mobile: false });
  await sleep(650);
  for (const locale of qaLocales) await localeShot(locale, "wide");
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setDeviceMetricsOverride",
    { width: 430, height: 932, deviceScaleFactor: 3, mobile: true });
  await sleep(650);
  for (const locale of qaLocales) await localeShot(locale, "narrow");
}

ws.close(); chrome.kill();
await rm(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
