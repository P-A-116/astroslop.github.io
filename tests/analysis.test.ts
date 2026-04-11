import { describe, it, expect } from 'vitest';
import { findParivartanaYogas } from '../src/analysis';
import { computeArudhaPada, signToHouse, DIVISIONAL_CHARTS } from '../src/astrology';
import { PLANET_LIST, SIGN_LORDS } from '../src/constants';
import type { ChartData, DivisionalChart, DivisionalPlacement, MotionType, PlanetData, PlanetName } from '../src/types';

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

const makePlanet = (ascSign: number, name: PlanetName, sign: number, motion: MotionType = 'Direct'): PlanetData => {
  const house = signToHouse(sign, ascSign);
  return {
    name, lon: (sign - 1) * 30, sign, deg: 0, motion,
    divisional: makeDivisional(sign, house),
    d60Shashtiamsa: { number: 1, name: 'Ghora', nature: 'M', description: 'stub' },
    lordships: [], role: 'Unknown', combust: false,
    nakshatra: 'Ashwini', pada: 1, nakLord: 'Ketu', signLord: SIGN_LORDS[sign - 1], karaka: null,
  };
};

const makeChartData = (ascSign: number, placements: Partial<Record<PlanetName, { sign: number; motion?: MotionType }>>): ChartData => {
  const planetData = PLANET_LIST.map((planet) => {
    const placement = placements[planet] ?? { sign: 1 };
    return makePlanet(ascSign, planet, placement.sign, placement.motion);
  });
  return {
    jd: 0, lat: 0, lon: 0, ayanamsa: 0, ascSid: (ascSign - 1) * 30, ascSign, ascDeg: 0,
    arudhaLagna: computeArudhaPada(ascSign, (placements[SIGN_LORDS[ascSign - 1]] ?? { sign: ascSign }).sign),
    ascDivisional: makeAscDivisional(ascSign),
    ascNak: 'Ashwini', ascPada: 1,
    positions: Object.fromEntries(planetData.map((p) => [p.name, { lon: p.lon, sign: p.sign, deg: p.deg, motion: p.motion }])) as ChartData['positions'],
    planetData, karakas: {},
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

describe('findParivartanaYogas', () => {
  it('returns an empty array when no exchange exists', () => {
    const data = makeChartData(1, { Mars: { sign: 1 }, Venus: { sign: 2 }, Mercury: { sign: 3 }, Moon: { sign: 4 }, Sun: { sign: 5 }, Jupiter: { sign: 9 }, Saturn: { sign: 10 } });
    expect(findParivartanaYogas(data)).toEqual([]);
  });

  it('detects a Maha Parivartana Yoga between two benefic houses', () => {
    const data = makeChartData(1, { Mars: { sign: 5 }, Sun: { sign: 1 } });
    const yogas = findParivartanaYogas(data);
    expect(yogas).toHaveLength(1);
    expect(yogas[0].type).toBe('Maha');
    expect(yogas[0].houseA).toBe(1);
    expect(yogas[0].houseB).toBe(5);
  });

  it('detects a Dainya Parivartana Yoga when a dusthana is involved', () => {
    const data = makeChartData(1, { Mars: { sign: 6 }, Mercury: { sign: 1 } });
    const yogas = findParivartanaYogas(data);
    expect(yogas).toHaveLength(1);
    expect(yogas[0].type).toBe('Dainya');
  });

  it('detects a Khala Parivartana Yoga when house 3 is involved', () => {
    const data = makeChartData(5, { Sun: { sign: 7 }, Venus: { sign: 5 } });
    const yogas = findParivartanaYogas(data);
    expect(yogas).toHaveLength(1);
    expect(yogas[0].type).toBe('Khala');
  });

  it('detects a Dainya yoga involving house 8', () => {
    const data = makeChartData(4, { Moon: { sign: 11 }, Saturn: { sign: 4 } });
    const h1h8 = findParivartanaYogas(data).find((y) => y.houseA === 1 && y.houseB === 8);
    expect(h1h8).toBeDefined();
    expect(h1h8!.type).toBe('Dainya');
  });

  it('can detect multiple yogas in the same chart', () => {
    const data = makeChartData(1, { Mars: { sign: 5 }, Sun: { sign: 1 }, Venus: { sign: 3 }, Mercury: { sign: 2 } });
    expect(findParivartanaYogas(data).length).toBeGreaterThanOrEqual(2);
  });

  it('does not detect a yoga when only one lord is displaced', () => {
    const data = makeChartData(1, { Mars: { sign: 5 }, Sun: { sign: 3 } });
    expect(findParivartanaYogas(data).find((y) => y.houseA === 1 && y.houseB === 5)).toBeUndefined();
  });

  it('works with a non-D1 divisional chart', () => {
    const data = makeChartData(1, { Mars: { sign: 1 }, Sun: { sign: 5 } });
    data.ascDivisional.D9 = 1;
    data.planetData.find((p) => p.name === 'Mars')!.divisional.D9 = { sign: 5, house: 5 };
    data.planetData.find((p) => p.name === 'Sun')!.divisional.D9 = { sign: 1, house: 1 };
    const h1h5 = findParivartanaYogas(data, 'D9').find((y) => y.houseA === 1 && y.houseB === 5);
    expect(h1h5).toBeDefined();
    expect(h1h5!.type).toBe('Maha');
  });
});
