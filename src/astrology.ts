import { computeAllPositions, julianDay } from './astronomy';
import {
  COMBUSTION_LIMITS,
  FUNCTIONAL_ROLES,
  NAKSHATRA_LIST,
  NAKSHATRA_LORDS,
  NATURAL_RELATIONSHIPS,
  NAVAMSA_START_SIGNS,
  PLANET_LIST,
  RULERSHIPS,
  SIGN_LORDS,
} from './constants';
import type {
  BuildChartParams,
  ChartData,
  CompoundRelationship,
  MotionType,
  NakshatraPada,
  PlanetData,
  PlanetName,
  PlanetPosition,
  RelationshipType,
} from './types';

const NAK_LEN = 40 / 3;
const PADA_LEN = 10 / 3;
const CHARA_KARAKA_NAMES = [
  'Atmakaraka',
  'Amatyakaraka',
  'Bhratrikaraka',
  'Matrikaraka',
  'Putrakaraka',
  'Gnatikaraka',
  'Darakaraka',
];
const COMPOUND_REL: Partial<Record<`${RelationshipType}/${RelationshipType}`, CompoundRelationship>> = {
  'Friend/Friend': 'Extreme Friendship',
  'Neutral/Friend': 'Friendship',
  'Enemy/Enemy': 'Extreme Enmity',
  'Neutral/Enemy': 'Enmity',
};

export function formatDms(degFloat: number): string {
  const deg = Math.floor(degFloat);
  const minFloat = (degFloat - deg) * 60;
  const minute = Math.floor(minFloat);
  return `${deg}° ${minute}' ${Math.round((minFloat - minute) * 6000) / 100}"`;
}

export function getNakshatraPada(longitude: number): NakshatraPada {
  const index = Math.floor(longitude / NAK_LEN);
  return { nakshatra: NAKSHATRA_LIST[index % 27], pada: Math.floor((longitude % NAK_LEN) / PADA_LEN) + 1 };
}

export const getNavamsaSign = (sign: number, deg: number) =>
  ((NAVAMSA_START_SIGNS[sign - 1] + Math.floor(deg / (30 / 9)) - 1) % 12) + 1;

export const getD7Sign = (sign: number, deg: number) => {
  const part = Math.floor(deg / (30 / 7));
  return sign % 2 === 1 ? ((sign + part - 1) % 12) + 1 : ((sign + part + 6) % 12) + 1;
};

export function isCombust(planet: PlanetName, sunLon: number, planetLon: number, motion: MotionType): boolean {
  const entry = COMBUSTION_LIMITS[planet];
  if (!entry) return false;
  const limit = motion === 'Retrograde' ? entry.retro : entry.direct;
  return limit !== null && Math.abs(((planetLon - sunLon + 180) % 360) - 180) < limit;
}

export const getLordships = (planet: PlanetName, ascSign: number) =>
  (RULERSHIPS[planet] ?? []).map((sign) => ((sign - ascSign + 12) % 12) + 1).sort((a, b) => a - b);

export function getFunctionalRole(planet: PlanetName, ascSign: number) {
  const roles = FUNCTIONAL_ROLES[ascSign];
  return roles?.benefics.includes(planet) ? 'Benefic'
    : roles?.malefics.includes(planet) ? 'Malefic'
    : roles?.neutrals.includes(planet) ? 'Neutral'
    : 'Unknown';
}

export const signToHouse = (sign: number, ascSign: number) => ((sign - ascSign + 12) % 12) + 1;

export const getTemporaryRelationship = (fromSign: number, toSign: number): RelationshipType =>
  [1, 2, 3, 9, 10, 11].includes(((toSign - fromSign) % 12 + 12) % 12) ? 'Friend' : 'Enemy';

export function getNaturalRelationship(a: PlanetName, b: PlanetName): RelationshipType {
  const rel = NATURAL_RELATIONSHIPS[a];
  return rel.friends.includes(b) ? 'Friend' : rel.enemies.includes(b) ? 'Enemy' : 'Neutral';
}

export const getCompoundRelationship = (nat: RelationshipType, temp: RelationshipType): CompoundRelationship =>
  COMPOUND_REL[`${nat}/${temp}`] ?? 'Neutral';

export function getCharaKarakas(positions: Record<PlanetName, PlanetPosition>): Partial<Record<PlanetName, string>> {
  return Object.fromEntries(
    PLANET_LIST
      .filter((planet) => planet !== 'Rahu' && planet !== 'Ketu')
      .map((planet) => ({ planet, lon: positions[planet].lon }))
      .sort((a, b) => b.lon - a.lon)
      .slice(0, CHARA_KARAKA_NAMES.length)
      .map(({ planet }, i) => [planet, CHARA_KARAKA_NAMES[i]]),
  ) as Partial<Record<PlanetName, string>>;
}

export function sphutaDrishti(
  asp: PlanetName,
  _aspected: PlanetName,
  aspLon: number,
  aspectedLon: number,
): number | null {
  const a = ((aspectedLon - aspLon) % 360 + 360) % 360;
  const mj = asp === 'Mars' || asp === 'Jupiter';
  const sat = asp === 'Saturn';

  if (asp === 'Mars') {
    if (a < 60) return a < 30 ? 0 : null;
    if (a < 90) return a - 45;
    if (a < 120) return 45 + (a - 90) / 2;
    if (a < 180) return 2 * (150 - a);
    if (a < 210) return 60;
    if (a < 240) return 270 - a;
    if (a < 270) return 0;
  }

  if (asp === 'Jupiter') {
    if (a < 60) return a < 30 ? 0 : (a - 30) / 2;
    if (a < 90) return null;
    if (a < 120) return 45 + (a - 90) / 2;
    if (a < 150) return 2 * (150 - a);
    if (a < 210) return null;
    if (a < 240) return 45 + (a - 210) / 2;
    if (a < 270) return 15 + (2 * (270 - a)) / 3;
    if (a < 300) return null;
  }

  if (sat) {
    if (a < 30) return null;
    if (a < 60) return (a - 30) * 2;
    if (a < 90) return 45 + (90 - a) / 2;
    if (a < 150) return a < 120 ? 30 + (120 - a) / 2 : null;
    if (a < 210) return (300 - a) / 2;
    if (a < 240) return null;
    if (a < 270) return a - 210;
    if (a < 300) return 2 * (300 - a);
    if (a < 330) return (300 - a) / 2;
    return 0;
  }

  if (a < 30) return 0;
  if (a < 60) return (a - 30) / 2;
  if (a < 90) return a - 45;
  if (a < 120) return mj ? 45 + (a - 90) / 2 : 30 + (120 - a) / 2;
  if (a < 150) return mj ? 2 * (150 - a) : 150 - a;
  if (a < 180) return mj ? 2 * (150 - a) : (300 - a) / 2;
  if (a < 210) return asp === 'Mars' ? 60 : (300 - a) / 2;
  if (a < 240) return asp === 'Jupiter' ? 45 + (a - 210) / 2 : (300 - a) / 2;
  if (a < 270) return asp === 'Jupiter' ? 15 + (2 * (270 - a)) / 3 : (300 - a) / 2;
  if (a < 330) return (300 - a) / 2;
  return 0;
}

export function buildChartData({ year, month, day, hour, lat, lon }: BuildChartParams): ChartData {
  const jd = julianDay(year, month, day, hour);
  const { positions, ayanamsa, ascSid, ascSign, ascDeg } = computeAllPositions(jd, lat, lon);
  const ascNavamsa = getNavamsaSign(ascSign, ascDeg);
  const ascD7 = getD7Sign(ascSign, ascDeg);
  const { nakshatra: ascNak, pada: ascPada } = getNakshatraPada(ascSid);
  const karakas = getCharaKarakas(positions);
  const sunLon = positions.Sun.lon;

  const planetData: PlanetData[] = PLANET_LIST.map((name) => {
    const { lon: planetLon, sign, deg, motion } = positions[name];
    const navamsaSign = getNavamsaSign(sign, deg);
    const d7Sign = getD7Sign(sign, deg);
    const { nakshatra, pada } = getNakshatraPada(planetLon);

    return {
      name,
      lon: planetLon,
      sign,
      deg,
      motion,
      house: signToHouse(sign, ascSign),
      navamsaSign,
      navamsaHouse: signToHouse(navamsaSign, ascNavamsa),
      d7Sign,
      d7House: signToHouse(d7Sign, ascD7),
      lordships: getLordships(name, ascSign),
      role: getFunctionalRole(name, ascSign),
      combust: name !== 'Sun' && !!COMBUSTION_LIMITS[name] && isCombust(name, sunLon, planetLon, motion),
      nakshatra,
      pada,
      nakLord: NAKSHATRA_LORDS[nakshatra] ?? '—',
      signLord: SIGN_LORDS[sign - 1],
      karaka: karakas[name] ?? null,
    };
  });

  return {
    jd,
    lat,
    lon,
    ayanamsa,
    ascSid,
    ascSign,
    ascDeg,
    ascNavamsa,
    ascD7,
    ascNak,
    ascPada,
    positions,
    planetData,
    karakas,
  };
}
