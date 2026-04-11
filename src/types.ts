import type { NakshatraName } from './constants';

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter'
  | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

export type WeekdayPlanet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';

export type DivisionalChart =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D7' | 'D9' | 'D10' | 'D12'
  | 'D16' | 'D20' | 'D24' | 'D27' | 'D30' | 'D40' | 'D45' | 'D60';

export type RelationshipType = 'Friend' | 'Enemy' | 'Neutral';
export type CompoundRelationship = 'Extreme Friendship' | 'Friendship' | 'Neutral' | 'Enmity' | 'Extreme Enmity';
export type MotionType = 'Direct' | 'Retrograde';
export type FunctionalRole = 'Benefic' | 'Malefic' | 'Neutral' | 'Unknown';
export type KarakaName =
  | 'Atmakaraka'
  | 'Amatyakaraka'
  | 'Bhratrikaraka'
  | 'Matrikaraka'
  | 'Putrakaraka'
  | 'Gnatikaraka'
  | 'Darakaraka';

export interface DMS {
  deg: number;
  minute: number;
  sec: number;
}

export interface NakshatraPada {
  nakshatra: NakshatraName;
  pada: number;
}

export interface GeoCoordinates {
  lat: number;
  lon: number;
}

export interface PlanetPosition {
  lon: number;
  sign: number;
  deg: number;
  motion: MotionType;
}

export interface ShashtiamsaInfo {
  number: number;
  name: string;
  nature: 'B' | 'M';
  description: string;
}

/** Per-divisional-chart sign and house placement for a planet. */
export interface DivisionalPlacement {
  sign: number;
  house: number;
}

export interface PlanetData {
  name: PlanetName;
  lon: number;
  sign: number;
  deg: number;
  motion: MotionType;
  /** Divisional chart placements keyed by chart name. */
  divisional: Record<DivisionalChart, DivisionalPlacement>;
  d60Shashtiamsa: ShashtiamsaInfo;
  lordships: number[];
  role: FunctionalRole;
  combust: boolean;
  nakshatra: NakshatraName;
  pada: number;
  nakLord: PlanetName;
  signLord: PlanetName;
  karaka: KarakaName | null;
}

export interface ChartData {
  jd: number;
  lat: number;
  lon: number;
  ayanamsa: number;
  ascSid: number;
  ascSign: number;
  ascDeg: number;
  arudhaLagna: number;
  /** Ascendant sign in each divisional chart. */
  ascDivisional: Record<DivisionalChart, number>;
  ascNak: NakshatraName;
  ascPada: number;
  positions: Record<PlanetName, PlanetPosition>;
  planetData: PlanetData[];
  karakas: Partial<Record<PlanetName, KarakaName>>;
  upagrahas: {
    dhooma: number;
    vyatipata: number;
    parivesha: number;
    chapa: number;
    upaketu: number;
  };
  upagrahasFormatted: {
    dhooma: { sign: string; degrees: number; minutes: number; text: string };
    vyatipata: { sign: string; degrees: number; minutes: number; text: string };
    parivesha: { sign: string; degrees: number; minutes: number; text: string };
    chapa: { sign: string; degrees: number; minutes: number; text: string };
    upaketu: { sign: string; degrees: number; minutes: number; text: string };
  };
}

export interface ParivartanaYoga {
  houseA: number;
  houseB: number;
  planetA: PlanetName;
  planetB: PlanetName;
  type: 'Dainya' | 'Khala' | 'Maha';
}

export interface BuildChartParams {
  year: number;
  month: number;
  day: number;
  hour: number;
  lat: number;
  lon: number;
}
