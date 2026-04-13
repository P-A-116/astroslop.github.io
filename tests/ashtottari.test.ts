import { describe, expect, it } from 'vitest';
import {
  computeAshtottariDasha,
  getAshtottariNakshatraRulers,
  getPakshaFromLongitudes,
  getRahuHouseFromAsc,
  isAshtottariEligibleByPakshaAndTime,
  isDayBirth,
  isAshtottariEligibleByHouse,
} from '../src/ashtottari';

const NAKSHATRA_SIZE = 360 / 27;
const PADA_SIZE = NAKSHATRA_SIZE / 4;
const UTTARA_ASHADHA_START = 20 * NAKSHATRA_SIZE;

describe('ashtottari eligibility', () => {
  it('rejects Rahu in kendra/trikona houses and allows others', () => {
    expect(isAshtottariEligibleByHouse(1)).toBe(false);
    expect(isAshtottariEligibleByHouse(4)).toBe(false);
    expect(isAshtottariEligibleByHouse(5)).toBe(false);
    expect(isAshtottariEligibleByHouse(7)).toBe(false);
    expect(isAshtottariEligibleByHouse(9)).toBe(false);
    expect(isAshtottariEligibleByHouse(10)).toBe(false);
    expect(isAshtottariEligibleByHouse(2)).toBe(true);
    expect(isAshtottariEligibleByHouse(11)).toBe(true);
  });

  it('computes Rahu house from ascendant', () => {
    expect(getRahuHouseFromAsc(1, 1)).toBe(1);
    expect(getRahuHouseFromAsc(1, 10)).toBe(10);
    expect(getRahuHouseFromAsc(12, 1)).toBe(2);
  });
});

describe('ashtottari mapping', () => {
  it('maps all 27 nakshatras and starts from Ardra with Sun', () => {
    const rulers = getAshtottariNakshatraRulers();
    expect(Object.keys(rulers)).toHaveLength(27);
    expect(rulers.Ardra).toBe('Sun');
    expect(rulers.Punarvasu).toBe('Sun');
    expect(rulers.Shatabhisha).toBe('Jupiter');
    expect(rulers.Ashwini).toBe('Rahu');
    expect(rulers.Mrigashira).toBe('Venus');
  });
});

describe('ashtottari paksha and day/night condition', () => {
  it('derives paksha from solar-lunar separation', () => {
    expect(getPakshaFromLongitudes(10, 100)).toBe('Shukla');
    expect(getPakshaFromLongitudes(10, 220)).toBe('Krishna');
  });

  it('applies day+Krishna and night+Shukla eligibility rule', () => {
    const dayJd = 2451545;
    const nightJd = 2451545.6;
    expect(isDayBirth(dayJd, 0)).toBe(true);
    expect(isDayBirth(nightJd, 0)).toBe(false);
    expect(isAshtottariEligibleByPakshaAndTime(dayJd, 0, 10, 220)).toBe(true);
    expect(isAshtottariEligibleByPakshaAndTime(dayJd, 0, 10, 100)).toBe(false);
    expect(isAshtottariEligibleByPakshaAndTime(nightJd, 0, 10, 100)).toBe(true);
    expect(isAshtottariEligibleByPakshaAndTime(nightJd, 0, 10, 220)).toBe(false);
  });
});

describe('ashtottari Uttara Ashadha and Abhijit handling', () => {
  const toMonths = (value: { years: number; months: number; days: number }) =>
    value.years * 12 + value.months + value.days / 30;

  it('matches the reference example in Uttara Ashadha first three padas', () => {
    const moonLongitude = UTTARA_ASHADHA_START + (24 / 48) * (3 * PADA_SIZE);
    const result = computeAshtottariDasha(2451545, moonLongitude);
    expect(result.startPlanet).toBe('Saturn');
    expect(Math.abs(toMonths(result.balance) - 75)).toBeLessThan(0.05);
  });

  it('is continuous at Uttara Ashadha to Abhijit boundary', () => {
    const justBefore = computeAshtottariDasha(2451545, UTTARA_ASHADHA_START + 3 * PADA_SIZE - 1e-7);
    const atBoundary = computeAshtottariDasha(2451545, UTTARA_ASHADHA_START + 3 * PADA_SIZE);
    const deltaMonths = Math.abs(toMonths(justBefore.balance) - toMonths(atBoundary.balance));
    expect(deltaMonths).toBeLessThan(0.05);
  });
});
