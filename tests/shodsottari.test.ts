import { describe, expect, it } from 'vitest';
import {
  computeShodsottariDasha,
  getShodsottariStartPlanet,
  isShodsottariEligible,
  SHODSOTTARI_ORDER,
} from '../src/shodsottari';

describe('shodsottari eligibility', () => {
  it('requires Cancer D2 with Krishna or Leo D2 with Shukla', () => {
    expect(isShodsottariEligible(4, 'Krishna')).toBe(true);
    expect(isShodsottariEligible(5, 'Shukla')).toBe(true);
    expect(isShodsottariEligible(4, 'Shukla')).toBe(false);
    expect(isShodsottariEligible(5, 'Krishna')).toBe(false);
    expect(isShodsottariEligible(1, 'Krishna')).toBe(false);
  });
});

describe('shodottari start and timeline', () => {
  it('starts from Sun for Pushya and excludes Rahu', () => {
    const pushyaStart = 7 * (360 / 27);
    expect(getShodsottariStartPlanet(pushyaStart)).toBe('Sun');
    const result = computeShodsottariDasha(2451545, pushyaStart + 1);
    expect(result.timeline).toHaveLength(8);
    expect(result.timeline.some((entry) => entry.planet === ('Rahu' as never))).toBe(false);
  });

  it('uses canonical Shodsottari order after start planet', () => {
    const pushyaStart = 7 * (360 / 27);
    const result = computeShodsottariDasha(2451545, pushyaStart);
    const planets = result.timeline.map((entry) => entry.planet);
    expect(planets).toEqual(SHODSOTTARI_ORDER);
  });
});
