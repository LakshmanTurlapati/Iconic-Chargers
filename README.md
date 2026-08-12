<div align="center">

# ⚡ Iconic Chargers

**A coordinate-accurate atlas of the 109 Tesla Superchargers that actually matter.**

Network firsts · engineering flagships · geographic extremes · landmark destinations
— each one researched, sourced, and plotted on a world map.

<br>

![Sites](https://img.shields.io/badge/sites-109-3987e5?style=for-the-badge)
![Countries](https://img.shields.io/badge/countries-38-d95926?style=for-the-badge)
![Stalls](https://img.shields.io/badge/stalls-2%2C149-199e70?style=for-the-badge)
![Build](https://img.shields.io/badge/build-none%20required-8a8a8a?style=for-the-badge)

<br>

![The map](docs/screenshot.png)

</div>

---

## Open it

```sh
git clone https://github.com/LakshmanTurlapati/Iconic-Chargers.git
cd Iconic-Chargers
open web/index.html          # macOS · or just double-click the file
```

That's the whole install. No `npm`, no bundler, no server. It's one HTML file plus a generated
data file; Leaflet and the basemap tiles come from a CDN, so all it needs is a network connection.

Prefer a server? `python3 -m http.server 8731` then visit
<http://127.0.0.1:8731/web/index.html>.

---

## The map

| | |
|---|---|
| 🎨 **Colour** | why the site is on the list — Firsts, Records, Destinations |
| ⭕ **Size** | stall count, by area — Lost Hills Oasis is unmistakable |
| 🔎 **Search** | name, city, country, or anything in the write-up |
| 🏷️ **Filter** | six category chips, scoping the map and the list together |
| 📋 **Sidebar** | doubles as the table view — nothing is hover-only |
| 🔗 **Deep links** | every site is addressable: <br> `web/index.html#Honningsv%C3%A5g,%20Norway` |

<div align="center">
<img src="docs/screenshot-detail.png" alt="A site popup, zoomed in on California" width="88%">
</div>

---

## Highlights

The extremes of the network, all of them in the dataset with coordinates:

| | Site | Coordinates | |
|---|---|---|---|
| 🥇 **Largest on Earth** | Lost Hills, CA — Tesla Oasis | `35.61739, -119.64121` | 168 stalls, fully off-grid on 11 MW of solar + 39 MWh of Megapacks |
| 🗻 **Highest** | Shigatse — Roof of the World Hotel | `28.63591, 87.17942` | ~4,337 m in Tingri, Tibet — the staging town for Everest Base Camp |
| 🧂 **Lowest** | Ein Bokek, Israel | `31.19908, 35.36432` | 380 m *below* sea level, on the Dead Sea |
| 🧭 **Northernmost** | Honningsvåg, Norway | `70.99966, 25.96709` | 71.00°N, on the road to the North Cape |
| 🐧 **Southernmost** | Dunedin, New Zealand | `-45.89465, 170.50799` | 45.89°S |
| 🏜️ **Most isolated** | Astana, Kazakhstan | `51.12413, 71.43133` | the nearest other Supercharger is ~970 km away |
| 🕰️ **The first one ever** | Hawthorne, CA | `33.92107, -118.33005` | at the Tesla Design Studio, one of the six revealed 24 Sep 2012 |
| 🍔 **The strangest** | Los Angeles — Tesla Diner | `34.09123, -118.34221` | 80 stalls, a 24-hour diner and two 45-ft drive-in screens |

---

## What's in the list

<table>
<tr><td>

| Category | Sites |
|---|--:|
| Origins | 11 |
| Technology firsts | 8 |
| Flagship mega-sites | 14 |
| Geographic extremes | 22 |
| Landmarks & destinations | 23 |
| National & continental firsts | 31 |
| **Total** | **109** |

</td><td>

Spanning **38 countries** and every continent Tesla operates on, from the
**24 Sep 2012** launch of the original six to the network's newest national
débuts — Mumbai, Riyadh, Bogotá.

Every entry carries lat/lon, stall count, power rating, elevation, first-listed
date, and a sourced note on *why* it earns a place.

</td></tr>
</table>

📖 **[Read the full list →](ICONIC-SUPERCHARGERS.md)**

---

## Files

| Path | What it is |
|---|---|
| [`web/index.html`](web/index.html) | The map. The entire app. |
| `web/sites.js` | Generated data for the map — don't hand-edit. |
| [`ICONIC-SUPERCHARGERS.md`](ICONIC-SUPERCHARGERS.md) | The full list, grouped, with sources. |
| [`data/iconic-superchargers.json`](data/iconic-superchargers.json) | Machine-readable, one object per site. |
| [`scripts/build_iconic.py`](scripts/build_iconic.py) | Generates all three, so they can't drift. Curation lives in the `CURATED` list at the top. |

### Regenerating

```sh
mkdir -p data
curl -s https://supercharge.info/service/supercharge/allSites -o data/allSites.json
python3 scripts/build_iconic.py
```

`data/allSites.json` is a ~6 MB upstream snapshot and is gitignored — fetch it before building.

---

## On the colours

The map draws all 109 points at once, so every colour pair is effectively adjacent and has to clear
the all-pairs contrast and colour-vision-deficiency gates. **Six categorical hues cannot** — verified
with a validator rather than by eye; the worst pair measured ΔE 1.6 under deuteranopia, which is to
say invisible. **Three can**, comfortably.

So the six curated categories fold into three colour groups on the map — **Firsts**, **Records**,
**Destinations** — and the finer category is carried by the filter chips, the sidebar and the popups
instead of by hue. Identity is never colour-alone, and every value on the map is also readable as
text in the sidebar.

---

## Data provenance

Coordinates, stall counts, elevations, power ratings and opening dates come from
**[supercharge.info](https://supercharge.info)**, the most complete public register of Supercharger
sites. Coordinates are **WGS84 decimal degrees**.

Spot-checked against OpenStreetMap nodes via the upstream `osmId` field: **agreement within 0–8 m**
on every site that had a matching OSM node.

Two caveats worth knowing:

> **Dates.** `opened` is supercharge.info's first-*listed* date, not always the public launch date.
> The original six California sites all read `2012-11-19` upstream but were announced on
> **24 September 2012**. Where the two differ, the curated note gives the historically reported date.

> **Stall counts.** These are current, not launch-day. Tesla markets the Lost Hills Oasis as
> **168 stalls**; upstream counts **164** as active. Both figures appear, each attributed.

<details>
<summary><b>Sources for the history and context</b></summary>

<br>

- [Tesla — Supercharger launch press release (Sep 2012)](https://ir.tesla.com/press-release/tesla-motors-launches-revolutionary-supercharger-enabling)
- [Wikipedia — Tesla Supercharger](https://en.wikipedia.org/wiki/Tesla_Supercharger) · [Tesla Diner](https://en.wikipedia.org/wiki/Tesla_Diner)
- [Electrek — Oasis Supercharger launches with solar farm and off-grid batteries](https://electrek.co/2025/07/03/tesla-launches-oasis-supercharger-with-solar-farm-off-grid-batteries/)
- [InsideEVs — The world's largest Tesla Supercharger station is entirely off-grid](https://insideevs.com/news/764997/worlds-largest-tesla-supercharger-project-oasis/)
- [Teslarati — Tesla finishes its biggest Supercharger ever with 168 stalls](https://www.teslarati.com/tesla-finishes-its-biggest-supercharger-ever-168-stalls/)
- [ABC News — Inside Tesla's new Hollywood diner](https://abcnews.go.com/Business/inside-teslas-new-hollywood-diner-roller-skating-servers/story?id=123924740)
- [TeslaNorth — World's largest Supercharger complete, 98 stalls at Harris Ranch](https://teslanorth.com/2023/01/15/worlds-largest-tesla-supercharger-complete-98-total-stalls-at-harris-ranch/)
- [CNBC — Tesla opens its first two 'city center' Supercharger stations](https://www.cnbc.com/2017/09/11/tesla-opens-its-first-two-city-center-supercharger-stations-in-chicago-and-boston.html)
- [Teslarati — Mega Superchargers with lounge, food services, kids' area](https://www.teslarati.com/tesla-mega-supercharger-lounge-food-kids-area-kettleman-baker-ca/)
- [electrive — Tesla opens the world's first V4 Supercharger in the Netherlands](https://www.electrive.com/2023/03/16/tesla-opens-the-worlds-first-v4-supercharger-in-the-netherlands/)
- [TechCrunch — Tesla opens its Supercharger network to other EVs for the first time](https://techcrunch.com/2021/11/01/tesla-is-opening-its-supercharger-network-to-other-evs-for-the-first-time/)
- [InsideEVs — How Tesla's Magic Dock rollout is going](https://insideevs.com/news/657335/tesla-magic-dock-rollout-march-2023/)
- [Green Car Reports — Tesla rolls out first entire V3 station in Las Vegas](https://www.greencarreports.com/news/1124114_superchargers-at-the-strip-tesla-rolls-out-first-entire-v3-station-in-las-vegas)
- [Benzinga — 'Extreme' Supercharger locations, roof of the world](https://www.benzinga.com/news/22/12/29951806/drive-your-tesla-to-the-roof-of-the-world-here-are-some-extreme-supercharger-locations)
- [InsideEVs — Supercharger site featuring bk World cube lounges](https://insideevs.com/news/601195/check-out-this-cool-tesla-supercharger-site-featuring-cube-lounges/)

</details>

---

<div align="center">
<sub>

Basemap © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, © [CARTO](https://carto.com/attributions) ·
Site data © [supercharge.info](https://supercharge.info) · Snapshot 2026-08-12

Not affiliated with, endorsed by, or sponsored by Tesla, Inc.

</sub>
</div>
