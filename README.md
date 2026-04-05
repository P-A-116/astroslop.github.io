# Jyotish Chart - Vedic Astrology Chart Maker

A client-side **Vedic (sidereal) astrology** chart generator built with
[SolidJS](https://www.solidjs.com/) + [TypeScript](https://www.typescriptlang.org/) +
[Vite](https://vitejs.dev/).
All planetary positions are computed **in the browser** - no backend or external
ephemeris service required.

---

## Features

| Area | Details |
|------|---------|
| **Planetary positions** | Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu - sidereal longitudes using Lahiri Ayanamsa |
| **Divisional charts** | D1 (Rasi) through D60 (Shashtiamsa) - 15 charts total |
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
src/astronomy.ts           Positional astronomy
  |  julianDay(), lahiriAyanamsa()
  |  kepler(), trueAnomaly()
  |  sunLongitude(), moonLongitude(), planetLongitude()
  |  computeAscendant(), computeAllPositions()
  |
  |  reads
  v
src/constants.ts           Domain data tables
  |  PLANET_LIST, SIGN_NAMES, ORBITAL_ELEMENTS, NAKSHATRA_*
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
   `computeAllPositions()` (sidereal longitudes via simplified orbital mechanics
   + Lahiri Ayanamsa).
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
│   ├── astronomy.ts           Positional astronomy (Julian Day, Kepler, longitudes)
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
npx vitest run     # single run
npx vitest         # watch mode
```

---

## Accuracy Notes

- Planetary longitudes use **simplified analytic orbital elements** (similar to
  Paul Schlyter's method). They are reasonably accurate for modern dates but
  may deviate from professional Swiss Ephemeris-based software by a fraction of
  a degree.
- **Lahiri Ayanamsa** is approximated with a linear formula - sufficient for
  most practical purposes.
- Rahu and Ketu are computed from the mean lunar node.
- This tool is intended **for educational and reference use** - not as a
  replacement for professional astrological software.

---

## License

MIT — see [LICENSE](LICENSE) for details.
