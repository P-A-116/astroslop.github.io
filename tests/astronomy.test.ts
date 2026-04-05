import { describe, it, expect } from 'vitest';
import { julianDay, lahiriAyanamsa, sunLongitude, moonLongitude, computeAscendant } from '../src/astronomy';

describe('julianDay', () => {
  it('returns J2000.0 for 2000-01-01 12:00 UTC', () => {
    expect(julianDay(2000, 1, 1, 12)).toBeCloseTo(2451545.0, 4);
  });

  it('returns correct JD for 2002-10-06 17:10:00 UTC', () => {
    const hour = 17 + 10 / 60;
    const jd = julianDay(2002, 10, 6, hour);
    expect(jd).toBeGreaterThan(2452554);
    expect(jd).toBeLessThan(2452555);
  });
});

describe('lahiriAyanamsa', () => {
  it('returns approximately 23.85° at J2000.0', () => {
    const ayanamsa = lahiriAyanamsa(2451545.0);
    expect(ayanamsa).toBeGreaterThan(23.5);
    expect(ayanamsa).toBeLessThan(24.2);
  });

  it('is larger at a later epoch than at J1900.0', () => {
    const jd1900 = julianDay(1900, 1, 0, 12);
    const jd2000 = julianDay(2000, 1, 1, 12);
    expect(lahiriAyanamsa(jd2000)).toBeGreaterThan(lahiriAyanamsa(jd1900));
  });

  it('applies polynomial correction (quadratic term)', () => {
    const T = 1.0; // 1 Julian century after 1900
    const jd = 2415020 + T * 36525;
    const expected = 22.460148 + T * (1.396042 + T * 0.000308084);
    expect(lahiriAyanamsa(jd)).toBeCloseTo(expected, 6);
  });
});

describe('sunLongitude', () => {
  it('returns a longitude in [0, 360)', () => {
    const d = 0; // J2000.0 epoch day number
    const { lon } = sunLongitude(d);
    expect(lon).toBeGreaterThanOrEqual(0);
    expect(lon).toBeLessThan(360);
  });

  it('returns a valid longitude for a known date (2002-10-06)', () => {
    const d = julianDay(2002, 10, 6, 17 + 10 / 60) - 2451543.5;
    const { lon } = sunLongitude(d);
    expect(lon).toBeGreaterThanOrEqual(0);
    expect(lon).toBeLessThan(360);
  });
});

describe('moonLongitude', () => {
  it('returns a longitude in [0, 360)', () => {
    const d = 0;
    const { lon } = moonLongitude(d);
    expect(lon).toBeGreaterThanOrEqual(0);
    expect(lon).toBeLessThan(360);
  });

  it('returns a different longitude from the sun', () => {
    const d = 100;
    const { lon: moonLon } = moonLongitude(d);
    const { lon: sunLon } = sunLongitude(d);
    expect(moonLon).not.toBeCloseTo(sunLon, 0);
  });
});

describe('computeAscendant', () => {
  it('returns a longitude in [0, 360)', () => {
    const jd = julianDay(2002, 10, 6, 17 + 10 / 60);
    const asc = computeAscendant(jd, 40.38, 23.43);
    expect(asc).toBeGreaterThanOrEqual(0);
    expect(asc).toBeLessThan(360);
  });

  it('produces different ascendants for different latitudes', () => {
    const jd = julianDay(2002, 10, 6, 12);
    const asc1 = computeAscendant(jd, 0, 0);
    const asc2 = computeAscendant(jd, 45, 0);
    expect(asc1).not.toBeCloseTo(asc2, 0);
  });
});
