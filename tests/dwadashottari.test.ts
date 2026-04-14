import { describe, expect, it } from 'vitest';
import {
  computeDwadashottariDasha,
  DWADASHOTTARI_ORDER,
  getDwadashottariStartPlanet,
  isDwadashottariEligible,
} from '../src/dashaVariants';

const NAKSHATRA_SIZE = 360 / 27;

describe('dwadashottari eligibility', () => {
  it('requires D9 ascendant in Taurus or Libra', () => {
    expect(isDwadashottariEligible(2)).toBe(true);
    expect(isDwadashottariEligible(7)).toBe(true);
    expect(isDwadashottariEligible(1)).toBe(false);
    expect(isDwadashottariEligible(10)).toBe(false);
  });
});

describe('dwadashottari start planet', () => {
  it('counts from Janma Nakshatra to Revati and maps remainder to the 8-planet order', () => {
    expect(getDwadashottariStartPlanet(0)).toBe('Ketu'); // Ashwini -> 27 -> remainder 3
    expect(getDwadashottariStartPlanet(25 * NAKSHATRA_SIZE)).toBe('Jupiter'); // Uttara Bhadrapada -> 2
    expect(getDwadashottariStartPlanet(26 * NAKSHATRA_SIZE)).toBe('Sun'); // Revati -> 1
  });
});

describe('dwadashottari timeline', () => {
  it('uses the canonical order and omits Venus', () => {
    const result = computeDwadashottariDasha(2451545, 26 * NAKSHATRA_SIZE);
    const planets = result.timeline.map((entry) => entry.planet);
    expect(planets).toEqual(DWADASHOTTARI_ORDER);
    expect(planets.includes('Venus' as never)).toBe(false);
  });

  it('computes birth balance from bhayat and bhabhoga like Vimshottari', () => {
    const revatiStart = 26 * NAKSHATRA_SIZE;
    const moonLongitude = revatiStart + NAKSHATRA_SIZE / 2;
    const result = computeDwadashottariDasha(2451545, moonLongitude);

    expect(result.startPlanet).toBe('Sun');
    expect(result.balance.years).toBe(3);
    expect(result.balance.months).toBe(6);
    expect(result.elapsed.years).toBe(3);
    expect(result.elapsed.months).toBe(6);
  });
});
