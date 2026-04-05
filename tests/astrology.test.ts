import { describe, it, expect } from 'vitest';
import {
  buildChartData,
  getNakshatraPada,
  signToHouse,
  getCompoundRelationship,
  sphutaDrishti,
  getD24Sign,
} from '../src/astrology';

describe('buildChartData', () => {
  it('returns a valid ChartData object with expected keys', () => {
    const data = buildChartData({
      year: 2002,
      month: 10,
      day: 6,
      hour: 17 + 10 / 60,
      lat: 40.38,
      lon: 23.43,
    });

    expect(data).toBeDefined();
    expect(typeof data.ayanamsa).toBe('number');
    expect(typeof data.ascSign).toBe('number');
    expect(data.ascSign).toBeGreaterThanOrEqual(1);
    expect(data.ascSign).toBeLessThanOrEqual(12);
    expect(typeof data.ascDeg).toBe('number');
    expect(data.ascDeg).toBeGreaterThanOrEqual(0);
    expect(data.ascDeg).toBeLessThan(30);
    expect(Array.isArray(data.planetData)).toBe(true);
    expect(data.planetData.length).toBe(9);
    expect(data.positions).toBeDefined();
    expect(data.positions.Sun).toBeDefined();
    expect(data.positions.Moon).toBeDefined();
  });

  it('produces ascendant in valid sign range', () => {
    const data = buildChartData({ year: 2000, month: 1, day: 1, hour: 12, lat: 0, lon: 0 });
    expect(data.ascSign).toBeGreaterThanOrEqual(1);
    expect(data.ascSign).toBeLessThanOrEqual(12);
  });
});

describe('getNakshatraPada', () => {
  it('returns nakshatra and pada for longitude 0', () => {
    const result = getNakshatraPada(0);
    expect(result.nakshatra).toBeDefined();
    expect(result.pada).toBeGreaterThanOrEqual(1);
    expect(result.pada).toBeLessThanOrEqual(4);
  });

  it('returns correct nakshatra for known longitude', () => {
    // Ashwini starts at 0°, each nakshatra spans 13°20' (40/3 degrees)
    const result = getNakshatraPada(0);
    expect(result.nakshatra).toBe('Ashwini');
    expect(result.pada).toBe(1);
  });

  it('returns pada 4 at the end of a nakshatra', () => {
    // Just under 13.333° stays in Ashwini
    const result = getNakshatraPada(13);
    expect(result.nakshatra).toBe('Ashwini');
    expect(result.pada).toBe(4);
  });

  it('moves to second nakshatra after 13.333 degrees', () => {
    const result = getNakshatraPada(40 / 3 + 0.01);
    expect(result.nakshatra).toBe('Bharani');
  });
});

describe('signToHouse', () => {
  it('returns 1 when planet sign equals ascendant sign', () => {
    expect(signToHouse(1, 1)).toBe(1);
    expect(signToHouse(5, 5)).toBe(1);
  });

  it('returns correct house number for signs ahead of ascendant', () => {
    expect(signToHouse(3, 1)).toBe(3);
    expect(signToHouse(12, 1)).toBe(12);
  });

  it('wraps around correctly', () => {
    expect(signToHouse(1, 12)).toBe(2);
    expect(signToHouse(1, 2)).toBe(12);
  });
});

describe('getCompoundRelationship', () => {
  it('Friend + Friend = Extreme Friendship', () => {
    expect(getCompoundRelationship('Friend', 'Friend')).toBe('Extreme Friendship');
  });

  it('Neutral + Friend = Friendship', () => {
    expect(getCompoundRelationship('Neutral', 'Friend')).toBe('Friendship');
  });

  it('Enemy + Enemy = Extreme Enmity', () => {
    expect(getCompoundRelationship('Enemy', 'Enemy')).toBe('Extreme Enmity');
  });

  it('Neutral + Enemy = Enmity', () => {
    expect(getCompoundRelationship('Neutral', 'Enemy')).toBe('Enmity');
  });

  it('Friend + Enemy = Neutral', () => {
    expect(getCompoundRelationship('Friend', 'Enemy')).toBe('Neutral');
  });
});

describe('getD24Sign', () => {
  it('odd sign at degree 0 starts from Leo (5)', () => {
    // Aries=1 (odd), deg=0 → partition 0 → advanceSign(5, 0) = 5 (Leo)
    expect(getD24Sign(1, 0)).toBe(5);
  });

  it('even sign at degree 0 starts from Cancer (4)', () => {
    // Taurus=2 (even), deg=0 → partition 0 → advanceSign(4, 0) = 4 (Cancer)
    expect(getD24Sign(2, 0)).toBe(4);
  });

  it('odd sign at degree near end (28.75) gives Cancer (4)', () => {
    // partition 23 → advanceSign(5, 23) = advanceSign(5, 23%12=11) = 4 (Cancer)
    expect(getD24Sign(1, 28.75)).toBe(4);
  });

  it('even sign at degree near end (28.75) gives Gemini (3)', () => {
    // partition 23 → advanceSign(4, 23) = advanceSign(4, 11) = 3 (Gemini)
    expect(getD24Sign(2, 28.75)).toBe(3);
  });

  it('odd sign mid-range cycles correctly', () => {
    // Aries=1, deg=15 → partition 12 → advanceSign(5, 12) = advanceSign(5, 0) = 5 (Leo)
    expect(getD24Sign(1, 15)).toBe(5);
    // Aries=1, deg=1.25 → partition 1 → advanceSign(5, 1) = 6 (Virgo)
    expect(getD24Sign(1, 1.25)).toBe(6);
  });

  it('even sign mid-range cycles correctly', () => {
    // Taurus=2, deg=15 → partition 12 → advanceSign(4, 12) = advanceSign(4, 0) = 4 (Cancer)
    expect(getD24Sign(2, 15)).toBe(4);
    // Taurus=2, deg=1.25 → partition 1 → advanceSign(4, 1) = 5 (Leo)
    expect(getD24Sign(2, 1.25)).toBe(5);
  });
});

describe('sphutaDrishti', () => {
  it('returns null or a number', () => {
    const result = sphutaDrishti('Sun', 'Moon', 0, 90);
    expect(result === null || typeof result === 'number').toBe(true);
  });

  it('returns a value in a reasonable range when not null', () => {
    const result = sphutaDrishti('Sun', 'Moon', 0, 180);
    if (result !== null) {
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(60);
    }
  });

  it('Mars has full aspect (60 virupas) at 180 degrees', () => {
    const result = sphutaDrishti('Mars', 'Moon', 0, 180);
    expect(result).toBe(60);
  });

  it('returns 0 for default planets at 0 degrees separation', () => {
    const result = sphutaDrishti('Sun', 'Moon', 0, 0);
    expect(result).toBe(0);
  });
});
