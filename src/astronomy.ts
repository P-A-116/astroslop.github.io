// ============================================================
//  Astronomical calculation functions
// ============================================================

import { PLANET_LIST, ORBITAL_ELEMENTS } from './constants';
import type { PlanetName, PlanetPosition, MotionType } from './types';

export const RAD = Math.PI / 180;
export const DEG = 180 / Math.PI;

export function toRad(d: number): number { return d * RAD; }
export function toDeg(r: number): number { return r * DEG; }
export function norm(x: number): number { return ((x % 360) + 360) % 360; }

/** Julian Day Number for a UTC datetime */
export function julianDay(year: number, month: number, day: number, hour: number): number {
  let y = year, m = month;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716))
       + Math.floor(30.6001 * (m + 1))
       + day + hour / 24 + B - 1524.5;
}

/**
 * Lahiri (Chitra Paksha) ayanamsa in degrees.
 * Linear approximation: ~22.4637° at J1900, +1.39694°/century.
 */
export function lahiriAyanamsa(jd: number): number {
  const T = (jd - 2415020.0) / 36525.0;
  return 22.4637 + 1.39694 * T;
}

/** Solve Kepler's equation iteratively; returns E in radians */
export function kepler(M_deg: number, e: number): number {
  const M = toRad(norm(M_deg));
  let E = M;
  for (let i = 0; i < 50; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

/** True anomaly (degrees) from mean anomaly (degrees) and eccentricity */
export function trueAnomaly(M_deg: number, e: number): number {
  const E = kepler(M_deg, e);
  return toDeg(2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2),
                               Math.sqrt(1 - e) * Math.cos(E / 2)));
}

/**
 * Sun's geocentric ecliptic longitude and distance.
 * d = JD − 2451543.5 (days from 1999 Dec 31.0)
 */
export function sunLongitude(d: number): { lon: number; r: number } {
  const w = norm(282.9404 + 4.70935e-5 * d);
  const e = 0.016709 - 1.151e-9 * d;
  const M = norm(356.0470 + 0.9856002585 * d);
  const v = trueAnomaly(M, e);
  const r = (1 - e * e) / (1 + e * Math.cos(toRad(v)));
  return { lon: norm(v + w), r };
}

/**
 * Moon's geocentric ecliptic longitude (with main perturbation terms).
 * d = JD − 2451543.5
 */
export function moonLongitude(d: number): { lon: number } {
  const N  = norm(125.1228 - 0.0529538083 * d);
  const i  = 5.1454;
  const w  = norm(318.0634 + 0.1643573223 * d);
  const e  = 0.054900;
  const Mm = norm(115.3654 + 13.0649929509 * d);
  const L  = norm(N + w + Mm);

  const v  = trueAnomaly(Mm, e);
  const r  = 60.2666 * (1 - e * e) / (1 + e * Math.cos(toRad(v)));

  const lv = toRad(v + w);
  const Nr = toRad(N);
  const ir = toRad(i);
  const xh = r * (Math.cos(Nr) * Math.cos(lv) - Math.sin(Nr) * Math.sin(lv) * Math.cos(ir));
  const yh = r * (Math.sin(Nr) * Math.cos(lv) + Math.cos(Nr) * Math.sin(lv) * Math.cos(ir));

  let lon = toDeg(Math.atan2(yh, xh));

  // Perturbation corrections (degrees)
  const Ms  = norm(356.0470 + 0.9856002585 * d);
  const sun = sunLongitude(d);
  const D   = norm(L - sun.lon);
  const F   = norm(L - N);

  lon += -1.274 * Math.sin(toRad(Mm - 2 * D))
        + 0.658 * Math.sin(toRad(2 * D))
        - 0.186 * Math.sin(toRad(Ms))
        - 0.059 * Math.sin(toRad(2 * Mm - 2 * D))
        - 0.057 * Math.sin(toRad(Mm - 2 * D + Ms))
        + 0.053 * Math.sin(toRad(Mm + 2 * D))
        + 0.046 * Math.sin(toRad(2 * D - Ms))
        + 0.041 * Math.sin(toRad(Mm - Ms))
        - 0.035 * Math.sin(toRad(D))
        - 0.031 * Math.sin(toRad(Mm + Ms))
        - 0.015 * Math.sin(toRad(2 * F - 2 * D))
        + 0.011 * Math.sin(toRad(Mm - 4 * D));

  // suppress unused variable warning
  void F;

  return { lon: norm(lon) };
}

/** Geocentric ecliptic longitude for a named planet */
export function planetLongitude(name: string, d: number): { lon: number } {
  const el = ORBITAL_ELEMENTS[name];
  const N_d = norm(el.N0 + el.N1 * d);
  const i_d = el.i0 + el.i1 * d;
  const w_d = norm(el.w0 + el.w1 * d);
  const e_d = el.e0 + el.e1 * d;
  const M_d = norm(el.M0 + el.M1 * d);
  const v   = trueAnomaly(M_d, e_d);
  const r   = el.a * (1 - e_d * e_d) / (1 + e_d * Math.cos(toRad(v)));

  const lv  = toRad(v + w_d);
  const Nr  = toRad(N_d);
  const ir  = toRad(i_d);
  const xh  = r * (Math.cos(Nr) * Math.cos(lv) - Math.sin(Nr) * Math.sin(lv) * Math.cos(ir));
  const yh  = r * (Math.sin(Nr) * Math.cos(lv) + Math.cos(Nr) * Math.sin(lv) * Math.cos(ir));

  const sun = sunLongitude(d);
  const xe  = -sun.r * Math.cos(toRad(sun.lon));
  const ye  = -sun.r * Math.sin(toRad(sun.lon));
  const xg  = xh - xe;
  const yg  = yh - ye;
  return { lon: norm(toDeg(Math.atan2(yg, xg))) };
}

/** Rahu (Moon mean ascending node) tropical longitude */
export function rahuTropical(d: number): number {
  return norm(125.1228 - 0.0529538083 * d);
}

/** Compute speed (deg/day) via central finite difference */
export function planetSpeed(name: PlanetName, d: number): number {
  const h = 0.5;
  if (name === 'Rahu' || name === 'Ketu') return -1;
  let l1: number, l2: number;
  if (name === 'Sun') {
    l1 = sunLongitude(d - h).lon;  l2 = sunLongitude(d + h).lon;
  } else if (name === 'Moon') {
    l1 = moonLongitude(d - h).lon; l2 = moonLongitude(d + h).lon;
  } else {
    l1 = planetLongitude(name, d - h).lon;
    l2 = planetLongitude(name, d + h).lon;
  }
  let diff = l2 - l1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff / (2 * h);
}

/** Ascendant tropical longitude from JD, geographic lat/lon (degrees) */
export function computeAscendant(jd: number, lat: number, lon: number): number {
  const d    = jd - 2451545.0;
  const GMST = norm(280.46061837 + 360.98564736629 * d);
  const RAMC = toRad(norm(GMST + lon));
  const obl  = toRad(23.4393 - 3.563e-7 * d);
  const latR = toRad(lat);
  const y = Math.cos(RAMC);
  const x = -(Math.sin(RAMC) * Math.cos(obl) + Math.tan(latR) * Math.sin(obl));
  return norm(toDeg(Math.atan2(y, x)));
}

export interface AllPositionsResult {
  positions: Record<PlanetName, PlanetPosition>;
  ayanamsa: number;
  ascSid: number;
  ascSign: number;
  ascDeg: number;
}

/**
 * Master function: compute all sidereal planetary positions + ascendant.
 */
export function computeAllPositions(jd: number, lat: number, lon: number): AllPositionsResult {
  const d        = jd - 2451543.5;
  const ayanamsa = lahiriAyanamsa(jd);

  const raw: Record<string, { tropLon: number; speed: number }> = {};

  raw['Sun']  = { tropLon: sunLongitude(d).lon,  speed: planetSpeed('Sun', d) };
  raw['Moon'] = { tropLon: moonLongitude(d).lon, speed: planetSpeed('Moon', d) };

  for (const p of ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as PlanetName[]) {
    raw[p] = { tropLon: planetLongitude(p, d).lon, speed: planetSpeed(p, d) };
  }

  const rahuTrop = rahuTropical(d);
  raw['Rahu'] = { tropLon: rahuTrop,             speed: -1 };
  raw['Ketu'] = { tropLon: norm(rahuTrop + 180), speed: -1 };

  const positions = {} as Record<PlanetName, PlanetPosition>;
  for (const name of PLANET_LIST) {
    const sidLon = norm(raw[name].tropLon - ayanamsa);
    positions[name] = {
      lon:    sidLon,
      sign:   Math.floor(sidLon / 30) + 1,
      deg:    sidLon % 30,
      motion: (raw[name].speed < 0 ? 'Retrograde' : 'Direct') as MotionType,
    };
  }

  const ascTrop = computeAscendant(jd, lat, lon);
  const ascSid  = norm(ascTrop - ayanamsa);
  const ascSign = Math.floor(ascSid / 30) + 1;
  const ascDeg  = ascSid % 30;

  return { positions, ayanamsa, ascSid, ascSign, ascDeg };
}
