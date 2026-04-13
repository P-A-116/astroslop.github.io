/** Minimal type declarations for the astronomia library modules used in this project. */

declare module 'astronomia/julian' {
  export function CalendarGregorianToJD(year: number, month: number, day: number): number;
}

declare module 'astronomia/solar' {
  import type { Planet } from 'astronomia/planetposition';
  interface Coord { lon: number; lat: number; range: number }
  export function apparentVSOP87(planet: Planet, jde: number): Coord;
}

declare module 'astronomia/moonposition' {
  interface Coord { lon: number; lat: number; range: number }
  export function position(jde: number): Coord;
}

declare module 'astronomia/planetposition' {
  interface Coord { lon: number; lat: number; range: number }
  export class Planet {
    constructor(data: unknown);
    position(jde: number): Coord;
  }
}

declare module 'astronomia/sidereal' {
  /** Returns apparent sidereal time at Greenwich in seconds of time, range [0, 86400). */
  export function apparent(jd: number): number;
}

declare module 'astronomia/nutation' {
  /** Returns mean obliquity of the ecliptic in radians. */
  export function meanObliquity(jde: number): number;
  /** Returns nutation in longitude and obliquity in radians. */
  export function nutation(jde: number): [number, number];
}

declare module 'astronomia/data/vsop87Bearth' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bmercury' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bvenus' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bmars' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bjupiter' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bsaturn' {
  const data: unknown;
  export default data;
}
