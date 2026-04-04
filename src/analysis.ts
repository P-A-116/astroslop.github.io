import type { ChartData, PlanetName, ParivartanaYoga, DivisionalChart } from './types';
import { SIGN_LORDS } from './constants';
import { getDivisionalSigns, getAscSignForChart, signToHouse } from './astrology';

const DUSTHANAS = new Set([6, 8, 12]);
const houseSign = (ascSign: number, houseNum: number) => ((ascSign + houseNum - 2) % 12) + 1;

function classifyYoga(houseA: number, houseB: number): 'Dainya' | 'Khala' | 'Maha' {
  if (DUSTHANAS.has(houseA) || DUSTHANAS.has(houseB)) return 'Dainya';
  if (houseA === 3 || houseB === 3) return 'Khala';
  return 'Maha';
}

export function findParivartanaYogas(
  chartData: ChartData,
  chart: DivisionalChart = 'D1',
): ParivartanaYoga[] {
  const ascSign = getAscSignForChart(chartData, chart);
  const divSigns = getDivisionalSigns(chartData.planetData, chart);
  const planetHouse = {} as Partial<Record<PlanetName, number>>;
  const houseLord = [] as PlanetName[];

  for (const planet of chartData.planetData) {
    planetHouse[planet.name] = signToHouse(divSigns[planet.name], ascSign);
  }
  for (let house = 1; house <= 12; house++) {
    houseLord[house - 1] = SIGN_LORDS[houseSign(ascSign, house) - 1];
  }

  const yogas: ParivartanaYoga[] = [];
  for (let houseA = 1; houseA <= 12; houseA++) {
    for (let houseB = houseA + 1; houseB <= 12; houseB++) {
      const planetA = houseLord[houseA - 1];
      const planetB = houseLord[houseB - 1];
      if (planetA !== planetB && planetHouse[planetA] === houseB && planetHouse[planetB] === houseA) {
        yogas.push({
          houseA,
          houseB,
          planetA,
          planetB,
          type: classifyYoga(houseA, houseB),
        });
      }
    }
  }

  return yogas;
}
