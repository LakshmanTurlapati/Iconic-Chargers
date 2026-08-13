import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const window = {};
const context = vm.createContext({ window });
vm.runInContext(fs.readFileSync(new URL("web/sites.js", root), "utf8"), context,
  { filename: "web/sites.js" });
vm.runInContext(fs.readFileSync(new URL("web/locales.js", root), "utf8"), context,
  { filename: "web/locales.js" });

const data = window.ICONIC;
const i18n = window.ICONIC_I18N;
const expectedLocales = [
  "en", "fr", "de", "nl", "nb", "nn", "it", "es", "tr", "cs",
  "he", "ar", "ja", "ko", "zh-Hans", "zh-Hant", "yue-Hant", "mi"
];
const requiredCountries = [...new Set(data.sites.map((site) => site.country))].sort();
const requiredRegions = [...data.regions].sort();
const requiredReasons = [...new Set(data.badges.map((badge) => badge.reason))].sort();
const requiredBadges = data.badges.map((badge) => badge.badge).sort();
const sourceBadge = Object.fromEntries(data.badges.map((badge) => [badge.badge, badge]));
const failures = [];
const expectedCountryLocales = {
  US: ["en", "es"], CA: ["en", "fr"], GB: ["en"], AU: ["en"],
  NZ: ["en", "mi"], FR: ["fr"], DE: ["de"], NL: ["nl"],
  NO: ["nb", "nn"], IT: ["it"], ES: ["es"], TR: ["tr"], CZ: ["cs"],
  IL: ["he", "ar"], JP: ["ja"], KR: ["ko"], CN: ["zh-Hans"],
  TW: ["zh-Hant"], HK: ["yue-Hant", "zh-Hant", "en"]
};
// These values are genuinely spelled the same in English and the target
// language; every other identical label is treated as an untranslated leak.
const nativeShared = {
  fr: { regions: ["Europe"], reasons: ["destination.short"], countries: ["Canada", "France"] },
  de: { countries: ["Israel", "Japan", "Taiwan", "China"] },
  nl: { countries: ["Canada", "Japan", "Taiwan", "China"] },
  nb: { regions: ["Asia"], countries: ["Canada", "Israel", "Japan", "Taiwan", "New Zealand", "Australia"] },
  nn: { regions: ["Asia"], countries: ["Canada", "Israel", "Japan", "Taiwan", "New Zealand", "Australia"] },
  it: { regions: ["Asia", "Oceania"], countries: ["Canada", "Taiwan", "Australia"] },
  es: { regions: ["Asia"], countries: ["Israel", "China", "Australia"] },
  tr: { countries: ["Turkey"] }
};

function check(condition, message) {
  if (!condition) failures.push(message);
}
function keys(value) { return Object.keys(value || {}).sort(); }
function sameKeys(actual, expected) {
  return JSON.stringify(keys(actual)) === JSON.stringify([...expected].sort());
}
function placeholders(value) {
  return [...String(value).matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((match) => match[1]).sort();
}

check(JSON.stringify([...i18n.order]) === JSON.stringify(expectedLocales),
  "locale order does not match the supported 18-locale contract");
check(sameKeys(i18n.locales, expectedLocales), "catalog is missing or adds locales");
check(JSON.stringify(i18n.countryLocales) === JSON.stringify(expectedCountryLocales),
  "country-to-locale policy differs from the product contract");
check(data.badges.length === 40, "source must contain 40 badge descriptions");
check(data.badges.filter((badge) => badge.note != null).length === 14,
  "source must contain 14 badge notes");

const english = i18n.locales.en;
const invariantUi = new Set([
  // Product/brand terms and punctuation-only interpolation shells may be
  // identical even when all surrounding language is translated.
  "heading", "summaryAll", "summaryDated", "regionCount", "markerAria",
  "superchargersHeading", "factSupercharger", "actionTesla"
]);
for (const key of expectedLocales) {
  const catalog = i18n.locales[key];
  if (!catalog) continue;
  try {
    check(Intl.getCanonicalLocales(key)[0] === key, `${key}: invalid or noncanonical BCP 47 tag`);
  } catch {
    failures.push(`${key}: invalid BCP 47 tag`);
  }
  check(typeof catalog.name === "string" && catalog.name.trim(), `${key}: missing native name`);
  check(catalog.dir === "ltr" || catalog.dir === "rtl", `${key}: invalid direction`);
  check((key === "he" || key === "ar") === (catalog.dir === "rtl"),
    `${key}: unexpected direction`);
  check(Array.isArray(catalog.mapNames) && catalog.mapNames.length > 0 &&
    catalog.mapNames.every((field) => /^name:/.test(field)), `${key}: invalid map-name fallback`);

  check(sameKeys(catalog.ui, keys(english.ui)), `${key}: UI keys differ from English`);
  for (const uiKey of keys(english.ui)) {
    check(typeof catalog.ui[uiKey] === "string" && catalog.ui[uiKey].trim(),
      `${key}.${uiKey}: empty UI message`);
    check(JSON.stringify(placeholders(catalog.ui[uiKey])) ===
      JSON.stringify(placeholders(english.ui[uiKey])), `${key}.${uiKey}: placeholder mismatch`);
    if (key !== "en" && !invariantUi.has(uiKey)) {
      check(catalog.ui[uiKey] !== english.ui[uiKey], `${key}.${uiKey}: UI message remains English`);
    }
  }

  check(sameKeys(catalog.nouns, ["badge", "stall", "supercharger"]),
    `${key}: noun keys differ`);
  const pluralCategories = new Intl.PluralRules(key).resolvedOptions().pluralCategories;
  for (const noun of ["badge", "stall", "supercharger"]) {
    check(sameKeys(catalog.nouns[noun], pluralCategories),
      `${key}.${noun}: plural variants must be ${pluralCategories.join(", ")}`);
    for (const category of pluralCategories) {
      check(JSON.stringify(placeholders(catalog.nouns[noun][category])) === '["count"]',
        `${key}.${noun}.${category}: requires exactly {count}`);
    }
  }

  check(sameKeys(catalog.regions, requiredRegions), `${key}: region keys differ`);
  check(sameKeys(catalog.countries, requiredCountries), `${key}: country keys differ`);
  check(sameKeys(catalog.reasons, requiredReasons), `${key}: reason keys differ`);
  const shared = nativeShared[key] || {};
  for (const region of requiredRegions) {
    check(typeof catalog.regions[region] === "string" && catalog.regions[region].trim(),
      `${key}.${region}: empty region label`);
    if (key !== "en" && catalog.regions[region] === english.regions[region]) {
      check((shared.regions || []).includes(region),
        `${key}.${region}: region label remains English`);
    }
  }
  for (const country of requiredCountries) {
    check(typeof catalog.countries[country] === "string" && catalog.countries[country].trim(),
      `${key}.${country}: empty country label`);
    if (key !== "en" && catalog.countries[country] === english.countries[country]) {
      check((shared.countries || []).includes(country),
        `${key}.${country}: country label remains English`);
    }
  }
  for (const reason of requiredReasons) {
    check(sameKeys(catalog.reasons[reason], ["long", "short"]),
      `${key}.${reason}: reason variants differ`);
    for (const length of ["long", "short"]) {
      check(typeof catalog.reasons[reason][length] === "string" &&
        catalog.reasons[reason][length].trim(), `${key}.${reason}.${length}: empty reason label`);
      if (key !== "en" && catalog.reasons[reason][length] === english.reasons[reason][length]) {
        check((shared.reasons || []).includes(`${reason}.${length}`),
          `${key}.${reason}.${length}: reason label remains English`);
      }
    }
  }

  check(sameKeys(catalog.badges, requiredBadges), `${key}: badge keys differ`);
  for (const badgeName of requiredBadges) {
    const translated = catalog.badges[badgeName];
    const source = sourceBadge[badgeName];
    check(translated && typeof translated.why === "string" && translated.why.trim(),
      `${key}.${badgeName}: missing description`);
    check((translated && translated.note == null) === (source.note == null),
      `${key}.${badgeName}: note nullability differs from source`);
    if (source.note != null) {
      check(typeof translated.note === "string" && translated.note.trim(),
        `${key}.${badgeName}: missing note`);
    }
    if (key !== "en" && translated) {
      check(translated.why !== source.why, `${key}.${badgeName}: description remains English`);
      if (source.note != null) {
        check(translated.note !== source.note, `${key}.${badgeName}: note remains English`);
      }
    }
  }
}

const resolverCases = [
  ["US Spanish", "US", ["es-MX", "en-US"], "es"],
  ["US English", "US", ["en-US", "es-MX"], "en"],
  ["Canadian French", "CA", ["fr-CA", "en-CA"], "fr"],
  ["Norwegian Nynorsk", "NO", ["nn-NO"], "nn"],
  ["Norwegian default", "NO", ["de-DE"], "nb"],
  ["Israel Arabic", "IL", ["ar", "he"], "ar"],
  ["Israel Hebrew", "IL", ["he", "ar"], "he"],
  ["China", "CN", ["zh-CN"], "zh-Hans"],
  ["Taiwan", "TW", ["zh-TW"], "zh-Hant"],
  ["Hong Kong Cantonese", "HK", ["yue-HK", "zh-HK"], "yue-Hant"],
  ["Hong Kong Chinese", "HK", ["zh-HK", "en-HK"], "zh-Hant"],
  ["New Zealand Māori", "NZ", ["mi-NZ", "en-NZ"], "mi"],
  ["unmapped country", "BR", ["es-AR", "en"], "es"],
  ["unsupported locale", "US", ["pt-BR"], "en"]
];
for (const [label, country, tags, expected] of resolverCases) {
  const supported = i18n.supportedFromTags(tags);
  const actual = i18n.localeForCountry(country, supported, "en");
  check(actual === expected, `${label}: expected ${expected}, got ${actual}`);
}
check(i18n.matchLocale("no-NN") === "nn", "no-NN should resolve to nn");
check(i18n.matchLocale("zh-HK") === "zh-Hant", "zh-HK should resolve to zh-Hant");
check(i18n.matchLocale("zh-Hans-HK") === "zh-Hans",
  "an explicit zh-Hans script should win over the HK region");
check(i18n.matchLocale("yue-HK") === "yue-Hant", "yue-HK should resolve to yue-Hant");
check(i18n.supportedFromTags(["xx-ZZ"]).length === 0,
  "unsupported browser locales should remain unsupported");

if (failures.length) {
  console.error(`i18n verification failed (${failures.length})`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(`i18n catalog: ${expectedLocales.length} locales, 40 descriptions, 14 notes — OK`);
