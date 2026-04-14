declare module 'astronomia/julian' {
  export function CalendarGregorianToJD(year: number, month: number, day: number): number;
}

declare module 'astronomia/solar' {
  export function apparentVSOP87(
    earth: unknown,
    jde: number,
  ): { lon: number; lat: number; range: number };
}

declare module 'astronomia/moonposition' {
  export function position(jde: number): {
    lon: number;
    lat: number;
    range: number;
  };
}

declare module 'astronomia/planetposition' {
  export interface PlanetPosition {
    lon: number;
    lat: number;
    range: number;
  }

  export class Planet {
    constructor(data: unknown);
    position(jde: number): PlanetPosition;
  }
}

declare module 'astronomia/sidereal' {
  export function apparent(jd: number): number;
}

declare module 'astronomia/nutation' {
  export function nutation(jd: number): [number, number];
  export function meanObliquity(jd: number): number;
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
