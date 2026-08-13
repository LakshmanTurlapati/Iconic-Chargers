#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { seoCopy, seoCopyRequirements, seoTranslationCatalog, supportedSeoLocales } from "./seo-copy.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const args = process.argv.slice(2);
const skipDeterminism = args.includes("--skip-determinism");
const outputArg = args.find((arg) => !arg.startsWith("--"));
const OUT = path.resolve(outputArg || path.join(ROOT, ".site"));
const ORIGIN = "https://iconicchargers.com";
const OG_LOCALES = {
  en: "en_US", fr: "fr_FR", de: "de_DE", nl: "nl_NL", nb: "nb_NO", nn: "nn_NO",
  it: "it_IT", es: "es_ES", tr: "tr_TR", cs: "cs_CZ", he: "he_IL", ar: "ar_SA",
  ja: "ja_JP", ko: "ko_KR", "zh-Hans": "zh_CN", "zh-Hant": "zh_TW",
  "yue-Hant": "yue_HK", mi: "mi_NZ"
};
const SEO_HREFLANG = Object.fromEntries(supportedSeoLocales.map((key) => [key, key]));
SEO_HREFLANG["yue-Hant"] = "zh-Hant-HK";
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/iconic-badges.json"), "utf8"));
const slugs = JSON.parse(fs.readFileSync(path.join(ROOT, "data/seo-slugs.json"), "utf8"));
const locales = loadLocales();
const failures = [];
const expected = expectedRoutes();

check(fs.existsSync(OUT), `output directory does not exist: ${OUT}`);
if (fs.existsSync(OUT)) {
  verifySeoCopyCatalog();
  verifyRouteInventory();
  verifyHtmlPages();
  verifyFeeds();
  verifyDiscovery();
  verifySupportFiles();
  if (!skipDeterminism) verifyDeterminism();
}

function verifySeoCopyCatalog() {
  for (const localeKey of supportedSeoLocales.filter((key) => key !== "en")) {
    const raw = seoTranslationCatalog[localeKey];
    check(Boolean(raw), `${localeKey}: SEO translation object missing`);
    if (!raw) continue;
    for (const group of ["labels", "text"]) {
      for (const key of seoCopyRequirements[group]) {
        check(typeof raw[group]?.[key] === "string" && raw[group][key].trim(), `${localeKey}: SEO ${group}.${key} translation missing`);
        check(seoCopy(localeKey)[group][key] === raw[group]?.[key], `${localeKey}: SEO ${group}.${key} unexpectedly fell back`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Static-site verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Static-site verification passed: ${expected.length} localized routes, 40 badges, 53 locations, 18 locales${skipDeterminism ? "" : ", deterministic rebuilds"}.`);

function loadLocales() {
  const context = { window: { ICONIC: data }, Intl };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "web/locales.js"), "utf8"), context, { filename: "web/locales.js" });
  return context.window.ICONIC_I18N.locales;
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

function localePrefix(localeKey) {
  return localeKey === "en" ? "" : `/${localeKey}`;
}

function pagePath(localeKey, type, entity) {
  const prefix = localePrefix(localeKey);
  if (type === "home") return `${prefix}/` || "/";
  if (["badges", "locations", "about", "data"].includes(type)) return `${prefix}/${type}/`;
  if (type === "badge") return `${prefix}/badges/${slugs.badges[entity.badge]}/`;
  if (type === "location") return `${prefix}/locations/${entity.supercharge_info_id}-${slugs.locations[String(entity.supercharge_info_id)]}/`;
  throw new Error(`unknown type ${type}`);
}

function fileForRoute(route) {
  return path.join(OUT, route.replace(/^\//, ""), "index.html");
}

function expectedRoutes() {
  const routes = [];
  for (const localeKey of supportedSeoLocales) {
    for (const type of ["home", "badges", "locations", "about", "data"]) {
      routes.push({ localeKey, type, entity: undefined, route: pagePath(localeKey, type) });
    }
    for (const badge of data.badges) routes.push({ localeKey, type: "badge", entity: badge, route: pagePath(localeKey, "badge", badge) });
    for (const site of data.sites) routes.push({ localeKey, type: "location", entity: site, route: pagePath(localeKey, "location", site) });
  }
  return routes;
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function verifyRouteInventory() {
  check(supportedSeoLocales.length === 18, "locale catalog must contain 18 SEO locales");
  check(data.badges.length === 40 && data.badge_count === 40, "source must contain exactly 40 badges");
  check(data.sites.length === 53 && data.site_count === 53, "source must contain exactly 53 locations");
  check(expected.length === 1764, `expected route calculation yielded ${expected.length}, not 1764`);
  const actualIndexes = walk(OUT).filter((file) => path.basename(file) === "index.html");
  check(actualIndexes.length === expected.length, `found ${actualIndexes.length} generated index pages, expected ${expected.length}`);
  const expectedFiles = new Set(expected.map(({ route }) => fileForRoute(route)));
  for (const file of actualIndexes) check(expectedFiles.has(file), `unexpected index page: ${path.relative(OUT, file)}`);
  for (const file of expectedFiles) check(fs.existsSync(file), `missing index page: ${path.relative(OUT, file)}`);
  check(Object.keys(slugs.badges).length === 40, "frozen badge slug count is not 40");
  check(Object.keys(slugs.locations).length === 53, "frozen location slug count is not 53");
}

function verifyHtmlPages() {
  for (const item of expected) {
    const file = fileForRoute(item.route);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    const label = item.route;
    const locale = locales[item.localeKey];
    check(new RegExp(`<html\\s+lang="${regexEscape(item.localeKey)}"\\s+dir="${locale.dir}"`, "i").test(html), `${label}: incorrect lang/dir`);
    check(extractSingle(html, /<link rel="canonical" href="([^"]+)">/g, `${label}: canonical`) === `${ORIGIN}${item.route}`, `${label}: canonical URL mismatch`);
    check(Boolean(extractSingle(html, /<title>([\s\S]*?)<\/title>/g, `${label}: title`)?.trim()), `${label}: missing title`);
    check(Boolean(extractSingle(html, /<meta name="description" content="([^"]+)">/g, `${label}: description`)?.trim()), `${label}: missing description`);
    check(html.includes('<meta name="author" content="Lakshman Turlapati">'), `${label}: author metadata missing`);
    check(html.includes(`${ORIGIN}/og.png`), `${label}: absolute social-card URL missing`);
    const socialAlt = escapeHtml(seoCopy(item.localeKey).text.intro);
    check(extractSingle(html, /<meta property="og:image:alt" content="([^"]+)">/g, `${label}: Open Graph image alt`) === socialAlt, `${label}: localized Open Graph image alt differs`);
    check(extractSingle(html, /<meta name="twitter:image:alt" content="([^"]+)">/g, `${label}: Twitter image alt`) === socialAlt, `${label}: localized Twitter image alt differs`);
    check(html.includes('<meta name="twitter:card" content="summary_large_image">'), `${label}: Twitter card missing`);
    check(extractSingle(html, /<meta property="og:locale" content="([^"]+)">/g, `${label}: Open Graph locale`) === OG_LOCALES[item.localeKey], `${label}: invalid Open Graph locale`);
    check(extractSingle(html, /<meta name="robots" content="([^"]+)">/g, `${label}: robots metadata`) === "index, follow, max-image-preview:large", `${label}: canonical page is not indexable`);
    check(!html.includes("LocalBusiness"), `${label}: must not claim LocalBusiness`);
    verifyAlternates(html, item);
    verifyJsonLd(html, item);

    if (item.type === "home") {
      const charsetAt = html.search(/<meta charset="utf-8">/i);
      const bodyAt = html.search(/^<body>$/m);
      const bodyEndAt = html.indexOf("</body>");
      const noScriptAt = html.indexOf("<noscript>");
      check(charsetAt >= 0 && charsetAt < 1024, `${label}: character encoding must be declared within the first 1024 bytes`);
      check((html.match(/^<body>$/gm) || []).length === 1 && bodyAt >= 0, `${label}: expected one real opening body element`);
      check((html.match(/<noscript>/g) || []).length === 1, `${label}: expected one no-JavaScript fallback`);
      check(noScriptAt > bodyAt && noScriptAt < bodyEndAt, `${label}: no-JavaScript fallback must be inside the body`);
      check(html.includes(`<script>window.ICONIC_PATH_LOCALE=${JSON.stringify(item.localeKey)};window.ICONIC_ROUTE_META=`), `${label}: path locale bootstrap missing`);
      verifyRouteMetadataCatalog(html, item);
      check(html.includes("<noscript>"), `${label}: no-JavaScript explanation missing`);
      check(html.includes("<base href=\"/\">"), `${label}: root asset base missing`);
      check(html.includes(`>${escapeHtml(locale.ui.heading)}<`), `${label}: localized server-rendered map heading missing`);
      check(html.includes(`>${escapeHtml(locale.ui.projectNote)}<`), `${label}: localized server-rendered project note missing`);
      check(html.includes(`href="${pagePath(item.localeKey, "about")}">${escapeHtml(locale.ui.navAbout)}</a>`), `${label}: localized About navigation missing`);
      check(html.includes(`href="${pagePath(item.localeKey, "data")}">${escapeHtml(locale.ui.navData)}</a>`), `${label}: localized Data navigation missing`);
    } else {
      check(html.includes("<main class=\"wrap\">"), `${label}: server-rendered main content missing`);
      check(!/<script\b[^>]*\bsrc=/i.test(html), `${label}: static content page unexpectedly requires JavaScript`);
    }

    if (item.type === "badge") {
      const badge = item.entity;
      const localized = locale.badges[badge.badge] || locales.en.badges[badge.badge];
      check(html.includes(`<bdi>${escapeHtml(badge.badge)}</bdi>`), `${label}: badge name missing`);
      check(html.includes(escapeHtml(localized.why)), `${label}: localized badge explanation missing`);
      check((html.match(/class="card"/g) || []).length === badge.site_count, `${label}: linked location count differs from badge`);
      for (const site of data.sites.filter((candidate) => candidate.badge === badge.badge)) {
        check(html.includes(pagePath(item.localeKey, "location", site)), `${label}: missing linked location ${site.supercharge_info_id}`);
      }
    }
    if (item.type === "location") {
      const site = item.entity;
      const badge = data.badges.find((candidate) => candidate.badge === site.badge);
      check(html.includes(`<code>${site.supercharge_info_id}</code>`), `${label}: Supercharge.info ID missing`);
      check(html.includes(escapeHtml(site.name)), `${label}: location name missing`);
      check(html.includes(Number(site.latitude).toFixed(6)) && html.includes(Number(site.longitude).toFixed(6)), `${label}: coordinates missing`);
      check(html.includes(pagePath(item.localeKey, "badge", badge)), `${label}: badge relationship link missing`);
      check(html.includes(escapeHtml(site.status)), `${label}: status missing`);
    }
    if (item.type === "badges") check((html.match(/class="card"/g) || []).length === 40, `${label}: badge directory does not expose 40 cards`);
    if (item.type === "locations") check((html.match(/class="card"/g) || []).length === 53, `${label}: location directory does not expose 53 cards`);
    if (item.type === "data") {
      for (const name of ["iconic-badges.json", "locations.json", "locations.csv", "locations.geojson"]) check(html.includes(`/data/${name}`), `${label}: missing ${name} link`);
      check(html.includes("Turlapati, Lakshman."), `${label}: preferred citation missing`);
    }
  }
}

function verifyRouteMetadataCatalog(html, item) {
  const match = html.match(/window\.ICONIC_ROUTE_META=(\{[^<]+\});<\/script>/);
  check(Boolean(match), `${item.route}: route metadata catalog missing`);
  if (!match) return;
  let catalog;
  try { catalog = JSON.parse(match[1]); }
  catch (error) { failures.push(`${item.route}: route metadata catalog does not parse (${error.message})`); return; }
  check(Object.keys(catalog).length === supportedSeoLocales.length, `${item.route}: route metadata locale count differs`);
  for (const localeKey of supportedSeoLocales) {
    check(JSON.stringify(catalog[localeKey]) === JSON.stringify({
      title: locales[localeKey].ui.documentTitle,
      description: seoCopy(localeKey).text.intro,
      canonical: `${ORIGIN}${pagePath(localeKey, "home")}`,
      ogLocale: OG_LOCALES[localeKey]
    }), `${item.route}: ${localeKey} route metadata differs`);
  }
}

function extractSingle(text, pattern, label) {
  const values = [...text.matchAll(pattern)].map((match) => match[1]);
  check(values.length === 1, `${label} appears ${values.length} times`);
  return values[0];
}

function verifyAlternates(html, item) {
  const found = new Map([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((match) => [match[1], match[2]]));
  check(found.size === 19, `${item.route}: expected 18 hreflang alternates plus x-default, found ${found.size}`);
  for (const localeKey of supportedSeoLocales) {
    check(found.get(SEO_HREFLANG[localeKey]) === `${ORIGIN}${pagePath(localeKey, item.type, item.entity)}`, `${item.route}: bad ${SEO_HREFLANG[localeKey]} alternate`);
  }
  check(found.get("x-default") === `${ORIGIN}${pagePath("en", item.type, item.entity)}`, `${item.route}: bad x-default alternate`);
}

function verifyJsonLd(html, item) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check(scripts.length === 1, `${item.route}: expected one JSON-LD block, found ${scripts.length}`);
  if (!scripts.length) return;
  let json;
  try { json = JSON.parse(scripts[0][1]); }
  catch (error) { failures.push(`${item.route}: JSON-LD does not parse (${error.message})`); return; }
  const graph = Array.isArray(json["@graph"]) ? json["@graph"] : [json];
  const node = (type) => graph.find((candidate) => candidate["@type"] === type);
  const copy = seoCopy(item.localeKey);
  const canonical = `${ORIGIN}${item.route}`;
  if (item.type === "home") {
    const person = node("Person");
    const website = node("WebSite");
    const webpage = node("WebPage");
    check(JSON.stringify(person) === JSON.stringify({
      "@type": "Person", "@id": `${ORIGIN}/#lakshman-turlapati`, name: "Lakshman Turlapati",
      url: "https://www.parzival.live/", sameAs: ["https://github.com/LakshmanTurlapati"]
    }), `${item.route}: Person entity differs`);
    check(JSON.stringify(website) === JSON.stringify({
      "@type": "WebSite", "@id": `${ORIGIN}/#website`, name: "Iconic Chargers", url: `${ORIGIN}/`,
      inLanguage: supportedSeoLocales, description: seoCopy("en").text.intro,
      creator: { "@id": `${ORIGIN}/#lakshman-turlapati` }, publisher: { "@id": `${ORIGIN}/#lakshman-turlapati` }
    }), `${item.route}: stable WebSite entity differs`);
    check(webpage?.["@id"] === `${canonical}#webpage` && webpage?.url === canonical &&
      webpage?.name === locales[item.localeKey].ui.documentTitle && webpage?.inLanguage === item.localeKey &&
      webpage?.description === copy.text.intro && webpage?.isPartOf?.["@id"] === `${ORIGIN}/#website` &&
      webpage?.author?.["@id"] === `${ORIGIN}/#lakshman-turlapati`, `${item.route}: localized WebPage entity differs`);
    return;
  }

  verifyBreadcrumb(node("BreadcrumbList"), item, copy);

  if (["badges", "locations", "badge"].includes(item.type)) {
    const collection = node("CollectionPage");
    let entities;
    let expectedName;
    let expectedDescription;
    if (item.type === "badges") {
      entities = data.badges.map((badge) => ({ name: badge.badge, url: `${ORIGIN}${pagePath(item.localeKey, "badge", badge)}` }));
      expectedName = copy.labels.badgeDirectory;
      expectedDescription = copy.text.badgeIntro;
    } else if (item.type === "locations") {
      entities = data.sites.map((site) => ({ name: site.name, url: `${ORIGIN}${pagePath(item.localeKey, "location", site)}` }));
      expectedName = copy.labels.locationDirectory;
      expectedDescription = copy.text.locationIntro;
    } else {
      const localized = locales[item.localeKey].badges[item.entity.badge] || locales.en.badges[item.entity.badge];
      entities = data.sites.filter((site) => site.badge === item.entity.badge).map((site) => ({ name: site.name, url: `${ORIGIN}${pagePath(item.localeKey, "location", site)}` }));
      expectedName = item.entity.badge;
      expectedDescription = localized.why;
    }
    check(collection?.url === canonical && collection?.name === expectedName && collection?.inLanguage === item.localeKey && collection?.description === expectedDescription, `${item.route}: CollectionPage identity differs`);
    const list = collection?.mainEntity;
    check(list?.["@type"] === "ItemList" && list?.numberOfItems === entities.length, `${item.route}: ItemList count differs`);
    check(JSON.stringify(list?.itemListElement) === JSON.stringify(entities.map((entity, index) => ({
      "@type": "ListItem", position: index + 1, name: entity.name, url: entity.url
    }))), `${item.route}: ItemList contents differ`);
  }
  if (item.type === "location") {
    const site = item.entity;
    const place = node("Place");
    const webpage = node("WebPage");
    const stablePlaceId = `${ORIGIN}${pagePath("en", "location", site)}#place`;
    const expectedAddress = { "@type": "PostalAddress" };
    if (site.address) expectedAddress.streetAddress = site.address;
    if (site.city) expectedAddress.addressLocality = site.city;
    if (site.state) expectedAddress.addressRegion = site.state;
    if (site.country) expectedAddress.addressCountry = site.country;
    const identifiers = [
      { "@type": "PropertyValue", propertyID: "Supercharge.info", value: String(site.supercharge_info_id) },
      ...(site.tesla_location_id ? [{ "@type": "PropertyValue", propertyID: "Tesla location", value: String(site.tesla_location_id) }] : [])
    ];
    check(place?.["@id"] === stablePlaceId && place?.name === site.name, `${item.route}: stable Place identity differs`);
    check(JSON.stringify(place?.address) === JSON.stringify(expectedAddress), `${item.route}: PostalAddress differs`);
    check(JSON.stringify(place?.geo) === JSON.stringify({ "@type": "GeoCoordinates", latitude: site.latitude, longitude: site.longitude }), `${item.route}: GeoCoordinates differ`);
    check(JSON.stringify(place?.identifier) === JSON.stringify(identifiers), `${item.route}: Place identifiers differ`);
    const localized = locales[item.localeKey].badges[site.badge] || locales.en.badges[site.badge];
    check(webpage?.url === canonical && webpage?.inLanguage === item.localeKey && webpage?.name === site.name &&
      webpage?.description === `${site.name}: ${localized.why}` && webpage?.mainEntity?.["@id"] === stablePlaceId,
      `${item.route}: localized location WebPage differs`);
  }
  if (item.type === "about") {
    const about = node("AboutPage");
    check(about?.url === canonical && about?.inLanguage === item.localeKey && about?.description === copy.text.aboutIntro &&
      about?.author?.name === "Lakshman Turlapati", `${item.route}: AboutPage entity differs`);
  }
  if (item.type === "data") {
    const dataset = node("Dataset");
    const webpage = node("WebPage");
    const datasetId = `${ORIGIN}/data/#dataset`;
    check(webpage?.["@id"] === `${canonical}#webpage` && webpage?.url === canonical && webpage?.inLanguage === item.localeKey &&
      webpage?.description === copy.text.dataIntro && webpage?.mainEntity?.["@id"] === datasetId, `${item.route}: localized data WebPage differs`);
    check(dataset?.["@id"] === datasetId && dataset?.url === `${ORIGIN}/data/` && dataset?.inLanguage === "en" &&
      dataset?.description === seoCopy("en").text.dataIntro && dataset?.dateModified === data.snapshot_date &&
      dataset?.creator?.name === "Lakshman Turlapati" && dataset?.license === `${ORIGIN}/DATA-RIGHTS.md` &&
      JSON.stringify(dataset?.isBasedOn) === JSON.stringify(["https://www.tesla.com/support/tesla-app/charging-badges", "https://supercharge.info"]), `${item.route}: stable Dataset entity differs`);
    const expectedDownloads = [
      ["iconic-badges.json", "application/json"], ["locations.json", "application/json"],
      ["locations.csv", "text/csv"], ["locations.geojson", "application/geo+json"]
    ].map(([name, encodingFormat]) => ({ "@type": "DataDownload", name, encodingFormat, contentUrl: `${ORIGIN}/data/${name}` }));
    check(JSON.stringify(dataset?.distribution) === JSON.stringify(expectedDownloads), `${item.route}: Dataset distributions differ`);
  }
}

function verifyBreadcrumb(breadcrumb, item, copy) {
  let entries = [{ name: "Iconic Chargers", item: `${ORIGIN}${pagePath(item.localeKey, "home")}` }];
  if (item.type === "badges") entries.push({ name: copy.labels.badges, item: `${ORIGIN}${item.route}` });
  if (item.type === "locations") entries.push({ name: copy.labels.locations, item: `${ORIGIN}${item.route}` });
  if (item.type === "about") entries.push({ name: copy.labels.about, item: `${ORIGIN}${item.route}` });
  if (item.type === "data") entries.push({ name: copy.labels.data, item: `${ORIGIN}${item.route}` });
  if (item.type === "badge") entries.push(
    { name: copy.labels.badges, item: `${ORIGIN}${pagePath(item.localeKey, "badges")}` },
    { name: item.entity.badge, item: `${ORIGIN}${item.route}` }
  );
  if (item.type === "location") entries.push(
    { name: copy.labels.locations, item: `${ORIGIN}${pagePath(item.localeKey, "locations")}` },
    { name: item.entity.name, item: `${ORIGIN}${item.route}` }
  );
  const expectedItems = entries.map((entry, index) => ({ "@type": "ListItem", position: index + 1, ...entry }));
  check(breadcrumb?.["@type"] === "BreadcrumbList" && JSON.stringify(breadcrumb.itemListElement) === JSON.stringify(expectedItems), `${item.route}: BreadcrumbList differs`);
}

function verifyFeeds() {
  const badgeFeed = readOutputJson("data/iconic-badges.json");
  const locationFeed = readOutputJson("data/locations.json");
  const geojson = readOutputJson("data/locations.geojson");
  if (!badgeFeed || !locationFeed || !geojson) return;
  check(badgeFeed.badges.length === 40 && badgeFeed.badge_count === 40, "badge JSON feed count mismatch");
  check(locationFeed.locations.length === 53 && locationFeed.location_count === 53, "location JSON feed count mismatch");
  check(geojson.type === "FeatureCollection" && geojson.features.length === 53, "GeoJSON feature count mismatch");
  const ids = new Set();
  for (const sourceSite of data.sites) {
    const id = sourceSite.supercharge_info_id;
    const record = locationFeed.locations.find((candidate) => candidate.supercharge_info_id === id);
    check(Boolean(record), `location feed missing ID ${id}`);
    if (!record) continue;
    ids.add(id);
    const badge = data.badges.find((candidate) => candidate.badge === sourceSite.badge);
    const expectedRecord = {
      supercharge_info_id: sourceSite.supercharge_info_id,
      tesla_location_id: sourceSite.tesla_location_id ?? null,
      name: sourceSite.name,
      address: sourceSite.address ?? null,
      city: sourceSite.city ?? null,
      state: sourceSite.state ?? null,
      country: sourceSite.country,
      latitude: sourceSite.latitude,
      longitude: sourceSite.longitude,
      stalls: sourceSite.stalls ?? null,
      peak_power_kw: sourceSite.power_kw ?? null,
      elevation_m: sourceSite.elevation_m ?? null,
      opened: sourceSite.opened ?? null,
      status: sourceSite.status ?? null,
      badge: badge.badge,
      badge_region: badge.region,
      badge_reason: badge.reason,
      badge_reason_description: data.reasons[badge.reason],
      badge_confidence: badge.confidence,
      badge_description: badge.why,
      badge_note: badge.note ?? null,
      snapshot_date: data.snapshot_date,
      page_url: `${ORIGIN}${pagePath("en", "location", sourceSite)}`,
      badge_page_url: `${ORIGIN}${pagePath("en", "badge", badge)}`,
      map_url: `${ORIGIN}/#${encodeURIComponent(badge.badge)}`,
      badge_source: data.badge_source,
      site_source: data.site_source
    };
    check(JSON.stringify(Object.keys(record)) === JSON.stringify(Object.keys(expectedRecord)), `location ${id}: flattened field inventory differs`);
    for (const [key, value] of Object.entries(expectedRecord)) {
      check(record[key] === value, `location ${id}: ${key} differs from source`);
    }
    const feature = geojson.features.find((candidate) => candidate.id === id);
    check(Boolean(feature), `GeoJSON missing ID ${id}`);
    if (feature) {
      check(JSON.stringify(feature.geometry.coordinates) === JSON.stringify([sourceSite.longitude, sourceSite.latitude]), `GeoJSON ${id}: coordinates differ`);
      const expectedProperties = Object.fromEntries(Object.entries(record).filter(([key]) => !["latitude", "longitude"].includes(key)));
      check(JSON.stringify(feature.properties) === JSON.stringify(expectedProperties), `GeoJSON ${id}: properties differ from location JSON`);
    }
  }
  check(ids.size === 53, "location feed IDs are not complete and unique");
  for (const badge of data.badges) {
    const record = badgeFeed.badges.find((candidate) => candidate.badge === badge.badge);
    check(Boolean(record), `badge feed missing ${badge.badge}`);
    if (!record) continue;
    const expectedBadge = {
      ...badge,
      page_url: `${ORIGIN}${pagePath("en", "badge", badge)}`,
      map_url: `${ORIGIN}/#${encodeURIComponent(badge.badge)}`,
      locations: data.sites.filter((site) => site.badge === badge.badge).map((site) => ({
        supercharge_info_id: site.supercharge_info_id,
        name: site.name,
        page_url: `${ORIGIN}${pagePath("en", "location", site)}`
      }))
    };
    check(JSON.stringify(record) === JSON.stringify(expectedBadge), `badge feed record differs for ${badge.badge}`);
  }
  verifyCsv(locationFeed.locations);
}

function readOutputJson(relative) {
  const file = path.join(OUT, relative);
  if (!fs.existsSync(file)) { failures.push(`missing ${relative}`); return null; }
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { failures.push(`${relative} is invalid JSON: ${error.message}`); return null; }
}

function verifyCsv(records) {
  const file = path.join(OUT, "data/locations.csv");
  check(fs.existsSync(file), "locations.csv missing");
  if (!fs.existsSync(file)) return;
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const headers = rows.shift();
  check(rows.length === 53, `CSV contains ${rows.length} rows, expected 53`);
  check(JSON.stringify(headers) === JSON.stringify(Object.keys(records[0])), "CSV columns differ from location JSON fields");
  for (let index = 0; index < Math.min(rows.length, records.length); index += 1) {
    const fromCsv = Object.fromEntries(headers.map((header, column) => [header, rows[index][column]]));
    const record = records[index];
    for (const header of headers) {
      const expected = record[header] == null ? "" : String(record[header]);
      check(fromCsv[header] === expected, `CSV row ${index + 1} field ${header} differs from JSON`);
    }
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (rows.at(-1)?.length === 1 && rows.at(-1)[0] === "") rows.pop();
  return rows;
}

function verifyDiscovery() {
  const sitemapPath = path.join(OUT, "sitemap.xml");
  check(fs.existsSync(sitemapPath), "sitemap.xml missing");
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, "utf8");
    const blocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
    check(blocks.length === expected.length, `sitemap has ${blocks.length} URLs, expected ${expected.length}`);
    const byLocation = new Map(blocks.map((block) => [decodeXml(block.match(/<loc>([^<]+)<\/loc>/)?.[1] || ""), block]));
    check(byLocation.size === expected.length, "sitemap contains duplicate URLs");
    for (const item of expected) {
      const url = `${ORIGIN}${item.route}`;
      const block = byLocation.get(url);
      check(Boolean(block), `sitemap missing ${url}`);
      if (!block) continue;
      const alternates = [...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)];
      check(alternates.length === 19, `sitemap ${url}: alternate count is ${alternates.length}`);
      const alternateMap = new Map(alternates.map((match) => [match[1], decodeXml(match[2])]));
      for (const localeKey of supportedSeoLocales) check(alternateMap.get(SEO_HREFLANG[localeKey]) === `${ORIGIN}${pagePath(localeKey, item.type, item.entity)}`, `sitemap ${url}: bad ${SEO_HREFLANG[localeKey]} alternate`);
      check(alternateMap.get("x-default") === `${ORIGIN}${pagePath("en", item.type, item.entity)}`, `sitemap ${url}: bad x-default`);
      check(!block.includes("<lastmod>"), `sitemap ${url}: must not reuse dataset snapshot date as page modification date`);
    }
  }

  const robots = readText("robots.txt");
  if (robots) {
    for (const agent of ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Googlebot", "Bingbot"]) {
      check(new RegExp(`User-agent: ${regexEscape(agent)}\\nAllow: /(?:\\n|$)`).test(robots), `robots.txt does not explicitly allow ${agent}`);
    }
    for (const agent of ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended", "Meta-ExternalAgent", "Bytespider", "Amazonbot"]) {
      check(new RegExp(`User-agent: ${regexEscape(agent)}\\nDisallow: /(?:\\n|$)`).test(robots), `robots.txt does not block ${agent}`);
    }
    check(robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), "robots.txt absolute sitemap pointer missing");
    check(!robots.includes("/locations/"), "robots.txt should not enumerate location records");
  }

  const llms = readText("llms.txt");
  const full = readText("llms-full.txt");
  if (llms) {
    check(/^# Iconic Chargers$/m.test(llms) && /^## Project pages$/m.test(llms) && /^## Machine-readable resources$/m.test(llms), "llms.txt proposal section shape missing");
    const linkedUrls = new Set([...llms.matchAll(/^- \[[^\]]+\]\((https:\/\/[^)]+)\): .+$/gm)].map((match) => match[1]));
    for (const resource of ["/", "/about/", "/badges/", "/locations/", "/data/", "/DATA-RIGHTS.md", "/llms-full.txt", "/data/iconic-badges.json", "/data/locations.json", "/data/locations.csv", "/data/locations.geojson"]) {
      check(linkedUrls.has(`${ORIGIN}${resource}`), `llms.txt missing proposal-style link for ${resource}`);
    }
    check(linkedUrls.has("https://github.com/LakshmanTurlapati/Iconic-Chargers"), "llms.txt missing proposal-style repository link");
    check(llms.includes("not affiliated with or endorsed by Tesla"), "llms.txt non-affiliation missing");
  }
  if (full) {
    for (const badge of data.badges) {
      const section = sectionFor(full, `## ${badge.badge}`);
      check(Boolean(section), `llms-full.txt missing badge ${badge.badge}`);
      if (!section) continue;
      for (const expectedLine of [
        `- Region: ${badge.region}`,
        `- Reason: ${data.reasons[badge.reason]} (${badge.reason})`,
        `- Confidence: ${badge.confidence}`,
        `- Description: ${badge.why}`,
        `- Note: ${badge.note || "None"}`,
        `- Badge page: ${ORIGIN}${pagePath("en", "badge", badge)}`,
        `- Map: ${ORIGIN}/#${encodeURIComponent(badge.badge)}`
      ]) check(section.includes(expectedLine), `llms-full.txt ${badge.badge}: missing ${expectedLine}`);
      for (const site of data.sites.filter((candidate) => candidate.badge === badge.badge)) {
        check(section.includes(`Supercharge.info ID ${site.supercharge_info_id}`) && section.includes(`${ORIGIN}${pagePath("en", "location", site)}`), `llms-full.txt ${badge.badge}: missing linked location ${site.supercharge_info_id}`);
      }
    }
    for (const site of data.sites) {
      const record = JSON.parse(fs.readFileSync(path.join(OUT, "data/locations.json"), "utf8")).locations.find((candidate) => candidate.supercharge_info_id === site.supercharge_info_id);
      const heading = `## ${site.name} (Supercharge.info ID ${site.supercharge_info_id})`;
      const section = sectionFor(full, heading);
      check(Boolean(section), `llms-full.txt missing location ${site.supercharge_info_id}`);
      if (!section || !record) continue;
      const lines = [
        `- Address: ${[record.address, record.city, record.state, record.country].filter(Boolean).join(", ")}`,
        `- Coordinates: ${record.latitude}, ${record.longitude} (${data.coordinate_datum})`,
        `- Stalls: ${record.stalls ?? "unknown"}`,
        `- Peak power: ${record.peak_power_kw == null ? "unknown" : `${record.peak_power_kw} kW`}`,
        `- Elevation: ${record.elevation_m == null ? "unknown" : `${record.elevation_m} m`}`,
        `- Opened: ${record.opened || "unknown"}`,
        `- Status: ${record.status || "unknown"}`,
        `- Tesla location ID: ${record.tesla_location_id || "unknown"}`,
        `- Badge: ${record.badge}`,
        `- Badge confidence: ${record.badge_confidence}`,
        `- Badge description: ${record.badge_description}`,
        `- Badge note: ${record.badge_note || "None"}`,
        `- Page: ${record.page_url}`,
        `- Badge page: ${record.badge_page_url}`,
        `- Map: ${record.map_url}`
      ];
      for (const line of lines) check(section.includes(line), `llms-full.txt location ${site.supercharge_info_id}: missing ${line}`);
    }
    check((full.match(/^## .+ \(Supercharge\.info ID \d+\)$/gm) || []).length === 53, "llms-full.txt does not contain exactly 53 location headings");
  }
}

function sectionFor(text, heading) {
  const start = text.indexOf(`${heading}\n`);
  if (start < 0) return "";
  const next = text.indexOf("\n## ", start + heading.length);
  return text.slice(start, next < 0 ? text.length : next);
}

function verifySupportFiles() {
  const sourceBrowserData = browserData(path.join(ROOT, "web/sites.js"), "source web/sites.js");
  const outputBrowserData = browserData(path.join(OUT, "sites.js"), "generated sites.js");
  if (sourceBrowserData) check(JSON.stringify(sourceBrowserData) === JSON.stringify(data), "source web/sites.js differs from data/iconic-badges.json");
  if (outputBrowserData) check(JSON.stringify(outputBrowserData) === JSON.stringify(data), "generated sites.js differs from data/iconic-badges.json");
  check(!data.badge_source.includes("snapshot_date") && !data.notes.includes("snapshot_date"), "unresolved snapshot_date token in source data");
  const citation = readText("CITATION.cff");
  const rights = readText("DATA-RIGHTS.md");
  if (citation) {
    check(citation.includes("cff-version: 1.2.0"), "CITATION.cff version missing");
    check(citation.includes("family-names: Turlapati") && citation.includes("given-names: Lakshman"), "CITATION.cff author missing");
    check(citation.includes("date-released: 2026-08-12"), "CITATION.cff snapshot date missing");
    check(citation.includes("https://iconicchargers.com/data/"), "CITATION.cff canonical URL missing");
  }
  if (rights) {
    for (const phrase of ["Creative Commons Attribution 4.0", "Supercharge.info", "Tesla names", "basemap data"]) check(rights.includes(phrase), `DATA-RIGHTS.md missing scope phrase: ${phrase}`);
    check(/not affiliated with or\s+endorsed\s+by Tesla/.test(rights), "DATA-RIGHTS.md non-affiliation statement missing");
  }
  const manifest = readOutputJson("manifest.webmanifest");
  if (manifest) {
    check(manifest.start_url === "/" && manifest.scope === "/", "manifest scope/start URL mismatch");
    check(manifest.icons?.[0]?.src === "/favicon.svg", "manifest favicon reference missing");
  }
  check(fs.existsSync(path.join(OUT, "favicon.svg")), "favicon.svg missing");
  check(fs.existsSync(path.join(OUT, "404.html")), "404.html missing");
  if (fs.existsSync(path.join(OUT, "404.html"))) check(fs.readFileSync(path.join(OUT, "404.html"), "utf8").includes('noindex, nofollow'), "404 page must be noindex");
  const og = path.join(OUT, "og.png");
  check(fs.existsSync(og), "og.png missing");
  if (fs.existsSync(og)) {
    const bytes = fs.readFileSync(og);
    const png = bytes.length >= 24 && bytes.subarray(1, 4).toString() === "PNG";
    check(png, "og.png is not a PNG");
    if (png) check(bytes.readUInt32BE(16) === 1200 && bytes.readUInt32BE(20) === 630, `og.png is ${bytes.readUInt32BE(16)}×${bytes.readUInt32BE(20)}, expected 1200×630`);
  }
}

function browserData(file, label) {
  if (!fs.existsSync(file)) { failures.push(`missing ${label}`); return null; }
  const context = { window: {} };
  vm.createContext(context);
  try { vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file }); }
  catch (error) { failures.push(`${label} does not execute (${error.message})`); return null; }
  check(Boolean(context.window.ICONIC), `${label} did not define window.ICONIC`);
  return context.window.ICONIC || null;
}

function verifyDeterminism() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "iconic-site-verify-"));
  const first = path.join(tempRoot, "first");
  const second = path.join(tempRoot, "second");
  try {
    for (const target of [first, second]) {
      const result = spawnSync(process.execPath, [path.join(ROOT, "scripts/build_site.mjs"), target], { cwd: ROOT, encoding: "utf8" });
      check(result.status === 0, `deterministic rebuild failed for ${path.basename(target)}: ${(result.stderr || result.stdout).trim()}`);
      if (result.status !== 0) return;
    }
    const firstHashes = hashTree(first);
    const secondHashes = hashTree(second);
    check(JSON.stringify(firstHashes) === JSON.stringify(secondHashes), "two clean site builds are not byte-for-byte deterministic");
    const outputHashes = hashTree(OUT);
    check(JSON.stringify(firstHashes) === JSON.stringify(outputHashes), "verified output differs from a clean deterministic build; rerun scripts/build_site.mjs");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function hashTree(directory) {
  return walk(directory).map((file) => [
    path.relative(directory, file).split(path.sep).join("/"),
    crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
  ]).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
}

function readText(relative) {
  const file = path.join(OUT, relative);
  if (!fs.existsSync(file)) { failures.push(`missing ${relative}`); return ""; }
  return fs.readFileSync(file, "utf8");
}

function regexEscape(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function decodeXml(value) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
