#!/usr/bin/env node

// Browser smoke test for generated map entry points.
//
//   python3 -m http.server 8732 --bind 127.0.0.1 --directory .site
//   node scripts/verify_site_browser.mjs [site-root-url]
//
// This intentionally tests the generated locale URLs rather than the source
// `/web/index.html`: path locale precedence and in-place path replacement only
// exist on the published entry points.
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

  const candidates = process.platform === "darwin"
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
  for (const candidate of candidates) {
    const resolved = executablePath(candidate);
    if (resolved) return resolved;
  }
  throw new Error(
    `Chrome or Chromium was not found on ${process.platform}. ` +
    "Install it or set CHROME_BIN to its executable path.",
  );
}

function siteRoot(argument) {
  const value = new URL(argument || "http://127.0.0.1:8732/");
  value.pathname = value.pathname.endsWith("/") ? value.pathname : `${value.pathname}/`;
  value.search = "";
  value.hash = "";
  return value;
}

function assert(condition, message, details) {
  if (condition) return;
  const suffix = details === undefined ? "" : `\n${JSON.stringify(details, null, 2)}`;
  throw new Error(`${message}${suffix}`);
}

function nearlyEqual(left, right, epsilon = 1e-5) {
  return Math.abs(left - right) <= epsilon;
}

function assertCameraEqual(before, after) {
  for (const key of ["lng", "lat", "zoom", "bearing", "pitch"]) {
    assert(nearlyEqual(before[key], after[key]), `locale switch changed camera ${key}`, {
      before: before[key], after: after[key],
    });
  }
  for (const key of ["top", "right", "bottom", "left"]) {
    assert(nearlyEqual(before.padding[key], after.padding[key]), `locale switch changed camera padding ${key}`, {
      before: before.padding[key], after: after.padding[key],
    });
  }
}

function assertMetadataState(state, locale) {
  const expected = state.routeMeta;
  assert(Boolean(expected), `${locale} route metadata fixture missing`, state);
  assert(state.title === expected.title && state.description === expected.description,
    `${locale} document metadata differs from routed locale`, state);
  assert(state.canonical === expected.canonical && state.ogUrl === expected.canonical,
    `${locale} canonical/Open Graph URL differs from routed locale`, state);
  assert(state.ogTitle === expected.title && state.ogDescription === expected.description &&
    state.ogLocale === expected.ogLocale && state.ogImageAlt === expected.description,
    `${locale} Open Graph metadata differs from routed locale`, state);
  assert(state.twitterTitle === expected.title && state.twitterDescription === expected.description &&
    state.twitterImageAlt === expected.description,
    `${locale} Twitter metadata differs from routed locale`, state);
  assert(state.webPage?.url === expected.canonical && state.webPage?.id === `${expected.canonical}#webpage` &&
    state.webPage?.name === expected.title && state.webPage?.inLanguage === locale &&
    state.webPage?.description === expected.description,
    `${locale} WebPage JSON-LD differs from routed locale`, state);
  assert(state.webSite?.id === "https://iconicchargers.com/#website" &&
    state.webSite?.url === "https://iconicchargers.com/" && state.webSite?.languageCount === 18 &&
    state.person?.url === "https://www.parzival.live/" &&
    state.person?.sameAs?.includes("https://github.com/LakshmanTurlapati"),
    `${locale} stable WebSite/Person JSON-LD differs`, state);
  assert(!state.hasAutomaticOption, `${locale} published selector exposed automatic locale`, state);
}

const CHROME = findChrome();
const ROOT = siteRoot(process.argv[2]);
const initialURL = new URL("fr/", ROOT);
initialURL.searchParams.set("verifySite", "locale-routing");
initialURL.hash = encodeURIComponent("Tesla Diner");
const DEBUG_PORT = 9500 + (process.pid % 300);
const PROFILE = `/tmp/iconic-site-browser-${process.pid}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${PROFILE}`,
  "--window-size=1500,900",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-timer-throttling",
  "--disable-renderer-backgrounding",
  "--disable-backgrounding-occluded-windows",
  "about:blank",
], { stdio: "ignore" });
let chromeLaunchError;
chrome.once("error", (error) => { chromeLaunchError = error; });

async function browserTarget() {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (chromeLaunchError) break;
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const pages = (await response.json()).filter((target) => target.type === "page");
      if (pages[0]?.webSocketDebuggerUrl) return pages[0].webSocketDebuggerUrl;
    } catch {}
    await sleep(100);
  }
  throw new Error(chromeLaunchError
    ? `Could not launch Chrome at ${CHROME}: ${chromeLaunchError.message}`
    : `Chrome at ${CHROME} did not expose a debuggable page on port ${DEBUG_PORT}`);
}

let socket;
let report;
try {
  socket = new WebSocket(await browserTarget());
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let sequence = 0;
  const pending = new Map();
  const pageExceptions = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") {
      const detail = message.params.exceptionDetails;
      pageExceptions.push(detail.exception?.description || detail.text || "page exception");
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++sequence, { resolve, reject });
    socket.send(JSON.stringify({ id: sequence, method, params }));
  });
  const evaluate = async (expression, awaitPromise = false) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "evaluation failed");
    }
    return result.result.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    try { localStorage.setItem('iconic.locale.v1', 'ja'); } catch (_) {}
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, options) {
      if (String(input) !== 'https://api.country.is/') return nativeFetch(input, options);
      options = options || {};
      window.__countryRequest = {url:String(input),credentials:options.credentials,
        referrerPolicy:options.referrerPolicy,headers:options.headers || null};
      return Promise.resolve({ok:true,json:function () {
        return Promise.resolve({ip:'203.0.113.1',country:'US'});
      }});
    };
    Object.defineProperty(window, 'maplibregl', {
      configurable: true,
      set: function (value) {
        value.Map = new Proxy(value.Map, { construct: function (Target, args, NewTarget) {
          var instance = Reflect.construct(Target, args, NewTarget);
          window.__map = instance;
          return instance;
        }});
        Object.defineProperty(window, 'maplibregl', {
          value: value, writable: true, configurable: true
        });
      },
      get: function () { return undefined; }
    });
  ` });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1500,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  async function waitForMap(locale, timeoutMs = 35000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const ready = await evaluate(`(() => {
        return !!window.__map && __map.isStyleLoaded() &&
          document.querySelectorAll('.pin').length === window.ICONIC?.site_count &&
          window.__ICONIC_I18N__?.locale === ${JSON.stringify(locale)} &&
          document.querySelector('.item[aria-current="true"]')?.dataset.badge === 'Tesla Diner' &&
          !document.getElementById('detail').hidden;
      })()`);
      if (ready) {
        while (Date.now() - started < timeoutMs && await evaluate("__map.isMoving()")) await sleep(100);
        await sleep(200);
        return;
      }
      await sleep(100);
    }
    throw new Error(`generated ${locale} map did not become ready within ${timeoutMs} ms`);
  }

  const snapshot = () => evaluate(`(() => {
    var center = __map.getCenter();
    var padding = __map.getPadding();
    var current = document.querySelector('.item[aria-current="true"]');
    var jsonLd = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    var graph = jsonLd['@graph'];
    var webPage = graph.find(function (node) { return node['@type'] === 'WebPage'; });
    var webSite = graph.find(function (node) { return node['@type'] === 'WebSite'; });
    var person = graph.find(function (node) { return node['@type'] === 'Person'; });
    return {
      href: location.href,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      decodedHash: decodeURIComponent(location.hash.slice(1)),
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      locale: window.__ICONIC_I18N__?.locale,
      country: window.__ICONIC_I18N__?.country || null,
      miles: window.__ICONIC_I18N__?.miles,
      countryRequest: window.__countryRequest || null,
      languageValue: document.getElementById('language').value,
      storedLocale: localStorage.getItem('iconic.locale.v1'),
      hasAutomaticOption: !!document.querySelector('#language option[value="auto"]'),
      pinCount: document.querySelectorAll('.pin').length,
      selectedPinCount: document.querySelectorAll('.pin.is-selected').length,
      selectedBadge: current?.dataset.badge || null,
      detailOpen: !document.getElementById('detail').hidden,
      searchInput: document.getElementById('q').value,
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content || null,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || null,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
      ogDescription: document.querySelector('meta[property="og:description"]')?.content || null,
      ogLocale: document.querySelector('meta[property="og:locale"]')?.content || null,
      ogImageAlt: document.querySelector('meta[property="og:image:alt"]')?.content || null,
      twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content || null,
      twitterDescription: document.querySelector('meta[name="twitter:description"]')?.content || null,
      twitterImageAlt: document.querySelector('meta[name="twitter:image:alt"]')?.content || null,
      routeMeta: window.ICONIC_ROUTE_META?.[window.__ICONIC_I18N__?.locale] || null,
      webPage: webPage ? { id: webPage['@id'], url: webPage.url, name: webPage.name,
        inLanguage: webPage.inLanguage, description: webPage.description } : null,
      webSite: webSite ? { id: webSite['@id'], url: webSite.url,
        languageCount: Array.isArray(webSite.inLanguage) ? webSite.inLanguage.length : 0 } : null,
      person: person ? { url: person.url, sameAs: person.sameAs } : null,
      styleLoaded: __map.isStyleLoaded(),
      camera: {
        lng: center.lng,
        lat: center.lat,
        zoom: __map.getZoom(),
        bearing: __map.getBearing(),
        pitch: __map.getPitch(),
        padding: padding
      }
    };
  })()`);

  await send("Page.navigate", { url: initialURL.href });
  await waitForMap("fr");
  const readyFrench = await snapshot();

  // Give the selected map a deliberately user-controlled camera and query so
  // the switch proves those states survive rather than merely landing at the
  // same defaults twice.
  await sleep(1500);
  await evaluate(`(() => {
    var map = window.__map;
    map.stop();
    map.jumpTo({
      center: map.getCenter(),
      zoom: Math.min(map.getMaxZoom() - 0.5, Math.max(map.getMinZoom() + 0.5, map.getZoom() + 0.25)),
      bearing: 17,
      pitch: 43
    });
    var query = document.getElementById('q');
    query.value = 'diner';
    query.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(250);
  const french = await snapshot();

  assert(french.pathname === "/fr/", "French generated route was not loaded", french);
  assert(french.locale === "fr" && french.lang === "fr" && french.languageValue === "fr",
    "French path locale did not win", french);
  assert(readyFrench.country === "US" && readyFrench.miles === true &&
    readyFrench.countryRequest?.url === "https://api.country.is/" &&
    readyFrench.countryRequest?.credentials === "omit" &&
    readyFrench.countryRequest?.referrerPolicy === "no-referrer" &&
    readyFrench.countryRequest?.headers == null,
    "fixed French route did not keep language-independent private country detection", readyFrench);
  assert(french.storedLocale === "ja", "preloaded conflicting saved locale was not present", french);
  assert(readyFrench.pinCount === 53 && readyFrench.styleLoaded,
    "generated map did not render all 53 locations before filtering", readyFrench);
  assert(french.pinCount === 1 && french.searchInput === "diner",
    "live search query did not narrow the generated map", french);
  assert(french.selectedBadge === "Tesla Diner" && french.selectedPinCount === 1 && french.detailOpen,
    "French deep link did not retain its selection and detail", french);
  assert(french.search === "?verifySite=locale-routing" && french.decodedHash === "Tesla Diner",
    "French route lost its query string or hash", french);
  assertMetadataState(french, "fr");

  await evaluate(`(() => {
    var language = document.getElementById('language');
    language.value = 'de';
    language.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(350);
  const german = await snapshot();

  assert(german.pathname === "/de/", "locale selector did not replace the locale path", german);
  assert(german.locale === "de" && german.lang === "de" && german.languageValue === "de",
    "locale selector did not apply German in place", german);
  assert(german.search === french.search && german.hash === french.hash,
    "locale selector did not preserve the query string and hash", { french, german });
  assert(german.searchInput === french.searchInput && german.searchInput === "diner",
    "locale selector did not preserve the live search query", { french, german });
  assert(german.selectedBadge === french.selectedBadge && german.selectedPinCount === french.selectedPinCount && german.detailOpen,
    "locale selector did not preserve selection/detail state", { french, german });
  assertMetadataState(german, "de");
  assertCameraEqual(french.camera, german.camera);

  // The preload script restores a conflicting saved Japanese preference before
  // every document. Reloading /de/ therefore proves the generated path wins at
  // bootstrap, not only during the in-page selector event.
  await send("Page.reload", { ignoreCache: true });
  await waitForMap("de");
  const reloaded = await snapshot();

  assert(reloaded.pathname === "/de/" && reloaded.search === german.search && reloaded.hash === german.hash,
    "German reload did not preserve the routed URL", { german, reloaded });
  assert(reloaded.locale === "de" && reloaded.lang === "de" && reloaded.languageValue === "de",
    "German path locale did not bootstrap after reload", reloaded);
  assert(reloaded.storedLocale === "ja", "reload did not restore the conflicting saved locale fixture", reloaded);
  assert(reloaded.selectedBadge === "Tesla Diner" && reloaded.selectedPinCount === 1 && reloaded.detailOpen,
    "German reload did not restore the deep-link selection", reloaded);
  assert(reloaded.pinCount === 53 && reloaded.styleLoaded, "German reload did not render all locations", reloaded);
  assertMetadataState(reloaded, "de");

  // Without a deep link or other user intent, that same fixed French route
  // uses the country only for units and its one-shot startup camera.
  await evaluate(`sessionStorage.clear()`);
  const overviewURL = new URL("fr/", ROOT);
  overviewURL.searchParams.set("verifySite", "country-framing");
  await send("Page.navigate", { url: overviewURL.href });
  for (let i = 0; i < 350; i++) {
    const ready = await evaluate(`!!window.__map && __map.isStyleLoaded() &&
      document.querySelectorAll('.pin').length === 53 &&
      window.__ICONIC_I18N__?.locale === 'fr' && window.__ICONIC_I18N__?.country === 'US' &&
      !__map.isMoving()`);
    if (ready) break;
    await sleep(100);
  }
  await sleep(200);
  const countryOverview = await snapshot();
  countryOverview.frame = await evaluate(`(() => {
    const sites = ICONIC.sites.filter(s => s.country === 'USA');
    const panel = document.getElementById('panel').getBoundingClientRect();
    const clear = sites.filter(s => {
      const q = __map.project([s.longitude,s.latitude]);
      return q.x >= 22 && q.x <= panel.left - 22 && q.y >= 22 && q.y <= innerHeight - 22;
    }).length;
    return {sites:sites.length,clear:clear,zoom:__map.getZoom(),minZoom:__map.getMinZoom()};
  })()`);
  assert(countryOverview.locale === "fr" && countryOverview.lang === "fr" &&
    countryOverview.languageValue === "fr" && countryOverview.country === "US" &&
    countryOverview.miles === true,
    "country framing changed the fixed French route language", countryOverview);
  assert(countryOverview.pinCount === 53 && !countryOverview.detailOpen &&
    countryOverview.frame.sites === 18 && countryOverview.frame.clear === 18 &&
    countryOverview.frame.zoom <= 5.000001 &&
    countryOverview.frame.zoom > countryOverview.frame.minZoom + 0.01,
    "published route did not frame the detected country's chargers", countryOverview);
  assert(countryOverview.countryRequest?.credentials === "omit" &&
    countryOverview.countryRequest?.referrerPolicy === "no-referrer" &&
    countryOverview.countryRequest?.headers == null,
    "published country framing request lost its privacy contract", countryOverview.countryRequest);
  assertMetadataState(countryOverview, "fr");
  assert(pageExceptions.length === 0, "page raised JavaScript exceptions", pageExceptions);

  report = {
    ok: true,
    chrome: CHROME,
    ready: readyFrench,
    initial: french,
    switched: german,
    reloaded,
    countryOverview,
  };
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  if (report) console.error(JSON.stringify(report, null, 2));
  throw error;
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill();
  await rm(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
}
