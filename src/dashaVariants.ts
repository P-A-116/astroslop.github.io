import { NAKSHATRA_LIST, buildNakshatraLordMap, type NakshatraName } from './constants';

export type ShodsottariPlanet =
  | 'Sun'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Ketu'
  | 'Moon'
  | 'Mercury'
  | 'Venus';

export interface ShodsottariDuration {
  years: number;
  months: number;
  days: number;
}

export interface ShodsottariTimelineEntry {
  planet: ShodsottariPlanet;
  startDate: Date;
  endDate: Date;
  antardashas: ShodsottariAntardashaEntry[];
}

export interface ShodsottariAntardashaEntry {
  planet: ShodsottariPlanet;
  startDate: Date;
  endDate: Date;
}

export interface ShodsottariResult {
  startPlanet: ShodsottariPlanet;
  elapsed: ShodsottariDuration;
  balance: ShodsottariDuration;
  timeline: ShodsottariTimelineEntry[];
}

export type DwadashottariPlanet =
  | 'Sun'
  | 'Jupiter'
  | 'Ketu'
  | 'Mercury'
  | 'Rahu'
  | 'Mars'
  | 'Saturn'
  | 'Moon';

export interface DwadashottariDuration {
  years: number;
  months: number;
  days: number;
}

export interface DwadashottariTimelineEntry {
  planet: DwadashottariPlanet;
  startDate: Date;
  endDate: Date;
  antardashas: DwadashottariAntardashaEntry[];
}

export interface DwadashottariAntardashaEntry {
  planet: DwadashottariPlanet;
  startDate: Date;
  endDate: Date;
}

export interface DwadashottariResult {
  startPlanet: DwadashottariPlanet;
  elapsed: DwadashottariDuration;
  balance: DwadashottariDuration;
  timeline: DwadashottariTimelineEntry[];
}

const EPSILON = 1e-9;
const YEAR_MS = 365.2425 * 86400000;
const NAKSHATRA_SIZE = 360 / 27;
const UNIX_EPOCH_JD = 2440587.5;
const PUSHYA_INDEX = NAKSHATRA_LIST.indexOf('Pushya');
const REVATI_INDEX = NAKSHATRA_LIST.indexOf('Revati');

export const SHODSOTTARI_ORDER: readonly ShodsottariPlanet[] = [
  'Sun',
  'Mars',
  'Jupiter',
  'Saturn',
  'Ketu',
  'Moon',
  'Mercury',
  'Venus',
];

const SHODSOTTARI_YEARS: Record<ShodsottariPlanet, number> = {
  Sun: 11,
  Mars: 12,
  Jupiter: 13,
  Saturn: 14,
  Ketu: 15,
  Moon: 16,
  Mercury: 17,
  Venus: 18,
};
const SHODSOTTARI_CYCLE_YEARS = 116;

export const SHODSOTTARI_NAKSHATRA_LORDS = buildNakshatraLordMap(SHODSOTTARI_ORDER);

export const DWADASHOTTARI_ORDER: readonly DwadashottariPlanet[] = [
  'Sun',
  'Jupiter',
  'Ketu',
  'Mercury',
  'Rahu',
  'Mars',
  'Saturn',
  'Moon',
];

export const DWADASHOTTARI_YEARS: Record<DwadashottariPlanet, number> = {
  Sun: 7,
  Jupiter: 9,
  Ketu: 11,
  Mercury: 13,
  Rahu: 15,
  Mars: 17,
  Saturn: 19,
  Moon: 21,
};

const DWADASHOTTARI_CYCLE_YEARS = DWADASHOTTARI_ORDER.reduce(
  (sum, planet) => sum + DWADASHOTTARI_YEARS[planet],
  0,
);

function normalizeLongitude(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return Math.abs(normalized - 360) < EPSILON ? 0 : normalized;
}

function jdToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * 86400000);
}

function yearsToYmd(years: number): { years: number; months: number; days: number } {
  const totalMonths = Math.max(0, years) * 12 + EPSILON;
  const wholeYears = Math.floor(totalMonths / 12);
  const remMonths = totalMonths - wholeYears * 12;
  const wholeMonths = Math.floor(remMonths);
  const days = Math.floor((remMonths - wholeMonths) * 30);
  return { years: wholeYears, months: wholeMonths, days };
}

function getNakshatraIndex(moonLongitude: number): number {
  return Math.floor(normalizeLongitude(moonLongitude) / NAKSHATRA_SIZE) % 27;
}

function buildShodsottariSequence(startPlanet: ShodsottariPlanet): ShodsottariPlanet[] {
  const startIndex = SHODSOTTARI_ORDER.indexOf(startPlanet);
  return SHODSOTTARI_ORDER.map(
    (_, offset) => SHODSOTTARI_ORDER[(startIndex + offset) % SHODSOTTARI_ORDER.length],
  );
}

function buildShodsottariAntardashas(
  startMs: number,
  mahadashaYears: number,
  mahadashaPlanet: ShodsottariPlanet,
): ShodsottariAntardashaEntry[] {
  const antardashas: ShodsottariAntardashaEntry[] = [];
  const sequence = buildShodsottariSequence(mahadashaPlanet);
  let cursorMs = startMs;
  for (const antardashaPlanet of sequence) {
    const years = (mahadashaYears * SHODSOTTARI_YEARS[antardashaPlanet]) / SHODSOTTARI_CYCLE_YEARS;
    const endMs = cursorMs + years * YEAR_MS;
    antardashas.push({
      planet: antardashaPlanet,
      startDate: new Date(Math.round(cursorMs)),
      endDate: new Date(Math.round(endMs)),
    });
    cursorMs = endMs;
  }
  return antardashas;
}

function buildDwadashottariSequence(startPlanet: DwadashottariPlanet): DwadashottariPlanet[] {
  const startIndex = DWADASHOTTARI_ORDER.indexOf(startPlanet);
  return DWADASHOTTARI_ORDER.map(
    (_, offset) => DWADASHOTTARI_ORDER[(startIndex + offset) % DWADASHOTTARI_ORDER.length],
  );
}

function buildDwadashottariAntardashas(
  startMs: number,
  mahadashaYears: number,
  mahadashaPlanet: DwadashottariPlanet,
): DwadashottariAntardashaEntry[] {
  const antardashas: DwadashottariAntardashaEntry[] = [];
  const sequence = buildDwadashottariSequence(mahadashaPlanet);
  let cursorMs = startMs;

  for (const antardashaPlanet of sequence) {
    const years = (mahadashaYears * DWADASHOTTARI_YEARS[antardashaPlanet]) / DWADASHOTTARI_CYCLE_YEARS;
    const endMs = cursorMs + years * YEAR_MS;
    antardashas.push({
      planet: antardashaPlanet,
      startDate: new Date(Math.round(cursorMs)),
      endDate: new Date(Math.round(endMs)),
    });
    cursorMs = endMs;
  }

  return antardashas;
}

export function getShodsottariStartPlanet(moonLongitude: number): ShodsottariPlanet {
  const janmaIndex = getNakshatraIndex(moonLongitude);
  const countFromPushya = ((janmaIndex - PUSHYA_INDEX + 27) % 27) + 1;
  const remainder = countFromPushya % SHODSOTTARI_ORDER.length;
  return remainder === 0 ? 'Venus' : SHODSOTTARI_ORDER[remainder - 1];
}

export function isShodsottariEligible(
  d2AscSign: number,
  paksha: 'Shukla' | 'Krishna',
): boolean {
  return (
    (d2AscSign === 4 && paksha === 'Krishna') ||
    (d2AscSign === 5 && paksha === 'Shukla')
  );
}

export function computeShodsottariDasha(
  birthJd: number,
  moonLongitude: number,
): ShodsottariResult {
  const startPlanet = getShodsottariStartPlanet(moonLongitude);
  const janmaNakshatraStart = getNakshatraIndex(moonLongitude) * NAKSHATRA_SIZE;
  const bhayat = normalizeLongitude(moonLongitude) - janmaNakshatraStart;
  const elapsedFraction = bhayat / NAKSHATRA_SIZE;
  const totalYears = SHODSOTTARI_YEARS[startPlanet];
  const elapsedCurrentYears = elapsedFraction * totalYears;
  const balanceYears = Math.max(0, totalYears - elapsedCurrentYears);

  const sequence = buildShodsottariSequence(startPlanet);
  const timeline: ShodsottariTimelineEntry[] = [];
  let cursorMs = jdToDate(birthJd).getTime();

  for (let index = 0; index < sequence.length; index += 1) {
    const planet = sequence[index];
    const years = index === 0 ? balanceYears : SHODSOTTARI_YEARS[planet];
    const endMs = cursorMs + years * YEAR_MS;
    timeline.push({
      planet,
      startDate: new Date(Math.round(cursorMs)),
      endDate: new Date(Math.round(endMs)),
      antardashas: buildShodsottariAntardashas(cursorMs, years, planet),
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

export function isDwadashottariEligible(d9AscSign: number): boolean {
  return d9AscSign === 2 || d9AscSign === 7;
}

export function getDwadashottariStartPlanet(moonLongitude: number): DwadashottariPlanet {
  const janmaIndex = getNakshatraIndex(moonLongitude);
  const countToRevati = REVATI_INDEX - janmaIndex + 1;
  const remainder = countToRevati % DWADASHOTTARI_ORDER.length;
  return remainder === 0
    ? DWADASHOTTARI_ORDER[DWADASHOTTARI_ORDER.length - 1]
    : DWADASHOTTARI_ORDER[remainder - 1];
}

export function getDwadashottariStartNakshatra(moonLongitude: number): NakshatraName {
  return NAKSHATRA_LIST[getNakshatraIndex(moonLongitude)];
}

export function computeDwadashottariDasha(
  birthJd: number,
  moonLongitude: number,
): DwadashottariResult {
  const startPlanet = getDwadashottariStartPlanet(moonLongitude);
  const janmaNakshatraStart = getNakshatraIndex(moonLongitude) * NAKSHATRA_SIZE;
  const bhayat = normalizeLongitude(moonLongitude) - janmaNakshatraStart;
  const bhabhoga = NAKSHATRA_SIZE;
  const elapsedFraction = bhayat / bhabhoga;
  const totalYears = DWADASHOTTARI_YEARS[startPlanet];
  const elapsedCurrentYears = elapsedFraction * totalYears;
  const balanceYears = Math.max(0, totalYears - elapsedCurrentYears);

  const sequence = buildDwadashottariSequence(startPlanet);
  const timeline: DwadashottariTimelineEntry[] = [];
  let cursorMs = jdToDate(birthJd).getTime();

  for (let index = 0; index < sequence.length; index += 1) {
    const planet = sequence[index];
    const years = index === 0 ? balanceYears : DWADASHOTTARI_YEARS[planet];
    const endMs = cursorMs + years * YEAR_MS;
    timeline.push({
      planet,
      startDate: new Date(Math.round(cursorMs)),
      endDate: new Date(Math.round(endMs)),
      antardashas: buildDwadashottariAntardashas(cursorMs, years, planet),
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
