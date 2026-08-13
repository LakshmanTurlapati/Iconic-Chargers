// Functional and layout checks for the map UI, driven over CDP.
//
//   node scripts/verify.mjs [url]
//
// Prints one JSON object; every field is meant to be eyeballed against the
// expectations in the table at the bottom of this file. Companion to
// bench.mjs, which measures speed rather than correctness.
//
// The app keeps its Leaflet map in a closure and must not grow a debug global
// just to be testable, so the handle is installed from outside the page with
// an addInitHook planted before any script runs.
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL_ = process.argv[2] || "http://127.0.0.1:8731/web/index.html";
const PORT = 9300 + (process.pid % 300);
const PROFILE = `/tmp/ui-${process.pid}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DPR = 2;
// Chrome divides an injected wheel deltaY by the emulated device scale factor,
// so asking for -120 under dpr 2 makes the page see -60 -- half a real notch.
const NOTCH = 120 * DPR;

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`, "--window-size=1500,900", "--no-first-run",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
  "--disable-backgrounding-occluded-windows", "about:blank"], { stdio: "ignore" });

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
  Object.defineProperty(window, 'L', {
    configurable: true,
    set: function (v) {
      Object.defineProperty(window, 'L', { value: v, writable: true, configurable: true });
      v.Map.addInitHook(function () { window.__map = this; });
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
` });
await send("Emulation.setDeviceMetricsOverride",
  { width: 1500, height: 900, deviceScaleFactor: DPR, mobile: false });

async function load(hash = "") {
  errors.length = 0;
  await send("Page.navigate", { url: URL_ + hash });
  for (let i = 0; i < 140; i++) { if (await ev(`!!window.__map`)) break; await sleep(100); }
  await sleep(2200);
}

const out = {};
const click = (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})||{click(){}}).click(), 1`);
const type = (s) => ev(`(() => { const q = document.getElementById('q');
  q.value = ${JSON.stringify(s)}; q.dispatchEvent(new Event('input', {bubbles:true})); return 1; })()`);
const frame2 = () => ev(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`, true);
const rows = `[...document.querySelectorAll('.item')].filter(e => !e.hidden)`;

// --------------------------------------------------------- 1. load & shell --
await load();
out.consoleClean = errors.length === 0 ? true : errors.slice(0, 4);
out.mapIsFullBleed = await ev(`(() => {
  const m = document.getElementById('map').getBoundingClientRect();
  return m.width === innerWidth && m.height === innerHeight;
})()`);
out.panelIsMapSibling = await ev(`(() => {
  const p = document.getElementById('panel');
  return p.parentElement.id !== 'map' && !p.closest('.leaflet-control');
})()`);
out.rowsBuilt = await ev(`document.querySelectorAll('.item').length`);
out.markersOnMap = await ev(`document.querySelectorAll('.pin').length`);
out.footNote = await ev(`/total stalls, not live availability/.test(document.querySelector('.foot').textContent)`);
out.noLegend = await ev(`!document.querySelector('.legend')`);
out.zoomControlBottomRight =
  await ev(`!!document.querySelector('.leaflet-bottom.leaflet-right .leaflet-control-zoom')`);
out.zoomBtnShape = await ev(`(() => {
  const s = getComputedStyle(document.querySelector('.leaflet-control-zoom-in'));
  return s.width + '/' + s.height + ' r=' + s.borderTopLeftRadius;
})()`);
out.attributionPresent = await ev(`/OpenStreetMap/.test(document.body.textContent)`);

// ------------------------------------------- 2. nothing framed under panel --
const clearOfPanel = `(() => {
  const p = document.getElementById('panel').getBoundingClientRect();
  const pts = ICONIC.sites.map(s => __map.latLngToContainerPoint([s.latitude, s.longitude]));
  const onScreen = pts.filter(q => q.x > -40 && q.x < innerWidth + 40 && q.y > -40 && q.y < innerHeight + 40);
  return { onScreen: onScreen.length,
           behindPanel: onScreen.filter(q => q.x < p.right && q.y > p.top && q.y < p.bottom).length };
})()`;
out.initialFitClearOfPanel = await ev(clearOfPanel);

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
  detailShown: await ev(`!document.getElementById('view-detail').hidden`),
  listHidden: await ev(`document.getElementById('view-list').hidden`),
  title: await ev(`document.getElementById('d-title').textContent`),
  meta: await ev(`document.getElementById('d-meta').textContent`),
  stats: await ev(`[...document.querySelectorAll('#d-stats .stat')].map(e => e.textContent)`),
  facts: await ev(`[...document.querySelectorAll('#d-facts dt')].map(e => e.textContent)`),
  actions: await ev(`[...document.querySelectorAll('#d-actions .btn')].map(e => e.textContent.trim())`),
  primaryHref: await ev(`document.querySelector('#d-actions .btn.primary').getAttribute('href')`),
  teslaHref: await ev(`(document.querySelectorAll('#d-actions .btn')[1]||{}).href || null`),
  focusMovedToBack: await ev(`document.activeElement.id`),
  hash: await ev(`decodeURIComponent(location.hash)`),
  ariaCurrentRows: await ev(`document.querySelectorAll('.item[aria-current="true"]').length`),
  markerSelected: await ev(`document.querySelectorAll('.pin.is-selected').length`),
  noPopupAnywhere: await ev(`!document.querySelector('.leaflet-popup')`),
  siteClearOfPanel: await ev(`(() => {
    const p = document.getElementById('panel').getBoundingClientRect();
    const s = ICONIC.sites.find(x => x.badge === 'Tesla Diner');
    const q = __map.latLngToContainerPoint([s.latitude, s.longitude]);
    return { x: Math.round(q.x), panelRight: Math.round(p.right), clear: q.x > p.right };
  })()`)
};

await click("#back"); await frame2();
out.back = {
  listShown: await ev(`!document.getElementById('view-list').hidden`),
  detailHidden: await ev(`document.getElementById('view-detail').hidden`),
  focusReturnedToRow: await ev(`document.activeElement.dataset ? document.activeElement.dataset.badge : null`),
  hashCleared: await ev(`location.hash === ''`),
  pinStaysSelected: await ev(`document.querySelectorAll('.pin.is-selected').length`)
};

// ------------------------------------------------- 6. detail from a pin ----
await load();
await ev(`(() => { const els = [...document.querySelectorAll('.pin')];
  const t = els.find(e => (e.textContent||'').indexOf('80') >= 0) || els[0];
  t.dispatchEvent(new MouseEvent('click', {bubbles:true})); return 1; })()`);
await sleep(2300);
out.detailFromPin = {
  detailShown: await ev(`!document.getElementById('view-detail').hidden`),
  title: await ev(`document.getElementById('d-title').textContent`)
};

// ------------------------------------------- 7. deep link + multi-site -----
await load("#Great%20Barrier%20Reef");
out.deepLink = {
  detailShown: await ev(`!document.getElementById('view-detail').hidden`),
  title: await ev(`document.getElementById('d-title').textContent`),
  siteRows: await ev(`document.querySelectorAll('#d-sites .srow').length`),
  stats: await ev(`[...document.querySelectorAll('#d-stats .stat')].map(e => e.textContent)`),
  currentSite: await ev(`document.querySelector('#d-sites .srow[aria-current="true"] .snm').textContent`),
  factsPointAtIt: await ev(`document.querySelector('#d-facts dd').textContent`),
  allNineClearOfPanel: await ev(`(() => {
    const p = document.getElementById('panel').getBoundingClientRect();
    return ICONIC.sites.filter(s => s.badge === 'Great Barrier Reef')
      .every(s => __map.latLngToContainerPoint([s.latitude, s.longitude]).x > p.right);
  })()`)
};
await ev(`document.querySelectorAll('#d-sites .srow')[3].click(), 1`);
await sleep(1700);
out.deepLink.afterPickingSite4 = {
  current: await ev(`document.querySelector('#d-sites .srow[aria-current="true"] .snm').textContent`),
  factsFollowed: await ev(`document.querySelector('#d-facts dd').textContent`),
  clearOfPanel: await ev(`(() => {
    const p = document.getElementById('panel').getBoundingClientRect();
    const nm = document.querySelector('#d-sites .srow[aria-current="true"] .snm').textContent;
    const s = ICONIC.sites.find(x => x.name === nm);
    return __map.latLngToContainerPoint([s.latitude, s.longitude]).x > p.right;
  })()`)
};

// -------------------------------- 8. filtering the selection away ----------
await load("#Stonehenge");
out.filterAwaySelection = {
  detailWasOpen: await ev(`!document.getElementById('view-detail').hidden`)
};
// Narrow to Asia, which drops Stonehenge (Europe) out of the list entirely.
await click('.chip[data-region="Asia"]');
await frame2(); await frame2();
Object.assign(out.filterAwaySelection, {
  detailClosed: await ev(`document.getElementById('view-detail').hidden`),
  staleAriaCurrent: await ev(`document.querySelectorAll('.item[aria-current="true"]').length`),
  selectedMarkers: await ev(`document.querySelectorAll('.pin.is-selected').length`)
});

// ------------------------------------------------------ 9. wheel isolation -
await load();
out.wheelOverPanel = await (async () => {
  const z0 = await ev(`__map.getZoom()`);
  await ev(`document.getElementById('list').scrollTop = 0, 1`);
  for (let i = 0; i < 4; i++) {
    await send("Input.dispatchMouseEvent",
      { type: "mouseWheel", x: 190, y: 520, deltaX: 0, deltaY: NOTCH, buttons: 0 });
    await sleep(60);
  }
  await sleep(800);
  return {
    listScrolled: (await ev(`document.getElementById('list').scrollTop`)) > 0,
    mapZoomUnchanged: (await ev(`__map.getZoom()`)) === z0
  };
})();
out.wheelOverMap = await (async () => {
  const z0 = await ev(`__map.getZoom()`);
  await ev(`(() => { window.__z = []; window.__on = true;
    (function t(){ if(!window.__on) return; window.__z.push(__map.getZoom());
      requestAnimationFrame(t); })(); return 1; })()`);
  for (let i = 0; i < 6; i++) {
    await send("Input.dispatchMouseEvent",
      { type: "mouseWheel", x: 1100, y: 500, deltaX: 0, deltaY: -NOTCH, buttons: 0 });
    await sleep(55);
  }
  await sleep(1100);
  const s = await ev(`(() => { window.__on = false;
    return { distinct: new Set(window.__z).size, frames: window.__z.length }; })()`);
  const z1 = await ev(`__map.getZoom()`);
  return { gained: +(z1 - z0).toFixed(3), settledWhole: Number.isInteger(z1), continuity: s };
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
await click("#back"); await frame2();
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
  detailOpen: await ev(`!document.getElementById('view-detail').hidden`),
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
  document.querySelectorAll('#panel, #panel *').forEach(el => {
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
  document.querySelectorAll('#panel, #panel *').forEach(el => {
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
  siteAboveSheet: await ev(`(() => {
    const p = document.getElementById('panel').getBoundingClientRect();
    const s = ICONIC.sites.find(x => x.badge === 'Waikiki');
    const q = __map.latLngToContainerPoint([s.latitude, s.longitude]);
    return { y: Math.round(q.y), sheetTop: Math.round(p.top), clear: q.y < p.top };
  })()`),
  consoleClean: errors.length === 0 ? true : errors.slice(0, 3)
};

console.log(JSON.stringify(out, null, 1));
ws.close(); chrome.kill();
await rm(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});

// Expectations, so a future run does not have to re-derive them:
//   consoleClean true · mapIsFullBleed true · panelIsMapSibling true
//   rowsBuilt 40 · markersOnMap 53 · initialFitClearOfPanel.behindPanel 0
//   search.visibleRows 1 · searchMatchesSiteName ["Arches"] · noMatch.markers 0
//   chips.afterDropEurope 27 · afterAll 40
//   detailFromRow: title "Tesla Diner", focusMovedToBack "back",
//     ariaCurrentRows 1, markerSelected 1, noPopupAnywhere true, clear true
//   back.focusReturnedToRow "Tesla Diner" · hashCleared true
//   deepLink.siteRows 9 · afterPickingSite4 facts follow the picked site
//   filterAwaySelection: detailClosed true, staleAriaCurrent 0, selectedMarkers 0
//   wheelOverPanel: listScrolled true, mapZoomUnchanged true
//   wheelOverMap: gained > 0, settledWhole true, continuity.distinct >> 3
//   nearMe.promptedOnLoad 0 · granted.firstFour starts "Stonehenge" · ascending true
//   nearMe.denied.msg mentions permission · achromaticPanel [] · blueUsage []
//   narrow.panelIsBottomSheet all true · siteAboveSheet.clear true
