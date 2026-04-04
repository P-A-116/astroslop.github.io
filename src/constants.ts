// ============================================================
//  All constants — typed
// ============================================================

import type {
  PlanetName,
  RelationshipType,
  CompoundRelationship,
  OrbitalElements,
  FunctionalRole,
} from './types';

export const SIGN_NAMES: string[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const SIGN_LORDS: PlanetName[] = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];

export const NAKSHATRA_LIST: string[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

export const NAKSHATRA_LORDS: Record<string, PlanetName> = {
  Ashwini: 'Ketu', Bharani: 'Venus', Krittika: 'Sun', Rohini: 'Moon',
  Mrigashira: 'Mars', Ardra: 'Rahu', Punarvasu: 'Jupiter', Pushya: 'Saturn',
  Ashlesha: 'Mercury', Magha: 'Ketu', 'Purva Phalguni': 'Venus',
  'Uttara Phalguni': 'Sun', Hasta: 'Moon', Chitra: 'Mars', Swati: 'Rahu',
  Vishakha: 'Jupiter', Anuradha: 'Saturn', Jyeshtha: 'Mercury',
  Mula: 'Ketu', 'Purva Ashadha': 'Venus', 'Uttara Ashadha': 'Sun',
  Shravana: 'Moon', Dhanishta: 'Mars', Shatabhisha: 'Rahu',
  'Purva Bhadrapada': 'Jupiter', 'Uttara Bhadrapada': 'Saturn', Revati: 'Mercury',
};

export const PLANET_LIST: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

export const PLANET_ICONS: Record<PlanetName, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

interface NaturalRelationshipEntry {
  friends: PlanetName[];
  enemies: PlanetName[];
  equals: PlanetName[];
}

export const NATURAL_RELATIONSHIPS: Record<PlanetName, NaturalRelationshipEntry> = {
  Sun:     { friends: ['Moon', 'Mars', 'Jupiter'],       enemies: ['Venus', 'Saturn'],        equals: ['Mercury'] },
  Moon:    { friends: ['Sun', 'Mercury'],                enemies: [],                          equals: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
  Mars:    { friends: ['Sun', 'Moon', 'Jupiter'],        enemies: ['Mercury'],                 equals: ['Venus', 'Saturn'] },
  Mercury: { friends: ['Sun', 'Venus'],                  enemies: ['Moon'],                    equals: ['Mars', 'Jupiter', 'Saturn'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'],           enemies: ['Mercury', 'Venus'],        equals: ['Saturn'] },
  Venus:   { friends: ['Mercury', 'Saturn'],             enemies: ['Moon', 'Sun'],             equals: ['Mars', 'Jupiter'] },
  Saturn:  { friends: ['Mercury', 'Venus'],              enemies: ['Sun', 'Moon', 'Mars'],     equals: ['Jupiter'] },
  Rahu:    { friends: ['Jupiter', 'Venus', 'Saturn'],   enemies: ['Sun', 'Moon', 'Mars'],     equals: ['Mercury'] },
  Ketu:    { friends: ['Mars', 'Venus', 'Saturn'],       enemies: ['Sun', 'Moon'],             equals: ['Mercury', 'Jupiter'] },
};

interface CombustionEntry {
  direct: number | null;
  retro: number | null;
}

export const COMBUSTION_LIMITS: Partial<Record<PlanetName, CombustionEntry>> = {
  Moon:    { direct: 12,  retro: null },
  Mars:    { direct: 17,  retro: 8 },
  Mercury: { direct: 14,  retro: 12 },
  Jupiter: { direct: 11,  retro: 11 },
  Venus:   { direct: 10,  retro: 8 },
  Saturn:  { direct: 16,  retro: 16 },
};

// Rulerships use sign numbers 1–12 (not house numbers)
export const RULERSHIPS: Partial<Record<PlanetName, number[]>> = {
  Sun: [5], Moon: [4], Mercury: [3, 6], Venus: [2, 7], Mars: [1, 8],
  Jupiter: [9, 12], Saturn: [10, 11], Rahu: [11], Ketu: [8],
};

interface FunctionalRoleEntry {
  benefics: PlanetName[];
  malefics: PlanetName[];
  neutrals: PlanetName[];
}

export const FUNCTIONAL_ROLES: Record<number, FunctionalRoleEntry> = {
   1: { benefics: ['Sun', 'Jupiter'],           malefics: ['Saturn', 'Mercury', 'Venus'],       neutrals: ['Mars', 'Moon'] },
   2: { benefics: ['Saturn', 'Sun'],            malefics: ['Jupiter', 'Moon', 'Venus'],          neutrals: ['Mars', 'Mercury'] },
   3: { benefics: ['Venus', 'Mercury'],         malefics: ['Sun', 'Jupiter', 'Mars'],            neutrals: ['Saturn', 'Moon'] },
   4: { benefics: ['Mars', 'Jupiter', 'Moon'],  malefics: ['Venus', 'Mercury'],                  neutrals: ['Sun', 'Saturn'] },
   5: { benefics: ['Mars', 'Jupiter', 'Sun'],   malefics: ['Saturn', 'Venus', 'Mercury'],        neutrals: ['Moon'] },
   6: { benefics: ['Mercury', 'Venus'],         malefics: ['Moon', 'Jupiter', 'Mars'],           neutrals: ['Saturn', 'Sun'] },
   7: { benefics: ['Mercury', 'Saturn'],        malefics: ['Sun', 'Jupiter', 'Mars'],            neutrals: ['Moon', 'Venus'] },
   8: { benefics: ['Moon', 'Jupiter'],          malefics: ['Venus', 'Mercury', 'Saturn'],        neutrals: ['Sun', 'Mars'] },
   9: { benefics: ['Mars', 'Sun'],              malefics: ['Venus'],                             neutrals: ['Mercury', 'Jupiter', 'Saturn', 'Moon'] },
  10: { benefics: ['Venus', 'Mercury'],         malefics: ['Mars', 'Jupiter', 'Moon'],           neutrals: ['Sun', 'Saturn'] },
  11: { benefics: ['Venus', 'Saturn'],          malefics: ['Mars', 'Jupiter', 'Moon', 'Sun'],   neutrals: ['Mercury'] },
  12: { benefics: ['Moon', 'Mars', 'Jupiter'],  malefics: ['Mercury', 'Saturn', 'Venus', 'Sun'], neutrals: [] },
};

// Navamsa start sign (1-based) for each sign 1–12
export const NAVAMSA_START_SIGNS: number[] = [1, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7, 4];

export const ORBITAL_ELEMENTS: Record<string, OrbitalElements> = {
  Mercury: { N0: 48.3313, N1: 3.24587e-5, i0: 7.0047,  i1: 5.00e-8,   w0: 29.1241,  w1: 1.01444e-5,  a: 0.387098, e0: 0.205635, e1: 5.59e-10,   M0: 168.6562, M1: 4.0923344368 },
  Venus:   { N0: 76.6799, N1: 2.46590e-5, i0: 3.3946,  i1: 2.75e-8,   w0: 54.8910,  w1: 1.38374e-5,  a: 0.723330, e0: 0.006773, e1: -1.302e-9,  M0: 48.0052,  M1: 1.6021302244 },
  Mars:    { N0: 49.5574, N1: 2.11081e-5, i0: 1.8497,  i1: -1.78e-8,  w0: 286.5016, w1: 2.92961e-5,  a: 1.523688, e0: 0.093405, e1: 2.516e-9,   M0: 18.6021,  M1: 0.5240207766 },
  Jupiter: { N0: 100.4542, N1: 2.76854e-5, i0: 1.3030,  i1: -1.557e-7, w0: 273.8777, w1: 1.64505e-5,  a: 5.20256,  e0: 0.048498, e1: 4.469e-9,   M0: 19.8950,  M1: 0.0830853001 },
  Saturn:  { N0: 113.6634, N1: 2.38980e-5, i0: 2.4886,  i1: -1.081e-7, w0: 339.3939, w1: 2.97661e-5,  a: 9.55475,  e0: 0.055546, e1: -9.499e-9,  M0: 316.9670, M1: 0.0334442282 },
};

export const REL_CSS: Record<CompoundRelationship, string> = {
  'Extreme Friendship': 'rel-ef',
  'Friendship':         'rel-fr',
  'Neutral':            'rel-nu',
  'Enmity':             'rel-en',
  'Extreme Enmity':     'rel-ee',
};

export const REL_ABBR: Record<CompoundRelationship, string> = {
  'Extreme Friendship': 'E.Fr',
  'Friendship':         'Fr',
  'Neutral':            'Nu',
  'Enmity':             'En',
  'Extreme Enmity':     'E.En',
};

// Re-export types used in component files for convenience
export type { RelationshipType, CompoundRelationship, FunctionalRole };

export interface ShashtiamsaEntry {
  number: number;
  name: string;
  nature: 'B' | 'M';
  description: string;
}

/** The 60 Shashtiamsa divisions (ordered 1–60 for odd signs; reversed for even signs) */
export const SHASHTIAMSA_DATA: ShashtiamsaEntry[] = [
  { number:  1, name: 'Ghora',          nature: 'M', description: 'awful, violent' },
  { number:  2, name: 'Rakshasa',        nature: 'M', description: 'demoniacal' },
  { number:  3, name: 'Deva',            nature: 'B', description: 'divine, spiritual side' },
  { number:  4, name: 'Kubera',          nature: 'B', description: 'celestial treasurer' },
  { number:  5, name: 'Yaksha',          nature: 'B', description: 'celestial singer' },
  { number:  6, name: 'Kinnara',         nature: 'B', description: 'a mythical being with a human head in the form of a horse; a bad or deformed man' },
  { number:  7, name: 'Bhrashta',        nature: 'M', description: 'fallen, vicious' },
  { number:  8, name: 'Kulaghna',        nature: 'M', description: 'ruining a family' },
  { number:  9, name: 'Garala',          nature: 'M', description: 'poison or venom' },
  { number: 10, name: 'Vahni',           nature: 'M', description: 'fire, gastric fluid, digestive faculty, appetite' },
  { number: 11, name: 'Maya',            nature: 'M', description: 'deceit, jugglery' },
  { number: 12, name: 'Purishaka',       nature: 'M', description: 'dirt' },
  { number: 13, name: 'Apampathi',       nature: 'B', description: 'the ocean, Varuna (the rain god)' },
  { number: 14, name: 'Marut',           nature: 'B', description: 'the wind god' },
  { number: 15, name: 'Kala',            nature: 'M', description: 'dark blue colour, weather, Time, a distiller of liquor, Saturn, Siva, personification of the destructive principle' },
  { number: 16, name: 'Sarpa',           nature: 'M', description: 'snake' },
  { number: 17, name: 'Amrita',          nature: 'B', description: 'immortal, nectar' },
  { number: 18, name: 'Indu',            nature: 'B', description: 'Moon, number 1, camphor' },
  { number: 19, name: 'Mridu',           nature: 'B', description: 'moderate, soft' },
  { number: 20, name: 'Komala',          nature: 'B', description: 'tender, agreeable' },
  { number: 21, name: 'Heramba',         nature: 'B', description: 'Ganesa (elephant-faced god), a boastful hero' },
  { number: 22, name: 'Brahma',          nature: 'B', description: 'the Universal Father, sacred knowledge' },
  { number: 23, name: 'Vishnu',          nature: 'B', description: 'second deity of the sacred Triad; also Agni; lawgiver; a pious man' },
  { number: 24, name: 'Maheswara',       nature: 'B', description: 'third deity of the Triad, lord of destruction; also name of Vishnu; great sovereign' },
  { number: 25, name: 'Deva',            nature: 'B', description: 'divine, spiritual side' },
  { number: 26, name: 'Ardra',           nature: 'B', description: 'moist' },
  { number: 27, name: 'Kalinasa',        nature: 'B', description: 'destruction of strife' },
  { number: 28, name: 'Kshiteesa',       nature: 'B', description: 'ruler of the earth' },
  { number: 29, name: 'Kamalakara',      nature: 'B', description: 'a lake full of lotuses' },
  { number: 30, name: 'Gulika',          nature: 'M', description: "Saturn's son" },
  { number: 31, name: 'Mrithyu',         nature: 'M', description: 'son of Mars; death' },
  { number: 32, name: 'Kala',            nature: 'M', description: 'dark blue colour, weather, Time, a distiller of liquor, Saturn, Siva, personification of the destructive principle' },
  { number: 33, name: 'Davagni',         nature: 'M', description: 'a forest conflagration' },
  { number: 34, name: 'Ghora',           nature: 'M', description: 'awful, violent' },
  { number: 35, name: 'Yama',            nature: 'M', description: 'death personified' },
  { number: 36, name: 'Kantaka',         nature: 'M', description: 'thorn; troublemaker; enemy of order and government' },
  { number: 37, name: 'Sudha',           nature: 'B', description: 'nectar, ambrosia, name of the Ganges' },
  { number: 38, name: 'Amrita',          nature: 'B', description: 'immortal, nectar' },
  { number: 39, name: 'Poornachandra',   nature: 'B', description: 'Full Moon' },
  { number: 40, name: 'Vishadagdha',     nature: 'M', description: 'destroyed by poison, consumed by grief' },
  { number: 41, name: 'Kulanasa',        nature: 'M', description: 'ruining a family' },
  { number: 42, name: 'Vamshakshaya',    nature: 'M', description: 'lineage ceasing to grow' },
  { number: 43, name: 'Utpata',          nature: 'M', description: 'portent, calamity (eclipse, earthquake, etc.)' },
  { number: 44, name: 'Kala',            nature: 'M', description: 'dark blue colour, weather, Time, a distiller of liquor, Saturn, Siva, personification of the destructive principle' },
  { number: 45, name: 'Saumya',          nature: 'B', description: 'relating to the Moon, handsome, auspicious' },
  { number: 46, name: 'Komala',          nature: 'B', description: 'tender, agreeable' },
  { number: 47, name: 'Sheetala',        nature: 'B', description: 'cold, Moon, camphor, sandal' },
  { number: 48, name: 'Karaladamshtra',  nature: 'M', description: 'frightful-toothed' },
  { number: 49, name: 'Chandramukhi',    nature: 'B', description: 'moon-faced beauty' },
  { number: 50, name: 'Praveena',        nature: 'B', description: 'clever, skilled' },
  { number: 51, name: 'Kalapavaka',      nature: 'M', description: 'destructive fire at end of the world' },
  { number: 52, name: 'Dandayudha',      nature: 'M', description: 'staff of an ascetic or Brahmin' },
  { number: 53, name: 'Nirmala',         nature: 'B', description: 'pure, spotless, virtuous' },
  { number: 54, name: 'Saumya',          nature: 'B', description: 'relating to the Moon, handsome, auspicious' },
  { number: 55, name: 'Krura',           nature: 'M', description: 'cruel, mischievous, terrible' },
  { number: 56, name: 'Atishita',        nature: 'B', description: 'very cold' },
  { number: 57, name: 'Amrita',          nature: 'B', description: 'immortal, nectar' },
  { number: 58, name: 'Payodhi',         nature: 'B', description: 'ocean' },
  { number: 59, name: 'Bhramana',        nature: 'M', description: 'wandering' },
  { number: 60, name: 'Chandra Rekha',   nature: 'B', description: 'digit or streak of the Moon' },
];
