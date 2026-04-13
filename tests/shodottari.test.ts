import { describe, expect, it } from 'vitest';
import {
  computeShodottariDasha,
  getShodottariStartPlanet,
  isShodottariEligible,
  SHODOTTARI_ORDER,
} from '../src/shodottari';

describe('shodottari eligibility', () => {
  it('requires Cancer D2 with Krishna or Leo D2 with Shukla', () => {
    expect(isShodottariEligible(4, 'Krishna')).toBe(true);
    expect(isShodottariEligible(5, 'Shukla')).toBe(true);
    expect(isShodottariEligible(4, 'Shukla')).toBe(false);
    expect(isShodottariEligible(5, 'Krishna')).toBe(false);
    expect(isShodottariEligible(1, 'Krishna')).toBe(false);
  });
});

describe('shodottari start and timeline', () => {
  it('starts from Sun for Pushya and excludes Rahu', () => {
    const pushyaStart = 7 * (360 / 27);
    expect(getShodottariStartPlanet(pushyaStart)).toBe('Sun');
    const result = computeShodottariDasha(2451545, pushyaStart + 1);
    expect(result.timeline).toHaveLength(8);
    expect(result.timeline.some((entry) => entry.planet === ('Rahu' as never))).toBe(false);
  });

  it('uses canonical Shodottari order after start planet', () => {
    const pushyaStart = 7 * (360 / 27);
    const result = computeShodottariDasha(2451545, pushyaStart);
    const planets = result.timeline.map((entry) => entry.planet);
    expect(planets).toEqual(SHODOTTARI_ORDER);
  });
});
