(function () {
  "use strict";

  var DATA = window.ICONIC;
  var badges = {};
  DATA.badges.forEach(function (badge) {
    badges[badge.badge] = { why: badge.why, note: badge.note };
  });

  var en = {
    name: "English",
    dir: "ltr",
    mapNames: ["name:en"],
    ui: {
      documentTitle: "Tesla Iconic Charger badges — world map",
      heading: "Iconic Chargers",
      mapAria: "Interactive map of Iconic Chargers",
      mapUnavailableTitle: "Map unavailable",
      mapFallback: "The charger list and details still work.",
      mapSoftwareError: "Map software did not load. The charger list and details still work.",
      webglError: "WebGL could not start. The charger list and details still work.",
      vectorMapError: "The vector map could not load. The charger list and details still work.",
      contextLost: "The map lost its graphics context. The charger list and details still work.",
      searchPlaceholder: "Search Iconic Chargers",
      searchAria: "Search badges, cities and countries",
      clearSearch: "Clear search",
      filterAria: "Filter by region",
      nearMe: "Near me",
      locating: "Locating…",
      footnote: "The lightning-bolt number is total stalls, not live availability.",
      detailsAria: "Supercharger details",
      closeDetails: "Close details",
      resizeList: "Resize the list",
      resizeDetails: "Resize the details",
      languageLabel: "Language",
      automatic: "Automatic",
      all: "All",
      noMatches: "No badges match that search.",
      summaryAll: "{badges} · {sites}",
      summaryFiltered: "{visible} of {total} · {sites}",
      summaryDated: "{badges} · {sites} · {date}",
      regionCount: "{region} · {count}",
      markerAria: "{label}, {stalls}",
      approx: "approx",
      superchargersHeading: "Superchargers",
      statsStallsTotal: "stalls total",
      statsStalls: "stalls",
      statsPeak: "peak",
      statsAway: "away",
      approxMany: "Matched to these Superchargers by proximity — Tesla does not publish the mapping, so it is not confirmed in the app.",
      approxOne: "Matched to this Supercharger by proximity — Tesla does not publish the mapping, so it is not confirmed in the app.",
      factSupercharger: "Supercharger",
      factAddress: "Address",
      factCoordinates: "Coordinates",
      factPower: "Power",
      factElevation: "Elevation",
      factListed: "Listed",
      actionGoogle: "Open in Google Maps",
      actionTesla: "Tesla",
      locationUnsupported: "This browser can’t share a location.",
      locationDenied: "Location permission denied — still sorted by region.",
      locationFailed: "Couldn’t get your location — still sorted by region.",
      mapControlTitle: "Map",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      resetBearing: "Reset bearing to north",
      toggleAttribution: "Toggle attribution",
      siteData: "site data",
      unknown: "unknown"
    },
    nouns: {
      badge: { one: "{count} badge", other: "{count} badges" },
      supercharger: { one: "{count} Supercharger", other: "{count} Superchargers" },
      stall: { one: "{count} stall", other: "{count} stalls" }
    },
    regions: {
      "North America": "North America",
      Europe: "Europe",
      Asia: "Asia",
      Oceania: "Oceania"
    },
    countries: {
      USA: "United States",
      Canada: "Canada",
      Germany: "Germany",
      Netherlands: "Netherlands",
      France: "France",
      Norway: "Norway",
      "United Kingdom": "United Kingdom",
      Italy: "Italy",
      Spain: "Spain",
      Turkey: "Türkiye",
      "Czech Republic": "Czechia",
      Israel: "Israel",
      Japan: "Japan",
      "South Korea": "South Korea",
      Taiwan: "Taiwan",
      China: "China",
      "New Zealand": "New Zealand",
      Australia: "Australia"
    },
    reasons: {
      flagship: { long: "Flagship Tesla site", short: "Flagship" },
      significance: { long: "Special significance", short: "Significance" },
      destination: { long: "Famous destination", short: "Destination" }
    },
    badges: badges
  };

  window.ICONIC_I18N = {
    defaultLocale: "en",
    order: [
      "en", "fr", "de", "nl", "nb", "nn", "it", "es", "tr", "cs",
      "he", "ar", "ja", "ko", "zh-Hans", "zh-Hant", "yue-Hant", "mi"
    ],
    countryLocales: {
      US: ["en", "es"], CA: ["en", "fr"], GB: ["en"], AU: ["en"],
      NZ: ["en", "mi"], FR: ["fr"], DE: ["de"], NL: ["nl"],
      NO: ["nb", "nn"], IT: ["it"], ES: ["es"], TR: ["tr"], CZ: ["cs"],
      IL: ["he", "ar"], JP: ["ja"], KR: ["ko"], CN: ["zh-Hans"],
      TW: ["zh-Hant"], HK: ["yue-Hant", "zh-Hant", "en"]
    },
    locales: { en: en }
  };
})();
(function (api) {
  "use strict";
  api.matchLocale = function (tag) {
    var canonical;
    try { canonical = Intl.getCanonicalLocales(String(tag || ""))[0] || ""; }
    catch (e) { return null; }
    if (api.locales[canonical]) return canonical;
    var lower = canonical.toLowerCase();
    var language = lower.split("-")[0];
    if (language === "yue") return "yue-Hant";
    if (language === "zh") {
      if (/-hans\b/.test(lower)) return "zh-Hans";
      if (/-hant\b/.test(lower)) return "zh-Hant";
      return /-(tw|hk|mo)\b/.test(lower) ? "zh-Hant" : "zh-Hans";
    }
    if (language === "no") return /-nn\b/.test(lower) ? "nn" : "nb";
    return api.order.find(function (key) {
      return key.toLowerCase().split("-")[0] === language && api.locales[key];
    }) || null;
  };
  api.supportedFromTags = function (tags) {
    var matches = [];
    Array.prototype.forEach.call(tags || [], function (tag) {
      var key = api.matchLocale(tag);
      if (key && matches.indexOf(key) < 0) matches.push(key);
    });
    return matches;
  };
  api.localeForCountry = function (country, browserLocales, fallback) {
    var allowed = api.countryLocales[country];
    if (!allowed) return (browserLocales && browserLocales[0]) || fallback || api.defaultLocale;
    for (var i = 0; i < (browserLocales || []).length; i++) {
      if (allowed.indexOf(browserLocales[i]) >= 0) return browserLocales[i];
    }
    return allowed.find(function (key) { return api.locales[key]; }) || api.defaultLocale;
  };
})(window.ICONIC_I18N);
Object.assign(window.ICONIC_I18N.locales, {
  "he": {
    "name": "עברית",
    "dir": "rtl",
    "mapNames": [
      "name:he"
    ],
    "ui": {
      "documentTitle": "תגי המטענים האיקוניים של Tesla — מפת העולם",
      "heading": "מטענים איקוניים",
      "mapAria": "מפה אינטראקטיבית של מטענים איקוניים",
      "mapUnavailableTitle": "המפה אינה זמינה",
      "mapFallback": "רשימת המטענים והפרטים עדיין זמינים.",
      "mapSoftwareError": "תוכנת המפה לא נטענה. רשימת המטענים והפרטים עדיין זמינים.",
      "webglError": "לא ניתן היה להפעיל את WebGL. רשימת המטענים והפרטים עדיין זמינים.",
      "vectorMapError": "לא ניתן היה לטעון את המפה הווקטורית. רשימת המטענים והפרטים עדיין זמינים.",
      "contextLost": "המפה איבדה את ההקשר הגרפי שלה. רשימת המטענים והפרטים עדיין זמינים.",
      "searchPlaceholder": "חיפוש מטענים איקוניים",
      "searchAria": "חיפוש בתגים, בערים ובמדינות",
      "clearSearch": "ניקוי החיפוש",
      "filterAria": "סינון לפי אזור",
      "nearMe": "בקרבתי",
      "locating": "מאתר…",
      "footnote": "המספר שלצד סמל הברק הוא מספר עמדות הטעינה הכולל, לא הזמינות בזמן אמת.",
      "detailsAria": "פרטי הסופרצ׳רג׳ר",
      "closeDetails": "סגירת הפרטים",
      "resizeList": "שינוי גודל הרשימה",
      "resizeDetails": "שינוי גודל הפרטים",
      "languageLabel": "שפה",
      "automatic": "אוטומטי",
      "all": "הכול",
      "noMatches": "אין תגים התואמים לחיפוש הזה.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} מתוך {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "בקירוב",
      "superchargersHeading": "סופרצ׳רג׳רים",
      "statsStallsTotal": "עמדות בסך הכול",
      "statsStalls": "עמדות",
      "statsPeak": "הספק מרבי",
      "statsAway": "מכאן",
      "approxMany": "השידוך לסופרצ׳רג׳רים האלה מבוסס על קרבה — Tesla אינה מפרסמת את המיפוי, ולכן הוא אינו מאומת באפליקציה.",
      "approxOne": "השידוך לסופרצ׳רג׳ר הזה מבוסס על קרבה — Tesla אינה מפרסמת את המיפוי, ולכן הוא אינו מאומת באפליקציה.",
      "factSupercharger": "סופרצ׳רג׳ר",
      "factAddress": "כתובת",
      "factCoordinates": "קואורדינטות",
      "factPower": "הספק",
      "factElevation": "גובה",
      "factListed": "נרשם",
      "actionGoogle": "פתיחה ב-Google Maps",
      "actionTesla": "Tesla",
      "locationUnsupported": "הדפדפן הזה אינו יכול לשתף מיקום.",
      "locationDenied": "ההרשאה למיקום נדחתה — המיון לפי אזור נשמר.",
      "locationFailed": "לא ניתן היה לקבל את המיקום — המיון לפי אזור נשמר.",
      "mapControlTitle": "מפה אינטראקטיבית",
      "zoomIn": "התקרבות",
      "zoomOut": "התרחקות",
      "resetBearing": "איפוס כיוון המפה לצפון",
      "toggleAttribution": "הצגה או הסתרה של פרטי הייחוס",
      "siteData": "נתוני האתר",
      "unknown": "לא ידוע"
    },
    "nouns": {
      "badge": {
        "one": "{count} תג",
        "two": "{count} תגים",
        "other": "{count} תגים"
      },
      "supercharger": {
        "one": "{count} סופרצ׳רג׳ר",
        "two": "{count} סופרצ׳רג׳רים",
        "other": "{count} סופרצ׳רג׳רים"
      },
      "stall": {
        "one": "{count} עמדת טעינה",
        "two": "{count} עמדות טעינה",
        "other": "{count} עמדות טעינה"
      }
    },
    "regions": {
      "North America": "אמריקה הצפונית",
      "Europe": "אירופה",
      "Asia": "אסיה",
      "Oceania": "אוקיאניה"
    },
    "countries": {
      "Australia": "אוסטרליה",
      "Canada": "קנדה",
      "China": "סין",
      "Czech Republic": "צ׳כיה",
      "France": "צרפת",
      "Germany": "גרמניה",
      "Israel": "ישראל",
      "Italy": "איטליה",
      "Japan": "יפן",
      "Netherlands": "הולנד",
      "New Zealand": "ניו זילנד",
      "Norway": "נורווגיה",
      "South Korea": "קוריאה הדרומית",
      "Spain": "ספרד",
      "Taiwan": "טאיוואן",
      "Turkey": "טורקיה",
      "USA": "ארצות הברית",
      "United Kingdom": "הממלכה המאוחדת"
    },
    "reasons": {
      "flagship": {
        "long": "אתר דגל של Tesla",
        "short": "אתר דגל"
      },
      "significance": {
        "long": "חשיבות מיוחדת",
        "short": "ייחודי"
      },
      "destination": {
        "long": "יעד מפורסם",
        "short": "יעד"
      }
    },
    "badges": {
      "Arches": {
        "why": "במואב, בסיס היציאה לפארקים הלאומיים ארצ׳ס וקניונלנדס.",
        "note": "שני האתרים במואב מרוחקים 1.5 ק״מ זה מזה; שניהם מופיעים ברשימה."
      },
      "Bryce Canyon": {
        "why": "בשערי הפארק הלאומי ברייס קניון והאמפיתיאטראות של עמודי הסלע שבו.",
        "note": null
      },
      "Death Valley": {
        "why": "השער המזרחי לעמק המוות, בדרך הנכנסת דרך מעבר דיילייט.",
        "note": "אין סופרצ׳רג׳ר בתוך הפארק — Furnace Creek עדיין לא נבנה (סטטוס VOTING). האתר הפעיל הקרוב ביותר הוא Beatty, במרחק 51 ק״מ."
      },
      "Golden Gate": {
        "why": "בפרסידיו, הסופרצ׳רג׳ר הקרוב ביותר לגשר שער הזהב.",
        "note": "3.5 ק״מ מהגשר; האתרים ברחוב לומברד ובשדרות גירי הם הבאים בקרבתם."
      },
      "Grand Canyon": {
        "why": "שני מיילים מהכניסה לשפה הדרומית של הגרנד קניון.",
        "note": null
      },
      "Joshua Tree": {
        "why": "בכניסה הצפונית לפארק הלאומי ג׳ושוע טרי.",
        "note": "31 ק״מ ממרכז הפארק; זהו האתר הקרוב ביותר לכניסה לפארק."
      },
      "Las Vegas Strip": {
        "why": "מתחת לגלגל התצפית High Roller בסטריפ — וגם תחנת הסופרצ׳רג׳ר הראשונה של Tesla שבה כל העמדות הן V3, שנפתחה ביולי 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "בסאות׳ ביץ׳, צעדים ספורים מרובע האר דקו ומהאוקיינוס האטלנטי.",
        "note": "שני האתרים במיאמי ביץ׳ מרוחקים 1.7 ק״מ זה מזה; שניהם מופיעים ברשימה."
      },
      "Niagara Falls": {
        "why": "בצד הקנדי, נקודת התצפית אל מפלי הפרסה.",
        "note": "אין סופרצ׳רג׳ר בצד האמריקאי של מפלי הניאגרה."
      },
      "Oasis": {
        "why": "תחנת הטעינה הגדולה בעולם — לפי Tesla יש בה 168 עמדות על פני 30 אקרים לצד כביש I-5, והיא פועלת לחלוטין מחוץ לרשת בעזרת 11 מגה-ואט של אנרגיה סולארית ו-10 יחידות Megapack.",
        "note": null
      },
      "San Antonio River": {
        "why": "קילומטר מטיילת הנהר של סן אנטוניו, הטיילת העירונית שעל שפת המים.",
        "note": null
      },
      "Santa Monica": {
        "why": "לצד מזח סנטה מוניקה והגלגל הענק שלו, בקצה המערבי של כביש 66.",
        "note": "שלושה אתרים בסנטה מוניקה נמצאים בטווח של 3 ק״מ; שני הקרובים ביותר למזח מופיעים ברשימה."
      },
      "Tesla Diner": {
        "why": "הדיינר והדרייב-אין של Tesla בשדרות סנטה מוניקה: 80 עמדות V4, מסעדה הפועלת 24 שעות ושני מסכי LED בגודל 45 רגל שמעבירים שמע למכונית.",
        "note": null
      },
      "Waikiki": {
        "why": "300 מטר מחוף ואיקיקי באואהו — הסופרצ׳רג׳ר היחיד ממש על קו החוף.",
        "note": null
      },
      "Whistler": {
        "why": "בכפר ויסלר, במעלה כביש Sea-to-Sky מוונקובר.",
        "note": "שני האתרים בוויסלר מרוחקים 0.5 ק״מ זה מזה; שניהם מופיעים ברשימה."
      },
      "Yellowstone": {
        "why": "בכניסה המערבית לילוסטון, נקודת הגישה הקרובה ביותר לאולד פיית׳פול.",
        "note": null
      },
      "Yosemite": {
        "why": "על כביש 140 בכניסת Arch Rock — הסופרצ׳רג׳ר היחיד בטווח של 25 ק״מ מעמק יוסמיטי.",
        "note": null
      },
      "Dombås": {
        "why": "אחד מששת האתרים בנורווגיה שנפתחו ב-30 באוגוסט 2013 — הסופרצ׳רג׳רים הראשונים שנבנו מחוץ לאמריקה הצפונית.",
        "note": null
      },
      "Gayrettepe": {
        "why": "אתר הדגל של איסטנבול, בצד האירופי של הבוספורוס.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "במפעל האירופי של Tesla בגרינהיידה, שבו מיוצרות כל מכוניות Model Y האירופיות.",
        "note": null
      },
      "Harderwijk": {
        "why": "אתר הסופרצ׳רג׳ר V4 הראשון בעולם, שנפתח במרץ 2023 — עמודים גבוהים יותר, כבלים ארוכים יותר והתאמה גם לכלי רכב שאינם מתוצרת Tesla.",
        "note": null
      },
      "Hilden": {
        "why": "40 עמדות סביב Bäckerei Schüren, מאפייה אורגנית שהקימה את אחד מפארקי הטעינה העמוסים באירופה — במבנה עץ ועם חווה אנכית במקום.",
        "note": null
      },
      "Honningsvåg": {
        "why": "הסופרצ׳רג׳ר הצפוני ביותר בעולם, בקו רוחב 71.00° צפון, באי מגרייה שעל הדרך לכף הצפוני.",
        "note": null
      },
      "Lake Garda": {
        "why": "ליד החוף הדרומי של אגם גארדה, האגם הגדול באיטליה.",
        "note": "9 ק״מ מהאגם; Castelnuovo del Garda הוא האתר הבא בקרבתו."
      },
      "Lovosice": {
        "why": "על כביש D8 למרגלות גבעות České středohoří, במסדרון פראג–דרזדן.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "בתחילת הסוללה המובילה למנזר שעל אי הגאות בנורמנדי.",
        "note": null
      },
      "Montélimar": {
        "why": "56 עמדות על כביש A7, ״אוטוסטרדת השמש״ — המגה-אתר המקורי של אירופה והתחנה העמוסה ביותר שלה ביציאה לחופשות.",
        "note": null
      },
      "Sevilla": {
        "why": "הסופרצ׳רג׳ר של בירת אנדלוסיה, השער לדרום ספרד.",
        "note": null
      },
      "Stonehenge": {
        "why": "ב-Solstice Park שבאיימסברי, חמישה קילומטרים ממעגל האבנים.",
        "note": null
      },
      "Østerbø": {
        "why": "גבוה באורלנדספיילט, מעבר ההרים הנורווגי המכונה דרך השלג.",
        "note": null
      },
      "Ein Bokek": {
        "why": "הסופרצ׳רג׳ר הנמוך ביותר בעולם, 380 מטר מתחת לפני הים על חוף ים המלח.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "על הכביש המהיר שין-טומיי בשיזואוקה, אתר בולט בעורק הראשי טוקיו–נגויה של יפן.",
        "note": null
      },
      "Fangshan": {
        "why": "ברובע פאנגשאן של בייג׳ינג, מדרום-מערב לבירה.",
        "note": null
      },
      "Gangnam": {
        "why": "בגנגנם, רובע העסקים וחיי הלילה של סיאול.",
        "note": "ארבעה אתרים נמצאים בטווח של 1.8 ק״מ מתחנת גנגנם; הקרוב ביותר מופיע ברשימה."
      },
      "Jeju": {
        "why": "באי ג׳ג׳ו, אי נופש געשי מול החוף הדרומי של קוריאה הדרומית.",
        "note": null
      },
      "Mount Fuji": {
        "why": "בצד גוטמבה של הר פוג׳י, נתיב הגישה הקלאסי אל ההר.",
        "note": "20 ק״מ מהפסגה; Fuji River הוא האתר הבא בקרבתו, במרחק 24 ק״מ."
      },
      "Taipei Xinyi": {
        "why": "בשיניי, הרובע המקיף את טאיפיי 101.",
        "note": "שלושה אתרים נמצאים בטווח של 1.3 ק״מ מטאיפיי 101; הקרוב ביותר מופיע ברשימה."
      },
      "Victoria Harbour": {
        "why": "על קו המים של צים שא צוי, מול האי הונג קונג מעבר לנמל ויקטוריה.",
        "note": "שישה אתרים מקיפים את הנמל בטווח של 2 ק״מ; הקרוב ביותר לקו המים מופיע ברשימה."
      },
      "Dunedin": {
        "why": "הסופרצ׳רג׳ר הדרומי ביותר בעולם, בקו רוחב 45.89° דרום, קרוב יותר לאנטארקטיקה מכל סופרצ׳רג׳ר אחר.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "אפשר לזכות בתג השונית בכל מקום לאורך חוף קווינסלנד שאחריו היא משתרעת, מקיירנס ועד בונדברג — זהו התג היחיד ש-Tesla מציינת כמכסה כמה אתרים.",
        "note": "Tesla מציינת שזהו תג רב-אתרי אך אינה מפרסמת אילו אתרים נכללים בו. כל הסופרצ׳רג׳רים הפעילים בחוף קווינסלנד ובטווח קווי הרוחב של השונית מופיעים ברשימה."
      }
    }
  },
  "ar": {
    "name": "العربية",
    "dir": "rtl",
    "mapNames": [
      "name:ar"
    ],
    "ui": {
      "documentTitle": "شارات شواحن Tesla الأيقونية — خريطة العالم",
      "heading": "الشواحن الأيقونية",
      "mapAria": "خريطة تفاعلية للشواحن الأيقونية",
      "mapUnavailableTitle": "الخريطة غير متاحة",
      "mapFallback": "لا تزال قائمة الشواحن وتفاصيلها متاحة.",
      "mapSoftwareError": "تعذر تحميل برنامج الخرائط. لا تزال قائمة الشواحن وتفاصيلها متاحة.",
      "webglError": "تعذر تشغيل WebGL. لا تزال قائمة الشواحن وتفاصيلها متاحة.",
      "vectorMapError": "تعذر تحميل الخريطة المتجهة. لا تزال قائمة الشواحن وتفاصيلها متاحة.",
      "contextLost": "فقدت الخريطة سياق الرسومات. لا تزال قائمة الشواحن وتفاصيلها متاحة.",
      "searchPlaceholder": "ابحث في الشواحن الأيقونية",
      "searchAria": "البحث في الشارات والمدن والبلدان",
      "clearSearch": "مسح البحث",
      "filterAria": "التصفية حسب المنطقة",
      "nearMe": "بالقرب مني",
      "locating": "جارٍ تحديد الموقع…",
      "footnote": "الرقم بجانب رمز البرق هو إجمالي منافذ الشحن، وليس مدى توفرها لحظيًا.",
      "detailsAria": "تفاصيل الشاحن الفائق",
      "closeDetails": "إغلاق التفاصيل",
      "resizeList": "تغيير حجم القائمة",
      "resizeDetails": "تغيير حجم التفاصيل",
      "languageLabel": "اللغة",
      "automatic": "تلقائي",
      "all": "الكل",
      "noMatches": "لا توجد شارات تطابق هذا البحث.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} من {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}، {stalls}",
      "approx": "تقريبي",
      "superchargersHeading": "الشواحن الفائقة",
      "statsStallsTotal": "إجمالي المنافذ",
      "statsStalls": "منافذ الشحن",
      "statsPeak": "القدرة القصوى",
      "statsAway": "بعيدًا",
      "approxMany": "تمت مطابقة هذه الشواحن الفائقة حسب القرب — لا تنشر Tesla هذا الربط، ولذلك لم يُؤكد في التطبيق.",
      "approxOne": "تمت مطابقة هذا الشاحن الفائق حسب القرب — لا تنشر Tesla هذا الربط، ولذلك لم يُؤكد في التطبيق.",
      "factSupercharger": "الشاحن الفائق",
      "factAddress": "العنوان",
      "factCoordinates": "الإحداثيات",
      "factPower": "القدرة",
      "factElevation": "الارتفاع",
      "factListed": "تاريخ الإدراج",
      "actionGoogle": "فتح في خرائط Google",
      "actionTesla": "Tesla",
      "locationUnsupported": "لا يستطيع هذا المتصفح مشاركة الموقع.",
      "locationDenied": "رُفض إذن الموقع — لا يزال الترتيب حسب المنطقة.",
      "locationFailed": "تعذر الحصول على موقعك — لا يزال الترتيب حسب المنطقة.",
      "mapControlTitle": "خريطة تفاعلية",
      "zoomIn": "تكبير",
      "zoomOut": "تصغير",
      "resetBearing": "إعادة توجيه الخريطة نحو الشمال",
      "toggleAttribution": "إظهار بيانات النسب أو إخفاؤها",
      "siteData": "بيانات الموقع",
      "unknown": "غير معروف"
    },
    "nouns": {
      "badge": {
        "zero": "{count} شارات",
        "one": "{count} شارة",
        "two": "{count} شارتان",
        "few": "{count} شارات",
        "many": "{count} شارة",
        "other": "{count} شارة"
      },
      "supercharger": {
        "zero": "{count} شواحن فائقة",
        "one": "{count} شاحن فائق",
        "two": "{count} شاحنان فائقان",
        "few": "{count} شواحن فائقة",
        "many": "{count} شاحنًا فائقًا",
        "other": "{count} شاحن فائق"
      },
      "stall": {
        "zero": "{count} منافذ شحن",
        "one": "{count} منفذ شحن",
        "two": "{count} منفذا شحن",
        "few": "{count} منافذ شحن",
        "many": "{count} منفذ شحن",
        "other": "{count} منفذ شحن"
      }
    },
    "regions": {
      "North America": "أمريكا الشمالية",
      "Europe": "أوروبا",
      "Asia": "آسيا",
      "Oceania": "أوقيانوسيا"
    },
    "countries": {
      "Australia": "أستراليا",
      "Canada": "كندا",
      "China": "الصين",
      "Czech Republic": "التشيك",
      "France": "فرنسا",
      "Germany": "ألمانيا",
      "Israel": "إسرائيل",
      "Italy": "إيطاليا",
      "Japan": "اليابان",
      "Netherlands": "هولندا",
      "New Zealand": "نيوزيلندا",
      "Norway": "النرويج",
      "South Korea": "كوريا الجنوبية",
      "Spain": "إسبانيا",
      "Taiwan": "تايوان",
      "Turkey": "تركيا",
      "USA": "الولايات المتحدة",
      "United Kingdom": "المملكة المتحدة"
    },
    "reasons": {
      "flagship": {
        "long": "موقع Tesla رئيسي",
        "short": "رئيسي"
      },
      "significance": {
        "long": "أهمية خاصة",
        "short": "مميز"
      },
      "destination": {
        "long": "وجهة شهيرة",
        "short": "وجهة"
      }
    },
    "badges": {
      "Arches": {
        "why": "في موآب، نقطة الانطلاق إلى متنزهي آرتشز وكانيونلاندز الوطنيين.",
        "note": "يفصل بين موقعي موآب 1.5 كم؛ وكلاهما مدرج."
      },
      "Bryce Canyon": {
        "why": "عند بوابات متنزه برايس كانيون الوطني ومدرجاته المليئة بأعمدة الهودو الصخرية.",
        "note": null
      },
      "Death Valley": {
        "why": "البوابة الشرقية إلى وادي الموت، على الطريق الداخل عبر ممر دايلايت.",
        "note": "لا يوجد شاحن فائق داخل المتنزه — لم يُبنَ موقع Furnace Creek بعد (الحالة VOTING). وموقع Beatty هو أقرب موقع عامل، على بُعد 51 كم."
      },
      "Golden Gate": {
        "why": "في بريسيديو، أقرب شاحن فائق إلى جسر البوابة الذهبية.",
        "note": "على بُعد 3.5 كم من الجسر؛ ويليه في القرب موقعا شارع لومبارد وجادة غيري."
      },
      "Grand Canyon": {
        "why": "على بُعد ميلين من مدخل الحافة الجنوبية للغراند كانيون.",
        "note": null
      },
      "Joshua Tree": {
        "why": "عند المدخل الشمالي لمتنزه جوشوا تري الوطني.",
        "note": "على بُعد 31 كم من مركز المتنزه؛ وهو أقرب موقع إلى أحد مداخله."
      },
      "Las Vegas Strip": {
        "why": "تحت عجلة المراقبة High Roller في الستريب — وهي أيضًا أول محطة شواحن فائقة افتتحتها Tesla وكل منافذها من طراز V3، وذلك في يوليو 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "في ساوث بيتش، على بُعد خطوات من حي الآرت ديكو والمحيط الأطلسي.",
        "note": "يفصل بين موقعي ميامي بيتش 1.7 كم؛ وكلاهما مدرج."
      },
      "Niagara Falls": {
        "why": "على الجانب الكندي، عند نقطة الإطلالة على شلالات حدوة الحصان.",
        "note": "لا يوجد شاحن فائق على الجانب الأمريكي من شلالات نياغرا."
      },
      "Oasis": {
        "why": "أكبر محطة شحن على وجه الأرض — تحصي Tesla فيها 168 منفذًا على مساحة 30 فدانًا بجانب الطريق I-5، وتعمل بالكامل خارج الشبكة بطاقة شمسية قدرها 11 ميغاواط و10 وحدات Megapack.",
        "note": null
      },
      "San Antonio River": {
        "why": "على بُعد كيلومتر من ممشى نهر سان أنطونيو، متنزه المدينة الممتد بمحاذاة النهر.",
        "note": null
      },
      "Santa Monica": {
        "why": "بجوار رصيف سانتا مونيكا وعجلته الدوارة، عند الطرف الغربي للطريق 66.",
        "note": "تقع ثلاثة مواقع في سانتا مونيكا ضمن 3 كم؛ وأُدرج الموقعان الأقرب إلى الرصيف."
      },
      "Tesla Diner": {
        "why": "مطعم Tesla وسينما السيارات في جادة سانتا مونيكا: 80 منفذ V4، ومطعم يعمل على مدار الساعة، وشاشتان LED بطول 45 قدمًا تبثان الصوت إلى سيارتك.",
        "note": null
      },
      "Waikiki": {
        "why": "على بُعد 300 م من شاطئ وايكيكي في أواهو — الشاحن الفائق الوحيد على واجهة الشاطئ.",
        "note": null
      },
      "Whistler": {
        "why": "في قرية ويسلر، صعودًا على طريق Sea-to-Sky من فانكوفر.",
        "note": "يفصل بين موقعي ويسلر 0.5 كم؛ وكلاهما مدرج."
      },
      "Yellowstone": {
        "why": "عند المدخل الغربي ليلوستون، أقرب نقطة وصول إلى أولد فيثفول.",
        "note": null
      },
      "Yosemite": {
        "why": "على الطريق 140 عند مدخل Arch Rock — الشاحن الفائق الوحيد ضمن 25 كم من وادي يوسيميتي.",
        "note": null
      },
      "Dombås": {
        "why": "أحد المواقع النرويجية الستة التي افتُتحت في 30 أغسطس 2013 — أول شواحن فائقة بُنيت خارج أمريكا الشمالية.",
        "note": null
      },
      "Gayrettepe": {
        "why": "موقع إسطنبول الرئيسي، على الضفة الأوروبية من البوسفور.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "في مصنع Tesla الأوروبي في غرونهايده، حيث تُصنع كل سيارات Model Y الأوروبية.",
        "note": null
      },
      "Harderwijk": {
        "why": "أول موقع شاحن فائق V4 في العالم، افتُتح في مارس 2023 — أعمدة أطول وكابلات أطول وتصميم يناسب السيارات غير المصنّعة من Tesla أيضًا.",
        "note": null
      },
      "Hilden": {
        "why": "40 منفذًا حول Bäckerei Schüren، وهي مخبزة عضوية بنت أحد أكثر متنزهات الشحن ازدحامًا في أوروبا — بهيكل خشبي ومزرعة عمودية في الموقع.",
        "note": null
      },
      "Honningsvåg": {
        "why": "أقصى شاحن فائق شمالًا على وجه الأرض عند خط عرض 71.00° شمالًا، في جزيرة ماغرويا على الطريق إلى رأس الشمال.",
        "note": null
      },
      "Lake Garda": {
        "why": "بالقرب من الشاطئ الجنوبي لبحيرة غاردا، أكبر بحيرات إيطاليا.",
        "note": "على بُعد 9 كم من البحيرة؛ ويأتي موقع Castelnuovo del Garda بعده في القرب."
      },
      "Lovosice": {
        "why": "على الطريق D8 أسفل تلال České středohoří، في ممر براغ–دريسدن.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "عند الجسر المؤدي إلى دير الجزيرة المدّية في نورماندي.",
        "note": null
      },
      "Montélimar": {
        "why": "56 منفذًا على طريق A7 المعروف باسم طريق الشمس — أول موقع عملاق في أوروبا وأكثر محطاتها ازدحامًا عند انطلاق موسم العطلات.",
        "note": null
      },
      "Sevilla": {
        "why": "الشاحن الفائق لعاصمة الأندلس، بوابة جنوب إسبانيا.",
        "note": null
      },
      "Stonehenge": {
        "why": "في Solstice Park بمدينة أمسبري، على بُعد خمسة كيلومترات من الدائرة الحجرية.",
        "note": null
      },
      "Østerbø": {
        "why": "في مرتفعات أورلاندسفيليت، الممر الجبلي النرويجي المعروف باسم طريق الثلج.",
        "note": null
      },
      "Ein Bokek": {
        "why": "أخفض شاحن فائق على وجه الأرض، على عمق 380 م تحت مستوى سطح البحر على شاطئ البحر الميت.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "على طريق شين-تومي السريع في شيزوكا، موقع بارز على شريان طوكيو–ناغويا الرئيسي في اليابان.",
        "note": null
      },
      "Fangshan": {
        "why": "في حي فانغشان ببكين، جنوب غرب العاصمة.",
        "note": null
      },
      "Gangnam": {
        "why": "في غانغنام، حي الأعمال والحياة الليلية في سول.",
        "note": "تقع أربعة مواقع ضمن 1.8 كم من محطة غانغنام؛ وأُدرج أقربها."
      },
      "Jeju": {
        "why": "في جزيرة جيجو، جزيرة العطلات البركانية قبالة الساحل الجنوبي لكوريا الجنوبية.",
        "note": null
      },
      "Mount Fuji": {
        "why": "على جانب غوتيمبا من جبل فوجي، مسار الوصول التقليدي إلى الجبل.",
        "note": "على بُعد 20 كم من القمة؛ ويأتي موقع Fuji River بعده في القرب على بُعد 24 كم."
      },
      "Taipei Xinyi": {
        "why": "في شينيي، الحي المحيط ببرج تايبيه 101.",
        "note": "تقع ثلاثة مواقع ضمن 1.3 كم من تايبيه 101؛ وأُدرج أقربها."
      },
      "Victoria Harbour": {
        "why": "على واجهة تسيم شا تسوي البحرية، مقابل جزيرة هونغ كونغ عبر ميناء فيكتوريا.",
        "note": "تحيط ستة مواقع بالميناء ضمن 2 كم؛ وأُدرج أقربها إلى الواجهة البحرية."
      },
      "Dunedin": {
        "why": "أقصى شاحن فائق جنوبًا على وجه الأرض عند خط عرض 45.89° جنوبًا، وهو أقرب إلى القارة القطبية الجنوبية من أي شاحن آخر.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "يمكن كسب شارة الحيد المرجاني في أي مكان على امتداد ساحل كوينزلاند الذي يتبعه، من كيرنز جنوبًا إلى بوندابيرغ — وهي الشارة الوحيدة التي تصفها Tesla بأنها تغطي مواقع متعددة.",
        "note": "توثّق Tesla هذه الشارة على أنها متعددة المواقع، لكنها لا تنشر المواقع المشمولة. أُدرج كل شاحن فائق عامل على ساحل كوينزلاند داخل نطاق خطوط عرض الحيد المرجاني."
      }
    }
  },
  "ja": {
    "name": "日本語",
    "dir": "ltr",
    "mapNames": [
      "name:ja"
    ],
    "ui": {
      "documentTitle": "Tesla アイコニックチャージャーのバッジ — 世界地図",
      "heading": "アイコニックチャージャー",
      "mapAria": "アイコニックチャージャーのインタラクティブマップ",
      "mapUnavailableTitle": "地図を利用できません",
      "mapFallback": "チャージャーの一覧と詳細は引き続き利用できます。",
      "mapSoftwareError": "地図ソフトウェアを読み込めませんでした。チャージャーの一覧と詳細は引き続き利用できます。",
      "webglError": "WebGLを起動できませんでした。チャージャーの一覧と詳細は引き続き利用できます。",
      "vectorMapError": "ベクター地図を読み込めませんでした。チャージャーの一覧と詳細は引き続き利用できます。",
      "contextLost": "地図のグラフィックスコンテキストが失われました。チャージャーの一覧と詳細は引き続き利用できます。",
      "searchPlaceholder": "アイコニックチャージャーを検索",
      "searchAria": "バッジ、都市、国を検索",
      "clearSearch": "検索をクリア",
      "filterAria": "地域で絞り込む",
      "nearMe": "現在地周辺",
      "locating": "現在地を取得中…",
      "footnote": "稲妻マーク横の数字はストールの総数であり、リアルタイムの空き状況ではありません。",
      "detailsAria": "スーパーチャージャーの詳細",
      "closeDetails": "詳細を閉じる",
      "resizeList": "リストのサイズを変更",
      "resizeDetails": "詳細のサイズを変更",
      "languageLabel": "言語",
      "automatic": "自動",
      "all": "すべて",
      "noMatches": "検索条件に一致するバッジはありません。",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{total}件中{visible}件 · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}、{stalls}",
      "approx": "推定",
      "superchargersHeading": "スーパーチャージャー",
      "statsStallsTotal": "ストール総数",
      "statsStalls": "ストール",
      "statsPeak": "最大出力",
      "statsAway": "先",
      "approxMany": "近さを基にこれらのスーパーチャージャーと照合しています — Teslaは対応関係を公表していないため、アプリ上では確認されていません。",
      "approxOne": "近さを基にこのスーパーチャージャーと照合しています — Teslaは対応関係を公表していないため、アプリ上では確認されていません。",
      "factSupercharger": "スーパーチャージャー",
      "factAddress": "住所",
      "factCoordinates": "座標",
      "factPower": "出力",
      "factElevation": "標高",
      "factListed": "掲載日",
      "actionGoogle": "Google マップで開く",
      "actionTesla": "Tesla",
      "locationUnsupported": "このブラウザでは現在地を共有できません。",
      "locationDenied": "位置情報の利用が許可されませんでした — 地域順のまま表示します。",
      "locationFailed": "現在地を取得できませんでした — 地域順のまま表示します。",
      "mapControlTitle": "インタラクティブマップ",
      "zoomIn": "拡大",
      "zoomOut": "縮小",
      "resetBearing": "地図を北向きに戻す",
      "toggleAttribution": "帰属情報の表示を切り替える",
      "siteData": "サイトデータ",
      "unknown": "不明"
    },
    "nouns": {
      "badge": {
        "other": "バッジ{count}個"
      },
      "supercharger": {
        "other": "スーパーチャージャー{count}か所"
      },
      "stall": {
        "other": "ストール{count}基"
      }
    },
    "regions": {
      "North America": "北米",
      "Europe": "ヨーロッパ",
      "Asia": "アジア",
      "Oceania": "オセアニア"
    },
    "countries": {
      "Australia": "オーストラリア",
      "Canada": "カナダ",
      "China": "中国",
      "Czech Republic": "チェコ",
      "France": "フランス",
      "Germany": "ドイツ",
      "Israel": "イスラエル",
      "Italy": "イタリア",
      "Japan": "日本",
      "Netherlands": "オランダ",
      "New Zealand": "ニュージーランド",
      "Norway": "ノルウェー",
      "South Korea": "韓国",
      "Spain": "スペイン",
      "Taiwan": "台湾",
      "Turkey": "トルコ",
      "USA": "アメリカ合衆国",
      "United Kingdom": "イギリス"
    },
    "reasons": {
      "flagship": {
        "long": "Teslaを象徴する拠点",
        "short": "フラッグシップ"
      },
      "significance": {
        "long": "特別な意義を持つ場所",
        "short": "特別な場所"
      },
      "destination": {
        "long": "有名な目的地",
        "short": "名所"
      }
    },
    "badges": {
      "Arches": {
        "why": "アーチーズ国立公園とキャニオンランズ国立公園への拠点となるモアブにあります。",
        "note": "モアブの2か所は1.5 km離れており、両方を掲載しています。"
      },
      "Bryce Canyon": {
        "why": "ブライスキャニオン国立公園と、フードゥーが連なる円形劇場状の谷の入口にあります。",
        "note": null
      },
      "Death Valley": {
        "why": "デスバレー東側の玄関口で、デイライト峠を越えて入る道沿いにあります。",
        "note": "公園内にスーパーチャージャーはありません。Furnace Creekは未建設のままです（ステータス：VOTING）。最寄りの稼働中サイトは51 km先のBeattyです。"
      },
      "Golden Gate": {
        "why": "プレシディオにある、ゴールデンゲートブリッジに最も近いスーパーチャージャーです。",
        "note": "橋から3.5 km。次に近いのはLombard StとGeary Blvdです。"
      },
      "Grand Canyon": {
        "why": "グランドキャニオンのサウスリム入口から2マイルの場所にあります。",
        "note": null
      },
      "Joshua Tree": {
        "why": "ジョシュアツリー国立公園の北入口にあります。",
        "note": "公園の中心から31 kmで、公園入口に最も近いサイトです。"
      },
      "Las Vegas Strip": {
        "why": "ストリップの展望観覧車High Rollerの下にあります。2019年7月にTeslaが初めて開設した、全ストールV3のスーパーチャージャーステーションでもあります。",
        "note": null
      },
      "Miami Beach": {
        "why": "サウスビーチにあり、アールデコ地区と大西洋からすぐの場所です。",
        "note": "マイアミビーチの2か所は1.7 km離れており、両方を掲載しています。"
      },
      "Niagara Falls": {
        "why": "カナダ側にある、ホースシュー滝を望む地点です。",
        "note": "ナイアガラの滝の米国側にはスーパーチャージャーがありません。"
      },
      "Oasis": {
        "why": "世界最大の充電ステーションです。Teslaによると、I-5沿いの30エーカーに168基のストールがあり、11 MWの太陽光発電と10台のMegapackだけで完全なオフグリッド運用を行っています。",
        "note": null
      },
      "San Antonio River": {
        "why": "街の川沿いの遊歩道、サンアントニオ・リバーウォークから1 kmの場所です。",
        "note": null
      },
      "Santa Monica": {
        "why": "ルート66の西端、観覧車のあるサンタモニカ・ピアのそばです。",
        "note": "サンタモニカの3か所が3 km圏内にあり、桟橋に最も近い2か所を掲載しています。"
      },
      "Tesla Diner": {
        "why": "サンタモニカ大通りにあるTeslaのダイナー兼ドライブインです。V4ストール80基、24時間営業のレストラン、車内へ音声を配信する45フィートのLEDスクリーン2面を備えています。",
        "note": null
      },
      "Waikiki": {
        "why": "オアフ島のワイキキビーチから300 m。ビーチフロント唯一のスーパーチャージャーです。",
        "note": null
      },
      "Whistler": {
        "why": "バンクーバーからシー・トゥ・スカイ・ハイウェイを上った、ウィスラー・ビレッジ内にあります。",
        "note": "ウィスラーの2か所は0.5 km離れており、両方を掲載しています。"
      },
      "Yellowstone": {
        "why": "イエローストーン西入口にあり、オールド・フェイスフルへの最寄りの進入地点です。",
        "note": null
      },
      "Yosemite": {
        "why": "ハイウェイ140号のアーチロック入口にあり、ヨセミテ渓谷から25 km圏内で唯一のスーパーチャージャーです。",
        "note": null
      },
      "Dombås": {
        "why": "2013年8月30日に開設されたノルウェーの6拠点の一つで、北米以外に初めて建設されたスーパーチャージャー群です。",
        "note": null
      },
      "Gayrettepe": {
        "why": "ボスポラス海峡のヨーロッパ側にある、イスタンブールのフラッグシップ拠点です。",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "欧州向けの全Model Yを生産する、グリューンハイデのTesla欧州工場にあります。",
        "note": null
      },
      "Harderwijk": {
        "why": "2023年3月に開設された世界初のV4スーパーチャージャー拠点です。支柱が高く、ケーブルが長く、Tesla以外の車にも対応する設計です。",
        "note": null
      },
      "Hilden": {
        "why": "オーガニックベーカリーBäckerei Schürenを囲む40基のストール。同店が築いた欧州有数の繁忙な充電パークで、木造の施設内には垂直農場もあります。",
        "note": null
      },
      "Honningsvåg": {
        "why": "北緯71.00度、マーゲロイ島からノールカップへ向かう道にある、世界最北のスーパーチャージャーです。",
        "note": null
      },
      "Lake Garda": {
        "why": "イタリア最大の湖、ガルダ湖の南岸近くにあります。",
        "note": "湖から9 km。次に近いのはCastelnuovo del Gardaです。"
      },
      "Lovosice": {
        "why": "プラハ—ドレスデン回廊の、チェスケー・ストジェドホジー丘陵下を通るD8沿いにあります。",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "ノルマンディーの潮汐島に建つ修道院へ続く土手道の起点にあります。",
        "note": null
      },
      "Montélimar": {
        "why": "太陽の高速道路と呼ばれるA7沿いの56基。欧州初のメガサイトで、休暇シーズンの出発時には欧州で最も混雑するステーションです。",
        "note": null
      },
      "Sevilla": {
        "why": "スペイン南部への玄関口、アンダルシア州都のスーパーチャージャーです。",
        "note": null
      },
      "Stonehenge": {
        "why": "エイムズベリーのSolstice Parkにあり、環状列石から5 kmです。",
        "note": null
      },
      "Østerbø": {
        "why": "スノーロードとして知られるノルウェーの峠、アウルランスフィエレの高地にあります。",
        "note": null
      },
      "Ein Bokek": {
        "why": "死海沿岸の海抜マイナス380 mにある、世界で最も低い場所のスーパーチャージャーです。",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "静岡県の新東名高速道路にある、日本の大動脈である東京—名古屋間を象徴する拠点です。",
        "note": null
      },
      "Fangshan": {
        "why": "北京市中心部の南西に位置する房山区にあります。",
        "note": null
      },
      "Gangnam": {
        "why": "ソウルのビジネスとナイトライフの中心地、江南にあります。",
        "note": "江南駅から1.8 km圏内に4か所あり、最も近い拠点を掲載しています。"
      },
      "Jeju": {
        "why": "韓国南岸沖に浮かぶ火山島のリゾート、済州島にあります。",
        "note": null
      },
      "Mount Fuji": {
        "why": "富士山の御殿場側にある、古くからの登山口への経路です。",
        "note": "山頂から20 km。次に近いFuji Riverは24 km先です。"
      },
      "Taipei Xinyi": {
        "why": "台北101を中心とする信義区にあります。",
        "note": "台北101から1.3 km圏内に3か所あり、最も近い拠点を掲載しています。"
      },
      "Victoria Harbour": {
        "why": "ビクトリア・ハーバー越しに香港島を望む、尖沙咀のウォーターフロントにあります。",
        "note": "港を囲む2 km圏内に6か所あり、ウォーターフロントに最も近い拠点を掲載しています。"
      },
      "Dunedin": {
        "why": "南緯45.89度にある世界最南端のスーパーチャージャーで、ほかのどの拠点よりも南極に近い場所です。",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "リーフに沿うクイーンズランド沿岸のケアンズからバンダバーグまで、どこでも獲得できるバッジです。Teslaが複数拠点を対象と明記している唯一のバッジです。",
        "note": "Teslaはこのバッジが複数拠点対象であることは説明していますが、対象拠点を公表していません。リーフの緯度範囲内にあるクイーンズランド沿岸の稼働中スーパーチャージャーをすべて掲載しています。"
      }
    }
  },
  "ko": {
    "name": "한국어",
    "dir": "ltr",
    "mapNames": [
      "name:ko"
    ],
    "ui": {
      "documentTitle": "Tesla 아이코닉 차저 배지 — 세계 지도",
      "heading": "아이코닉 차저",
      "mapAria": "아이코닉 차저 대화형 지도",
      "mapUnavailableTitle": "지도를 사용할 수 없음",
      "mapFallback": "충전소 목록과 세부 정보는 계속 이용할 수 있습니다.",
      "mapSoftwareError": "지도 소프트웨어를 불러오지 못했습니다. 충전소 목록과 세부 정보는 계속 이용할 수 있습니다.",
      "webglError": "WebGL을 시작하지 못했습니다. 충전소 목록과 세부 정보는 계속 이용할 수 있습니다.",
      "vectorMapError": "벡터 지도를 불러오지 못했습니다. 충전소 목록과 세부 정보는 계속 이용할 수 있습니다.",
      "contextLost": "지도의 그래픽 컨텍스트가 손실되었습니다. 충전소 목록과 세부 정보는 계속 이용할 수 있습니다.",
      "searchPlaceholder": "아이코닉 차저 검색",
      "searchAria": "배지, 도시 및 국가 검색",
      "clearSearch": "검색 지우기",
      "filterAria": "지역별 필터링",
      "nearMe": "내 주변",
      "locating": "위치 확인 중…",
      "footnote": "번개 아이콘 옆 숫자는 전체 충전기 수이며 실시간 이용 가능 수가 아닙니다.",
      "detailsAria": "수퍼차저 세부 정보",
      "closeDetails": "세부 정보 닫기",
      "resizeList": "목록 크기 조절",
      "resizeDetails": "세부 정보 크기 조절",
      "languageLabel": "언어",
      "automatic": "자동",
      "all": "전체",
      "noMatches": "검색과 일치하는 배지가 없습니다.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{total}개 중 {visible}개 · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "추정",
      "superchargersHeading": "수퍼차저",
      "statsStallsTotal": "전체 충전기",
      "statsStalls": "충전기",
      "statsPeak": "최대 출력",
      "statsAway": "거리",
      "approxMany": "거리상 가까운 이 수퍼차저들과 연결했습니다 — Tesla가 대응 관계를 공개하지 않으므로 앱에서 확인된 정보는 아닙니다.",
      "approxOne": "거리상 가까운 이 수퍼차저와 연결했습니다 — Tesla가 대응 관계를 공개하지 않으므로 앱에서 확인된 정보는 아닙니다.",
      "factSupercharger": "수퍼차저",
      "factAddress": "주소",
      "factCoordinates": "좌표",
      "factPower": "출력",
      "factElevation": "고도",
      "factListed": "등록일",
      "actionGoogle": "Google 지도에서 열기",
      "actionTesla": "Tesla",
      "locationUnsupported": "이 브라우저에서는 위치를 공유할 수 없습니다.",
      "locationDenied": "위치 권한이 거부되었습니다 — 지역순 정렬을 유지합니다.",
      "locationFailed": "현재 위치를 가져오지 못했습니다 — 지역순 정렬을 유지합니다.",
      "mapControlTitle": "대화형 지도",
      "zoomIn": "확대",
      "zoomOut": "축소",
      "resetBearing": "지도를 북쪽 방향으로 재설정",
      "toggleAttribution": "저작자 표시 전환",
      "siteData": "사이트 데이터",
      "unknown": "알 수 없음"
    },
    "nouns": {
      "badge": {
        "other": "배지 {count}개"
      },
      "supercharger": {
        "other": "수퍼차저 {count}곳"
      },
      "stall": {
        "other": "충전기 {count}기"
      }
    },
    "regions": {
      "North America": "북아메리카",
      "Europe": "유럽",
      "Asia": "아시아",
      "Oceania": "오세아니아"
    },
    "countries": {
      "Australia": "호주",
      "Canada": "캐나다",
      "China": "중국",
      "Czech Republic": "체코",
      "France": "프랑스",
      "Germany": "독일",
      "Israel": "이스라엘",
      "Italy": "이탈리아",
      "Japan": "일본",
      "Netherlands": "네덜란드",
      "New Zealand": "뉴질랜드",
      "Norway": "노르웨이",
      "South Korea": "대한민국",
      "Spain": "스페인",
      "Taiwan": "대만",
      "Turkey": "튀르키예",
      "USA": "미국",
      "United Kingdom": "영국"
    },
    "reasons": {
      "flagship": {
        "long": "Tesla의 대표 충전소",
        "short": "대표"
      },
      "significance": {
        "long": "특별한 의미",
        "short": "특별"
      },
      "destination": {
        "long": "유명한 여행지",
        "short": "명소"
      }
    },
    "badges": {
      "Arches": {
        "why": "아치스와 캐니언랜즈 국립공원의 거점 도시 모아브에 있습니다.",
        "note": "모아브의 두 충전소는 1.5 km 떨어져 있으며 둘 다 표시했습니다."
      },
      "Bryce Canyon": {
        "why": "브라이스 캐니언 국립공원과 후두 암주가 가득한 원형극장 지형의 입구에 있습니다.",
        "note": null
      },
      "Death Valley": {
        "why": "데이라이트 패스를 넘어 데스밸리로 들어가는 길목의 동쪽 관문입니다.",
        "note": "공원 안에는 수퍼차저가 없습니다. Furnace Creek은 아직 건설되지 않았습니다(상태: VOTING). 가장 가까운 운영 충전소는 51 km 떨어진 Beatty입니다."
      },
      "Golden Gate": {
        "why": "프레시디오에 있는 골든게이트 브리지에서 가장 가까운 수퍼차저입니다.",
        "note": "다리에서 3.5 km 떨어져 있으며 그다음으로 가까운 곳은 Lombard St와 Geary Blvd입니다."
      },
      "Grand Canyon": {
        "why": "그랜드 캐니언 사우스 림 입구에서 2마일 떨어져 있습니다.",
        "note": null
      },
      "Joshua Tree": {
        "why": "조슈아 트리 국립공원 북쪽 입구에 있습니다.",
        "note": "공원 중심에서 31 km 떨어져 있으며 공원 입구에서 가장 가까운 충전소입니다."
      },
      "Las Vegas Strip": {
        "why": "스트립의 하이 롤러 대관람차 아래에 있으며, Tesla가 2019년 7월에 처음 개장한 전 충전기 V3 수퍼차저 스테이션이기도 합니다.",
        "note": null
      },
      "Miami Beach": {
        "why": "사우스 비치에서 아르데코 지구와 대서양 바로 곁에 있습니다.",
        "note": "마이애미 비치의 두 충전소는 1.7 km 떨어져 있으며 둘 다 표시했습니다."
      },
      "Niagara Falls": {
        "why": "캐나다 쪽에서 호스슈 폭포를 바라보는 지점에 있습니다.",
        "note": "나이아가라 폭포의 미국 쪽에는 수퍼차저가 없습니다."
      },
      "Oasis": {
        "why": "세계 최대 충전소입니다. Tesla에 따르면 I-5 옆 30에이커 부지에 충전기 168기가 있으며, 11 MW 태양광 설비와 Megapack 10대로 전력망 없이 완전히 자립 운영됩니다.",
        "note": null
      },
      "San Antonio River": {
        "why": "도심 강변 산책로인 샌안토니오 리버워크에서 1 km 떨어져 있습니다.",
        "note": null
      },
      "Santa Monica": {
        "why": "66번 국도 서쪽 끝, 대관람차가 있는 산타모니카 피어 옆에 있습니다.",
        "note": "산타모니카의 세 충전소가 3 km 안에 있으며 피어에서 가장 가까운 두 곳을 표시했습니다."
      },
      "Tesla Diner": {
        "why": "산타모니카 대로에 있는 Tesla의 다이너 겸 드라이브인입니다. V4 충전기 80기, 24시간 레스토랑, 차 안으로 오디오를 전송하는 45피트 LED 스크린 2개를 갖췄습니다.",
        "note": null
      },
      "Waikiki": {
        "why": "오아후 와이키키 해변에서 300 m 떨어진, 해변가의 유일한 수퍼차저입니다.",
        "note": null
      },
      "Whistler": {
        "why": "밴쿠버에서 시투스카이 하이웨이를 따라 올라간 휘슬러 빌리지 안에 있습니다.",
        "note": "휘슬러의 두 충전소는 0.5 km 떨어져 있으며 둘 다 표시했습니다."
      },
      "Yellowstone": {
        "why": "옐로스톤 서쪽 입구에 있으며 올드 페이스풀로 가는 가장 가까운 진입점입니다.",
        "note": null
      },
      "Yosemite": {
        "why": "140번 고속도로 아치 록 입구에 있으며 요세미티 밸리에서 25 km 안에 있는 유일한 수퍼차저입니다.",
        "note": null
      },
      "Dombås": {
        "why": "2013년 8월 30일에 개장한 노르웨이의 여섯 충전소 중 하나로, 북아메리카 밖에 처음 건설된 수퍼차저들입니다.",
        "note": null
      },
      "Gayrettepe": {
        "why": "보스포루스 해협의 유럽 쪽에 있는 이스탄불 대표 충전소입니다.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "유럽 판매용 Model Y 전량을 생산하는 그륀하이데의 Tesla 유럽 공장에 있습니다.",
        "note": null
      },
      "Harderwijk": {
        "why": "2023년 3월에 문을 연 세계 최초의 V4 수퍼차저 충전소입니다. 기둥이 더 높고 케이블이 더 길며 Tesla가 아닌 차량도 이용할 수 있게 설계되었습니다.",
        "note": null
      },
      "Hilden": {
        "why": "유기농 제과점 Bäckerei Schüren을 둘러싼 충전기 40기입니다. 이 제과점이 세운 유럽에서 가장 붐비는 충전 단지 중 하나로, 목조 시설에 수직 농장도 갖췄습니다.",
        "note": null
      },
      "Honningsvåg": {
        "why": "북위 71.00도, 노르카프로 가는 길목의 마게뢰위아섬에 있는 세계 최북단 수퍼차저입니다.",
        "note": null
      },
      "Lake Garda": {
        "why": "이탈리아에서 가장 큰 호수인 가르다호 남쪽 호숫가 근처에 있습니다.",
        "note": "호수에서 9 km 떨어져 있으며 그다음으로 가까운 곳은 Castelnuovo del Garda입니다."
      },
      "Lovosice": {
        "why": "프라하–드레스덴 회랑의 체스케 스트르제도호르지 구릉 아래를 지나는 D8 도로변에 있습니다.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "노르망디의 조수섬 수도원으로 이어지는 둑길 초입에 있습니다.",
        "note": null
      },
      "Montélimar": {
        "why": "‘태양의 고속도로’ A7에 있는 충전기 56기 규모의 유럽 최초 메가사이트로, 휴가철 출발 시기에 유럽에서 가장 붐비는 충전소입니다.",
        "note": null
      },
      "Sevilla": {
        "why": "스페인 남부의 관문인 안달루시아 수도의 수퍼차저입니다.",
        "note": null
      },
      "Stonehenge": {
        "why": "에임즈베리의 Solstice Park에 있으며 환상열석에서 5 km 떨어져 있습니다.",
        "note": null
      },
      "Østerbø": {
        "why": "‘스노 로드’로 알려진 노르웨이 산악 고개 아울란스피엘레트의 높은 지대에 있습니다.",
        "note": null
      },
      "Ein Bokek": {
        "why": "사해 연안 해수면 아래 380 m에 있는 세계에서 가장 낮은 수퍼차저입니다.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "시즈오카 신토메이 고속도로에 있는, 일본의 주요 도쿄–나고야 대동맥을 상징하는 충전소입니다.",
        "note": null
      },
      "Fangshan": {
        "why": "베이징 도심 남서쪽 팡산구에 있습니다.",
        "note": null
      },
      "Gangnam": {
        "why": "서울의 비즈니스와 야간 문화 중심지 강남에 있습니다.",
        "note": "강남역 1.8 km 안에 네 충전소가 있으며 가장 가까운 곳을 표시했습니다."
      },
      "Jeju": {
        "why": "대한민국 남해안 앞바다의 화산 휴양지 제주도에 있습니다.",
        "note": null
      },
      "Mount Fuji": {
        "why": "후지산 고텐바 쪽의 전통적인 산 진입로에 있습니다.",
        "note": "정상에서 20 km 떨어져 있으며 그다음으로 가까운 Fuji River는 24 km 거리입니다."
      },
      "Taipei Xinyi": {
        "why": "타이베이 101 주변의 신이구에 있습니다.",
        "note": "타이베이 101에서 1.3 km 안에 세 충전소가 있으며 가장 가까운 곳을 표시했습니다."
      },
      "Victoria Harbour": {
        "why": "빅토리아 하버 건너 홍콩섬을 바라보는 침사추이 해안가에 있습니다.",
        "note": "항구 주변 2 km 안에 여섯 충전소가 있으며 해안가에서 가장 가까운 곳을 표시했습니다."
      },
      "Dunedin": {
        "why": "남위 45.89도에 있는 세계 최남단 수퍼차저로, 다른 어떤 충전소보다 남극에 가깝습니다.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "그레이트배리어리프를 따라 케언스에서 남쪽 번더버그까지 이어지는 퀸즐랜드 해안 어디서든 받을 수 있는 배지입니다. Tesla가 여러 충전소를 대상으로 한다고 밝힌 유일한 배지입니다.",
        "note": "Tesla는 이 배지가 여러 충전소 대상이라고 설명하지만 해당 충전소를 공개하지는 않습니다. 리프의 위도 범위 안에 있는 퀸즐랜드 해안의 모든 운영 수퍼차저를 표시했습니다."
      }
    }
  },
  "zh-Hans": {
    "name": "简体中文",
    "dir": "ltr",
    "mapNames": [
      "name:zh-Hans",
      "name:zh"
    ],
    "ui": {
      "documentTitle": "Tesla 标志性超级充电站徽章 — 世界地图",
      "heading": "标志性超级充电站",
      "mapAria": "标志性超级充电站交互式地图",
      "mapUnavailableTitle": "地图不可用",
      "mapFallback": "仍可使用充电站列表和详细信息。",
      "mapSoftwareError": "地图软件加载失败。仍可使用充电站列表和详细信息。",
      "webglError": "WebGL 启动失败。仍可使用充电站列表和详细信息。",
      "vectorMapError": "矢量地图加载失败。仍可使用充电站列表和详细信息。",
      "contextLost": "地图的图形上下文已丢失。仍可使用充电站列表和详细信息。",
      "searchPlaceholder": "搜索标志性超级充电站",
      "searchAria": "搜索徽章、城市和国家/地区",
      "clearSearch": "清除搜索",
      "filterAria": "按区域筛选",
      "nearMe": "我附近",
      "locating": "正在定位…",
      "footnote": "闪电图标旁的数字是充电桩总数，并非实时空闲数量。",
      "detailsAria": "超级充电站详情",
      "closeDetails": "关闭详情",
      "resizeList": "调整列表大小",
      "resizeDetails": "调整详情大小",
      "languageLabel": "语言",
      "automatic": "自动",
      "all": "全部",
      "noMatches": "没有符合搜索条件的徽章。",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible}/{total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}，{stalls}",
      "approx": "推测",
      "superchargersHeading": "超级充电站",
      "statsStallsTotal": "充电桩总数",
      "statsStalls": "充电桩",
      "statsPeak": "峰值功率",
      "statsAway": "外",
      "approxMany": "根据距离推测为这些超级充电站 — Tesla 未公布对应关系，因此尚未在应用中确认。",
      "approxOne": "根据距离推测为此超级充电站 — Tesla 未公布对应关系，因此尚未在应用中确认。",
      "factSupercharger": "超级充电站",
      "factAddress": "地址",
      "factCoordinates": "坐标",
      "factPower": "功率",
      "factElevation": "海拔",
      "factListed": "列入日期",
      "actionGoogle": "在 Google 地图中打开",
      "actionTesla": "Tesla",
      "locationUnsupported": "此浏览器无法共享位置。",
      "locationDenied": "位置权限被拒绝 — 仍按区域排序。",
      "locationFailed": "无法获取你的位置 — 仍按区域排序。",
      "mapControlTitle": "交互式地图",
      "zoomIn": "放大",
      "zoomOut": "缩小",
      "resetBearing": "将地图重置为朝北",
      "toggleAttribution": "显示或隐藏版权信息",
      "siteData": "站点数据",
      "unknown": "未知"
    },
    "nouns": {
      "badge": {
        "other": "{count} 枚徽章"
      },
      "supercharger": {
        "other": "{count} 个超级充电站"
      },
      "stall": {
        "other": "{count} 个充电桩"
      }
    },
    "regions": {
      "North America": "北美洲",
      "Europe": "欧洲",
      "Asia": "亚洲",
      "Oceania": "大洋洲"
    },
    "countries": {
      "Australia": "澳大利亚",
      "Canada": "加拿大",
      "China": "中国",
      "Czech Republic": "捷克",
      "France": "法国",
      "Germany": "德国",
      "Israel": "以色列",
      "Italy": "意大利",
      "Japan": "日本",
      "Netherlands": "荷兰",
      "New Zealand": "新西兰",
      "Norway": "挪威",
      "South Korea": "韩国",
      "Spain": "西班牙",
      "Taiwan": "台湾",
      "Turkey": "土耳其",
      "USA": "美国",
      "United Kingdom": "英国"
    },
    "reasons": {
      "flagship": {
        "long": "Tesla 旗舰站点",
        "short": "旗舰"
      },
      "significance": {
        "long": "具有特殊意义",
        "short": "特别"
      },
      "destination": {
        "long": "著名目的地",
        "short": "名胜"
      }
    },
    "badges": {
      "Arches": {
        "why": "位于莫阿布，这里是前往拱门国家公园和峡谷地国家公园的大本营。",
        "note": "莫阿布的两个站点相距 1.5 公里；两者均已列出。"
      },
      "Bryce Canyon": {
        "why": "位于布莱斯峡谷国家公园及其布满岩柱的天然圆形剧场入口。",
        "note": null
      },
      "Death Valley": {
        "why": "死亡谷的东部门户，坐落在越过戴莱特山口进入谷地的道路上。",
        "note": "公园内没有超级充电站 — Furnace Creek 仍未建成（状态为 VOTING）。最近的运营站点是 51 公里外的 Beatty。"
      },
      "Golden Gate": {
        "why": "位于旧金山要塞，是距离金门大桥最近的超级充电站。",
        "note": "距大桥 3.5 公里；其次是 Lombard St 和 Geary Blvd 站点。"
      },
      "Grand Canyon": {
        "why": "距大峡谷南缘入口两英里。",
        "note": null
      },
      "Joshua Tree": {
        "why": "位于约书亚树国家公园北入口。",
        "note": "距公园中心 31 公里；是距离公园入口最近的站点。"
      },
      "Las Vegas Strip": {
        "why": "位于拉斯维加斯大道豪客摩天轮下方 — 这里也是 Tesla 于 2019 年 7 月启用的首座全 V3 超级充电站。",
        "note": null
      },
      "Miami Beach": {
        "why": "位于南海滩，距装饰艺术区和大西洋仅几步之遥。",
        "note": "迈阿密海滩的两个站点相距 1.7 公里；两者均已列出。"
      },
      "Niagara Falls": {
        "why": "位于加拿大一侧，可从这里眺望马蹄瀑布。",
        "note": "尼亚加拉瀑布美国一侧没有超级充电站。"
      },
      "Oasis": {
        "why": "全球最大的充电站 — 据 Tesla 统计，I-5 公路旁 30 英亩的场地设有 168 个充电桩，依靠 11 MW 太阳能和 10 台 Megapack 完全离网运行。",
        "note": null
      },
      "San Antonio River": {
        "why": "距圣安东尼奥河滨步道一公里，这里是城市的滨河长廊。",
        "note": null
      },
      "Santa Monica": {
        "why": "位于 66 号公路西端，紧邻圣莫尼卡码头及其摩天轮。",
        "note": "圣莫尼卡有三个站点位于 3 公里范围内；已列出最靠近码头的两个。"
      },
      "Tesla Diner": {
        "why": "Tesla 位于圣莫尼卡大道的餐厅兼汽车影院：80 个 V4 充电桩、一家 24 小时营业的餐厅，以及两块可将音频传入车内的 45 英尺 LED 屏幕。",
        "note": null
      },
      "Waikiki": {
        "why": "距瓦胡岛威基基海滩 300 米 — 海滨唯一的超级充电站。",
        "note": null
      },
      "Whistler": {
        "why": "位于惠斯勒村，从温哥华沿海天公路向北即可到达。",
        "note": "惠斯勒的两个站点相距 0.5 公里；两者均已列出。"
      },
      "Yellowstone": {
        "why": "位于黄石公园西入口，是前往老忠实泉最近的进园点。",
        "note": null
      },
      "Yosemite": {
        "why": "位于 140 号公路的 Arch Rock 入口 — 是优胜美地谷 25 公里范围内唯一的超级充电站。",
        "note": null
      },
      "Dombås": {
        "why": "2013 年 8 月 30 日启用的六座挪威站点之一 — 它们是首批建在北美洲以外的超级充电站。",
        "note": null
      },
      "Gayrettepe": {
        "why": "伊斯坦布尔旗舰站点，位于博斯普鲁斯海峡欧洲一侧。",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "位于格林海德的 Tesla 欧洲工厂，所有欧洲版 Model Y 均在这里生产。",
        "note": null
      },
      "Harderwijk": {
        "why": "全球首座 V4 超级充电站，于 2023 年 3 月启用 — 立柱更高、线缆更长，也为非 Tesla 车辆而设计。",
        "note": null
      },
      "Hilden": {
        "why": "40 个充电桩环绕有机面包店 Bäckerei Schüren。该店建起了欧洲最繁忙的充电园区之一 — 木结构建筑内还设有垂直农场。",
        "note": null
      },
      "Honningsvåg": {
        "why": "全球最北的超级充电站，位于北纬 71.00° 的马格尔岛，坐落在通往北角的道路上。",
        "note": null
      },
      "Lake Garda": {
        "why": "靠近意大利最大湖泊加尔达湖南岸。",
        "note": "距湖岸 9 公里；其次是 Castelnuovo del Garda。"
      },
      "Lovosice": {
        "why": "位于布拉格—德累斯顿走廊的 D8 公路旁，地处 České středohoří 丘陵脚下。",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "位于诺曼底通往潮汐岛修道院的堤道起点。",
        "note": null
      },
      "Montélimar": {
        "why": "A7“太阳高速公路”沿线设有 56 个充电桩 — 这是欧洲最早的巨型站点，也是度假出行高峰期间最繁忙的充电站。",
        "note": null
      },
      "Sevilla": {
        "why": "安达卢西亚首府的超级充电站，也是通往西班牙南部的门户。",
        "note": null
      },
      "Stonehenge": {
        "why": "位于埃姆斯伯里的 Solstice Park，距巨石阵五公里。",
        "note": null
      },
      "Østerbø": {
        "why": "位于奥兰山地高处，这座挪威山口有“雪路”之称。",
        "note": null
      },
      "Ein Bokek": {
        "why": "全球海拔最低的超级充电站，位于死海岸边、海平面以下 380 米。",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "位于静冈县新东名高速公路，是日本东京—名古屋交通大动脉上的标志性站点。",
        "note": null
      },
      "Fangshan": {
        "why": "位于北京市房山区，在首都城区西南方向。",
        "note": null
      },
      "Gangnam": {
        "why": "位于首尔的商业和夜生活中心江南。",
        "note": "江南站 1.8 公里范围内有四个站点；已列出最近的一个。"
      },
      "Jeju": {
        "why": "位于韩国南海岸外的火山度假岛济州岛。",
        "note": null
      },
      "Mount Fuji": {
        "why": "位于富士山御殿场一侧，是进山的经典路线。",
        "note": "距山顶 20 公里；其次是 24 公里外的 Fuji River。"
      },
      "Taipei Xinyi": {
        "why": "位于台北 101 周边的信义区。",
        "note": "台北 101 的 1.3 公里范围内有三个站点；已列出最近的一个。"
      },
      "Victoria Harbour": {
        "why": "位于尖沙咀海滨，隔着维多利亚港与香港岛相望。",
        "note": "港湾周围 2 公里范围内有六个站点；已列出最靠近海滨的一个。"
      },
      "Dunedin": {
        "why": "全球最南的超级充电站，位于南纬 45.89°，比任何其他站点都更接近南极洲。",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "从凯恩斯向南至班达伯格，沿大堡礁延伸的昆士兰海岸任一站点均可获得此徽章 — 这是 Tesla 唯一明确涵盖多个站点的徽章。",
        "note": "Tesla 说明这是多站点徽章，但未公布具体站点。已列出大堡礁纬度范围内昆士兰海岸的所有运营中超级充电站。"
      }
    }
  },
  "zh-Hant": {
    "name": "繁體中文",
    "dir": "ltr",
    "mapNames": [
      "name:zh-Hant",
      "name:zh"
    ],
    "ui": {
      "documentTitle": "Tesla 指標性超級充電站徽章 — 世界地圖",
      "heading": "指標性超級充電站",
      "mapAria": "指標性超級充電站互動式地圖",
      "mapUnavailableTitle": "地圖無法使用",
      "mapFallback": "仍可使用充電站清單和詳細資料。",
      "mapSoftwareError": "地圖軟體載入失敗。仍可使用充電站清單和詳細資料。",
      "webglError": "WebGL 啟動失敗。仍可使用充電站清單和詳細資料。",
      "vectorMapError": "向量地圖載入失敗。仍可使用充電站清單和詳細資料。",
      "contextLost": "地圖的圖形內容已遺失。仍可使用充電站清單和詳細資料。",
      "searchPlaceholder": "搜尋指標性超級充電站",
      "searchAria": "搜尋徽章、城市和國家或地區",
      "clearSearch": "清除搜尋",
      "filterAria": "依區域篩選",
      "nearMe": "我的附近",
      "locating": "正在定位…",
      "footnote": "閃電圖示旁的數字是充電座總數，並非即時可用數量。",
      "detailsAria": "超級充電站詳細資料",
      "closeDetails": "關閉詳細資料",
      "resizeList": "調整清單大小",
      "resizeDetails": "調整詳細資料大小",
      "languageLabel": "語言",
      "automatic": "自動",
      "all": "全部",
      "noMatches": "沒有符合搜尋條件的徽章。",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible}/{total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}，{stalls}",
      "approx": "推測",
      "superchargersHeading": "超級充電站",
      "statsStallsTotal": "充電座總數",
      "statsStalls": "充電座",
      "statsPeak": "峰值功率",
      "statsAway": "外",
      "approxMany": "根據距離推測為這些超級充電站 — Tesla 未公布對應關係，因此尚未在應用程式中確認。",
      "approxOne": "根據距離推測為此超級充電站 — Tesla 未公布對應關係，因此尚未在應用程式中確認。",
      "factSupercharger": "超級充電站",
      "factAddress": "地址",
      "factCoordinates": "座標",
      "factPower": "功率",
      "factElevation": "海拔",
      "factListed": "列入日期",
      "actionGoogle": "在 Google 地圖中開啟",
      "actionTesla": "Tesla",
      "locationUnsupported": "此瀏覽器無法分享位置。",
      "locationDenied": "位置權限遭拒 — 仍依區域排序。",
      "locationFailed": "無法取得你的位置 — 仍依區域排序。",
      "mapControlTitle": "互動式地圖",
      "zoomIn": "放大",
      "zoomOut": "縮小",
      "resetBearing": "將地圖重設為朝北",
      "toggleAttribution": "顯示或隱藏版權資訊",
      "siteData": "站點資料",
      "unknown": "未知"
    },
    "nouns": {
      "badge": {
        "other": "{count} 枚徽章"
      },
      "supercharger": {
        "other": "{count} 個超級充電站"
      },
      "stall": {
        "other": "{count} 個充電座"
      }
    },
    "regions": {
      "North America": "北美洲",
      "Europe": "歐洲",
      "Asia": "亞洲",
      "Oceania": "大洋洲"
    },
    "countries": {
      "Australia": "澳洲",
      "Canada": "加拿大",
      "China": "中國",
      "Czech Republic": "捷克",
      "France": "法國",
      "Germany": "德國",
      "Israel": "以色列",
      "Italy": "義大利",
      "Japan": "日本",
      "Netherlands": "荷蘭",
      "New Zealand": "紐西蘭",
      "Norway": "挪威",
      "South Korea": "南韓",
      "Spain": "西班牙",
      "Taiwan": "台灣",
      "Turkey": "土耳其",
      "USA": "美國",
      "United Kingdom": "英國"
    },
    "reasons": {
      "flagship": {
        "long": "Tesla 旗艦站點",
        "short": "旗艦"
      },
      "significance": {
        "long": "具有特殊意義",
        "short": "特別"
      },
      "destination": {
        "long": "著名目的地",
        "short": "名勝"
      }
    },
    "badges": {
      "Arches": {
        "why": "位於摩押，這裡是前往拱門國家公園和峽谷地國家公園的大本營。",
        "note": "摩押的兩個站點相距 1.5 公里；兩者均已列出。"
      },
      "Bryce Canyon": {
        "why": "位於布萊斯峽谷國家公園及其布滿岩柱的天然圓形劇場入口。",
        "note": null
      },
      "Death Valley": {
        "why": "死亡谷的東側門戶，坐落在越過 Daylight Pass 進入谷地的道路上。",
        "note": "公園內沒有超級充電站 — Furnace Creek 仍未建成（狀態為 VOTING）。最近的營運中站點是 51 公里外的 Beatty。"
      },
      "Golden Gate": {
        "why": "位於舊金山要塞，是距離金門大橋最近的超級充電站。",
        "note": "距大橋 3.5 公里；其次是 Lombard St 和 Geary Blvd 站點。"
      },
      "Grand Canyon": {
        "why": "距大峽谷南緣入口兩英里。",
        "note": null
      },
      "Joshua Tree": {
        "why": "位於約書亞樹國家公園北入口。",
        "note": "距公園中心 31 公里；是距離公園入口最近的站點。"
      },
      "Las Vegas Strip": {
        "why": "位於拉斯維加斯大道 High Roller 摩天輪下方 — 這裡也是 Tesla 於 2019 年 7 月啟用的首座全 V3 超級充電站。",
        "note": null
      },
      "Miami Beach": {
        "why": "位於南海灘，距裝飾藝術區和大西洋僅幾步之遙。",
        "note": "邁阿密海灘的兩個站點相距 1.7 公里；兩者均已列出。"
      },
      "Niagara Falls": {
        "why": "位於加拿大一側，可從這裡眺望馬蹄瀑布。",
        "note": "尼加拉瀑布美國一側沒有超級充電站。"
      },
      "Oasis": {
        "why": "全球最大的充電站 — 據 Tesla 統計，I-5 公路旁 30 英畝的場地設有 168 個充電座，依靠 11 MW 太陽能和 10 台 Megapack 完全離網運作。",
        "note": null
      },
      "San Antonio River": {
        "why": "距聖安東尼奧河濱步道一公里，這裡是城市的濱河長廊。",
        "note": null
      },
      "Santa Monica": {
        "why": "位於 66 號公路西端，緊鄰聖塔莫尼卡碼頭及其摩天輪。",
        "note": "聖塔莫尼卡有三個站點位於 3 公里範圍內；已列出最靠近碼頭的兩個。"
      },
      "Tesla Diner": {
        "why": "Tesla 位於聖塔莫尼卡大道的餐廳兼汽車電影院：80 個 V4 充電座、一家 24 小時營業的餐廳，以及兩面可將音訊傳入車內的 45 英尺 LED 螢幕。",
        "note": null
      },
      "Waikiki": {
        "why": "距歐胡島威基基海灘 300 公尺 — 海濱唯一的超級充電站。",
        "note": null
      },
      "Whistler": {
        "why": "位於惠斯勒村，從溫哥華沿海天公路向北即可抵達。",
        "note": "惠斯勒的兩個站點相距 0.5 公里；兩者均已列出。"
      },
      "Yellowstone": {
        "why": "位於黃石公園西入口，是前往老忠實泉最近的入園點。",
        "note": null
      },
      "Yosemite": {
        "why": "位於 140 號公路的 Arch Rock 入口 — 是優勝美地谷 25 公里範圍內唯一的超級充電站。",
        "note": null
      },
      "Dombås": {
        "why": "2013 年 8 月 30 日啟用的六座挪威站點之一 — 它們是首批建在北美洲以外的超級充電站。",
        "note": null
      },
      "Gayrettepe": {
        "why": "伊斯坦堡旗艦站點，位於博斯普魯斯海峽歐洲一側。",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "位於格林海德的 Tesla 歐洲工廠，所有歐洲版 Model Y 均在這裡生產。",
        "note": null
      },
      "Harderwijk": {
        "why": "全球首座 V4 超級充電站，於 2023 年 3 月啟用 — 立柱更高、纜線更長，也為非 Tesla 車輛而設計。",
        "note": null
      },
      "Hilden": {
        "why": "40 個充電座環繞有機麵包店 Bäckerei Schüren。該店建起了歐洲最繁忙的充電園區之一 — 木構建築內還設有垂直農場。",
        "note": null
      },
      "Honningsvåg": {
        "why": "全球最北的超級充電站，位於北緯 71.00° 的馬格爾島，坐落在通往北角的道路上。",
        "note": null
      },
      "Lake Garda": {
        "why": "靠近義大利最大湖泊加爾達湖南岸。",
        "note": "距湖岸 9 公里；其次是 Castelnuovo del Garda。"
      },
      "Lovosice": {
        "why": "位於布拉格—德勒斯登走廊的 D8 公路旁，地處 České středohoří 丘陵腳下。",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "位於諾曼第通往潮汐島修道院的堤道起點。",
        "note": null
      },
      "Montélimar": {
        "why": "A7「太陽高速公路」沿線設有 56 個充電座 — 這是歐洲最早的巨型站點，也是度假出行高峰期間最繁忙的充電站。",
        "note": null
      },
      "Sevilla": {
        "why": "安達魯西亞首府的超級充電站，也是通往西班牙南部的門戶。",
        "note": null
      },
      "Stonehenge": {
        "why": "位於埃姆斯伯里的 Solstice Park，距巨石陣五公里。",
        "note": null
      },
      "Østerbø": {
        "why": "位於奧蘭山地高處，這座挪威山口有「雪路」之稱。",
        "note": null
      },
      "Ein Bokek": {
        "why": "全球海拔最低的超級充電站，位於死海岸邊、海平面以下 380 公尺。",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "位於靜岡縣新東名高速公路，是日本東京—名古屋交通大動脈上的指標性站點。",
        "note": null
      },
      "Fangshan": {
        "why": "位於北京市房山區，在首都市區西南方。",
        "note": null
      },
      "Gangnam": {
        "why": "位於首爾的商業和夜生活中心江南。",
        "note": "江南站 1.8 公里範圍內有四個站點；已列出最近的一個。"
      },
      "Jeju": {
        "why": "位於南韓南海岸外的火山度假島濟州島。",
        "note": null
      },
      "Mount Fuji": {
        "why": "位於富士山御殿場一側，是進山的經典路線。",
        "note": "距山頂 20 公里；其次是 24 公里外的 Fuji River。"
      },
      "Taipei Xinyi": {
        "why": "位於台北 101 周邊的信義區。",
        "note": "台北 101 的 1.3 公里範圍內有三個站點；已列出最近的一個。"
      },
      "Victoria Harbour": {
        "why": "位於尖沙咀海濱，隔著維多利亞港與香港島相望。",
        "note": "港灣周圍 2 公里範圍內有六個站點；已列出最靠近海濱的一個。"
      },
      "Dunedin": {
        "why": "全球最南的超級充電站，位於南緯 45.89°，比任何其他站點都更接近南極洲。",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "從凱恩斯向南至班達伯格，沿大堡礁延伸的昆士蘭海岸任何站點均可獲得此徽章 — 這是 Tesla 唯一明確涵蓋多個站點的徽章。",
        "note": "Tesla 說明這是多站點徽章，但未公布具體站點。已列出大堡礁緯度範圍內昆士蘭海岸的所有營運中超級充電站。"
      }
    }
  },
  "yue-Hant": {
    "name": "粵語",
    "dir": "ltr",
    "mapNames": [
      "name:yue-Hant",
      "name:yue",
      "name:zh-Hant",
      "name:zh"
    ],
    "ui": {
      "documentTitle": "Tesla 標誌性超級充電站徽章 — 世界地圖",
      "heading": "標誌性超級充電站",
      "mapAria": "標誌性超級充電站互動地圖",
      "mapUnavailableTitle": "地圖用唔到",
      "mapFallback": "充電站清單同詳細資料仍然可以使用。",
      "mapSoftwareError": "載入唔到地圖軟件。充電站清單同詳細資料仍然可以使用。",
      "webglError": "啟動唔到 WebGL。充電站清單同詳細資料仍然可以使用。",
      "vectorMapError": "載入唔到向量地圖。充電站清單同詳細資料仍然可以使用。",
      "contextLost": "地圖嘅圖像環境已經遺失。充電站清單同詳細資料仍然可以使用。",
      "searchPlaceholder": "搜尋標誌性超級充電站",
      "searchAria": "搜尋徽章、城市同國家或地區",
      "clearSearch": "清除搜尋",
      "filterAria": "按地區篩選",
      "nearMe": "我附近",
      "locating": "定位緊…",
      "footnote": "閃電圖示旁邊嘅數字係充電位總數，唔係即時可用數量。",
      "detailsAria": "超級充電站詳細資料",
      "closeDetails": "關閉詳細資料",
      "resizeList": "調整清單大小",
      "resizeDetails": "調整詳細資料大小",
      "languageLabel": "語言",
      "automatic": "自動",
      "all": "全部",
      "noMatches": "搵唔到符合呢個搜尋嘅徽章。",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible}/{total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}，{stalls}",
      "approx": "估算",
      "superchargersHeading": "超級充電站",
      "statsStallsTotal": "充電位總數",
      "statsStalls": "充電位",
      "statsPeak": "最高功率",
      "statsAway": "距離",
      "approxMany": "按距離配對至呢幾個超級充電站 — Tesla 冇公布對應關係，所以未有喺應用程式入面確認。",
      "approxOne": "按距離配對至呢個超級充電站 — Tesla 冇公布對應關係，所以未有喺應用程式入面確認。",
      "factSupercharger": "超級充電站",
      "factAddress": "地址",
      "factCoordinates": "座標",
      "factPower": "功率",
      "factElevation": "海拔",
      "factListed": "列出日期",
      "actionGoogle": "喺 Google 地圖開啟",
      "actionTesla": "Tesla",
      "locationUnsupported": "呢個瀏覽器分享唔到位置。",
      "locationDenied": "位置權限被拒絕 — 仍然按地區排序。",
      "locationFailed": "攞唔到你嘅位置 — 仍然按地區排序。",
      "mapControlTitle": "互動地圖",
      "zoomIn": "放大",
      "zoomOut": "縮小",
      "resetBearing": "將地圖重設為向北",
      "toggleAttribution": "顯示或隱藏資料來源",
      "siteData": "站點資料",
      "unknown": "未知"
    },
    "nouns": {
      "badge": {
        "other": "{count} 個徽章"
      },
      "supercharger": {
        "other": "{count} 個超級充電站"
      },
      "stall": {
        "other": "{count} 個充電位"
      }
    },
    "regions": {
      "North America": "北美洲",
      "Europe": "歐洲",
      "Asia": "亞洲",
      "Oceania": "大洋洲"
    },
    "countries": {
      "Australia": "澳洲",
      "Canada": "加拿大",
      "China": "中國",
      "Czech Republic": "捷克",
      "France": "法國",
      "Germany": "德國",
      "Israel": "以色列",
      "Italy": "意大利",
      "Japan": "日本",
      "Netherlands": "荷蘭",
      "New Zealand": "新西蘭",
      "Norway": "挪威",
      "South Korea": "南韓",
      "Spain": "西班牙",
      "Taiwan": "台灣",
      "Turkey": "土耳其",
      "USA": "美國",
      "United Kingdom": "英國"
    },
    "reasons": {
      "flagship": {
        "long": "Tesla 旗艦站點",
        "short": "旗艦"
      },
      "significance": {
        "long": "有特殊意義",
        "short": "特別"
      },
      "destination": {
        "long": "著名目的地",
        "short": "名勝"
      }
    },
    "badges": {
      "Arches": {
        "why": "位於摩押，呢度係去拱門國家公園同峽谷地國家公園嘅大本營。",
        "note": "摩押兩個站點相距 1.5 公里；兩個都有列出。"
      },
      "Bryce Canyon": {
        "why": "位於布萊斯峽谷國家公園，同埋佈滿岩柱嘅天然圓形劇場入口。",
        "note": null
      },
      "Death Valley": {
        "why": "死亡谷嘅東面門戶，喺越過 Daylight Pass 入谷嘅道路上。",
        "note": "公園入面冇超級充電站 — Furnace Creek 仍然未建成（狀態係 VOTING）。最近營運緊嘅站點係 51 公里外嘅 Beatty。"
      },
      "Golden Gate": {
        "why": "位於舊金山要塞，係離金門大橋最近嘅超級充電站。",
        "note": "離大橋 3.5 公里；其次係 Lombard St 同 Geary Blvd 站點。"
      },
      "Grand Canyon": {
        "why": "離大峽谷南緣入口兩英里。",
        "note": null
      },
      "Joshua Tree": {
        "why": "位於約書亞樹國家公園北面入口。",
        "note": "離公園中心 31 公里；係離公園入口最近嘅站點。"
      },
      "Las Vegas Strip": {
        "why": "位於拉斯維加斯大道 High Roller 摩天輪下面 — 呢度亦係 Tesla 喺 2019 年 7 月啟用嘅首個全 V3 超級充電站。",
        "note": null
      },
      "Miami Beach": {
        "why": "位於南海灘，行幾步就到裝飾藝術區同大西洋。",
        "note": "邁阿密海灘兩個站點相距 1.7 公里；兩個都有列出。"
      },
      "Niagara Falls": {
        "why": "位於加拿大一邊，可以由呢度望到馬蹄瀑布。",
        "note": "尼亞加拉瀑布美國一邊冇超級充電站。"
      },
      "Oasis": {
        "why": "全球最大嘅充電站 — Tesla 表示，I-5 公路旁 30 英畝嘅場地有 168 個充電位，靠 11 MW 太陽能同 10 部 Megapack 完全離網運作。",
        "note": null
      },
      "San Antonio River": {
        "why": "離聖安東尼奧河濱步道一公里，呢條係市內嘅河畔長廊。",
        "note": null
      },
      "Santa Monica": {
        "why": "位於 66 號公路西端，緊鄰聖塔莫尼卡碼頭同佢嘅摩天輪。",
        "note": "聖塔莫尼卡有三個站點喺 3 公里範圍內；已經列出最接近碼頭嘅兩個。"
      },
      "Tesla Diner": {
        "why": "Tesla 喺聖塔莫尼卡大道嘅餐廳兼汽車影院：80 個 V4 充電位、一間 24 小時營業嘅餐廳，同埋兩塊可以將聲音傳入車廂嘅 45 英尺 LED 屏幕。",
        "note": null
      },
      "Waikiki": {
        "why": "離歐胡島威基基海灘 300 米 — 海濱唯一嘅超級充電站。",
        "note": null
      },
      "Whistler": {
        "why": "位於惠斯勒村，由溫哥華沿海天公路向北就去到。",
        "note": "惠斯勒兩個站點相距 0.5 公里；兩個都有列出。"
      },
      "Yellowstone": {
        "why": "位於黃石公園西面入口，係去老忠實泉最近嘅入園點。",
        "note": null
      },
      "Yosemite": {
        "why": "位於 140 號公路 Arch Rock 入口 — 係優勝美地谷 25 公里範圍內唯一嘅超級充電站。",
        "note": null
      },
      "Dombås": {
        "why": "2013 年 8 月 30 日啟用嘅六個挪威站點之一 — 佢哋係第一批喺北美洲以外興建嘅超級充電站。",
        "note": null
      },
      "Gayrettepe": {
        "why": "伊斯坦堡旗艦站點，位於博斯普魯斯海峽歐洲一邊。",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "位於格林海德嘅 Tesla 歐洲工廠，所有歐洲版 Model Y 都喺呢度生產。",
        "note": null
      },
      "Harderwijk": {
        "why": "全球首個 V4 超級充電站，喺 2023 年 3 月啟用 — 支柱更高、電線更長，亦都為非 Tesla 車輛而設計。",
        "note": null
      },
      "Hilden": {
        "why": "40 個充電位圍住有機麵包店 Bäckerei Schüren。呢間店建成咗歐洲最繁忙嘅充電園區之一 — 木構建築入面仲設有垂直農場。",
        "note": null
      },
      "Honningsvåg": {
        "why": "全球最北嘅超級充電站，位於北緯 71.00° 嘅馬格爾島，喺去北角嘅道路上。",
        "note": null
      },
      "Lake Garda": {
        "why": "鄰近意大利最大湖泊加爾達湖南岸。",
        "note": "離湖岸 9 公里；其次係 Castelnuovo del Garda。"
      },
      "Lovosice": {
        "why": "位於布拉格—德累斯頓走廊嘅 D8 公路旁，喺 České středohoří 丘陵下面。",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "位於諾曼第通往潮汐島修道院嘅堤道起點。",
        "note": null
      },
      "Montélimar": {
        "why": "A7「太陽高速公路」沿線有 56 個充電位 — 呢度係歐洲最早嘅大型站點，亦係假期出發高峰時最繁忙嘅充電站。",
        "note": null
      },
      "Sevilla": {
        "why": "安達盧西亞首府嘅超級充電站，亦係通往西班牙南部嘅門戶。",
        "note": null
      },
      "Stonehenge": {
        "why": "位於埃姆斯伯里嘅 Solstice Park，離巨石陣五公里。",
        "note": null
      },
      "Østerbø": {
        "why": "位於奧蘭山地高處，呢個挪威山口有「雪路」之稱。",
        "note": null
      },
      "Ein Bokek": {
        "why": "全球海拔最低嘅超級充電站，位於死海岸邊、海平面以下 380 米。",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "位於靜岡縣新東名高速公路，係日本東京—名古屋交通大動脈上嘅標誌性站點。",
        "note": null
      },
      "Fangshan": {
        "why": "位於北京市房山區，喺首都市區西南面。",
        "note": null
      },
      "Gangnam": {
        "why": "位於首爾商業同夜生活中心江南。",
        "note": "江南站 1.8 公里範圍內有四個站點；已經列出最近嗰個。"
      },
      "Jeju": {
        "why": "位於南韓南岸對出嘅火山度假島濟州島。",
        "note": null
      },
      "Mount Fuji": {
        "why": "位於富士山御殿場一邊，係上山嘅經典路線。",
        "note": "離山頂 20 公里；其次係 24 公里外嘅 Fuji River。"
      },
      "Taipei Xinyi": {
        "why": "位於台北 101 周邊嘅信義區。",
        "note": "台北 101 嘅 1.3 公里範圍內有三個站點；已經列出最近嗰個。"
      },
      "Victoria Harbour": {
        "why": "位於尖沙咀海旁，隔住維多利亞港望向香港島。",
        "note": "海港周圍 2 公里範圍內有六個站點；已經列出最接近海旁嗰個。"
      },
      "Dunedin": {
        "why": "全球最南嘅超級充電站，位於南緯 45.89°，比其他任何站點都更接近南極洲。",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "由開恩茲向南至班達伯格，沿大堡礁伸延嘅昆士蘭海岸任何站點都可以攞到呢個徽章 — 呢個係 Tesla 唯一明確涵蓋多個站點嘅徽章。",
        "note": "Tesla 表示呢個係多站點徽章，但冇公布實際站點。大堡礁緯度範圍內、昆士蘭海岸所有營運緊嘅超級充電站都有列出。"
      }
    }
  }
});
Object.assign(window.ICONIC_I18N.locales, {
  "nb": {
    "name": "Norsk bokmål",
    "dir": "ltr",
    "mapNames": [
      "name:nb",
      "name:no"
    ],
    "ui": {
      "documentTitle": "Tesla Iconic Charger-merker — verdenskart",
      "heading": "Ikoniske ladesteder",
      "mapAria": "Interaktivt kart over ikoniske ladesteder",
      "mapUnavailableTitle": "Kartet er utilgjengelig",
      "mapFallback": "Listen over ladesteder og detaljene fungerer fortsatt.",
      "mapSoftwareError": "Kartprogramvaren ble ikke lastet inn. Listen over ladesteder og detaljene fungerer fortsatt.",
      "webglError": "WebGL kunne ikke starte. Listen over ladesteder og detaljene fungerer fortsatt.",
      "vectorMapError": "Vektorkartet kunne ikke lastes inn. Listen over ladesteder og detaljene fungerer fortsatt.",
      "contextLost": "Kartet mistet grafikkonteksten. Listen over ladesteder og detaljene fungerer fortsatt.",
      "searchPlaceholder": "Søk blant ikoniske ladesteder",
      "searchAria": "Søk etter merker, byer og land",
      "clearSearch": "Tøm søket",
      "filterAria": "Filtrer etter region",
      "nearMe": "I nærheten",
      "locating": "Finner posisjonen …",
      "footnote": "viser totalt antall ladeplasser, ikke hvor mange som er ledige nå.",
      "detailsAria": "Detaljer om Supercharger",
      "resizeList": "Endre størrelsen på listen",
      "resizeDetails": "Endre størrelsen på detaljene",
      "closeDetails": "Lukk detaljene",
      "languageLabel": "Språk",
      "automatic": "Automatisk",
      "all": "Alle",
      "noMatches": "Ingen merker samsvarer med søket.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} av {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "omtrentlig",
      "superchargersHeading": "Superchargere",
      "statsStallsTotal": "ladeplasser totalt",
      "statsStalls": "ladeplasser",
      "statsPeak": "maks. effekt",
      "statsAway": "unna",
      "approxMany": "Koblet til disse Supercharger-stasjonene ut fra avstand — Tesla offentliggjør ikke koblingen, så den er ikke bekreftet i appen.",
      "approxOne": "Koblet til denne Supercharger-stasjonen ut fra avstand — Tesla offentliggjør ikke koblingen, så den er ikke bekreftet i appen.",
      "factSupercharger": "Supercharger",
      "factAddress": "Adresse",
      "factCoordinates": "Koordinater",
      "factPower": "Effekt",
      "factElevation": "Høyde over havet",
      "factListed": "Oppført",
      "actionGoogle": "Åpne i Google Maps",
      "actionTesla": "Tesla",
      "locationUnsupported": "Denne nettleseren kan ikke dele posisjonen din.",
      "locationDenied": "Posisjonstilgang ble avslått — sorteringen etter region beholdes.",
      "locationFailed": "Kunne ikke hente posisjonen din — sorteringen etter region beholdes.",
      "mapControlTitle": "Kartkontroller",
      "zoomIn": "Zoom inn",
      "zoomOut": "Zoom ut",
      "resetBearing": "Tilbakestill retningen mot nord",
      "toggleAttribution": "Vis eller skjul kildeinformasjon",
      "siteData": "stedsdata",
      "unknown": "Ukjent"
    },
    "nouns": {
      "badge": {
        "one": "{count} merke",
        "other": "{count} merker"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "other": "{count} Superchargere"
      },
      "stall": {
        "one": "{count} ladeplass",
        "other": "{count} ladeplasser"
      }
    },
    "regions": {
      "North America": "Nord-Amerika",
      "Europe": "Europa",
      "Asia": "Asia",
      "Oceania": "Oseania"
    },
    "countries": {
      "Australia": "Australia",
      "Canada": "Canada",
      "China": "Kina",
      "Czech Republic": "Tsjekkia",
      "France": "Frankrike",
      "Germany": "Tyskland",
      "Israel": "Israel",
      "Italy": "Italia",
      "Japan": "Japan",
      "Netherlands": "Nederland",
      "New Zealand": "New Zealand",
      "Norway": "Norge",
      "South Korea": "Sør-Korea",
      "Spain": "Spania",
      "Taiwan": "Taiwan",
      "Turkey": "Tyrkia",
      "USA": "USA",
      "United Kingdom": "Storbritannia"
    },
    "reasons": {
      "flagship": {
        "long": "Teslas flaggskipstasjon",
        "short": "Flaggskip"
      },
      "significance": {
        "long": "Særlig betydning",
        "short": "Betydning"
      },
      "destination": {
        "long": "Berømt reisemål",
        "short": "Reisemål"
      }
    },
    "badges": {
      "Arches": {
        "why": "I Moab, utgangspunktet for nasjonalparkene Arches og Canyonlands.",
        "note": "To ladesteder i Moab ligger 1,5 km fra hverandre; begge er oppført."
      },
      "Bryce Canyon": {
        "why": "Ved inngangen til Bryce Canyon nasjonalpark og parkens amfiteatre av hoodoo-formasjoner.",
        "note": null
      },
      "Death Valley": {
        "why": "Den østlige innfallsporten til Death Valley, langs veien inn over Daylight Pass.",
        "note": "Det finnes ingen Supercharger inne i parken – Furnace Creek er fortsatt ikke bygget (status VOTING). Beatty er nærmeste åpne stasjon, 51 km unna."
      },
      "Golden Gate": {
        "why": "I Presidio, ved Supercharger-stasjonen som ligger nærmest Golden Gate Bridge.",
        "note": "3,5 km fra broen; Lombard St og Geary Blvd er de nest nærmeste."
      },
      "Grand Canyon": {
        "why": "3,2 km fra inngangen til South Rim i Grand Canyon.",
        "note": null
      },
      "Joshua Tree": {
        "why": "Ved den nordlige inngangen til Joshua Tree nasjonalpark.",
        "note": "31 km fra parkens midtpunkt; dette er stasjonen som ligger nærmest en inngang til parken."
      },
      "Las Vegas Strip": {
        "why": "Under pariserhjulet High Roller på The Strip – og den første Supercharger-stasjonen Tesla åpnet med bare V3-ladere, i juli 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "I South Beach, få skritt fra Art Deco-distriktet og Atlanterhavet.",
        "note": "To ladesteder i Miami Beach ligger 1,7 km fra hverandre; begge er oppført."
      },
      "Niagara Falls": {
        "why": "På den kanadiske siden, med utsiktspunktet mot Horseshoe Falls.",
        "note": "Det finnes ingen Supercharger på den amerikanske siden av Niagara Falls."
      },
      "Oasis": {
        "why": "Verdens største ladestasjon – Tesla oppgir 168 ladeplasser på rundt 121 mål ved I-5, helt selvforsynt med 11 MW solkraft og 10 Megapacks.",
        "note": null
      },
      "San Antonio River": {
        "why": "Én kilometer fra San Antonio River Walk, byens promenade langs elven.",
        "note": null
      },
      "Santa Monica": {
        "why": "Ved Santa Monica Pier og pariserhjulet, på den vestlige enden av Route 66.",
        "note": "Tre ladesteder i Santa Monica ligger innenfor 3 km; de to nærmest piren er oppført."
      },
      "Tesla Diner": {
        "why": "Teslas diner og drive-in på Santa Monica Blvd: 80 V4-ladeplasser, en døgnåpen restaurant og to 45 fot store LED-skjermer som sender lyden inn i bilen.",
        "note": null
      },
      "Waikiki": {
        "why": "300 m fra Waikiki Beach på Oahu – den eneste Supercharger-stasjonen langs stranden.",
        "note": null
      },
      "Whistler": {
        "why": "I Whistler Village, langs Sea-to-Sky Highway fra Vancouver.",
        "note": "To ladesteder i Whistler ligger 0,5 km fra hverandre; begge er oppført."
      },
      "Yellowstone": {
        "why": "Ved vestinngangen til Yellowstone, den nærmeste innfallsporten til Old Faithful.",
        "note": null
      },
      "Yosemite": {
        "why": "Langs Highway 140 ved Arch Rock-inngangen – den eneste Supercharger-stasjonen innen 25 km fra Yosemite Valley.",
        "note": null
      },
      "Dombås": {
        "why": "Ett av de seks norske ladestedene som åpnet 30. august 2013 – de første Supercharger-stasjonene som ble bygget utenfor Nord-Amerika.",
        "note": null
      },
      "Gayrettepe": {
        "why": "Istanbuls flaggskipstasjon, på den europeiske siden av Bosporos.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "Ved Teslas europeiske fabrikk i Grünheide, der alle europeiske Model Y bygges.",
        "note": null
      },
      "Harderwijk": {
        "why": "Verdens første V4 Supercharger-stasjon, åpnet i mars 2023 – høyere stolper og lengre kabler, også bygget for andre biler enn Tesla.",
        "note": null
      },
      "Hilden": {
        "why": "40 ladeplasser rundt Bäckerei Schüren, et økologisk bakeri som bygget en av Europas travleste ladeparker – i bindingsverk og med eget vertikalt gårdsbruk.",
        "note": null
      },
      "Honningsvåg": {
        "why": "Verdens nordligste Supercharger på 71,00°N, på Magerøya langs veien til Nordkapp.",
        "note": null
      },
      "Lake Garda": {
        "why": "Nær den sørlige bredden av Lago di Garda, Italias største innsjø.",
        "note": "9 km fra innsjøen; Castelnuovo del Garda er den nest nærmeste."
      },
      "Lovosice": {
        "why": "Ved D8 nedenfor åsene i České středohoří, langs korridoren mellom Praha og Dresden.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "Ved veifyllingen ut til klosterøya i tidevannssonen i Normandie.",
        "note": null
      },
      "Montélimar": {
        "why": "56 ladeplasser langs motorveien A7 Autoroute du Soleil – Europas opprinnelige megastasjon og den travleste stasjonen under ferieutfarten.",
        "note": null
      },
      "Sevilla": {
        "why": "Supercharger-stasjonen for Andalusias hovedstad, inngangsporten til Sør-Spania.",
        "note": null
      },
      "Stonehenge": {
        "why": "Ved Solstice Park i Amesbury, fem kilometer fra steinsirkelen.",
        "note": null
      },
      "Østerbø": {
        "why": "Høyt oppe på Aurlandsfjellet, det norske fjellpasset kjent som Snøvegen.",
        "note": null
      },
      "Ein Bokek": {
        "why": "Verdens lavestliggende Supercharger, 380 m under havoverflaten ved Dødehavet.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "Ved Shin-Tomei-motorveien i Shizuoka, en landemerkestasjon på Japans hovedåre mellom Tokyo og Nagoya.",
        "note": null
      },
      "Fangshan": {
        "why": "I Fangshan-distriktet i Beijing, sørvest for sentrum.",
        "note": null
      },
      "Gangnam": {
        "why": "I Gangnam, Seouls forretnings- og utelivsdistrikt.",
        "note": "Fire ladesteder ligger innen 1,8 km fra Gangnam stasjon; det nærmeste er oppført."
      },
      "Jeju": {
        "why": "På Jeju, den vulkanske ferieøya utenfor sørkysten av Sør-Korea.",
        "note": null
      },
      "Mount Fuji": {
        "why": "På Gotemba-siden av Fuji-san, den klassiske innfallsporten til fjellet.",
        "note": "20 km fra toppen; Fuji River er den nest nærmeste, 24 km unna."
      },
      "Taipei Xinyi": {
        "why": "I Xinyi, distriktet rundt Taipei 101.",
        "note": "Tre ladesteder ligger innen 1,3 km fra Taipei 101; det nærmeste er oppført."
      },
      "Victoria Harbour": {
        "why": "Ved havnepromenaden i Tsim Sha Tsui, vendt mot Hongkongøya på den andre siden av Victoria Harbour.",
        "note": "Seks ladesteder ligger rundt havnen innenfor 2 km; det som ligger nærmest havnepromenaden, er oppført."
      },
      "Dunedin": {
        "why": "Verdens sørligste Supercharger på 45,89°S, nærmere Antarktis enn noen annen.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "Revet-merket opptjenes hvor som helst langs Queensland-kysten som revet følger, fra Cairns til Bundaberg – det eneste merket Tesla oppgir at dekker flere ladesteder.",
        "note": "Tesla beskriver dette som et merke for flere ladesteder, men offentliggjør ikke hvilke. Alle åpne Supercharger-stasjoner på Queensland-kysten innenfor revets breddegrader er oppført."
      }
    }
  },
  "nn": {
    "name": "Norsk nynorsk",
    "dir": "ltr",
    "mapNames": [
      "name:nn",
      "name:no"
    ],
    "ui": {
      "documentTitle": "Tesla Iconic Charger-merke — verdskart",
      "heading": "Ikoniske ladestader",
      "mapAria": "Interaktivt kart over ikoniske ladestader",
      "mapUnavailableTitle": "Kartet er utilgjengeleg",
      "mapFallback": "Lista over ladestader og detaljane fungerer framleis.",
      "mapSoftwareError": "Kartprogramvara vart ikkje lasta inn. Lista over ladestader og detaljane fungerer framleis.",
      "webglError": "WebGL kunne ikkje starte. Lista over ladestader og detaljane fungerer framleis.",
      "vectorMapError": "Vektorkartet kunne ikkje lastast inn. Lista over ladestader og detaljane fungerer framleis.",
      "contextLost": "Kartet mista grafikkonteksten. Lista over ladestader og detaljane fungerer framleis.",
      "searchPlaceholder": "Søk blant ikoniske ladestader",
      "searchAria": "Søk etter merke, byar og land",
      "clearSearch": "Tøm søket",
      "filterAria": "Filtrer etter region",
      "nearMe": "Nær meg",
      "locating": "Finn posisjonen …",
      "footnote": "syner totalt tal på ladeplassar, ikkje kor mange som er ledige no.",
      "detailsAria": "Detaljar om Supercharger",
      "resizeList": "Endre storleiken på lista",
      "resizeDetails": "Endre storleiken på detaljane",
      "closeDetails": "Lukk detaljane",
      "languageLabel": "Språk",
      "automatic": "Automatisk",
      "all": "Alle",
      "noMatches": "Ingen merke svarar til søket.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} av {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "omtrentleg",
      "superchargersHeading": "Superchargerar",
      "statsStallsTotal": "ladeplassar totalt",
      "statsStalls": "ladeplassar",
      "statsPeak": "maks. effekt",
      "statsAway": "unna",
      "approxMany": "Kopla til desse Supercharger-stasjonane ut frå avstand — Tesla offentleggjer ikkje koplinga, så ho er ikkje stadfesta i appen.",
      "approxOne": "Kopla til denne Supercharger-stasjonen ut frå avstand — Tesla offentleggjer ikkje koplinga, så ho er ikkje stadfesta i appen.",
      "factSupercharger": "Supercharger",
      "factAddress": "Adresse",
      "factCoordinates": "Koordinatar",
      "factPower": "Effekt",
      "factElevation": "Høgd over havet",
      "factListed": "Oppført",
      "actionGoogle": "Opne i Google Maps",
      "actionTesla": "Tesla",
      "locationUnsupported": "Denne nettlesaren kan ikkje dele posisjonen din.",
      "locationDenied": "Posisjonstilgang vart avslått — sorteringa etter region står ved lag.",
      "locationFailed": "Klarte ikkje å hente posisjonen din — sorteringa etter region står ved lag.",
      "mapControlTitle": "Kartkontrollar",
      "zoomIn": "Zoom inn",
      "zoomOut": "Zoom ut",
      "resetBearing": "Tilbakestill retninga mot nord",
      "toggleAttribution": "Vis eller gøym kjeldeinformasjon",
      "siteData": "staddata",
      "unknown": "Ukjent"
    },
    "nouns": {
      "badge": {
        "one": "{count} merke",
        "other": "{count} merke"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "other": "{count} Superchargerar"
      },
      "stall": {
        "one": "{count} ladeplass",
        "other": "{count} ladeplassar"
      }
    },
    "regions": {
      "North America": "Nord-Amerika",
      "Europe": "Europa",
      "Asia": "Asia",
      "Oceania": "Oseania"
    },
    "countries": {
      "Australia": "Australia",
      "Canada": "Canada",
      "China": "Kina",
      "Czech Republic": "Tsjekkia",
      "France": "Frankrike",
      "Germany": "Tyskland",
      "Israel": "Israel",
      "Italy": "Italia",
      "Japan": "Japan",
      "Netherlands": "Nederland",
      "New Zealand": "New Zealand",
      "Norway": "Noreg",
      "South Korea": "Sør-Korea",
      "Spain": "Spania",
      "Taiwan": "Taiwan",
      "Turkey": "Tyrkia",
      "USA": "USA",
      "United Kingdom": "Storbritannia"
    },
    "reasons": {
      "flagship": {
        "long": "Teslas flaggskipstasjon",
        "short": "Flaggskip"
      },
      "significance": {
        "long": "Særleg tyding",
        "short": "Tyding"
      },
      "destination": {
        "long": "Kjent reisemål",
        "short": "Reisemål"
      }
    },
    "badges": {
      "Arches": {
        "why": "I Moab, utgangspunktet for nasjonalparkane Arches og Canyonlands.",
        "note": "To ladestader i Moab ligg 1,5 km frå kvarandre; begge er oppførte."
      },
      "Bryce Canyon": {
        "why": "Ved inngangen til Bryce Canyon nasjonalpark og amfiteatera av hoodoo-formasjonar.",
        "note": null
      },
      "Death Valley": {
        "why": "Den austlege innfallsporten til Death Valley, langs vegen inn over Daylight Pass.",
        "note": "Det finst ingen Supercharger inne i parken – Furnace Creek er framleis ikkje bygd (status VOTING). Beatty er næraste opne stasjon, 51 km unna."
      },
      "Golden Gate": {
        "why": "I Presidio, ved Supercharger-stasjonen som ligg nærast Golden Gate Bridge.",
        "note": "3,5 km frå brua; Lombard St og Geary Blvd er dei nest næraste."
      },
      "Grand Canyon": {
        "why": "3,2 km frå inngangen til South Rim i Grand Canyon.",
        "note": null
      },
      "Joshua Tree": {
        "why": "Ved den nordlege inngangen til Joshua Tree nasjonalpark.",
        "note": "31 km frå midtpunktet i parken; dette er stasjonen som ligg nærast ein inngang til parken."
      },
      "Las Vegas Strip": {
        "why": "Under pariserhjulet High Roller på The Strip – og den første Supercharger-stasjonen Tesla opna med berre V3-ladarar, i juli 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "I South Beach, få steg frå Art Deco-distriktet og Atlanterhavet.",
        "note": "To ladestader i Miami Beach ligg 1,7 km frå kvarandre; begge er oppførte."
      },
      "Niagara Falls": {
        "why": "På den kanadiske sida, med utsiktspunktet mot Horseshoe Falls.",
        "note": "Det finst ingen Supercharger på den amerikanske sida av Niagara Falls."
      },
      "Oasis": {
        "why": "Den største ladestasjonen i verda – Tesla opplyser om 168 ladeplassar på rundt 121 mål ved I-5, heilt sjølvforsynt med 11 MW solkraft og 10 Megapacks.",
        "note": null
      },
      "San Antonio River": {
        "why": "Éin kilometer frå San Antonio River Walk, promenaden langs elva i byen.",
        "note": null
      },
      "Santa Monica": {
        "why": "Ved Santa Monica Pier og pariserhjulet, i den vestlege enden av Route 66.",
        "note": "Tre ladestader i Santa Monica ligg innanfor 3 km; dei to nærast piren er oppførte."
      },
      "Tesla Diner": {
        "why": "Teslas diner og drive-in på Santa Monica Blvd: 80 V4-ladeplassar, ein døgnopen restaurant og to 45 fot store LED-skjermar som sender lyden inn i bilen.",
        "note": null
      },
      "Waikiki": {
        "why": "300 m frå Waikiki Beach på Oahu – den einaste Supercharger-stasjonen langs stranda.",
        "note": null
      },
      "Whistler": {
        "why": "I Whistler Village, langs Sea-to-Sky Highway frå Vancouver.",
        "note": "To ladestader i Whistler ligg 0,5 km frå kvarandre; begge er oppførte."
      },
      "Yellowstone": {
        "why": "Ved vestinngangen til Yellowstone, den næraste innfallsporten til Old Faithful.",
        "note": null
      },
      "Yosemite": {
        "why": "Langs Highway 140 ved Arch Rock-inngangen – den einaste Supercharger-stasjonen innan 25 km frå Yosemite Valley.",
        "note": null
      },
      "Dombås": {
        "why": "Ein av dei seks norske ladestadene som opna 30. august 2013 – dei første Supercharger-stasjonane som vart bygde utanfor Nord-Amerika.",
        "note": null
      },
      "Gayrettepe": {
        "why": "Flaggskipstasjonen i Istanbul, på den europeiske sida av Bosporos.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "Ved den europeiske fabrikken til Tesla i Grünheide, der alle europeiske Model Y vert bygde.",
        "note": null
      },
      "Harderwijk": {
        "why": "Den første V4 Supercharger-stasjonen i verda, opna i mars 2023 – høgare stolpar og lengre kablar, òg bygd for andre bilar enn Tesla.",
        "note": null
      },
      "Hilden": {
        "why": "40 ladeplassar rundt Bäckerei Schüren, eit økologisk bakeri som bygde ein av dei travlaste ladeparkane i Europa – i bindingsverk og med eige vertikalt gardsbruk.",
        "note": null
      },
      "Honningsvåg": {
        "why": "Den nordlegaste Supercharger-stasjonen i verda på 71,00°N, på Magerøya langs vegen til Nordkapp.",
        "note": null
      },
      "Lake Garda": {
        "why": "Nær den sørlege breidda av Lago di Garda, den største innsjøen i Italia.",
        "note": "9 km frå innsjøen; Castelnuovo del Garda er den nest næraste."
      },
      "Lovosice": {
        "why": "Ved D8 nedanfor åsane i České středohoří, langs korridoren mellom Praha og Dresden.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "Ved vegfyllinga ut til klosterøya i tidevassona i Normandie.",
        "note": null
      },
      "Montélimar": {
        "why": "56 ladeplassar langs motorvegen A7 Autoroute du Soleil – den opphavlege megastasjonen i Europa og den travlaste stasjonen under ferieutfarta.",
        "note": null
      },
      "Sevilla": {
        "why": "Supercharger-stasjonen for hovudstaden i Andalucía, inngangsporten til Sør-Spania.",
        "note": null
      },
      "Stonehenge": {
        "why": "Ved Solstice Park i Amesbury, fem kilometer frå steinsirkelen.",
        "note": null
      },
      "Østerbø": {
        "why": "Høgt oppe på Aurlandsfjellet, det norske fjellpasset kjent som Snøvegen.",
        "note": null
      },
      "Ein Bokek": {
        "why": "Den lågastliggjande Supercharger-stasjonen i verda, 380 m under havnivå ved Daudehavet.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "Ved Shin-Tomei-motorvegen i Shizuoka, ein landemerkestasjon på hovudåra mellom Tokyo og Nagoya i Japan.",
        "note": null
      },
      "Fangshan": {
        "why": "I Fangshan-distriktet i Beijing, sørvest for sentrum.",
        "note": null
      },
      "Gangnam": {
        "why": "I Gangnam, forretnings- og utelivsdistriktet i Seoul.",
        "note": "Fire ladestader ligg innan 1,8 km frå Gangnam stasjon; den næraste er oppført."
      },
      "Jeju": {
        "why": "På Jeju, den vulkanske ferieøya utanfor sørkysten av Sør-Korea.",
        "note": null
      },
      "Mount Fuji": {
        "why": "På Gotemba-sida av Fuji-san, den klassiske innfallsporten til fjellet.",
        "note": "20 km frå toppen; Fuji River er den nest næraste, 24 km unna."
      },
      "Taipei Xinyi": {
        "why": "I Xinyi, distriktet rundt Taipei 101.",
        "note": "Tre ladestader ligg innan 1,3 km frå Taipei 101; den næraste er oppført."
      },
      "Victoria Harbour": {
        "why": "Ved hamnepromenaden i Tsim Sha Tsui, vend mot Hongkongøya på den andre sida av Victoria Harbour.",
        "note": "Seks ladestader ligg rundt hamna innanfor 2 km; den som ligg nærast hamnepromenaden, er oppført."
      },
      "Dunedin": {
        "why": "Den sørlegaste Supercharger-stasjonen i verda på 45,89°S, nærare Antarktis enn nokon annan.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "Revmerket kan ein få kvar som helst langs Queensland-kysten som revet følgjer, frå Cairns til Bundaberg – det einaste merket Tesla seier dekkjer fleire ladestader.",
        "note": "Tesla skildrar dette som eit merke for fleire ladestader, men offentleggjer ikkje kva for nokre. Alle opne Supercharger-stasjonar på Queensland-kysten innanfor breiddegradene til revet er oppførte."
      }
    }
  },
  "tr": {
    "name": "Türkçe",
    "dir": "ltr",
    "mapNames": [
      "name:tr"
    ],
    "ui": {
      "documentTitle": "Tesla Iconic Charger rozetleri — dünya haritası",
      "heading": "İkonik Şarj Noktaları",
      "mapAria": "İkonik Şarj Noktalarının etkileşimli haritası",
      "mapUnavailableTitle": "Harita kullanılamıyor",
      "mapFallback": "Şarj noktaları listesi ve ayrıntılar çalışmaya devam ediyor.",
      "mapSoftwareError": "Harita yazılımı yüklenemedi. Şarj noktaları listesi ve ayrıntılar çalışmaya devam ediyor.",
      "webglError": "WebGL başlatılamadı. Şarj noktaları listesi ve ayrıntılar çalışmaya devam ediyor.",
      "vectorMapError": "Vektör haritası yüklenemedi. Şarj noktaları listesi ve ayrıntılar çalışmaya devam ediyor.",
      "contextLost": "Haritanın grafik bağlamı kayboldu. Şarj noktaları listesi ve ayrıntılar çalışmaya devam ediyor.",
      "searchPlaceholder": "İkonik Şarj Noktalarında ara",
      "searchAria": "Rozet, şehir ve ülke ara",
      "clearSearch": "Aramayı temizle",
      "filterAria": "Bölgeye göre filtrele",
      "nearMe": "Yakınımda",
      "locating": "Konum belirleniyor…",
      "footnote": "toplam şarj noktası sayısını gösterir, anlık müsaitliği değil.",
      "detailsAria": "Supercharger ayrıntıları",
      "resizeList": "Listenin boyutunu değiştir",
      "resizeDetails": "Ayrıntıların boyutunu değiştir",
      "closeDetails": "Ayrıntıları kapat",
      "languageLabel": "Dil",
      "automatic": "Otomatik",
      "all": "Tümü",
      "noMatches": "Bu aramayla eşleşen rozet yok.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "toplam {total} içinde {visible} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "yaklaşık",
      "superchargersHeading": "Supercharger'lar",
      "statsStallsTotal": "toplam şarj noktası",
      "statsStalls": "şarj noktası",
      "statsPeak": "azami güç",
      "statsAway": "uzakta",
      "approxMany": "Bu Supercharger'larla yakınlıklarına göre eşleştirildi — Tesla eşleştirmeyi yayımlamadığından uygulamada doğrulanmış değildir.",
      "approxOne": "Bu Supercharger'la yakınlığına göre eşleştirildi — Tesla eşleştirmeyi yayımlamadığından uygulamada doğrulanmış değildir.",
      "factSupercharger": "Supercharger",
      "factAddress": "Adres",
      "factCoordinates": "Koordinatlar",
      "factPower": "Güç",
      "factElevation": "Rakım",
      "factListed": "Listelenme",
      "actionGoogle": "Google Haritalar'da aç",
      "actionTesla": "Tesla",
      "locationUnsupported": "Bu tarayıcı konum paylaşımını desteklemiyor.",
      "locationDenied": "Konum izni reddedildi — bölgeye göre sıralama devam ediyor.",
      "locationFailed": "Konumunuz alınamadı — bölgeye göre sıralama devam ediyor.",
      "mapControlTitle": "Harita kontrolleri",
      "zoomIn": "Yakınlaştır",
      "zoomOut": "Uzaklaştır",
      "resetBearing": "Yönü kuzeye sıfırla",
      "toggleAttribution": "Kaynak bilgisini göster veya gizle",
      "siteData": "istasyon verileri",
      "unknown": "Bilinmiyor"
    },
    "nouns": {
      "badge": {
        "one": "{count} rozet",
        "other": "{count} rozet"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "other": "{count} Supercharger"
      },
      "stall": {
        "one": "{count} şarj noktası",
        "other": "{count} şarj noktası"
      }
    },
    "regions": {
      "North America": "Kuzey Amerika",
      "Europe": "Avrupa",
      "Asia": "Asya",
      "Oceania": "Okyanusya"
    },
    "countries": {
      "Australia": "Avustralya",
      "Canada": "Kanada",
      "China": "Çin",
      "Czech Republic": "Çekya",
      "France": "Fransa",
      "Germany": "Almanya",
      "Israel": "İsrail",
      "Italy": "İtalya",
      "Japan": "Japonya",
      "Netherlands": "Hollanda",
      "New Zealand": "Yeni Zelanda",
      "Norway": "Norveç",
      "South Korea": "Güney Kore",
      "Spain": "İspanya",
      "Taiwan": "Tayvan",
      "Turkey": "Türkiye",
      "USA": "ABD",
      "United Kingdom": "Birleşik Krallık"
    },
    "reasons": {
      "flagship": {
        "long": "Tesla'nın amiral gemisi istasyonu",
        "short": "Amiral gemisi"
      },
      "significance": {
        "long": "Özel önem taşıyan yer",
        "short": "Önemli yer"
      },
      "destination": {
        "long": "Ünlü turistik nokta",
        "short": "Turistik nokta"
      }
    },
    "badges": {
      "Arches": {
        "why": "Arches ve Canyonlands millî parklarına açılan ana üs Moab'da.",
        "note": "Moab'daki iki istasyon birbirinden 1,5 km uzakta; ikisi de listelenmiştir."
      },
      "Bryce Canyon": {
        "why": "Bryce Canyon Millî Parkı'nın ve hoodoo kaya oluşumlarından amfitiyatrolarının girişinde.",
        "note": null
      },
      "Death Valley": {
        "why": "Death Valley'nin doğu giriş kapısında, Daylight Pass üzerinden vadiye giren yol üzerinde.",
        "note": "Parkın içinde Supercharger yoktur; Furnace Creek hâlâ inşa edilmemiştir (durum: VOTING). En yakın faal istasyon 51 km uzaktaki Beatty'dir."
      },
      "Golden Gate": {
        "why": "Presidio'da, Golden Gate Köprüsü'ne en yakın Supercharger'da.",
        "note": "Köprüye 3,5 km uzaklıktadır; sonraki en yakın istasyonlar Lombard St ve Geary Blvd'dedir."
      },
      "Grand Canyon": {
        "why": "Grand Canyon'ın South Rim girişine iki mil uzaklıkta.",
        "note": null
      },
      "Joshua Tree": {
        "why": "Joshua Tree Millî Parkı'nın kuzey girişinde.",
        "note": "Parkın merkezine 31 km uzaklıktadır; bir park girişine en yakın istasyondur."
      },
      "Las Vegas Strip": {
        "why": "The Strip'teki High Roller dönme dolabının altında; ayrıca Tesla'nın Temmuz 2019'da açtığı, tamamı V3 olan ilk Supercharger istasyonu.",
        "note": null
      },
      "Miami Beach": {
        "why": "South Beach'te, Art Deco bölgesine ve Atlantik'e birkaç adım uzaklıkta.",
        "note": "Miami Beach'teki iki istasyon birbirinden 1,7 km uzakta; ikisi de listelenmiştir."
      },
      "Niagara Falls": {
        "why": "Kanada tarafında, Horseshoe Falls'u izleme noktasında.",
        "note": "Niagara Falls'un ABD tarafında Supercharger yoktur."
      },
      "Oasis": {
        "why": "Dünyanın en büyük şarj istasyonu — Tesla, I-5'in yanında yaklaşık 121 dönümlük alana yayılan, 11 MW güneş enerjisi ve 10 Megapack ile tamamen şebekeden bağımsız çalışan 168 şarj noktası olduğunu belirtiyor.",
        "note": null
      },
      "San Antonio River": {
        "why": "Kentin nehir kıyısındaki gezinti yolu San Antonio River Walk'a bir kilometre uzaklıkta.",
        "note": null
      },
      "Santa Monica": {
        "why": "Route 66'nın batı ucunda, Santa Monica İskelesi ve dönme dolabının yanında.",
        "note": "Santa Monica'daki üç istasyon 3 km'lik alandadır; iskeleye en yakın ikisi listelenmiştir."
      },
      "Tesla Diner": {
        "why": "Tesla'nın Santa Monica Blvd'deki restoranı ve arabalı sineması: 80 V4 şarj noktası, 24 saat açık bir restoran ve sesi aracınıza aktaran iki adet 45 fitlik LED ekran.",
        "note": null
      },
      "Waikiki": {
        "why": "Oahu'daki Waikiki Beach'e 300 m uzaklıkta; sahil şeridindeki tek Supercharger.",
        "note": null
      },
      "Whistler": {
        "why": "Vancouver'dan Sea-to-Sky Highway üzerinden ulaşılan Whistler köyünde.",
        "note": "Whistler'daki iki istasyon birbirinden 0,5 km uzakta; ikisi de listelenmiştir."
      },
      "Yellowstone": {
        "why": "Yellowstone'un batı girişinde, Old Faithful'a en yakın yaklaşım noktasında.",
        "note": null
      },
      "Yosemite": {
        "why": "Highway 140 üzerinde, Arch Rock girişinde; Yosemite Valley'nin 25 km çevresindeki tek Supercharger.",
        "note": null
      },
      "Dombås": {
        "why": "30 Ağustos 2013'te açılan altı Norveç istasyonundan biri; Kuzey Amerika dışında inşa edilen ilk Supercharger'lardan.",
        "note": null
      },
      "Gayrettepe": {
        "why": "İstanbul'un Boğaz'ın Avrupa yakasındaki amiral gemisi istasyonu.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "Tesla'nın Grünheide'deki Avrupa fabrikasında; Avrupa'daki tüm Model Y'ler burada üretiliyor.",
        "note": null
      },
      "Harderwijk": {
        "why": "Mart 2023'te açılan dünyanın ilk V4 Supercharger istasyonu; daha yüksek üniteler ve daha uzun kablolarla Tesla dışındaki araçlara da uygun olarak tasarlandı.",
        "note": null
      },
      "Hilden": {
        "why": "Avrupa'nın en yoğun şarj parklarından birini kuran organik fırın Bäckerei Schüren'in çevresindeki 40 şarj noktası; ahşap iskeletli yapıda tesis içi dikey tarım alanı da var.",
        "note": null
      },
      "Honningsvåg": {
        "why": "71,00°K'de, Magerøya adasında Nordkapp yolundaki dünyanın en kuzeydeki Supercharger'ı.",
        "note": null
      },
      "Lake Garda": {
        "why": "İtalya'nın en büyük gölü Lago di Garda'nın güney kıyısına yakın.",
        "note": "Göle 9 km uzaklıktadır; bir sonraki en yakın istasyon Castelnuovo del Garda'dadır."
      },
      "Lovosice": {
        "why": "Prag-Dresden koridorunda, České středohoří tepelerinin altındaki D8 üzerinde.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "Normandiya'daki gelgit adası manastırına uzanan geçidin başında.",
        "note": null
      },
      "Montélimar": {
        "why": "A7 Autoroute du Soleil üzerindeki 56 şarj noktası; Avrupa'nın ilk mega istasyonu ve tatil çıkışlarında en yoğun istasyonu.",
        "note": null
      },
      "Sevilla": {
        "why": "Endülüs'ün başkenti ve İspanya'nın güneyine açılan kapı için Supercharger.",
        "note": null
      },
      "Stonehenge": {
        "why": "Amesbury'deki Solstice Park'ta, taş çembere beş kilometre uzaklıkta.",
        "note": null
      },
      "Østerbø": {
        "why": "Kar Yolu olarak bilinen Norveç dağ geçidi Aurlandsfjellet'in yükseklerinde.",
        "note": null
      },
      "Ein Bokek": {
        "why": "Ölü Deniz kıyısında, deniz seviyesinin 380 m altındaki dünyanın en alçak Supercharger'ı.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "Shizuoka'daki Shin-Tomei Otoyolu üzerinde, Japonya'nın ana Tokyo-Nagoya güzergâhındaki simge istasyonlardan biri.",
        "note": null
      },
      "Fangshan": {
        "why": "Pekin'in Fangshan ilçesinde, başkentin güneybatısında.",
        "note": null
      },
      "Gangnam": {
        "why": "Seul'un iş ve gece hayatı bölgesi Gangnam'da.",
        "note": "Gangnam istasyonunun 1,8 km çevresinde dört istasyon vardır; en yakını listelenmiştir."
      },
      "Jeju": {
        "why": "Güney Kore'nin güney kıyısı açıklarındaki volkanik tatil adası Jeju'da.",
        "note": null
      },
      "Mount Fuji": {
        "why": "Fuji Dağı'nın Gotemba tarafında, dağa çıkan klasik güzergâhta.",
        "note": "Zirveye 20 km uzaklıktadır; bir sonraki en yakın istasyon 24 km uzaklıktaki Fuji River'dır."
      },
      "Taipei Xinyi": {
        "why": "Taipei 101'in çevresindeki Xinyi bölgesinde.",
        "note": "Taipei 101'in 1,3 km çevresinde üç istasyon vardır; en yakını listelenmiştir."
      },
      "Victoria Harbour": {
        "why": "Tsim Sha Tsui sahilinde, Victoria Harbour'ın karşısındaki Hong Kong Adası'na bakıyor.",
        "note": "Limanın 2 km çevresinde altı istasyon vardır; sahile en yakın olanı listelenmiştir."
      },
      "Dunedin": {
        "why": "45,89°G'de, Antarktika'ya diğer tüm istasyonlardan daha yakın olan dünyanın en güneydeki Supercharger'ı.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "Resif rozeti, Cairns'ten Bundaberg'e kadar resifin uzandığı Queensland kıyısı boyunca kazanılabilir; Tesla'nın birden çok istasyonu kapsadığını belirttiği tek rozettir.",
        "note": "Tesla bu rozetin birden çok istasyonda kazanıldığını belgelese de hangi istasyonlar olduğunu yayımlamıyor. Queensland kıyısında resifin enlem aralığındaki tüm faal Supercharger'lar listelenmiştir."
      }
    }
  },
  "cs": {
    "name": "Čeština",
    "dir": "ltr",
    "mapNames": [
      "name:cs"
    ],
    "ui": {
      "documentTitle": "Odznaky Tesla Iconic Charger — mapa světa",
      "heading": "Ikonické nabíječky",
      "mapAria": "Interaktivní mapa ikonických nabíječek",
      "mapUnavailableTitle": "Mapa není k dispozici",
      "mapFallback": "Seznam nabíječek i podrobnosti nadále fungují.",
      "mapSoftwareError": "Mapový software se nenačetl. Seznam nabíječek i podrobnosti nadále fungují.",
      "webglError": "WebGL se nepodařilo spustit. Seznam nabíječek i podrobnosti nadále fungují.",
      "vectorMapError": "Vektorová mapa se nenačetla. Seznam nabíječek i podrobnosti nadále fungují.",
      "contextLost": "Mapa ztratila grafický kontext. Seznam nabíječek i podrobnosti nadále fungují.",
      "searchPlaceholder": "Hledat mezi ikonickými nabíječkami",
      "searchAria": "Hledat odznaky, města a země",
      "clearSearch": "Vymazat hledání",
      "filterAria": "Filtrovat podle oblasti",
      "nearMe": "V mém okolí",
      "locating": "Zjišťuji polohu…",
      "footnote": "znamená celkový počet nabíjecích stání, nikoli jejich aktuální dostupnost.",
      "detailsAria": "Podrobnosti o Superchargeru",
      "resizeList": "Změnit velikost seznamu",
      "resizeDetails": "Změnit velikost podrobností",
      "closeDetails": "Zavřít podrobnosti",
      "languageLabel": "Jazyk",
      "automatic": "Automaticky",
      "all": "Vše",
      "noMatches": "Tomuto hledání neodpovídají žádné odznaky.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} z {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "přibližně",
      "superchargersHeading": "Superchargery",
      "statsStallsTotal": "stání celkem",
      "statsStalls": "stání",
      "statsPeak": "maximum",
      "statsAway": "daleko",
      "approxMany": "Přiřazeno k těmto Superchargerům podle vzdálenosti — Tesla přiřazení nezveřejňuje, takže není potvrzeno v aplikaci.",
      "approxOne": "Přiřazeno k tomuto Superchargeru podle vzdálenosti — Tesla přiřazení nezveřejňuje, takže není potvrzeno v aplikaci.",
      "factSupercharger": "Supercharger",
      "factAddress": "Adresa",
      "factCoordinates": "Souřadnice",
      "factPower": "Výkon",
      "factElevation": "Nadmořská výška",
      "factListed": "Zařazeno",
      "actionGoogle": "Otevřít v Mapách Google",
      "actionTesla": "Tesla",
      "locationUnsupported": "Tento prohlížeč nemůže sdílet polohu.",
      "locationDenied": "Přístup k poloze byl zamítnut — řazení podle oblastí zůstává.",
      "locationFailed": "Polohu se nepodařilo zjistit — řazení podle oblastí zůstává.",
      "mapControlTitle": "Ovládání mapy",
      "zoomIn": "Přiblížit",
      "zoomOut": "Oddálit",
      "resetBearing": "Nastavit orientaci na sever",
      "toggleAttribution": "Zobrazit nebo skrýt údaje o zdrojích",
      "siteData": "data o stanicích",
      "unknown": "Neznámé"
    },
    "nouns": {
      "badge": {
        "one": "{count} odznak",
        "few": "{count} odznaky",
        "many": "{count} odznaku",
        "other": "{count} odznaků"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "few": "{count} Superchargery",
        "many": "{count} Superchargeru",
        "other": "{count} Superchargerů"
      },
      "stall": {
        "one": "{count} nabíjecí stání",
        "few": "{count} nabíjecí stání",
        "many": "{count} nabíjecího stání",
        "other": "{count} nabíjecích stání"
      }
    },
    "regions": {
      "North America": "Severní Amerika",
      "Europe": "Evropa",
      "Asia": "Asie",
      "Oceania": "Oceánie"
    },
    "countries": {
      "Australia": "Austrálie",
      "Canada": "Kanada",
      "China": "Čína",
      "Czech Republic": "Česko",
      "France": "Francie",
      "Germany": "Německo",
      "Israel": "Izrael",
      "Italy": "Itálie",
      "Japan": "Japonsko",
      "Netherlands": "Nizozemsko",
      "New Zealand": "Nový Zéland",
      "Norway": "Norsko",
      "South Korea": "Jižní Korea",
      "Spain": "Španělsko",
      "Taiwan": "Tchaj-wan",
      "Turkey": "Turecko",
      "USA": "USA",
      "United Kingdom": "Spojené království"
    },
    "reasons": {
      "flagship": {
        "long": "Vlajková stanice Tesla",
        "short": "Vlajková stanice"
      },
      "significance": {
        "long": "Mimořádný význam",
        "short": "Významné místo"
      },
      "destination": {
        "long": "Proslulý cíl",
        "short": "Cíl"
      }
    },
    "badges": {
      "Arches": {
        "why": "V Moabu, výchozím bodě pro národní parky Arches a Canyonlands.",
        "note": "Dvě stanice v Moabu jsou od sebe vzdálené 1,5 km; uvedeny jsou obě."
      },
      "Bryce Canyon": {
        "why": "U bran národního parku Bryce Canyon a jeho amfiteátrů skalních věží hoodoo.",
        "note": null
      },
      "Death Valley": {
        "why": "Východní brána do Death Valley na příjezdové cestě přes Daylight Pass.",
        "note": "Uvnitř parku žádný Supercharger není — Furnace Creek dosud nebyl postaven (stav VOTING). Nejbližší zprovozněná stanice je Beatty, vzdálená 51 km."
      },
      "Golden Gate": {
        "why": "V Presidiu, u Superchargeru nejbližšího mostu Golden Gate Bridge.",
        "note": "3,5 km od mostu; další nejbližší stanice jsou na Lombard St a Geary Blvd."
      },
      "Grand Canyon": {
        "why": "Dvě míle od vjezdu na jižní okraj Grand Canyonu.",
        "note": null
      },
      "Joshua Tree": {
        "why": "U severního vjezdu do národního parku Joshua Tree.",
        "note": "31 km od středu parku; je to nejbližší stanice k některému z jeho vjezdů."
      },
      "Las Vegas Strip": {
        "why": "Pod vyhlídkovým kolem High Roller na bulváru Strip — a u vůbec první stanice Tesla osazené výhradně Superchargery V3, otevřené v červenci 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "V South Beach, pár kroků od čtvrti Art Deco a Atlantiku.",
        "note": "Dvě stanice v Miami Beach jsou od sebe vzdálené 1,7 km; uvedeny jsou obě."
      },
      "Niagara Falls": {
        "why": "Na kanadské straně, na vyhlídce na Horseshoe Falls.",
        "note": "Na americké straně Niagara Falls žádný Supercharger není."
      },
      "Oasis": {
        "why": "Největší nabíjecí stanice na světě — Tesla uvádí 168 stání na 30 akrech u dálnice I-5, zcela nezávislých na síti díky solárnímu výkonu 11 MW a 10 jednotkám Megapack.",
        "note": null
      },
      "San Antonio River": {
        "why": "Kilometr od San Antonio River Walk, městské promenády podél řeky.",
        "note": null
      },
      "Santa Monica": {
        "why": "U mola Santa Monica Pier a jeho ruského kola, na západním konci Route 66.",
        "note": "Tři stanice v Santa Monice leží v okruhu 3 km; uvedeny jsou dvě nejbližší k molu."
      },
      "Tesla Diner": {
        "why": "Restaurace a autokino Tesla na Santa Monica Blvd: 80 stání V4, restaurace otevřená 24 hodin denně a dvě 45stopé LED obrazovky přenášející zvuk do vozu.",
        "note": null
      },
      "Waikiki": {
        "why": "300 m od Waikiki Beach na ostrově Oahu — jediný Supercharger přímo u pláže.",
        "note": null
      },
      "Whistler": {
        "why": "Ve vesnici Whistler, po silnici Sea-to-Sky Highway z Vancouveru.",
        "note": "Dvě stanice ve Whistleru jsou od sebe vzdálené 0,5 km; uvedeny jsou obě."
      },
      "Yellowstone": {
        "why": "U západního vjezdu do Yellowstonu, nejbližší přístupové cestě k Old Faithful.",
        "note": null
      },
      "Yosemite": {
        "why": "Na Highway 140 u vjezdu Arch Rock — jediný Supercharger do 25 km od Yosemite Valley.",
        "note": null
      },
      "Dombås": {
        "why": "Jedna ze šesti norských stanic otevřených 30. srpna 2013 — prvních Superchargerů postavených mimo Severní Ameriku.",
        "note": null
      },
      "Gayrettepe": {
        "why": "Vlajková stanice Istanbulu na evropské straně Bosporu.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "U evropské továrny Tesla v Grünheide, kde se vyrábí každý evropský Model Y.",
        "note": null
      },
      "Harderwijk": {
        "why": "První stanice Supercharger V4 na světě, otevřená v březnu 2023 — vyšší stojany, delší kabely a podpora vozů jiných značek než Tesla.",
        "note": null
      },
      "Hilden": {
        "why": "40 stání kolem ekologické pekárny Bäckerei Schüren, která vybudovala jeden z nejvytíženějších nabíjecích parků v Evropě — hrázděný a s vlastní vertikální farmou.",
        "note": null
      },
      "Honningsvåg": {
        "why": "Nejsevernější Supercharger na světě na 71,00° s. š., na ostrově Magerøya při cestě na Nordkapp.",
        "note": null
      },
      "Lake Garda": {
        "why": "Nedaleko jižního břehu Lago di Garda, největšího italského jezera.",
        "note": "9 km od jezera; další nejbližší stanice je Castelnuovo del Garda."
      },
      "Lovosice": {
        "why": "Na dálnici D8 pod kopci Českého středohoří, v koridoru Praha–Drážďany.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "U hráze vedoucí k přílivovému ostrovu s opatstvím v Normandii.",
        "note": null
      },
      "Montélimar": {
        "why": "56 stání na dálnici A7 Autoroute du Soleil — původní evropská megastanice a nejvytíženější stanice během odjezdů na dovolenou.",
        "note": null
      },
      "Sevilla": {
        "why": "Supercharger pro hlavní město Andalusie, bránu do jižního Španělska.",
        "note": null
      },
      "Stonehenge": {
        "why": "V Solstice Parku v Amesbury, pět kilometrů od kamenného kruhu.",
        "note": null
      },
      "Østerbø": {
        "why": "Vysoko na Aurlandsfjelletu, norském horském průsmyku známém jako Sněžná cesta.",
        "note": null
      },
      "Ein Bokek": {
        "why": "Nejníže položený Supercharger na světě, 380 m pod hladinou moře na břehu Mrtvého moře.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "Na dálnici Shin-Tomei v prefektuře Šizuoka, významná stanice na hlavní japonské trase Tokio–Nagoja.",
        "note": null
      },
      "Fangshan": {
        "why": "V pekingské čtvrti Fangshan, jihozápadně od centra metropole.",
        "note": null
      },
      "Gangnam": {
        "why": "V Gangnamu, obchodní a zábavní čtvrti Soulu.",
        "note": "V okruhu 1,8 km od stanice Gangnam jsou čtyři stanice; uvedena je ta nejbližší."
      },
      "Jeju": {
        "why": "Na ostrově Jeju, sopečném rekreačním ostrově u jižního pobřeží Jižní Koreje.",
        "note": null
      },
      "Mount Fuji": {
        "why": "Na gotembské straně hory Fudži, u klasické přístupové cesty k hoře.",
        "note": "20 km od vrcholu; další nejbližší stanice Fuji River je vzdálená 24 km."
      },
      "Taipei Xinyi": {
        "why": "V Xinyi, čtvrti kolem Taipei 101.",
        "note": "V okruhu 1,3 km od Taipei 101 jsou tři stanice; uvedena je ta nejbližší."
      },
      "Victoria Harbour": {
        "why": "Na nábřeží Tsim Sha Tsui, s výhledem přes Victoria Harbour na ostrov Hongkong.",
        "note": "V okruhu 2 km kolem přístavu je šest stanic; uvedena je ta nejbližší nábřeží."
      },
      "Dunedin": {
        "why": "Nejjižnější Supercharger na světě na 45,89° j. š., blíže Antarktidě než kterýkoli jiný.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "Odznak útesu lze získat kdekoli podél queenslandského pobřeží, které lemuje, od Cairns po Bundaberg — jediný odznak, u kterého Tesla uvádí více stanic.",
        "note": "Tesla tento odznak popisuje jako vícestaniční, ale nezveřejňuje, které stanice zahrnuje. Uvedeny jsou všechny zprovozněné Superchargery na queenslandském pobřeží v rozsahu zeměpisných šířek útesu."
      }
    }
  },
  "mi": {
    "name": "te reo Māori",
    "dir": "ltr",
    "mapNames": [
      "name:mi"
    ],
    "ui": {
      "documentTitle": "Ngā tohu Tesla Iconic Charger — mahere ao",
      "heading": "Ngā Wāhi Utu Ahurei",
      "mapAria": "He mahere pāhekoheko o ngā Wāhi Utu Ahurei",
      "mapUnavailableTitle": "Kāore te mahere i te wātea",
      "mapFallback": "Kei te mahi tonu te rārangi wāhi utu me ngā taipitopito.",
      "mapSoftwareError": "Kāore te pūmanawa mahere i utaina. Kei te mahi tonu te rārangi wāhi utu me ngā taipitopito.",
      "webglError": "Kāore i taea te whakarewa i WebGL. Kei te mahi tonu te rārangi wāhi utu me ngā taipitopito.",
      "vectorMapError": "Kāore te mahere pere i utaina. Kei te mahi tonu te rārangi wāhi utu me ngā taipitopito.",
      "contextLost": "Kua ngaro i te mahere tōna horopaki whakairoiro. Kei te mahi tonu te rārangi wāhi utu me ngā taipitopito.",
      "searchPlaceholder": "Rapua ngā Wāhi Utu Ahurei",
      "searchAria": "Rapua ngā tohu, ngā tāone me ngā whenua",
      "clearSearch": "Ūkuia te rapunga",
      "filterAria": "Tātari ā-rohe",
      "nearMe": "Tata ki ahau",
      "locating": "E kimi ana i te tauwāhi…",
      "footnote": "ko te tapeke o ngā wāhi utu, ehara i te wātea i taua wā tonu.",
      "detailsAria": "Ngā taipitopito Supercharger",
      "resizeList": "Panonitia te rahi o te rārangi",
      "resizeDetails": "Panonitia te rahi o ngā taipitopito",
      "closeDetails": "Katia ngā taipitopito",
      "languageLabel": "Reo",
      "automatic": "Aunoa",
      "all": "Katoa",
      "noMatches": "Kāore he tohu e ōrite ana ki taua rapunga.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} o te {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "tata",
      "superchargersHeading": "Ngā Supercharger",
      "statsStallsTotal": "ngā wāhi utu katoa",
      "statsStalls": "ngā wāhi utu",
      "statsPeak": "hiko mōrahi",
      "statsAway": "te tawhiti",
      "approxMany": "I whakahāngaitia ki ēnei Supercharger nā te tata — kāore a Tesla e whakaputa i te whakahāngaitanga, nō reira kāore i whakaūngia ki te taupānga.",
      "approxOne": "I whakahāngaitia ki tēnei Supercharger nā te tata — kāore a Tesla e whakaputa i te whakahāngaitanga, nō reira kāore i whakaūngia ki te taupānga.",
      "factSupercharger": "Supercharger",
      "factAddress": "Wāhitau",
      "factCoordinates": "Ngā taunga",
      "factPower": "Hiko",
      "factElevation": "Teitei",
      "factListed": "I whakarārangitia",
      "actionGoogle": "Whakatuwheratia ki Google Maps",
      "actionTesla": "Tesla",
      "locationUnsupported": "Kāore e taea e tēnei pūtirotiro te tiri i te tauwāhi.",
      "locationDenied": "I whakakāhoretia te whakaaetanga tauwāhi — kei te raupapa ā-rohe tonu.",
      "locationFailed": "Kāore i taea te tiki i tō tauwāhi — kei te raupapa ā-rohe tonu.",
      "mapControlTitle": "Ngā pātene mahere",
      "zoomIn": "Topa mai",
      "zoomOut": "Topa atu",
      "resetBearing": "Whakahokia te aronga ki te raki",
      "toggleAttribution": "Whakaaturia, huna rānei ngā mōhiohio pūtake",
      "siteData": "raraunga wāhi",
      "unknown": "Tē mōhiotia"
    },
    "nouns": {
      "badge": {
        "one": "{count} tohu",
        "other": "{count} tohu"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "other": "{count} Supercharger"
      },
      "stall": {
        "one": "{count} wāhi utu",
        "other": "{count} wāhi utu"
      }
    },
    "regions": {
      "North America": "Amerika ki te Raki",
      "Europe": "Ūropi",
      "Asia": "Āhia",
      "Oceania": "Te Moana-nui-a-Kiwa"
    },
    "countries": {
      "Australia": "Ahitereiria",
      "Canada": "Kānata",
      "China": "Haina",
      "Czech Republic": "Te Whenua Tīeke",
      "France": "Wīwī",
      "Germany": "Tiamani",
      "Israel": "Iharaira",
      "Italy": "Itari",
      "Japan": "Hapani",
      "Netherlands": "Hōrana",
      "New Zealand": "Aotearoa",
      "Norway": "Nōwei",
      "South Korea": "Kōrea-ki-te-tonga",
      "Spain": "Peina",
      "Taiwan": "Taiwana",
      "Turkey": "Tākei",
      "USA": "Amerika",
      "United Kingdom": "Kīngitanga Kotahi"
    },
    "reasons": {
      "flagship": {
        "long": "Te teihana matua a Tesla",
        "short": "Teihana matua"
      },
      "significance": {
        "long": "He hiranga motuhake",
        "short": "Wāhi hira"
      },
      "destination": {
        "long": "He wāhi rongonui",
        "short": "Wāhi rongonui"
      }
    },
    "badges": {
      "Arches": {
        "why": "Kei Moab, te wāhi tīmatanga mō ngā papa rēhia ā-motu o Arches me Canyonlands.",
        "note": "E 1.5 km te tawhiti i waenga i ngā wāhi e rua i Moab; kua whakarārangitia rāua e rua."
      },
      "Bryce Canyon": {
        "why": "Kei ngā kūwaha o Bryce Canyon National Park me ōna whare tapere toka hoodoo.",
        "note": null
      },
      "Death Valley": {
        "why": "Ko te tomokanga ki te rāwhiti o Death Valley, kei te huarahi e whakawhiti ana i Daylight Pass.",
        "note": "Kāore he Supercharger i roto i te papa rēhia — kāore anō a Furnace Creek kia hangaia (tūnga VOTING). Ko Beatty te wāhi tuwhera tino tata, 51 km te tawhiti."
      },
      "Golden Gate": {
        "why": "Kei Presidio, ko te Supercharger tino tata ki Golden Gate Bridge.",
        "note": "E 3.5 km mai i te piriti; ko Lombard St me Geary Blvd ngā wāhi tata whai muri."
      },
      "Grand Canyon": {
        "why": "E rua maero mai i te tomokanga South Rim o Grand Canyon.",
        "note": null
      },
      "Joshua Tree": {
        "why": "Kei te tomokanga ki te raki o Joshua Tree National Park.",
        "note": "E 31 km mai i te pokapū o te papa rēhia; koinei te wāhi tino tata ki tētahi tomokanga."
      },
      "Las Vegas Strip": {
        "why": "Kei raro i te wīra mātakitaki High Roller i te Strip — ā, ko te teihana Supercharger V3-katoa tuatahi i whakatuwheratia e Tesla, i Hōngongoi 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "Kei South Beach, he hīkoi poto noa ki te rohe Art Deco me te Moana Ranatiki.",
        "note": "E 1.7 km te tawhiti i waenga i ngā wāhi e rua i Miami Beach; kua whakarārangitia rāua e rua."
      },
      "Niagara Falls": {
        "why": "Kei te taha o Kānata, te wāhi mātakitaki ki Horseshoe Falls.",
        "note": "Kāore he Supercharger i te taha o Amerika o Niagara Falls."
      },
      "Oasis": {
        "why": "Ko te teihana utu nui rawa o te ao — e ai ki a Tesla, e 168 ngā wāhi utu kei ngā eka 30 i te taha o I-5, ā, ka mahi wehe katoa i te mātiti mā te 11 MW pūngao kōmaru me ngā Megapack 10.",
        "note": null
      },
      "San Antonio River": {
        "why": "Kotahi kiromita mai i San Antonio River Walk, te ara hīkoi taha awa o te tāone.",
        "note": null
      },
      "Santa Monica": {
        "why": "Kei te taha o Santa Monica Pier me tōna wīra nui, i te pito uru o Route 66.",
        "note": "E toru ngā wāhi i Santa Monica kei roto i te 3 km; kua whakarārangitia ngā wāhi e rua tino tata ki te wāpu."
      },
      "Tesla Diner": {
        "why": "Ko te whare kai me te whare kiriata ā-motokā a Tesla i Santa Monica Blvd: e 80 ngā wāhi V4, he whare kai tuwhera 24 haora, me ngā mata LED 45-putu e rua e tuku ana i te oro ki tō waka.",
        "note": null
      },
      "Waikiki": {
        "why": "E 300 m mai i Waikiki Beach i Oahu — ko te Supercharger anake kei te taha moana.",
        "note": null
      },
      "Whistler": {
        "why": "Kei te kāinga o Whistler, mā te Sea-to-Sky Highway mai i Vancouver.",
        "note": "E 0.5 km te tawhiti i waenga i ngā wāhi e rua i Whistler; kua whakarārangitia rāua e rua."
      },
      "Yellowstone": {
        "why": "Kei te tomokanga uru o Yellowstone, te ara tino tata ki Old Faithful.",
        "note": null
      },
      "Yosemite": {
        "why": "Kei Highway 140 i te tomokanga Arch Rock — ko te Supercharger anake i roto i te 25 km o Yosemite Valley.",
        "note": null
      },
      "Dombås": {
        "why": "Ko tētahi o ngā wāhi e ono o Nōwei i whakatuwheratia i te 30 o Here-turi-kōkā 2013 — ngā Supercharger tuatahi i hangaia ki waho o Amerika ki te Raki.",
        "note": null
      },
      "Gayrettepe": {
        "why": "Ko te teihana matua o Istanbul, kei te taha Ūropi o Bosphorus.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "Kei te wheketere Ūropi a Tesla i Grünheide, te wāhi e hangaia ai ngā Model Y katoa mō Ūropi.",
        "note": null
      },
      "Harderwijk": {
        "why": "Ko te teihana Supercharger V4 tuatahi o te ao, i whakatuwheratia i Poutū-te-rangi 2023 — he pou teitei ake, he taura roa ake, ā, he mea hanga hoki mō ngā waka ehara i a Tesla.",
        "note": null
      },
      "Hilden": {
        "why": "E 40 ngā wāhi utu huri noa i Bäckerei Schüren, he toa parāoa pararopi nāna tētahi o ngā papa utu pukumahi rawa o Ūropi i hanga — he anga rākau, he māra poutū hoki kei reira.",
        "note": null
      },
      "Honningsvåg": {
        "why": "Ko te Supercharger tino whakateraki o te ao i 71.00°R, kei te moutere o Magerøya i te huarahi ki North Cape.",
        "note": null
      },
      "Lake Garda": {
        "why": "E tata ana ki te tahatika tonga o Lago di Garda, te roto nui rawa o Itari.",
        "note": "E 9 km mai i te roto; ko Castelnuovo del Garda te wāhi tata whai muri."
      },
      "Lovosice": {
        "why": "Kei D8 i raro i ngā puke o České středohoří, i te ara Prague–Dresden.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "Kei te pūtake o te ara whakapiki ki te motu tai pari me tōna whare karakia i Normandy.",
        "note": null
      },
      "Montélimar": {
        "why": "E 56 ngā wāhi utu i A7 Autoroute du Soleil — ko te teihana nui taketake o Ūropi, me tōna teihana pukumahi rawa i te putanga hararei.",
        "note": null
      },
      "Sevilla": {
        "why": "Ko te Supercharger mō te tāone matua o Andalusia, te tomokanga ki te tonga o Peina.",
        "note": null
      },
      "Stonehenge": {
        "why": "Kei Solstice Park i Amesbury, e rima kiromita mai i te porowhita kōhatu.",
        "note": null
      },
      "Østerbø": {
        "why": "Kei runga rawa o Aurlandsfjellet, te ara maunga o Nōwei e mōhiotia ana ko Snow Road.",
        "note": null
      },
      "Ein Bokek": {
        "why": "Ko te Supercharger pāpaku rawa o te ao, e 380 m i raro i te taumata moana i te tahatika o Dead Sea.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "Kei Shin-Tomei Expressway i Shizuoka, he teihana tohu whenua i te ara matua Tokyo–Nagoya o Hapani.",
        "note": null
      },
      "Fangshan": {
        "why": "Kei te takiwā o Fangshan i Beijing, ki te tonga-mā-uru o te tāone matua.",
        "note": null
      },
      "Gangnam": {
        "why": "Kei Gangnam, te takiwā pakihi me te ao pō o Seoul.",
        "note": "E whā ngā wāhi i roto i te 1.8 km o Gangnam station; kua whakarārangitia te mea tino tata."
      },
      "Jeju": {
        "why": "Kei Jeju Island, te motu puia hararei i waho i te takutai tonga o Kōrea-ki-te-tonga.",
        "note": null
      },
      "Mount Fuji": {
        "why": "Kei te taha o Gotemba o Mount Fuji, te ara rongonui ki te maunga.",
        "note": "E 20 km mai i te tihi; ko Fuji River te wāhi tata whai muri, e 24 km te tawhiti."
      },
      "Taipei Xinyi": {
        "why": "Kei Xinyi, te takiwā huri noa i Taipei 101.",
        "note": "E toru ngā wāhi i roto i te 1.3 km o Taipei 101; kua whakarārangitia te mea tino tata."
      },
      "Victoria Harbour": {
        "why": "Kei te taha moana o Tsim Sha Tsui, e anga atu ana ki Hong Kong Island mā runga o Victoria Harbour.",
        "note": "E ono ngā wāhi huri noa i te whanga i roto i te 2 km; kua whakarārangitia te mea tino tata ki te taha moana."
      },
      "Dunedin": {
        "why": "Ko te Supercharger tino whakatetonga o te ao i 45.89°T, he tata ake ki Whenua-a-Tio i ērā atu katoa.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "Ka riro te tohu ākau ki hea noa atu i te takutai o Queensland e whai ana i te ākau, mai i Cairns ki Bundaberg — koinei anake te tohu e kīia ana e Tesla ka kapi i ngā wāhi maha.",
        "note": "E tuhi ana a Tesla he tohu tēnei mō ngā wāhi maha, engari kāore e whakaputa ko ēhea aua wāhi. Kua whakarārangitia ngā Supercharger tuwhera katoa i te takutai o Queensland kei roto i ngā ahopae o te ākau."
      }
    }
  }
});
Object.assign(window.ICONIC_I18N.locales, {
  "fr": {
    "name": "Français",
    "dir": "ltr",
    "mapNames": [
      "name:fr"
    ],
    "ui": {
      "documentTitle": "Badges Tesla Iconic Charger — carte du monde",
      "heading": "Iconic Chargers",
      "mapAria": "Carte interactive des Iconic Chargers",
      "mapUnavailableTitle": "Carte indisponible",
      "mapFallback": "La liste des bornes et les détails restent accessibles.",
      "mapSoftwareError": "Le logiciel de cartographie ne s’est pas chargé. La liste des bornes et les détails restent accessibles.",
      "webglError": "WebGL n’a pas pu démarrer. La liste des bornes et les détails restent accessibles.",
      "vectorMapError": "La carte vectorielle n’a pas pu se charger. La liste des bornes et les détails restent accessibles.",
      "contextLost": "La carte a perdu son contexte graphique. La liste des bornes et les détails restent accessibles.",
      "searchPlaceholder": "Rechercher des Iconic Chargers",
      "searchAria": "Rechercher des badges, des villes et des pays",
      "clearSearch": "Effacer la recherche",
      "filterAria": "Filtrer par région",
      "nearMe": "À proximité",
      "locating": "Localisation…",
      "footnote": "Le nombre à côté de l’éclair indique le total des bornes, et non leur disponibilité en temps réel.",
      "detailsAria": "Détails du Supercharger",
      "closeDetails": "Fermer les détails",
      "languageLabel": "Langue",
      "automatic": "Automatique",
      "all": "Toutes",
      "noMatches": "Aucun badge ne correspond à cette recherche.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} sur {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "env.",
      "superchargersHeading": "Superchargers",
      "statsStallsTotal": "bornes au total",
      "statsStalls": "bornes",
      "statsPeak": "maximum",
      "statsAway": "de distance",
      "approxMany": "Association à ces Superchargers établie d’après leur proximité — Tesla ne publie pas cette correspondance, qui n’est donc pas confirmée dans l’application.",
      "approxOne": "Association à ce Supercharger établie d’après sa proximité — Tesla ne publie pas cette correspondance, qui n’est donc pas confirmée dans l’application.",
      "factSupercharger": "Supercharger",
      "factAddress": "Adresse",
      "factCoordinates": "Coordonnées",
      "factPower": "Puissance",
      "factElevation": "Altitude",
      "factListed": "Répertorié",
      "actionGoogle": "Ouvrir dans Google Maps",
      "actionTesla": "Tesla",
      "locationUnsupported": "Ce navigateur ne peut pas partager de position.",
      "locationDenied": "Autorisation de localisation refusée — le tri par région est conservé.",
      "locationFailed": "Impossible d’obtenir votre position — le tri par région est conservé.",
      "mapControlTitle": "Carte interactive",
      "zoomIn": "Zoom avant",
      "zoomOut": "Zoom arrière",
      "resetBearing": "Réorienter la carte vers le nord",
      "toggleAttribution": "Afficher ou masquer les crédits",
      "resizeList": "Redimensionner la liste",
      "resizeDetails": "Redimensionner les détails",
      "siteData": "données du site",
      "unknown": "Inconnu"
    },
    "nouns": {
      "badge": {
        "one": "{count} badge",
        "many": "{count} badges",
        "other": "{count} badges"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "many": "{count} Superchargers",
        "other": "{count} Superchargers"
      },
      "stall": {
        "one": "{count} borne",
        "many": "{count} bornes",
        "other": "{count} bornes"
      }
    },
    "regions": {
      "North America": "Amérique du Nord",
      "Europe": "Europe",
      "Asia": "Asie",
      "Oceania": "Océanie"
    },
    "countries": {
      "Australia": "Australie",
      "Canada": "Canada",
      "China": "Chine",
      "Czech Republic": "Tchéquie",
      "France": "France",
      "Germany": "Allemagne",
      "Israel": "Israël",
      "Italy": "Italie",
      "Japan": "Japon",
      "Netherlands": "Pays-Bas",
      "New Zealand": "Nouvelle-Zélande",
      "Norway": "Norvège",
      "South Korea": "Corée du Sud",
      "Spain": "Espagne",
      "Taiwan": "Taïwan",
      "Turkey": "Turquie",
      "USA": "États-Unis",
      "United Kingdom": "Royaume-Uni"
    },
    "reasons": {
      "flagship": {
        "long": "Site Tesla emblématique",
        "short": "Emblématique"
      },
      "significance": {
        "long": "Importance particulière",
        "short": "Remarquable"
      },
      "destination": {
        "long": "Destination célèbre",
        "short": "Destination"
      }
    },
    "badges": {
      "Arches": {
        "why": "À Moab, camp de base pour les parcs nationaux des Arches et de Canyonlands.",
        "note": "Deux sites de Moab sont distants de 1,5 km ; tous deux sont répertoriés."
      },
      "Bryce Canyon": {
        "why": "Aux portes du parc national de Bryce Canyon et de ses amphithéâtres de cheminées de fée.",
        "note": null
      },
      "Death Valley": {
        "why": "La porte d’accès orientale à la vallée de la Mort, sur la route qui franchit Daylight Pass.",
        "note": "Il n’existe aucun Supercharger dans le parc : Furnace Creek n’est toujours pas construit (statut VOTING). Beatty est le site en service le plus proche, à 51 km."
      },
      "Golden Gate": {
        "why": "Dans le Presidio, le Supercharger le plus proche du pont du Golden Gate.",
        "note": "À 3,5 km du pont ; Lombard St et Geary Blvd sont les suivants par ordre de proximité."
      },
      "Grand Canyon": {
        "why": "À deux miles de l’entrée South Rim du Grand Canyon.",
        "note": null
      },
      "Joshua Tree": {
        "why": "À l’entrée nord du parc national de Joshua Tree.",
        "note": "À 31 km du centre du parc ; c’est le site le plus proche d’une entrée."
      },
      "Las Vegas Strip": {
        "why": "Sous la grande roue High Roller du Strip — et première station Supercharger entièrement équipée de V3 jamais ouverte par Tesla, en juillet 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "À South Beach, à quelques pas du quartier Art déco et de l’Atlantique.",
        "note": "Deux sites de Miami Beach sont distants de 1,7 km ; tous deux sont répertoriés."
      },
      "Niagara Falls": {
        "why": "Du côté canadien, le point de vue sur les chutes du Fer-à-Cheval.",
        "note": "Il n’existe aucun Supercharger du côté américain des chutes du Niagara."
      },
      "Oasis": {
        "why": "La plus grande station de recharge au monde — Tesla compte 168 bornes sur 30 acres au bord de l’I-5, entièrement autonomes grâce à 11 MW de solaire et 10 Megapacks.",
        "note": null
      },
      "San Antonio River": {
        "why": "À un kilomètre du San Antonio River Walk, la promenade au bord de l’eau de la ville.",
        "note": null
      },
      "Santa Monica": {
        "why": "À côté de la jetée de Santa Monica et de sa grande roue, à l’extrémité ouest de la Route 66.",
        "note": "Trois sites de Santa Monica se trouvent dans un rayon de 3 km ; les deux plus proches de la jetée sont répertoriés."
      },
      "Tesla Diner": {
        "why": "Le diner et cinéma drive-in de Tesla sur Santa Monica Blvd : 80 bornes V4, un restaurant ouvert 24 h/24 et deux écrans LED de 45 pieds qui diffusent le son dans votre voiture.",
        "note": null
      },
      "Waikiki": {
        "why": "À 300 m de Waikiki Beach, sur Oahu — le seul Supercharger en bord de plage.",
        "note": null
      },
      "Whistler": {
        "why": "Dans le village de Whistler, au bout de la route Sea-to-Sky depuis Vancouver.",
        "note": "Deux sites de Whistler sont distants de 0,5 km ; tous deux sont répertoriés."
      },
      "Yellowstone": {
        "why": "À l’entrée ouest de Yellowstone, l’accès le plus proche d’Old Faithful.",
        "note": null
      },
      "Yosemite": {
        "why": "Sur la Highway 140, à l’entrée Arch Rock — le seul Supercharger dans un rayon de 25 km de la vallée de Yosemite.",
        "note": null
      },
      "Dombås": {
        "why": "L’un des six sites norvégiens ouverts le 30 août 2013 — les premiers Superchargers construits hors d’Amérique du Nord.",
        "note": null
      },
      "Gayrettepe": {
        "why": "Le site emblématique d’Istanbul, sur la rive européenne du Bosphore.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "À l’usine européenne de Tesla à Grünheide, où sont fabriquées toutes les Model Y européennes.",
        "note": null
      },
      "Harderwijk": {
        "why": "Le premier site Supercharger V4 au monde, ouvert en mars 2023 — bornes plus hautes, câbles plus longs et conception adaptée aussi aux véhicules non-Tesla.",
        "note": null
      },
      "Hilden": {
        "why": "40 bornes autour de la Bäckerei Schüren, une boulangerie bio à l’origine de l’un des parcs de recharge les plus fréquentés d’Europe — construit en bois et doté d’une ferme verticale sur place.",
        "note": null
      },
      "Honningsvåg": {
        "why": "Le Supercharger le plus septentrional au monde, à 71,00° N, sur l’île de Magerøya et la route du cap Nord.",
        "note": null
      },
      "Lake Garda": {
        "why": "Près de la rive sud du lac de Garde, le plus grand lac d’Italie.",
        "note": "À 9 km du lac ; Castelnuovo del Garda est le suivant par ordre de proximité."
      },
      "Lovosice": {
        "why": "Sur la D8, au pied des collines de České středohoří, dans le corridor Prague-Dresde.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "Au départ de la chaussée qui mène à l’abbaye de l’île à marée de Normandie.",
        "note": null
      },
      "Montélimar": {
        "why": "56 bornes sur l’autoroute du Soleil A7 — le premier méga-site d’Europe et sa station la plus fréquentée lors des grands départs en vacances.",
        "note": null
      },
      "Sevilla": {
        "why": "Le Supercharger de la capitale andalouse, porte d’entrée du sud de l’Espagne.",
        "note": null
      },
      "Stonehenge": {
        "why": "À Solstice Park, à Amesbury, à cinq kilomètres du cercle de pierres.",
        "note": null
      },
      "Østerbø": {
        "why": "Dans les hauteurs d’Aurlandsfjellet, le col norvégien surnommé la Route des Neiges.",
        "note": null
      },
      "Ein Bokek": {
        "why": "Le Supercharger le plus bas au monde, à 380 m sous le niveau de la mer, sur la rive de la mer Morte.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "Sur l’autoroute Shin-Tomei à Shizuoka, un site emblématique de l’axe principal Tokyo-Nagoya au Japon.",
        "note": null
      },
      "Fangshan": {
        "why": "Dans le district de Fangshan à Pékin, au sud-ouest de la capitale.",
        "note": null
      },
      "Gangnam": {
        "why": "À Gangnam, le quartier d’affaires et de vie nocturne de Séoul.",
        "note": "Quatre sites se trouvent dans un rayon de 1,8 km de la station Gangnam ; le plus proche est répertorié."
      },
      "Jeju": {
        "why": "Sur l’île de Jeju, destination de vacances volcanique au large de la côte sud de la Corée du Sud.",
        "note": null
      },
      "Mount Fuji": {
        "why": "Sur le versant Gotemba du mont Fuji, l’itinéraire classique d’approche de la montagne.",
        "note": "À 20 km du sommet ; Fuji River est le suivant par ordre de proximité, à 24 km."
      },
      "Taipei Xinyi": {
        "why": "À Xinyi, le quartier qui entoure Taipei 101.",
        "note": "Trois sites se trouvent dans un rayon de 1,3 km de Taipei 101 ; le plus proche est répertorié."
      },
      "Victoria Harbour": {
        "why": "Sur le front de mer de Tsim Sha Tsui, face à l’île de Hong Kong de l’autre côté de Victoria Harbour.",
        "note": "Six sites entourent le port dans un rayon de 2 km ; celui qui est le plus proche du front de mer est répertorié."
      },
      "Dunedin": {
        "why": "Le Supercharger le plus méridional au monde, à 45,89° S, plus proche de l’Antarctique que tout autre.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "Le badge de la Grande Barrière de corail s’obtient partout le long de la côte du Queensland qu’elle borde, de Cairns à Bundaberg — le seul badge dont Tesla indique qu’il couvre plusieurs sites.",
        "note": "Tesla précise que ce badge couvre plusieurs sites, sans publier lesquels. Tous les Superchargers en service sur la côte du Queensland, dans la plage de latitudes du récif, sont répertoriés."
      }
    }
  },
  "de": {
    "name": "Deutsch",
    "dir": "ltr",
    "mapNames": [
      "name:de"
    ],
    "ui": {
      "documentTitle": "Tesla-Iconic-Charger-Badges — Weltkarte",
      "heading": "Iconic Chargers",
      "mapAria": "Interaktive Karte der Iconic Chargers",
      "mapUnavailableTitle": "Karte nicht verfügbar",
      "mapFallback": "Die Liste der Ladestationen und die Details funktionieren weiterhin.",
      "mapSoftwareError": "Die Kartensoftware wurde nicht geladen. Die Liste der Ladestationen und die Details funktionieren weiterhin.",
      "webglError": "WebGL konnte nicht gestartet werden. Die Liste der Ladestationen und die Details funktionieren weiterhin.",
      "vectorMapError": "Die Vektorkarte konnte nicht geladen werden. Die Liste der Ladestationen und die Details funktionieren weiterhin.",
      "contextLost": "Die Karte hat ihren Grafikkontext verloren. Die Liste der Ladestationen und die Details funktionieren weiterhin.",
      "searchPlaceholder": "Iconic Chargers suchen",
      "searchAria": "Badges, Städte und Länder suchen",
      "clearSearch": "Suche löschen",
      "filterAria": "Nach Region filtern",
      "nearMe": "In meiner Nähe",
      "locating": "Standort wird ermittelt…",
      "footnote": "Die Zahl neben dem Blitz gibt die Gesamtzahl der Ladepunkte an, nicht deren aktuelle Verfügbarkeit.",
      "detailsAria": "Supercharger-Details",
      "closeDetails": "Details schließen",
      "languageLabel": "Sprache",
      "automatic": "Automatisch",
      "all": "Alle",
      "noMatches": "Keine Badges entsprechen dieser Suche.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} von {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "ca.",
      "superchargersHeading": "Supercharger",
      "statsStallsTotal": "Ladepunkte insgesamt",
      "statsStalls": "Ladepunkte",
      "statsPeak": "Spitzenleistung",
      "statsAway": "entfernt",
      "approxMany": "Diese Supercharger wurden anhand ihrer Nähe zugeordnet — Tesla veröffentlicht die Zuordnung nicht, daher ist sie in der App nicht bestätigt.",
      "approxOne": "Dieser Supercharger wurde anhand seiner Nähe zugeordnet — Tesla veröffentlicht die Zuordnung nicht, daher ist sie in der App nicht bestätigt.",
      "factSupercharger": "Supercharger",
      "factAddress": "Adresse",
      "factCoordinates": "Koordinaten",
      "factPower": "Leistung",
      "factElevation": "Höhe",
      "factListed": "Aufgeführt",
      "actionGoogle": "In Google Maps öffnen",
      "actionTesla": "Tesla",
      "locationUnsupported": "Dieser Browser kann keinen Standort teilen.",
      "locationDenied": "Standortzugriff verweigert — die Sortierung nach Region bleibt bestehen.",
      "locationFailed": "Ihr Standort konnte nicht ermittelt werden — die Sortierung nach Region bleibt bestehen.",
      "mapControlTitle": "Interaktive Karte",
      "zoomIn": "Vergrößern",
      "zoomOut": "Verkleinern",
      "resetBearing": "Ausrichtung nach Norden zurücksetzen",
      "toggleAttribution": "Quellenangaben ein- oder ausblenden",
      "resizeList": "Größe der Liste ändern",
      "resizeDetails": "Größe der Details ändern",
      "siteData": "Standortdaten",
      "unknown": "Unbekannt"
    },
    "nouns": {
      "badge": {
        "one": "{count} Badge",
        "other": "{count} Badges"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "other": "{count} Supercharger"
      },
      "stall": {
        "one": "{count} Ladepunkt",
        "other": "{count} Ladepunkte"
      }
    },
    "regions": {
      "North America": "Nordamerika",
      "Europe": "Europa",
      "Asia": "Asien",
      "Oceania": "Ozeanien"
    },
    "countries": {
      "Australia": "Australien",
      "Canada": "Kanada",
      "China": "China",
      "Czech Republic": "Tschechien",
      "France": "Frankreich",
      "Germany": "Deutschland",
      "Israel": "Israel",
      "Italy": "Italien",
      "Japan": "Japan",
      "Netherlands": "Niederlande",
      "New Zealand": "Neuseeland",
      "Norway": "Norwegen",
      "South Korea": "Südkorea",
      "Spain": "Spanien",
      "Taiwan": "Taiwan",
      "Turkey": "Türkei",
      "USA": "USA",
      "United Kingdom": "Vereinigtes Königreich"
    },
    "reasons": {
      "flagship": {
        "long": "Tesla-Vorzeigestandort",
        "short": "Vorzeige"
      },
      "significance": {
        "long": "Besondere Bedeutung",
        "short": "Bedeutend"
      },
      "destination": {
        "long": "Berühmtes Reiseziel",
        "short": "Reiseziel"
      }
    },
    "badges": {
      "Arches": {
        "why": "In Moab, dem Ausgangspunkt für die Nationalparks Arches und Canyonlands.",
        "note": "Die beiden Standorte in Moab liegen 1,5 km auseinander; beide sind aufgeführt."
      },
      "Bryce Canyon": {
        "why": "Vor den Toren des Bryce-Canyon-Nationalparks mit seinen Hoodoo-Amphitheatern.",
        "note": null
      },
      "Death Valley": {
        "why": "Das östliche Tor zum Death Valley, an der Zufahrt über den Daylight Pass.",
        "note": "Im Park gibt es keinen Supercharger — Furnace Creek ist weiterhin nicht gebaut (Status VOTING). Beatty ist mit 51 km Entfernung der nächstgelegene aktive Standort."
      },
      "Golden Gate": {
        "why": "Im Presidio, der der Golden-Gate-Brücke am nächsten gelegene Supercharger.",
        "note": "3,5 km von der Brücke entfernt; Lombard St und Geary Blvd sind die nächstgelegenen Alternativen."
      },
      "Grand Canyon": {
        "why": "Zwei Meilen vom Eingang zum South Rim des Grand Canyon entfernt.",
        "note": null
      },
      "Joshua Tree": {
        "why": "Am Nordeingang des Joshua-Tree-Nationalparks.",
        "note": "31 km vom Mittelpunkt des Parks entfernt; der einer Parkeinfahrt am nächsten gelegene Standort."
      },
      "Las Vegas Strip": {
        "why": "Unter dem Riesenrad High Roller am Strip — und die erste reine V3-Supercharger-Station, die Tesla je eröffnet hat, im Juli 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "In South Beach, nur wenige Schritte vom Art-déco-Viertel und vom Atlantik entfernt.",
        "note": "Die beiden Standorte in Miami Beach liegen 1,7 km auseinander; beide sind aufgeführt."
      },
      "Niagara Falls": {
        "why": "Auf der kanadischen Seite, dem Aussichtspunkt auf die Horseshoe Falls.",
        "note": "Auf der US-amerikanischen Seite der Niagarafälle gibt es keinen Supercharger."
      },
      "Oasis": {
        "why": "Die größte Ladestation der Welt — laut Tesla 168 Ladepunkte auf 30 Acres an der I-5, vollständig netzunabhängig mit 11 MW Solarleistung und 10 Megapacks.",
        "note": null
      },
      "San Antonio River": {
        "why": "Einen Kilometer vom San Antonio River Walk entfernt, der Uferpromenade der Stadt.",
        "note": null
      },
      "Santa Monica": {
        "why": "Neben dem Santa Monica Pier und seinem Riesenrad, am westlichen Ende der Route 66.",
        "note": "Drei Standorte in Santa Monica liegen innerhalb von 3 km; die beiden dem Pier am nächsten gelegenen sind aufgeführt."
      },
      "Tesla Diner": {
        "why": "Teslas Diner und Autokino am Santa Monica Blvd: 80 V4-Ladepunkte, ein rund um die Uhr geöffnetes Restaurant und zwei 45 Fuß hohe LED-Leinwände, deren Ton ins Auto übertragen wird.",
        "note": null
      },
      "Waikiki": {
        "why": "300 m vom Waikiki Beach auf Oahu entfernt — der einzige Supercharger direkt am Strand.",
        "note": null
      },
      "Whistler": {
        "why": "Im Dorf Whistler, von Vancouver aus über den Sea-to-Sky Highway.",
        "note": "Die beiden Standorte in Whistler liegen 0,5 km auseinander; beide sind aufgeführt."
      },
      "Yellowstone": {
        "why": "Am Westeingang von Yellowstone, der nächstgelegene Zugang zu Old Faithful.",
        "note": null
      },
      "Yosemite": {
        "why": "Am Highway 140 beim Eingang Arch Rock — der einzige Supercharger im Umkreis von 25 km um das Yosemite Valley.",
        "note": null
      },
      "Dombås": {
        "why": "Einer von sechs norwegischen Standorten, die am 30. August 2013 eröffnet wurden — die ersten außerhalb Nordamerikas gebauten Supercharger.",
        "note": null
      },
      "Gayrettepe": {
        "why": "Istanbuls Flagship-Standort auf der europäischen Seite des Bosporus.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "An Teslas europäischem Werk in Grünheide, in dem jedes europäische Model Y gebaut wird.",
        "note": null
      },
      "Harderwijk": {
        "why": "Der weltweit erste V4-Supercharger-Standort, eröffnet im März 2023 — höhere Säulen, längere Kabel und auch für Fahrzeuge anderer Marken ausgelegt.",
        "note": null
      },
      "Hilden": {
        "why": "40 Ladepunkte rund um die Bäckerei Schüren, eine Bio-Bäckerei, die einen der meistgenutzten Ladeparks Europas errichtete — in Holzbauweise und mit eigener vertikaler Farm.",
        "note": null
      },
      "Honningsvåg": {
        "why": "Der nördlichste Supercharger der Welt bei 71,00° N, auf der Insel Magerøya an der Straße zum Nordkap.",
        "note": null
      },
      "Lake Garda": {
        "why": "Nahe dem Südufer des Gardasees, Italiens größtem See.",
        "note": "9 km vom See entfernt; Castelnuovo del Garda ist der nächstgelegene alternative Standort."
      },
      "Lovosice": {
        "why": "An der D8 unterhalb der Hügel des České středohoří, auf dem Korridor Prag–Dresden.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "Am Damm zur Gezeiteninsel mit ihrer Abtei in der Normandie.",
        "note": null
      },
      "Montélimar": {
        "why": "56 Ladepunkte an der A7 Autoroute du Soleil — Europas ursprünglicher Mega-Standort und zur Ferienreisezeit seine meistgenutzte Station.",
        "note": null
      },
      "Sevilla": {
        "why": "Der Supercharger für Andalusiens Hauptstadt, das Tor zum Süden Spaniens.",
        "note": null
      },
      "Stonehenge": {
        "why": "Im Solstice Park in Amesbury, fünf Kilometer vom Steinkreis entfernt.",
        "note": null
      },
      "Østerbø": {
        "why": "Hoch auf dem Aurlandsfjellet, dem norwegischen Gebirgspass, der als Schneestraße bekannt ist.",
        "note": null
      },
      "Ein Bokek": {
        "why": "Der tiefstgelegene Supercharger der Welt, 380 m unter dem Meeresspiegel am Ufer des Toten Meeres.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "Am Shin-Tomei Expressway in Shizuoka, ein markanter Standort an Japans Hauptachse Tokio–Nagoya.",
        "note": null
      },
      "Fangshan": {
        "why": "Im Pekinger Bezirk Fangshan, südwestlich der Hauptstadt.",
        "note": null
      },
      "Gangnam": {
        "why": "In Gangnam, Seouls Geschäfts- und Ausgehviertel.",
        "note": "Vier Standorte liegen im Umkreis von 1,8 km um die Station Gangnam; der nächstgelegene ist aufgeführt."
      },
      "Jeju": {
        "why": "Auf Jeju, der vulkanischen Ferieninsel vor der Südküste Südkoreas.",
        "note": null
      },
      "Mount Fuji": {
        "why": "Auf der Gotemba-Seite des Fuji, dem klassischen Zugang zum Berg.",
        "note": "20 km vom Gipfel entfernt; Fuji River ist mit 24 km Entfernung der nächstgelegene alternative Standort."
      },
      "Taipei Xinyi": {
        "why": "In Xinyi, dem Viertel rund um Taipei 101.",
        "note": "Drei Standorte liegen im Umkreis von 1,3 km um Taipei 101; der nächstgelegene ist aufgeführt."
      },
      "Victoria Harbour": {
        "why": "An der Uferpromenade von Tsim Sha Tsui, mit Blick über Victoria Harbour auf Hong Kong Island.",
        "note": "Sechs Standorte säumen den Hafen im Umkreis von 2 km; der nächstgelegene an der Uferpromenade ist aufgeführt."
      },
      "Dunedin": {
        "why": "Der südlichste Supercharger der Welt bei 45,89° S, näher an der Antarktis als jeder andere.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "Das Riff-Badge kann überall entlang der vom Great Barrier Reef gesäumten Küste Queenslands gesammelt werden, von Cairns bis Bundaberg — das einzige Badge, das Tesla ausdrücklich mehreren Standorten zuordnet.",
        "note": "Tesla weist dieses Badge als standortübergreifend aus, veröffentlicht aber nicht, welche Standorte dazugehören. Aufgeführt sind alle aktiven Supercharger an der Küste Queenslands innerhalb der Breitengrade des Riffs."
      }
    }
  },
  "nl": {
    "name": "Nederlands",
    "dir": "ltr",
    "mapNames": [
      "name:nl"
    ],
    "ui": {
      "documentTitle": "Tesla Iconic Charger-badges — wereldkaart",
      "heading": "Iconic Chargers",
      "mapAria": "Interactieve kaart van Iconic Chargers",
      "mapUnavailableTitle": "Kaart niet beschikbaar",
      "mapFallback": "De lijst met laadlocaties en de details blijven werken.",
      "mapSoftwareError": "De kaartsoftware is niet geladen. De lijst met laadlocaties en de details blijven werken.",
      "webglError": "WebGL kon niet worden gestart. De lijst met laadlocaties en de details blijven werken.",
      "vectorMapError": "De vectorkaart kon niet worden geladen. De lijst met laadlocaties en de details blijven werken.",
      "contextLost": "De grafische context van de kaart is verloren gegaan. De lijst met laadlocaties en de details blijven werken.",
      "searchPlaceholder": "Iconic Chargers zoeken",
      "searchAria": "Badges, steden en landen zoeken",
      "clearSearch": "Zoekopdracht wissen",
      "filterAria": "Filteren op regio",
      "nearMe": "In de buurt",
      "locating": "Locatie bepalen…",
      "footnote": "Het getal naast de bliksemschicht is het totale aantal laadpunten, niet de actuele beschikbaarheid.",
      "detailsAria": "Supercharger-details",
      "closeDetails": "Details sluiten",
      "languageLabel": "Taal",
      "automatic": "Automatisch",
      "all": "Alle",
      "noMatches": "Geen badges komen overeen met deze zoekopdracht.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} van {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "ca.",
      "superchargersHeading": "Superchargers",
      "statsStallsTotal": "laadpunten in totaal",
      "statsStalls": "laadpunten",
      "statsPeak": "piekvermogen",
      "statsAway": "verwijderd",
      "approxMany": "Op basis van afstand gekoppeld aan deze Superchargers — Tesla publiceert de koppeling niet, dus deze is niet bevestigd in de app.",
      "approxOne": "Op basis van afstand gekoppeld aan deze Supercharger — Tesla publiceert de koppeling niet, dus deze is niet bevestigd in de app.",
      "factSupercharger": "Supercharger",
      "factAddress": "Adres",
      "factCoordinates": "Coördinaten",
      "factPower": "Vermogen",
      "factElevation": "Hoogte",
      "factListed": "Vermeld",
      "actionGoogle": "Openen in Google Maps",
      "actionTesla": "Tesla",
      "locationUnsupported": "Deze browser kan geen locatie delen.",
      "locationDenied": "Locatietoegang geweigerd — de sortering op regio blijft behouden.",
      "locationFailed": "Je locatie kon niet worden bepaald — de sortering op regio blijft behouden.",
      "mapControlTitle": "Interactieve kaart",
      "zoomIn": "Inzoomen",
      "zoomOut": "Uitzoomen",
      "resetBearing": "Kaart weer naar het noorden draaien",
      "toggleAttribution": "Bronvermelding tonen of verbergen",
      "resizeList": "Grootte van de lijst aanpassen",
      "resizeDetails": "Grootte van de details aanpassen",
      "siteData": "locatiegegevens",
      "unknown": "Onbekend"
    },
    "nouns": {
      "badge": {
        "one": "{count} badge",
        "other": "{count} badges"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "other": "{count} Superchargers"
      },
      "stall": {
        "one": "{count} laadpunt",
        "other": "{count} laadpunten"
      }
    },
    "regions": {
      "North America": "Noord-Amerika",
      "Europe": "Europa",
      "Asia": "Azië",
      "Oceania": "Oceanië"
    },
    "countries": {
      "Australia": "Australië",
      "Canada": "Canada",
      "China": "China",
      "Czech Republic": "Tsjechië",
      "France": "Frankrijk",
      "Germany": "Duitsland",
      "Israel": "Israël",
      "Italy": "Italië",
      "Japan": "Japan",
      "Netherlands": "Nederland",
      "New Zealand": "Nieuw-Zeeland",
      "Norway": "Noorwegen",
      "South Korea": "Zuid-Korea",
      "Spain": "Spanje",
      "Taiwan": "Taiwan",
      "Turkey": "Turkije",
      "USA": "Verenigde Staten",
      "United Kingdom": "Verenigd Koninkrijk"
    },
    "reasons": {
      "flagship": {
        "long": "Toonaangevende Tesla-locatie",
        "short": "Toonaangevend"
      },
      "significance": {
        "long": "Bijzondere betekenis",
        "short": "Bijzonder"
      },
      "destination": {
        "long": "Beroemde bestemming",
        "short": "Bestemming"
      }
    },
    "badges": {
      "Arches": {
        "why": "In Moab, de uitvalsbasis voor de nationale parken Arches en Canyonlands.",
        "note": "De twee locaties in Moab liggen 1,5 km uit elkaar; beide zijn vermeld."
      },
      "Bryce Canyon": {
        "why": "Bij de toegang tot Bryce Canyon National Park en zijn amfitheaters vol hoodoos.",
        "note": null
      },
      "Death Valley": {
        "why": "De oostelijke toegangspoort tot Death Valley, aan de route via Daylight Pass.",
        "note": "In het park staat geen Supercharger — Furnace Creek is nog altijd niet gebouwd (status VOTING). Beatty is de dichtstbijzijnde actieve locatie, op 51 km afstand."
      },
      "Golden Gate": {
        "why": "In de Presidio, de Supercharger die het dichtst bij de Golden Gate Bridge ligt.",
        "note": "Op 3,5 km van de brug; Lombard St en Geary Blvd zijn daarna het dichtstbij."
      },
      "Grand Canyon": {
        "why": "Op twee mijl van de ingang tot de South Rim van de Grand Canyon.",
        "note": null
      },
      "Joshua Tree": {
        "why": "Bij de noordelijke ingang van Joshua Tree National Park.",
        "note": "Op 31 km van het middelpunt van het park; de locatie die het dichtst bij een parkingang ligt."
      },
      "Las Vegas Strip": {
        "why": "Onder het High Roller-reuzenrad aan de Strip — en de eerste Supercharger-locatie met uitsluitend V3 die Tesla ooit opende, in juli 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "In South Beach, op een steenworp van de art-decowijk en de Atlantische Oceaan.",
        "note": "De twee locaties in Miami Beach liggen 1,7 km uit elkaar; beide zijn vermeld."
      },
      "Niagara Falls": {
        "why": "Aan de Canadese kant, met uitzicht op de Horseshoe Falls.",
        "note": "Aan de Amerikaanse kant van de Niagarawatervallen staat geen Supercharger."
      },
      "Oasis": {
        "why": "Het grootste laadstation ter wereld — volgens Tesla 168 laadpunten op 30 acre langs de I-5, volledig los van het elektriciteitsnet dankzij 11 MW aan zonnepanelen en 10 Megapacks.",
        "note": null
      },
      "San Antonio River": {
        "why": "Op een kilometer van de San Antonio River Walk, de promenade langs de rivier in de stad.",
        "note": null
      },
      "Santa Monica": {
        "why": "Naast de Santa Monica Pier en zijn reuzenrad, aan het westelijke uiteinde van Route 66.",
        "note": "Drie locaties in Santa Monica liggen binnen 3 km; de twee dichtst bij de pier zijn vermeld."
      },
      "Tesla Diner": {
        "why": "Tesla’s diner en drive-inbioscoop aan Santa Monica Blvd: 80 V4-laadpunten, een restaurant dat 24 uur per dag open is en twee ledschermen van 45 voet die het geluid naar je auto sturen.",
        "note": null
      },
      "Waikiki": {
        "why": "Op 300 m van Waikiki Beach op Oahu — de enige Supercharger direct aan het strand.",
        "note": null
      },
      "Whistler": {
        "why": "In het dorp Whistler, vanuit Vancouver bereikbaar via de Sea-to-Sky Highway.",
        "note": "De twee locaties in Whistler liggen 0,5 km uit elkaar; beide zijn vermeld."
      },
      "Yellowstone": {
        "why": "Bij de westelijke ingang van Yellowstone, de dichtstbijzijnde route naar Old Faithful.",
        "note": null
      },
      "Yosemite": {
        "why": "Aan Highway 140 bij de ingang Arch Rock — de enige Supercharger binnen 25 km van Yosemite Valley.",
        "note": null
      },
      "Dombås": {
        "why": "Een van de zes Noorse locaties die op 30 augustus 2013 opengingen — de eerste Superchargers die buiten Noord-Amerika werden gebouwd.",
        "note": null
      },
      "Gayrettepe": {
        "why": "De toonaangevende locatie van Istanbul, aan de Europese kant van de Bosporus.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "Bij Tesla’s Europese fabriek in Grünheide, waar elke Europese Model Y wordt gebouwd.",
        "note": null
      },
      "Harderwijk": {
        "why": "De eerste V4-Supercharger-locatie ter wereld, geopend in maart 2023 — hogere palen, langere kabels en ook ontworpen voor auto’s van andere merken.",
        "note": null
      },
      "Hilden": {
        "why": "40 laadpunten rond Bäckerei Schüren, een biologische bakkerij die een van Europa’s drukste laadparken bouwde — met een houten draagconstructie en een eigen verticale boerderij.",
        "note": null
      },
      "Honningsvåg": {
        "why": "De noordelijkste Supercharger ter wereld op 71,00° N, op het eiland Magerøya aan de weg naar de Noordkaap.",
        "note": null
      },
      "Lake Garda": {
        "why": "Dicht bij de zuidelijke oever van het Gardameer, het grootste meer van Italië.",
        "note": "Op 9 km van het meer; Castelnuovo del Garda is daarna het dichtstbij."
      },
      "Lovosice": {
        "why": "Aan de D8 onder de heuvels van České středohoří, op de route Praag–Dresden.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "Bij de dam naar het getijdeneiland met zijn abdij in Normandië.",
        "note": null
      },
      "Montélimar": {
        "why": "56 laadpunten aan de A7 Autoroute du Soleil — Europa’s oorspronkelijke megalocatie en tijdens de vakantie-uittocht het drukste station van het continent.",
        "note": null
      },
      "Sevilla": {
        "why": "De Supercharger voor de hoofdstad van Andalusië, de toegangspoort tot Zuid-Spanje.",
        "note": null
      },
      "Stonehenge": {
        "why": "In Solstice Park in Amesbury, op vijf kilometer van de steencirkel.",
        "note": null
      },
      "Østerbø": {
        "why": "Hoog op Aurlandsfjellet, de Noorse bergpas die bekendstaat als de Sneeuwweg.",
        "note": null
      },
      "Ein Bokek": {
        "why": "De laagst gelegen Supercharger ter wereld, 380 m onder zeeniveau aan de oever van de Dode Zee.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "Aan de Shin-Tomei Expressway in Shizuoka, een markante locatie op de belangrijkste verkeersader Tokio–Nagoya in Japan.",
        "note": null
      },
      "Fangshan": {
        "why": "In het district Fangshan in Beijing, ten zuidwesten van de hoofdstad.",
        "note": null
      },
      "Gangnam": {
        "why": "In Gangnam, het zaken- en uitgaansdistrict van Seoul.",
        "note": "Vier locaties liggen binnen 1,8 km van station Gangnam; de dichtstbijzijnde is vermeld."
      },
      "Jeju": {
        "why": "Op Jeju, het vulkanische vakantie-eiland voor de zuidkust van Zuid-Korea.",
        "note": null
      },
      "Mount Fuji": {
        "why": "Aan de Gotemba-kant van Mount Fuji, de klassieke toegangsroute naar de berg.",
        "note": "Op 20 km van de top; Fuji River is daarna het dichtstbij, op 24 km."
      },
      "Taipei Xinyi": {
        "why": "In Xinyi, het district rond Taipei 101.",
        "note": "Drie locaties liggen binnen 1,3 km van Taipei 101; de dichtstbijzijnde is vermeld."
      },
      "Victoria Harbour": {
        "why": "Aan de waterkant van Tsim Sha Tsui, met aan de overkant van Victoria Harbour uitzicht op Hong Kong Island.",
        "note": "Zes locaties liggen binnen 2 km rond de haven; de locatie die het dichtst bij de waterkant ligt, is vermeld."
      },
      "Dunedin": {
        "why": "De zuidelijkste Supercharger ter wereld op 45,89° Z, dichter bij Antarctica dan alle andere.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "De rifbadge is te verdienen langs de hele kust van Queensland waarlangs het Great Barrier Reef loopt, van Cairns tot Bundaberg — de enige badge waarvan Tesla aangeeft dat deze meerdere locaties omvat.",
        "note": "Tesla vermeldt dat deze badge meerdere locaties omvat, maar publiceert niet welke. Alle actieve Superchargers aan de kust van Queensland binnen het breedtebereik van het rif zijn vermeld."
      }
    }
  },
  "it": {
    "name": "Italiano",
    "dir": "ltr",
    "mapNames": [
      "name:it"
    ],
    "ui": {
      "documentTitle": "Badge Tesla Iconic Charger — mappa mondiale",
      "heading": "Iconic Chargers",
      "mapAria": "Mappa interattiva degli Iconic Chargers",
      "mapUnavailableTitle": "Mappa non disponibile",
      "mapFallback": "L’elenco delle stazioni e i dettagli continuano a funzionare.",
      "mapSoftwareError": "Il software della mappa non è stato caricato. L’elenco delle stazioni e i dettagli continuano a funzionare.",
      "webglError": "Impossibile avviare WebGL. L’elenco delle stazioni e i dettagli continuano a funzionare.",
      "vectorMapError": "Impossibile caricare la mappa vettoriale. L’elenco delle stazioni e i dettagli continuano a funzionare.",
      "contextLost": "La mappa ha perso il contesto grafico. L’elenco delle stazioni e i dettagli continuano a funzionare.",
      "searchPlaceholder": "Cerca Iconic Chargers",
      "searchAria": "Cerca badge, città e paesi",
      "clearSearch": "Cancella ricerca",
      "filterAria": "Filtra per regione",
      "nearMe": "Nelle vicinanze",
      "locating": "Localizzazione…",
      "footnote": "Il numero accanto al fulmine indica il totale degli stalli, non la disponibilità in tempo reale.",
      "detailsAria": "Dettagli del Supercharger",
      "closeDetails": "Chiudi dettagli",
      "languageLabel": "Lingua",
      "automatic": "Automatica",
      "all": "Tutte",
      "noMatches": "Nessun badge corrisponde a questa ricerca.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} di {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "circa",
      "superchargersHeading": "Supercharger",
      "statsStallsTotal": "stalli totali",
      "statsStalls": "stalli",
      "statsPeak": "picco",
      "statsAway": "di distanza",
      "approxMany": "Associazione a questi Supercharger basata sulla vicinanza — Tesla non pubblica la corrispondenza, quindi non è confermata nell’app.",
      "approxOne": "Associazione a questo Supercharger basata sulla vicinanza — Tesla non pubblica la corrispondenza, quindi non è confermata nell’app.",
      "factSupercharger": "Supercharger",
      "factAddress": "Indirizzo",
      "factCoordinates": "Coordinate",
      "factPower": "Potenza",
      "factElevation": "Altitudine",
      "factListed": "In elenco",
      "actionGoogle": "Apri in Google Maps",
      "actionTesla": "Tesla",
      "locationUnsupported": "Questo browser non può condividere la posizione.",
      "locationDenied": "Autorizzazione alla posizione negata — l’ordinamento per regione resta attivo.",
      "locationFailed": "Impossibile ottenere la tua posizione — l’ordinamento per regione resta attivo.",
      "mapControlTitle": "Mappa interattiva",
      "zoomIn": "Aumenta lo zoom",
      "zoomOut": "Riduci lo zoom",
      "resetBearing": "Ripristina l’orientamento verso nord",
      "toggleAttribution": "Mostra o nascondi attribuzione",
      "resizeList": "Ridimensiona l’elenco",
      "resizeDetails": "Ridimensiona i dettagli",
      "siteData": "dati del sito",
      "unknown": "Sconosciuto"
    },
    "nouns": {
      "badge": {
        "one": "{count} badge",
        "many": "{count} badge",
        "other": "{count} badge"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "many": "{count} Supercharger",
        "other": "{count} Supercharger"
      },
      "stall": {
        "one": "{count} stallo",
        "many": "{count} stalli",
        "other": "{count} stalli"
      }
    },
    "regions": {
      "North America": "Nord America",
      "Europe": "Europa",
      "Asia": "Asia",
      "Oceania": "Oceania"
    },
    "countries": {
      "Australia": "Australia",
      "Canada": "Canada",
      "China": "Cina",
      "Czech Republic": "Cechia",
      "France": "Francia",
      "Germany": "Germania",
      "Israel": "Israele",
      "Italy": "Italia",
      "Japan": "Giappone",
      "Netherlands": "Paesi Bassi",
      "New Zealand": "Nuova Zelanda",
      "Norway": "Norvegia",
      "South Korea": "Corea del Sud",
      "Spain": "Spagna",
      "Taiwan": "Taiwan",
      "Turkey": "Turchia",
      "USA": "Stati Uniti",
      "United Kingdom": "Regno Unito"
    },
    "reasons": {
      "flagship": {
        "long": "Sito Tesla di punta",
        "short": "Di punta"
      },
      "significance": {
        "long": "Importanza speciale",
        "short": "Significativo"
      },
      "destination": {
        "long": "Destinazione famosa",
        "short": "Destinazione"
      }
    },
    "badges": {
      "Arches": {
        "why": "A Moab, base di partenza per i parchi nazionali di Arches e Canyonlands.",
        "note": "I due siti di Moab distano 1,5 km l’uno dall’altro; sono indicati entrambi."
      },
      "Bryce Canyon": {
        "why": "Alle porte del Bryce Canyon National Park e dei suoi anfiteatri di hoodoo.",
        "note": null
      },
      "Death Valley": {
        "why": "La porta orientale della Death Valley, lungo la strada che entra dal Daylight Pass.",
        "note": "Non esiste alcun Supercharger all’interno del parco: Furnace Creek non è ancora stato costruito (stato VOTING). Beatty è il sito attivo più vicino, a 51 km."
      },
      "Golden Gate": {
        "why": "Nel Presidio, il Supercharger più vicino al Golden Gate Bridge.",
        "note": "A 3,5 km dal ponte; Lombard St e Geary Blvd sono i successivi in ordine di distanza."
      },
      "Grand Canyon": {
        "why": "A due miglia dall’ingresso del South Rim del Grand Canyon.",
        "note": null
      },
      "Joshua Tree": {
        "why": "All’ingresso nord del Joshua Tree National Park.",
        "note": "A 31 km dal centro del parco; è il sito più vicino a un ingresso."
      },
      "Las Vegas Strip": {
        "why": "Sotto la ruota panoramica High Roller sulla Strip — e la prima stazione Supercharger interamente V3 mai aperta da Tesla, nel luglio 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "A South Beach, a pochi passi dal quartiere Art Déco e dall’Atlantico.",
        "note": "I due siti di Miami Beach distano 1,7 km l’uno dall’altro; sono indicati entrambi."
      },
      "Niagara Falls": {
        "why": "Sul versante canadese, il punto panoramico sulle Horseshoe Falls.",
        "note": "Non esiste alcun Supercharger sul versante statunitense delle cascate del Niagara."
      },
      "Oasis": {
        "why": "La stazione di ricarica più grande al mondo — secondo Tesla, 168 stalli su 30 acri accanto alla I-5, completamente autonoma dalla rete grazie a 11 MW di solare e 10 Megapack.",
        "note": null
      },
      "San Antonio River": {
        "why": "A un chilometro dal San Antonio River Walk, il lungofiume della città.",
        "note": null
      },
      "Santa Monica": {
        "why": "Accanto al Santa Monica Pier e alla sua ruota panoramica, all’estremità occidentale della Route 66.",
        "note": "Tre siti di Santa Monica si trovano entro 3 km; sono indicati i due più vicini al molo."
      },
      "Tesla Diner": {
        "why": "Il diner e drive-in di Tesla su Santa Monica Blvd: 80 stalli V4, un ristorante aperto 24 ore su 24 e due schermi LED da 45 piedi che trasmettono l’audio nell’auto.",
        "note": null
      },
      "Waikiki": {
        "why": "A 300 m da Waikiki Beach, sull’isola di Oahu — l’unico Supercharger sul lungomare.",
        "note": null
      },
      "Whistler": {
        "why": "Nel villaggio di Whistler, lungo la Sea-to-Sky Highway da Vancouver.",
        "note": "I due siti di Whistler distano 0,5 km l’uno dall’altro; sono indicati entrambi."
      },
      "Yellowstone": {
        "why": "All’ingresso ovest di Yellowstone, il punto di accesso più vicino a Old Faithful.",
        "note": null
      },
      "Yosemite": {
        "why": "Sulla Highway 140 all’ingresso Arch Rock — l’unico Supercharger entro 25 km dalla Yosemite Valley.",
        "note": null
      },
      "Dombås": {
        "why": "Uno dei sei siti norvegesi aperti il 30 agosto 2013 — i primi Supercharger costruiti fuori dal Nord America.",
        "note": null
      },
      "Gayrettepe": {
        "why": "Il sito di punta di Istanbul, sul versante europeo del Bosforo.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "Presso la fabbrica europea di Tesla a Grünheide, dove viene costruita ogni Model Y europea.",
        "note": null
      },
      "Harderwijk": {
        "why": "Il primo sito Supercharger V4 al mondo, aperto nel marzo 2023 — colonnine più alte, cavi più lunghi e progettazione adatta anche ai veicoli non Tesla.",
        "note": null
      },
      "Hilden": {
        "why": "40 stalli intorno alla Bäckerei Schüren, una panetteria biologica che ha realizzato uno dei parchi di ricarica più frequentati d’Europa — con struttura in legno e una fattoria verticale sul posto.",
        "note": null
      },
      "Honningsvåg": {
        "why": "Il Supercharger più a nord del mondo, a 71,00° N, sull’isola di Magerøya lungo la strada per Capo Nord.",
        "note": null
      },
      "Lake Garda": {
        "why": "Vicino alla sponda meridionale del Lago di Garda, il lago più grande d’Italia.",
        "note": "A 9 km dal lago; Castelnuovo del Garda è il sito successivo in ordine di distanza."
      },
      "Lovosice": {
        "why": "Sulla D8, ai piedi delle colline del České středohoří, lungo il corridoio Praga–Dresda.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "All’imbocco della strada rialzata che conduce all’abbazia sull’isola tidale in Normandia.",
        "note": null
      },
      "Montélimar": {
        "why": "56 stalli sulla A7 Autoroute du Soleil — il primo megasito d’Europa e la stazione più affollata durante gli esodi estivi.",
        "note": null
      },
      "Sevilla": {
        "why": "Il Supercharger della capitale andalusa, porta d’accesso alla Spagna meridionale.",
        "note": null
      },
      "Stonehenge": {
        "why": "Al Solstice Park di Amesbury, a cinque chilometri dal cerchio di pietre.",
        "note": null
      },
      "Østerbø": {
        "why": "Sull’altopiano di Aurlandsfjellet, il passo montano norvegese noto come Strada della Neve.",
        "note": null
      },
      "Ein Bokek": {
        "why": "Il Supercharger più basso al mondo, 380 m sotto il livello del mare sulla riva del Mar Morto.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "Sulla Shin-Tomei Expressway a Shizuoka, un sito emblematico sull’arteria principale Tokyo–Nagoya del Giappone.",
        "note": null
      },
      "Fangshan": {
        "why": "Nel distretto Fangshan di Pechino, a sud-ovest della capitale.",
        "note": null
      },
      "Gangnam": {
        "why": "A Gangnam, il quartiere degli affari e della vita notturna di Seul.",
        "note": "Quattro siti si trovano entro 1,8 km dalla stazione di Gangnam; è indicato il più vicino."
      },
      "Jeju": {
        "why": "Sull’isola di Jeju, meta turistica vulcanica al largo della costa meridionale della Corea del Sud.",
        "note": null
      },
      "Mount Fuji": {
        "why": "Sul versante di Gotemba del Monte Fuji, l’accesso classico alla montagna.",
        "note": "A 20 km dalla vetta; Fuji River è il sito successivo in ordine di distanza, a 24 km."
      },
      "Taipei Xinyi": {
        "why": "A Xinyi, il distretto intorno a Taipei 101.",
        "note": "Tre siti si trovano entro 1,3 km da Taipei 101; è indicato il più vicino."
      },
      "Victoria Harbour": {
        "why": "Sul lungomare di Tsim Sha Tsui, di fronte a Hong Kong Island, oltre Victoria Harbour.",
        "note": "Sei siti circondano il porto entro 2 km; è indicato quello più vicino al lungomare."
      },
      "Dunedin": {
        "why": "Il Supercharger più a sud del mondo, a 45,89° S, più vicino all’Antartide di qualsiasi altro.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "Il badge della barriera si ottiene lungo tutta la costa del Queensland che costeggia, da Cairns a Bundaberg — l’unico badge che Tesla descrive come associato a più siti.",
        "note": "Tesla indica che questo badge comprende più siti, ma non pubblica quali. Sono elencati tutti i Supercharger attivi sulla costa del Queensland compresi nell’intervallo di latitudini della barriera."
      }
    }
  },
  "es": {
    "name": "Español",
    "dir": "ltr",
    "mapNames": [
      "name:es"
    ],
    "ui": {
      "documentTitle": "Insignias Tesla Iconic Charger — mapamundi",
      "heading": "Iconic Chargers",
      "mapAria": "Mapa interactivo de Iconic Chargers",
      "mapUnavailableTitle": "Mapa no disponible",
      "mapFallback": "La lista de cargadores y los detalles siguen funcionando.",
      "mapSoftwareError": "El software del mapa no se ha cargado. La lista de cargadores y los detalles siguen funcionando.",
      "webglError": "No se ha podido iniciar WebGL. La lista de cargadores y los detalles siguen funcionando.",
      "vectorMapError": "No se ha podido cargar el mapa vectorial. La lista de cargadores y los detalles siguen funcionando.",
      "contextLost": "El mapa ha perdido su contexto gráfico. La lista de cargadores y los detalles siguen funcionando.",
      "searchPlaceholder": "Buscar Iconic Chargers",
      "searchAria": "Buscar insignias, ciudades y países",
      "clearSearch": "Borrar búsqueda",
      "filterAria": "Filtrar por región",
      "nearMe": "Cerca de mí",
      "locating": "Localizando…",
      "footnote": "El número junto al rayo indica el total de puestos, no la disponibilidad en tiempo real.",
      "detailsAria": "Detalles del Supercharger",
      "closeDetails": "Cerrar detalles",
      "languageLabel": "Idioma",
      "automatic": "Automático",
      "all": "Todas",
      "noMatches": "Ninguna insignia coincide con esta búsqueda.",
      "summaryAll": "{badges} · {sites}",
      "summaryFiltered": "{visible} de {total} · {sites}",
      "summaryDated": "{badges} · {sites} · {date}",
      "regionCount": "{region} · {count}",
      "markerAria": "{label}, {stalls}",
      "approx": "aprox.",
      "superchargersHeading": "Superchargers",
      "statsStallsTotal": "puestos en total",
      "statsStalls": "puestos",
      "statsPeak": "máximo",
      "statsAway": "de distancia",
      "approxMany": "Asociados a estos Superchargers por proximidad — Tesla no publica la correspondencia, por lo que no está confirmada en la aplicación.",
      "approxOne": "Asociado a este Supercharger por proximidad — Tesla no publica la correspondencia, por lo que no está confirmada en la aplicación.",
      "factSupercharger": "Supercharger",
      "factAddress": "Dirección",
      "factCoordinates": "Coordenadas",
      "factPower": "Potencia",
      "factElevation": "Altitud",
      "factListed": "Incluido",
      "actionGoogle": "Abrir en Google Maps",
      "actionTesla": "Tesla",
      "locationUnsupported": "Este navegador no puede compartir la ubicación.",
      "locationDenied": "Permiso de ubicación denegado — se mantiene la ordenación por región.",
      "locationFailed": "No se ha podido obtener tu ubicación — se mantiene la ordenación por región.",
      "mapControlTitle": "Mapa interactivo",
      "zoomIn": "Acercar",
      "zoomOut": "Alejar",
      "resetBearing": "Restablecer la orientación al norte",
      "toggleAttribution": "Mostrar u ocultar atribución",
      "resizeList": "Cambiar tamaño de la lista",
      "resizeDetails": "Cambiar tamaño de los detalles",
      "siteData": "datos del sitio",
      "unknown": "Desconocido"
    },
    "nouns": {
      "badge": {
        "one": "{count} insignia",
        "many": "{count} insignias",
        "other": "{count} insignias"
      },
      "supercharger": {
        "one": "{count} Supercharger",
        "many": "{count} Superchargers",
        "other": "{count} Superchargers"
      },
      "stall": {
        "one": "{count} puesto",
        "many": "{count} puestos",
        "other": "{count} puestos"
      }
    },
    "regions": {
      "North America": "Norteamérica",
      "Europe": "Europa",
      "Asia": "Asia",
      "Oceania": "Oceanía"
    },
    "countries": {
      "Australia": "Australia",
      "Canada": "Canadá",
      "China": "China",
      "Czech Republic": "Chequia",
      "France": "Francia",
      "Germany": "Alemania",
      "Israel": "Israel",
      "Italy": "Italia",
      "Japan": "Japón",
      "Netherlands": "Países Bajos",
      "New Zealand": "Nueva Zelanda",
      "Norway": "Noruega",
      "South Korea": "Corea del Sur",
      "Spain": "España",
      "Taiwan": "Taiwán",
      "Turkey": "Turquía",
      "USA": "Estados Unidos",
      "United Kingdom": "Reino Unido"
    },
    "reasons": {
      "flagship": {
        "long": "Ubicación emblemática de Tesla",
        "short": "Emblemática"
      },
      "significance": {
        "long": "Importancia especial",
        "short": "Significativa"
      },
      "destination": {
        "long": "Destino famoso",
        "short": "Destino"
      }
    },
    "badges": {
      "Arches": {
        "why": "En Moab, base de operaciones para los parques nacionales Arches y Canyonlands.",
        "note": "Los dos sitios de Moab están separados por 1,5 km; ambos están incluidos."
      },
      "Bryce Canyon": {
        "why": "A las puertas del parque nacional Bryce Canyon y sus anfiteatros de hoodoos.",
        "note": null
      },
      "Death Valley": {
        "why": "La puerta oriental de Death Valley, en la carretera de acceso por Daylight Pass.",
        "note": "No hay ningún Supercharger dentro del parque: Furnace Creek sigue sin construirse (estado VOTING). Beatty es el sitio activo más cercano, a 51 km."
      },
      "Golden Gate": {
        "why": "En el Presidio, el Supercharger más cercano al puente Golden Gate.",
        "note": "A 3,5 km del puente; Lombard St y Geary Blvd son los siguientes más cercanos."
      },
      "Grand Canyon": {
        "why": "A dos millas de la entrada al South Rim del Grand Canyon.",
        "note": null
      },
      "Joshua Tree": {
        "why": "En la entrada norte del parque nacional Joshua Tree.",
        "note": "A 31 km del centro del parque; es el sitio más cercano a una de sus entradas."
      },
      "Las Vegas Strip": {
        "why": "Bajo la noria High Roller del Strip — y la primera estación Supercharger íntegramente V3 que Tesla abrió, en julio de 2019.",
        "note": null
      },
      "Miami Beach": {
        "why": "En South Beach, a pocos pasos del distrito Art Déco y del Atlántico.",
        "note": "Los dos sitios de Miami Beach están separados por 1,7 km; ambos están incluidos."
      },
      "Niagara Falls": {
        "why": "En el lado canadiense, el mirador de las Horseshoe Falls.",
        "note": "No hay ningún Supercharger en el lado estadounidense de las cataratas del Niágara."
      },
      "Oasis": {
        "why": "La estación de carga más grande del mundo — según Tesla, 168 puestos en 30 acres junto a la I-5, totalmente aislada de la red gracias a 11 MW de energía solar y 10 Megapacks.",
        "note": null
      },
      "San Antonio River": {
        "why": "A un kilómetro del San Antonio River Walk, el paseo ribereño de la ciudad.",
        "note": null
      },
      "Santa Monica": {
        "why": "Junto al Santa Monica Pier y su noria, en el extremo occidental de la Ruta 66.",
        "note": "Hay tres sitios de Santa Monica en un radio de 3 km; se incluyen los dos más cercanos al muelle."
      },
      "Tesla Diner": {
        "why": "El diner y autocine de Tesla en Santa Monica Blvd: 80 puestos V4, un restaurante abierto las 24 horas y dos pantallas LED de 45 pies que transmiten el audio al coche.",
        "note": null
      },
      "Waikiki": {
        "why": "A 300 m de Waikiki Beach, en Oahu — el único Supercharger en primera línea de playa.",
        "note": null
      },
      "Whistler": {
        "why": "En el pueblo de Whistler, subiendo desde Vancouver por la Sea-to-Sky Highway.",
        "note": "Los dos sitios de Whistler están separados por 0,5 km; ambos están incluidos."
      },
      "Yellowstone": {
        "why": "En la entrada oeste de Yellowstone, el acceso más cercano a Old Faithful.",
        "note": null
      },
      "Yosemite": {
        "why": "En la Highway 140, junto a la entrada Arch Rock — el único Supercharger en un radio de 25 km de Yosemite Valley.",
        "note": null
      },
      "Dombås": {
        "why": "Uno de los seis sitios noruegos que abrieron el 30 de agosto de 2013 — los primeros Superchargers construidos fuera de Norteamérica.",
        "note": null
      },
      "Gayrettepe": {
        "why": "El sitio emblemático de Estambul, en el lado europeo del Bósforo.",
        "note": null
      },
      "Gigafactory Berlin": {
        "why": "En la fábrica europea de Tesla en Grünheide, donde se fabrican todos los Model Y europeos.",
        "note": null
      },
      "Harderwijk": {
        "why": "El primer sitio Supercharger V4 del mundo, inaugurado en marzo de 2023 — postes más altos, cables más largos y un diseño apto también para vehículos que no son Tesla.",
        "note": null
      },
      "Hilden": {
        "why": "40 puestos alrededor de Bäckerei Schüren, una panadería ecológica que construyó uno de los parques de carga más concurridos de Europa — con estructura de madera y una granja vertical propia.",
        "note": null
      },
      "Honningsvåg": {
        "why": "El Supercharger más septentrional del mundo, a 71,00° N, en la isla de Magerøya y en la carretera hacia el cabo Norte.",
        "note": null
      },
      "Lake Garda": {
        "why": "Cerca de la orilla sur del lago de Garda, el mayor lago de Italia.",
        "note": "A 9 km del lago; Castelnuovo del Garda es el siguiente más cercano."
      },
      "Lovosice": {
        "why": "En la D8, bajo las colinas de České středohoří, en el corredor Praga–Dresde.",
        "note": null
      },
      "Mont Saint-Michel": {
        "why": "En la calzada que lleva a la abadía de la isla mareal de Normandía.",
        "note": null
      },
      "Montélimar": {
        "why": "56 puestos en la A7 Autoroute du Soleil — el megasitio original de Europa y su estación más concurrida durante las salidas de vacaciones.",
        "note": null
      },
      "Sevilla": {
        "why": "El Supercharger de la capital andaluza, puerta de entrada al sur de España.",
        "note": null
      },
      "Stonehenge": {
        "why": "En Solstice Park, en Amesbury, a cinco kilómetros del círculo de piedras.",
        "note": null
      },
      "Østerbø": {
        "why": "En lo alto de Aurlandsfjellet, el puerto de montaña noruego conocido como la Carretera de la Nieve.",
        "note": null
      },
      "Ein Bokek": {
        "why": "El Supercharger a menor altitud del mundo, 380 m bajo el nivel del mar en la costa del mar Muerto.",
        "note": null
      },
      "Enshu-Morimachi": {
        "why": "En la autopista Shin-Tomei de Shizuoka, un sitio emblemático en la principal arteria Tokio–Nagoya de Japón.",
        "note": null
      },
      "Fangshan": {
        "why": "En el distrito Fangshan de Pekín, al suroeste de la capital.",
        "note": null
      },
      "Gangnam": {
        "why": "En Gangnam, el distrito financiero y de ocio nocturno de Seúl.",
        "note": "Hay cuatro sitios en un radio de 1,8 km de la estación de Gangnam; se incluye el más cercano."
      },
      "Jeju": {
        "why": "En la isla de Jeju, destino vacacional volcánico frente a la costa sur de Corea del Sur.",
        "note": null
      },
      "Mount Fuji": {
        "why": "En la vertiente de Gotemba del monte Fuji, la ruta clásica de acceso a la montaña.",
        "note": "A 20 km de la cima; Fuji River es el siguiente más cercano, a 24 km."
      },
      "Taipei Xinyi": {
        "why": "En Xinyi, el distrito que rodea Taipei 101.",
        "note": "Hay tres sitios en un radio de 1,3 km de Taipei 101; se incluye el más cercano."
      },
      "Victoria Harbour": {
        "why": "En el paseo marítimo de Tsim Sha Tsui, frente a Hong Kong Island al otro lado de Victoria Harbour.",
        "note": "Seis sitios rodean el puerto en un radio de 2 km; se incluye el más cercano al paseo marítimo."
      },
      "Dunedin": {
        "why": "El Supercharger más meridional del mundo, a 45,89° S, más cerca de la Antártida que cualquier otro.",
        "note": null
      },
      "Great Barrier Reef": {
        "why": "La insignia del arrecife se obtiene en cualquier punto de la costa de Queensland que recorre, desde Cairns hasta Bundaberg — la única insignia que Tesla describe como válida para varios sitios.",
        "note": "Tesla indica que esta insignia corresponde a varios sitios, pero no publica cuáles. Se incluyen todos los Superchargers activos de la costa de Queensland dentro del intervalo de latitudes del arrecife."
      }
    }
  }
});
