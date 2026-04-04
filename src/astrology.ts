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

const partIndex = (deg: number, parts: number) => Math.floor(deg / (30 / parts));
const advanceSign = (sign: number, offset: number) => ((sign - 1 + offset) % 12) + 1;
const isOddSign = (sign: number) => sign % 2 === 1;
const startByModality = (sign: number, starts: readonly number[]) => starts[(sign - 1) % 3];
const startByElement = (sign: number) => ELEMENT_STARTS[(sign - 1) % 4];
const segmentSign = (deg: number, segments: readonly (readonly [number, number])[]) =>
  segments.find(([limit]) => deg < limit)![1];

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
  const deg = Math.floor(degFloat);
  const minFloat = (degFloat - deg) * 60;
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
  return advanceSign(sign, (Math.floor(deg * 2) % 12) + 1);
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

export function signToHouse(sign: number, ascSign: number): number {
  return ((sign - ascSign + 12) % 12) + 1;
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
  if (a >= 300 && a < 330) return (300 - a) / 2;
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
}: BuildChartParams): ChartData {
  const jd = julianDay(year, month, day, hour);
  const { positions, ayanamsa, ascSid, ascSign, ascDeg } = computeAllPositions(jd, lat, lon);
  const ascSigns = ascSignsFor(ascSign, ascDeg);
  const { nakshatra: ascNak, pada: ascPada } = getNakshatraPada(ascSid);
  const karakas = getCharaKarakas(positions);
  const sunLon = positions.Sun.lon;

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
    ...otherAscSigns,
    ascNak,
    ascPada,
    positions,
    planetData,
    karakas,
  } as ChartData;
}

export function getAscSignForChart(data: ChartData, chart: DivisionalChart): number {
  return data[DIVISIONAL_META[chart].ascKey];
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
