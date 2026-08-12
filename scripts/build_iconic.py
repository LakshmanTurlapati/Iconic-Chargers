#!/usr/bin/env python3
"""Build the curated iconic Tesla Supercharger dataset.

Coordinates, stall counts, elevations and opening dates come from the
supercharge.info community database (https://supercharge.info/service/supercharge/allSites),
which is the most complete public register of Supercharger sites.
The "why" notes are hand-curated from press coverage and Tesla announcements.

Usage:
    curl -s https://supercharge.info/service/supercharge/allSites -o data/allSites.json
    python3 scripts/build_iconic.py
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "allSites.json")
OUT_JSON = os.path.join(ROOT, "data", "iconic-superchargers.json")
OUT_MD = os.path.join(ROOT, "ICONIC-SUPERCHARGERS.md")
OUT_JS = os.path.join(ROOT, "web", "sites.js")

SNAPSHOT = "2026-08-12"

# The map plots every site at once, so every colour pair is effectively adjacent
# and must clear the all-pairs gate. Six categorical hues cannot (verified with
# the palette validator); three can. So the six curated categories fold into
# three colour groups on the map, and the finer category stays available as a
# filter and as text in the list and popups.
GROUP_OF = {
    "Origins": "Firsts",
    "Technology firsts": "Firsts",
    "National & continental firsts": "Firsts",
    "Flagship mega-sites": "Records",
    "Geographic extremes": "Records",
    "Landmarks & destinations": "Destinations",
}

# (exact supercharge.info name, category, why-it-is-iconic)
CURATED = [
    # ------------------------------------------------------------------ origins
    ("Hawthorne, CA", "Origins",
     "The first Supercharger ever built, at the Tesla Design Studio next to SpaceX. "
     "One of the six sites revealed at the network's launch event on 24 Sep 2012. "
     "Later closed to the public and reserved for Tesla/SpaceX staff."),
    ("Harris Ranch, CA", "Origins",
     "One of the original six (Sep 2012) and the most storied site in the network - the I-5 "
     "halfway point between LA and San Francisco. Later expanded into the 98-stall Harris Ranch/"
     "Coalinga complex that held the 'world's largest' title until 2024."),
    ("Tejon Ranch, CA", "Origins",
     "One of the original six (Sep 2012), at the foot of the Grapevine on I-5. "
     "Also one of the earliest sites to get a solar canopy and on-site battery storage."),
    ("Barstow, CA", "Origins",
     "One of the original six (Sep 2012), on the LA-Las Vegas run and historic Route 66. "
     "Barstow has since become the densest Supercharger town on Earth."),
    ("Gilroy, CA", "Origins",
     "One of the original six (Sep 2012), at the Gilroy Premium Outlets on US-101."),
    ("Folsom, CA - Iron Point Rd", "Origins",
     "One of the original six (Sep 2012), the network's Sacramento-area anchor."),
    ("Milford, CT - I-95 N", "Origins",
     "Opened Dec 2012 as part of the first Supercharger pair outside California, launching "
     "the East Coast corridor. Its southbound twin sits across the interstate."),
    ("Brokelandsheia, Norway", "Origins",
     "Part of Norway's launch batch on 13 Aug 2013 - the first Superchargers outside North "
     "America and the seed of the European network."),
    ("Aurland, Norway", "Origins",
     "Opened 30 Aug 2013 in Norway's first wave; sits above the Aurlandsfjord on the "
     "Snow Road, routinely voted the most scenic Supercharger in Europe."),
    ("Lillehammer, Norway", "Origins",
     "Opened 30 Aug 2013 in Norway's first wave, at the 1994 Winter Olympics host town."),
    ("Shanghai, China - Jinqiao Tesla Center", "Origins",
     "The first Supercharger in China and in Asia (Apr 2014), at Tesla's first Chinese store."),

    # ------------------------------------------------------- technology firsts
    ("Chicago, IL - N Columbus Dr", "Technology firsts",
     "One of the two first 'urban' Superchargers, launched 11 Sep 2017 with the compact "
     "post design and 72 kW per stall aimed at Model 3 city drivers."),
    ("Boston, MA - Boylston Street", "Technology firsts",
     "The other first urban Supercharger (11 Sep 2017), under the Prudential Center."),
    ("Kettleman City, CA", "Technology firsts",
     "The first Supercharger with a full Tesla lounge (Nov 2017): 24/7 indoor seating, "
     "espresso bar, kids' play wall, pet relief area and restrooms. The template for every "
     "amenity-led Supercharger since."),
    ("Fremont, CA", "Technology firsts",
     "The Fremont factory site where Supercharger V3 (250 kW) was unveiled in Mar 2019 and "
     "first opened to the wider fleet in Jun 2019."),
    ("Las Vegas, NV - High Roller at LINQ", "Technology firsts",
     "The first complete all-V3 public station (18 Jul 2019), under the High Roller just off "
     "the Strip, with a solar canopy and Powerpack storage."),
    ("Sassenheim, Netherlands", "Technology firsts",
     "One of the ten Dutch sites in the 1 Nov 2021 pilot that opened Superchargers to "
     "non-Tesla EVs for the first time anywhere."),
    ("Verona, NY", "Technology firsts",
     "The first Supercharger fitted with Magic Dock - the built-in CCS1 adapter that let "
     "non-Tesla EVs charge in North America (Feb 2023)."),
    ("Harderwijk, Netherlands", "Technology firsts",
     "The world's first V4 Supercharger site (Mar 2023): taller posts, much longer cables "
     "and stall geometry designed for non-Tesla vehicles."),

    # ---------------------------------------------------------- mega-flagships
    ("Lost Hills, CA - Tesla Oasis", "Flagship mega-sites",
     "The largest charging station on Earth: Tesla counts 168 stalls (V4, 325 kW) on 30 acres "
     "beside I-5, run fully off-grid on 11 MW of solar and 10 Megapacks (39 MWh), with a 24/7 "
     "lounge. First 84 stalls energised Jul 2025; completed later that year."),
    ("Barstow, CA - 1503 E Main St", "Flagship mega-sites",
     "120 stalls - the world's largest when it opened in Nov 2024, and still the biggest "
     "grid-tied Supercharger."),
    ("Baker, CA", "Flagship mega-sites",
     "96 stalls with solar canopies, battery storage and a lounge, at the LA-Las Vegas "
     "midpoint next to the world's tallest thermometer."),
    ("Coalinga, CA", "Flagship mega-sites",
     "The 80-stall V3 expansion of Harris Ranch. Combined with the original 18 stalls next "
     "door it formed the 98-stall complex that was the world's largest from 2022 to 2024."),
    ("Quartzsite, AZ - Main Event Ln", "Flagship mega-sites",
     "84 stalls in a desert town of ~2,400 people - built for the snowbird RV migration "
     "and the I-10 Phoenix-LA corridor."),
    ("Los Angeles, CA - Tesla Diner", "Flagship mega-sites",
     "The Tesla Diner and Drive-In on Santa Monica Blvd: 80 V4 stalls, a 24-hour retro "
     "diner, roller-skating servers and two 45-ft LED drive-in screens that pipe audio into "
     "your car. Opened 21 Jul 2025; the largest urban Supercharger in the world."),
    ("Tejon Ranch, CA - Outlets at Tejon Pkwy", "Flagship mega-sites",
     "76 stalls at the Outlets at Tejon, the modern successor to the 2012 original across "
     "the road."),
    ("Barstow, CA - Tanger Way", "Flagship mega-sites",
     "70 stalls with solar canopies and batteries - one of three large Barstow sites."),
    ("Magnant, France", "Flagship mega-sites",
     "56 stalls on the A5 - tied for the largest Supercharger in Europe."),
    ("Montélimar, France", "Flagship mega-sites",
     "56 stalls on the A7 'Autoroute du Soleil', Europe's original mega-site and its "
     "busiest holiday-season station."),
    ("Shanghai, China - Jing'an International Center Phase I", "Flagship mega-sites",
     "52 stalls - the largest Supercharger in Asia, in downtown Shanghai."),
    ("Nebbenes, Norway", "Flagship mega-sites",
     "44 stalls on the E6 north of Oslo. For years the largest Supercharger in Europe and "
     "the busiest in the world by utilisation."),
    ("Hilden, Germany", "Flagship mega-sites",
     "40 stalls at Backerei Schuren, an organic bakery that built one of Europe's busiest "
     "charging parks around it - timber construction, waste-heat recovery and an on-site "
     "vertical farm feeding the cafe."),
    ("Firebaugh, CA", "Flagship mega-sites",
     "56 stalls and Tesla's proving ground for solar-plus-Megapack Supercharging (Nov 2020) "
     "- the direct ancestor of Project Oasis."),

    # ------------------------------------------------------ geographic extremes
    ("Honningsvåg, Norway", "Geographic extremes",
     "The northernmost Supercharger on Earth at 71.00 degrees N, on the island of Mageroya "
     "on the road to the North Cape."),
    ("Skaidi, Norway", "Geographic extremes",
     "70.43 degrees N on the Finnmark plateau - the second-northernmost site and a critical "
     "link on the drive to the North Cape."),
    ("Alta, Norway", "Geographic extremes",
     "Deep inside the Arctic Circle at 69.96 degrees N, the northern-lights capital of Norway."),
    ("Narvik, Norway", "Geographic extremes",
     "68.44 degrees N in the Arctic fjords, on the Norway-Sweden Ofoten corridor."),
    ("Inari, Finland", "Geographic extremes",
     "The northernmost Supercharger in Finland at 68.91 degrees N, in Sami Lapland."),
    ("Dunedin, NZ", "Geographic extremes",
     "The southernmost Supercharger on Earth at 45.89 degrees S (Oct 2024), closer to "
     "Antarctica than any other."),
    ("Queenstown, NZ", "Geographic extremes",
     "Held the southernmost-Supercharger title for six years and remains the most "
     "photographed site in the Southern Hemisphere."),
    ("Glenorchy, TAS", "Geographic extremes",
     "The southernmost Supercharger in Australia, outside Hobart, Tasmania."),
    ("Shigatse, China - Roof of the World Hotel", "Geographic extremes",
     "The highest Supercharger on Earth at ~4,337 m, at the Roof of the World Hotel in "
     "Tingri, Tibet - the staging town for the drive to Everest Base Camp."),
    ("Litang, China - Wormwood Hotel", "Geographic extremes",
     "3,960 m on the Sichuan-Tibet Highway (G318), in one of the highest towns on the planet."),
    ("Lhasa, China - Songtsam Retreat", "Geographic extremes",
     "3,741 m in the Tibetan capital - the far end of Tesla's 1,400-mile Sichuan-Tibet "
     "Supercharger corridor."),
    ("Ein Bokek, Israel", "Geographic extremes",
     "The lowest Supercharger on Earth at 380 m below sea level, on the Dead Sea shore."),
    ("El Centro, CA", "Geographic extremes",
     "The lowest Supercharger in the Americas, 9 m below sea level in the Imperial Valley."),
    ("Nur-Sultan, Kazakhstan", "Geographic extremes",
     "The most isolated Supercharger in the world: the nearest other site is ~970 km away "
     "in Almaty."),
    ("Naha, Japan - Ameku", "Geographic extremes",
     "On Okinawa, ~600 km of open ocean from the nearest Supercharger on Kyushu."),
    ("Mohe, China - Hongjinding Hotel", "Geographic extremes",
     "China's northernmost town, on the Russian border at 52.98 degrees N - and ~450 km "
     "from its nearest neighbour."),
    ("Kashgar, China - New World Department Store", "Geographic extremes",
     "The westernmost Supercharger in China, on the ancient Silk Road in far Xinjiang."),
    ("Sanya, China - Huayi Hotel Yalong Bay", "Geographic extremes",
     "The southernmost Supercharger in China, on the tropical tip of Hainan Island."),
    ("Fairbanks, AK", "Geographic extremes",
     "The northernmost Supercharger in North America (64.84 degrees N), completing the "
     "Alaska Highway chain in Dec 2025."),
    ("Nenana, AK", "Geographic extremes",
     "A Parks Highway outpost that made Anchorage-to-Fairbanks possible in a Tesla."),
    ("Lana'i City, HI", "Geographic extremes",
     "The most remote US Supercharger - on Lanai, a Hawaiian island with no traffic lights."),
    ("Mildura, VIC", "Geographic extremes",
     "The most isolated Supercharger in Australia, on the Murray River outback run."),

    # -------------------------------------------------- landmark & destination
    ("Nürburgring, Germany", "Landmarks & destinations",
     "At the gates of the Nordschleife, where Tesla ran the Model S Plaid record attempts. "
     "A pilgrimage stop for performance-EV drivers."),
    ("Tusayan, AZ", "Landmarks & destinations",
     "The Grand Canyon Supercharger, 2.4 miles from the South Rim entrance."),
    ("West Yellowstone, MT", "Landmarks & destinations",
     "At Yellowstone's west entrance - the classic national-park Supercharger."),
    ("Mariposa, CA", "Landmarks & destinations",
     "The Yosemite gateway on Highway 140."),
    ("Groveland, CA", "Landmarks & destinations",
     "The other Yosemite gateway, on Highway 120 toward Tioga Pass."),
    ("Twin Falls, ID", "Landmarks & destinations",
     "Perched over the Snake River Canyon at the Evel Knievel jump site - one of the most "
     "spectacular views from any charging stall in America."),
    ("West Wendover, NV", "Landmarks & destinations",
     "On the Nevada-Utah line at the edge of the Bonneville Salt Flats."),
    ("Santa Monica, CA", "Landmarks & destinations",
     "62 stalls a few hundred metres from the Santa Monica Pier, the western terminus of "
     "Route 66 - one of the busiest urban Superchargers anywhere."),
    ("Manhattan, NY - Vesey St", "Landmarks & destinations",
     "Under Brookfield Place at the World Trade Center - the Supercharger in the middle of "
     "downtown Manhattan."),
    ("Endsee, Germany", "Landmarks & destinations",
     "20 stalls near Rothenburg ob der Tauber and the launch site of bk World's architectural "
     "'Qube' lounges - restrooms, workspaces and a four-minute pizza vending machine."),
    ("St. Moritz, Switzerland", "Landmarks & destinations",
     "The Alpine luxury-resort Supercharger, open since Dec 2014 at 1,800 m."),
    ("Skei, Norway", "Landmarks & destinations",
     "In the heart of the western fjords on the Jostedalsbreen glacier route."),
    ("Höfn, Iceland", "Landmarks & destinations",
     "On Iceland's Ring Road beside Vatnajokull, the gateway to the Jokulsarlon glacier lagoon."),
    ("Fossvogur, Iceland", "Landmarks & destinations",
     "Iceland's first Supercharger (Jul 2020), in Reykjavik - a network powered almost "
     "entirely by geothermal and hydro electricity."),
    ("Gigafactory Berlin-Brandenburg, Germany", "Landmarks & destinations",
     "The Supercharger at Tesla's European factory in Grunheide."),
    ("Brownsville, TX - Boca Chica Blvd", "Landmarks & destinations",
     "The last Supercharger on the road to SpaceX Starbase and the Boca Chica launch site."),
    ("Aqaba, Jordan - King Hussein Int. Airport", "Landmarks & destinations",
     "On the Red Sea at the southern end of Jordan's Superchargers - the charging route to Petra."),
    ("Fátima, Portugal", "Landmarks & destinations",
     "32 stalls at one of Catholicism's largest pilgrimage sites and Portugal's first Supercharger."),
    ("Kingman, AZ", "Landmarks & destinations",
     "The Route 66 Supercharger on Andy Devine Avenue, in the Mother Road's best-preserved town."),
    ("Needles, CA", "Landmarks & destinations",
     "Route 66 on the Colorado River, in one of the hottest towns in the United States."),
    ("Tucumcari, NM", "Landmarks & destinations",
     "Neon-sign Route 66 Americana on I-40 in eastern New Mexico."),
    ("San Clemente, CA", "Landmarks & destinations",
     "49 stalls overlooking the Pacific on the I-5 - a favourite of Southern California "
     "road-trip photography."),
    ("Kettleman City, CA - Bernard Dr", "Landmarks & destinations",
     "55 stalls across from the original lounge site; the pair make Kettleman City the "
     "best-known pit stop in the network."),

    # ------------------------------------------------- national / continental firsts
    ("Squamish, BC", "National & continental firsts", "First Supercharger in Canada (Jul 2014), on the Sea-to-Sky Highway."),
    ("Zevenaar, Netherlands", "National & continental firsts", "First Supercharger in the Netherlands (Dec 2013)."),
    ("Jettingen, Germany", "National & continental firsts", "First Supercharger in Germany (Dec 2013)."),
    ("Lully, Switzerland", "National & continental firsts", "First Supercharger in Switzerland (Dec 2013)."),
    ("St. Anton am Arlberg, Austria", "National & continental firsts", "First Supercharger in Austria (Dec 2013), in an Alpine ski resort."),
    ("Mâcon, France", "National & continental firsts", "First Supercharger in France (Jul 2014)."),
    ("London, UK - Canary Wharf", "National & continental firsts", "First Supercharger in the United Kingdom (Aug 2014)."),
    ("Yokohama, Japan", "National & continental firsts", "First Supercharger in Japan (Sep 2014)."),
    ("Dorno Ovest, Italy", "National & continental firsts", "First Supercharger in Italy (Sep 2014)."),
    ("Goulburn, NSW", "National & continental firsts", "First Supercharger in Australia (Sep 2015), on the Sydney-Melbourne route."),
    ("Al Qatranah, Jordan", "National & continental firsts", "First Supercharger in Jordan and the Middle East (Oct 2015), on the Desert Highway."),
    ("Cuernavaca, Mexico", "National & continental firsts", "First Supercharger in Mexico and Latin America (Jun 2016)."),
    ("Taipei, Taiwan - Expo Park", "National & continental firsts", "First Supercharger in Taiwan (Jan 2017)."),
    ("Jebel Ali, UAE - Dubai bound", "National & continental firsts", "First Supercharger in the UAE (Feb 2017), on the Dubai-Abu Dhabi E11."),
    ("Hamilton, NZ", "National & continental firsts", "First Supercharger in New Zealand (Feb 2017)."),
    ("Cheonan, South Korea - Sono Belle", "National & continental firsts", "First Supercharger in South Korea (May 2017)."),
    ("Schaan, Liechtenstein", "National & continental firsts", "The only Supercharger in Liechtenstein (Sep 2017) - an entire country served by one site."),
    ("Nur-Sultan, Kazakhstan", "National & continental firsts", "First Supercharger in Kazakhstan and Central Asia (Nov 2019)."),
    ("Athens, Greece", "National & continental firsts", "First Supercharger in Greece (Feb 2021)."),
    ("Tel Aviv, Israel", "National & continental firsts", "First Supercharger in Israel (Mar 2021)."),
    ("Orchard Central, Singapore", "National & continental firsts", "First Supercharger in Singapore (Jul 2021)."),
    ("Casablanca, Morocco", "National & continental firsts", "First Supercharger in Morocco and on the African continent (Sep 2021)."),
    ("Bangkok, Thailand - Central World", "National & continental firsts", "First Supercharger in Thailand (Feb 2023)."),
    ("Edirne, Türkiye", "National & continental firsts", "First Supercharger in Turkiye (Apr 2023), at the European land border."),
    ("Kuala Lumpur, Malaysia - Pavilion KL", "National & continental firsts", "First Supercharger in Malaysia (Aug 2023)."),
    ("Luxembourg Urban, Luxembourg", "National & continental firsts", "First Supercharger in Luxembourg (May 2024)."),
    ("Doha, Qatar - Doha Festival City", "National & continental firsts", "First Supercharger in Qatar (Jun 2024)."),
    ("Curauma, Chile", "National & continental firsts", "First Supercharger in Chile and in South America (Oct 2024)."),
    ("Taguig, Philippines - Uptown Mall", "National & continental firsts", "First Supercharger in the Philippines (Dec 2024)."),
    ("Riyadh, Saudi Arabia", "National & continental firsts", "First Supercharger in Saudi Arabia (Apr 2025)."),
    ("Mumbai, India - One BKC", "National & continental firsts", "First Supercharger in India (Aug 2025), at One BKC in Mumbai."),
    ("Bogotá, Colombia", "National & continental firsts", "First Supercharger in Colombia (May 2026)."),
]

CATEGORY_ORDER = [
    "Origins",
    "Technology firsts",
    "Flagship mega-sites",
    "Geographic extremes",
    "Landmarks & destinations",
    "National & continental firsts",
]


def main():
    if not os.path.exists(SRC):
        sys.exit(f"missing {SRC} - download it first (see module docstring)")
    sites = json.load(open(SRC))
    by_name = {}
    for s in sites:
        by_name.setdefault(s["name"], s)

    records, missing, index = [], [], {}
    for name, category, why in CURATED:
        s = by_name.get(name)
        if s is None:
            missing.append(name)
            continue
        if name in index:
            # A site can qualify under more than one heading; keep one row and
            # fold the extra rationale into it rather than listing it twice.
            index[name]["why"] += f" Also: {why[0].lower()}{why[1:]}"
            index[name]["also_category"] = category
            continue
        a = s["address"]
        rec = {
            "name": name,
            "category": category,
            "group": GROUP_OF[category],
            "why": why,
            "city": a.get("city"),
            "state": a.get("state"),
            "country": a.get("country"),
            "address": a.get("street"),
            "latitude": round(s["gps"]["latitude"], 6),
            "longitude": round(s["gps"]["longitude"], 6),
            "stalls": s.get("stallCount"),
            "power_kw": s.get("powerKilowatt"),
            "elevation_m": s.get("elevationMeters"),
            "opened": s.get("dateOpened"),
            "status": s.get("status"),
            "solar_canopy": s.get("solarCanopy"),
            "battery_storage": s.get("battery"),
            "open_to_other_evs": s.get("otherEVs"),
            "supercharge_info_id": s.get("id"),
            "tesla_location_id": s.get("locationId"),
        }
        index[name] = rec
        records.append(rec)

    if missing:
        print("WARNING - names not found in source data:", *missing, sep="\n  ")

    records.sort(key=lambda r: (CATEGORY_ORDER.index(r["category"]), r["name"]))

    payload = {
        "title": "Iconic Tesla Superchargers",
        "snapshot_date": SNAPSHOT,
        "count": len(records),
        "coordinate_datum": "WGS84 (decimal degrees)",
        "source_data": "https://supercharge.info/service/supercharge/allSites",
        "notes": (
            "Coordinates, stall counts, elevation and opening dates are from the "
            "supercharge.info community database. 'opened' is that database's first-listed "
            "date and can differ from a site's public launch announcement; where the two "
            "differ, the curated note gives the historically reported date."
        ),
        "sites": records,
    }

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    lines = [
        "# Iconic Tesla Superchargers",
        "",
        f"A curated register of **{len(records)}** Supercharger sites that matter — network firsts, "
        "engineering flagships, geographic extremes and landmark destinations — each with WGS84 coordinates.",
        "",
        f"- **Snapshot:** {SNAPSHOT}",
        "- **Coordinates / stalls / elevation / dates:** [supercharge.info](https://supercharge.info) "
        "(`/service/supercharge/allSites`), the most complete public register of Supercharger sites.",
        "- **Curation and history notes:** Tesla announcements and contemporaneous press coverage "
        "(see Sources at the bottom).",
        "- Machine-readable version: [`data/iconic-superchargers.json`](data/iconic-superchargers.json)",
        "",
        "> Dates below are the supercharge.info first-listed date. Where a site's public launch was "
        "announced on a different day (notably the original six, launched 24 Sep 2012), the note says so.",
        "",
    ]
    for cat in CATEGORY_ORDER:
        rows = [r for r in records if r["category"] == cat]
        if not rows:
            continue
        lines.append(f"## {cat}")
        lines.append("")
        lines.append("| Site | Location | Lat | Lon | Stalls | Opened | Why it's iconic |")
        lines.append("|---|---|---:|---:|---:|---|---|")
        for r in rows:
            loc = ", ".join(x for x in [r["city"], r["state"], r["country"]] if x)
            stalls = r["stalls"] if r["stalls"] else "—"
            opened = r["opened"] or "—"
            why = r["why"].replace("|", "\\|")
            lines.append(
                f"| **{r['name']}** | {loc} | `{r['latitude']:.5f}` | `{r['longitude']:.5f}` "
                f"| {stalls} | {opened} | {why} |"
            )
        lines.append("")

    lines += [
        "## Sources",
        "",
        "Coordinates and site metadata:",
        "",
        "- [supercharge.info](https://supercharge.info) — community Supercharger register "
        "(`https://supercharge.info/service/supercharge/allSites`)",
        "- [Tesla — Find Us](https://www.tesla.com/findus/list/superchargers)",
        "",
        "History and context:",
        "",
        "- [Tesla — Supercharger launch press release (Sep 2012)]"
        "(https://ir.tesla.com/press-release/tesla-motors-launches-revolutionary-supercharger-enabling)",
        "- [Wikipedia — Tesla Supercharger](https://en.wikipedia.org/wiki/Tesla_Supercharger)",
        "- [Wikipedia — Tesla Diner](https://en.wikipedia.org/wiki/Tesla_Diner)",
        "- [Electrek — Oasis Supercharger launches with solar farm and off-grid batteries]"
        "(https://electrek.co/2025/07/03/tesla-launches-oasis-supercharger-with-solar-farm-off-grid-batteries/)",
        "- [InsideEVs — The world's largest Tesla Supercharger station is entirely off-grid]"
        "(https://insideevs.com/news/764997/worlds-largest-tesla-supercharger-project-oasis/)",
        "- [Teslarati — Tesla finishes its biggest Supercharger ever with 168 stalls]"
        "(https://www.teslarati.com/tesla-finishes-its-biggest-supercharger-ever-168-stalls/)",
        "- [ABC News — Inside Tesla's new Hollywood diner]"
        "(https://abcnews.go.com/Business/inside-teslas-new-hollywood-diner-roller-skating-servers/story?id=123924740)",
        "- [TeslaNorth — World's largest Supercharger complete, 98 stalls at Harris Ranch]"
        "(https://teslanorth.com/2023/01/15/worlds-largest-tesla-supercharger-complete-98-total-stalls-at-harris-ranch/)",
        "- [CNBC — Tesla opens its first two 'city center' Supercharger stations]"
        "(https://www.cnbc.com/2017/09/11/tesla-opens-its-first-two-city-center-supercharger-stations-in-chicago-and-boston.html)",
        "- [Teslarati — Mega Superchargers with lounge, food services, kids' area]"
        "(https://www.teslarati.com/tesla-mega-supercharger-lounge-food-kids-area-kettleman-baker-ca/)",
        "- [electrive — Tesla opens the world's first V4 Supercharger in the Netherlands]"
        "(https://www.electrive.com/2023/03/16/tesla-opens-the-worlds-first-v4-supercharger-in-the-netherlands/)",
        "- [TechCrunch — Tesla opens its Supercharger network to other EVs for the first time]"
        "(https://techcrunch.com/2021/11/01/tesla-is-opening-its-supercharger-network-to-other-evs-for-the-first-time/)",
        "- [InsideEVs — How Tesla's Magic Dock rollout is going]"
        "(https://insideevs.com/news/657335/tesla-magic-dock-rollout-march-2023/)",
        "- [Green Car Reports — Tesla rolls out first entire V3 station in Las Vegas]"
        "(https://www.greencarreports.com/news/1124114_superchargers-at-the-strip-tesla-rolls-out-first-entire-v3-station-in-las-vegas)",
        "- [Benzinga — 'Extreme' Supercharger locations, roof of the world]"
        "(https://www.benzinga.com/news/22/12/29951806/drive-your-tesla-to-the-roof-of-the-world-here-are-some-extreme-supercharger-locations)",
        "- [InsideEVs — Supercharger site featuring bk World cube lounges]"
        "(https://insideevs.com/news/601195/check-out-this-cool-tesla-supercharger-site-featuring-cube-lounges/)",
        "",
    ]

    with open(OUT_MD, "w") as f:
        f.write("\n".join(lines))

    # A plain .js assignment rather than a .json fetch, so the map also works
    # when index.html is opened straight off disk (file:// blocks fetch).
    os.makedirs(os.path.dirname(OUT_JS), exist_ok=True)
    with open(OUT_JS, "w") as f:
        f.write("// Generated by scripts/build_iconic.py — do not edit by hand.\n")
        f.write("window.ICONIC = ")
        json.dump(payload, f, indent=1, ensure_ascii=False)
        f.write(";\n")

    print(f"wrote {OUT_JSON}, {OUT_MD} and {OUT_JS} ({len(records)} sites)")
    for cat in CATEGORY_ORDER:
        print(f"  {cat}: {sum(1 for r in records if r['category'] == cat)}")


if __name__ == "__main__":
    main()
