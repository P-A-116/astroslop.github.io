import {
  PLANET_LIST,
  SIGN_LORDS,
  NAKSHATRA_LIST,
  type NakshatraName,
  NAKSHATRA_LORDS,
  NAVAMSA_START_SIGNS,
  COMBUSTION_LIMITS,
  RULERSHIPS,
  FUNCTIONAL_ROLES,
  NATURAL_RELATIONSHIPS,
  SHASHTIAMSA_DATA,
} from './constants';
import { computeUpagrahas, formatUpagrahas } from './upagrahas';
export {
  computeUpagrahas,
  formatLongitudeSignDegreesMinutes,
  formatUpagrahas,
  normalizeLongitude,
  verifyUpagrahas,
} from './upagrahas';
import { julianDay, computeAllPositions } from './astronomy';
import type {
  PlanetName,
  PlanetPosition,
  PlanetData,
  ChartData,
  KarakaName,
  DMS,
  NakshatraPada,
  RelationshipType,
  CompoundRelationship,
  MotionType,
  FunctionalRole,
  BuildChartParams,
  DivisionalChart,
  ShashtiamsaInfo,
  DivisionalPlacement,
} from './types';

export interface DivisionalMeta {
  chart: DivisionalChart;
  label: string;
  divisor: number;
  calc: (sign: number, deg: number) => number;
}

interface BuildChartFromLocalParams {
  date: string;
  time: string;
  tzOffsetHours: number;
  lat: number;
  lon: number;
}

const KARAKA_NAMES = [
  'Atmakaraka',
  'Amatyakaraka',
  'Bhratrikaraka',
  'Matrikaraka',
  'Putrakaraka',
  'Gnatikaraka',
  'Darakaraka',
] as const;

const KARAKA_PLANETS = PLANET_LIST.filter(
  (planet) => planet !== 'Rahu' && planet !== 'Ketu',
);

const MODALITY_STARTS = {
  d16: [1, 5, 9],
  d20: [1, 9, 5],
  d45: [1, 5, 9],
} as const;

const ELEMENT_STARTS = [1, 4, 7, 10] as const;
const D3_OFFSETS = [0, 4, 8] as const;
const D30_ODD = [[5, 1], [10, 11], [18, 9], [25, 3], [30, 7]] as const;
const D30_EVEN = [[5, 2], [12, 6], [20, 12], [25, 10], [30, 8]] as const;
const D3_DEITIES = ['Narada', 'Agasthya', 'Doorvasa'] as const;
const D4_DEITIES = ['Sanaka', 'Sananda', 'Kumara', 'Sanatan'] as const;
const D7_DEITIES = ['Kshaara', 'Ksheera', 'Dadhi', 'Gritha', 'Iksu Rasa', 'Madhya', 'Suddha Jala'] as const;
const D9_DEITY_ORDERS = {
  movable: ['Deva', 'Manushya', 'Rakshasa'],
  fixed: ['Manushya', 'Rakshasa', 'Deva'],
  dual: ['Rakshasa', 'Manushya', 'Deva'],
} as const;
const D10_DEITIES = ['Indra', 'Agni', 'Yama', 'Rakshasa', 'Varuna', 'Vayu', 'Kubera', 'Isana', 'Brahma', 'Anantha'] as const;
const D12_DEITIES = ['Ganesa', 'Aswini Kumara', 'Yama', 'Sarpa'] as const;
const D16_DEITIES = ['Brahma', 'Vishnu', 'Siva', 'Sun'] as const;
const D20_ODD_DEITIES = [
  'Kaali', 'Gauri', 'Jaya', 'Lakshmi', 'Vijaya', 'Vimala', 'Sati', 'Tara',
  'Jvala-Mukhi', 'Sveta', 'Lalita', 'Bagala-mukhi', 'Pratyangira', 'Sachi',
  'Raudri', 'Bhavani', 'Varada', 'Jaya', 'Tripura', 'Sumukhi',
] as const;
const D20_EVEN_DEITIES = [
  'Daya', 'Megha', 'Chinnasi', 'Pisachini', 'Dhoomavathi', 'Matangi', 'Bala',
  'Bhadra', 'Aruna', 'Anala', 'Pingala', 'Chuchchuka', 'Ghora', 'Vaarahi',
  'Vaishnavi', 'Sita', 'Bhuvanesvari', 'Bhairavi', 'Mangala', 'Aparajita',
] as const;
const D24_DEITIES = ['Skanda', 'Parsudhara', 'Anala', 'Viswakarma', 'Bhaga', 'Mitra', 'Maya', 'Antaka', 'Vrisha-dhwaja', 'Govinda', 'Madana', 'Bhima'] as const;
const D27_DEITIES = [
  'Dastra (Aswini Kumara)', 'Yama', 'Agni', 'Brahma', 'Chandra', 'Isa', 'Aditi',
  'Jiva', 'Ahi', 'Pitara', 'Bhaga', 'Aryama', 'Surya', 'Tvashta', 'Marut',
  'Sakragni', 'Mitra', 'Vasava', 'Rakshasa', 'Varina', 'Visvadeva', 'Govinda',
  'Vasu', 'Varuna', 'Ajapa', 'Ahirbudhanya', 'Pusha',
] as const;
const D30_DEITIES = ['Agni', 'Vayu', 'Indra', 'Kubera', 'Varuna'] as const;
const D40_DEITIES = ['Vishnu', 'Chandra', 'Marichi', 'Tvashta', 'Dhata', 'Siva', 'Ravi', 'Yama', 'Yaksha', 'Gandharva', 'Kala', 'Varuna'] as const;
const D45_DEITY_ORDERS = {
  movable: ['Brahma', 'Siva', 'Vishnu'],
  fixed: ['Siva', 'Vishnu', 'Brahma'],
  dual: ['Vishnu', 'Brahma', 'Siva'],
} as const;

const partIndex = (deg: number, parts: number) => Math.floor(deg / (30 / parts));
const advanceSign = (sign: number, offset: number) => ((sign - 1 + offset) % 12) + 1;
const isOddSign = (sign: number) => sign % 2 === 1;
const startByModality = (sign: number, starts: readonly number[]) => starts[(sign - 1) % 3];
const startByElement = (sign: number) => ELEMENT_STARTS[(sign - 1) % 4];
const signModality = (sign: number) => ['movable', 'fixed', 'dual'][(sign - 1) % 3] as 'movable' | 'fixed' | 'dual';
const segmentSign = (deg: number, segments: readonly (readonly [number, number])[]) => {
  const found = segments.find(([limit]) => deg < limit);
  return found ? found[1] : segments[segments.length - 1][1];
};
const normalizeDegreeInSign = (longitude: number) => ((longitude % 30) + 30) % 30;
const boundedPartIndex = (longitude: number, parts: number) => {
  const degree = normalizeDegreeInSign(longitude);
  return Math.min(parts - 1, Math.floor(degree / (30 / parts)));
};
const assertIndexInRange = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 1 || value > 12) {
    throw new RangeError(`${label} must be an integer from 1 to 12.`);
  }
};
const pickFromParts = (deities: readonly string[], longitude: number, parts = deities.length) =>
  deities[boundedPartIndex(longitude, parts)];
const pickFromReversedParts = (deities: readonly string[], longitude: number, parts = deities.length) =>
  deities[deities.length - 1 - boundedPartIndex(longitude, parts)];

function toPlanetMap<T>(planets: PlanetData[], getValue: (planet: PlanetData) => T): Record<PlanetName, T> {
  const result = {} as Record<PlanetName, T>;
  for (const planet of planets) result[planet.name] = getValue(planet);
  return result;
}

function rankKarakas(entries: { planet: PlanetName; value: number }[]) {
  return entries
    .sort((a, b) => b.value - a.value)
    .reduce((result, entry, index) => {
      if (index < KARAKA_NAMES.length) result[entry.planet] = KARAKA_NAMES[index];
      return result;
    }, {} as Partial<Record<PlanetName, KarakaName>>);
}

function rankKarakasFromLongitudes(getLongitude: (planet: PlanetName) => number) {
  return rankKarakas(KARAKA_PLANETS.map((planet) => ({
    planet,
    value: getLongitude(planet) % 30,
  })));
}

// ── Divisional sign calculators ──────────────────────────────────────

export function getNavamsaSign(sign: number, deg: number): number {
  return advanceSign(NAVAMSA_START_SIGNS[sign - 1], partIndex(deg, 9));
}
export function getD7Sign(sign: number, deg: number): number {
  return advanceSign(sign, partIndex(deg, 7) + (isOddSign(sign) ? 0 : 7));
}
export function getD2Sign(sign: number, deg: number): number {
  if (isOddSign(sign)) return deg < 15 ? 5 : 4;
  return deg < 15 ? 4 : 5;
}
export function getD3Sign(sign: number, deg: number): number {
  return advanceSign(sign, D3_OFFSETS[partIndex(deg, 3)]);
}
export function getD4Sign(sign: number, deg: number): number {
  return advanceSign(sign, partIndex(deg, 4) * 3);
}
export function getD10Sign(sign: number, deg: number): number {
  return advanceSign(sign, partIndex(deg, 10) + (isOddSign(sign) ? 0 : 8));
}
export function getD12Sign(sign: number, deg: number): number {
  return advanceSign(sign, partIndex(deg, 12));
}
export function getD16Sign(sign: number, deg: number): number {
  return advanceSign(startByModality(sign, MODALITY_STARTS.d16), partIndex(deg, 16));
}
export function getD20Sign(sign: number, deg: number): number {
  return advanceSign(startByModality(sign, MODALITY_STARTS.d20), partIndex(deg, 20));
}
export function getD24Sign(sign: number, deg: number): number {
  return advanceSign(isOddSign(sign) ? 5 : 4, partIndex(deg, 24));
}
export function getD27Sign(sign: number, deg: number): number {
  return advanceSign(startByElement(sign), partIndex(deg, 27));
}
export function getD30Sign(sign: number, deg: number): number {
  return segmentSign(deg, isOddSign(sign) ? D30_ODD : D30_EVEN);
}
export function getD40Sign(sign: number, deg: number): number {
  return advanceSign(isOddSign(sign) ? 1 : 7, partIndex(deg, 40));
}
export function getD45Sign(sign: number, deg: number): number {
  return advanceSign(startByModality(sign, MODALITY_STARTS.d45), partIndex(deg, 45));
}
export function getD60Sign(sign: number, deg: number): number {
  return advanceSign(sign, (Math.floor(deg * 2) % 12));
}

export function getD60Shashtiamsa(sign: number, deg: number): ShashtiamsaInfo {
  const index = Math.min(Math.floor(deg / 0.5), 59);
  const entry = isOddSign(sign) ? SHASHTIAMSA_DATA[index] : SHASHTIAMSA_DATA[59 - index];
  return { number: entry.number, name: entry.name, nature: entry.nature, description: entry.description };
}

export function getDivisionalDeity(
  varga: DivisionalChart,
  divSign: number,
  divLon: number,
  sourceSign = divSign,
  sourceDeg = normalizeDegreeInSign(divLon),
): string | null {
  switch (varga) {
    case 'D3': return pickFromParts(D3_DEITIES, divLon);
    case 'D4': return pickFromParts(D4_DEITIES, divLon);
    case 'D7': return isOddSign(divSign) ? pickFromParts(D7_DEITIES, divLon) : pickFromReversedParts(D7_DEITIES, divLon);
    case 'D9': return pickFromParts(D9_DEITY_ORDERS[signModality(divSign)], divLon);
    case 'D10': return isOddSign(divSign) ? pickFromParts(D10_DEITIES, divLon) : pickFromReversedParts(D10_DEITIES, divLon);
    case 'D12': return pickFromParts(D12_DEITIES, divLon);
    case 'D16': return isOddSign(divSign) ? pickFromParts(D16_DEITIES, divLon) : pickFromReversedParts(D16_DEITIES, divLon);
    case 'D20': return pickFromParts(isOddSign(sourceSign) ? D20_ODD_DEITIES : D20_EVEN_DEITIES, sourceDeg);
    case 'D24': return isOddSign(divSign) ? pickFromParts(D24_DEITIES, divLon) : pickFromReversedParts(D24_DEITIES, divLon);
    case 'D27': return isOddSign(divSign) ? pickFromParts(D27_DEITIES, divLon) : pickFromReversedParts(D27_DEITIES, divLon);
    case 'D30': return isOddSign(divSign) ? pickFromParts(D30_DEITIES, divLon) : pickFromReversedParts(D30_DEITIES, divLon);
    case 'D40': return pickFromParts(D40_DEITIES, divLon);
    case 'D45': return D45_DEITY_ORDERS[signModality(sourceSign)][boundedPartIndex(sourceDeg, 45) % 3];
    default: return null;
  }
}

// ── Divisional chart metadata ────────────────────────────────────────

export const DIVISIONAL_CHARTS: readonly DivisionalMeta[] = [
  { chart: 'D1', label: 'D1 (Rasi)', divisor: 1, calc: (sign) => sign },
  { chart: 'D2', label: 'D2 (Hora)', divisor: 2, calc: getD2Sign },
  { chart: 'D3', label: 'D3 (Drekkana)', divisor: 3, calc: getD3Sign },
  { chart: 'D4', label: 'D4 (Chaturthamsa)', divisor: 4, calc: getD4Sign },
  { chart: 'D7', label: 'D7 (Saptamsa)', divisor: 7, calc: getD7Sign },
  { chart: 'D9', label: 'D9 (Navamsa)', divisor: 9, calc: getNavamsaSign },
  { chart: 'D10', label: 'D10 (Dasamsa)', divisor: 10, calc: getD10Sign },
  { chart: 'D12', label: 'D12 (Dvadasamsa)', divisor: 12, calc: getD12Sign },
  { chart: 'D16', label: 'D16 (Shodasamsa)', divisor: 16, calc: getD16Sign },
  { chart: 'D20', label: 'D20 (Vimsamsa)', divisor: 20, calc: getD20Sign },
  { chart: 'D24', label: 'D24 (Siddhamsa)', divisor: 24, calc: getD24Sign },
  { chart: 'D27', label: 'D27 (Bhamsa)', divisor: 27, calc: getD27Sign },
  { chart: 'D30', label: 'D30 (Trimsamsa)', divisor: 30, calc: getD30Sign },
  { chart: 'D40', label: 'D40 (Khavedamsa)', divisor: 40, calc: getD40Sign },
  { chart: 'D45', label: 'D45 (Akshavedamsa)', divisor: 45, calc: getD45Sign },
  { chart: 'D60', label: 'D60 (Shashtiamsa)', divisor: 60, calc: getD60Sign },
];

const DIVISIONAL_META = Object.fromEntries(
  DIVISIONAL_CHARTS.map((meta) => [meta.chart, meta]),
) as Record<DivisionalChart, DivisionalMeta>;

// ── Core astrology functions ─────────────────────────────────────────

export function dms(degFloat: number): DMS {
  const absDeg = Math.abs(degFloat);
  const deg = Math.floor(absDeg);
  const minFloat = (absDeg - deg) * 60;
  const minute = Math.floor(minFloat);
  const sec = Math.round((minFloat - minute) * 60 * 100) / 100;
  return { deg, minute, sec };
}

export function formatDms(degFloat: number): string {
  const { deg, minute, sec } = dms(degFloat);
  return `${deg}\u00B0 ${minute}' ${sec}"`;
}

export function getNakshatraName(longitude: number): NakshatraName {
  const normalized = ((longitude % 360) + 360) % 360;
  return NAKSHATRA_LIST[Math.floor(normalized / (40 / 3))];
}

export function getNakshatraPada(longitude: number): NakshatraPada {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / (40 / 3));
  return {
    nakshatra: NAKSHATRA_LIST[index % 27],
    pada: Math.floor((normalized % (40 / 3)) / (10 / 3)) + 1,
  };
}

export function isCombust(
  planet: PlanetName,
  sunLon: number,
  planetLon: number,
  motion: MotionType,
): boolean {
  const entry = COMBUSTION_LIMITS[planet];
  if (!entry) return false;
  const dist = Math.abs(((planetLon - sunLon + 180) % 360) - 180);
  const limit = motion === 'Retrograde' ? entry.retro : entry.direct;
  return limit !== null && dist < limit;
}

export function getLordships(planet: PlanetName, ascSign: number): number[] {
  return (RULERSHIPS[planet] || [])
    .map((sign) => ((sign - ascSign + 12) % 12) + 1)
    .sort((a, b) => a - b);
}

export function getFunctionalRole(planet: PlanetName, ascSign: number): FunctionalRole {
  const roles = FUNCTIONAL_ROLES[ascSign];
  if (roles?.benefics.includes(planet)) return 'Benefic';
  if (roles?.malefics.includes(planet)) return 'Malefic';
  if (roles?.neutrals.includes(planet)) return 'Neutral';
  return 'Unknown';
}

export function houseToSign(house: number, ascSign: number): number {
  assertIndexInRange(house, 'House');
  assertIndexInRange(ascSign, 'Ascendant sign');
  return advanceSign(ascSign, house - 1);
}

export function signToHouse(sign: number, ascSign: number): number {
  return ((sign - ascSign + 12) % 12) + 1;
}

// ── Relationships & aspects ──────────────────────────────────────────

export function getTemporaryRelationship(fromSign: number, toSign: number): RelationshipType {
  const diff = ((toSign - fromSign + 12) % 12) + 1;
  return [2, 3, 4, 10, 11, 12].includes(diff) ? 'Friend' : 'Enemy';
}

export function getNaturalRelationship(a: PlanetName, b: PlanetName): RelationshipType {
  const rel = NATURAL_RELATIONSHIPS[a];
  if (rel.friends.includes(b)) return 'Friend';
  if (rel.enemies.includes(b)) return 'Enemy';
  return 'Neutral';
}

export function getCompoundRelationship(
  nat: RelationshipType,
  temp: RelationshipType,
): CompoundRelationship {
  if (nat === 'Friend' && temp === 'Friend') return 'Extreme Friendship';
  if (nat === 'Neutral' && temp === 'Friend') return 'Friendship';
  if (nat === 'Enemy' && temp === 'Enemy') return 'Extreme Enmity';
  if (nat === 'Neutral' && temp === 'Enemy') return 'Enmity';
  return 'Neutral';
}

// ── Karakas ──────────────────────────────────────────────────────────

export function getCharaKarakas(
  positions: Record<PlanetName, PlanetPosition>,
): Partial<Record<PlanetName, KarakaName>> {
  return rankKarakasFromLongitudes((planet) => positions[planet].lon);
}

export function getCharaKarakasFromLongitudes(
  lons: Record<PlanetName, number>,
): Partial<Record<PlanetName, KarakaName>> {
  return rankKarakasFromLongitudes((planet) => lons[planet]);
}

// ── Sphuta Drishti (aspects) ─────────────────────────────────────────

function defaultAspect(a: number): number | null {
  if (a < 30) return 0;
  if (a < 60) return (a - 30) / 2;
  if (a < 90) return a - 45;
  if (a < 120) return 30 + (120 - a) / 2;
  if (a < 150) return 150 - a;
  if (a < 300) return (300 - a) / 2;
  return 0;
}
function marsAspect(a: number): number | null {
  if (a < 30) return 0;
  if (a < 60) return null;
  if (a < 90) return a - 45;
  if (a < 120) return 45 + (a - 90) / 2;
  if (a < 150) return 2 * (150 - a);
  if (a < 180) return (300 - a) / 2;
  if (a < 210) return 60;
  if (a < 240) return 270 - a;
  if (a < 270) return 0;
  if (a < 300) return (300 - a) / 2;
  return 0;
}
function jupiterAspect(a: number): number | null {
  if (a < 30) return 0;
  if (a < 60) return (a - 30) / 2;
  if (a < 90) return null;
  if (a < 120) return 45 + (a - 90) / 2;
  if (a < 150) return 2 * (150 - a);
  if (a < 180) return null;
  if (a < 210) return null;
  if (a < 240) return 45 + (a - 210) / 2;
  if (a < 270) return 15 + 2 * (270 - a) / 3;
  if (a < 300) return null;
  return 0;
}
function saturnAspect(a: number): number | null {
  if (a < 30) return null;
  if (a < 60) return (a - 30) * 2;
  if (a < 90) return 45 + (90 - a) / 2;
  if (a < 120) return 30 + (120 - a) / 2;
  if (a < 150) return null;
  if (a < 300) return (300 - a) / 2;
  return 0;
}

const ASPECT_FN: Partial<Record<PlanetName, (a: number) => number | null>> = {
  Mars: marsAspect,
  Jupiter: jupiterAspect,
  Saturn: saturnAspect,
};

export function sphutaDrishti(
  asp: PlanetName,
  _aspected: PlanetName,
  aspLon: number,
  aspectedLon: number,
): number | null {
  const a = ((aspectedLon - aspLon) % 360 + 360) % 360;
  return (ASPECT_FN[asp] ?? defaultAspect)(a);
}

// ── Arudha Padas ─────────────────────────────────────────────────────

export function computeArudhaPada(houseIndex: number, houseLordSignIndex: number): number {
  assertIndexInRange(houseIndex, 'House sign');
  assertIndexInRange(houseLordSignIndex, 'House lord sign');
  const distance = ((houseLordSignIndex - houseIndex + 12) % 12) + 1;
  const pada = advanceSign(houseLordSignIndex, distance - 1);
  const seventhFromHouse = advanceSign(houseIndex, 6);
  if (pada === houseIndex) return advanceSign(houseIndex, 9);
  if (pada === seventhFromHouse) return advanceSign(houseIndex, 3);
  return pada;
}

export function computeGrahaArudhas(
  planetSign: number,
  planetName: string,
  signOwnerships: Record<string, number[] | undefined> = RULERSHIPS as Record<string, number[] | undefined>,
): number[] | null {
  if (!Number.isInteger(planetSign) || planetSign < 1 || planetSign > 12) return null;
  const ownedSigns = (signOwnerships[planetName] || []).filter(
    (sign): sign is number => Number.isInteger(sign) && sign >= 1 && sign <= 12,
  );
  if (ownedSigns.length === 0) return null;
  return ownedSigns.map((ownedSign) => {
    const distance = ((ownedSign - planetSign + 12) % 12) + 1;
    return ((ownedSign + distance - 2) % 12) + 1;
  });
}

export function getArudhaPada(data: ChartData, house: number, chart: DivisionalChart = 'D1'): number {
  const ascSign = getAscSignForChart(data, chart);
  const houseSign = houseToSign(house, ascSign);
  const divSigns = getDivisionalSigns(data.planetData, chart);
  return computeArudhaPada(houseSign, divSigns[SIGN_LORDS[houseSign - 1]]);
}

export function getArudhaPadas(data: ChartData, chart: DivisionalChart = 'D1'): number[] {
  const ascSign = getAscSignForChart(data, chart);
  const divSigns = getDivisionalSigns(data.planetData, chart);
  return Array.from({ length: 12 }, (_, i) => {
    const houseSign = houseToSign(i + 1, ascSign);
    return computeArudhaPada(houseSign, divSigns[SIGN_LORDS[houseSign - 1]]);
  });
}

export function getArudhasForAllCharts(data: ChartData): Record<DivisionalChart, number[]> {
  return Object.fromEntries(
    DIVISIONAL_CHARTS.map(({ chart }) => [chart, getArudhaPadas(data, chart)]),
  ) as Record<DivisionalChart, number[]>;
}

export function getArudhaLagna(data: ChartData, chart: DivisionalChart = 'D1'): number {
  return getArudhaPadas(data, chart)[0];
}

export function getGrahaArudhas(
  data: ChartData,
  chart: DivisionalChart = 'D1',
  signOwnerships: Record<string, number[] | undefined> = RULERSHIPS as Record<string, number[] | undefined>,
): Record<PlanetName, number[] | null> {
  const divSigns = getDivisionalSigns(data.planetData, chart);
  return PLANET_LIST.reduce((result, planet) => {
    result[planet] = computeGrahaArudhas(divSigns[planet], planet, signOwnerships);
    return result;
  }, {} as Record<PlanetName, number[] | null>);
}

// ── Chart building ───────────────────────────────────────────────────

function computeDivisionalPlacements(
  sign: number,
  deg: number,
  ascDivisional: Record<DivisionalChart, number>,
): Record<DivisionalChart, DivisionalPlacement> {
  const result = {} as Record<DivisionalChart, DivisionalPlacement>;
  for (const { chart, calc } of DIVISIONAL_CHARTS) {
    const divSign = calc(sign, deg);
    result[chart] = { sign: divSign, house: signToHouse(divSign, ascDivisional[chart]) };
  }
  return result;
}

function computeAscDivisional(ascSign: number, ascDeg: number): Record<DivisionalChart, number> {
  const result = {} as Record<DivisionalChart, number>;
  for (const { chart, calc } of DIVISIONAL_CHARTS) {
    result[chart] = calc(ascSign, ascDeg);
  }
  return result;
}

export function buildChartData({
  year, month, day, hour, lat, lon,
}: BuildChartParams): ChartData {
  const assertFiniteNumber = (value: number, label: string) => {
    if (!Number.isFinite(value)) throw new RangeError(`${label} must be a finite number.`);
  };
  assertFiniteNumber(year, 'Year');
  assertFiniteNumber(month, 'Month');
  assertFiniteNumber(day, 'Day');
  assertFiniteNumber(hour, 'Hour');
  assertFiniteNumber(lat, 'Latitude');
  assertFiniteNumber(lon, 'Longitude');
  if (!Number.isInteger(year)) throw new RangeError('Year must be an integer.');
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('Month must be an integer from 1 to 12.');
  if (!Number.isInteger(day) || day < 1 || day > 31) throw new RangeError('Day must be an integer from 1 to 31.');
  if (hour < 0 || hour >= 24) throw new RangeError('Hour must be in the range [0, 24).');
  if (lat < -90 || lat > 90) throw new RangeError('Latitude must be between -90 and 90.');
  if (lon < -180 || lon > 180) throw new RangeError('Longitude must be between -180 and 180.');
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (utcDate.getUTCFullYear() !== year || utcDate.getUTCMonth() !== month - 1 || utcDate.getUTCDate() !== day) {
    throw new RangeError('Day is out of range for the given month and year.');
  }

  const jd = julianDay(year, month, day, hour);
  const { positions, ayanamsa, ascSid, ascSign, ascDeg } = computeAllPositions(jd, lat, lon);
  const ascDivisional = computeAscDivisional(ascSign, ascDeg);
  const { nakshatra: ascNak, pada: ascPada } = getNakshatraPada(ascSid);
  const karakas = getCharaKarakas(positions);
  const sunLon = positions.Sun.lon;
  const upagrahas = computeUpagrahas(sunLon);
  const upagrahasFormatted = formatUpagrahas(upagrahas);
  const arudhaLagna = computeArudhaPada(ascSign, positions[SIGN_LORDS[ascSign - 1]].sign);

  const planetData: PlanetData[] = PLANET_LIST.map((name) => {
    const { lon: pLon, sign, deg, motion } = positions[name];
    const divisional = computeDivisionalPlacements(sign, deg, ascDivisional);
    const { nakshatra, pada } = getNakshatraPada(pLon);
    return {
      name, lon: pLon, sign, deg, motion, divisional,
      d60Shashtiamsa: getD60Shashtiamsa(sign, deg),
      lordships: getLordships(name, ascSign),
      role: getFunctionalRole(name, ascSign),
      combust: name !== 'Sun' && !!COMBUSTION_LIMITS[name] && isCombust(name, sunLon, pLon, motion),
      nakshatra, pada,
      nakLord: NAKSHATRA_LORDS[nakshatra],
      signLord: SIGN_LORDS[sign - 1],
      karaka: karakas[name] || null,
    };
  });

  return {
    jd, lat, lon, ayanamsa, ascSid, ascSign, ascDeg, arudhaLagna,
    ascDivisional, ascNak, ascPada, positions, planetData, karakas,
    upagrahas, upagrahasFormatted,
  };
}

export function buildChartDataFromLocalInput({
  date, time, tzOffsetHours, lat, lon,
}: BuildChartFromLocalParams): { data: ChartData; utcStr: string } {
  const [yearStr, monthStr, dayStr] = date.split('-');
  const [hourStr, minuteStr, secondStr = '0'] = time.split(':');
  const year = Number(yearStr), month = Number(monthStr), day = Number(dayStr);
  const hour = Number(hourStr), minute = Number(minuteStr), second = Number(secondStr);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) throw new RangeError('Date must be in YYYY-MM-DD format.');
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(second)) throw new RangeError('Time must be in HH:MM[:SS] format.');
  if (!Number.isFinite(tzOffsetHours)) throw new RangeError('Timezone offset must be a finite number.');
  if (tzOffsetHours < -12 || tzOffsetHours > 14) throw new RangeError('Timezone offset must be between -12 and +14 hours.');
  if (!Number.isInteger(year)) throw new RangeError('Year must be an integer.');
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('Month must be an integer from 1 to 12.');
  if (!Number.isInteger(day) || day < 1 || day > 31) throw new RangeError('Day must be an integer from 1 to 31.');
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new RangeError('Hour must be an integer from 0 to 23.');
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new RangeError('Minute must be an integer from 0 to 59.');
  if (!Number.isInteger(second) || second < 0 || second > 59) throw new RangeError('Second must be an integer from 0 to 59.');
  const localDate = new Date(Date.UTC(year, month - 1, day));
  if (localDate.getUTCFullYear() !== year || localDate.getUTCMonth() !== month - 1 || localDate.getUTCDate() !== day) {
    throw new RangeError('Day is out of range for the given month and year.');
  }

  const localAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const utcDate = new Date(localAsUtcMs - tzOffsetHours * 3600000);
  const utcYear = utcDate.getUTCFullYear(), utcMonth = utcDate.getUTCMonth() + 1, utcDay = utcDate.getUTCDate();
  const utcHour = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600;
  const utcStr = `${utcYear}-${String(utcMonth).padStart(2, '0')}-${String(utcDay).padStart(2, '0')} `
    + `${String(utcDate.getUTCHours()).padStart(2, '0')}:`
    + `${String(utcDate.getUTCMinutes()).padStart(2, '0')}:`
    + `${String(utcDate.getUTCSeconds()).padStart(2, '0')} UTC`;

  return { data: buildChartData({ year: utcYear, month: utcMonth, day: utcDay, hour: utcHour, lat, lon }), utcStr };
}

// ── Divisional chart accessors ───────────────────────────────────────

export function getAscSignForChart(data: ChartData, chart: DivisionalChart): number {
  return data.ascDivisional[chart];
}

export function getAscDivisionalLongitude(data: ChartData, chart: DivisionalChart): number {
  if (chart === 'D1') return data.ascSid;
  const { divisor } = DIVISIONAL_META[chart];
  const ascDivSign = data.ascDivisional[chart];
  const partSize = 30 / divisor;
  const degInPart = data.ascDeg % partSize;
  return ((ascDivSign - 1) * 30) + (degInPart * divisor);
}

export function getDivisionalSigns(
  planets: PlanetData[],
  chart: DivisionalChart,
): Record<PlanetName, number> {
  return toPlanetMap(planets, (planet) => planet.divisional[chart].sign);
}

export function getDivisionalCombustion(
  planets: PlanetData[],
  divisionalLongitudes: Record<PlanetName, number>,
): Record<PlanetName, boolean> {
  const sunLon = divisionalLongitudes.Sun;
  return toPlanetMap(
    planets,
    ({ name, motion }) =>
      name !== 'Sun' && !!COMBUSTION_LIMITS[name] && isCombust(name, sunLon, divisionalLongitudes[name], motion),
  );
}

export function getDivisionalLongitudes(
  planets: PlanetData[],
  chart: DivisionalChart,
): Record<PlanetName, number> {
  const { divisor } = DIVISIONAL_META[chart];
  if (chart === 'D1') return toPlanetMap(planets, ({ lon }) => lon);
  const partSize = 30 / divisor;
  return toPlanetMap(
    planets,
    (planet) => (planet.divisional[chart].sign - 1) * 30 + (planet.deg % partSize) * divisor,
  );
}
