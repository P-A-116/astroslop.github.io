import { SIGN_LORDS } from './constants';
import type { ChartData, ParivartanaYoga, PlanetName } from './types';

const DUSTHANAS = new Set([6, 8, 12]);
const houseSign = (ascSign: number, house: number) => ((ascSign + house - 2) % 12) + 1;
const yogaType = (a: number, b: number) =>
  DUSTHANAS.has(a) || DUSTHANAS.has(b) ? 'Dainya' : a === 3 || b === 3 ? 'Khala' : 'Maha';

export function findParivartanaYogas({ ascSign, planetData }: ChartData): ParivartanaYoga[] {
  const planetHouse = Object.fromEntries(
    planetData.map(({ name, house }) => [name, house]),
  ) as Partial<Record<PlanetName, number>>;
  const houseLords = Array.from({ length: 12 }, (_, i) => SIGN_LORDS[houseSign(ascSign, i + 1) - 1]);
  const yogas: ParivartanaYoga[] = [];

  for (let i = 1; i <= 12; i++) {
    for (let j = i + 1; j <= 12; j++) {
      const planetA = houseLords[i - 1];
      const planetB = houseLords[j - 1];
      if (planetA === planetB || planetHouse[planetA] !== j || planetHouse[planetB] !== i) continue;
      yogas.push({ houseA: i, houseB: j, planetA, planetB, type: yogaType(i, j) });
    }
  }

  return yogas;
}
