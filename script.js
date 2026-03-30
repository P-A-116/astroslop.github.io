// ============================================================
//  Vedic Astrology Chart Maker — script.js
//  Ported from CHART MAKER.py (Swiss Ephemeris → JS approx.)
// ============================================================

'use strict';

// ============================================================
// CONSTANTS
// ============================================================

const SIGN_NAMES = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];

const SIGN_LORDS = [
  'Mars','Venus','Mercury','Moon','Sun','Mercury',
  'Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'
];

const NAKSHATRA_LIST = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta',
  'Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
];

const NAKSHATRA_LORDS = {
  'Ashwini':'Ketu','Bharani':'Venus','Krittika':'Sun','Rohini':'Moon',
  'Mrigashira':'Mars','Ardra':'Rahu','Punarvasu':'Jupiter','Pushya':'Saturn',
  'Ashlesha':'Mercury','Magha':'Ketu','Purva Phalguni':'Venus',
  'Uttara Phalguni':'Sun','Hasta':'Moon','Chitra':'Mars','Swati':'Rahu',
  'Vishakha':'Jupiter','Anuradha':'Saturn','Jyeshtha':'Mercury',
  'Mula':'Ketu','Purva Ashadha':'Venus','Uttara Ashadha':'Sun',
  'Shravana':'Moon','Dhanishta':'Mars','Shatabhisha':'Rahu',
  'Purva Bhadrapada':'Jupiter','Uttara Bhadrapada':'Saturn','Revati':'Mercury'
};

const PLANET_LIST = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

const PLANET_ICONS = {
  Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿',
  Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋'
};

const NATURAL_RELATIONSHIPS = {
  Sun:     {friends:['Moon','Mars','Jupiter'],       enemies:['Venus','Saturn'],         equals:['Mercury']},
  Moon:    {friends:['Sun','Mercury'],               enemies:[],                         equals:['Mars','Jupiter','Venus','Saturn']},
  Mars:    {friends:['Sun','Moon','Jupiter'],        enemies:['Mercury'],                equals:['Venus','Saturn']},
  Mercury: {friends:['Sun','Venus'],                 enemies:['Moon'],                   equals:['Mars','Jupiter','Saturn']},
  Jupiter: {friends:['Sun','Moon','Mars'],           enemies:['Mercury','Venus'],         equals:['Saturn']},
  Venus:   {friends:['Mercury','Saturn'],            enemies:['Moon','Sun'],             equals:['Mars','Jupiter']},
  Saturn:  {friends:['Mercury','Venus'],             enemies:['Sun','Moon','Mars'],       equals:['Jupiter']},
  Rahu:    {friends:['Jupiter','Venus','Saturn'],    enemies:['Sun','Moon','Mars'],       equals:['Mercury']},
  Ketu:    {friends:['Mars','Venus','Saturn'],       enemies:['Sun','Moon'],             equals:['Mercury','Jupiter']}
};

const COMBUSTION_LIMITS = {
  Moon:    {direct:12,  retro:null},
  Mars:    {direct:17,  retro:8},
  Mercury: {direct:14,  retro:12},
  Jupiter: {direct:11,  retro:11},
  Venus:   {direct:10,  retro:8},
  Saturn:  {direct:16,  retro:16}
};

// Rulerships use sign numbers 1–12 (not house numbers)
const RULERSHIPS = {
  Sun:[5], Moon:[4], Mercury:[3,6], Venus:[2,7], Mars:[1,8],
  Jupiter:[9,12], Saturn:[10,11], Rahu:[11], Ketu:[8]
};

const FUNCTIONAL_ROLES = {
  1: {benefics:['Sun','Jupiter'],           malefics:['Saturn','Mercury','Venus'],          neutrals:['Mars','Moon']},
  2: {benefics:['Saturn','Sun'],            malefics:['Jupiter','Moon','Venus'],             neutrals:['Mars','Mercury']},
  3: {benefics:['Venus','Mercury'],         malefics:['Sun','Jupiter','Mars'],              neutrals:['Saturn','Moon']},
  4: {benefics:['Mars','Jupiter','Moon'],   malefics:['Venus','Mercury'],                   neutrals:['Sun','Saturn']},
  5: {benefics:['Mars','Jupiter','Sun'],    malefics:['Saturn','Venus','Mercury'],           neutrals:['Moon']},
  6: {benefics:['Mercury','Venus'],         malefics:['Moon','Jupiter','Mars'],             neutrals:['Saturn','Sun']},
  7: {benefics:['Mercury','Saturn'],        malefics:['Sun','Jupiter','Mars'],              neutrals:['Moon','Venus']},
  8: {benefics:['Moon','Jupiter'],          malefics:['Venus','Mercury','Saturn'],           neutrals:['Sun','Mars']},
  9: {benefics:['Mars','Sun'],              malefics:['Venus'],                             neutrals:['Mercury','Jupiter','Saturn','Moon']},
 10: {benefics:['Venus','Mercury'],         malefics:['Mars','Jupiter','Moon'],             neutrals:['Sun','Saturn']},
 11: {benefics:['Venus','Saturn'],          malefics:['Mars','Jupiter','Moon','Sun'],        neutrals:['Mercury']},
 12: {benefics:['Moon','Mars','Jupiter'],   malefics:['Mercury','Saturn','Venus','Sun'],     neutrals:[]}
};

// Navamsa start sign (1-based) for each sign 1–12
const NAVAMSA_START_SIGNS = [1,10,7,4,1,10,7,4,1,10,7,4];

// ============================================================
// UTILITY
// ============================================================

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function toRad(d){ return d * RAD; }
function toDeg(r){ return r * DEG; }
function norm(x){ return ((x % 360) + 360) % 360; }

// ============================================================
// ASTRONOMICAL CALCULATIONS
// (Simplified VSOP87 / Meeus / Paul Schlyter approach)
// ============================================================

/** Julian Day Number for a UTC datetime */
function julianDay(year, month, day, hour){
  let y = year, m = month;
  if(m <= 2){ y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716))
       + Math.floor(30.6001 * (m + 1))
       + day + hour / 24 + B - 1524.5;
}

/**
 * Lahiri (Chitra Paksha) ayanamsa in degrees.
 * Linear approximation: ~22.4637° at J1900, +1.39694°/century.
 */
function lahiriAyanamsa(jd){
  const T = (jd - 2415020.0) / 36525.0;
  return 22.4637 + 1.39694 * T;
}

/** Solve Kepler's equation iteratively; returns E in radians */
function kepler(M_deg, e){
  const M = toRad(norm(M_deg));
  let E = M;
  for(let i = 0; i < 50; i++){
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if(Math.abs(dE) < 1e-9) break;
  }
  return E;
}

/** True anomaly (degrees) from mean anomaly (degrees) and eccentricity */
function trueAnomaly(M_deg, e){
  const E = kepler(M_deg, e);
  return toDeg(2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2),
                               Math.sqrt(1 - e) * Math.cos(E / 2)));
}

/**
 * Sun's geocentric ecliptic longitude and distance.
 * d = JD − 2451543.5 (days from 1999 Dec 31.0)
 */
function sunLongitude(d){
  const w = norm(282.9404 + 4.70935e-5 * d);
  const e = 0.016709 - 1.151e-9 * d;
  const M = norm(356.0470 + 0.9856002585 * d);
  const v = trueAnomaly(M, e);
  const r = (1 - e * e) / (1 + e * Math.cos(toRad(v)));
  return { lon: norm(v + w), r };
}

/**
 * Moon's geocentric ecliptic longitude (with main perturbation terms).
 * d = JD − 2451543.5
 */
function moonLongitude(d){
  const N  = norm(125.1228 - 0.0529538083 * d);
  const i  = 5.1454;
  const w  = norm(318.0634 + 0.1643573223 * d);
  const e  = 0.054900;
  const Mm = norm(115.3654 + 13.0649929509 * d);
  const L  = norm(N + w + Mm);   // Moon mean longitude

  const v  = trueAnomaly(Mm, e);
  const r  = 60.2666 * (1 - e * e) / (1 + e * Math.cos(toRad(v)));

  // Ecliptic heliocentric coords (but Moon orbits Earth → geocentric directly)
  const lv = toRad(v + w);
  const Nr = toRad(N);
  const ir = toRad(i);
  const xh = r * (Math.cos(Nr)*Math.cos(lv) - Math.sin(Nr)*Math.sin(lv)*Math.cos(ir));
  const yh = r * (Math.sin(Nr)*Math.cos(lv) + Math.cos(Nr)*Math.sin(lv)*Math.cos(ir));
  const zh = r *                               Math.sin(lv)*Math.sin(ir);

  let lon = toDeg(Math.atan2(yh, xh));

  // Perturbation corrections (degrees)
  const Ms = norm(356.0470 + 0.9856002585 * d); // Sun mean anomaly
  const sun = sunLongitude(d);
  const D   = norm(L - sun.lon);   // Mean elongation
  const F   = norm(L - N);         // Argument of latitude

  lon += -1.274 * Math.sin(toRad(Mm - 2*D))
        + 0.658 * Math.sin(toRad(2*D))
        - 0.186 * Math.sin(toRad(Ms))
        - 0.059 * Math.sin(toRad(2*Mm - 2*D))
        - 0.057 * Math.sin(toRad(Mm - 2*D + Ms))
        + 0.053 * Math.sin(toRad(Mm + 2*D))
        + 0.046 * Math.sin(toRad(2*D - Ms))
        + 0.041 * Math.sin(toRad(Mm - Ms))
        - 0.035 * Math.sin(toRad(D))
        - 0.031 * Math.sin(toRad(Mm + Ms))
        - 0.015 * Math.sin(toRad(2*F - 2*D))
        + 0.011 * Math.sin(toRad(Mm - 4*D));

  return { lon: norm(lon) };
}

/** Orbital elements [constant, rate_per_day] for each outer/inner planet */
const ORBITAL_ELEMENTS = {
  Mercury:{ N0:48.3313, N1:3.24587e-5, i0:7.0047,  i1:5.00e-8,   w0:29.1241,  w1:1.01444e-5,  a:0.387098, e0:0.205635, e1:5.59e-10,   M0:168.6562, M1:4.0923344368 },
  Venus:  { N0:76.6799, N1:2.46590e-5, i0:3.3946,  i1:2.75e-8,   w0:54.8910,  w1:1.38374e-5,  a:0.723330, e0:0.006773, e1:-1.302e-9,  M0:48.0052,  M1:1.6021302244 },
  Mars:   { N0:49.5574, N1:2.11081e-5, i0:1.8497,  i1:-1.78e-8,  w0:286.5016, w1:2.92961e-5,  a:1.523688, e0:0.093405, e1:2.516e-9,   M0:18.6021,  M1:0.5240207766 },
  Jupiter:{ N0:100.4542,N1:2.76854e-5, i0:1.3030,  i1:-1.557e-7, w0:273.8777, w1:1.64505e-5,  a:5.20256,  e0:0.048498, e1:4.469e-9,   M0:19.8950,  M1:0.0830853001 },
  Saturn: { N0:113.6634,N1:2.38980e-5, i0:2.4886,  i1:-1.081e-7, w0:339.3939, w1:2.97661e-5,  a:9.55475,  e0:0.055546, e1:-9.499e-9,  M0:316.9670, M1:0.0334442282 }
};

/** Geocentric ecliptic longitude for a named planet */
function planetLongitude(name, d){
  const el = ORBITAL_ELEMENTS[name];
  const N_d = norm(el.N0 + el.N1 * d);
  const i_d = el.i0 + el.i1 * d;
  const w_d = norm(el.w0 + el.w1 * d);
  const e_d = el.e0 + el.e1 * d;
  const M_d = norm(el.M0 + el.M1 * d);
  const v   = trueAnomaly(M_d, e_d);
  const r   = el.a * (1 - e_d*e_d) / (1 + e_d * Math.cos(toRad(v)));

  const lv  = toRad(v + w_d);
  const Nr  = toRad(N_d);
  const ir  = toRad(i_d);
  const xh  = r * (Math.cos(Nr)*Math.cos(lv) - Math.sin(Nr)*Math.sin(lv)*Math.cos(ir));
  const yh  = r * (Math.sin(Nr)*Math.cos(lv) + Math.cos(Nr)*Math.sin(lv)*Math.cos(ir));
  const zh  = r *                               Math.sin(lv)*Math.sin(ir);

  // Convert heliocentric → geocentric using Sun's position
  const sun = sunLongitude(d);
  const xe  = -sun.r * Math.cos(toRad(sun.lon)); // Earth heliocentric x
  const ye  = -sun.r * Math.sin(toRad(sun.lon)); // Earth heliocentric y
  const xg  = xh - xe;
  const yg  = yh - ye;
  return { lon: norm(toDeg(Math.atan2(yg, xg))) };
}

/** Rahu (Moon mean ascending node) tropical longitude */
function rahuTropical(d){
  return norm(125.1228 - 0.0529538083 * d);
}

/** Compute speed (deg/day) via central finite difference */
function planetSpeed(name, d){
  const h = 0.5;
  let l1, l2;
  if(name === 'Sun'){
    l1 = sunLongitude(d - h).lon;  l2 = sunLongitude(d + h).lon;
  } else if(name === 'Moon'){
    l1 = moonLongitude(d - h).lon; l2 = moonLongitude(d + h).lon;
  } else if(name === 'Rahu' || name === 'Ketu'){
    return -1; // always retrograde
  } else {
    l1 = planetLongitude(name, d - h).lon;
    l2 = planetLongitude(name, d + h).lon;
  }
  let diff = l2 - l1;
  if(diff > 180) diff -= 360;
  if(diff < -180) diff += 360;
  return diff / (2 * h);
}

/** Ascendant tropical longitude from JD, geographic lat/lon (degrees) */
function computeAscendant(jd, lat, lon){
  const d    = jd - 2451545.0;
  // Greenwich Mean Sidereal Time in degrees
  const GMST = norm(280.46061837 + 360.98564736629 * d);
  const RAMC = toRad(norm(GMST + lon)); // Local Sidereal Time as angle
  const obl  = toRad(23.4393 - 3.563e-7 * d);
  const latR = toRad(lat);
  // Standard ascendant formula
  const y = Math.cos(RAMC);
  const x = -(Math.sin(RAMC) * Math.cos(obl) + Math.tan(latR) * Math.sin(obl));
  return norm(toDeg(Math.atan2(y, x)));
}

/**
 * Master function: compute all sidereal planetary positions + ascendant.
 * Returns { positions, ayanamsa, ascSid, ascSign, ascDeg }
 */
function computeAllPositions(jd, lat, lon){
  const d        = jd - 2451543.5;
  const ayanamsa = lahiriAyanamsa(jd);

  const raw = {};

  // Sun
  raw.Sun = { tropLon: sunLongitude(d).lon, speed: planetSpeed('Sun', d) };

  // Moon
  raw.Moon = { tropLon: moonLongitude(d).lon, speed: planetSpeed('Moon', d) };

  // Five main planets
  for(const p of ['Mars','Mercury','Jupiter','Venus','Saturn']){
    raw[p] = { tropLon: planetLongitude(p, d).lon, speed: planetSpeed(p, d) };
  }

  // Nodes
  const rahuTrop = rahuTropical(d);
  raw.Rahu = { tropLon: rahuTrop,              speed: -1 };
  raw.Ketu = { tropLon: norm(rahuTrop + 180),  speed: -1 };

  // Build positions object with sidereal longitudes
  const positions = {};
  for(const name of PLANET_LIST){
    const sidLon = norm(raw[name].tropLon - ayanamsa);
    positions[name] = {
      lon:    sidLon,
      sign:   Math.floor(sidLon / 30) + 1,
      deg:    sidLon % 30,
      motion: raw[name].speed < 0 ? 'Retrograde' : 'Direct'
    };
  }

  // Ascendant
  const ascTrop = computeAscendant(jd, lat, lon);
  const ascSid  = norm(ascTrop - ayanamsa);
  const ascSign = Math.floor(ascSid / 30) + 1;
  const ascDeg  = ascSid % 30;

  return { positions, ayanamsa, ascSid, ascSign, ascDeg };
}

// ============================================================
// VEDIC ASTROLOGY FUNCTIONS
// ============================================================

/** Degrees → { deg, minute, sec } */
function dms(degFloat){
  const deg      = Math.floor(degFloat);
  const minFloat = (degFloat - deg) * 60;
  const minute   = Math.floor(minFloat);
  const sec      = Math.round((minFloat - minute) * 60 * 100) / 100;
  return { deg, minute, sec };
}

/** Format a degree value as D° M' S" */
function formatDms(degFloat){
  const { deg, minute, sec } = dms(degFloat);
  return `${deg}° ${minute}' ${sec}"`;
}

/** Nakshatra name for a sidereal longitude 0–360 */
function getNakshatraName(longitude){
  return NAKSHATRA_LIST[Math.floor((longitude % 360) / (40 / 3))];
}

/** Nakshatra + pada for a sidereal longitude 0–360 */
function getNakshatraPada(longitude){
  const index = Math.floor(longitude / (40 / 3));
  const pada  = Math.floor((longitude % (40 / 3)) / (10 / 3)) + 1;
  return { nakshatra: NAKSHATRA_LIST[index % 27], pada };
}

/** Navamsa sign (1–12) for a planet at sign + in-sign degrees */
function getNavamsaSign(sign, deg){
  const padaIndex = Math.floor(deg / (30 / 9));
  const startSign = NAVAMSA_START_SIGNS[sign - 1];
  return ((startSign + padaIndex - 1) % 12) + 1;
}

/** Saptamsa (D7) sign */
function getD7Sign(sign, deg){
  const part  = Math.floor(deg / (30 / 7));
  const isOdd = sign % 2 === 1;
  return isOdd
    ? ((sign + part - 1) % 12) + 1
    : ((sign + part + 6) % 12) + 1;
}

/** Is a planet combust? */
function isCombust(planet, sunLon, planetLon, motion){
  if(!COMBUSTION_LIMITS[planet]) return false;
  const dist  = Math.abs(((planetLon - sunLon + 180) % 360) - 180);
  const limit = motion === 'Retrograde'
    ? COMBUSTION_LIMITS[planet].retro
    : COMBUSTION_LIMITS[planet].direct;
  return limit !== null && dist < limit;
}

/** House numbers ruled by a planet given ascendant sign */
function getLordships(planet, ascSign){
  const signs = RULERSHIPS[planet] || [];
  return signs.map(s => ((s - ascSign + 12) % 12) + 1).sort((a, b) => a - b);
}

/** Functional role of a planet for a given ascendant sign */
function getFunctionalRole(planet, ascSign){
  const roles = FUNCTIONAL_ROLES[ascSign] || {};
  if((roles.benefics  || []).includes(planet)) return 'Benefic';
  if((roles.malefics  || []).includes(planet)) return 'Malefic';
  if((roles.neutrals  || []).includes(planet)) return 'Neutral';
  return 'Unknown';
}

/** Whole-sign house number */
function signToHouse(sign, ascSign){
  return ((sign - ascSign + 12) % 12) + 1;
}

/** Temporary (kala) relationship */
function getTemporaryRelationship(fromSign, toSign){
  const diff = ((toSign - fromSign) % 12 + 12) % 12;
  return [1,2,3,9,10,11].includes(diff) ? 'Friend' : 'Enemy';
}

/** Natural (naisargika) relationship */
function getNaturalRelationship(a, b){
  const rel = NATURAL_RELATIONSHIPS[a];
  if(!rel) return 'Neutral';
  if(rel.friends.includes(b)) return 'Friend';
  if(rel.enemies.includes(b)) return 'Enemy';
  return 'Neutral';
}

/** Compound (panchadha maitri) relationship */
function getCompoundRelationship(nat, temp){
  if(nat === 'Friend'  && temp === 'Friend') return 'Extreme Friendship';
  if(nat === 'Neutral' && temp === 'Friend') return 'Friendship';
  if(nat === 'Enemy'   && temp === 'Enemy')  return 'Extreme Enmity';
  if(nat === 'Neutral' && temp === 'Enemy')  return 'Enmity';
  // Friend+Enemy or Enemy+Friend → Neutral
  return 'Neutral';
}

/** Jaimini Chara Karakas (sorted by full sidereal longitude, highest = AK) */
function getCharaKarakas(positions){
  const candidates = PLANET_LIST
    .filter(p => p !== 'Rahu' && p !== 'Ketu')
    .map(p => ({ planet: p, lon: positions[p].lon }))
    .sort((a, b) => b.lon - a.lon);
  const names = ['Atmakaraka','Amatyakaraka','Bhratrikaraka',
                 'Matrikaraka','Putrakaraka','Gnatikaraka','Darakaraka'];
  const result = {};
  candidates.forEach((c, i) => { if(i < names.length) result[c.planet] = names[i]; });
  return result;
}

/**
 * Sphuta Drishti (aspect strength in virupas).
 * Returns a number or null ("-" in original).
 * Faithfully ported from Python's sphuta_drishti().
 */
function sphutaDrishti(asp, aspected, aspLon, aspectedLon){
  const a = ((aspectedLon - aspLon) % 360 + 360) % 360;

  // Mars-specific early returns
  if(asp === 'Mars'){
    if(a >= 30  && a < 60)  return null;
    if(a >= 90  && a < 120) return 45 + (a - 90) / 2;
    if(a >= 120 && a < 180) return 2 * (150 - a); // 5th special aspect ramp + wane
    if(a >= 180 && a < 210) return 60;
    if(a >= 210 && a < 240) return 270 - a;
    if(a >= 240 && a < 270) return 0;
    // 0–30, 60–90, 270–360 → fall to general
  }

  // Jupiter-specific early returns
  if(asp === 'Jupiter'){
    if(a >= 60  && a < 90)  return null;
    if(a >= 90  && a < 120) return 45 + (a - 90) / 2;
    if(a >= 120 && a < 150) return 2 * (150 - a);
    if(a >= 150 && a < 180) return null;
    if(a >= 180 && a < 210) return null;
    if(a >= 210 && a < 240) return 45 + (a - 210) / 2;
    if(a >= 240 && a < 270) return 15 + 2 * (270 - a) / 3;
    if(a >= 270 && a < 300) return null;
    // 0–60, 300–360 → fall to general
  }

  // Saturn-specific early returns
  if(asp === 'Saturn'){
    if(a >= 0   && a < 30)  return null;
    if(a >= 30  && a < 60)  return (a - 30) * 2;
    if(a >= 60  && a < 90)  return 45 + (90 - a) / 2;
    if(a >= 120 && a < 150) return null;
    if(a >= 210 && a < 240) return null;
    if(a >= 240 && a < 270) return a - 210;
    if(a >= 270 && a < 300) return 2 * (300 - a);
    // 90–120, 150–210, 300–360 → fall to general
  }

  // General formula
  if(a >= 0   && a < 30)  return 0;
  if(a >= 30  && a < 60)  return asp === 'Saturn' ? (a - 30) * 2       : (a - 30) / 2;
  if(a >= 60  && a < 90)  return asp === 'Saturn' ? 45 + (90 - a) / 2  : a - 45;
  if(a >= 90  && a < 120) return (asp === 'Mars' || asp === 'Jupiter')  ? 45 + (a - 90) / 2   : 30 + (120 - a) / 2;
  if(a >= 120 && a < 150) return (asp === 'Mars' || asp === 'Jupiter')  ? 2 * (150 - a)        : 150 - a;
  if(a >= 150 && a < 180) return (asp === 'Mars' || asp === 'Jupiter')  ? 2 * (150 - a)        : (300 - a) / 2;
  if(a >= 180 && a < 210) return asp === 'Mars'    ? 60                  : (300 - a) / 2;
  if(a >= 210 && a < 240){
    if(asp === 'Mars')    return 270 - a;
    if(asp === 'Jupiter') return 45 + (a - 210) / 2;
    return (300 - a) / 2;
  }
  if(a >= 240 && a < 270){
    if(asp === 'Jupiter') return 15 + 2 * (270 - a) / 3;
    if(asp === 'Saturn')  return a - 210;
    return (300 - a) / 2;
  }
  if(a >= 270 && a < 300) return asp === 'Saturn' ? 2 * (300 - a)       : (300 - a) / 2;
  if(a >= 300 && a < 330) return (300 - a) / 2;
  if(a >= 330 && a < 360) return 0;
  return 0;
}

// ============================================================
// CHART DATA ASSEMBLY
// ============================================================

function buildChartData({ year, month, day, hour, lat, lon }){
  const jd         = julianDay(year, month, day, hour);
  const { positions, ayanamsa, ascSid, ascSign, ascDeg } =
        computeAllPositions(jd, lat, lon);

  const ascNavamsa = getNavamsaSign(ascSign, ascDeg);
  const ascD7      = getD7Sign(ascSign, ascDeg);
  const { nakshatra: ascNak, pada: ascPada } = getNakshatraPada(ascSid);
  const karakas    = getCharaKarakas(positions);

  // Build per-planet details
  const sunLon = positions.Sun.lon;
  const planetData = PLANET_LIST.map(name => {
    const { lon, sign, deg, motion } = positions[name];
    const navamsaSign   = getNavamsaSign(sign, deg);
    const d7Sign        = getD7Sign(sign, deg);
    const navamsaHouse  = signToHouse(navamsaSign, ascNavamsa);
    const d7House       = signToHouse(d7Sign, ascD7);
    const house         = signToHouse(sign, ascSign);
    const lordships     = getLordships(name, ascSign);
    const role          = getFunctionalRole(name, ascSign);
    const combust       = (name !== 'Sun' && COMBUSTION_LIMITS[name])
                          ? isCombust(name, sunLon, lon, motion) : false;
    const { nakshatra, pada } = getNakshatraPada(lon);
    const nakLord       = NAKSHATRA_LORDS[nakshatra] || '—';
    const signLord      = SIGN_LORDS[sign - 1];
    const karaka        = karakas[name] || null;

    return {
      name, lon, sign, deg, motion, house,
      navamsaSign, navamsaHouse, d7Sign, d7House,
      lordships, role, combust, nakshatra, pada, nakLord, signLord, karaka
    };
  });

  return {
    // inputs
    jd, lat, lon, ayanamsa,
    // ascendant
    ascSid, ascSign, ascDeg, ascNavamsa, ascD7, ascNak, ascPada,
    // planets
    positions, planetData,
    // helpers needed for tables
    karakas
  };
}

// ============================================================
// DOM RENDERING
// ============================================================

function renderSummary(data, utcStr, latVal, lonVal){
  const el = document.getElementById('summary-content');
  const items = [
    ['UTC Date/Time', utcStr],
    ['Location', `${latVal}° N, ${lonVal}° E`],
    ['Ayanamsa', `${data.ayanamsa.toFixed(4)}° Lahiri`],
    ['Ascendant', `<span class="highlight">${SIGN_NAMES[data.ascSign-1]}</span> ${formatDms(data.ascDeg)}`],
    ['Asc Nakshatra', `${data.ascNak} Pada ${data.ascPada}`],
    ['Asc Navamsa',   SIGN_NAMES[data.ascNavamsa - 1]],
    ['Asc D7',        SIGN_NAMES[data.ascD7 - 1]],
    ['Asc House',     '1st (Whole Sign)'],
  ];
  el.innerHTML = items.map(([label, val]) => `
    <div class="summary-item">
      <div class="summary-label">${label}</div>
      <div class="summary-value">${val}</div>
    </div>`).join('');
}

function renderPlanetCards(data){
  const grid = document.getElementById('planets-grid');
  grid.innerHTML = data.planetData.map(p => {
    const icon    = PLANET_ICONS[p.name] || '●';
    const signName = SIGN_NAMES[p.sign - 1];
    const roleBadge = `<span class="badge badge-${p.role.toLowerCase()}">${p.role}</span>`;
    const motionBadge = p.motion === 'Retrograde'
      ? `<span class="badge badge-retro">℞ Retro</span>`
      : `<span class="badge badge-direct">Direct</span>`;
    const karakaBadge = p.karaka
      ? `<span class="badge badge-karaka">${p.karaka}</span>` : '';
    const combustHTML = p.combust
      ? `<span class="planet-combust">🔥 Combust</span>` : '';
    const lordStr = p.lordships.length
      ? p.lordships.map(h => `H${h}`).join(', ') : '—';

    const rows = [
      ['Degree', formatDms(p.deg)],
      ['Sign / House', `${signName} / House ${p.house}`],
      ['Sign Lord', p.signLord],
      ['Nakshatra', `${p.nakshatra} Pada ${p.pada}`],
      ['Nak. Lord', p.nakLord],
      ['Navamsa', `${SIGN_NAMES[p.navamsaSign-1]} (H${p.navamsaHouse})`],
      ['D7', `${SIGN_NAMES[p.d7Sign-1]} (H${p.d7House})`],
      ['Lords Houses', lordStr],
      ['Func. Role', roleBadge],
      ['Motion', motionBadge],
      ['Karaka', karakaBadge || '—'],
    ];

    return `
    <div class="planet-card">
      <div class="planet-card-header">
        <span class="planet-icon">${icon}</span>
        <div>
          <div class="planet-name">${p.name}</div>
          <div class="planet-position">${formatDms(p.deg)} ${signName}</div>
        </div>
        ${combustHTML}
      </div>
      <div class="planet-card-body">
        ${rows.map(([lbl, val]) => `
          <div class="planet-row">
            <span class="planet-row-label">${lbl}</span>
            <span class="planet-row-value">${val}</span>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

const REL_CSS = {
  'Extreme Friendship': 'rel-ef',
  'Friendship':         'rel-fr',
  'Neutral':            'rel-nu',
  'Enmity':             'rel-en',
  'Extreme Enmity':     'rel-ee'
};
const REL_ABBR = {
  'Extreme Friendship': 'E.Fr',
  'Friendship':         'Fr',
  'Neutral':            'Nu',
  'Enmity':             'En',
  'Extreme Enmity':     'E.En'
};

function renderRelationshipTable(data){
  const tbl = document.getElementById('relationship-table');
  const pl  = PLANET_LIST;

  // Sign index of each planet (needed for temporary relationship)
  const signs = {};
  pl.forEach(p => { signs[p] = data.positions[p].sign; });

  let html = '<thead><tr><th></th>';
  pl.forEach(p => { html += `<th title="${p}">${PLANET_ICONS[p]} ${p}</th>`; });
  html += '</tr></thead><tbody>';

  pl.forEach((a, i) => {
    html += `<tr><td>${PLANET_ICONS[a]} ${a}</td>`;
    pl.forEach((b, j) => {
      if(a === b){
        html += `<td class="self">—</td>`;
      } else {
        const nat  = getNaturalRelationship(a, b);
        const temp = getTemporaryRelationship(signs[a], signs[b]);
        const comp = getCompoundRelationship(nat, temp);
        const cls  = REL_CSS[comp] || 'rel-nu';
        const abbr = REL_ABBR[comp] || comp;
        html += `<td class="${cls}" title="${comp} (nat: ${nat}, temp: ${temp})">${abbr}</td>`;
      }
    });
    html += '</tr>';
  });

  tbl.innerHTML = html + '</tbody>';
}

function aspectColor(val){
  if(val === null)  return '#2a3a5a';
  if(val >= 50)     return '#d4a847';
  if(val >= 30)     return '#7ab0e0';
  if(val >= 15)     return '#5a7898';
  if(val > 0)       return '#3a5070';
  return '#1e2a40';
}
function aspectClass(val){
  if(val === null) return 'asp-none';
  if(val >= 50)    return 'asp-strong';
  if(val >= 25)    return 'asp-medium';
  if(val > 0)      return 'asp-weak';
  return 'asp-none';
}

function renderAspectTable(data){
  const tbl = document.getElementById('aspect-table');
  const pl  = PLANET_LIST;

  let html = '<thead><tr><th></th>';
  pl.forEach(p => { html += `<th title="${p}">${PLANET_ICONS[p]} ${p}</th>`; });
  html += '</tr></thead><tbody>';

  pl.forEach(asp => {
    html += `<tr><td>${PLANET_ICONS[asp]} ${asp}</td>`;
    pl.forEach(aspected => {
      if(asp === aspected){
        html += `<td class="self">—</td>`;
      } else {
        const aspLon      = data.positions[asp].lon;
        const aspectedLon = data.positions[aspected].lon;
        const val = sphutaDrishti(asp, aspected, aspLon, aspectedLon);
        const display = val === null ? '·' : Math.round(val * 10) / 10;
        const bg  = aspectColor(val);
        const cls = aspectClass(val);
        html += `<td class="${cls}" style="background:${bg}" title="${asp}→${aspected}: ${val === null ? 'n/a' : display} virupas">${display}</td>`;
      }
    });
    html += '</tr>';
  });

  tbl.innerHTML = html + '</tbody>';
}

function renderChart(data, utcStr, latVal, lonVal){
  renderSummary(data, utcStr, latVal, lonVal);
  renderPlanetCards(data);
  renderRelationshipTable(data);
  renderAspectTable(data);

  // Animate each card in with a stagger
  const output = document.getElementById('output');
  output.classList.remove('hidden');
  const cards = output.querySelectorAll('.card');
  cards.forEach((c, i) => {
    c.style.animationDelay = `${i * 0.08}s`;
    c.classList.add('fade-in');
  });

  // Scroll to output
  output.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// EVENT HANDLING
// ============================================================

document.getElementById('chart-form').addEventListener('submit', function(e){
  e.preventDefault();
  const errEl = document.getElementById('form-error');
  errEl.textContent = '';

  // --- Parse inputs ---
  const dateVal = document.getElementById('date').value;
  const timeVal = document.getElementById('time').value;
  const tzVal   = parseFloat(document.getElementById('tz').value);
  const latVal  = parseFloat(document.getElementById('lat').value);
  const lonVal  = parseFloat(document.getElementById('lon').value);

  // Validate
  if(!dateVal || !timeVal){
    errEl.textContent = 'Please enter a valid date and time.';
    return;
  }
  if(isNaN(latVal) || latVal < -90 || latVal > 90){
    errEl.textContent = 'Latitude must be between −90 and +90.';
    return;
  }
  if(isNaN(lonVal) || lonVal < -180 || lonVal > 180){
    errEl.textContent = 'Longitude must be between −180 and +180.';
    return;
  }
  if(isNaN(tzVal)){
    errEl.textContent = 'Please select a valid UTC offset.';
    return;
  }

  // Parse local datetime → UTC
  // Step 1: construct a Date treating local time as-if UTC (offset not yet applied).
  // Step 2: subtract the tz offset in ms to get the true UTC moment (handles rollovers).
  const [yearStr, monStr, dayStr] = dateVal.split('-');
  const [hrStr,   minStr]         = timeVal.split(':');
  const localHour  = parseInt(hrStr) + parseInt(minStr) / 60;

  const localDate  = new Date(Date.UTC(
    parseInt(yearStr), parseInt(monStr) - 1, parseInt(dayStr),
    Math.floor(localHour), parseInt(minStr)
  ));
  const utcDate    = new Date(localDate.getTime() - tzVal * 3600000);

  const year  = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth() + 1;
  const day   = utcDate.getUTCDate();
  const hour  = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60;

  const utcStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} `
               + `${String(utcDate.getUTCHours()).padStart(2,'0')}:`
               + `${String(utcDate.getUTCMinutes()).padStart(2,'0')} UTC`;

  try {
    const data = buildChartData({ year, month, day, hour, lat: latVal, lon: lonVal });
    renderChart(data, utcStr, latVal, lonVal);
  } catch(err) {
    errEl.textContent = `Calculation error: ${err.message}`;
    console.error(err);
  }
});
