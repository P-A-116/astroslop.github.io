import { ORBITAL_ELEMENTS, PLANET_LIST } from './constants';
import type { MotionType, PlanetName, PlanetPosition } from './types';

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const HALF_DAY = 0.5;
const rad = (d: number) => d * RAD;
const deg = (r: number) => r * DEG;
const sin = (d: number) => Math.sin(rad(d));
const cos = (d: number) => Math.cos(rad(d));
const norm = (x: number) => ((x % 360) + 360) % 360;
const wrapDiff = (x: number) => (x > 180 ? x - 360 : x < -180 ? x + 360 : x);
const lonFromXY = (x: number, y: number) => norm(deg(Math.atan2(y, x)));
const orbitXY = (N: number, i: number, lon: number, r: number) => {
  const Nr = rad(N), ir = rad(i), lr = rad(lon);
  const cN = Math.cos(Nr), sN = Math.sin(Nr), cl = Math.cos(lr), sl = Math.sin(lr), ci = Math.cos(ir);
  return { x: r * (cN * cl - sN * sl * ci), y: r * (sN * cl + cN * sl * ci) };
};

type OrbitalPlanet = Exclude<PlanetName, 'Sun' | 'Moon' | 'Rahu' | 'Ketu'>;

interface AllPositionsResult {
  positions: Record<PlanetName, PlanetPosition>;
  ayanamsa: number;
  ascSid: number;
  ascSign: number;
  ascDeg: number;
}

export function julianDay(year: number, month: number, day: number, hour: number): number {
  let y = year, m = month;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  return Math.floor(365.25 * (y + 4716))
    + Math.floor(30.6001 * (m + 1))
    + day + hour / 24 + (2 - A + Math.floor(A / 4)) - 1524.5;
}

export const lahiriAyanamsa = (jd: number) => 22.4637 + 1.39694 * ((jd - 2415020) / 36525);

export function kepler(MDeg: number, e: number): number {
  const M = rad(norm(MDeg));
  let E = M;
  for (let i = 0; i < 50; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

export function trueAnomaly(MDeg: number, e: number): number {
  const E = kepler(MDeg, e);
  return deg(2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)));
}

export function sunLongitude(d: number): { lon: number; r: number } {
  const e = 0.016709 - 1.151e-9 * d;
  const v = trueAnomaly(norm(356.047 + 0.9856002585 * d), e);
  return {
    lon: norm(v + norm(282.9404 + 4.70935e-5 * d)),
    r: (1 - e * e) / (1 + e * cos(v)),
  };
}

export function moonLongitude(d: number): { lon: number } {
  const N = norm(125.1228 - 0.0529538083 * d);
  const w = norm(318.0634 + 0.1643573223 * d);
  const Mm = norm(115.3654 + 13.0649929509 * d);
  const L = norm(N + w + Mm);
  const e = 0.0549;
  const v = trueAnomaly(Mm, e);
  const { x, y } = orbitXY(N, 5.1454, v + w, 60.2666 * (1 - e * e) / (1 + e * cos(v)));
  const sun = sunLongitude(d);
  const Ms = norm(356.047 + 0.9856002585 * d);
  const D = norm(L - sun.lon);
  const F = norm(L - N);

  return {
    lon: norm(
      lonFromXY(x, y)
      - 1.274 * sin(Mm - 2 * D)
      + 0.658 * sin(2 * D)
      - 0.186 * sin(Ms)
      - 0.059 * sin(2 * Mm - 2 * D)
      - 0.057 * sin(Mm - 2 * D + Ms)
      + 0.053 * sin(Mm + 2 * D)
      + 0.046 * sin(2 * D - Ms)
      + 0.041 * sin(Mm - Ms)
      - 0.035 * sin(D)
      - 0.031 * sin(Mm + Ms)
      - 0.015 * sin(2 * F - 2 * D)
      + 0.011 * sin(Mm - 4 * D),
    ),
  };
}

export function planetLongitude(name: OrbitalPlanet, d: number): { lon: number } {
  const el = ORBITAL_ELEMENTS[name];
  const N = norm(el.N0 + el.N1 * d);
  const i = el.i0 + el.i1 * d;
  const w = norm(el.w0 + el.w1 * d);
  const e = el.e0 + el.e1 * d;
  const v = trueAnomaly(norm(el.M0 + el.M1 * d), e);
  const { x, y } = orbitXY(N, i, v + w, el.a * (1 - e * e) / (1 + e * cos(v)));
  const sun = sunLongitude(d);
  return { lon: lonFromXY(x + sun.r * cos(sun.lon), y + sun.r * sin(sun.lon)) };
}

export const rahuTropical = (d: number) => norm(125.1228 - 0.0529538083 * d);

const tropicalLongitude = (name: PlanetName, d: number, rahu = rahuTropical(d)) =>
  name === 'Sun' ? sunLongitude(d).lon
    : name === 'Moon' ? moonLongitude(d).lon
    : name === 'Rahu' ? rahu
    : name === 'Ketu' ? norm(rahu + 180)
    : planetLongitude(name as OrbitalPlanet, d).lon;

export function planetSpeed(name: PlanetName, d: number): number {
  return name === 'Rahu' || name === 'Ketu'
    ? -1
    : wrapDiff(tropicalLongitude(name, d + HALF_DAY) - tropicalLongitude(name, d - HALF_DAY)) / (2 * HALF_DAY);
}

export function computeAscendant(jd: number, lat: number, lon: number): number {
  const d = jd - 2451545;
  const RAMC = rad(norm(280.46061837 + 360.98564736629 * d + lon));
  const obl = rad(23.4393 - 3.563e-7 * d);
  const latR = rad(lat);
  return norm(deg(Math.atan2(Math.cos(RAMC), -(Math.sin(RAMC) * Math.cos(obl) + Math.tan(latR) * Math.sin(obl)))));
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
