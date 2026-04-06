import { describe, it, expect } from 'vitest';
import { julianDay, lahiriAyanamsa, sunLongitude, moonLongitude, computeAscendant } from '../src/astronomy';

const expectWithin = (actual: number, expected: number, tolerance: number) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
};

const OCTOBER_2002_HOUR = 17 + 10 / 60;
const OCTOBER_2002_JD = julianDay(2002, 10, 6, OCTOBER_2002_HOUR);
const OCTOBER_2002_D = OCTOBER_2002_JD - 2451543.5;

describe('julianDay', () => {
  it('returns J2000.0 for 2000-01-01 12:00 UTC', () => {
    expect(julianDay(2000, 1, 1, 12)).toBeCloseTo(2451545.0, 4);
  });

  it('returns the expected JD for 2002-10-06 17:10:00 UTC', () => {
    expect(OCTOBER_2002_JD).toBeCloseTo(2452554.215277778, 6);
  });
});

describe('lahiriAyanamsa', () => {
  it('matches Swiss Ephemeris Lahiri at J2000.0 within 0.01 degrees', () => {
    // Swiss Ephemeris (SE_SIDM_LAHIRI, UT): 23.857092 deg
    expectWithin(lahiriAyanamsa(2451545.0), 23.857092, 0.01);
  });

  it('matches Swiss Ephemeris Lahiri at 1950-01-01 within 0.01 degrees', () => {
    // Swiss Ephemeris (SE_SIDM_LAHIRI, UT): 23.158725 deg
    expectWithin(lahiriAyanamsa(2433282.5), 23.158725, 0.01);
  });
});

describe('sunLongitude', () => {
  it('matches Swiss Ephemeris tropical longitude on 2002-10-06 17:10 UTC within 0.01 degrees', () => {
    // Swiss Ephemeris calc_ut() with Moshier fallback: 193.273099 deg
    expectWithin(sunLongitude(OCTOBER_2002_D).lon, 193.273099, 0.01);
  });
});

describe('moonLongitude', () => {
  it('matches Swiss Ephemeris tropical longitude on 2002-10-06 17:10 UTC within 0.05 degrees', () => {
    // Swiss Ephemeris calc_ut() with Moshier fallback: 196.780130 deg
    expectWithin(moonLongitude(OCTOBER_2002_D).lon, 196.78013, 0.05);
  });
});

describe('computeAscendant', () => {
  it('matches Swiss Ephemeris tropical ascendant for Thessaloniki on 2002-10-06 17:10 UTC within 0.05 degrees', () => {
    // Swiss Ephemeris swe_houses_ex(): 42.196968 deg
    expectWithin(computeAscendant(OCTOBER_2002_JD, 40.38, 23.43), 42.196968, 0.05);
  });

  it('matches Swiss Ephemeris tropical ascendant at the equator and prime meridian for J2000.0 within 0.05 degrees', () => {
    // Swiss Ephemeris swe_houses_ex(): 11.375507 deg
    expectWithin(computeAscendant(julianDay(2000, 1, 1, 12), 0, 0), 11.375507, 0.05);
  });
});
