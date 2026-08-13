#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { seoCopy, supportedSeoLocales } from "./seo-copy.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_OUTPUT = path.join(ROOT, ".site");
const outputArgument = process.argv[2];
const OUT = path.resolve(outputArgument || DEFAULT_OUTPUT);
const ORIGIN = "https://iconicchargers.com";
const REPOSITORY = "https://github.com/LakshmanTurlapati/Iconic-Chargers";
const PERSON_URL = "https://www.parzival.live/";
const PERSON_SAME_AS = "https://github.com/LakshmanTurlapati";
const TESLA_BADGE_SOURCE = "https://www.tesla.com/support/tesla-app/charging-badges";
const SITE_SOURCE = "https://supercharge.info";
const SNAPSHOT_CITATION = "Turlapati, Lakshman. Iconic Chargers: Tesla Iconic Charger Badges and Supercharger Sites. Snapshot 2026-08-12. https://iconicchargers.com/data/.";

if ([ROOT, path.join(ROOT, "web"), path.parse(ROOT).root].includes(OUT)) {
  throw new Error(`Refusing unsafe output path: ${OUT}`);
}

const data = readJson("data/iconic-badges.json");
const slugs = readJson("data/seo-slugs.json");
const locales = loadLocales(data);
const badgesByName = new Map(data.badges.map((badge) => [badge.badge, badge]));
const sitesByBadge = new Map(data.badges.map((badge) => [
  badge.badge,
  data.sites.filter((site) => site.badge === badge.badge)
]));
const badgeForSite = new Map(data.sites.map((site) => [site.supercharge_info_id, badgesByName.get(site.badge)]));
const records = data.sites.map(flattenLocation);
const htmlRoutes = [];
const OG_LOCALES = {
  en: "en_US", fr: "fr_FR", de: "de_DE", nl: "nl_NL", nb: "nb_NO", nn: "nn_NO",
  it: "it_IT", es: "es_ES", tr: "tr_TR", cs: "cs_CZ", he: "he_IL", ar: "ar_SA",
  ja: "ja_JP", ko: "ko_KR", "zh-Hans": "zh_CN", "zh-Hant": "zh_TW",
  "yue-Hant": "yue_HK", mi: "mi_NZ"
};
const SEO_HREFLANG = Object.fromEntries(supportedSeoLocales.map((key) => [key, key]));
// Google accepts a two-letter ISO 639-1 primary language subtag. Keep the
// valid BCP 47 `yue-Hant` document language, but advertise its search
// alternate as Traditional Chinese for Hong Kong rather than an ignored code.
SEO_HREFLANG["yue-Hant"] = "zh-Hant-HK";

function main() {
  validateInputs();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  copyDirectory(path.join(ROOT, "web"), OUT);
  copySocialCard();

  for (const localeKey of supportedSeoLocales) {
    const locale = locales[localeKey];
    const copy = seoCopy(localeKey);

    emitHtml(pagePath(localeKey, "home"), renderMapPage(localeKey, locale, copy));
    emitHtml(pagePath(localeKey, "badges"), renderBadgeDirectory(localeKey, locale, copy));
    emitHtml(pagePath(localeKey, "locations"), renderLocationDirectory(localeKey, locale, copy));
    emitHtml(pagePath(localeKey, "about"), renderAbout(localeKey, locale, copy));
    emitHtml(pagePath(localeKey, "data"), renderDataPage(localeKey, locale, copy));

    for (const badge of data.badges) {
      emitHtml(pagePath(localeKey, "badge", badge), renderBadgePage(localeKey, locale, copy, badge));
    }
    for (const site of data.sites) {
      emitHtml(pagePath(localeKey, "location", site), renderLocationPage(localeKey, locale, copy, site));
    }
  }

  emitFeeds();
  emitDiscoveryFiles();
  emitSupportFiles();

  console.log(`Built ${htmlRoutes.length} localized HTML routes and 4 data feeds in ${path.relative(ROOT, OUT) || OUT}`);
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
}

function loadLocales(iconicData) {
  const context = { window: { ICONIC: iconicData }, Intl };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "web/locales.js"), "utf8"), context, {
    filename: "web/locales.js"
  });
  return context.window.ICONIC_I18N.locales;
}

function validateInputs() {
  assert(data.badge_count === 40 && data.badges.length === 40, "expected exactly 40 badges");
  assert(data.site_count === 53 && data.sites.length === 53, "expected exactly 53 locations");
  assert(data.snapshot_date === "2026-08-12", "snapshot date changed; update citation and review public feeds");
  assert(!data.badge_source.includes("snapshot_date") && !data.notes.includes("snapshot_date"), "unresolved snapshot_date template token");
  assert(slugs.version === 1, "unsupported SEO slug registry version");
  assert(supportedSeoLocales.length === 18, "expected exactly 18 SEO locales");
  assert(supportedSeoLocales.every((key) => locales[key]), "SEO locale is missing from web/locales.js");
  const configuredOrder = Object.keys(slugs.badges);
  assert(configuredOrder.length === data.badges.length, "badge slug registry count differs from dataset");
  assert(Object.keys(slugs.locations).length === data.sites.length, "location slug registry count differs from dataset");
  for (const badge of data.badges) {
    assert(slugs.badges[badge.badge], `missing frozen badge slug for ${badge.badge}`);
    const mappedSiteNames = sitesByName(badge.badge).map((site) => site.name);
    assert(JSON.stringify(badge.sites) === JSON.stringify(mappedSiteNames), `badge site-name registry differs for ${badge.badge}`);
  }
  for (const site of data.sites) {
    assert(slugs.locations[String(site.supercharge_info_id)], `missing frozen location slug for ${site.name}`);
  }
  for (const [kind, values] of [["badge", Object.values(slugs.badges)], ["location", Object.values(slugs.locations)]]) {
    assert(values.every((value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)), `invalid ${kind} slug`);
    assert(new Set(values).size === values.length, `duplicate ${kind} slug`);
  }
  assert(new Set(data.sites.map((site) => site.supercharge_info_id)).size === data.sites.length, "duplicate location ID");
  assert(data.badges.every((badge) => (sitesByName(badge.badge).length === badge.site_count)), "badge site counts differ");
}

function sitesByName(badgeName) {
  return data.sites.filter((site) => site.badge === badgeName);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function copyDirectory(source, destination) {
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (entry) => path.basename(entry) !== ".DS_Store"
  });
}

function copySocialCard() {
  const preferred = path.join(ROOT, "web/og.png");
  const fallback = path.join(ROOT, "docs/screenshot.png");
  if (fs.existsSync(preferred)) fs.copyFileSync(preferred, path.join(OUT, "og.png"));
  else if (fs.existsSync(fallback)) fs.copyFileSync(fallback, path.join(OUT, "og.png"));
  else throw new Error("missing web/og.png and docs/screenshot.png social-card fallback");
}

function localePrefix(localeKey) {
  return localeKey === "en" ? "" : `/${localeKey}`;
}

function pagePath(localeKey, type, entity) {
  const prefix = localePrefix(localeKey);
  if (type === "home") return `${prefix}/` || "/";
  if (["badges", "locations", "about", "data"].includes(type)) return `${prefix}/${type}/`;
  if (type === "badge") return `${prefix}/badges/${slugs.badges[entity.badge]}/`;
  if (type === "location") {
    const slug = slugs.locations[String(entity.supercharge_info_id)];
    return `${prefix}/locations/${entity.supercharge_info_id}-${slug}/`;
  }
  throw new Error(`unknown page type: ${type}`);
}

function absolute(route) {
  return `${ORIGIN}${route}`;
}

function routeFile(route) {
  return path.join(OUT, route.replace(/^\//, ""), "index.html");
}

function emitHtml(route, html) {
  const target = routeFile(route);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${html.trim()}\n`);
  htmlRoutes.push(route);
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function localizedBadgeCopy(locale, badge) {
  return locale.badges[badge.badge] || locales.en.badges[badge.badge] || {
    why: badge.why,
    note: badge.note
  };
}

function countryName(locale, site) {
  return locale.countries[site.country] || locales.en.countries[site.country] || site.country;
}

function regionName(locale, region) {
  return locale.regions[region] || locales.en.regions[region] || region;
}

function reasonName(locale, reason) {
  const value = locale.reasons[reason] || locales.en.reasons[reason];
  return typeof value === "string" ? value : value.long;
}

function noun(localeKey, locale, key, count) {
  const forms = locale.nouns[key] || locales.en.nouns[key];
  const category = new Intl.PluralRules(localeKey).select(count);
  const template = forms[category] || forms.other || forms.one;
  return template.replace("{count}", String(count));
}

function addressText(locale, site) {
  return [site.address, site.city, site.state, countryName(locale, site)].filter(Boolean).join(", ");
}

function coordinateText(site) {
  return `${Number(site.latitude).toFixed(6)}, ${Number(site.longitude).toFixed(6)}`;
}

function alternateLinks(type, entity) {
  const links = supportedSeoLocales.map((localeKey) =>
    `<link rel="alternate" hreflang="${esc(SEO_HREFLANG[localeKey])}" href="${esc(absolute(pagePath(localeKey, type, entity)))}">`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${esc(absolute(pagePath("en", type, entity)))}">`);
  return links.join("\n");
}

function metadata({ localeKey, type, entity, title, description, jsonLd, noindex = false }) {
  const route = pagePath(localeKey, type, entity);
  const canonical = absolute(route);
  const socialAlt = seoCopy(localeKey).text.intro;
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="Lakshman Turlapati">
<meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? "" : alternateLinks(type, entity)}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Iconic Chargers">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${ORIGIN}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(socialAlt)}">
<meta property="og:locale" content="${esc(OG_LOCALES[localeKey])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ORIGIN}/og.png">
<meta name="twitter:image:alt" content="${esc(socialAlt)}">
<script type="application/ld+json">${jsonScript(jsonLd)}</script>`;
}

function nav(localeKey, copy) {
  const p = (type) => pagePath(localeKey, type);
  return `<nav aria-label="Primary">
  <a href="${p("home")}">${esc(copy.labels.map)}</a>
  <a href="${p("badges")}">${esc(copy.labels.badges)}</a>
  <a href="${p("locations")}">${esc(copy.labels.locations)}</a>
  <a href="${p("about")}">${esc(copy.labels.about)}</a>
  <a href="${p("data")}">${esc(copy.labels.data)}</a>
</nav>`;
}

const STATIC_CSS = `
:root{color-scheme:dark;--bg:#090909;--panel:#151515;--edge:#303030;--text:#f5f5f5;--muted:#b8b8b8;--gold:#d4af37;--link:#9eb8ff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-size:16px;line-height:1.55;font-family:inherit}a{color:var(--link)}a:hover{text-decoration-thickness:2px}.wrap{width:min(1080px,calc(100% - 32px));margin:auto}header{border-bottom:1px solid var(--edge);background:#0d0d0df2;position:sticky;top:0;z-index:2}.bar{min-height:68px;display:flex;align-items:center;gap:24px;justify-content:space-between}.brand{font-weight:650;color:var(--text);text-decoration:none;letter-spacing:.02em}nav{display:flex;gap:18px;flex-wrap:wrap}nav a{color:var(--muted);text-decoration:none;font-size:.92rem}main{padding:56px 0 72px}h1{font-size:clamp(2rem,5vw,4rem);line-height:1.05;letter-spacing:-.035em;margin:0 0 18px}h2{font-size:1.45rem;margin:44px 0 14px}h3{font-size:1.04rem;margin:.15rem 0}.lead{font-size:1.18rem;max-width:780px;color:#dedede}.notice,.note{border-inline-start:3px solid var(--gold);padding:10px 16px;background:var(--panel);color:var(--muted);max-width:850px}.meta{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0}.pill{border:1px solid var(--edge);border-radius:999px;padding:5px 10px;color:var(--muted);font-size:.88rem}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin:24px 0}.card{display:block;border:1px solid var(--edge);border-radius:14px;background:var(--panel);padding:18px;color:var(--text);text-decoration:none}.card:hover{border-color:#555}.card p{margin:.45rem 0 0;color:var(--muted);font-size:.92rem}.facts{display:grid;grid-template-columns:minmax(130px,220px) 1fr;max-width:840px;border-top:1px solid var(--edge)}.facts dt,.facts dd{margin:0;padding:10px 0;border-bottom:1px solid var(--edge)}.facts dt{color:var(--muted)}.facts dd{overflow-wrap:anywhere}code{color:#e4e4e4}.actions{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0}.button{display:inline-block;background:#3158bd;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none}.button.secondary{background:var(--panel);border:1px solid var(--edge)}.crumbs{color:var(--muted);font-size:.9rem;margin-bottom:30px}.crumbs a{color:inherit}footer{border-top:1px solid var(--edge);padding:30px 0 50px;color:var(--muted);font-size:.88rem}footer p{max-width:850px}.downloads li{margin:.55rem 0}bdi{unicode-bidi:isolate}@media(max-width:620px){.bar{align-items:flex-start;flex-direction:column;padding:14px 0;gap:8px}header{position:static}main{padding-top:36px}.facts{grid-template-columns:1fr}.facts dt{border-bottom:0;padding-bottom:0}.facts dd{padding-top:2px}}
`;

function renderStatic({ localeKey, locale, copy, type, entity, title, description, jsonLd, body }) {
  return `<!doctype html>
<html lang="${esc(localeKey)}" dir="${esc(locale.dir)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#090909">
${metadata({ localeKey, type, entity, title, description, jsonLd })}
<style>${STATIC_CSS}</style>
</head>
<body>
<header><div class="wrap bar"><a class="brand" href="${pagePath(localeKey, "home")}">Iconic Chargers</a>${nav(localeKey, copy)}</div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap"><p>${esc(copy.text.disclaimer)}</p><p>© Lakshman Turlapati · <a href="${pagePath(localeKey, "data")}">${esc(copy.labels.rights)} — CC BY 4.0</a> · <a href="${SITE_SOURCE}">Supercharge.info</a> · <a href="${REPOSITORY}">${esc(copy.labels.github)}</a></p></div></footer>
</body>
</html>`;
}

function sanitizeSourceHead(source) {
  return source
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|author|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, "")
    .replace(/<link\b[^>]*rel=["'](?:canonical|alternate|manifest|icon)["'][^>]*>\s*/gi, "")
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "")
    .replace(/<base\b[^>]*>\s*/gi, "");
}

function replaceTextById(source, id, value) {
  const pattern = new RegExp(`(<([a-z][a-z0-9]*)\\b[^>]*\\bid=["']${id}["'][^>]*>)[\\s\\S]*?(<\\/\\2>)`, "i");
  return source.replace(pattern, `$1${esc(value)}$3`);
}

function replaceAttributeById(source, id, attribute, value) {
  const elementPattern = new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\bid=["']${id}["'][^>]*>`, "i");
  return source.replace(elementPattern, (tag) => {
    const attributePattern = new RegExp(`\\s${attribute}=["'][^"']*["']`, "i");
    if (attributePattern.test(tag)) return tag.replace(attributePattern, ` ${attribute}="${esc(value)}"`);
    return tag.replace(/>$/, ` ${attribute}="${esc(value)}">`);
  });
}

function localizeMapShell(source, localeKey, locale) {
  const textIds = {
    "app-title": locale.ui.heading,
    "map-error-title": locale.ui.mapUnavailableTitle,
    "map-error-message": locale.ui.mapFallback,
    "language-label": locale.ui.languageLabel,
    nearlbl: locale.ui.nearMe,
    footnote: locale.ui.footnote,
    "project-note": locale.ui.projectNote
  };
  for (const [id, value] of Object.entries(textIds)) source = replaceTextById(source, id, value);
  const ariaIds = {
    map: locale.ui.mapAria,
    q: locale.ui.searchAria,
    clear: locale.ui.clearSearch,
    filters: locale.ui.filterAria,
    "panel-grab": locale.ui.resizeList,
    detail: locale.ui.detailsAria,
    "detail-grab": locale.ui.resizeDetails,
    dclose: locale.ui.closeDetails,
    "project-links": locale.ui.projectNav
  };
  for (const [id, value] of Object.entries(ariaIds)) source = replaceAttributeById(source, id, "aria-label", value);
  source = replaceAttributeById(source, "q", "placeholder", locale.ui.searchPlaceholder);
  source = source.replace(/(<a\b[^>]*\bdata-ui=["']([^"']+)["'][^>]*>)[\s\S]*?(<\/a>)/gi,
    (match, opening, key, closing) => `${opening}${esc(locale.ui[key] || locales.en.ui[key] || key)}${closing}`);
  source = source.replace(/(<a\b[^>]*\bdata-site-route=["']([^"']+)["'][^>]*\bhref=)["'][^"']*["']/gi,
    (match, before, route) => `${before}"${pagePath(localeKey, route)}"`);
  return source;
}

function mapGraph(localeKey, title, description) {
  const route = pagePath(localeKey, "home");
  const canonical = absolute(route);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${ORIGIN}/#lakshman-turlapati`,
        name: "Lakshman Turlapati",
        url: PERSON_URL,
        sameAs: [PERSON_SAME_AS]
      },
      {
        "@type": "WebSite",
        "@id": `${ORIGIN}/#website`,
        name: "Iconic Chargers",
        url: `${ORIGIN}/`,
        inLanguage: supportedSeoLocales,
        description: seoCopy("en").text.intro,
        creator: { "@id": `${ORIGIN}/#lakshman-turlapati` },
        publisher: { "@id": `${ORIGIN}/#lakshman-turlapati` }
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        name: title,
        url: canonical,
        inLanguage: localeKey,
        description,
        isPartOf: { "@id": `${ORIGIN}/#website` },
        author: { "@id": `${ORIGIN}/#lakshman-turlapati` }
      }
    ]
  };
}

function renderMapPage(localeKey, locale, copy) {
  const title = locale.ui.documentTitle;
  const description = copy.text.intro;
  const graph = mapGraph(localeKey, title, description);
  const routeMeta = Object.fromEntries(supportedSeoLocales.map((key) => {
    const routeCopy = seoCopy(key);
    return [key, {
      title: locales[key].ui.documentTitle,
      description: routeCopy.text.intro,
      canonical: absolute(pagePath(key, "home")),
      ogLocale: OG_LOCALES[key]
    }];
  }));
  let source = sanitizeSourceHead(fs.readFileSync(path.join(ROOT, "web/index.html"), "utf8"));
  source = source.replace(/<html\b[^>]*>/i, `<html lang="${esc(localeKey)}" dir="${esc(locale.dir)}">`);
  const noScriptCss = `<style>#seo-nojs{position:fixed;inset:16px;z-index:99;overflow:auto;padding:28px;border:1px solid #333;border-radius:16px;background:#111;color:#fff;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#seo-nojs a{color:#a9c0ff}#seo-nojs nav{display:flex;gap:16px;flex-wrap:wrap}</style>`;
  const generatedHead = `<meta charset="utf-8">\n<base href="/">\n${metadata({ localeKey, type: "home", title, description, jsonLd: graph })}\n${noScriptCss}\n<script>window.ICONIC_PATH_LOCALE=${JSON.stringify(localeKey)};window.ICONIC_ROUTE_META=${jsonScript(routeMeta)};<\/script>`;
  source = source.replace(/<meta charset="utf-8">/i, generatedHead);
  source = source.replace(/new URL\("vendor\/mapbox-gl-rtl-text\.js", location\.href\)/g,
    'new URL("vendor/mapbox-gl-rtl-text.js", document.baseURI)');
  source = localizeMapShell(source, localeKey, locale);
  const noScript = `<noscript><section id="seo-nojs"><h1>${esc(locale.ui.heading)}</h1><p>${esc(copy.text.intro)}</p><p>${esc(copy.text.disclaimer)}</p>${nav(localeKey, copy)}</section></noscript>`;
  // Match only the actual element line. The stylesheet's documentation also
  // mentions the literal string `<body>`, which must remain inert CSS-comment
  // text rather than becoming the insertion point for crawlable fallback HTML.
  source = source.replace(/^<body>$/m, `<body>\n${noScript}`);
  return source;
}

function breadcrumbs(localeKey, copy, items) {
  return `<div class="crumbs"><a href="${pagePath(localeKey, "home")}">${esc(copy.labels.home)}</a> / ${items.map((item, index) => item.href && index < items.length - 1 ? `<a href="${item.href}">${esc(item.name)}</a>` : esc(item.name)).join(" / ")}</div>`;
}

function breadcrumbJson(localeKey, items) {
  const all = [{ name: "Iconic Chargers", href: pagePath(localeKey, "home") }, ...items];
  return {
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.name, item: absolute(item.href)
    }))
  };
}

function renderBadgeDirectory(localeKey, locale, copy) {
  const title = `${copy.labels.badgeDirectory} | Iconic Chargers`;
  const description = copy.text.badgeIntro;
  const route = pagePath(localeKey, "badges");
  const list = data.badges.map((badge, index) => ({
    "@type": "ListItem", position: index + 1, name: badge.badge,
    url: absolute(pagePath(localeKey, "badge", badge))
  }));
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: copy.labels.badgeDirectory, url: absolute(route), inLanguage: localeKey, description, mainEntity: { "@type": "ItemList", numberOfItems: 40, itemListElement: list } },
    breadcrumbJson(localeKey, [{ name: copy.labels.badges, href: route }])
  ] };
  const cards = data.badges.map((badge) => {
    const localized = localizedBadgeCopy(locale, badge);
    return `<a class="card" href="${pagePath(localeKey, "badge", badge)}"><h3><bdi>${esc(badge.badge)}</bdi></h3><p>${esc(reasonName(locale, badge.reason))} · ${esc(regionName(locale, badge.region))} · ${esc(noun(localeKey, locale, "supercharger", badge.site_count))}</p><p>${esc(localized.why)}</p></a>`;
  }).join("\n");
  const body = `${breadcrumbs(localeKey, copy, [{ name: copy.labels.badges, href: route }])}<h1>${esc(copy.labels.badgeDirectory)}</h1><p class="lead">${esc(description)}</p><div class="meta"><span class="pill">${esc(noun(localeKey, locale, "badge", 40))}</span><span class="pill">${esc(noun(localeKey, locale, "supercharger", 53))}</span><span class="pill">${esc(copy.labels.snapshot)} ${esc(data.snapshot_date)}</span></div><div class="grid">${cards}</div>`;
  return renderStatic({ localeKey, locale, copy, type: "badges", title, description, jsonLd, body });
}

function renderLocationDirectory(localeKey, locale, copy) {
  const title = `${copy.labels.locationDirectory} | Iconic Chargers`;
  const description = copy.text.locationIntro;
  const route = pagePath(localeKey, "locations");
  const list = data.sites.map((site, index) => ({
    "@type": "ListItem", position: index + 1, name: site.name,
    url: absolute(pagePath(localeKey, "location", site))
  }));
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: copy.labels.locationDirectory, url: absolute(route), inLanguage: localeKey, description, mainEntity: { "@type": "ItemList", numberOfItems: 53, itemListElement: list } },
    breadcrumbJson(localeKey, [{ name: copy.labels.locations, href: route }])
  ] };
  const cards = data.sites.map((site) => {
    const badge = badgeForSite.get(site.supercharge_info_id);
    return `<a class="card" href="${pagePath(localeKey, "location", site)}"><h3><bdi>${esc(site.name)}</bdi></h3><p><bdi>${esc(addressText(locale, site))}</bdi></p><p>${esc(site.stalls ?? "—")} ${esc(locale.ui.statsStalls)} · ${esc(site.power_kw ? `${site.power_kw} kW` : locale.ui.unknown)} · <bdi>${esc(badge.badge)}</bdi></p></a>`;
  }).join("\n");
  const body = `${breadcrumbs(localeKey, copy, [{ name: copy.labels.locations, href: route }])}<h1>${esc(copy.labels.locationDirectory)}</h1><p class="lead">${esc(description)}</p><div class="meta"><span class="pill">${esc(noun(localeKey, locale, "supercharger", 53))}</span><span class="pill">${esc(copy.labels.snapshot)} ${esc(data.snapshot_date)}</span></div><div class="grid">${cards}</div>`;
  return renderStatic({ localeKey, locale, copy, type: "locations", title, description, jsonLd, body });
}

function badgePageDescription(locale, badge) {
  const localized = localizedBadgeCopy(locale, badge);
  return `${badge.badge}: ${localized.why}`;
}

function renderBadgePage(localeKey, locale, copy, badge) {
  const localized = localizedBadgeCopy(locale, badge);
  const sites = sitesByBadge.get(badge.badge);
  const title = `${badge.badge} — ${copy.labels.badges} | Iconic Chargers`;
  const description = badgePageDescription(locale, badge);
  const route = pagePath(localeKey, "badge", badge);
  const items = sites.map((site, index) => ({
    "@type": "ListItem", position: index + 1, name: site.name,
    url: absolute(pagePath(localeKey, "location", site))
  }));
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: badge.badge, url: absolute(route), inLanguage: localeKey, description: localized.why, mainEntity: { "@type": "ItemList", numberOfItems: sites.length, itemListElement: items } },
    breadcrumbJson(localeKey, [
      { name: copy.labels.badges, href: pagePath(localeKey, "badges") },
      { name: badge.badge, href: route }
    ])
  ] };
  const siteCards = sites.map((site) => `<a class="card" href="${pagePath(localeKey, "location", site)}"><h3><bdi>${esc(site.name)}</bdi></h3><p><bdi>${esc(addressText(locale, site))}</bdi></p><p>${esc(site.stalls ?? "—")} ${esc(locale.ui.statsStalls)} · ${esc(site.power_kw ? `${site.power_kw} kW` : locale.ui.unknown)} · ${esc(site.status)}</p></a>`).join("\n");
  const confidence = badge.confidence === "exact" ? copy.labels.exact : copy.labels.approximate;
  const note = localized.note ? `<h2>${esc(copy.labels.notes)}</h2><p class="note">${esc(localized.note)}</p>` : "";
  const body = `${breadcrumbs(localeKey, copy, [{ name: copy.labels.badges, href: pagePath(localeKey, "badges") }, { name: badge.badge, href: route }])}<h1><bdi>${esc(badge.badge)}</bdi></h1><div class="meta"><span class="pill">${esc(reasonName(locale, badge.reason))}</span><span class="pill">${esc(regionName(locale, badge.region))}</span><span class="pill">${esc(copy.labels.confidence)}: ${esc(confidence)}</span></div><p class="lead">${esc(localized.why)}</p>${note}<h2>${esc(copy.labels.locationsForBadge)}</h2><div class="grid">${siteCards}</div><div class="actions"><a class="button" href="${pagePath(localeKey, "home")}#${encodeURIComponent(badge.badge)}">${esc(copy.labels.openMap)}</a><a class="button secondary" href="${pagePath(localeKey, "data")}">${esc(copy.labels.data)}</a></div>`;
  return renderStatic({ localeKey, locale, copy, type: "badge", entity: badge, title, description, jsonLd, body });
}

function renderLocationPage(localeKey, locale, copy, site) {
  const badge = badgeForSite.get(site.supercharge_info_id);
  const localized = localizedBadgeCopy(locale, badge);
  const title = `${site.name} — ${copy.labels.locations} | Iconic Chargers`;
  const description = `${site.name}: ${localized.why}`;
  const route = pagePath(localeKey, "location", site);
  const place = {
    "@type": "Place",
    "@id": `${absolute(pagePath("en", "location", site))}#place`,
    name: site.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address || undefined,
      addressLocality: site.city || undefined,
      addressRegion: site.state || undefined,
      addressCountry: site.country || undefined
    },
    geo: { "@type": "GeoCoordinates", latitude: site.latitude, longitude: site.longitude },
    identifier: [
      { "@type": "PropertyValue", propertyID: "Supercharge.info", value: String(site.supercharge_info_id) },
      ...(site.tesla_location_id ? [{ "@type": "PropertyValue", propertyID: "Tesla location", value: String(site.tesla_location_id) }] : [])
    ]
  };
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", name: site.name, url: absolute(route), inLanguage: localeKey, description, mainEntity: { "@id": place["@id"] } },
    place,
    breadcrumbJson(localeKey, [
      { name: copy.labels.locations, href: pagePath(localeKey, "locations") },
      { name: site.name, href: route }
    ])
  ] };
  const fields = [
    [locale.ui.factAddress, `<bdi>${esc(addressText(locale, site))}</bdi>`],
    [locale.ui.factCoordinates, `<bdi dir="ltr"><code>${esc(coordinateText(site))}</code></bdi>`],
    [locale.ui.statsStalls, esc(site.stalls ?? locale.ui.unknown)],
    [locale.ui.factPower, esc(site.power_kw ? `${site.power_kw} kW` : locale.ui.unknown)],
    [locale.ui.factElevation, esc(site.elevation_m == null ? locale.ui.unknown : `${site.elevation_m} m`)],
    [locale.ui.factListed, esc(site.opened || locale.ui.unknown)],
    [copy.labels.status, esc(site.status || locale.ui.unknown)]
  ];
  const facts = fields.map(([term, value]) => `<dt>${esc(term)}</dt><dd>${value}</dd>`).join("\n");
  const confidence = badge.confidence === "exact" ? copy.labels.exact : copy.labels.approximate;
  const note = localized.note ? `<p class="note">${esc(localized.note)}</p>` : "";
  const teslaLink = site.tesla_location_id ? `<a href="https://www.tesla.com/findus/location/supercharger/${encodeURIComponent(site.tesla_location_id)}">Tesla ${esc(site.tesla_location_id)}</a>` : esc(locale.ui.unknown);
  const body = `${breadcrumbs(localeKey, copy, [{ name: copy.labels.locations, href: pagePath(localeKey, "locations") }, { name: site.name, href: route }])}<h1><bdi>${esc(site.name)}</bdi></h1><p class="lead"><bdi>${esc(addressText(locale, site))}</bdi></p><h2>${esc(copy.labels.details)}</h2><dl class="facts">${facts}</dl><h2>${esc(copy.labels.badgeForLocation)}</h2><p><a href="${pagePath(localeKey, "badge", badge)}"><bdi>${esc(badge.badge)}</bdi></a> · ${esc(reasonName(locale, badge.reason))} · ${esc(copy.labels.confidence)}: ${esc(confidence)}</p><p>${esc(localized.why)}</p>${note}<h2>${esc(copy.labels.sourceIds)}</h2><dl class="facts"><dt>Supercharge.info ID</dt><dd><code>${esc(site.supercharge_info_id)}</code></dd><dt>Tesla location ID</dt><dd>${teslaLink}</dd></dl><div class="actions"><a class="button" href="${pagePath(localeKey, "home")}#${encodeURIComponent(badge.badge)}">${esc(copy.labels.openMap)}</a><a class="button secondary" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(`${site.latitude},${site.longitude}`)}">Google Maps</a></div>`;
  return renderStatic({ localeKey, locale, copy, type: "location", entity: site, title, description, jsonLd, body });
}

function renderAbout(localeKey, locale, copy) {
  const title = `${copy.labels.about} Iconic Chargers`;
  const description = copy.text.aboutIntro;
  const route = pagePath(localeKey, "about");
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "AboutPage", name: title, url: absolute(route), inLanguage: localeKey, description, author: { "@type": "Person", name: "Lakshman Turlapati" } },
    breadcrumbJson(localeKey, [{ name: copy.labels.about, href: route }])
  ] };
  const body = `${breadcrumbs(localeKey, copy, [{ name: copy.labels.about, href: route }])}<h1>${esc(copy.labels.about)} Iconic Chargers</h1><p class="lead">${esc(description)}</p><p class="notice">${esc(copy.text.disclaimer)}</p><h2>${esc(copy.labels.methodology)}</h2><p>${esc(copy.text.methodology)}</p><h2>${esc(copy.labels.provenance)}</h2><p>${esc(copy.text.provenance)}</p><ul><li><a href="${TESLA_BADGE_SOURCE}">Tesla Charging Badges</a></li><li><a href="${SITE_SOURCE}">Supercharge.info</a></li><li><a href="${REPOSITORY}">GitHub</a></li></ul><h2>${esc(copy.labels.uncertainty)}</h2><p>${esc(copy.text.uncertainty)}</p><div class="meta"><span class="pill">${esc(noun(localeKey, locale, "badge", 40))}</span><span class="pill">${esc(noun(localeKey, locale, "supercharger", 53))}</span><span class="pill">${esc(copy.labels.snapshot)} ${esc(data.snapshot_date)}</span><span class="pill">${esc(copy.labels.author)}: Lakshman Turlapati</span></div>`;
  return renderStatic({ localeKey, locale, copy, type: "about", title, description, jsonLd, body });
}

function renderDataPage(localeKey, locale, copy) {
  const title = `${copy.labels.data} & ${copy.labels.citation} | Iconic Chargers`;
  const description = copy.text.dataIntro;
  const route = pagePath(localeKey, "data");
  const distributions = [
    ["iconic-badges.json", "application/json"],
    ["locations.json", "application/json"],
    ["locations.csv", "text/csv"],
    ["locations.geojson", "application/geo+json"]
  ].map(([name, encodingFormat]) => ({
    "@type": "DataDownload", name, encodingFormat, contentUrl: `${ORIGIN}/data/${name}`
  }));
  const dataset = {
    "@type": "Dataset",
    "@id": `${ORIGIN}/data/#dataset`,
    name: "Iconic Chargers: Tesla Iconic Charger Badges and Supercharger Sites",
    description: seoCopy("en").text.dataIntro,
    url: absolute(pagePath("en", "data")),
    inLanguage: "en",
    dateModified: data.snapshot_date,
    creator: { "@type": "Person", name: "Lakshman Turlapati" },
    license: `${ORIGIN}/DATA-RIGHTS.md`,
    isBasedOn: [TESLA_BADGE_SOURCE, SITE_SOURCE],
    distribution: distributions
  };
  const page = {
    "@type": "WebPage",
    "@id": `${absolute(route)}#webpage`,
    name: title,
    url: absolute(route),
    inLanguage: localeKey,
    description,
    mainEntity: { "@id": dataset["@id"] }
  };
  const jsonLd = { "@context": "https://schema.org", "@graph": [page, dataset, breadcrumbJson(localeKey, [{ name: copy.labels.data, href: route }])] };
  const body = `${breadcrumbs(localeKey, copy, [{ name: copy.labels.data, href: route }])}<h1>${esc(copy.labels.data)}</h1><p class="lead">${esc(description)}</p><h2>${esc(copy.labels.downloads)}</h2><ul class="downloads"><li><a href="/data/iconic-badges.json">iconic-badges.json</a> — ${esc(noun(localeKey, locale, "badge", 40))}</li><li><a href="/data/locations.json">locations.json</a> — ${esc(noun(localeKey, locale, "supercharger", 53))}</li><li><a href="/data/locations.csv">locations.csv</a></li><li><a href="/data/locations.geojson">locations.geojson</a></li></ul><h2>${esc(copy.labels.citation)}</h2><p>${esc(SNAPSHOT_CITATION)}</p><p><a href="/CITATION.cff">CITATION.cff</a></p><h2>${esc(copy.labels.rights)}</h2><p>${esc(copy.text.rights)}</p><p><a href="/DATA-RIGHTS.md">DATA-RIGHTS.md</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p><h2>${esc(copy.labels.provenance)}</h2><p>${esc(copy.text.provenance)}</p>`;
  return renderStatic({ localeKey, locale, copy, type: "data", title, description, jsonLd, body });
}

function flattenLocation(site) {
  const badge = badgesByName.get(site.badge);
  return {
    supercharge_info_id: site.supercharge_info_id,
    tesla_location_id: site.tesla_location_id ?? null,
    name: site.name,
    address: site.address ?? null,
    city: site.city ?? null,
    state: site.state ?? null,
    country: site.country ?? null,
    latitude: site.latitude,
    longitude: site.longitude,
    stalls: site.stalls ?? null,
    peak_power_kw: site.power_kw ?? null,
    elevation_m: site.elevation_m ?? null,
    opened: site.opened ?? null,
    status: site.status ?? null,
    badge: badge.badge,
    badge_region: badge.region,
    badge_reason: badge.reason,
    badge_reason_description: data.reasons[badge.reason],
    badge_confidence: badge.confidence,
    badge_description: badge.why,
    badge_note: badge.note ?? null,
    snapshot_date: data.snapshot_date,
    page_url: absolute(pagePath("en", "location", site)),
    badge_page_url: absolute(pagePath("en", "badge", badge)),
    map_url: `${ORIGIN}/#${encodeURIComponent(badge.badge)}`,
    badge_source: data.badge_source,
    site_source: data.site_source
  };
}

function emitFeeds() {
  const dataDir = path.join(OUT, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const badgeFeed = {
    title: data.title,
    snapshot_date: data.snapshot_date,
    badge_count: data.badge_count,
    site_count: data.site_count,
    coordinate_datum: data.coordinate_datum,
    badge_source: data.badge_source,
    site_source: data.site_source,
    notes: data.notes,
    license: `${ORIGIN}/DATA-RIGHTS.md`,
    citation: SNAPSHOT_CITATION,
    badges: data.badges.map((badge) => ({
      ...badge,
      page_url: absolute(pagePath("en", "badge", badge)),
      map_url: `${ORIGIN}/#${encodeURIComponent(badge.badge)}`,
      locations: sitesByBadge.get(badge.badge).map((site) => ({
        supercharge_info_id: site.supercharge_info_id,
        name: site.name,
        page_url: absolute(pagePath("en", "location", site))
      }))
    }))
  };
  const locationFeed = {
    title: "Iconic Chargers locations",
    snapshot_date: data.snapshot_date,
    location_count: records.length,
    coordinate_datum: data.coordinate_datum,
    license: `${ORIGIN}/DATA-RIGHTS.md`,
    citation: SNAPSHOT_CITATION,
    locations: records
  };
  writeJson(path.join(dataDir, "iconic-badges.json"), badgeFeed);
  writeJson(path.join(dataDir, "locations.json"), locationFeed);
  fs.writeFileSync(path.join(dataDir, "locations.csv"), renderCsv(records));
  const geojson = {
    type: "FeatureCollection",
    name: "Iconic Chargers locations",
    bbox: bounds(records),
    features: records.map((record) => ({
      type: "Feature",
      id: record.supercharge_info_id,
      geometry: { type: "Point", coordinates: [record.longitude, record.latitude] },
      properties: Object.fromEntries(Object.entries(record).filter(([key]) => !["latitude", "longitude"].includes(key)))
    }))
  };
  writeJson(path.join(dataDir, "locations.geojson"), geojson);
}

function writeJson(target, value) {
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function renderCsv(rows) {
  const columns = Object.keys(rows[0]);
  const csvCell = (value) => {
    if (value == null) return "";
    const string = String(value);
    return /[",\r\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
  };
  return `${columns.join(",")}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")).join("\n")}\n`;
}

function bounds(rows) {
  const longitudes = rows.map((row) => row.longitude);
  const latitudes = rows.map((row) => row.latitude);
  return [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)];
}

function emitDiscoveryFiles() {
  const allowed = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Googlebot", "Bingbot"];
  const blocked = ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended", "Meta-ExternalAgent", "Bytespider", "Amazonbot"];
  const robots = [
    "# Search and answer-engine retrieval is welcome. Dedicated model-training crawlers are blocked.",
    "User-agent: *", "Allow: /", "",
    ...allowed.flatMap((agent) => [`User-agent: ${agent}`, "Allow: /", ""]),
    ...blocked.flatMap((agent) => [`User-agent: ${agent}`, "Disallow: /", ""]),
    `Sitemap: ${ORIGIN}/sitemap.xml`, ""
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "robots.txt"), robots);

  const urls = [];
  for (const localeKey of supportedSeoLocales) {
    urls.push(pagePath(localeKey, "home"), pagePath(localeKey, "badges"), pagePath(localeKey, "locations"), pagePath(localeKey, "about"), pagePath(localeKey, "data"));
    for (const badge of data.badges) urls.push(pagePath(localeKey, "badge", badge));
    for (const site of data.sites) urls.push(pagePath(localeKey, "location", site));
  }
  const routeInfo = new Map();
  for (const localeKey of supportedSeoLocales) {
    routeInfo.set(pagePath(localeKey, "home"), [localeKey, "home", undefined]);
    for (const type of ["badges", "locations", "about", "data"]) routeInfo.set(pagePath(localeKey, type), [localeKey, type, undefined]);
    for (const badge of data.badges) routeInfo.set(pagePath(localeKey, "badge", badge), [localeKey, "badge", badge]);
    for (const site of data.sites) routeInfo.set(pagePath(localeKey, "location", site), [localeKey, "location", site]);
  }
  const sitemapUrls = urls.map((route) => {
    const [, type, entity] = routeInfo.get(route);
    const alternates = supportedSeoLocales.map((localeKey) => `    <xhtml:link rel="alternate" hreflang="${esc(SEO_HREFLANG[localeKey])}" href="${esc(absolute(pagePath(localeKey, type, entity)))}"/>`).join("\n");
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(absolute(pagePath("en", type, entity)))}"/>`;
    return `  <url>\n    <loc>${esc(absolute(route))}</loc>\n${alternates}\n${xDefault}\n  </url>`;
  }).join("\n");
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapUrls}\n</urlset>\n`);

  const llms = `# Iconic Chargers\n\n> An independent, citation-ready atlas of Tesla Charging Passport badges and their mapped Supercharger sites. Created and published by Lakshman Turlapati.\n\nSnapshot: ${data.snapshot_date}. Badge names were read from the Tesla app; site facts come from Supercharge.info. Approximate mappings are explicitly labeled. Iconic Chargers is independent and is not affiliated with or endorsed by Tesla. It does not provide live availability.\n\nPreferred citation: ${SNAPSHOT_CITATION}\n\nRights: Lakshman Turlapati's original mappings, selection, and editorial text are CC BY 4.0. Upstream Supercharge.info facts, Tesla names/trademarks, and basemap data are excluded.\n\n## Project pages\n\n- [Canonical site](${ORIGIN}/): Interactive map and project overview.\n- [About and methodology](${ORIGIN}/about/): Scope, provenance, and uncertainty.\n- [Badge directory](${ORIGIN}/badges/): All 40 badge records.\n- [Location directory](${ORIGIN}/locations/): All 53 mapped sites.\n- [Dataset and citation](${ORIGIN}/data/): Downloads, rights, and preferred citation.\n- [Full rights terms](${ORIGIN}/DATA-RIGHTS.md): CC BY 4.0 scope and exclusions.\n- [Source repository](${REPOSITORY}): Generator and source data.\n\n## Machine-readable resources\n\n- [Complete text snapshot](${ORIGIN}/llms-full.txt): Full English methodology, badges, and locations.\n- [Badge JSON](${ORIGIN}/data/iconic-badges.json): Canonical English badge feed.\n- [Location JSON](${ORIGIN}/data/locations.json): Canonical English flattened location feed.\n- [Location CSV](${ORIGIN}/data/locations.csv): Tabular flattened location feed.\n- [Location GeoJSON](${ORIGIN}/data/locations.geojson): Geographic flattened location feed.\n`;
  fs.writeFileSync(path.join(OUT, "llms.txt"), llms);

  const badgeText = data.badges.map((badge) => {
    const sites = sitesByBadge.get(badge.badge).map((site) => `  - ${site.name} (Supercharge.info ID ${site.supercharge_info_id}): ${absolute(pagePath("en", "location", site))}`).join("\n");
    return `## ${badge.badge}\n\n- Region: ${badge.region}\n- Reason: ${data.reasons[badge.reason]} (${badge.reason})\n- Confidence: ${badge.confidence}\n- Description: ${badge.why}\n- Note: ${badge.note || "None"}\n- Badge page: ${absolute(pagePath("en", "badge", badge))}\n- Map: ${ORIGIN}/#${encodeURIComponent(badge.badge)}\n- Locations (${badge.site_count}):\n${sites}`;
  }).join("\n\n");
  const locationText = records.map((record) => `## ${record.name} (Supercharge.info ID ${record.supercharge_info_id})\n\n- Address: ${[record.address, record.city, record.state, record.country].filter(Boolean).join(", ")}\n- Coordinates: ${record.latitude}, ${record.longitude} (${data.coordinate_datum})\n- Stalls: ${record.stalls ?? "unknown"}\n- Peak power: ${record.peak_power_kw == null ? "unknown" : `${record.peak_power_kw} kW`}\n- Elevation: ${record.elevation_m == null ? "unknown" : `${record.elevation_m} m`}\n- Opened: ${record.opened || "unknown"}\n- Status: ${record.status || "unknown"}\n- Tesla location ID: ${record.tesla_location_id || "unknown"}\n- Badge: ${record.badge}\n- Badge confidence: ${record.badge_confidence}\n- Badge description: ${record.badge_description}\n- Badge note: ${record.badge_note || "None"}\n- Page: ${record.page_url}\n- Badge page: ${record.badge_page_url}\n- Map: ${record.map_url}`).join("\n\n");
  const full = `# Iconic Chargers — complete snapshot\n\nSnapshot date: ${data.snapshot_date}\nAuthor and publisher: Lakshman Turlapati\nCanonical dataset page: ${ORIGIN}/data/\nPreferred citation: ${SNAPSHOT_CITATION}\n\n## Identity\n\nIconic Chargers is an independent atlas of all 40 Tesla Charging Passport Iconic Charger badges recorded in the Tesla app and 53 mapped Supercharger sites worldwide. It is not affiliated with or endorsed by Tesla and does not provide live charger availability.\n\n## Methodology and provenance\n\n${seoCopy("en").text.methodology}\n\n${seoCopy("en").text.provenance}\n\n${seoCopy("en").text.uncertainty}\n\nBadge source: ${data.badge_source}\nSite source: ${data.site_source}\nTesla documentation: ${TESLA_BADGE_SOURCE}\nCoordinate datum: ${data.coordinate_datum}\n\n## Rights\n\n${seoCopy("en").text.rights}\nFull terms: ${ORIGIN}/DATA-RIGHTS.md\n\n# Badges (40)\n\n${badgeText}\n\n# Locations (53)\n\n${locationText}\n`;
  fs.writeFileSync(path.join(OUT, "llms-full.txt"), full);
}

function emitSupportFiles() {
  fs.copyFileSync(path.join(ROOT, "CITATION.cff"), path.join(OUT, "CITATION.cff"));
  fs.copyFileSync(path.join(ROOT, "DATA-RIGHTS.md"), path.join(OUT, "DATA-RIGHTS.md"));
  writeJson(path.join(OUT, "manifest.webmanifest"), {
    name: "Iconic Chargers",
    short_name: "Iconic Chargers",
    description: seoCopy("en").text.intro,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }]
  });
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#151515"/><path d="M37 5 15 35h14l-4 24 24-34H35z" fill="#d4af37"/></svg>\n`;
  fs.writeFileSync(path.join(OUT, "favicon.svg"), favicon);
  const copy = seoCopy("en");
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", name: "Page not found", url: `${ORIGIN}/404.html` };
  const body = `<h1>Page not found</h1><p class="lead">The requested page does not exist.</p><div class="actions"><a class="button" href="/">${copy.labels.map}</a><a class="button secondary" href="/locations/">${copy.labels.locations}</a></div>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | Iconic Chargers</title><meta name="robots" content="noindex, nofollow"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>${STATIC_CSS}</style><script type="application/ld+json">${jsonScript(jsonLd)}</script></head><body><header><div class="wrap bar"><a class="brand" href="/">Iconic Chargers</a>${nav("en", copy)}</div></header><main class="wrap">${body}</main></body></html>\n`;
  fs.writeFileSync(path.join(OUT, "404.html"), html);
}

main();
