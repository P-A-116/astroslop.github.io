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
export type GulikaTimeDivisionMode = 'day-night-8-parts';
export type GulikaStartLordMode = 'weekday' | 'fifth-from-weekday';
export type GulikaIdentityMode = 'same' | 'start-vs-end' | 'separate';

export interface DMS {
  deg: number;
  minute: number;
  sec: number;
}

export interface NakshatraPada {
  nakshatra: string;
  pada: number;
}

export interface GeoCoordinates {
  lat: number;
  lon: number;
}

export interface GulikaConfig {
  timeDivision: GulikaTimeDivisionMode;
  startLordMode: GulikaStartLordMode;
  identityMode: GulikaIdentityMode;
}

export interface GulikaSegment {
  start: Date;
  end: Date;
  idx: number;
}

export interface GulikaSegmentTrace extends GulikaSegment {
  lord: WeekdayPlanet;
}

export interface GulikaPeriodResult {
  period: 'day' | 'night';
  start: Date;
  end: Date;
}

export interface GulikaComputationTimes {
  gulikaTime: Date;
  mandiTime: Date;
}

export interface GulikaDebugParams {
  date: Date;
  location: GeoCoordinates;
  sunrise: Date;
  sunset: Date;
  gulikaConfig: GulikaConfig;
}

export interface GulikaDebugResult {
  period: 'day' | 'night';
  dayStart: Date;
  dayEnd: Date;
  weekday: number;
  startLord: WeekdayPlanet;
  lords: WeekdayPlanet[];
  segments: GulikaSegmentTrace[];
  gulikaSegment: GulikaSegmentTrace;
  gulikaTime: Date;
  mandiTime: Date;
  gulikaLongitude: number;
  mandiLongitude: number;
  gulikaSign: number;
  mandiSign: number;
}

export interface UpagrahaFormValues {
  eventDate: Date;
  sunrise: Date | null;
  sunset: Date | null;
  gulikaConfig: GulikaConfig;
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
  d20Sign: number;
  d20House: number;
  d24Sign: number;
  d24House: number;
  d27Sign: number;
  d27House: number;
  d30Sign: number;
  d30House: number;
  d40Sign: number;
  d40House: number;
  d45Sign: number;
  d45House: number;
  d60Sign: number;
  d60House: number;
  d60Shashtiamsa: ShashtiamsaInfo;
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
  arudhaLagna: number;
  ascNavamsa: number;
  ascD7: number;
  ascD2: number;
  ascD3: number;
  ascD4: number;
  ascD10: number;
  ascD12: number;
  ascD16: number;
  ascD20: number;
  ascD24: number;
  ascD27: number;
  ascD30: number;
  ascD40: number;
  ascD45: number;
  ascD60: number;
  ascNak: string;
  ascPada: number;
  positions: Record<PlanetName, PlanetPosition>;
  planetData: PlanetData[];
  karakas: Partial<Record<PlanetName, string>>;
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
