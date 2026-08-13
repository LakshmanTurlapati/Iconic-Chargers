// Regenerates the README screenshots.
//
//   node scripts/shots.mjs [url]
//
// Waits for the tile grid to actually settle before capturing -- a screenshot
// taken on DOMContentLoaded shows a grey void where the basemap should be.
import { spawn } from "node:child_process";
import { writeFile, rm } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL_ = process.argv[2] || "http://127.0.0.1:8731/web/index.html";
const PORT = 9700 + (process.pid % 200);
const PROFILE = `/tmp/shot-${process.pid}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`, "--window-size=1500,900", "--no-first-run",
  "--hide-scrollbars", "--disable-background-timer-throttling",
  "--disable-renderer-backgrounding", "about:blank"], { stdio: "ignore" });

let wsUrl;
for (let i = 0; i < 100; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const p = (await r.json()).filter((t) => t.type === "page");
    if (p[0]?.webSocketDebuggerUrl) { wsUrl = p[0].webSocketDebuggerUrl; break; }
  } catch {}
  await sleep(100);
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
await send("Emulation.setDeviceMetricsOverride",
  { width: 1500, height: 900, deviceScaleFactor: 2, mobile: false });

// Every tile <img> either complete or errored, twice in a row.
async function settled() {
  let calm = 0;
  for (let i = 0; i < 90; i++) {
    const done = await ev(`(() => {
      const t = [...document.querySelectorAll('.leaflet-tile')];
      return t.length > 0 && t.every(x => x.complete);
    })()`);
    calm = done ? calm + 1 : 0;
    if (calm >= 3) return true;
    await sleep(250);
  }
  return false;
}

async function shot(hash, file, after) {
  await send("Page.navigate", { url: URL_ + hash });
  for (let i = 0; i < 140; i++) {
    if (await ev(`document.querySelectorAll('.pin').length > 0`)) break;
    await sleep(100);
  }
  await sleep(2500);
  if (after) { await ev(after); await sleep(2500); }
  await settled();
  await sleep(600);
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(file, Buffer.from(data, "base64"));
  console.log(file);
}

await shot("", "docs/screenshot.png");
await shot("#Great%20Barrier%20Reef", "docs/screenshot-detail.png");

ws.close(); chrome.kill();
await rm(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
