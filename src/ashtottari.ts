import type { NakshatraName } from './constants';

export type AshtottariPlanet =
  | 'Sun'
  | 'Moon'
  | 'Mars'
  | 'Mercury'
  | 'Saturn'
  | 'Jupiter'
  | 'Rahu'
  | 'Venus';

export interface AshtottariDuration {
  years: number;
  months: number;
  days: number;
}

export interface AshtottariTimelineEntry {
  planet: AshtottariPlanet;
  startDate: Date;
  endDate: Date;
}

export interface AshtottariResult {
  startPlanet: AshtottariPlanet;
  elapsed: AshtottariDuration;
  balance: AshtottariDuration;
  timeline: AshtottariTimelineEntry[];
}

interface SegmentDefinition {
  name: NakshatraName | 'Abhijit';
  start: number;
  end: number;
  planet: AshtottariPlanet;
}

const EPSILON = 1e-9;
const YEAR_MS = 365.2425 * 86400000;
const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;
const NAKSHATRA_SIZE = 360 / 27;
const PADA_SIZE = NAKSHATRA_SIZE / 4;
const SHRAVANA_PORTION_FOR_ABHIJIT = NAKSHATRA_SIZE / 15;
const UTTARA_ASHADHA_INDEX = 20;
const UTTARA_ASHADHA_START = UTTARA_ASHADHA_INDEX * NAKSHATRA_SIZE;
const UTTARA_ASHADHA_TRUNCATED_END = UTTARA_ASHADHA_START + 3 * PADA_SIZE;
const ABHIJIT_END = UTTARA_ASHADHA_START + NAKSHATRA_SIZE + SHRAVANA_PORTION_FOR_ABHIJIT;
const SHRAVANA_END = UTTARA_ASHADHA_START + 2 * NAKSHATRA_SIZE;
const UNIX_EPOCH_JD = 2440587.5;
const MALEFICS: ReadonlySet<AshtottariPlanet> = new Set(['Sun', 'Mars', 'Saturn', 'Rahu']);

const ASHTOTTARI_DASHA_YEARS: Record<AshtottariPlanet, number> = {
  Sun: 6,
  Moon: 15,
  Mars: 8,
  Mercury: 17,
  Saturn: 10,
  Jupiter: 19,
  Rahu: 12,
  Venus: 21,
};

export const ASHTOTTARI_PLANET_ORDER: readonly AshtottariPlanet[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Saturn',
  'Jupiter',
  'Rahu',
  'Venus',
];

const ASHTOTTARI_CYCLE_SEGMENTS: readonly {
  name: NakshatraName | 'Abhijit';
  planet: AshtottariPlanet;
}[] = [
  { name: 'Ardra', planet: 'Sun' },
  { name: 'Punarvasu', planet: 'Sun' },
  { name: 'Pushya', planet: 'Sun' },
  { name: 'Ashlesha', planet: 'Sun' },
  { name: 'Magha', planet: 'Moon' },
  { name: 'Purva Phalguni', planet: 'Moon' },
  { name: 'Uttara Phalguni', planet: 'Moon' },
  { name: 'Hasta', planet: 'Mars' },
  { name: 'Chitra', planet: 'Mars' },
  { name: 'Swati', planet: 'Mars' },
  { name: 'Vishakha', planet: 'Mars' },
  { name: 'Anuradha', planet: 'Mercury' },
  { name: 'Jyeshtha', planet: 'Mercury' },
  { name: 'Mula', planet: 'Mercury' },
  { name: 'Purva Ashadha', planet: 'Saturn' },
  { name: 'Uttara Ashadha', planet: 'Saturn' },
  { name: 'Abhijit', planet: 'Saturn' },
  { name: 'Shravana', planet: 'Saturn' },
  { name: 'Dhanishta', planet: 'Jupiter' },
  { name: 'Shatabhisha', planet: 'Jupiter' },
  { name: 'Purva Bhadrapada', planet: 'Jupiter' },
  { name: 'Uttara Bhadrapada', planet: 'Rahu' },
  { name: 'Revati', planet: 'Rahu' },
  { name: 'Ashwini', planet: 'Rahu' },
  { name: 'Bharani', planet: 'Rahu' },
  { name: 'Krittika', planet: 'Venus' },
  { name: 'Rohini', planet: 'Venus' },
  { name: 'Mrigashira', planet: 'Venus' },
];

const ASHTOTTARI_NAKSHATRA_RULERS = Object.fromEntries(
  ASHTOTTARI_CYCLE_SEGMENTS
    .filter((entry) => entry.name !== 'Abhijit')
    .map((entry) => [entry.name, entry.planet]),
) as Record<NakshatraName, AshtottariPlanet>;

const SEGMENT_BY_NAME = Object.fromEntries(
  ASHTOTTARI_CYCLE_SEGMENTS.map((entry, index) => [entry.name, index]),
) as Record<NakshatraName | 'Abhijit', number>;

function normalizeLongitude(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return Math.abs(normalized - 360) < EPSILON ? 0 : normalized;
}

function getSegmentDefinitions(): SegmentDefinition[] {
  const segments: SegmentDefinition[] = [];
  for (const segment of ASHTOTTARI_CYCLE_SEGMENTS) {
    if (segment.name === 'Abhijit') {
      segments.push({
        name: segment.name,
        start: UTTARA_ASHADHA_TRUNCATED_END,
        end: ABHIJIT_END,
        planet: segment.planet,
      });
      continue;
    }
    const index = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
      'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
      'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
    ].indexOf(segment.name);
    const start = index * NAKSHATRA_SIZE;
    const end = start + NAKSHATRA_SIZE;
    if (segment.name === 'Uttara Ashadha') {
      segments.push({ name: segment.name, start, end: UTTARA_ASHADHA_TRUNCATED_END, planet: segment.planet });
      continue;
    }
    if (segment.name === 'Shravana') {
      segments.push({ name: segment.name, start: ABHIJIT_END, end: SHRAVANA_END, planet: segment.planet });
      continue;
    }
    segments.push({ name: segment.name, start, end, planet: segment.planet });
  }
  return segments;
}

const ASHTOTTARI_SEGMENTS = getSegmentDefinitions();

function segmentPortionYears(planet: AshtottariPlanet): number {
  return ASHTOTTARI_DASHA_YEARS[planet] / (MALEFICS.has(planet) ? 4 : 3);
}

function yearsToYmd(years: number): AshtottariDuration {
  const totalMonths = Math.max(0, years) * 12;
  const wholeYears = Math.floor(totalMonths / 12);
  const remMonths = totalMonths - wholeYears * 12;
  const wholeMonths = Math.floor(remMonths);
  const days = Math.floor((remMonths - wholeMonths) * 30);
  return { years: wholeYears, months: wholeMonths, days };
}

function jdToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * 86400000);
}

function findSegment(moonLongitude: number): SegmentDefinition {
  const longitude = normalizeLongitude(moonLongitude);
  for (let index = 0; index < ASHTOTTARI_SEGMENTS.length; index += 1) {
    const segment = ASHTOTTARI_SEGMENTS[index];
    const last = index === ASHTOTTARI_SEGMENTS.length - 1;
    const inRange = longitude >= segment.start && (longitude < segment.end || (last && Math.abs(longitude - segment.end) < EPSILON));
    if (inRange) return segment;
  }
  return ASHTOTTARI_SEGMENTS[0];
}

function samePlanetRemainingCount(currentName: NakshatraName | 'Abhijit', planet: AshtottariPlanet): number {
  let count = 0;
  const startIndex = SEGMENT_BY_NAME[currentName];
  for (let i = startIndex + 1; i < ASHTOTTARI_CYCLE_SEGMENTS.length; i += 1) {
    if (ASHTOTTARI_CYCLE_SEGMENTS[i].planet !== planet) break;
    count += 1;
  }
  return count;
}

function buildPlanetSequence(start: AshtottariPlanet): AshtottariPlanet[] {
  const startIndex = ASHTOTTARI_PLANET_ORDER.indexOf(start);
  return ASHTOTTARI_PLANET_ORDER.map((_, offset) => ASHTOTTARI_PLANET_ORDER[(startIndex + offset) % ASHTOTTARI_PLANET_ORDER.length]);
}

export function getAshtottariNakshatraRulers(): Record<NakshatraName, AshtottariPlanet> {
  return ASHTOTTARI_NAKSHATRA_RULERS;
}

export function getRahuHouseFromAsc(ascSign: number, rahuSign: number): number {
  return ((rahuSign - ascSign + 12) % 12) + 1;
}

export function isAshtottariEligibleByHouse(rahuHouseFromAsc: number): boolean {
  return ![1, 4, 5, 7, 9, 10].includes(rahuHouseFromAsc);
}

function normalizedDifference(from: number, to: number): number {
  return ((to - from) % 360 + 360) % 360;
}

export function getPakshaFromLongitudes(sunLongitude: number, moonLongitude: number): 'Shukla' | 'Krishna' {
  const phase = normalizedDifference(sunLongitude, moonLongitude);
  return phase < 180 ? 'Shukla' : 'Krishna';
}

function dayOfYearUtc(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((now - start) / 86400000);
}

function solarEquationAndDeclination(jd: number): { eqTimeMinutes: number; declinationRad: number } {
  const date = jdToDate(jd);
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const n = dayOfYearUtc(date);
  const gamma = (2 * Math.PI / 365) * (n - 1 + (utcHour - 12) / 24);
  const eqTimeMinutes = 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
  const declinationRad = 0.006918
    - 0.399912 * Math.cos(gamma)
    + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma)
    + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma)
    + 0.00148 * Math.sin(3 * gamma);
  return { eqTimeMinutes, declinationRad };
}

export function isDayBirth(jd: number, latitude: number, longitude: number): boolean {
  const date = jdToDate(jd);
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const { eqTimeMinutes, declinationRad } = solarEquationAndDeclination(jd);
  const latRad = latitude * RAD;
  const zenithRad = 90.833 * RAD;
  const cosHourAngle = (
    (Math.cos(zenithRad) / (Math.cos(latRad) * Math.cos(declinationRad)))
    - Math.tan(latRad) * Math.tan(declinationRad)
  );
  if (cosHourAngle <= -1) return true; // polar day
  if (cosHourAngle >= 1) return false; // polar night
  const hourAngleDeg = Math.acos(cosHourAngle) * DEG;
  const solarNoonUtcMinutes = 720 - 4 * longitude - eqTimeMinutes;
  const sunriseUtcMinutes = solarNoonUtcMinutes - 4 * hourAngleDeg;
  const sunsetUtcMinutes = solarNoonUtcMinutes + 4 * hourAngleDeg;
  return utcMinutes >= sunriseUtcMinutes && utcMinutes < sunsetUtcMinutes;
}

export function isAshtottariEligibleByPakshaAndTime(
  jd: number,
  latitude: number,
  longitude: number,
  sunLongitude: number,
  moonLongitude: number,
): boolean {
  const dayBirth = isDayBirth(jd, latitude, longitude);
  const paksha = getPakshaFromLongitudes(sunLongitude, moonLongitude);
  return (dayBirth && paksha === 'Krishna') || (!dayBirth && paksha === 'Shukla');
}

export function computeAshtottariDasha(birthJd: number, moonLongitude: number): AshtottariResult {
  const segment = findSegment(moonLongitude);
  const portionYears = segmentPortionYears(segment.planet);
  const bhabhoga = segment.end - segment.start;
  const bhayat = Math.max(0, normalizeLongitude(moonLongitude) - segment.start);
  const elapsedCurrentYears = (bhayat / bhabhoga) * portionYears;
  const balanceCurrentYears = Math.max(0, portionYears - elapsedCurrentYears);
  const remainingSamePlanet = samePlanetRemainingCount(segment.name, segment.planet);
  const totalBalanceYears = balanceCurrentYears + remainingSamePlanet * portionYears;
  const elapsedMahadashaYears = ASHTOTTARI_DASHA_YEARS[segment.planet] - totalBalanceYears;

  const timeline: AshtottariTimelineEntry[] = [];
  const sequence = buildPlanetSequence(segment.planet);
  let cursorMs = jdToDate(birthJd).getTime();
  for (let index = 0; index < sequence.length; index += 1) {
    const planet = sequence[index];
    const years = index === 0 ? totalBalanceYears : ASHTOTTARI_DASHA_YEARS[planet];
    const endMs = cursorMs + years * YEAR_MS;
    timeline.push({
      planet,
      startDate: new Date(Math.round(cursorMs)),
      endDate: new Date(Math.round(endMs)),
    });
    cursorMs = endMs;
  }

  return {
    startPlanet: segment.planet,
    elapsed: yearsToYmd(elapsedMahadashaYears),
    balance: yearsToYmd(totalBalanceYears),
    timeline,
  };
}
