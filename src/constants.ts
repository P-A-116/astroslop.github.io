import type {
  PlanetName,
  RelationshipType,
  CompoundRelationship,
  FunctionalRole,
} from './types';

interface NaturalRelationshipEntry {
  friends: PlanetName[];
  enemies: PlanetName[];
  equals: PlanetName[];
}

interface CombustionEntry {
  direct: number | null;
  retro: number | null;
}

interface FunctionalRoleEntry {
  benefics: PlanetName[];
  malefics: PlanetName[];
  neutrals: PlanetName[];
}

export interface ShashtiamsaEntry {
  number: number;
  name: string;
  nature: 'B' | 'M';
  description: string;
}

const planets = (text = '') => (text ? text.split(' ') : []) as PlanetName[];
const rel = (friends: string, enemies: string, equals = ''): NaturalRelationshipEntry => ({
  friends: planets(friends),
  enemies: planets(enemies),
  equals: planets(equals),
});
const role = (benefics: string, malefics: string, neutrals = ''): FunctionalRoleEntry => ({
  benefics: planets(benefics),
  malefics: planets(malefics),
  neutrals: planets(neutrals),
});
const sh = (name: string, nature: 'B' | 'M', description: string) => [name, nature, description] as const;

export const SIGN_NAMES = 'Aries Taurus Gemini Cancer Leo Virgo Libra Scorpio Sagittarius Capricorn Aquarius Pisces'.split(' ');
export const PLANET_LIST = planets('Sun Moon Mars Mercury Jupiter Venus Saturn Rahu Ketu');
export const SIGN_LORDS = planets('Mars Venus Mercury Moon Sun Mercury Venus Mars Jupiter Saturn Saturn Jupiter');
export const NAKSHATRA_LIST = 'Ashwini|Bharani|Krittika|Rohini|Mrigashira|Ardra|Punarvasu|Pushya|Ashlesha|Magha|Purva Phalguni|Uttara Phalguni|Hasta|Chitra|Swati|Vishakha|Anuradha|Jyeshtha|Mula|Purva Ashadha|Uttara Ashadha|Shravana|Dhanishta|Shatabhisha|Purva Bhadrapada|Uttara Bhadrapada|Revati'.split('|');

const NAKSHATRA_LORD_SEQUENCE = planets('Ketu Venus Sun Moon Mars Rahu Jupiter Saturn Mercury');
export const NAKSHATRA_LORDS = Object.fromEntries(
  NAKSHATRA_LIST.map((nakshatra, index) => [
    nakshatra,
    NAKSHATRA_LORD_SEQUENCE[index % NAKSHATRA_LORD_SEQUENCE.length],
  ]),
) as Record<string, PlanetName>;

const PLANET_GLYPHS = ['\u2609', '\u263D', '\u2642', '\u263F', '\u2643', '\u2640', '\u2644', '\u260A', '\u260B'];
export const PLANET_ICONS = Object.fromEntries(
  PLANET_LIST.map((planet, index) => [planet, PLANET_GLYPHS[index]]),
) as Record<PlanetName, string>;

export const NATURAL_RELATIONSHIPS: Record<PlanetName, NaturalRelationshipEntry> = {
  Sun: rel('Moon Mars Jupiter', 'Venus Saturn', 'Mercury'),
  Moon: rel('Sun Mercury', '', 'Mars Jupiter Venus Saturn'),
  Mars: rel('Sun Moon Jupiter', 'Mercury', 'Venus Saturn'),
  Mercury: rel('Sun Venus', 'Moon', 'Mars Jupiter Saturn'),
  Jupiter: rel('Sun Moon Mars', 'Mercury Venus', 'Saturn'),
  Venus: rel('Mercury Saturn', 'Moon Sun', 'Mars Jupiter'),
  Saturn: rel('Mercury Venus', 'Sun Moon Mars', 'Jupiter'),
  Rahu: rel('Jupiter Venus Saturn', 'Sun Moon Mars', 'Mercury'),
  Ketu: rel('Mars Venus Saturn', 'Sun Moon', 'Mercury Jupiter'),
};

export const COMBUSTION_LIMITS: Partial<Record<PlanetName, CombustionEntry>> = {
  Moon: { direct: 12, retro: null },
  Mars: { direct: 17, retro: 8 },
  Mercury: { direct: 14, retro: 12 },
  Jupiter: { direct: 11, retro: 11 },
  Venus: { direct: 10, retro: 8 },
  Saturn: { direct: 16, retro: 16 },
};

const rulerships = {} as Partial<Record<PlanetName, number[]>>;
SIGN_LORDS.forEach((planet, index) => ((rulerships[planet] ??= []).push(index + 1)));
rulerships.Rahu = [11];
rulerships.Ketu = [8];
export const RULERSHIPS = rulerships;

export const FUNCTIONAL_ROLES: Record<number, FunctionalRoleEntry> = {
  1: role('Sun Jupiter', 'Saturn Mercury Venus', 'Mars Moon'),
  2: role('Saturn Sun', 'Jupiter Moon Venus', 'Mars Mercury'),
  3: role('Venus Mercury', 'Sun Jupiter Mars', 'Saturn Moon'),
  4: role('Mars Jupiter Moon', 'Venus Mercury', 'Sun Saturn'),
  5: role('Mars Jupiter Sun', 'Saturn Venus Mercury', 'Moon'),
  6: role('Mercury Venus', 'Moon Jupiter Mars', 'Saturn Sun'),
  7: role('Mercury Saturn', 'Sun Jupiter Mars', 'Moon Venus'),
  8: role('Moon Jupiter', 'Venus Mercury Saturn', 'Sun Mars'),
  9: role('Mars Sun', 'Venus', 'Mercury Jupiter Saturn Moon'),
  10: role('Venus Mercury', 'Mars Jupiter Moon', 'Sun Saturn'),
  11: role('Venus Saturn', 'Mars Jupiter Moon Sun', 'Mercury'),
  12: role('Moon Mars Jupiter', 'Mercury Saturn Venus Sun'),
};

export const NAVAMSA_START_SIGNS = Array(3).fill([1, 10, 7, 4]).flat();

export const REL_CSS: Record<CompoundRelationship, string> = {
  'Extreme Friendship': 'rel-ef',
  Friendship: 'rel-fr',
  Neutral: 'rel-nu',
  Enmity: 'rel-en',
  'Extreme Enmity': 'rel-ee',
};

export const REL_ABBR: Record<CompoundRelationship, string> = {
  'Extreme Friendship': 'E.Fr',
  Friendship: 'Fr',
  Neutral: 'Nu',
  Enmity: 'En',
  'Extreme Enmity': 'E.En',
};

export type { RelationshipType, CompoundRelationship, FunctionalRole };

const DESC = {
  awful: 'awful, violent',
  divine: 'divine, spiritual side',
  family: 'ruining a family',
  kala: 'dark blue colour, weather, Time, a distiller of liquor, Saturn, Siva, personification of the destructive principle',
  amrita: 'immortal, nectar',
  komala: 'tender, agreeable',
  saumya: 'relating to the Moon, handsome, auspicious',
} as const;

const SHASHTIAMSA_ROWS = [
  sh('Ghora', 'M', DESC.awful),
  sh('Rakshasa', 'M', 'demoniacal'),
  sh('Deva', 'B', DESC.divine),
  sh('Kubera', 'B', 'celestial treasurer'),
  sh('Yaksha', 'B', 'celestial singer'),
  sh('Kinnara', 'B', 'a mythical being with a human head in the form of a horse; a bad or deformed man'),
  sh('Bhrashta', 'M', 'fallen, vicious'),
  sh('Kulaghna', 'M', DESC.family),
  sh('Garala', 'M', 'poison or venom'),
  sh('Vahni', 'M', 'fire, gastric fluid, digestive faculty, appetite'),
  sh('Maya', 'M', 'deceit, jugglery'),
  sh('Purishaka', 'M', 'dirt'),
  sh('Apampathi', 'B', 'the ocean, Varuna (the rain god)'),
  sh('Marut', 'B', 'the wind god'),
  sh('Kala', 'M', DESC.kala),
  sh('Sarpa', 'M', 'snake'),
  sh('Amrita', 'B', DESC.amrita),
  sh('Indu', 'B', 'Moon, number 1, camphor'),
  sh('Mridu', 'B', 'moderate, soft'),
  sh('Komala', 'B', DESC.komala),
  sh('Heramba', 'B', 'Ganesa (elephant-faced god), a boastful hero'),
  sh('Brahma', 'B', 'the Universal Father, sacred knowledge'),
  sh('Vishnu', 'B', 'second deity of the sacred Triad; also Agni; lawgiver; a pious man'),
  sh('Maheswara', 'B', 'third deity of the Triad, lord of destruction; also name of Vishnu; great sovereign'),
  sh('Deva', 'B', DESC.divine),
  sh('Ardra', 'B', 'moist'),
  sh('Kalinasa', 'B', 'destruction of strife'),
  sh('Kshiteesa', 'B', 'ruler of the earth'),
  sh('Kamalakara', 'B', 'a lake full of lotuses'),
  sh('Gulika', 'M', "Saturn's son"),
  sh('Mrithyu', 'M', 'son of Mars; death'),
  sh('Kala', 'M', DESC.kala),
  sh('Davagni', 'M', 'a forest conflagration'),
  sh('Ghora', 'M', DESC.awful),
  sh('Yama', 'M', 'death personified'),
  sh('Kantaka', 'M', 'thorn; troublemaker; enemy of order and government'),
  sh('Sudha', 'B', 'nectar, ambrosia, name of the Ganges'),
  sh('Amrita', 'B', DESC.amrita),
  sh('Poornachandra', 'B', 'Full Moon'),
  sh('Vishadagdha', 'M', 'destroyed by poison, consumed by grief'),
  sh('Kulanasa', 'M', DESC.family),
  sh('Vamshakshaya', 'M', 'lineage ceasing to grow'),
  sh('Utpata', 'M', 'portent, calamity (eclipse, earthquake, etc.)'),
  sh('Kala', 'M', DESC.kala),
  sh('Saumya', 'B', DESC.saumya),
  sh('Komala', 'B', DESC.komala),
  sh('Sheetala', 'B', 'cold, Moon, camphor, sandal'),
  sh('Karaladamshtra', 'M', 'frightful-toothed'),
  sh('Chandramukhi', 'B', 'moon-faced beauty'),
  sh('Praveena', 'B', 'clever, skilled'),
  sh('Kalapavaka', 'M', 'destructive fire at end of the world'),
  sh('Dandayudha', 'M', 'staff of an ascetic or Brahmin'),
  sh('Nirmala', 'B', 'pure, spotless, virtuous'),
  sh('Saumya', 'B', DESC.saumya),
  sh('Krura', 'M', 'cruel, mischievous, terrible'),
  sh('Atishita', 'B', 'very cold'),
  sh('Amrita', 'B', DESC.amrita),
  sh('Payodhi', 'B', 'ocean'),
  sh('Bhramana', 'M', 'wandering'),
  sh('Chandra Rekha', 'B', 'digit or streak of the Moon'),
] as const;

export const SHASHTIAMSA_DATA: ShashtiamsaEntry[] = SHASHTIAMSA_ROWS.map(
  ([name, nature, description], index) => ({
    number: index + 1,
    name,
    nature,
    description,
  }),
);
