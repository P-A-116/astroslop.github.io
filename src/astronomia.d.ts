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
    constructor(data: object);
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
}

declare module 'astronomia/data/vsop87Bearth' {
  const data: object;
  export default data;
}
declare module 'astronomia/data/vsop87Bmercury' {
  const data: object;
  export default data;
}
declare module 'astronomia/data/vsop87Bvenus' {
  const data: object;
  export default data;
}
declare module 'astronomia/data/vsop87Bmars' {
  const data: object;
  export default data;
}
declare module 'astronomia/data/vsop87Bjupiter' {
  const data: object;
  export default data;
}
declare module 'astronomia/data/vsop87Bsaturn' {
  const data: object;
  export default data;
}
