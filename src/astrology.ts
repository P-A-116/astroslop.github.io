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
import { computeKalaVelasDetailed } from './kalaVelas';
import { computeUpagrahas, formatUpagrahas } from './upagrahas';
export {
  computeAllUpagrahas,
} from './allUpagrahas';
export {
  computeKalaVelas,
  computeKalaVelasDetailed,
} from './kalaVelas';
export {
  computeUpagrahas,
  formatLongitudeSignDegreesMinutes,
  formatUpagrahas,
  normalizeLongitude,
  verifyUpagrahas,
} from './upagrahas';
import { julianDay, computeAllPositions, computeSunriseSunsetUtc } from './astronomy';
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

type PlanetSignKey =
  | 'sign'
  | 'd2Sign'
  | 'd3Sign'
  | 'd4Sign'
  | 'd7Sign'
  | 'navamsaSign'
  | 'd10Sign'
  | 'd12Sign'
  | 'd16Sign'
  | 'd20Sign'
  | 'd24Sign'
  | 'd27Sign'
  | 'd30Sign'
  | 'd40Sign'
  | 'd45Sign'
  | 'd60Sign';

type PlanetHouseKey =
  | 'house'
  | 'navamsaHouse'
  | 'd7House'
  | 'd10House'
  | 'd12House'
  | 'd16House'
  | 'd20House'
  | 'd24House'
  | 'd27House'
  | 'd30House'
  | 'd40House'
  | 'd45House'
  | 'd60House';

type AscKey =
  | 'ascSign'
  | 'ascD2'
  | 'ascD3'
  | 'ascD4'
  | 'ascD7'
  | 'ascNavamsa'
  | 'ascD10'
  | 'ascD12'
  | 'ascD16'
  | 'ascD20'
  | 'ascD24'
  | 'ascD27'
  | 'ascD30'
  | 'ascD40'
  | 'ascD45'
  | 'ascD60';

interface DivisionalMeta {
  chart: DivisionalChart;
  label: string;
  divisor: number;
  signKey: PlanetSignKey;
  ascKey: AscKey;
  calc: (sign: number, deg: number) => number;
  houseKey?: PlanetHouseKey;
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
  'Kaali',
  'Gauri',
  'Jaya',
  'Lakshmi',
  'Vijaya',
  'Vimala',
  'Sati',
  'Tara',
  'Jvala-Mukhi',
  'Sveta',
  'Lalita',
  'Bagala-mukhi',
  'Pratyangira',
  'Sachi',
  'Raudri',
  'Bhavani',
  'Varada',
  'Jaya',
  'Tripura',
  'Sumukhi',
] as const;
const D20_EVEN_DEITIES = [
  'Daya',
  'Megha',
  'Chinnasi',
  'Pisachini',
  'Dhoomavathi',
  'Matangi',
  'Bala',
  'Bhadra',
  'Aruna',
  'Anala',
  'Pingala',
  'Chuchchuka',
  'Ghora',
  'Vaarahi',
  'Vaishnavi',
  'Sita',
  'Bhuvanesvari',
  'Bhairavi',
  'Mangala',
  'Aparajita',
] as const;
const D24_DEITIES = ['Skanda', 'Parsudhara', 'Anala', 'Viswakarma', 'Bhaga', 'Mitra', 'Maya', 'Antaka', 'Vrisha-dhwaja', 'Govinda', 'Madana', 'Bhima'] as const;
const D27_DEITIES = [
  'Dastra (Aswini Kumara)',
  'Yama',
  'Agni',
  'Brahma',
  'Chandra',
  'Isa',
  'Aditi',
  'Jiva',
  'Ahi',
  'Pitara',
  'Bhaga',
  'Aryama',
  'Surya',
  'Tvashta',
  'Marut',
  'Sakragni',
  'Mitra',
  'Vasava',
  'Rakshasa',
  'Varina',
  'Visvadeva',
  'Govinda',
  'Vasu',
  'Varuna',
  'Ajapa',
  'Ahirbudhanya',
  'Pusha',
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

function toPlanetMap<T>(planets: PlanetData[], getValue: (planet: PlanetData) => T) {
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
    }, {} as Partial<Record<PlanetName, string>>);
}

function divisionalSignsFor(sign: number, deg: number) {
  const result = {} as Record<PlanetSignKey, number>;
  for (const { signKey, calc } of DIVISIONAL_CHARTS) result[signKey] = calc(sign, deg);
  return result;
}

function ascSignsFor(sign: number, deg: number) {
  const result = {} as Record<AscKey, number>;
  for (const { ascKey, calc } of DIVISIONAL_CHARTS) result[ascKey] = calc(sign, deg);
  return result;
}

function houseMapFor(
  signs: Record<PlanetSignKey, number>,
  ascSigns: Record<AscKey, number>,
) {
  const result = {} as Record<PlanetHouseKey, number>;
  for (const { signKey, ascKey, houseKey } of DIVISIONAL_CHARTS) {
    if (houseKey) result[houseKey] = signToHouse(signs[signKey], ascSigns[ascKey]);
  }
  return result;
}

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

export function getNakshatraName(longitude: number): string {
  return NAKSHATRA_LIST[Math.floor((longitude % 360) / (40 / 3))];
}

export function getNakshatraPada(longitude: number): NakshatraPada {
  const index = Math.floor(longitude / (40 / 3));
  return {
    nakshatra: NAKSHATRA_LIST[index % 27],
    pada: Math.floor((longitude % (40 / 3)) / (10 / 3)) + 1,
  };
}

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
  return {
    number: entry.number,
    name: entry.name,
    nature: entry.nature,
    description: entry.description,
  };
}

export function getDivisionalDeity(
  varga: DivisionalChart,
  divSign: number,
  divLon: number,
  sourceSign = divSign,
  sourceDeg = normalizeDegreeInSign(divLon),
): string | null {
  switch (varga) {
    case 'D3':
      return pickFromParts(D3_DEITIES, divLon);
    case 'D4':
      return pickFromParts(D4_DEITIES, divLon);
    case 'D7':
      return isOddSign(divSign)
        ? pickFromParts(D7_DEITIES, divLon)
        : pickFromReversedParts(D7_DEITIES, divLon);
    case 'D9':
      return pickFromParts(D9_DEITY_ORDERS[signModality(divSign)], divLon);
    case 'D10':
      return isOddSign(divSign)
        ? pickFromParts(D10_DEITIES, divLon)
        : pickFromReversedParts(D10_DEITIES, divLon);
    case 'D12':
      return pickFromParts(D12_DEITIES, divLon);
    case 'D16':
      return isOddSign(divSign)
        ? pickFromParts(D16_DEITIES, divLon)
        : pickFromReversedParts(D16_DEITIES, divLon);
    case 'D20':
      return pickFromParts(isOddSign(sourceSign) ? D20_ODD_DEITIES : D20_EVEN_DEITIES, sourceDeg);
    case 'D24':
      return isOddSign(divSign)
        ? pickFromParts(D24_DEITIES, divLon)
        : pickFromReversedParts(D24_DEITIES, divLon);
    case 'D27':
      return isOddSign(divSign)
        ? pickFromParts(D27_DEITIES, divLon)
        : pickFromReversedParts(D27_DEITIES, divLon);
    case 'D30':
      return isOddSign(divSign)
        ? pickFromParts(D30_DEITIES, divLon)
        : pickFromReversedParts(D30_DEITIES, divLon);
    case 'D40':
      return pickFromParts(D40_DEITIES, divLon);
    case 'D45':
      return D45_DEITY_ORDERS[signModality(sourceSign)][boundedPartIndex(sourceDeg, 45) % 3];
    default:
      return null;
  }
}

export const DIVISIONAL_CHARTS: readonly DivisionalMeta[] = [
  { chart: 'D1', label: 'D1 (Rasi)', divisor: 1, signKey: 'sign', ascKey: 'ascSign', houseKey: 'house', calc: (sign) => sign },
  { chart: 'D2', label: 'D2 (Hora)', divisor: 2, signKey: 'd2Sign', ascKey: 'ascD2', calc: getD2Sign },
  { chart: 'D3', label: 'D3 (Drekkana)', divisor: 3, signKey: 'd3Sign', ascKey: 'ascD3', calc: getD3Sign },
  { chart: 'D4', label: 'D4 (Chaturthamsa)', divisor: 4, signKey: 'd4Sign', ascKey: 'ascD4', calc: getD4Sign },
  { chart: 'D7', label: 'D7 (Saptamsa)', divisor: 7, signKey: 'd7Sign', ascKey: 'ascD7', houseKey: 'd7House', calc: getD7Sign },
  { chart: 'D9', label: 'D9 (Navamsa)', divisor: 9, signKey: 'navamsaSign', ascKey: 'ascNavamsa', houseKey: 'navamsaHouse', calc: getNavamsaSign },
  { chart: 'D10', label: 'D10 (Dasamsa)', divisor: 10, signKey: 'd10Sign', ascKey: 'ascD10', houseKey: 'd10House', calc: getD10Sign },
  { chart: 'D12', label: 'D12 (Dvadasamsa)', divisor: 12, signKey: 'd12Sign', ascKey: 'ascD12', houseKey: 'd12House', calc: getD12Sign },
  { chart: 'D16', label: 'D16 (Shodasamsa)', divisor: 16, signKey: 'd16Sign', ascKey: 'ascD16', houseKey: 'd16House', calc: getD16Sign },
  { chart: 'D20', label: 'D20 (Vimsamsa)', divisor: 20, signKey: 'd20Sign', ascKey: 'ascD20', houseKey: 'd20House', calc: getD20Sign },
  { chart: 'D24', label: 'D24 (Siddhamsa)', divisor: 24, signKey: 'd24Sign', ascKey: 'ascD24', houseKey: 'd24House', calc: getD24Sign },
  { chart: 'D27', label: 'D27 (Bhamsa)', divisor: 27, signKey: 'd27Sign', ascKey: 'ascD27', houseKey: 'd27House', calc: getD27Sign },
  { chart: 'D30', label: 'D30 (Trimsamsa)', divisor: 30, signKey: 'd30Sign', ascKey: 'ascD30', houseKey: 'd30House', calc: getD30Sign },
  { chart: 'D40', label: 'D40 (Khavedamsa)', divisor: 40, signKey: 'd40Sign', ascKey: 'ascD40', houseKey: 'd40House', calc: getD40Sign },
  { chart: 'D45', label: 'D45 (Akshavedamsa)', divisor: 45, signKey: 'd45Sign', ascKey: 'ascD45', houseKey: 'd45House', calc: getD45Sign },
  { chart: 'D60', label: 'D60 (Shashtiamsa)', divisor: 60, signKey: 'd60Sign', ascKey: 'ascD60', houseKey: 'd60House', calc: getD60Sign },
];

const DIVISIONAL_META = Object.fromEntries(
  DIVISIONAL_CHARTS.map((meta) => [meta.chart, meta]),
) as Record<DivisionalChart, DivisionalMeta>;

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

/**
 * Computes an Arudha Pada from the sign occupied by a house and the sign occupied by that house lord.
 * Callers working with house numbers should derive the house sign first, or use `getArudhaPada`.
 */
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

/**
 * Computes Graha Arudhas directly from a planet's current sign to each of its owned signs.
 * This follows raw graha-arudha counting and intentionally does not apply bhava-pada exception rules.
 */
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

export function getArudhaPada(
  data: ChartData,
  house: number,
  chart: DivisionalChart = 'D1',
): number {
  const ascSign = getAscSignForChart(data, chart);
  const houseSign = houseToSign(house, ascSign);
  const divSigns = getDivisionalSigns(data.planetData, chart);
  const houseLord = SIGN_LORDS[houseSign - 1];
  return computeArudhaPada(houseSign, divSigns[houseLord]);
}

export function getArudhaPadas(
  data: ChartData,
  chart: DivisionalChart = 'D1',
): number[] {
  const ascSign = getAscSignForChart(data, chart);
  const divSigns = getDivisionalSigns(data.planetData, chart);

  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const houseSign = houseToSign(house, ascSign);
    const houseLord = SIGN_LORDS[houseSign - 1];
    return computeArudhaPada(houseSign, divSigns[houseLord]);
  });
}

export function getArudhasForAllCharts(
  data: ChartData,
): Record<DivisionalChart, number[]> {
  return Object.fromEntries(
    DIVISIONAL_CHARTS.map(({ chart }) => [chart, getArudhaPadas(data, chart)]),
  ) as Record<DivisionalChart, number[]>;
}

export function getArudhaLagna(
  data: ChartData,
  chart: DivisionalChart = 'D1',
): number {
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

export function getTemporaryRelationship(fromSign: number, toSign: number): RelationshipType {
  const diff = ((toSign - fromSign) % 12 + 12) % 12;
  return [1, 2, 3, 9, 10, 11].includes(diff) ? 'Friend' : 'Enemy';
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

export function getCharaKarakas(
  positions: Record<PlanetName, PlanetPosition>,
): Partial<Record<PlanetName, string>> {
  return rankKarakas(KARAKA_PLANETS.map((planet) => ({
    planet,
    value: positions[planet].lon,
  })));
}

export function getCharaKarakasFromLongitudes(
  lons: Record<PlanetName, number>,
): Partial<Record<PlanetName, string>> {
  return rankKarakas(KARAKA_PLANETS.map((planet) => ({
    planet,
    value: lons[planet] % 30,
  })));
}

export function sphutaDrishti(
  asp: PlanetName,
  _aspected: PlanetName,
  aspLon: number,
  aspectedLon: number,
): number | null {
  const a = ((aspectedLon - aspLon) % 360 + 360) % 360;

  if (asp === 'Mars') {
    if (a >= 30 && a < 60) return null;
    if (a >= 90 && a < 120) return 45 + (a - 90) / 2;
    if (a >= 120 && a < 180) return 2 * (150 - a);
    if (a >= 180 && a < 210) return 60;
    if (a >= 210 && a < 240) return 270 - a;
    if (a >= 240 && a < 270) return 0;
  }

  if (asp === 'Jupiter') {
    if (a >= 60 && a < 90) return null;
    if (a >= 90 && a < 120) return 45 + (a - 90) / 2;
    if (a >= 120 && a < 150) return 2 * (150 - a);
    if (a >= 150 && a < 180) return null;
    if (a >= 180 && a < 210) return null;
    if (a >= 210 && a < 240) return 45 + (a - 210) / 2;
    if (a >= 240 && a < 270) return 15 + 2 * (270 - a) / 3;
    if (a >= 270 && a < 300) return null;
  }

  if (asp === 'Saturn') {
    if (a >= 0 && a < 30) return null;
    if (a >= 30 && a < 60) return (a - 30) * 2;
    if (a >= 60 && a < 90) return 45 + (90 - a) / 2;
    if (a >= 120 && a < 150) return null;
    if (a >= 210 && a < 240) return null;
    if (a >= 240 && a < 270) return a - 210;
    if (a >= 270 && a < 300) return 2 * (300 - a);
  }

  if (a >= 0 && a < 30) return 0;
  if (a >= 30 && a < 60) return asp === 'Saturn' ? (a - 30) * 2 : (a - 30) / 2;
  if (a >= 60 && a < 90) return asp === 'Saturn' ? 45 + (90 - a) / 2 : a - 45;
  if (a >= 90 && a < 120) return (asp === 'Mars' || asp === 'Jupiter') ? 45 + (a - 90) / 2 : 30 + (120 - a) / 2;
  if (a >= 120 && a < 150) return (asp === 'Mars' || asp === 'Jupiter') ? 2 * (150 - a) : 150 - a;
  if (a >= 150 && a < 180) return (asp === 'Mars' || asp === 'Jupiter') ? 2 * (150 - a) : (300 - a) / 2;
  if (a >= 180 && a < 210) return asp === 'Mars' ? 60 : (300 - a) / 2;
  if (a >= 210 && a < 240) {
    if (asp === 'Mars') return 270 - a;
    if (asp === 'Jupiter') return 45 + (a - 210) / 2;
    return (300 - a) / 2;
  }
  if (a >= 240 && a < 270) {
    if (asp === 'Jupiter') return 15 + 2 * (270 - a) / 3;
    if (asp === 'Saturn') return a - 210;
    return (300 - a) / 2;
  }
  if (a >= 270 && a < 300) return asp === 'Saturn' ? 2 * (300 - a) : (300 - a) / 2;
  if (a >= 300 && a < 330) return 0;
  if (a >= 330 && a < 360) return 0;
  return 0;
}

export function buildChartData({
  year,
  month,
  day,
  hour,
  lat,
  lon,
  weekday,
  localYear,
  localMonth,
  localDay,
}: BuildChartParams): ChartData {
  const jd = julianDay(year, month, day, hour);
  const { positions, ayanamsa, ascSid, ascSign, ascDeg } = computeAllPositions(jd, lat, lon);
  const ascSigns = ascSignsFor(ascSign, ascDeg);
  const { nakshatra: ascNak, pada: ascPada } = getNakshatraPada(ascSid);
  const karakas = getCharaKarakas(positions);
  const sunLon = positions.Sun.lon;
  const upagrahas = computeUpagrahas(sunLon);
  const upagrahasFormatted = formatUpagrahas(upagrahas);
  const birthTime = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) + hour * 3600000);
  const birthWeekday = weekday ?? birthTime.getUTCDay();
  const eventYear = localYear ?? year;
  const eventMonth = localMonth ?? month;
  const eventDay = localDay ?? day;
  const { sunrise, sunset } = computeSunriseSunsetUtc(eventYear, eventMonth, eventDay, lat, lon);
  const nextDayDate = new Date(Date.UTC(eventYear, eventMonth - 1, eventDay + 1));
  const { sunrise: nextSunrise } = computeSunriseSunsetUtc(
    nextDayDate.getUTCFullYear(),
    nextDayDate.getUTCMonth() + 1,
    nextDayDate.getUTCDate(),
    lat,
    lon,
  );
  const kalaVelas = computeKalaVelasDetailed({
    birthTime,
    sunrise,
    sunset,
    nextSunrise,
    latitude: lat,
    longitude: lon,
    weekday: birthWeekday,
    options: {
      gulikaMode: 'start',
      mandiMode: 'same_as_gulika',
    },
  });
  const arudhaLagna = computeArudhaPada(ascSign, positions[SIGN_LORDS[ascSign - 1]].sign);

  const planetData = PLANET_LIST.map((name) => {
    const { lon: pLon, sign, deg, motion } = positions[name];
    const divisionalSigns = divisionalSignsFor(sign, deg);
    const { sign: _sign, ...otherSigns } = divisionalSigns;
    const houses = houseMapFor(divisionalSigns, ascSigns);
    const { nakshatra, pada } = getNakshatraPada(pLon);

    return {
      name,
      lon: pLon,
      sign,
      deg,
      motion,
      ...houses,
      ...otherSigns,
      d60Shashtiamsa: getD60Shashtiamsa(sign, deg),
      lordships: getLordships(name, ascSign),
      role: getFunctionalRole(name, ascSign),
      combust: name !== 'Sun' && !!COMBUSTION_LIMITS[name] && isCombust(name, sunLon, pLon, motion),
      nakshatra,
      pada,
      nakLord: NAKSHATRA_LORDS[nakshatra] || '\u2014',
      signLord: SIGN_LORDS[sign - 1],
      karaka: karakas[name] || null,
    } as PlanetData;
  });

  const { ascSign: _ascSign, ...otherAscSigns } = ascSigns;
  return {
    jd,
    lat,
    lon,
    ayanamsa,
    ascSid,
    ascSign,
    ascDeg,
    arudhaLagna,
    ...otherAscSigns,
    ascNak,
    ascPada,
    positions,
    planetData,
    karakas,
    upagrahas,
    upagrahasFormatted,
    kalaVelas,
  } as ChartData;
}

export function getAscSignForChart(data: ChartData, chart: DivisionalChart): number {
  return data[DIVISIONAL_META[chart].ascKey];
}

export function getAscDivisionalLongitude(data: ChartData, chart: DivisionalChart): number {
  if (chart === 'D1') return data.ascSid;

  const { divisor, ascKey } = DIVISIONAL_META[chart];
  const ascDivSign = data[ascKey];
  const partSize = 30 / divisor;
  const degInPart = data.ascDeg % partSize;
  return ((ascDivSign - 1) * 30) + (degInPart * divisor);
}

export function getDivisionalSigns(
  planets: PlanetData[],
  chart: DivisionalChart,
): Record<PlanetName, number> {
  const { signKey } = DIVISIONAL_META[chart];
  return toPlanetMap(planets, (planet) => planet[signKey] as number);
}

export function getDivisionalCombustion(
  planets: PlanetData[],
  divisionalLongitudes: Record<PlanetName, number>,
): Record<PlanetName, boolean> {
  const sunLon = divisionalLongitudes.Sun;
  return toPlanetMap(
    planets,
    ({ name, motion }) =>
      name !== 'Sun' &&
      !!COMBUSTION_LIMITS[name] &&
      isCombust(name, sunLon, divisionalLongitudes[name], motion),
  );
}

export function getDivisionalLongitudes(
  planets: PlanetData[],
  chart: DivisionalChart,
): Record<PlanetName, number> {
  const { divisor, signKey } = DIVISIONAL_META[chart];
  if (chart === 'D1') return toPlanetMap(planets, ({ lon }) => lon);

  const partSize = 30 / divisor;
  return toPlanetMap(
    planets,
    (planet) => ((planet[signKey] as number) - 1) * 30 + (planet.deg % partSize) * divisor,
  );
}
