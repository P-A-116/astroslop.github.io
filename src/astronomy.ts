import { CalendarGregorianToJD } from 'astronomia/julian';
import * as solar from 'astronomia/solar';
import * as moonposition from 'astronomia/moonposition';
import * as planetposition from 'astronomia/planetposition';
import * as sidereal from 'astronomia/sidereal';
import * as nutation from 'astronomia/nutation';
import earthData from 'astronomia/data/vsop87Bearth';
import mercuryData from 'astronomia/data/vsop87Bmercury';
import venusData from 'astronomia/data/vsop87Bvenus';
import marsData from 'astronomia/data/vsop87Bmars';
import jupiterData from 'astronomia/data/vsop87Bjupiter';
import saturnData from 'astronomia/data/vsop87Bsaturn';

import { PLANET_LIST } from './constants';
import type { MotionType, PlanetName, PlanetPosition } from './types';

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const HALF_DAY = 0.5;
const norm = (x: number) => ((x % 360) + 360) % 360;
const wrapDiff = (x: number) => (x > 180 ? x - 360 : x < -180 ? x + 360 : x);

// Pre-instantiate VSOP87 planet objects
const earthPlanet = new planetposition.Planet(earthData);
const mercuryPlanet = new planetposition.Planet(mercuryData);
const venusPlanet = new planetposition.Planet(venusData);
const marsPlanet = new planetposition.Planet(marsData);
const jupiterPlanet = new planetposition.Planet(jupiterData);
const saturnPlanet = new planetposition.Planet(saturnData);

interface AllPositionsResult {
  positions: Record<PlanetName, PlanetPosition>;
  ayanamsa: number;
  ascSid: number;
  ascSign: number;
  ascDeg: number;
}

/** Convert a Gregorian calendar date/time to Julian Day Number. */
export function julianDay(year: number, month: number, day: number, hour: number): number {
  return CalendarGregorianToJD(year, month, day + hour / 24);
}

/** Lahiri ayanamsa (degrees) at the given Julian Day. */
export function lahiriAyanamsa(jd: number): number {
  const T = (jd - 2415020) / 36525;
  return 22.460148 + T * (1.396042 + T * 0.000308084);
}

/**
 * Apparent geocentric longitude of the Sun (degrees) using VSOP87.
 * Accepts `d = jd - 2451543.5` for backward compatibility with existing callers.
 */
export function sunLongitude(d: number): { lon: number; r: number } {
  const jde = d + 2451543.5;
  const { lon, range } = solar.apparentVSOP87(earthPlanet, jde);
  return { lon: norm(lon * DEG), r: range };
}

/**
 * Geocentric longitude of the Moon (degrees) using the full Meeus Chapter 47 theory.
 * Accepts `d = jd - 2451543.5` for backward compatibility.
 */
export function moonLongitude(d: number): { lon: number } {
  const jde = d + 2451543.5;
  const { lon } = moonposition.position(jde);
  return { lon: norm(lon * DEG) };
}

/** Geocentric ecliptic longitude of a planet (degrees) derived from VSOP87 heliocentric data. */
function geocentricPlanetLon(planet: planetposition.Planet, jde: number): number {
  const p = planet.position(jde);
  const e = earthPlanet.position(jde);
  const xP = p.range * Math.cos(p.lat) * Math.cos(p.lon);
  const yP = p.range * Math.cos(p.lat) * Math.sin(p.lon);
  const xE = e.range * Math.cos(e.lat) * Math.cos(e.lon);
  const yE = e.range * Math.cos(e.lat) * Math.sin(e.lon);
  return norm(Math.atan2(yP - yE, xP - xE) * DEG);
}

/** Tropical longitude of Rahu (mean lunar north node). */
export const rahuTropical = (d: number) => norm(125.1228 - 0.0529538083 * d);

const VSOP87_PLANETS: Partial<Record<PlanetName, planetposition.Planet>> = {
  Mercury: mercuryPlanet,
  Venus: venusPlanet,
  Mars: marsPlanet,
  Jupiter: jupiterPlanet,
  Saturn: saturnPlanet,
};

const tropicalLongitude = (name: PlanetName, d: number, rahu = rahuTropical(d)): number => {
  if (name === 'Sun') return sunLongitude(d).lon;
  if (name === 'Moon') return moonLongitude(d).lon;
  if (name === 'Rahu') return rahu;
  if (name === 'Ketu') return norm(rahu + 180);
  const p = VSOP87_PLANETS[name];
  return p ? geocentricPlanetLon(p, d + 2451543.5) : 0;
};

/** Daily motion of a planet (degrees/day); negative means retrograde. */
export function planetSpeed(name: PlanetName, d: number): number {
  return name === 'Rahu' || name === 'Ketu'
    ? -1
    : wrapDiff(tropicalLongitude(name, d + HALF_DAY) - tropicalLongitude(name, d - HALF_DAY)) / (2 * HALF_DAY);
}

/**
 * Tropical ecliptic longitude of the Ascendant (degrees) using GMST from
 * the IAU 1982 sidereal time formula and VSOP87 obliquity.
 */
export function computeAscendant(jd: number, lat: number, lon: number): number {
  // Apparent GMST in seconds of time → convert to degrees
  const gmstDeg = sidereal.apparent(jd) / 3600 * 15;
  const RAMC = norm(gmstDeg + lon) * RAD;
  const obl = nutation.meanObliquity(jd); // radians
  const latR = lat * RAD;
  return norm(Math.atan2(Math.cos(RAMC), -(Math.sin(RAMC) * Math.cos(obl) + Math.tan(latR) * Math.sin(obl))) * DEG);
}

export function computeAllPositions(jd: number, lat: number, lon: number): AllPositionsResult {
  const d = jd - 2451543.5;
  const ayanamsa = lahiriAyanamsa(jd);
  const rahu = rahuTropical(d);

  const positions = Object.fromEntries(PLANET_LIST.map((name) => {
    const tropLon = tropicalLongitude(name, d, rahu);
    const sidLon = norm(tropLon - ayanamsa);
    const speed = name === 'Rahu' || name === 'Ketu' ? -1 : planetSpeed(name, d);
    const motion: MotionType = speed < 0 ? 'Retrograde' : 'Direct';
    return [name, { lon: sidLon, sign: Math.floor(sidLon / 30) + 1, deg: sidLon % 30, motion }];
  })) as Record<PlanetName, PlanetPosition>;

  const ascSid = norm(computeAscendant(jd, lat, lon) - ayanamsa);
  return { positions, ayanamsa, ascSid, ascSign: Math.floor(ascSid / 30) + 1, ascDeg: ascSid % 30 };
}

function clampHourRange(hour: number) {
  const x = hour % 24;
  return x < 0 ? x + 24 : x;
}

function toTimeHHMM(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const hh = (m === 60 ? (h + 1) : h) % 24;
  const mm = m === 60 ? 0 : m;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function dayOfYear(year: number, month: number, day: number) {
  // month is 1-12
  const start = Date.UTC(year, 0, 1);
  const cur = Date.UTC(year, month - 1, day);
  return Math.floor((cur - start) / 86400000) + 1;
}

export type SunriseSunsetResult =
  | { kind: 'ok'; sunrise: string; sunset: string }
  | { kind: 'polar-night'; sunrise: null; sunset: null }
  | { kind: 'midnight-sun'; sunrise: null; sunset: null }
  | { kind: 'invalid'; sunrise: null; sunset: null; message: string };

/**
 * Offline sunrise/sunset approximation (NOAA solar equations).
 *
 * - No API calls, no server required.
 * - Uses the provided timezone offset (hours) to return local wall-clock times.
 * - Returns nulls for polar day/night where sunrise/sunset don't occur.
 */
export function computeSunriseSunsetLocal(
  year: number,
  month: number,
  day: number,
  lat: number,
  lon: number,
  tzOffsetHours: number,
): SunriseSunsetResult {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return { kind: 'invalid', sunrise: null, sunset: null, message: 'Invalid date.' };
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { kind: 'invalid', sunrise: null, sunset: null, message: 'Invalid latitude.' };
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { kind: 'invalid', sunrise: null, sunset: null, message: 'Invalid longitude.' };
  }
  if (!Number.isFinite(tzOffsetHours) || tzOffsetHours < -14 || tzOffsetHours > 14) {
    return { kind: 'invalid', sunrise: null, sunset: null, message: 'Invalid timezone offset.' };
  }

  const zenithDeg = 90.833; // official-ish sunrise/sunset zenith
  const N = dayOfYear(year, month, day);
  const lngHour = lon / 15;

  const sin = (deg: number) => Math.sin(deg * RAD);
  const cos = (deg: number) => Math.cos(deg * RAD);
  const tan = (deg: number) => Math.tan(deg * RAD);
  const atanDeg = (x: number) => Math.atan(x) * DEG;
  const acosDeg = (x: number) => Math.acos(x) * DEG;

  function calc(isRise: boolean) {
    const t = N + ((isRise ? 6 : 18) - lngHour) / 24;
    const M = 0.9856 * t - 3.289;
    const L = norm(M + 1.916 * sin(M) + 0.020 * sin(2 * M) + 282.634);

    // Right ascension (hours), corrected to same quadrant as L
    let RA = norm(atanDeg(0.91764 * tan(L)));
    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = (RA + (Lquadrant - RAquadrant)) / 15;

    const sinDec = 0.39782 * sin(L);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH =
      (cos(zenithDeg) - sinDec * sin(lat)) /
      (cosDec * cos(lat));

    if (cosH > 1) return { kind: 'polar-night' as const, hour: null };
    if (cosH < -1) return { kind: 'midnight-sun' as const, hour: null };

    const H = (isRise ? 360 - acosDeg(cosH) : acosDeg(cosH)) / 15;
    const T = H + RA - 0.06571 * t - 6.622;
    const UT = clampHourRange(T - lngHour);
    const localHour = clampHourRange(UT + tzOffsetHours);
    return { kind: 'ok' as const, hour: localHour };
  }

  const rise = calc(true);
  const set = calc(false);

  if (rise.kind !== 'ok' || set.kind !== 'ok') {
    // If either says "no event", treat the day as polar day/night.
    if (rise.kind === 'midnight-sun' || set.kind === 'midnight-sun') return { kind: 'midnight-sun', sunrise: null, sunset: null };
    if (rise.kind === 'polar-night' || set.kind === 'polar-night') return { kind: 'polar-night', sunrise: null, sunset: null };
    return { kind: 'invalid', sunrise: null, sunset: null, message: 'Unable to compute sunrise/sunset.' };
  }

  return { kind: 'ok', sunrise: toTimeHHMM(rise.hour), sunset: toTimeHHMM(set.hour) };
}
