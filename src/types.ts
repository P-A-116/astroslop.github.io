// ============================================================
//  Shared TypeScript interfaces and type definitions
// ============================================================

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter'
  | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

export type SignNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type DivisionalChart = 'D1' | 'D2' | 'D3' | 'D4' | 'D7' | 'D9' | 'D10' | 'D12' | 'D16';

export type RelationshipType = 'Friend' | 'Enemy' | 'Neutral';

export type CompoundRelationship =
  | 'Extreme Friendship'
  | 'Friendship'
  | 'Neutral'
  | 'Enmity'
  | 'Extreme Enmity';

export type MotionType = 'Direct' | 'Retrograde';

export type FunctionalRole = 'Benefic' | 'Malefic' | 'Neutral' | 'Unknown';

export interface DMS {
  deg: number;
  minute: number;
  sec: number;
}

export interface NakshatraPada {
  nakshatra: string;
  pada: number;
}

export interface PlanetPosition {
  lon: number;
  sign: number;
  deg: number;
  motion: MotionType;
}

export interface PlanetData {
  name: PlanetName;
  lon: number;
  sign: number;
  deg: number;
  motion: MotionType;
  house: number;
  navamsaSign: number;
  navamsaHouse: number;
  d7Sign: number;
  d7House: number;
  d2Sign: number;
  d3Sign: number;
  d4Sign: number;
  d10Sign: number;
  d10House: number;
  d12Sign: number;
  d12House: number;
  d16Sign: number;
  d16House: number;
  lordships: number[];
  role: FunctionalRole;
  combust: boolean;
  nakshatra: string;
  pada: number;
  nakLord: string;
  signLord: string;
  karaka: string | null;
}

export interface ChartData {
  jd: number;
  lat: number;
  lon: number;
  ayanamsa: number;
  ascSid: number;
  ascSign: number;
  ascDeg: number;
  ascNavamsa: number;
  ascD7: number;
  ascD2: number;
  ascD3: number;
  ascD4: number;
  ascD10: number;
  ascD12: number;
  ascD16: number;
  ascNak: string;
  ascPada: number;
  positions: Record<PlanetName, PlanetPosition>;
  planetData: PlanetData[];
  karakas: Partial<Record<PlanetName, string>>;
}

export interface ParivartanaYoga {
  houseA: number;
  houseB: number;
  planetA: PlanetName;  // lord of houseA, placed in houseB
  planetB: PlanetName;  // lord of houseB, placed in houseA
  type: 'Dainya' | 'Khala' | 'Maha';
}

export interface OrbitalElements {
  N0: number; N1: number;
  i0: number; i1: number;
  w0: number; w1: number;
  a: number;
  e0: number; e1: number;
  M0: number; M1: number;
}

export interface BuildChartParams {
  year: number;
  month: number;
  day: number;
  hour: number;
  lat: number;
  lon: number;
}
