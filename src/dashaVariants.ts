import { NAKSHATRA_LIST, type NakshatraName } from './constants';
import type { PlanetName } from './types';

export interface VariantDashaDuration {
  years: number;
  months: number;
  days: number;
}

export interface VariantDashaAntardashaEntry<TPlanet extends string = PlanetName> {
  planet: TPlanet;
  startDate: Date;
  endDate: Date;
}

export interface VariantDashaTimelineEntry<TPlanet extends string = PlanetName> {
  planet: TPlanet;
  startDate: Date;
  endDate: Date;
  antardashas: VariantDashaAntardashaEntry<TPlanet>[];
}

export interface VariantDashaResult<TPlanet extends string = PlanetName> {
  startPlanet: TPlanet;
  elapsed: VariantDashaDuration;
  balance: VariantDashaDuration;
  timeline: VariantDashaTimelineEntry<TPlanet>[];
}

export type ShodsottariPlanet =
  | 'Sun'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Ketu'
  | 'Moon'
  | 'Mercury'
  | 'Venus';
export type ShodsottariDuration = VariantDashaDuration;
export type ShodsottariTimelineEntry = VariantDashaTimelineEntry<ShodsottariPlanet>;
export type ShodsottariAntardashaEntry = VariantDashaAntardashaEntry<ShodsottariPlanet>;
export type ShodsottariResult = VariantDashaResult<ShodsottariPlanet>;

export type DwadashottariPlanet =
  | 'Sun'
  | 'Jupiter'
  | 'Ketu'
  | 'Mercury'
  | 'Rahu'
  | 'Mars'
  | 'Saturn'
  | 'Moon';
export type DwadashottariDuration = VariantDashaDuration;
export type DwadashottariTimelineEntry = VariantDashaTimelineEntry<DwadashottariPlanet>;
export type DwadashottariAntardashaEntry = VariantDashaAntardashaEntry<DwadashottariPlanet>;
export type DwadashottariResult = VariantDashaResult<DwadashottariPlanet>;

export type PanchottariPlanet = 'Sun' | 'Mercury' | 'Saturn' | 'Mars' | 'Venus' | 'Moon' | 'Jupiter';
export type PanchottariResult = VariantDashaResult<PanchottariPlanet>;

export type ShatabdikaPlanet = 'Sun' | 'Moon' | 'Venus' | 'Mercury' | 'Jupiter' | 'Mars' | 'Saturn';
export type ShatabdikaResult = VariantDashaResult<ShatabdikaPlanet>;

export type ChaturasitiPlanet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
export type ChaturasitiResult = VariantDashaResult<ChaturasitiPlanet>;

export type DwisaptatiPlanet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu';
export type DwisaptatiResult = VariantDashaResult<DwisaptatiPlanet>;

export type ShastihayaniPlanet = 'Jupiter' | 'Sun' | 'Mars' | 'Moon' | 'Mercury' | 'Venus' | 'Saturn' | 'Rahu';
export type ShastihayaniResult = VariantDashaResult<ShastihayaniPlanet>;

export type ShatTrimshatPlanet = 'Moon' | 'Sun' | 'Jupiter' | 'Mars' | 'Mercury' | 'Saturn' | 'Venus' | 'Rahu';
export type ShatTrimshatResult = VariantDashaResult<ShatTrimshatPlanet>;

const EPSILON = 1e-9;
const YEAR_MS = 365.2425 * 86400000;
const NAKSHATRA_SIZE = 360 / 27;
const UNIX_EPOCH_JD = 2440587.5;
const PUSHYA_INDEX = NAKSHATRA_LIST.indexOf('Pushya');
const REVATI_INDEX = NAKSHATRA_LIST.indexOf('Revati');
const ANURADHA_INDEX = NAKSHATRA_LIST.indexOf('Anuradha');
const SWATI_INDEX = NAKSHATRA_LIST.indexOf('Swati');
const MULA_INDEX = NAKSHATRA_LIST.indexOf('Mula');
const ARDRA_INDEX = NAKSHATRA_LIST.indexOf('Ardra');
const SHRAVANA_INDEX = NAKSHATRA_LIST.indexOf('Shravana');

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

export const SHODSOTTARI_YEARS: Record<ShodsottariPlanet, number> = {
  Sun: 11,
  Mars: 12,
  Jupiter: 13,
  Saturn: 14,
  Ketu: 15,
  Moon: 16,
  Mercury: 17,
  Venus: 18,
};

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

export const PANCHOTTARI_ORDER: readonly PanchottariPlanet[] = [
  'Sun',
  'Mercury',
  'Saturn',
  'Mars',
  'Venus',
  'Moon',
  'Jupiter',
];

export const PANCHOTTARI_YEARS: Record<PanchottariPlanet, number> = {
  Sun: 12,
  Mercury: 13,
  Saturn: 14,
  Mars: 15,
  Venus: 16,
  Moon: 17,
  Jupiter: 18,
};

export const SHATABDIKA_ORDER: readonly ShatabdikaPlanet[] = [
  'Sun',
  'Moon',
  'Venus',
  'Mercury',
  'Jupiter',
  'Mars',
  'Saturn',
];

export const SHATABDIKA_YEARS: Record<ShatabdikaPlanet, number> = {
  Sun: 5,
  Moon: 5,
  Venus: 10,
  Mercury: 10,
  Jupiter: 20,
  Mars: 20,
  Saturn: 30,
};

export const CHATURASITI_ORDER: readonly ChaturasitiPlanet[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
];

export const CHATURASITI_YEARS: Record<ChaturasitiPlanet, number> = {
  Sun: 12,
  Moon: 12,
  Mars: 12,
  Mercury: 12,
  Jupiter: 12,
  Venus: 12,
  Saturn: 12,
};

export const DWISAPTATI_ORDER: readonly DwisaptatiPlanet[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
];

export const DWISAPTATI_YEARS: Record<DwisaptatiPlanet, number> = {
  Sun: 9,
  Moon: 9,
  Mars: 9,
  Mercury: 9,
  Jupiter: 9,
  Venus: 9,
  Saturn: 9,
  Rahu: 9,
};

export const SHASTIHAYANI_ORDER: readonly ShastihayaniPlanet[] = [
  'Jupiter',
  'Sun',
  'Mars',
  'Moon',
  'Mercury',
  'Venus',
  'Saturn',
  'Rahu',
];

export const SHASTIHAYANI_YEARS: Record<ShastihayaniPlanet, number> = {
  Jupiter: 13,
  Sun: 13,
  Mars: 13,
  Moon: 6,
  Mercury: 6,
  Venus: 6,
  Saturn: 6,
  Rahu: 6,
};

export const SHAT_TRIMSHAT_ORDER: readonly ShatTrimshatPlanet[] = [
  'Moon',
  'Sun',
  'Jupiter',
  'Mars',
  'Mercury',
  'Saturn',
  'Venus',
  'Rahu',
];

export const SHAT_TRIMSHAT_YEARS: Record<ShatTrimshatPlanet, number> = {
  Moon: 1,
  Sun: 2,
  Jupiter: 3,
  Mars: 4,
  Mercury: 5,
  Saturn: 6,
  Venus: 7,
  Rahu: 8,
};

function normalizeLongitude(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return Math.abs(normalized - 360) < EPSILON ? 0 : normalized;
}

function jdToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * 86400000);
}

function yearsToYmd(years: number): VariantDashaDuration {
  const rawMonths = Math.max(0, years) * 12;
  // Round to 9 decimal places to eliminate floating-point noise (e.g. 41.9999999999
  // when the true value is 42) without the overcounting risk of adding a flat EPSILON.
  const totalMonths = Math.round(rawMonths * 1e9) / 1e9;
  const wholeYears = Math.floor(totalMonths / 12);
  const remMonths = totalMonths - wholeYears * 12;
  const wholeMonths = Math.floor(remMonths);
  const days = Math.floor((remMonths - wholeMonths) * 30);
  return { years: wholeYears, months: wholeMonths, days };
}

function getNakshatraIndex(moonLongitude: number): number {
  return Math.floor(normalizeLongitude(moonLongitude) / NAKSHATRA_SIZE) % 27;
}

export function getVariantJanmaNakshatra(moonLongitude: number): NakshatraName {
  return NAKSHATRA_LIST[getNakshatraIndex(moonLongitude)];
}

function getPlanetByRemainder<TPlanet extends string>(
  count: number,
  order: readonly TPlanet[],
): TPlanet {
  const remainder = count % order.length;
  return remainder === 0 ? order[order.length - 1] : order[remainder - 1];
}

function getStartPlanetByCountingFromNakshatra<TPlanet extends string>(
  moonLongitude: number,
  anchorIndex: number,
  order: readonly TPlanet[],
): TPlanet {
  const janmaIndex = getNakshatraIndex(moonLongitude);
  const countFromAnchor = ((janmaIndex - anchorIndex + 27) % 27) + 1;
  return getPlanetByRemainder(countFromAnchor, order);
}

function getStartPlanetByCountingToNakshatra<TPlanet extends string>(
  moonLongitude: number,
  anchorIndex: number,
  order: readonly TPlanet[],
): TPlanet {
  const janmaIndex = getNakshatraIndex(moonLongitude);
  const countToAnchor = ((anchorIndex - janmaIndex + 27) % 27) + 1;
  return getPlanetByRemainder(countToAnchor, order);
}

function buildSequence<TPlanet extends string>(
  order: readonly TPlanet[],
  startPlanet: TPlanet,
): TPlanet[] {
  const startIndex = order.indexOf(startPlanet);
  return order.map((_, offset) => order[(startIndex + offset) % order.length]);
}

function getCycleYears<TPlanet extends string>(
  order: readonly TPlanet[],
  yearsByPlanet: Record<TPlanet, number>,
): number {
  return order.reduce((sum, planet) => sum + yearsByPlanet[planet], 0);
}

function buildAntardashas<TPlanet extends string>(
  startMs: number,
  mahadashaYears: number,
  mahadashaPlanet: TPlanet,
  order: readonly TPlanet[],
  yearsByPlanet: Record<TPlanet, number>,
  cycleYears: number,
): VariantDashaAntardashaEntry<TPlanet>[] {
  const antardashas: VariantDashaAntardashaEntry<TPlanet>[] = [];
  const sequence = buildSequence(order, mahadashaPlanet);
  let cursorMs = startMs;

  for (const antardashaPlanet of sequence) {
    const years = (mahadashaYears * yearsByPlanet[antardashaPlanet]) / cycleYears;
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

function computeVariantDasha<TPlanet extends string>(
  birthJd: number,
  moonLongitude: number,
  order: readonly TPlanet[],
  yearsByPlanet: Record<TPlanet, number>,
  getStartPlanet: (moonLongitude: number) => TPlanet,
): VariantDashaResult<TPlanet> {
  const cycleYears = getCycleYears(order, yearsByPlanet);
  const startPlanet = getStartPlanet(moonLongitude);
  const janmaNakshatraStart = getNakshatraIndex(moonLongitude) * NAKSHATRA_SIZE;
  const bhayat = normalizeLongitude(moonLongitude) - janmaNakshatraStart;
  const elapsedFraction = Math.min(1, Math.max(0, bhayat / NAKSHATRA_SIZE));
  const totalYears = yearsByPlanet[startPlanet];
  const elapsedCurrentYears = elapsedFraction * totalYears;
  const balanceYears = Math.max(0, totalYears - elapsedCurrentYears);

  const sequence = buildSequence(order, startPlanet);
  const timeline: VariantDashaTimelineEntry<TPlanet>[] = [];
  let cursorMs = jdToDate(birthJd).getTime();

  for (let index = 0; index < sequence.length; index += 1) {
    const planet = sequence[index];
    const years = index === 0 ? balanceYears : yearsByPlanet[planet];
    const endMs = cursorMs + years * YEAR_MS;
    timeline.push({
      planet,
      startDate: new Date(Math.round(cursorMs)),
      endDate: new Date(Math.round(endMs)),
      antardashas: buildAntardashas(cursorMs, years, planet, order, yearsByPlanet, cycleYears),
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

export function getShodsottariStartPlanet(moonLongitude: number): ShodsottariPlanet {
  return getStartPlanetByCountingFromNakshatra(moonLongitude, PUSHYA_INDEX, SHODSOTTARI_ORDER);
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
  return computeVariantDasha(
    birthJd,
    moonLongitude,
    SHODSOTTARI_ORDER,
    SHODSOTTARI_YEARS,
    getShodsottariStartPlanet,
  );
}

export function isDwadashottariEligible(d9AscSign: number): boolean {
  return d9AscSign === 2 || d9AscSign === 7;
}

export function getDwadashottariStartPlanet(moonLongitude: number): DwadashottariPlanet {
  return getStartPlanetByCountingToNakshatra(moonLongitude, REVATI_INDEX, DWADASHOTTARI_ORDER);
}

export function getDwadashottariStartNakshatra(moonLongitude: number): NakshatraName {
  return getVariantJanmaNakshatra(moonLongitude);
}

export function computeDwadashottariDasha(
  birthJd: number,
  moonLongitude: number,
): DwadashottariResult {
  return computeVariantDasha(
    birthJd,
    moonLongitude,
    DWADASHOTTARI_ORDER,
    DWADASHOTTARI_YEARS,
    getDwadashottariStartPlanet,
  );
}

export function isPanchottariEligible(
  d1AscSign: number,
  d12AscSign: number,
): boolean {
  return d1AscSign === 4 && d12AscSign === 4;
}

export function getPanchottariStartPlanet(moonLongitude: number): PanchottariPlanet {
  return getStartPlanetByCountingFromNakshatra(moonLongitude, ANURADHA_INDEX, PANCHOTTARI_ORDER);
}

export function computePanchottariDasha(
  birthJd: number,
  moonLongitude: number,
): PanchottariResult {
  return computeVariantDasha(
    birthJd,
    moonLongitude,
    PANCHOTTARI_ORDER,
    PANCHOTTARI_YEARS,
    getPanchottariStartPlanet,
  );
}

export function isShatabdikaEligible(
  d1AscSign: number,
  d9AscSign: number,
): boolean {
  return d1AscSign === d9AscSign;
}

export function getShatabdikaStartPlanet(moonLongitude: number): ShatabdikaPlanet {
  return getStartPlanetByCountingFromNakshatra(moonLongitude, REVATI_INDEX, SHATABDIKA_ORDER);
}

export function computeShatabdikaDasha(
  birthJd: number,
  moonLongitude: number,
): ShatabdikaResult {
  return computeVariantDasha(
    birthJd,
    moonLongitude,
    SHATABDIKA_ORDER,
    SHATABDIKA_YEARS,
    getShatabdikaStartPlanet,
  );
}

export function isChaturasitiEligible(tenthLordHouse: number): boolean {
  return tenthLordHouse === 10;
}

export function getChaturasitiStartPlanet(moonLongitude: number): ChaturasitiPlanet {
  return getStartPlanetByCountingFromNakshatra(moonLongitude, SWATI_INDEX, CHATURASITI_ORDER);
}

export function computeChaturasitiDasha(
  birthJd: number,
  moonLongitude: number,
): ChaturasitiResult {
  return computeVariantDasha(
    birthJd,
    moonLongitude,
    CHATURASITI_ORDER,
    CHATURASITI_YEARS,
    getChaturasitiStartPlanet,
  );
}

export function isDwisaptatiEligible(lagnaLordHouse: number): boolean {
  return lagnaLordHouse === 1 || lagnaLordHouse === 7;
}

export function getDwisaptatiStartPlanet(moonLongitude: number): DwisaptatiPlanet {
  return getStartPlanetByCountingFromNakshatra(moonLongitude, MULA_INDEX, DWISAPTATI_ORDER);
}

export function computeDwisaptatiDasha(
  birthJd: number,
  moonLongitude: number,
): DwisaptatiResult {
  return computeVariantDasha(
    birthJd,
    moonLongitude,
    DWISAPTATI_ORDER,
    DWISAPTATI_YEARS,
    getDwisaptatiStartPlanet,
  );
}

export function isShastihayaniEligible(sunHouse: number): boolean {
  return sunHouse === 1;
}

export function getShastihayaniStartPlanet(moonLongitude: number): ShastihayaniPlanet {
  return getStartPlanetByCountingFromNakshatra(moonLongitude, ARDRA_INDEX, SHASTIHAYANI_ORDER);
}

export function computeShastihayaniDasha(
  birthJd: number,
  moonLongitude: number,
): ShastihayaniResult {
  return computeVariantDasha(
    birthJd,
    moonLongitude,
    SHASTIHAYANI_ORDER,
    SHASTIHAYANI_YEARS,
    getShastihayaniStartPlanet,
  );
}

export function isShatTrimshatEligible(
  d2AscSign: number,
  dayBirth: boolean,
): boolean {
  return (dayBirth && d2AscSign === 5) || (!dayBirth && d2AscSign === 4);
}

export function getShatTrimshatStartPlanet(moonLongitude: number): ShatTrimshatPlanet {
  return getStartPlanetByCountingFromNakshatra(moonLongitude, SHRAVANA_INDEX, SHAT_TRIMSHAT_ORDER);
}

export function computeShatTrimshatDasha(
  birthJd: number,
  moonLongitude: number,
): ShatTrimshatResult {
  return computeVariantDasha(
    birthJd,
    moonLongitude,
    SHAT_TRIMSHAT_ORDER,
    SHAT_TRIMSHAT_YEARS,
    getShatTrimshatStartPlanet,
  );
}
