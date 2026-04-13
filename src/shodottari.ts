import { NAKSHATRA_LIST } from './constants';

export type ShodottariPlanet =
  | 'Sun'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Ketu'
  | 'Moon'
  | 'Mercury'
  | 'Venus';

export interface ShodottariDuration {
  years: number;
  months: number;
  days: number;
}

export interface ShodottariTimelineEntry {
  planet: ShodottariPlanet;
  startDate: Date;
  endDate: Date;
}

export interface ShodottariResult {
  startPlanet: ShodottariPlanet;
  elapsed: ShodottariDuration;
  balance: ShodottariDuration;
  timeline: ShodottariTimelineEntry[];
}

const EPSILON = 1e-9;
const YEAR_MS = 365.2425 * 86400000;
const NAKSHATRA_SIZE = 360 / 27;
const UNIX_EPOCH_JD = 2440587.5;
const PUSHYA_INDEX = NAKSHATRA_LIST.indexOf('Pushya');

export const SHODOTTARI_ORDER: readonly ShodottariPlanet[] = [
  'Sun',
  'Mars',
  'Jupiter',
  'Saturn',
  'Ketu',
  'Moon',
  'Mercury',
  'Venus',
];

const SHODOTTARI_YEARS: Record<ShodottariPlanet, number> = {
  Sun: 11,
  Mars: 12,
  Jupiter: 13,
  Saturn: 14,
  Ketu: 15,
  Moon: 16,
  Mercury: 17,
  Venus: 18,
};

function normalizeLongitude(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return Math.abs(normalized - 360) < EPSILON ? 0 : normalized;
}

function jdToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * 86400000);
}

function yearsToYmd(years: number): ShodottariDuration {
  const totalMonths = Math.max(0, years) * 12;
  const wholeYears = Math.floor(totalMonths / 12);
  const remMonths = totalMonths - wholeYears * 12;
  const wholeMonths = Math.floor(remMonths);
  const days = Math.floor((remMonths - wholeMonths) * 30);
  return { years: wholeYears, months: wholeMonths, days };
}

function getNakshatraIndex(moonLongitude: number): number {
  return Math.floor(normalizeLongitude(moonLongitude) / NAKSHATRA_SIZE) % 27;
}

function buildPlanetSequence(startPlanet: ShodottariPlanet): ShodottariPlanet[] {
  const startIndex = SHODOTTARI_ORDER.indexOf(startPlanet);
  return SHODOTTARI_ORDER.map((_, offset) => SHODOTTARI_ORDER[(startIndex + offset) % SHODOTTARI_ORDER.length]);
}

export function getShodottariStartPlanet(moonLongitude: number): ShodottariPlanet {
  const janmaIndex = getNakshatraIndex(moonLongitude);
  const countFromPushya = ((janmaIndex - PUSHYA_INDEX + 27) % 27) + 1;
  const remainder = countFromPushya % SHODOTTARI_ORDER.length;
  return remainder === 0 ? 'Venus' : SHODOTTARI_ORDER[remainder - 1];
}

export function isShodottariEligible(d2AscSign: number, paksha: 'Shukla' | 'Krishna'): boolean {
  return (d2AscSign === 4 && paksha === 'Krishna') || (d2AscSign === 5 && paksha === 'Shukla');
}

export function computeShodottariDasha(birthJd: number, moonLongitude: number): ShodottariResult {
  const startPlanet = getShodottariStartPlanet(moonLongitude);
  const janmaNakshatraStart = getNakshatraIndex(moonLongitude) * NAKSHATRA_SIZE;
  const bhayat = normalizeLongitude(moonLongitude) - janmaNakshatraStart;
  const elapsedFraction = bhayat / NAKSHATRA_SIZE;
  const totalYears = SHODOTTARI_YEARS[startPlanet];
  const elapsedCurrentYears = elapsedFraction * totalYears;
  const balanceYears = Math.max(0, totalYears - elapsedCurrentYears);

  const sequence = buildPlanetSequence(startPlanet);
  const timeline: ShodottariTimelineEntry[] = [];
  let cursorMs = jdToDate(birthJd).getTime();
  for (let index = 0; index < sequence.length; index += 1) {
    const planet = sequence[index];
    const years = index === 0 ? balanceYears : SHODOTTARI_YEARS[planet];
    const endMs = cursorMs + years * YEAR_MS;
    timeline.push({
      planet,
      startDate: new Date(Math.round(cursorMs)),
      endDate: new Date(Math.round(endMs)),
    });
    cursorMs = endMs;
  }

  return {
    startPlanet,
    elapsed: yearsToYmd(elapsedCurrentYears),
    balance: yearsToYmd(balanceYears),
    timeline,
  };
}
