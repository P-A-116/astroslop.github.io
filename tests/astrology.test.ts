import { describe, it, expect } from 'vitest';
import {
  buildChartData,
  computeArudhaPada,
  computeGrahaArudhas,
  getArudhasForAllCharts,
  getArudhaLagna,
  getArudhaPada,
  getArudhaPadas,
  getGrahaArudhas,
  getNakshatraPada,
  signToHouse,
  getCompoundRelationship,
  getCharaKarakas,
  getTemporaryRelationship,
  sphutaDrishti,
  getD24Sign,
  getDivisionalDeity,
  getNakshatraName,
  isCombust,
  buildChartDataFromLocalInput,
  getDivisionalLongitudes,
  getDivisionalCombustion,
  DIVISIONAL_CHARTS,
} from '../src/astrology';
import { PLANET_LIST, SIGN_LORDS } from '../src/constants';
import type { ChartData, DivisionalChart, DivisionalPlacement, MotionType, PlanetData, PlanetName } from '../src/types';

const expectWithin = (actual: number, expected: number, tolerance: number) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
};

function makeDivisional(sign: number, house: number): Record<DivisionalChart, DivisionalPlacement> {
  const result = {} as Record<DivisionalChart, DivisionalPlacement>;
  for (const { chart } of DIVISIONAL_CHARTS) result[chart] = { sign, house };
  return result;
}

function makeAscDivisional(ascSign: number): Record<DivisionalChart, number> {
  const result = {} as Record<DivisionalChart, number>;
  for (const { chart } of DIVISIONAL_CHARTS) result[chart] = ascSign;
  return result;
}

const makePlanet = (
  ascSign: number,
  name: PlanetName,
  sign: number,
  motion: MotionType = 'Direct',
): PlanetData => {
  const house = signToHouse(sign, ascSign);
  return {
    name,
    lon: (sign - 1) * 30,
    sign,
    deg: 0,
    motion,
    divisional: makeDivisional(sign, house),
    d60Shashtiamsa: { number: 1, name: 'Ghora', nature: 'M', description: 'stub' },
    lordships: [],
    role: 'Unknown',
    combust: false,
    nakshatra: 'Ashwini',
    pada: 1,
    nakLord: 'Ketu',
    signLord: SIGN_LORDS[sign - 1],
    karaka: null,
  };
};

const makeChartData = (
  ascSign: number,
  placements: Partial<Record<PlanetName, { sign: number; motion?: MotionType }>>,
): ChartData => {
  const planetData = PLANET_LIST.map((planet) => {
    const placement = placements[planet] ?? { sign: 1 };
    return makePlanet(ascSign, planet, placement.sign, placement.motion);
  });

  return {
    jd: 0,
    lat: 0,
    lon: 0,
    ayanamsa: 0,
    ascSid: (ascSign - 1) * 30,
    ascSign,
    ascDeg: 0,
    arudhaLagna: computeArudhaPada(ascSign, (placements[SIGN_LORDS[ascSign - 1]] ?? { sign: ascSign }).sign),
    ascDivisional: makeAscDivisional(ascSign),
    ascNak: 'Ashwini',
    ascPada: 1,
    positions: Object.fromEntries(
      planetData.map((planet) => [
        planet.name,
        { lon: planet.lon, sign: planet.sign, deg: planet.deg, motion: planet.motion },
      ]),
    ) as ChartData['positions'],
    planetData,
    karakas: {},
    upagrahas: { dhooma: 0, vyatipata: 0, parivesha: 0, chapa: 0, upaketu: 0 },
    upagrahasFormatted: {
      dhooma: { sign: 'Aries', degrees: 0, minutes: 0, text: "Aries 0deg 0'" },
      vyatipata: { sign: 'Aries', degrees: 0, minutes: 0, text: "Aries 0deg 0'" },
      parivesha: { sign: 'Aries', degrees: 0, minutes: 0, text: "Aries 0deg 0'" },
      chapa: { sign: 'Aries', degrees: 0, minutes: 0, text: "Aries 0deg 0'" },
      upaketu: { sign: 'Aries', degrees: 0, minutes: 0, text: "Aries 0deg 0'" },
    },
  };
};

describe('buildChartData', () => {
  it('returns a valid ChartData object with expected keys', () => {
    const data = buildChartData({ year: 2002, month: 10, day: 6, hour: 17 + 10 / 60, lat: 40.38, lon: 23.43 });
    expect(data).toBeDefined();
    expect(typeof data.ayanamsa).toBe('number');
    expect(data.ascSign).toBeGreaterThanOrEqual(1);
    expect(data.ascSign).toBeLessThanOrEqual(12);
    expect(data.ascDeg).toBeGreaterThanOrEqual(0);
    expect(data.ascDeg).toBeLessThan(30);
    expect(data.arudhaLagna).toBeGreaterThanOrEqual(1);
    expect(data.arudhaLagna).toBeLessThanOrEqual(12);
    expect(data.planetData.length).toBe(9);
    expect(data.positions.Sun).toBeDefined();
    expect(data.ascDivisional).toBeDefined();
    expect(data.ascDivisional.D1).toBe(data.ascSign);
    // Every planet has a divisional record
    for (const p of data.planetData) {
      expect(p.divisional.D1.sign).toBe(p.sign);
    }
  });

  it('matches the expected sidereal Sun longitude and sign on 2002-10-06 17:10 UTC', () => {
    const data = buildChartData({ year: 2002, month: 10, day: 6, hour: 17 + 10 / 60, lat: 40.38, lon: 23.43 });
    expectWithin(data.positions.Sun.lon, 169.377409, 0.05);
    expect(data.positions.Sun.sign).toBe(6);
  });

  it('rejects invalid numeric input ranges explicitly', () => {
    expect(() => buildChartData({ year: 2002, month: 10, day: 6, hour: 17.1, lat: 95, lon: 23.43 })).toThrow('Latitude must be between -90 and 90.');
    expect(() => buildChartData({ year: 2002, month: 10, day: 6, hour: 17.1, lat: 40.38, lon: -181 })).toThrow('Longitude must be between -180 and 180.');
    expect(() => buildChartData({ year: 2002, month: 2, day: 30, hour: 17.1, lat: 40.38, lon: 23.43 })).toThrow('Day is out of range for the given month and year.');
  });

  it('handles date-crossover UTC boundaries without instability', () => {
    const caseA = buildChartData({ year: 2025, month: 12, day: 31, hour: 23 + 59 / 60 + 59 / 3600, lat: 40.38, lon: 23.43 });
    const caseB = buildChartData({ year: 2026, month: 1, day: 1, hour: 0, lat: 40.38, lon: 23.43 });
    expectWithin(caseB.jd - caseA.jd, 1 / 86400, 1e-9);
  });
});

describe('buildChartDataFromLocalInput', () => {
  it('converts local time with half-hour offset to equivalent UTC chart', () => {
    const viaLocal = buildChartDataFromLocalInput({ date: '2026-01-01', time: '00:30:00', tzOffsetHours: 5.5, lat: 40.38, lon: 23.43 });
    const directUtc = buildChartData({ year: 2025, month: 12, day: 31, hour: 19, lat: 40.38, lon: 23.43 });
    expect(viaLocal.utcStr).toBe('2025-12-31 19:00:00 UTC');
    expectWithin(viaLocal.data.jd, directUtc.jd, 1e-9);
  });

  it('handles +14 and -12 offsets at day boundaries', () => {
    expect(buildChartDataFromLocalInput({ date: '2026-01-01', time: '00:00:00', tzOffsetHours: 14, lat: 40.38, lon: 23.43 }).utcStr).toBe('2025-12-31 10:00:00 UTC');
    expect(buildChartDataFromLocalInput({ date: '2026-01-01', time: '23:59:59', tzOffsetHours: -12, lat: 40.38, lon: 23.43 }).utcStr).toBe('2026-01-02 11:59:59 UTC');
  });

  it('rejects malformed local inputs without silent rollover', () => {
    expect(() => buildChartDataFromLocalInput({ date: '2026-13-40', time: '10:00:00', tzOffsetHours: 3, lat: 40.38, lon: 23.43 })).toThrow('Month must be an integer from 1 to 12.');
    expect(() => buildChartDataFromLocalInput({ date: '2026-02-30', time: '10:00:00', tzOffsetHours: 3, lat: 40.38, lon: 23.43 })).toThrow('Day is out of range for the given month and year.');
    expect(() => buildChartDataFromLocalInput({ date: '2026-01-01', time: '25:99:00', tzOffsetHours: 3, lat: 40.38, lon: 23.43 })).toThrow('Hour must be an integer from 0 to 23.');
  });

  it('rejects invalid timezone offsets', () => {
    expect(() => buildChartDataFromLocalInput({ date: '2026-01-01', time: '10:00:00', tzOffsetHours: 20, lat: 40.38, lon: 23.43 })).toThrow('Timezone offset must be between -12 and +14 hours.');
  });
});

describe('computeArudhaPada', () => {
  it('computes an ordinary pada using inclusive counting', () => { expect(computeArudhaPada(1, 3)).toBe(5); });
  it('moves to the 10th when the computed pada falls back in the house sign', () => { expect(computeArudhaPada(1, 7)).toBe(10); });
  it('moves to the 4th when the computed pada falls in the 7th from the house sign', () => { expect(computeArudhaPada(1, 4)).toBe(4); });
  it('wraps correctly across Pisces to Aries', () => { expect(computeArudhaPada(12, 1)).toBe(2); });
  it('treats the lord in the same sign as a self-placement and applies the 10th-house exception', () => { expect(computeArudhaPada(5, 5)).toBe(2); });
  it('handles a lord placed in the 7th sign', () => { expect(computeArudhaPada(5, 11)).toBe(2); });
});

describe('getArudhaPada', () => {
  it('computes Arudha Lagna from the chart ascendant and Lagna lord sign', () => {
    const data = makeChartData(1, { Mars: { sign: 3 } });
    expect(getArudhaLagna(data)).toBe(5);
    expect(getArudhaPada(data, 1)).toBe(5);
  });
  it('returns all 12 Arudha padas', () => {
    const data = makeChartData(1, { Mars: { sign: 3 }, Venus: { sign: 3 }, Mercury: { sign: 5 }, Moon: { sign: 4 }, Sun: { sign: 5 }, Jupiter: { sign: 9 }, Saturn: { sign: 10 } });
    expect(getArudhaPadas(data)).toHaveLength(12);
  });
  it('computes Arudha padas independently for each divisional chart', () => {
    const data = makeChartData(1, { Mars: { sign: 3 } });
    const mars = data.planetData.find(({ name }) => name === 'Mars')!;
    data.ascDivisional.D9 = 1;
    mars.divisional.D9 = { sign: 2, house: 2 };
    expect(getArudhaPadas(data, 'D1')[0]).toBe(5);
    expect(getArudhaPadas(data, 'D9')[0]).toBe(3);
  });
  it('returns Arudha sets for all 16 supported charts', () => {
    const data = makeChartData(1, { Mars: { sign: 3 } });
    const allCharts = getArudhasForAllCharts(data);
    expect(Object.keys(allCharts)).toHaveLength(16);
  });
  it('ignores retrograde state', () => {
    const direct = makeChartData(1, { Mars: { sign: 4, motion: 'Direct' } });
    const retrograde = makeChartData(1, { Mars: { sign: 4, motion: 'Retrograde' } });
    expect(getArudhaLagna(direct)).toBe(4);
    expect(getArudhaLagna(retrograde)).toBe(4);
  });
});

describe('computeGrahaArudhas', () => {
  it('computes both graha arudhas for a dual-lord planet', () => { expect(computeGrahaArudhas(4, 'Mars', { Mars: [1, 8] })).toEqual([10, 12]); });
  it('computes a single graha arudha for a single-lord planet', () => { expect(computeGrahaArudhas(7, 'Sun', { Sun: [5] })).toEqual([3]); });
  it('wraps correctly across Pisces to Aries', () => { expect(computeGrahaArudhas(12, 'Mars', { Mars: [1, 8] })).toEqual([2, 4]); });
  it('returns null when ownership is missing', () => { expect(computeGrahaArudhas(5, 'Pluto', {})).toBeNull(); });
});

describe('getGrahaArudhas', () => {
  it('computes graha arudhas for all nine planets in D1', () => {
    const data = makeChartData(1, { Sun: { sign: 7 }, Moon: { sign: 10 }, Mars: { sign: 4 }, Mercury: { sign: 6 }, Jupiter: { sign: 9 }, Venus: { sign: 3 }, Saturn: { sign: 11 }, Rahu: { sign: 3 }, Ketu: { sign: 3 } });
    const result = getGrahaArudhas(data);
    expect(result.Sun).toEqual([3]);
    expect(result.Mars).toEqual([10, 12]);
  });
  it('uses the selected divisional chart signs', () => {
    const data = makeChartData(1, { Mars: { sign: 4 } });
    const mars = data.planetData.find(({ name }) => name === 'Mars')!;
    mars.divisional.D9 = { sign: 12, house: 12 };
    expect(getGrahaArudhas(data, 'D1').Mars).toEqual([10, 12]);
    expect(getGrahaArudhas(data, 'D9').Mars).toEqual([2, 4]);
  });
});

describe('getNakshatraPada', () => {
  it('returns correct nakshatra for known longitude', () => {
    expect(getNakshatraPada(0).nakshatra).toBe('Ashwini');
    expect(getNakshatraPada(0).pada).toBe(1);
  });
  it('returns pada 4 at the end of a nakshatra', () => { expect(getNakshatraPada(13).pada).toBe(4); });
  it('moves to second nakshatra after 13.333 degrees', () => { expect(getNakshatraPada(40 / 3 + 0.01).nakshatra).toBe('Bharani'); });
  it('normalizes negative longitude', () => {
    expect(getNakshatraPada(-0.1).nakshatra).toBe('Revati');
    expect(getNakshatraName(-0.1)).toBe('Revati');
  });
});

describe('divisional cusp boundaries', () => {
  it('D24 transitions exactly at subdivision boundaries', () => {
    expect(getD24Sign(1, 1.249999)).toBe(5);
    expect(getD24Sign(1, 1.25)).toBe(6);
  });
});

describe('isCombust threshold edges', () => {
  it('uses an exclusive threshold at the exact limit', () => {
    expect(isCombust('Mercury', 0, 13.9999, 'Direct')).toBe(true);
    expect(isCombust('Mercury', 0, 14, 'Direct')).toBe(false);
  });
});

describe('signToHouse', () => {
  it('returns 1 when planet sign equals ascendant sign', () => { expect(signToHouse(1, 1)).toBe(1); });
  it('wraps around correctly', () => { expect(signToHouse(1, 12)).toBe(2); });
});

describe('getCompoundRelationship', () => {
  it('Friend + Friend = Extreme Friendship', () => { expect(getCompoundRelationship('Friend', 'Friend')).toBe('Extreme Friendship'); });
  it('Enemy + Enemy = Extreme Enmity', () => { expect(getCompoundRelationship('Enemy', 'Enemy')).toBe('Extreme Enmity'); });
  it('Friend + Enemy = Neutral', () => { expect(getCompoundRelationship('Friend', 'Enemy')).toBe('Neutral'); });
});

describe('getTemporaryRelationship', () => {
  it('matches the canonical 12-house temporary relationship mapping', () => {
    const expected: Record<number, 'Friend' | 'Enemy'> = { 1: 'Enemy', 2: 'Friend', 3: 'Friend', 4: 'Friend', 5: 'Enemy', 6: 'Enemy', 7: 'Enemy', 8: 'Enemy', 9: 'Enemy', 10: 'Friend', 11: 'Friend', 12: 'Friend' };
    for (let toSign = 1; toSign <= 12; toSign++) expect(getTemporaryRelationship(1, toSign)).toBe(expected[toSign]);
  });
});

describe('getCharaKarakas', () => {
  it('ranks using degrees within sign', () => {
    const makePos = (lon: number) => ({ lon, sign: Math.floor(lon / 30) + 1, deg: lon % 30, motion: 'Direct' as const });
    const karakas = getCharaKarakas({ Sun: makePos(29), Moon: makePos(58), Mars: makePos(57), Mercury: makePos(56), Jupiter: makePos(55), Venus: makePos(54), Saturn: makePos(53), Rahu: makePos(10), Ketu: makePos(190) });
    expect(karakas.Sun).toBe('Atmakaraka');
    expect(karakas.Saturn).toBe('Darakaraka');
  });
});

describe('getDivisionalDeity', () => {
  it('returns D3 deities by decanate', () => { expect(getDivisionalDeity('D3', 2, 0)).toBe('Narada'); });
  it('reverses the D7 order in even signs', () => { expect(getDivisionalDeity('D7', 2, 0)).toBe('Suddha Jala'); });
  it('returns null for charts without a configured deity table', () => { expect(getDivisionalDeity('D1', 1, 0)).toBeNull(); });
});

describe('sphutaDrishti', () => {
  it('Mars has full aspect (60 virupas) at 180 degrees', () => { expect(sphutaDrishti('Mars', 'Moon', 0, 180)).toBe(60); });
  it('returns 0 for default planets at 0 degrees separation', () => { expect(sphutaDrishti('Sun', 'Moon', 0, 0)).toBe(0); });
  it('Mars returns null in the 30-60 degree zone', () => { expect(sphutaDrishti('Mars', 'Sun', 0, 45)).toBeNull(); });
  it('Jupiter returns null in the 60-90 degree zone', () => { expect(sphutaDrishti('Jupiter', 'Sun', 0, 75)).toBeNull(); });
  it('Saturn returns null in the 0-30 degree zone', () => { expect(sphutaDrishti('Saturn', 'Sun', 0, 15)).toBeNull(); });
  it('produces consistent results across all zones for each planet', () => {
    const planets: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    for (const planet of planets) {
      for (let angle = 0; angle < 360; angle += 15) {
        const result = sphutaDrishti(planet, 'Sun', 0, angle);
        if (result !== null) { expect(result).toBeGreaterThanOrEqual(0); expect(result).toBeLessThanOrEqual(75); }
      }
    }
  });
});

describe('getDivisionalLongitudes', () => {
  it('returns raw sidereal longitudes for D1', () => {
    const data = makeChartData(1, { Sun: { sign: 6 } });
    const sun = data.planetData.find((p) => p.name === 'Sun')!;
    sun.lon = 155.5;
    const lons = getDivisionalLongitudes(data.planetData, 'D1');
    expect(lons.Sun).toBe(155.5);
  });
  it('returns longitudes for all 9 planets', () => {
    const data = makeChartData(1, {});
    const lons = getDivisionalLongitudes(data.planetData, 'D1');
    expect(Object.keys(lons)).toHaveLength(9);
  });
});

describe('getDivisionalCombustion', () => {
  it('Sun is never combust', () => {
    const data = makeChartData(1, { Sun: { sign: 1 } });
    data.planetData.find((p) => p.name === 'Sun')!.lon = 10;
    const lons = getDivisionalLongitudes(data.planetData, 'D1');
    expect(getDivisionalCombustion(data.planetData, lons).Sun).toBe(false);
  });
  it('detects combustion when a planet is close to the Sun', () => {
    const data = makeChartData(1, { Sun: { sign: 1 }, Mercury: { sign: 1 } });
    data.planetData.find((p) => p.name === 'Sun')!.lon = 10;
    data.planetData.find((p) => p.name === 'Mercury')!.lon = 15;
    const lons = getDivisionalLongitudes(data.planetData, 'D1');
    expect(getDivisionalCombustion(data.planetData, lons).Mercury).toBe(true);
  });
  it('Rahu and Ketu are never combust', () => {
    const data = makeChartData(1, { Sun: { sign: 1 }, Rahu: { sign: 1 }, Ketu: { sign: 1 } });
    data.planetData.find((p) => p.name === 'Sun')!.lon = 10;
    data.planetData.find((p) => p.name === 'Rahu')!.lon = 10;
    data.planetData.find((p) => p.name === 'Ketu')!.lon = 10;
    const lons = getDivisionalLongitudes(data.planetData, 'D1');
    const c = getDivisionalCombustion(data.planetData, lons);
    expect(c.Rahu).toBe(false);
    expect(c.Ketu).toBe(false);
  });
});
