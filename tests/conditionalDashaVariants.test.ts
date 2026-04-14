import { describe, expect, it } from 'vitest';
import {
  CHATURASITI_ORDER,
  CHATURASITI_YEARS,
  computeChaturasitiDasha,
  computeDwisaptatiDasha,
  computePanchottariDasha,
  computeShastihayaniDasha,
  computeShatTrimshatDasha,
  computeShatabdikaDasha,
  DWISAPTATI_ORDER,
  getChaturasitiStartPlanet,
  getDwisaptatiStartPlanet,
  getPanchottariStartPlanet,
  getShastihayaniStartPlanet,
  getShatTrimshatStartPlanet,
  getShatabdikaStartPlanet,
  isChaturasitiEligible,
  isDwisaptatiEligible,
  isPanchottariEligible,
  isShastihayaniEligible,
  isShatTrimshatEligible,
  isShatabdikaEligible,
  PANCHOTTARI_ORDER,
  SHASTIHAYANI_ORDER,
  SHASTIHAYANI_YEARS,
  SHAT_TRIMSHAT_ORDER,
  SHAT_TRIMSHAT_YEARS,
  SHATABDIKA_ORDER,
} from '../src/dashaVariants';

const NAKSHATRA_SIZE = 360 / 27;

describe('panchottari dasha', () => {
  it('requires Cancer lagna in D1 and D12', () => {
    expect(isPanchottariEligible(4, 4)).toBe(true);
    expect(isPanchottariEligible(4, 5)).toBe(false);
    expect(isPanchottariEligible(1, 4)).toBe(false);
  });

  it('counts from Anuradha and follows the canonical 7-planet order', () => {
    const anuradhaStart = 16 * NAKSHATRA_SIZE;
    expect(getPanchottariStartPlanet(anuradhaStart)).toBe('Sun');
    const result = computePanchottariDasha(2451545, anuradhaStart);
    expect(result.timeline.map((entry) => entry.planet)).toEqual(PANCHOTTARI_ORDER);
  });
});

describe('shatabdika dasha', () => {
  it('requires vargottama lagna between D1 and D9', () => {
    expect(isShatabdikaEligible(4, 4)).toBe(true);
    expect(isShatabdikaEligible(4, 7)).toBe(false);
  });

  it('counts from Revati and starts from Sun there', () => {
    const revatiStart = 26 * NAKSHATRA_SIZE;
    expect(getShatabdikaStartPlanet(revatiStart)).toBe('Sun');
    const result = computeShatabdikaDasha(2451545, revatiStart);
    expect(result.timeline.map((entry) => entry.planet)).toEqual(SHATABDIKA_ORDER);
  });
});

describe('chaturasiti sama dasha', () => {
  it('requires the 10th lord to occupy the 10th house', () => {
    expect(isChaturasitiEligible(10)).toBe(true);
    expect(isChaturasitiEligible(9)).toBe(false);
  });

  it('counts from Swati and assigns 12 years to each mahadasha', () => {
    const swatiStart = 14 * NAKSHATRA_SIZE;
    expect(getChaturasitiStartPlanet(swatiStart)).toBe('Sun');
    const result = computeChaturasitiDasha(2451545, swatiStart);
    expect(result.timeline.map((entry) => entry.planet)).toEqual(CHATURASITI_ORDER);
    expect(result.timeline.slice(1).every((entry) => CHATURASITI_YEARS[entry.planet] === 12)).toBe(true);
  });
});

describe('dwisaptati sama dasha', () => {
  it('requires the lagna lord in house 1 or 7', () => {
    expect(isDwisaptatiEligible(1)).toBe(true);
    expect(isDwisaptatiEligible(7)).toBe(true);
    expect(isDwisaptatiEligible(4)).toBe(false);
  });

  it('counts from Mula and uses the 8-planet order with Rahu', () => {
    const mulaStart = 18 * NAKSHATRA_SIZE;
    expect(getDwisaptatiStartPlanet(mulaStart)).toBe('Sun');
    const result = computeDwisaptatiDasha(2451545, mulaStart);
    expect(result.timeline.map((entry) => entry.planet)).toEqual(DWISAPTATI_ORDER);
  });
});

describe('shastihayani dasha', () => {
  it('requires Sun in the 1st house', () => {
    expect(isShastihayaniEligible(1)).toBe(true);
    expect(isShastihayaniEligible(12)).toBe(false);
  });

  it('counts from Ardra and preserves the supplied year scheme', () => {
    const ardraStart = 5 * NAKSHATRA_SIZE;
    expect(getShastihayaniStartPlanet(ardraStart)).toBe('Jupiter');
    const result = computeShastihayaniDasha(2451545, ardraStart);
    expect(result.timeline.map((entry) => entry.planet)).toEqual(SHASTIHAYANI_ORDER);
    const configuredTotal = Object.values(SHASTIHAYANI_YEARS).reduce((sum, years) => sum + years, 0);
    expect(configuredTotal).toBe(69);
  });
});

describe('shat-trimshat sama dasha', () => {
  it('requires day birth with Leo D2 or night birth with Cancer D2', () => {
    expect(isShatTrimshatEligible(5, true)).toBe(true);
    expect(isShatTrimshatEligible(4, false)).toBe(true);
    expect(isShatTrimshatEligible(4, true)).toBe(false);
    expect(isShatTrimshatEligible(5, false)).toBe(false);
  });

  it('counts from Shravana and keeps the 1-8 year pattern', () => {
    const shravanaStart = 21 * NAKSHATRA_SIZE;
    expect(getShatTrimshatStartPlanet(shravanaStart)).toBe('Moon');
    const result = computeShatTrimshatDasha(2451545, shravanaStart);
    expect(result.timeline.map((entry) => entry.planet)).toEqual(SHAT_TRIMSHAT_ORDER);
    expect(result.timeline.slice(1).map((entry) => SHAT_TRIMSHAT_YEARS[entry.planet])).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });
});
