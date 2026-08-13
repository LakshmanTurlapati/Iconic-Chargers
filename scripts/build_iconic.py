#!/usr/bin/env python3
"""Build the Tesla Iconic Charger badge dataset.

"Iconic Chargers" is a Tesla feature, not an editorial opinion: the Tesla app's
Charging Passport awards a collectable badge for charging at specific Supercharger
sites. This script pairs that badge list with real coordinates.

Per Tesla's own documentation a badge can cover MORE than one Supercharger:

    "Some Iconic Charger badges can be earned at multiple sites. For example,
     charging at any of the specified Supercharger sites along the Great Barrier
     Reef will earn you the corresponding badge."
    -- tesla.com/support/tesla-app/charging-badges

so the model here is badge -> [sites], never site -> badge.

The badge names come from the Tesla app (user-supplied, see SNAPSHOT). Coordinates,
stall counts, elevation and status come from the supercharge.info register.

Usage:
    curl -s https://supercharge.info/service/supercharge/allSites -o data/allSites.json
    python3 scripts/build_iconic.py
"""

import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "allSites.json")
OUT_JSON = os.path.join(ROOT, "data", "iconic-badges.json")
OUT_MD = os.path.join(ROOT, "ICONIC-CHARGERS.md")
OUT_JS = os.path.join(ROOT, "web", "sites.js")

SNAPSHOT = "2026-08-12"

# A site is live if you can actually charge there today. EXPANDING counts --
# Dombås is EXPANDING, and filtering on OPEN alone silently drops it.
LIVE_STATUS = {"OPEN", "EXPANDING"}

REGIONS = ["North America", "Europe", "Asia", "Oceania"]

# Tesla describes three reasons a site earns a badge: a flagship location, a site
# of special significance, or one near a famous destination. Which bucket a given
# badge falls in is this file's reading, not published Tesla data.
REASONS = {
    "flagship":     "Flagship Tesla site",
    "significance": "Special significance",
    "destination":  "Famous destination",
}

# confidence:
#   "exact"  - the badge name matches the Supercharger site name, or only one
#              live site exists at the landmark
#   "approx" - several candidates nearby; needs confirming in the Tesla app by
#              tapping the badge to reveal its site address
BADGES = [
    # ---------------------------------------------------------- North America
    dict(badge="Tesla Diner", region="North America", reason="flagship", confidence="exact",
         sites=["Los Angeles, CA - Tesla Diner"],
         why="Tesla's diner and drive-in on Santa Monica Blvd: 80 V4 stalls, a 24-hour "
             "restaurant and two 45-ft LED screens that pipe audio into your car."),
    dict(badge="Oasis", region="North America", reason="flagship", confidence="exact",
         sites=["Lost Hills, CA - Tesla Oasis"],
         why="The largest charging station on Earth - Tesla counts 168 stalls on 30 acres "
             "beside I-5, running fully off-grid on 11 MW of solar and 10 Megapacks."),
    dict(badge="Santa Monica", region="North America", reason="destination", confidence="approx",
         sites=["Santa Monica, CA - Santa Monica Place", "Santa Monica, CA"],
         why="Beside the Santa Monica Pier and its Ferris wheel, at the western end of Route 66.",
         note="Three Santa Monica sites sit within 3 km; the two closest to the pier are listed."),
    dict(badge="Golden Gate", region="North America", reason="destination", confidence="approx",
         sites=["San Francisco, CA - Letterman Drive"],
         why="In the Presidio, the closest Supercharger to the Golden Gate Bridge.",
         note="3.5 km from the bridge; Lombard St and Geary Blvd are the next nearest."),
    dict(badge="Yosemite", region="North America", reason="destination", confidence="exact",
         sites=["El Portal, CA"],
         why="On Highway 140 at the Arch Rock entrance - the only Supercharger within "
             "25 km of Yosemite Valley."),
    dict(badge="Death Valley", region="North America", reason="destination", confidence="approx",
         sites=["Beatty, NV"],
         why="The eastern gateway to Death Valley, on the road in over Daylight Pass.",
         note="No Supercharger exists inside the park - Furnace Creek is still unbuilt "
              "(status VOTING). Beatty is the nearest live site, 51 km out."),
    dict(badge="Joshua Tree", region="North America", reason="destination", confidence="approx",
         sites=["Twentynine Palms, CA"],
         why="At the north entrance to Joshua Tree National Park.",
         note="31 km from the park centroid; the closest site to a park entrance."),
    dict(badge="Grand Canyon", region="North America", reason="destination", confidence="exact",
         sites=["Tusayan, AZ"],
         why="Two miles from the Grand Canyon's South Rim entrance."),
    dict(badge="Bryce Canyon", region="North America", reason="destination", confidence="exact",
         sites=["Bryce Canyon City, UT"],
         why="At the gates of Bryce Canyon National Park and its hoodoo amphitheatres."),
    dict(badge="Arches", region="North America", reason="destination", confidence="approx",
         sites=["Moab, UT - N Main St", "Moab, UT"],
         why="In Moab, the base camp for Arches and Canyonlands National Parks.",
         note="Two Moab sites 1.5 km apart; both are listed."),
    dict(badge="Yellowstone", region="North America", reason="destination", confidence="exact",
         sites=["West Yellowstone, MT"],
         why="At Yellowstone's west entrance, the closest approach to Old Faithful."),
    dict(badge="Las Vegas Strip", region="North America", reason="destination", confidence="exact",
         sites=["Las Vegas, NV - High Roller at LINQ"],
         why="Under the High Roller observation wheel on the Strip - and the first "
             "all-V3 Supercharger station Tesla ever opened, in July 2019."),
    dict(badge="San Antonio River", region="North America", reason="destination", confidence="exact",
         sites=["San Antonio, TX - Broadway"],
         why="A kilometre from the San Antonio River Walk, the city's riverside promenade."),
    dict(badge="Miami Beach", region="North America", reason="destination", confidence="approx",
         sites=["Miami Beach, FL - Pennsylvania Ave", "Miami Beach, FL - West Avenue"],
         why="In South Beach, steps from the Art Deco district and the Atlantic.",
         note="Two Miami Beach sites 1.7 km apart; both are listed."),
    dict(badge="Niagara Falls", region="North America", reason="destination", confidence="approx",
         sites=["Niagara Falls, ON - Morrison St", "Niagara Falls, ON"],
         why="On the Canadian side, the vantage point for Horseshoe Falls.",
         note="No Supercharger exists on the US side of Niagara Falls."),
    dict(badge="Whistler", region="North America", reason="destination", confidence="approx",
         sites=["Whistler, BC - Lorimer Rd", "Whistler, BC"],
         why="In Whistler village, up the Sea-to-Sky Highway from Vancouver.",
         note="Two Whistler sites 0.5 km apart; both are listed."),
    dict(badge="Waikiki", region="North America", reason="destination", confidence="exact",
         sites=["Honolulu, HI"],
         why="300 m from Waikiki Beach on Oahu - the only Supercharger on the beachfront."),

    # ------------------------------------------------------------------ Europe
    dict(badge="Gigafactory Berlin", region="Europe", reason="flagship", confidence="exact",
         sites=["Gigafactory Berlin-Brandenburg, Germany"],
         why="At Tesla's European factory in Grünheide, where every European Model Y is built."),
    dict(badge="Harderwijk", region="Europe", reason="significance", confidence="exact",
         sites=["Harderwijk, Netherlands"],
         why="The world's first V4 Supercharger site, opened March 2023 - taller posts, "
             "longer cables, built for non-Tesla vehicles too."),
    dict(badge="Hilden", region="Europe", reason="flagship", confidence="exact",
         sites=["Hilden, Germany"],
         why="40 stalls wrapped around Bäckerei Schüren, an organic bakery that built one of "
             "Europe's busiest charging parks - timber-framed, with an on-site vertical farm."),
    dict(badge="Montélimar", region="Europe", reason="flagship", confidence="exact",
         sites=["Montélimar, France"],
         why="56 stalls on the A7 Autoroute du Soleil - Europe's original mega-site and its "
             "busiest station in the holiday getaway."),
    dict(badge="Dombås", region="Europe", reason="significance", confidence="exact",
         sites=["Dombås, Norway"],
         why="One of the six Norwegian sites that opened on 30 August 2013 - the first "
             "Superchargers built outside North America."),
    dict(badge="Honningsvåg", region="Europe", reason="significance", confidence="exact",
         sites=["Honningsvåg, Norway"],
         why="The northernmost Supercharger on Earth at 71.00°N, on the island of Magerøya "
             "on the road to the North Cape."),
    dict(badge="Østerbø", region="Europe", reason="destination", confidence="exact",
         sites=["Østerbø, Norway"],
         why="High on Aurlandsfjellet, the Norwegian mountain pass known as the Snow Road."),
    dict(badge="Stonehenge", region="Europe", reason="destination", confidence="exact",
         sites=["Amesbury, UK"],
         why="At Solstice Park in Amesbury, five kilometres from the stone circle."),
    dict(badge="Mont Saint-Michel", region="Europe", reason="destination", confidence="exact",
         sites=["Mont-Saint-Michel, France"],
         why="At the causeway to the tidal island abbey in Normandy."),
    dict(badge="Lake Garda", region="Europe", reason="destination", confidence="approx",
         sites=["Affi, Italy"],
         why="Near the southern shore of Lago di Garda, Italy's largest lake.",
         note="9 km from the lake; Castelnuovo del Garda is the next nearest."),
    dict(badge="Sevilla", region="Europe", reason="significance", confidence="exact",
         sites=["Sevilla, Spain"],
         why="The Supercharger for Andalusia's capital, gateway to southern Spain."),
    dict(badge="Gayrettepe", region="Europe", reason="significance", confidence="exact",
         sites=["Gayrettepe İstanbul, Türkiye"],
         why="Istanbul's flagship site, on the European side of the Bosphorus."),
    dict(badge="Lovosice", region="Europe", reason="significance", confidence="exact",
         sites=["Lovosice, Czech Republic"],
         why="On the D8 below the České středohoří hills, the Prague-Dresden corridor."),

    # -------------------------------------------------------------------- Asia
    dict(badge="Ein Bokek", region="Asia", reason="destination", confidence="exact",
         sites=["Ein Bokek, Israel"],
         why="The lowest Supercharger on Earth, 380 m below sea level on the Dead Sea shore."),
    dict(badge="Mount Fuji", region="Asia", reason="destination", confidence="approx",
         sites=["Gotemba, Japan"],
         why="On the Gotemba side of Mount Fuji, the classic approach to the mountain.",
         note="20 km from the summit; Fuji River is the next nearest at 24 km."),
    dict(badge="Enshu-Morimachi", region="Asia", reason="significance", confidence="exact",
         sites=["Enshū-Morimach, Japan"],
         why="On the Shin-Tomei Expressway in Shizuoka, a landmark site on Japan's main "
             "Tokyo-Nagoya artery."),
    dict(badge="Jeju", region="Asia", reason="destination", confidence="exact",
         sites=["Jeju, South Korea - Jeju Store"],
         why="On Jeju Island, the volcanic holiday island off South Korea's south coast."),
    dict(badge="Gangnam", region="Asia", reason="destination", confidence="approx",
         sites=["Seoul, South Korea - Bithumb Finance Tower"],
         why="In Gangnam, Seoul's business and nightlife district.",
         note="Four sites sit within 1.8 km of Gangnam station; the nearest is listed."),
    dict(badge="Taipei Xinyi", region="Asia", reason="destination", confidence="approx",
         sites=["Taipei, Taiwan - Exchange Square 2"],
         why="In Xinyi, the district around Taipei 101.",
         note="Three sites sit within 1.3 km of Taipei 101; the nearest is listed."),
    dict(badge="Victoria Harbour", region="Asia", reason="destination", confidence="approx",
         sites=["Tsim Sha Tsui, Hong Kong - Canton Road"],
         why="On the Tsim Sha Tsui waterfront, facing Hong Kong Island across Victoria Harbour.",
         note="Six sites ring the harbour within 2 km; the nearest to the waterfront is listed."),
    dict(badge="Fangshan", region="Asia", reason="significance", confidence="exact",
         sites=["Beijing, China - Fangshan Longhu Tianjie"],
         why="In Beijing's Fangshan district, south-west of the capital."),

    # ----------------------------------------------------------------- Oceania
    dict(badge="Dunedin", region="Oceania", reason="significance", confidence="exact",
         sites=["Dunedin, NZ"],
         why="The southernmost Supercharger on Earth at 45.89°S, closer to Antarctica "
             "than any other."),
    dict(badge="Great Barrier Reef", region="Oceania", reason="destination", confidence="approx",
         sites=["Mount Sheridan, QLD", "Tully, QLD", "Townsville, QLD", "Bowen, QLD",
                "Mackay, QLD", "Carmila, QLD", "Rockhampton, QLD", "Calliope, QLD",
                "Gin Gin, QLD"],
         why="The reef badge is earned anywhere along the Queensland coast it follows, from "
             "Cairns down to Bundaberg - the one badge Tesla names as covering multiple sites.",
         note="Tesla documents this badge as multi-site but does not publish which sites. "
              "Every live Supercharger on the Queensland coast inside the reef's latitude "
              "range is listed."),
]


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))


def main():
    if not os.path.exists(SRC):
        sys.exit(f"missing {SRC} - download it first (see module docstring)")
    raw = json.load(open(SRC))
    live = [s for s in raw if s.get("status") in LIVE_STATUS]
    by_name = {}
    for s in live:
        by_name.setdefault(s["name"], s)

    badges, sites, failures = [], [], []

    for b in BADGES:
        resolved = []
        for name in b["sites"]:
            s = by_name.get(name)
            if s is None:
                failures.append((b["badge"], name, raw))
                continue
            a = s["address"]
            rec = {
                "badge": b["badge"],
                "region": b["region"],
                "reason": b["reason"],
                "name": name,
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
                "supercharge_info_id": s.get("id"),
                "tesla_location_id": s.get("locationId"),
            }
            resolved.append(rec)
            sites.append(rec)

        if not resolved:
            continue

        badges.append({
            "badge": b["badge"],
            "region": b["region"],
            "reason": b["reason"],
            "confidence": b["confidence"],
            "why": b["why"],
            "note": b.get("note"),
            "site_count": len(resolved),
            "sites": [r["name"] for r in resolved],
            # Where a badge covers several sites, the centroid is what the map
            # flies to before fitting bounds around the whole group.
            "latitude": round(sum(r["latitude"] for r in resolved) / len(resolved), 6),
            "longitude": round(sum(r["longitude"] for r in resolved) / len(resolved), 6),
        })

    # Fail loudly. A badge silently resolving to nothing is exactly how the previous
    # dataset went wrong, so print the nearest live candidates and abort.
    if failures:
        print("BUILD FAILED - these badge sites did not resolve:\n", file=sys.stderr)
        for badge, name, allsites in failures:
            print(f"  {badge}: {name!r} not found among live sites", file=sys.stderr)
            token = name.split(",")[0].strip().lower()
            for s in allsites:
                if token and token in s["name"].lower():
                    print(f"      candidate: {s['name']!r} [{s.get('status')}]", file=sys.stderr)
        sys.exit(1)

    badges.sort(key=lambda x: (REGIONS.index(x["region"]), x["badge"]))

    payload = {
        "title": "Tesla Iconic Charger badges",
        "snapshot_date": SNAPSHOT,
        "badge_count": len(badges),
        "site_count": len(sites),
        "coordinate_datum": "WGS84 (decimal degrees)",
        "badge_source": f"Tesla app > Charging > Badges (user-supplied, as of {SNAPSHOT})",
        "site_source": "https://supercharge.info/service/supercharge/allSites",
        "notes": (
            "Iconic Chargers is a Tesla app feature: charging at one of these Superchargers "
            "earns a collectable badge. Tesla publishes the list only in-app, so the badge "
            f"names here were read from the app on {SNAPSHOT}. A badge can cover more than "
            "one Supercharger. Sites marked confidence 'approx' are this project's best match "
            "for the badge and are not confirmed against the app."
        ),
        "regions": REGIONS,
        "reasons": REASONS,
        "badges": badges,
        "sites": sites,
    }

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    os.makedirs(os.path.dirname(OUT_JS), exist_ok=True)
    with open(OUT_JS, "w") as f:
        f.write("// Generated by scripts/build_iconic.py - do not edit by hand.\n")
        f.write("window.ICONIC = ")
        json.dump(payload, f, indent=1, ensure_ascii=False)
        f.write(";\n")

    by_site = {}
    for s in sites:
        by_site.setdefault(s["badge"], []).append(s)

    lines = [
        "# Tesla Iconic Charger badges",
        "",
        f"Every Supercharger that awards an **Iconic Charger** badge in the Tesla app's Charging "
        f"Passport - **{len(badges)} badges** across **{len(sites)} sites**, with WGS84 coordinates.",
        "",
        f"- **Snapshot:** {SNAPSHOT}",
        "- **Badge names:** read from the Tesla app (`Charging` > `Badges`). Tesla does not "
        "publish this list on the web.",
        "- **Coordinates and site data:** [supercharge.info](https://supercharge.info)",
        "- Machine-readable: [`data/iconic-badges.json`](data/iconic-badges.json) - "
        "map: [`web/index.html`](web/index.html)",
        "",
        "> A badge can cover several Superchargers. Tesla's docs give the Great Barrier Reef as "
        "the example, and name no others, so multi-site coverage elsewhere may be understated here.",
        "",
        "> Rows marked **approx** are this project's best match for the badge, picked by proximity "
        "to the landmark. Tapping a badge in the Tesla app reveals its actual site address.",
        "",
    ]
    for region in REGIONS:
        rows = [b for b in badges if b["region"] == region]
        if not rows:
            continue
        lines.append(f"## {region} ({len(rows)})")
        lines.append("")
        lines.append("| Badge | Supercharger | Lat | Lon | Stalls | Why |")
        lines.append("|---|---|---:|---:|---:|---|")
        for b in rows:
            group = by_site[b["badge"]]
            why = b["why"].replace("|", "\\|")
            if b["confidence"] == "approx":
                why += " *(approx)*"
            if b.get("note"):
                why += f" — {b['note']}".replace("|", "\\|")
            for i, s in enumerate(group):
                badge_cell = f"**{b['badge']}**" if i == 0 else ""
                why_cell = why if i == 0 else ""
                loc = ", ".join(x for x in [s["name"], s["country"]] if x)
                lines.append(
                    f"| {badge_cell} | {loc} | `{s['latitude']:.5f}` | `{s['longitude']:.5f}` "
                    f"| {s['stalls'] or '—'} | {why_cell} |"
                )
        lines.append("")

    with open(OUT_MD, "w") as f:
        f.write("\n".join(lines))

    print(f"wrote {OUT_JSON}, {OUT_MD} and {OUT_JS}")
    print(f"  {len(badges)} badges / {len(sites)} sites")
    for region in REGIONS:
        n = sum(1 for b in badges if b["region"] == region)
        m = sum(b["site_count"] for b in badges if b["region"] == region)
        print(f"    {region:16} {n:3} badges  {m:3} sites")
    approx = [b["badge"] for b in badges if b["confidence"] == "approx"]
    print(f"  needs in-app confirmation ({len(approx)}): {', '.join(approx)}")


if __name__ == "__main__":
    main()
