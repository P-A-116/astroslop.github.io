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
} from '../src/astrology';
import { PLANET_LIST, SIGN_LORDS } from '../src/constants';
import type { ChartData, MotionType, PlanetData, PlanetName } from '../src/types';

const expectWithin = (actual: number, expected: number, tolerance: number) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
};

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
    house,
    navamsaSign: sign,
    navamsaHouse: house,
    d7Sign: sign,
    d7House: house,
    d2Sign: sign,
    d3Sign: sign,
    d4Sign: sign,
    d10Sign: sign,
    d10House: house,
    d12Sign: sign,
    d12House: house,
    d16Sign: sign,
    d16House: house,
    d20Sign: sign,
    d20House: house,
    d24Sign: sign,
    d24House: house,
    d27Sign: sign,
    d27House: house,
    d30Sign: sign,
    d30House: house,
    d40Sign: sign,
    d40House: house,
    d45Sign: sign,
    d45House: house,
    d60Sign: sign,
    d60House: house,
    d60Shashtiamsa: {
      number: 1,
      name: 'Ghora',
      nature: 'M',
      description: 'stub',
    },
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
    ascNavamsa: ascSign,
    ascD7: ascSign,
    ascD2: ascSign,
    ascD3: ascSign,
    ascD4: ascSign,
    ascD10: ascSign,
    ascD12: ascSign,
    ascD16: ascSign,
    ascD20: ascSign,
    ascD24: ascSign,
    ascD27: ascSign,
    ascD30: ascSign,
    ascD40: ascSign,
    ascD45: ascSign,
    ascD60: ascSign,
    ascNak: 'Ashwini',
    ascPada: 1,
    positions: Object.fromEntries(
      planetData.map((planet) => [
        planet.name,
        {
          lon: planet.lon,
          sign: planet.sign,
          deg: planet.deg,
          motion: planet.motion,
        },
      ]),
    ) as ChartData['positions'],
    planetData,
    karakas: {},
    upagrahas: {
      dhooma: 0,
      vyatipata: 0,
      parivesha: 0,
      chapa: 0,
      upaketu: 0,
    },
    upagrahasFormatted: {
      dhooma: { sign: 'Aries', degrees: 0, minutes: 0, text: 'Aries 0deg 0\'' },
      vyatipata: { sign: 'Aries', degrees: 0, minutes: 0, text: 'Aries 0deg 0\'' },
      parivesha: { sign: 'Aries', degrees: 0, minutes: 0, text: 'Aries 0deg 0\'' },
      chapa: { sign: 'Aries', degrees: 0, minutes: 0, text: 'Aries 0deg 0\'' },
      upaketu: { sign: 'Aries', degrees: 0, minutes: 0, text: 'Aries 0deg 0\'' },
    },
  };
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
    expect(typeof data.arudhaLagna).toBe('number');
    expect(data.arudhaLagna).toBeGreaterThanOrEqual(1);
    expect(data.arudhaLagna).toBeLessThanOrEqual(12);
    expect(Array.isArray(data.planetData)).toBe(true);
    expect(data.planetData.length).toBe(9);
    expect(data.positions).toBeDefined();
    expect(data.positions.Sun).toBeDefined();
    expect(data.positions.Moon).toBeDefined();
    expect(data.upagrahas).toBeDefined();
    expect(typeof data.upagrahas.upaketu).toBe('number');
    expect(data.upagrahasFormatted).toBeDefined();
    expect(typeof data.upagrahasFormatted.upaketu.text).toBe('string');
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

describe('computeArudhaPada', () => {
  it('computes an ordinary pada using inclusive counting', () => {
    expect(computeArudhaPada(1, 3)).toBe(5);
  });

  it('moves to the 10th when the computed pada falls back in the house sign', () => {
    expect(computeArudhaPada(1, 7)).toBe(10);
  });

  it('moves to the 4th when the computed pada falls in the 7th from the house sign', () => {
    expect(computeArudhaPada(1, 4)).toBe(4);
  });

  it('wraps correctly across Pisces to Aries', () => {
    expect(computeArudhaPada(12, 1)).toBe(2);
  });

  it('treats the lord in the same sign as a self-placement and applies the 10th-house exception', () => {
    expect(computeArudhaPada(5, 5)).toBe(2);
  });

  it('handles a lord placed in the 7th sign without special-casing motion or dignity', () => {
    expect(computeArudhaPada(5, 11)).toBe(2);
  });
});

describe('getArudhaPada', () => {
  it('computes Arudha Lagna from the chart ascendant and Lagna lord sign', () => {
    const data = makeChartData(1, {
      Mars: { sign: 3 },
    });

    expect(getArudhaLagna(data)).toBe(5);
    expect(getArudhaPada(data, 1)).toBe(5);
  });

  it('supports generalized future padas by accepting other house numbers', () => {
    const data = makeChartData(1, {
      Venus: { sign: 3 },
    });

    expect(getArudhaPada(data, 2)).toBe(4);
  });

  it('returns all 12 Arudha padas for the selected chart', () => {
    const data = makeChartData(1, {
      Mars: { sign: 3 },
      Venus: { sign: 3 },
      Mercury: { sign: 5 },
      Moon: { sign: 4 },
      Sun: { sign: 5 },
      Jupiter: { sign: 9 },
      Saturn: { sign: 10 },
    });

    expect(getArudhaPadas(data)).toHaveLength(12);
    expect(getArudhaPadas(data)[0]).toBe(5);
    expect(getArudhaPadas(data)[1]).toBe(4);
  });

  it('computes Arudha padas independently for each divisional chart', () => {
    const data = makeChartData(1, {
      Mars: { sign: 3 },
    });
    const mars = data.planetData.find(({ name }) => name === 'Mars');

    if (!mars) throw new Error('Mars test fixture missing.');

    data.ascNavamsa = 1;
    mars.navamsaSign = 2;

    expect(getArudhaPadas(data, 'D1')[0]).toBe(5);
    expect(getArudhaPadas(data, 'D9')[0]).toBe(3);
  });

  it('returns Arudha sets for all 16 supported charts', () => {
    const data = makeChartData(1, {
      Mars: { sign: 3 },
    });

    const allCharts = getArudhasForAllCharts(data);
    expect(Object.keys(allCharts)).toHaveLength(16);
    expect(allCharts.D1).toHaveLength(12);
    expect(allCharts.D60).toHaveLength(12);
  });

  it('ignores retrograde state because the calculation depends only on sign placement', () => {
    const direct = makeChartData(1, {
      Mars: { sign: 4, motion: 'Direct' },
    });
    const retrograde = makeChartData(1, {
      Mars: { sign: 4, motion: 'Retrograde' },
    });

    expect(getArudhaLagna(direct)).toBe(4);
    expect(getArudhaLagna(retrograde)).toBe(4);
  });
});

describe('computeGrahaArudhas', () => {
  it('computes both graha arudhas for a dual-lord planet', () => {
    expect(computeGrahaArudhas(4, 'Mars', { Mars: [1, 8] })).toEqual([10, 12]);
  });

  it('computes a single graha arudha for a single-lord planet', () => {
    expect(computeGrahaArudhas(7, 'Sun', { Sun: [5] })).toEqual([3]);
    expect(computeGrahaArudhas(10, 'Moon', { Moon: [4] })).toEqual([10]);
  });

  it('wraps correctly across Pisces to Aries', () => {
    expect(computeGrahaArudhas(12, 'Mars', { Mars: [1, 8] })).toEqual([2, 4]);
  });

  it('returns configured Rahu and Ketu graha arudhas when ownership is provided', () => {
    expect(computeGrahaArudhas(3, 'Rahu', { Rahu: [11] })).toEqual([7]);
    expect(computeGrahaArudhas(3, 'Ketu', { Ketu: [8] })).toEqual([1]);
  });

  it('returns null when ownership is missing or the sign is invalid', () => {
    expect(computeGrahaArudhas(5, 'Pluto', {})).toBeNull();
    expect(computeGrahaArudhas(13, 'Mars', { Mars: [1, 8] })).toBeNull();
  });
});

describe('getGrahaArudhas', () => {
  it('computes graha arudhas for all nine planets in D1', () => {
    const data = makeChartData(1, {
      Sun: { sign: 7 },
      Moon: { sign: 10 },
      Mars: { sign: 4 },
      Mercury: { sign: 6 },
      Jupiter: { sign: 9 },
      Venus: { sign: 3 },
      Saturn: { sign: 11 },
      Rahu: { sign: 3 },
      Ketu: { sign: 3 },
    });

    const result = getGrahaArudhas(data);
    expect(result.Sun).toEqual([3]);
    expect(result.Moon).toEqual([10]);
    expect(result.Mars).toEqual([10, 12]);
    expect(result.Rahu).toEqual([7]);
    expect(result.Ketu).toEqual([1]);
  });

  it('uses the selected divisional chart signs for bulk graha arudhas', () => {
    const data = makeChartData(1, {
      Mars: { sign: 4 },
    });
    const mars = data.planetData.find(({ name }) => name === 'Mars');

    if (!mars) throw new Error('Mars test fixture missing.');

    mars.navamsaSign = 12;

    expect(getGrahaArudhas(data, 'D1').Mars).toEqual([10, 12]);
    expect(getGrahaArudhas(data, 'D9').Mars).toEqual([2, 4]);
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

describe('getTemporaryRelationship', () => {
  it('matches the canonical 12-house temporary relationship mapping', () => {
    const fromSign = 1;
    const expected: Record<number, 'Friend' | 'Enemy'> = {
      1: 'Enemy',
      2: 'Friend',
      3: 'Friend',
      4: 'Friend',
      5: 'Enemy',
      6: 'Enemy',
      7: 'Enemy',
      8: 'Enemy',
      9: 'Enemy',
      10: 'Friend',
      11: 'Friend',
      12: 'Friend',
    };

    for (let toSign = 1; toSign <= 12; toSign += 1) {
      expect(getTemporaryRelationship(fromSign, toSign)).toBe(expected[toSign]);
    }
  });
});

describe('getCharaKarakas', () => {
  it('ranks using degrees within sign, not absolute zodiac longitude', () => {
    const makePos = (lon: number) => ({
      lon,
      sign: Math.floor(lon / 30) + 1,
      deg: lon % 30,
      motion: 'Direct' as const,
    });

    const karakas = getCharaKarakas({
      Sun: makePos(29),
      Moon: makePos(58), // 28 in-sign
      Mars: makePos(57), // 27 in-sign
      Mercury: makePos(56), // 26 in-sign
      Jupiter: makePos(55), // 25 in-sign
      Venus: makePos(54), // 24 in-sign
      Saturn: makePos(53), // 23 in-sign
      Rahu: makePos(10),
      Ketu: makePos(190),
    });

    expect(karakas.Sun).toBe('Atmakaraka');
    expect(karakas.Moon).toBe('Amatyakaraka');
    expect(karakas.Saturn).toBe('Darakaraka');
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
