// ============================================================
//  Analysis logic — Parivartana Yoga detection
// ============================================================

import type { ChartData, PlanetName, ParivartanaYoga, DivisionalChart } from './types';
import { SIGN_LORDS } from './constants';
import { getDivisionalSigns, getAscSignForChart, signToHouse } from './astrology';

/**
 * Given the ascendant sign (1-12), return the sign on the cusp of house N (1-12).
 * Uses whole-sign houses: house N has the sign that is (N-1) signs ahead of the ascendant sign.
 */
function houseSign(ascSign: number, houseNum: number): number {
  return ((ascSign - 1 + (houseNum - 1)) % 12) + 1;
}

/**
 * Classify the yoga type based on the two house numbers involved.
 */
function classifyYoga(houseA: number, houseB: number): 'Dainya' | 'Khala' | 'Maha' {
  const dusthanas = new Set([6, 8, 12]);
  if (dusthanas.has(houseA) || dusthanas.has(houseB)) return 'Dainya';
  if (houseA === 3 || houseB === 3) return 'Khala';
  return 'Maha';
}

/**
 * Detect all Parivartana Yogas present in a chart.
 * A Parivartana occurs when the lord of house i is placed in house j
 * AND the lord of house j is placed in house i (i ≠ j, different planets).
 * Only the traditional seven planets (via SIGN_LORDS) are used as sign lords.
 * When a divisional chart is supplied, uses divisional ascendant and divisional signs.
 */
export function findParivartanaYogas(
  chartData: ChartData,
  chart: DivisionalChart = 'D1',
): ParivartanaYoga[] {
  const { planetData } = chartData;
  const ascSign = getAscSignForChart(chartData, chart);
  const divSigns = getDivisionalSigns(planetData, chart);

  // Build a map from planet name to its house number for quick lookup
  const planetHouse: Partial<Record<PlanetName, number>> = {};
  for (const pd of planetData) {
    planetHouse[pd.name] = signToHouse(divSigns[pd.name], ascSign);
  }

  // For each house (1-12), determine the sign on its cusp and its lord
  const houseLord: PlanetName[] = [];  // index 0 = house 1, index 11 = house 12
  for (let h = 1; h <= 12; h++) {
    const sign = houseSign(ascSign, h);
    houseLord[h - 1] = SIGN_LORDS[sign - 1];
  }

  const yogas: ParivartanaYoga[] = [];

  // Check all unique pairs (i, j) where i < j
  for (let i = 1; i <= 12; i++) {
    for (let j = i + 1; j <= 12; j++) {
      const planetA = houseLord[i - 1];  // lord of house i
      const planetB = houseLord[j - 1];  // lord of house j

      // Skip if both houses are ruled by the same planet (e.g. Mercury rules Gemini & Virgo)
      if (planetA === planetB) continue;

      // Check mutual exchange: planetA is in house j AND planetB is in house i
      if (planetHouse[planetA] === j && planetHouse[planetB] === i) {
        yogas.push({
          houseA: i,
          houseB: j,
          planetA,
          planetB,
          type: classifyYoga(i, j),
        });
      }
    }
  }

  return yogas;
}
