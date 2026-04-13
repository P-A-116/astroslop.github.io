import { NAKSHATRA_LIST } from './constants';

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
}

export interface ShodsottariResult {
  startPlanet: ShodsottariPlanet;
  elapsed: ShodsottariDuration;
  balance: ShodsottariDuration;
  timeline: ShodsottariTimelineEntry[];
}

const EPSILON = 1e-9;
const YEAR_MS = 365.2425 * 86400000;
const NAKSHATRA_SIZE = 360 / 27;
const UNIX_EPOCH_JD = 2440587.5;
const PUSHYA_INDEX = NAKSHATRA_LIST.indexOf('Pushya');

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

/**
 * Nakshatra lords for the Shodsottari dasha system (distinct from Vimshottari).
 * Rahu is excluded; the 8-planet cycle starts from Sun at Ashwini.
 * Pushya (index 7) maps to Venus, consistent with the BPHS count-from-Pushya rule.
 */
export const SHODSOTTARI_NAKSHATRA_LORDS = Object.fromEntries(
  NAKSHATRA_LIST.map((nakshatra, index) => [
    nakshatra,
    SHODSOTTARI_ORDER[index % SHODSOTTARI_ORDER.length],
  ]),
) as Record<typeof NAKSHATRA_LIST[number], ShodsottariPlanet>;

function normalizeLongitude(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return Math.abs(normalized - 360) < EPSILON ? 0 : normalized;
}

function jdToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * 86400000);
}

function yearsToYmd(years: number): ShodsottariDuration {
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

function buildPlanetSequence(startPlanet: ShodsottariPlanet): ShodsottariPlanet[] {
  const startIndex = SHODSOTTARI_ORDER.indexOf(startPlanet);
  return SHODSOTTARI_ORDER.map(
    (_, offset) => SHODSOTTARI_ORDER[(startIndex + offset) % SHODSOTTARI_ORDER.length],
  );
}

/**
 * Derives the Shodaottari dasha start planet from the Janma Nakshatra.
 *
 * BPHS rule: count nakshatras from Pushyami to the Janma Nakshatra (inclusive),
 * divide by 8, and the remainder maps to the planet order (1=Sun … 0=Venus).
 *
 * Verification with BPHS example:
 *   Janma Nakshatra = Rohini (index 3), Pushya (index 7)
 *   countFromPushya = (3 − 7 + 27) % 27 + 1 = 24
 *   24 % 8 = 0  →  Venus ✓
 */
export function getShodsottariStartPlanet(moonLongitude: number): ShodsottariPlanet {
  const janmaIndex = getNakshatraIndex(moonLongitude);
  const countFromPushya = ((janmaIndex - PUSHYA_INDEX + 27) % 27) + 1;
  const remainder = countFromPushya % SHODSOTTARI_ORDER.length;
  return remainder === 0 ? 'Venus' : SHODSOTTARI_ORDER[remainder - 1];
}

/**
 * Eligibility check per BPHS:
 *   - Ascendant (D2) in Hora of Moon (Cancer, sign 4) + Krishna Paksha, OR
 *   - Ascendant (D2) in Hora of Sun  (Leo,    sign 5) + Shukla Paksha
 *
 * @param d2AscSign  D2 ascendant sign, 1-indexed (Aries = 1)
 * @param paksha     'Shukla' (bright half) or 'Krishna' (dark half)
 */
export function isShodsottariEligible(
  d2AscSign: number,
  paksha: 'Shukla' | 'Krishna',
): boolean {
  return (
    (d2AscSign === 4 && paksha === 'Krishna') ||
    (d2AscSign === 5 && paksha === 'Shukla')
  );
}

/**
 * Computes the full Shodsottari dasha timeline from birth.
 *
 * Balance of the first dasha is calculated as:
 *   balanceYears = (1 − bhayat / NAKSHATRA_SIZE) × dasaYears
 * where bhayat is the degrees already traversed in the Janma Nakshatra.
 */
export function computeShodasottariDasha(
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

  const sequence = buildPlanetSequence(startPlanet);
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
