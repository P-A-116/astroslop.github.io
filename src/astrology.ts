// ============================================================
//  Vedic astrology logic functions
// ============================================================

import {
  PLANET_LIST,
  SIGN_LORDS,
  NAKSHATRA_LIST,
  NAKSHATRA_LORDS,
  NAVAMSA_START_SIGNS,
  COMBUSTION_LIMITS,
  RULERSHIPS,
  FUNCTIONAL_ROLES,
  NATURAL_RELATIONSHIPS,
  SHASHTIAMSA_DATA,
} from './constants';
import { julianDay, computeAllPositions } from './astronomy';
import type {
  PlanetName,
  PlanetPosition,
  PlanetData,
  ChartData,
  DMS,
  NakshatraPada,
  RelationshipType,
  CompoundRelationship,
  MotionType,
  FunctionalRole,
  BuildChartParams,
  DivisionalChart,
  ShashtiamsaInfo,
} from './types';

/** Degrees → { deg, minute, sec } */
export function dms(degFloat: number): DMS {
  const deg      = Math.floor(degFloat);
  const minFloat = (degFloat - deg) * 60;
  const minute   = Math.floor(minFloat);
  const sec      = Math.round((minFloat - minute) * 60 * 100) / 100;
  return { deg, minute, sec };
}

/** Format a degree value as D° M' S" */
export function formatDms(degFloat: number): string {
  const { deg, minute, sec } = dms(degFloat);
  return `${deg}° ${minute}' ${sec}"`;
}

/** Nakshatra name for a sidereal longitude 0–360 */
export function getNakshatraName(longitude: number): string {
  return NAKSHATRA_LIST[Math.floor((longitude % 360) / (40 / 3))];
}

/** Nakshatra + pada for a sidereal longitude 0–360 */
export function getNakshatraPada(longitude: number): NakshatraPada {
  const index = Math.floor(longitude / (40 / 3));
  const pada  = Math.floor((longitude % (40 / 3)) / (10 / 3)) + 1;
  return { nakshatra: NAKSHATRA_LIST[index % 27], pada };
}

/** Navamsa sign (1–12) for a planet at sign + in-sign degrees */
export function getNavamsaSign(sign: number, deg: number): number {
  const padaIndex = Math.floor(deg / (30 / 9));
  const startSign = NAVAMSA_START_SIGNS[sign - 1];
  return ((startSign + padaIndex - 1) % 12) + 1;
}

/** Saptamsa (D7) sign */
export function getD7Sign(sign: number, deg: number): number {
  const part  = Math.floor(deg / (30 / 7));
  const isOdd = sign % 2 === 1;
  return isOdd
    ? ((sign + part - 1) % 12) + 1
    : ((sign + part + 6) % 12) + 1;
}

/** D2 (Hora) sign (1–12) */
export function getD2Sign(sign: number, deg: number): number {
  const half = Math.floor(deg / 15);
  const isOdd = sign % 2 === 1;
  // Odd signs: 0→Leo(5), 1→Cancer(4); Even signs: 0→Cancer(4), 1→Leo(5)
  if (isOdd) return half === 0 ? 5 : 4;
  return half === 0 ? 4 : 5;
}

/** D3 (Drekkana) sign (1–12) */
export function getD3Sign(sign: number, deg: number): number {
  const part = Math.floor(deg / 10);
  const offsets = [0, 4, 8];
  return ((sign - 1 + offsets[part]) % 12) + 1;
}

/** D4 (Chaturthamsa) sign (1–12) */
export function getD4Sign(sign: number, deg: number): number {
  const part = Math.floor(deg / 7.5);
  const offsets = [0, 3, 6, 9];
  return ((sign - 1 + offsets[part]) % 12) + 1;
}

/** D10 (Dasamsa) sign (1–12) */
export function getD10Sign(sign: number, deg: number): number {
  const part = Math.floor(deg / 3);
  const isOdd = sign % 2 === 1;
  if (isOdd) return ((sign - 1 + part) % 12) + 1;
  return ((sign + 7 + part) % 12) + 1;
}

/** D12 (Dvadasamsa) sign (1–12) */
export function getD12Sign(sign: number, deg: number): number {
  const part = Math.floor(deg / 2.5);
  return ((sign - 1 + part) % 12) + 1;
}

/** D16 (Shodasamsa) sign (1–12) */
export function getD16Sign(sign: number, deg: number): number {
  const part = Math.floor(deg / (30 / 16));  // 0..15
  const modality = (sign - 1) % 3;
  let start: number;
  if (modality === 0) start = 1;       // Movable → Aries
  else if (modality === 1) start = 5;  // Fixed → Leo
  else start = 9;                       // Dual → Sagittarius
  return ((start - 1 + part) % 12) + 1;
}

/** D20 (Vimsamsa) sign (1–12) */
export function getD20Sign(sign: number, deg: number): number {
  const part = Math.floor(deg / (30 / 20));  // 0..19
  const modality = (sign - 1) % 3;
  let start: number;
  if (modality === 0) start = 1;       // Movable → Aries
  else if (modality === 1) start = 9;  // Fixed → Sagittarius
  else start = 5;                       // Dual → Leo
  return ((start - 1 + part) % 12) + 1;
}

/** D27 (Nakshatramsa / Bhamsa) sign (1–12) */
export function getD27Sign(sign: number, deg: number): number {
  const part = Math.floor(deg / (30 / 27));  // 0..26
  const element = (sign - 1) % 4;
  let start: number;
  if (element === 0) start = 1;        // Fire → Aries
  else if (element === 1) start = 4;   // Earth → Cancer
  else if (element === 2) start = 7;   // Air → Libra
  else start = 10;                      // Water → Capricorn
  return ((start - 1 + part) % 12) + 1;
}

/** D30 (Trimsamsa) sign (1–12) — unequal segments */
export function getD30Sign(sign: number, deg: number): number {
  if (sign % 2 === 1) {
    // Odd signs
    if (deg < 5) return 1;        // Aries
    if (deg < 10) return 11;      // Aquarius
    if (deg < 18) return 9;       // Sagittarius
    if (deg < 25) return 3;       // Gemini
    return 7;                      // Libra
  } else {
    // Even signs
    if (deg < 5) return 2;        // Taurus
    if (deg < 12) return 6;       // Virgo
    if (deg < 20) return 12;      // Pisces
    if (deg < 25) return 10;      // Capricorn
    return 8;                      // Scorpio
  }
}

/** D40 (Khavedamsa) sign (1–12) */
export function getD40Sign(sign: number, deg: number): number {
  const part = Math.floor(deg / (30 / 40));  // 0..39
  const start = sign % 2 === 1 ? 1 : 7;     // Odd→Aries, Even→Libra
  return ((start - 1 + part) % 12) + 1;
}

/** D45 (Akshavedamsa) sign (1–12) */
export function getD45Sign(sign: number, deg: number): number {
  const part = Math.floor(deg / (30 / 45)); // 0..44
  const modality = (sign - 1) % 3;
  let start: number;
  if (modality === 0) start = 1;       // Movable → Aries
  else if (modality === 1) start = 5;  // Fixed → Leo
  else start = 9;                       // Dual → Sagittarius
  return ((start - 1 + part) % 12) + 1;
}

/** D60 (Shashtiamsa) sign (1–12) */
export function getD60Sign(sign: number, deg: number): number {
  const doubled = deg * 2;
  const d = Math.floor(doubled);
  const r = d % 12;
  const shift = r + 1;
  return ((sign - 1 + shift) % 12) + 1;
}

/** D60 (Shashtiamsa) name/nature/description for a planet's rasi sign + in-sign degree */
export function getD60Shashtiamsa(sign: number, deg: number): ShashtiamsaInfo {
  const index = Math.floor(deg / 0.5);
  const clampedIndex = Math.min(index, 59);
  const isOdd = sign % 2 === 1;
  const entry = isOdd
    ? SHASHTIAMSA_DATA[clampedIndex]
    : SHASHTIAMSA_DATA[59 - clampedIndex];
  return { number: entry.number, name: entry.name, nature: entry.nature, description: entry.description };
}

/** Is a planet combust? */
export function isCombust(planet: PlanetName, sunLon: number, planetLon: number, motion: MotionType): boolean {
  if (!COMBUSTION_LIMITS[planet]) return false;
  const dist  = Math.abs(((planetLon - sunLon + 180) % 360) - 180);
  const entry = COMBUSTION_LIMITS[planet]!;
  const limit = motion === 'Retrograde' ? entry.retro : entry.direct;
  return limit !== null && dist < limit;
}

/** House numbers ruled by a planet given ascendant sign */
export function getLordships(planet: PlanetName, ascSign: number): number[] {
  const signs = RULERSHIPS[planet] || [];
  return signs.map(s => ((s - ascSign + 12) % 12) + 1).sort((a, b) => a - b);
}

/** Functional role of a planet for a given ascendant sign */
export function getFunctionalRole(planet: PlanetName, ascSign: number): FunctionalRole {
  const roles = FUNCTIONAL_ROLES[ascSign] || {};
  if ((roles.benefics  || []).includes(planet)) return 'Benefic';
  if ((roles.malefics  || []).includes(planet)) return 'Malefic';
  if ((roles.neutrals  || []).includes(planet)) return 'Neutral';
  return 'Unknown';
}

/** Whole-sign house number */
export function signToHouse(sign: number, ascSign: number): number {
  return ((sign - ascSign + 12) % 12) + 1;
}

/** Temporary (kala) relationship */
export function getTemporaryRelationship(fromSign: number, toSign: number): RelationshipType {
  const diff = ((toSign - fromSign) % 12 + 12) % 12;
  return [1, 2, 3, 9, 10, 11].includes(diff) ? 'Friend' : 'Enemy';
}

/** Natural (naisargika) relationship */
export function getNaturalRelationship(a: PlanetName, b: PlanetName): RelationshipType {
  const rel = NATURAL_RELATIONSHIPS[a];
  if (!rel) return 'Neutral';
  if (rel.friends.includes(b)) return 'Friend';
  if (rel.enemies.includes(b)) return 'Enemy';
  return 'Neutral';
}

/** Compound (panchadha maitri) relationship */
export function getCompoundRelationship(nat: RelationshipType, temp: RelationshipType): CompoundRelationship {
  if (nat === 'Friend'  && temp === 'Friend') return 'Extreme Friendship';
  if (nat === 'Neutral' && temp === 'Friend') return 'Friendship';
  if (nat === 'Enemy'   && temp === 'Enemy')  return 'Extreme Enmity';
  if (nat === 'Neutral' && temp === 'Enemy')  return 'Enmity';
  return 'Neutral';
}

/** Jaimini Chara Karakas (sorted by full sidereal longitude, highest = AK) */
export function getCharaKarakas(positions: Record<PlanetName, PlanetPosition>): Partial<Record<PlanetName, string>> {
  const candidates = PLANET_LIST
    .filter(p => p !== 'Rahu' && p !== 'Ketu')
    .map(p => ({ planet: p, lon: positions[p].lon }))
    .sort((a, b) => b.lon - a.lon);
  const names = ['Atmakaraka', 'Amatyakaraka', 'Bhratrikaraka',
                 'Matrikaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka'];
  const result: Partial<Record<PlanetName, string>> = {};
  candidates.forEach((c, i) => {
    if (i < names.length) result[c.planet] = names[i];
  });
  return result;
}

/**
 * Jaimini Chara Karakas computed from divisional longitudes.
 * Ranking is by degree within sign (lon % 30), descending — highest degree = AK.
 */
export function getCharaKarakasFromLongitudes(
  lons: Record<PlanetName, number>,
): Partial<Record<PlanetName, string>> {
  const candidates = PLANET_LIST
    .filter(p => p !== 'Rahu' && p !== 'Ketu')
    .map(p => ({ planet: p, degInSign: lons[p] % 30 }))
    .sort((a, b) => b.degInSign - a.degInSign);
  const names = ['Atmakaraka', 'Amatyakaraka', 'Bhratrikaraka',
                 'Matrikaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka'];
  const result: Partial<Record<PlanetName, string>> = {};
  candidates.forEach((c, i) => {
    if (i < names.length) result[c.planet] = names[i];
  });
  return result;
}

/**
 * Sphuta Drishti (aspect strength in virupas).
 * Returns a number or null ("-" in original).
 */
export function sphutaDrishti(asp: PlanetName, _aspected: PlanetName, aspLon: number, aspectedLon: number): number | null {
  const a = ((aspectedLon - aspLon) % 360 + 360) % 360;

  if (asp === 'Mars') {
    if (a >= 30  && a < 60)  return null;
    if (a >= 90  && a < 120) return 45 + (a - 90) / 2;
    if (a >= 120 && a < 180) return 2 * (150 - a);
    if (a >= 180 && a < 210) return 60;
    if (a >= 210 && a < 240) return 270 - a;
    if (a >= 240 && a < 270) return 0;
  }

  if (asp === 'Jupiter') {
    if (a >= 60  && a < 90)  return null;
    if (a >= 90  && a < 120) return 45 + (a - 90) / 2;
    if (a >= 120 && a < 150) return 2 * (150 - a);
    if (a >= 150 && a < 180) return null;
    if (a >= 180 && a < 210) return null;
    if (a >= 210 && a < 240) return 45 + (a - 210) / 2;
    if (a >= 240 && a < 270) return 15 + 2 * (270 - a) / 3;
    if (a >= 270 && a < 300) return null;
  }

  if (asp === 'Saturn') {
    if (a >= 0   && a < 30)  return null;
    if (a >= 30  && a < 60)  return (a - 30) * 2;
    if (a >= 60  && a < 90)  return 45 + (90 - a) / 2;
    if (a >= 120 && a < 150) return null;
    if (a >= 210 && a < 240) return null;
    if (a >= 240 && a < 270) return a - 210;
    if (a >= 270 && a < 300) return 2 * (300 - a);
  }

  // General formula
  if (a >= 0   && a < 30)  return 0;
  if (a >= 30  && a < 60)  return asp === 'Saturn' ? (a - 30) * 2      : (a - 30) / 2;
  if (a >= 60  && a < 90)  return asp === 'Saturn' ? 45 + (90 - a) / 2 : a - 45;
  if (a >= 90  && a < 120) return (asp === 'Mars' || asp === 'Jupiter') ? 45 + (a - 90) / 2   : 30 + (120 - a) / 2;
  if (a >= 120 && a < 150) return (asp === 'Mars' || asp === 'Jupiter') ? 2 * (150 - a)        : 150 - a;
  if (a >= 150 && a < 180) return (asp === 'Mars' || asp === 'Jupiter') ? 2 * (150 - a)        : (300 - a) / 2;
  if (a >= 180 && a < 210) return asp === 'Mars'   ? 60                  : (300 - a) / 2;
  if (a >= 210 && a < 240) {
    if (asp === 'Mars')    return 270 - a;
    if (asp === 'Jupiter') return 45 + (a - 210) / 2;
    return (300 - a) / 2;
  }
  if (a >= 240 && a < 270) {
    if (asp === 'Jupiter') return 15 + 2 * (270 - a) / 3;
    if (asp === 'Saturn')  return a - 210;
    return (300 - a) / 2;
  }
  if (a >= 270 && a < 300) return asp === 'Saturn' ? 2 * (300 - a) : (300 - a) / 2;
  if (a >= 300 && a < 330) return (300 - a) / 2;
  if (a >= 330 && a < 360) return 0;
  return 0;
}

/** Build the complete chart data object */
export function buildChartData({ year, month, day, hour, lat, lon }: BuildChartParams): ChartData {
  const jd         = julianDay(year, month, day, hour);
  const { positions, ayanamsa, ascSid, ascSign, ascDeg } =
        computeAllPositions(jd, lat, lon);

  const ascNavamsa = getNavamsaSign(ascSign, ascDeg);
  const ascD7      = getD7Sign(ascSign, ascDeg);
  const ascD2      = getD2Sign(ascSign, ascDeg);
  const ascD3      = getD3Sign(ascSign, ascDeg);
  const ascD4      = getD4Sign(ascSign, ascDeg);
  const ascD10     = getD10Sign(ascSign, ascDeg);
  const ascD12     = getD12Sign(ascSign, ascDeg);
  const ascD16     = getD16Sign(ascSign, ascDeg);
  const ascD20     = getD20Sign(ascSign, ascDeg);
  const ascD27     = getD27Sign(ascSign, ascDeg);
  const ascD30     = getD30Sign(ascSign, ascDeg);
  const ascD40     = getD40Sign(ascSign, ascDeg);
  const ascD45     = getD45Sign(ascSign, ascDeg);
  const ascD60     = getD60Sign(ascSign, ascDeg);
  const { nakshatra: ascNak, pada: ascPada } = getNakshatraPada(ascSid);
  const karakas    = getCharaKarakas(positions);

  const sunLon = positions['Sun'].lon;
  const planetData: PlanetData[] = PLANET_LIST.map(name => {
    const { lon: pLon, sign, deg, motion } = positions[name];
    const navamsaSign   = getNavamsaSign(sign, deg);
    const d7Sign        = getD7Sign(sign, deg);
    const navamsaHouse  = signToHouse(navamsaSign, ascNavamsa);
    const d7House       = signToHouse(d7Sign, ascD7);
    const d2Sign        = getD2Sign(sign, deg);
    const d3Sign        = getD3Sign(sign, deg);
    const d4Sign        = getD4Sign(sign, deg);
    const d10Sign       = getD10Sign(sign, deg);
    const d12Sign       = getD12Sign(sign, deg);
    const d16Sign       = getD16Sign(sign, deg);
    const d20Sign       = getD20Sign(sign, deg);
    const d27Sign       = getD27Sign(sign, deg);
    const d30Sign       = getD30Sign(sign, deg);
    const d40Sign       = getD40Sign(sign, deg);
    const d45Sign       = getD45Sign(sign, deg);
    const d60Sign       = getD60Sign(sign, deg);
    const d10House      = signToHouse(d10Sign, ascD10);
    const d12House      = signToHouse(d12Sign, ascD12);
    const d16House      = signToHouse(d16Sign, ascD16);
    const d20House      = signToHouse(d20Sign, ascD20);
    const d27House      = signToHouse(d27Sign, ascD27);
    const d30House      = signToHouse(d30Sign, ascD30);
    const d40House      = signToHouse(d40Sign, ascD40);
    const d45House      = signToHouse(d45Sign, ascD45);
    const d60House      = signToHouse(d60Sign, ascD60);
    const d60Shashtiamsa = getD60Shashtiamsa(sign, deg);
    const house         = signToHouse(sign, ascSign);
    const lordships     = getLordships(name, ascSign);
    const role          = getFunctionalRole(name, ascSign);
    const combust       = (name !== 'Sun' && COMBUSTION_LIMITS[name])
                          ? isCombust(name, sunLon, pLon, motion) : false;
    const { nakshatra, pada } = getNakshatraPada(pLon);
    const nakLord       = NAKSHATRA_LORDS[nakshatra] || '—';
    const signLord      = SIGN_LORDS[sign - 1];
    const karaka        = karakas[name] || null;

    return {
      name, lon: pLon, sign, deg, motion, house,
      navamsaSign, navamsaHouse, d7Sign, d7House,
      d2Sign, d3Sign, d4Sign, d10Sign, d10House, d12Sign, d12House, d16Sign, d16House, d20Sign, d20House, d27Sign, d27House, d30Sign, d30House, d40Sign, d40House, d45Sign, d45House, d60Sign, d60House,
      d60Shashtiamsa,
      lordships, role, combust, nakshatra, pada, nakLord, signLord, karaka,
    };
  });

  return {
    jd, lat, lon, ayanamsa,
    ascSid, ascSign, ascDeg, ascNavamsa, ascD7,
    ascD2, ascD3, ascD4, ascD10, ascD12, ascD16, ascD20, ascD27, ascD30, ascD40, ascD45, ascD60,
    ascNak, ascPada,
    positions, planetData,
    karakas,
  };
}

/** Returns the ascendant sign for the given divisional chart */
export function getAscSignForChart(data: ChartData, chart: DivisionalChart): number {
  switch (chart) {
    case 'D1':  return data.ascSign;
    case 'D2':  return data.ascD2;
    case 'D3':  return data.ascD3;
    case 'D4':  return data.ascD4;
    case 'D7':  return data.ascD7;
    case 'D9':  return data.ascNavamsa;
    case 'D10': return data.ascD10;
    case 'D12': return data.ascD12;
    case 'D16': return data.ascD16;
    case 'D20': return data.ascD20;
    case 'D27': return data.ascD27;
    case 'D30': return data.ascD30;
    case 'D40': return data.ascD40;
    case 'D45': return data.ascD45;
    case 'D60': return data.ascD60;
  }
}

/** Returns a map of planet → sign number for the given divisional chart */
export function getDivisionalSigns(
  planets: PlanetData[],
  chart: DivisionalChart,
): Record<PlanetName, number> {
  const result = {} as Record<PlanetName, number>;
  for (const p of planets) {
    switch (chart) {
      case 'D1':  result[p.name] = p.sign;         break;
      case 'D2':  result[p.name] = p.d2Sign;       break;
      case 'D3':  result[p.name] = p.d3Sign;       break;
      case 'D4':  result[p.name] = p.d4Sign;       break;
      case 'D7':  result[p.name] = p.d7Sign;       break;
      case 'D9':  result[p.name] = p.navamsaSign;  break;
      case 'D10': result[p.name] = p.d10Sign;      break;
      case 'D12': result[p.name] = p.d12Sign;      break;
      case 'D16': result[p.name] = p.d16Sign;      break;
      case 'D20': result[p.name] = p.d20Sign;      break;
      case 'D27': result[p.name] = p.d27Sign;      break;
      case 'D30': result[p.name] = p.d30Sign;      break;
      case 'D40': result[p.name] = p.d40Sign;      break;
      case 'D45': result[p.name] = p.d45Sign;      break;
      case 'D60': result[p.name] = p.d60Sign;      break;
    }
  }
  return result;
}

const DIVISOR: Record<DivisionalChart, number> = {
  D1: 1, D2: 2, D3: 3, D4: 4, D7: 7, D9: 9, D10: 10, D12: 12, D16: 16, D20: 20, D27: 27, D30: 30, D40: 40, D45: 45, D60: 60,
};

/**
 * Returns a map of planet → combust boolean for the given divisional chart,
 * using the divisional longitudes to compute angular distance from the Sun.
 */
export function getDivisionalCombustion(
  planets: PlanetData[],
  divisionalLongitudes: Record<PlanetName, number>,
): Record<PlanetName, boolean> {
  const sunLon = divisionalLongitudes['Sun' as PlanetName];
  const result = {} as Record<PlanetName, boolean>;
  for (const p of planets) {
    result[p.name] = (p.name !== 'Sun' && COMBUSTION_LIMITS[p.name])
      ? isCombust(p.name, sunLon, divisionalLongitudes[p.name], p.motion)
      : false;
  }
  return result;
}

/**
 * Returns a map of planet → effective ecliptic longitude for the given
 * divisional chart, suitable for Sphuta Drishti computation.
 * Within-sign degree is scaled to fill the full 30° of the divisional sign.
 */
export function getDivisionalLongitudes(
  planets: PlanetData[],
  chart: DivisionalChart,
): Record<PlanetName, number> {
  const signs = getDivisionalSigns(planets, chart);
  const result = {} as Record<PlanetName, number>;
  for (const p of planets) {
    if (chart === 'D1') {
      result[p.name] = p.lon;
    } else {
      const divisor    = DIVISOR[chart];
      const partSize   = 30 / divisor;
      const withinPart = p.deg % partSize;
      // Scale the within-part degree (0..partSize) to a full 0..30 range inside
      // the divisional sign, so angular separations reflect the correct positions.
      result[p.name] = (signs[p.name] - 1) * 30 + withinPart * divisor;
    }
  }
  return result;
}
