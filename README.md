# Jyotish Chart - Vedic Astrology Chart Maker

**[🔭 Live Demo](https://p-a-116.github.io/astroslop.github.io/)**

A client-side **Vedic (sidereal) astrology** chart generator built with
[SolidJS](https://www.solidjs.com/) + [TypeScript](https://www.typescriptlang.org/) +
[Vite](https://vitejs.dev/).
All planetary positions are computed **in the browser** using the
[`astronomia`](https://github.com/commenthol/astronomia) library — no backend or
external ephemeris service required.

---

## Features

| Area | Details |
|------|---------|
| **Planetary positions** | Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu - sidereal longitudes via VSOP87 / Meeus Chapter 47 (via `astronomia`) + Lahiri Ayanamsa |
| **Divisional charts** | D1 (Rasi) through D60 (Shashtiamsa) - 16 charts total |
| **Nakshatras and Padas** | 27 Nakshatras with pada and lord |
| **Relationships** | Natural, Temporary and Compound (Panchadha) relationship matrices |
| **Aspects** | Sphuta Drishti (aspect strengths in Virupas) for all planet pairs |
| **Karakas** | Chara Karaka ranking (Atmakaraka to Darakaraka) |
| **Combustion** | Automatic detection based on angular proximity to the Sun |
| **Functional roles** | Benefic / Malefic / Neutral classification per ascendant |
| **Yoga detection** | Parivartana Yoga analysis (Maha, Khala, Dainya) |
| **Visual chart** | South-Indian-style chart rendered via Solid components |
| **City lookup** | Geocoding via OpenStreetMap Nominatim (no API key needed) |

---

## Architecture

```
index.html
  |  mounts
  v
src/index.tsx              SolidJS render()
  |
  v
components/App.tsx         Root component (state + layout)
  |  uses
  +--> ChartForm.tsx           Date/time/location input
  +--> ChartSummary.tsx        Header summary panel
  +--> DivisionalChartTabs.tsx D1-D60 tab bar
  +--> VedicChartView.tsx      Visual South-Indian chart
  +--> PlanetCard.tsx          Individual planet detail card
  +--> PlanetMatrix.tsx        Planet grid helper
  +--> RelationshipTable.tsx   Compound relationship matrix
  +--> AspectTable.tsx         Sphuta Drishti matrix
  +--> AnalysisTab.tsx         Parivartana yoga + analysis
  |
  |  ChartForm calls buildChartData()
  v
src/astrology.ts           Chart-building logic + Vedic rules engine
  |  buildChartData() - orchestrator
  |  divisional sign calculators (D2, D3, D7, D9 ... D60)
  |  relationships, aspects, karakas, combustion, lordships
  |
  |  imports
  v
src/astronomy.ts           Positional astronomy (delegates to `astronomia` library)
  |  julianDay()              Gregorian → JD via astronomia/julian
  |  lahiriAyanamsa()         Linear approximation
  |  sunLongitude()           Wraps solar.apparentVSOP87() — full VSOP87 theory
  |  moonLongitude()          Wraps moonposition.position() — Meeus Ch. 47
  |  rahuTropical()           Mean lunar node formula
  |  planetSpeed()            Numerical daily motion
  |  computeAscendant()       GMST (IAU 1982) + VSOP87 obliquity
  |  computeAllPositions()    Orchestrator returning sidereal positions
  |
  |  reads
  v
src/constants.ts           Domain data tables
  |  PLANET_LIST, SIGN_NAMES, NAKSHATRA_*
  |  NATURAL_RELATIONSHIPS, COMBUSTION_LIMITS, FUNCTIONAL_ROLES
  |  SHASHTIAMSA_DATA, RULERSHIPS ...
  v
src/types.ts               TypeScript interfaces + type aliases
  |  PlanetName, ChartData, PlanetData, BuildChartParams ...
  v
src/analysis.ts            Yoga detection
     findParivartanaYogas()
```

### Data Flow

1. **User input** - `ChartForm` collects date, time, timezone, location.
2. **`buildChartData()`** - converts local time to UTC, then Julian Day, then
   `computeAllPositions()` (sidereal longitudes via **VSOP87 via the `astronomia`
   library** + Lahiri Ayanamsa).
3. **`ChartData`** object is produced containing positions, divisional signs,
   nakshatras, karakas, combustion flags, lordships, and functional roles.
4. **UI** reactively renders charts, tables, and analysis from the SolidJS signal.

---

## Project Structure

```
.
├── index.html                 Entry HTML
├── package.json               NPM config and scripts
├── tsconfig.json              TypeScript config (SolidJS JSX)
├── vite.config.ts             Vite + vite-plugin-solid
├── src/
│   ├── index.tsx              SolidJS mount point
│   ├── types.ts               TypeScript interfaces and type aliases
│   ├── constants.ts           Domain data tables (planets, signs, nakshatras)
│   ├── astronomy.ts           Positional astronomy (VSOP87 + Meeus via `astronomia`)
│   ├── astrology.ts           Chart-building logic and Vedic rules engine
│   ├── analysis.ts            Yoga detection (Parivartana)
│   ├── styles.css             Application styles
│   └── components/
│       ├── App.tsx             Root component - state and layout
│       ├── ChartForm.tsx       Date/time/location input form
│       ├── ChartSummary.tsx    Header summary panel
│       ├── DivisionalChartTabs.tsx  D1-D60 tab bar
│       ├── VedicChartView.tsx  Visual South-Indian chart
│       ├── PlanetCard.tsx      Individual planet detail card
│       ├── PlanetMatrix.tsx    Planet grid helper
│       ├── RelationshipTable.tsx  Compound relationship matrix
│       ├── AspectTable.tsx     Sphuta Drishti matrix
│       └── AnalysisTab.tsx     Parivartana yoga and analysis
├── tests/
│   ├── astronomy.test.ts      Unit tests for astronomy functions
│   └── astrology.test.ts      Unit tests for astrology functions
└── LICENSE
```

---

## Prerequisites

- **Node.js** >= 18
- **npm** (bundled with Node)

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (hot-reload)
npm run dev

# 3. Open http://localhost:5173/astroslop.github.io/ in your browser
```

### Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

### Run Tests

```bash
npm test           # single run
npx vitest         # watch mode
```

---

## Accuracy Notes

- **Sun**: apparent geocentric longitude via `solar.apparentVSOP87()` — full VSOP87 theory.
- **Moon**: geocentric longitude via `moonposition.position()` — Meeus Chapter 47 lunar theory.
- **Planets** (Mercury–Saturn): geocentric ecliptic longitude derived from VSOP87B heliocentric datasets via `planetposition.Planet`.
- **Ascendant**: computed using GMST from the IAU 1982 sidereal time formula (`sidereal.apparent()`) and VSOP87 mean obliquity (`nutation.meanObliquity()`).
- All of the above are provided by the [`astronomia`](https://github.com/commenthol/astronomia) library and are typically accurate to within arcseconds for modern dates.
- **Lahiri Ayanamsa** is approximated with a linear formula — sufficient for most practical purposes.
- **Rahu / Ketu** are computed from the mean lunar node.
- This tool is intended **for educational and reference use** — not as a replacement for professional astrological software.

---

## Tech Stack

| Package | Role |
|---------|------|
| [SolidJS](https://www.solidjs.com/) | Reactive UI framework |
| [Vite](https://vitejs.dev/) + [vite-plugin-solid](https://github.com/solidjs/vite-plugin-solid) | Build tooling |
| [`astronomia`](https://github.com/commenthol/astronomia) | VSOP87 planetary data, Julian Day conversion, sidereal time, nutation |
| [`vedic-astrology-chart-solid`](https://www.npmjs.com/package/vedic-astrology-chart-solid) | South-Indian chart SVG component |
| [Vitest](https://vitest.dev/) | Unit testing |

---

## Deployment

The site is automatically built and published to **GitHub Pages** on every push to
`main` via the `.github/workflows/deploy.yml` CI/CD workflow.
The workflow runs `tsc --noEmit`, `npm test`, and `npm run build` before deploying
the `dist/` folder.

Live URL: <https://p-a-116.github.io/astroslop.github.io/>

---

## License

MIT — see [LICENSE](LICENSE) for details.
