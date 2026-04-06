import { describe, it, expect } from 'vitest';
import {
  buildChartData,
  getNakshatraPada,
  signToHouse,
  getCompoundRelationship,
  sphutaDrishti,
  getD24Sign,
  getDivisionalDeity,
} from '../src/astrology';

const expectWithin = (actual: number, expected: number, tolerance: number) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
};

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

  it('matches the expected sidereal Sun longitude and sign on 2002-10-06 17:10 UTC', () => {
    const data = buildChartData({
      year: 2002,
      month: 10,
      day: 6,
      hour: 17 + 10 / 60,
      lat: 40.38,
      lon: 23.43,
    });

    // Swiss-backed tropical Sun minus Swiss-backed Lahiri ayanamsa: 169.377409 deg
    expectWithin(data.positions.Sun.lon, 169.377409, 0.05);
    expect(data.positions.Sun.sign).toBe(6);
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

describe('getDivisionalDeity', () => {
  it('returns D3 deities by decanate', () => {
    expect(getDivisionalDeity('D3', 2, 0)).toBe('Narada');
    expect(getDivisionalDeity('D3', 2, 10)).toBe('Agasthya');
    expect(getDivisionalDeity('D3', 2, 23.5)).toBe('Doorvasa');
  });

  it('reverses the D7 order in even signs', () => {
    expect(getDivisionalDeity('D7', 1, 0)).toBe('Kshaara');
    expect(getDivisionalDeity('D7', 2, 0)).toBe('Suddha Jala');
  });

  it('uses sign modality for D9', () => {
    expect(getDivisionalDeity('D9', 1, 0)).toBe('Deva');
    expect(getDivisionalDeity('D9', 2, 0)).toBe('Manushya');
    expect(getDivisionalDeity('D9', 3, 0)).toBe('Rakshasa');
  });

  it('reverses the D10 order in even signs', () => {
    expect(getDivisionalDeity('D10', 1, 0)).toBe('Indra');
    expect(getDivisionalDeity('D10', 2, 0)).toBe('Anantha');
  });

  it('uses the requested D12 quarter mapping', () => {
    expect(getDivisionalDeity('D12', 5, 0)).toBe('Ganesa');
    expect(getDivisionalDeity('D12', 5, 8)).toBe('Aswini Kumara');
    expect(getDivisionalDeity('D12', 5, 16)).toBe('Yama');
    expect(getDivisionalDeity('D12', 5, 24)).toBe('Sarpa');
  });

  it('reverses the D16 order in even signs', () => {
    expect(getDivisionalDeity('D16', 1, 0)).toBe('Brahma');
    expect(getDivisionalDeity('D16', 2, 0)).toBe('Sun');
  });

  it('uses distinct odd and even deity lists for D20', () => {
    expect(getDivisionalDeity('D20', 1, 0)).toBe('Kaali');
    expect(getDivisionalDeity('D20', 2, 0)).toBe('Daya');
    expect(getDivisionalDeity('D20', 2, 29.9)).toBe('Aparajita');
  });

  it('uses the source sign and source degree for D20 when provided', () => {
    expect(getDivisionalDeity('D20', 2, 14, 1, 0.2)).toBe('Kaali');
    expect(getDivisionalDeity('D20', 1, 0.2, 2, 0.2)).toBe('Daya');
    expect(getDivisionalDeity('D20', 1, 0.2, 1, 7.6)).toBe('Vimala');
  });

  it('reverses the D24 order in even signs', () => {
    expect(getDivisionalDeity('D24', 1, 0)).toBe('Skanda');
    expect(getDivisionalDeity('D24', 2, 0)).toBe('Bhima');
  });

  it('reverses the D27 order in even signs', () => {
    expect(getDivisionalDeity('D27', 1, 0)).toBe('Dastra (Aswini Kumara)');
    expect(getDivisionalDeity('D27', 2, 0)).toBe('Pusha');
  });

  it('reverses the D30 order in even signs', () => {
    expect(getDivisionalDeity('D30', 1, 0)).toBe('Agni');
    expect(getDivisionalDeity('D30', 2, 0)).toBe('Varuna');
  });

  it('uses the D40 twelve-deity sequence', () => {
    expect(getDivisionalDeity('D40', 7, 0)).toBe('Vishnu');
    expect(getDivisionalDeity('D40', 7, 27.5)).toBe('Varuna');
  });

  it('cycles the D45 deity order across 45 subdivisions', () => {
    expect(getDivisionalDeity('D45', 1, 0)).toBe('Brahma');
    expect(getDivisionalDeity('D45', 1, 1)).toBe('Siva');
    expect(getDivisionalDeity('D45', 2, 0)).toBe('Siva');
    expect(getDivisionalDeity('D45', 3, 0)).toBe('Vishnu');
  });

  it('uses the source sign modality for D45 when provided', () => {
    expect(getDivisionalDeity('D45', 2, 0, 1, 0)).toBe('Brahma');
    expect(getDivisionalDeity('D45', 1, 0, 2, 0)).toBe('Siva');
    expect(getDivisionalDeity('D45', 1, 0, 3, 0.8)).toBe('Brahma');
  });

  it('returns null for charts without a configured deity table', () => {
    expect(getDivisionalDeity('D1', 1, 0)).toBeNull();
    expect(getDivisionalDeity('D2', 1, 0)).toBeNull();
    expect(getDivisionalDeity('D60', 1, 0)).toBeNull();
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
