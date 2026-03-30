import swisseph as swe
from datetime import datetime, timezone, timedelta

# --- Static (non-chart-specific) info ---

sign_names = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
    'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
]

sign_lords = [
    'Mars','Venus','Mercury','Moon','Sun','Mercury',
    'Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'
]

nakshatra_lords = {
    'Ashwini': 'Ketu', 'Bharani': 'Venus', 'Krittika': 'Sun', 'Rohini': 'Moon', 'Mrigashira': 'Mars',
    'Ardra': 'Rahu', 'Punarvasu': 'Jupiter', 'Pushya': 'Saturn', 'Ashlesha': 'Mercury', 'Magha': 'Ketu',
    'Purva Phalguni': 'Venus', 'Uttara Phalguni': 'Sun', 'Hasta': 'Moon', 'Chitra': 'Mars', 'Swati': 'Rahu',
    'Vishakha': 'Jupiter', 'Anuradha': 'Saturn', 'Jyeshtha': 'Mercury', 'Mula': 'Ketu', 'Purva Ashadha': 'Venus',
    'Uttara Ashadha': 'Sun', 'Shravana': 'Moon',
    'Dhanishta': 'Mars', 'Shatabhisha': 'Rahu', 'Purva Bhadrapada': 'Jupiter',
    'Uttara Bhadrapada': 'Saturn', 'Revati': 'Mercury'
}
natural_relationships = {
    'Sun':      {'friends': ['Moon','Mars','Jupiter'], 'enemies': ['Venus','Saturn'], 'equals': ['Mercury']},
    'Moon':     {'friends': ['Sun','Mercury'], 'enemies': [], 'equals': ['Mars','Jupiter','Venus','Saturn']},
    'Mars':     {'friends': ['Sun','Moon','Jupiter'], 'enemies': ['Mercury'], 'equals': ['Venus','Saturn']},
    'Mercury':  {'friends': ['Sun','Venus'], 'enemies': ['Moon'], 'equals': ['Mars','Jupiter','Saturn']},
    'Jupiter':  {'friends': ['Sun','Moon','Mars'], 'enemies': ['Mercury','Venus'], 'equals': ['Saturn']},
    'Venus':    {'friends': ['Mercury','Saturn'], 'enemies': ['Moon','Sun'], 'equals': ['Mars','Jupiter']},
    'Saturn':   {'friends': ['Mercury','Venus'], 'enemies': ['Sun','Moon','Mars'], 'equals': ['Jupiter']},
    'Rahu':     {'friends': ['Jupiter','Venus','Saturn'], 'enemies': ['Sun','Moon','Mars'], 'equals': ['Mercury']},
    'Ketu':     {'friends': ['Mars','Venus','Saturn'], 'enemies': ['Sun','Moon'], 'equals': ['Mercury','Jupiter']},
}
planet_list = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']

combustion_limits = {
    'Moon':     {'direct': 12,  'retro': None},
    'Mars':     {'direct': 17,  'retro': 8},
    'Mercury':  {'direct': 14,  'retro': 12},
    'Jupiter':  {'direct': 11,  'retro': 11},
    'Venus':    {'direct': 10,  'retro': 8},
    'Saturn':   {'direct': 16,  'retro': 16},
}

# --- Helper Functions ---

def get_sign_name(index):
    return sign_names[index % 12]

def dms(deg_float):
    deg = int(deg_float)
    min_float = (deg_float - deg) * 60
    minute = int(min_float)
    sec = round((min_float - minute) * 60, 2)
    return deg, minute, sec

def format_dms(degree, minute, second):
    return f"{degree}° {minute}' {second}\""

def format_output(planet_name, sign_name, nakshatra, lord, dms_formatted):
    return (
        f"{planet_name} is in {sign_name}, "
        f"Nakshatra: {nakshatra} (Lord: {lord}), "
        f"at {dms_formatted}"
    )

def get_nakshatra_name(longitude):
    nakshatra_index = int((longitude % 360) / 13.333333333333334)
    return list(nakshatra_lords.keys())[nakshatra_index]

def get_nakshatra_lord(nakshatra_name):
    return nakshatra_lords.get(nakshatra_name, "Unknown")

def is_combust(planet, sun_lon, planet_lon, motion):
    if planet not in combustion_limits:
        return False
    dist = abs((planet_lon - sun_lon + 180) % 360 - 180)
    if motion == 'Retrograde':
        limit = combustion_limits[planet]['retro']
    else:
        limit = combustion_limits[planet]['direct']
    if limit is None:
        return False
    return dist < limit

def get_nakshatra_pada(degree):
    nakshatras = [
        'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
        'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
        'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
        'Uttara Bhadrapada', 'Revati'
    ]
    index = int(degree // (13 + 1/3))
    pada = int((degree % (13 + 1/3)) // (3 + 1/3)) + 1
    return nakshatras[index], pada

def get_navamsa_sign(sign, deg):
    pada_index = int(deg // (30 / 9))
    navamsa_start_signs = [1, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7, 4]
    start_sign = navamsa_start_signs[sign - 1]
    navamsa_sign = (start_sign + pada_index - 1) % 12 + 1
    return navamsa_sign

def get_d7_sign(sign, deg):
    part = int(deg // (30 / 7))
    is_odd = sign % 2 == 1
    if is_odd:
        d7_sign = (sign + part - 1) % 12 + 1
    else:
        d7_sign = (sign + part + 6) % 12 + 1
    return d7_sign

def get_lordships(planet, asc_sign):
    houses_ruled = []
    for sign in rulerships.get(planet, []):
        house = ((sign - asc_sign + 12) % 12) + 1
        houses_ruled.append(house)
    return sorted(houses_ruled)

def get_functional_role(planet, asc_sign):
    roles = functional_roles.get(asc_sign, {})
    if planet in roles.get('benefics', []):
        return 'Benefic'
    elif planet in roles.get('malefics', []):
        return 'Malefic'
    elif planet in roles.get('neutrals', []):
        return 'Neutral'
    return 'Unknown'

def sign_to_house(sign, asc_div):
    return ((sign - asc_div + 12) % 12) + 1

def get_temporary_relationship(from_sign, to_sign):
    diff = (to_sign - from_sign) % 12
    if diff in [1,2,3,9,10,11]:
        return 'Friend'
    return 'Enemy'

def get_compound_relationship(nat, temp):
    if nat == 'Friend' and temp == 'Friend':
        return 'Extreme friendship'
    if nat == 'Neutral' and temp == 'Friend':
        return 'Friendship'
    if nat == 'Enemy' and temp == 'Enemy':
        return 'Extreme enmity'
    if nat == 'Neutral' and temp == 'Enemy':
        return 'Enmity'
    if nat == 'Enemy' and temp == 'Friend':
        return 'Neutral'
    return 'Neutral'

def get_natural_relationship(a, b):
    if b in natural_relationships[a]['friends']:
        return 'Friend'
    if b in natural_relationships[a]['enemies']:
        return 'Enemy'
    return 'Neutral'

def get_relationship_abbr(comp):
    abbr = {
        "Extreme friendship": "E. Fr",
        "Friendship": "Fr",
        "Extreme enmity": "E. En",
        "Enmity": "En",
        "Neutral": "Neutral"
    }
    return abbr.get(comp, comp)

def print_relationship_table():
    header = [""] + planet_list
    row_fmt = "{:<8}" + "".join(["{:>10}" for _ in planet_list])
    print("\nRelationship Table\n")
    print(row_fmt.format(*header))
    for i, a in enumerate(planet_list):
        row = [a]
        for j, b in enumerate(planet_list):
            if a == b:
                row.append("-")
            else:
                nat = get_natural_relationship(a, b)
                temp = get_temporary_relationship(i + 1, j + 1)
                comp = get_compound_relationship(nat, temp)
                row.append(get_relationship_abbr(comp))
        print(row_fmt.format(*row))

# --- Sphuta Drishti (aspect) calculation functions ---

def sphuta_drishti(asp, aspected, asp_lon, aspected_lon):
    # Angle from aspector to aspected, always positive and < 360
    a = (aspected_lon - asp_lon) % 360
    # General rule
    if a < 0 or a >= 360:
        return 0.0
    # Specific rules for Mars, Jupiter, Saturn
    if asp == "Mars":
        if 120 <= a < 150:
            return 2 * (150 - a)
        if 150 <= a < 180:
            return 2 * (150 - a)
        if 210 <= a < 240:
            return 270 - a
        if 180 <= a < 210:
            return 60
        if 90 <= a < 120:
            return 45 + (a - 90)/2
        if 30 <= a < 60:
            return "-"
        if 240 <= a < 270:
            return 0
    if asp == "Jupiter":
        if 90 <= a < 120:
            return 45 + (a - 90)/2
        if 120 <= a < 150:
            return 2 * (150 - a)
        if 210 <= a < 240:
            return 45 + (a - 210)/2
        if 150 <= a < 180:
            return "-"
        if 180 <= a < 210:
            return "-"
        if 240 <= a < 270:
            return 15 + 2 * (270 - a) / 3
        if 270 <= a < 300:
            return "-"
        if 60 <= a < 90:
            return "-"
    if asp == "Saturn":
        if 60 <= a < 90:
            return 45 + (90 - a) / 2
        if 120 <= a < 150:
            return "-"
        if 210 <= a < 240:
            return "-"
        if 240 <= a < 270:
            return a - 210
        if 270 <= a < 300:
            return 2 * (300 - a)
        if 30 <= a < 60:
            return (a - 30) * 2
        if 0 <= a < 30:
            return "-"
    # General rule (for all planets)
    if 0 <= a < 30:
        return 0
    if 30 <= a < 60:
        if asp == "Saturn":
            return (a - 30) * 2
        return (a - 30)/2
    if 60 <= a < 90:
        if asp == "Saturn":
            return 45 + (90 - a)/2
        return a - 45
    if 90 <= a < 120:
        if asp in ("Mars", "Jupiter"):
            return 45 + (a - 90)/2
        return 30 + (120 - a)/2
    if 120 <= a < 150:
        if asp in ("Mars", "Jupiter"):
            return 2 * (150 - a)
        return 150 - a
    if 150 <= a < 180:
        if asp in ("Mars", "Jupiter"):
            return 2 * (150 - a)
        return (300 - a)/2
    if 180 <= a < 210:
        if asp == "Mars":
            return 60
        return (300 - a)/2
    if 210 <= a < 240:
        if asp == "Mars":
            return 270 - a
        elif asp == "Jupiter":
            return 45 + (a - 210)/2
        return (300 - a)/2
    if 240 <= a < 270:
        if asp == "Jupiter":
            return 15 + 2 * (270 - a) / 3
        elif asp == "Saturn":
            return a - 210
        return (300 - a)/2
    if 270 <= a < 300:
        if asp == "Saturn":
            return 2 * (300 - a)
        return (300 - a)/2
    if 300 <= a < 330:
        return (300 - a)/2
    if 330 <= a < 360:
        return 0
    return 0

def print_aspect_table(planet_positions):
    print("\nSphuta Drishti (Planetary Aspect Strengths, Virupas)\n")
    header = [""] + planet_list
    row_fmt = "{:<9}" + "".join(["{:>10}" for _ in planet_list])
    print(row_fmt.format(*header))
    for asp in planet_list:
        row = [asp]
        asp_lon = planet_positions[asp][0]
        for aspected in planet_list:
            if asp == aspected:
                row.append("-")
            else:
                aspected_lon = planet_positions[aspected][0]
                val = sphuta_drishti(asp, aspected, asp_lon, aspected_lon)
                if val == "-":
                    row.append("-")
                else:
                    row.append(f"{round(val, 1)}")
        print(row_fmt.format(*row))

# --- Input ---
local_dt = datetime(2002, 10, 6, 20, 10)
timezone_offset = 3
utc_dt = (local_dt - timedelta(hours=timezone_offset)).replace(tzinfo=timezone.utc)
latitude = 40.3833
longitude = 23.4333

# --- Setup ---
swe.set_ephe_path('.')
jd_ut = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, utc_dt.hour + utc_dt.minute / 60)
swe.set_sid_mode(swe.SIDM_LAHIRI)
ayanamsa = swe.get_ayanamsa(jd_ut)

rulerships = {
    'Sun': [5],
    'Moon': [4],
    'Mercury': [3, 6],
    'Venus': [2, 7],
    'Mars': [1, 8],
    'Jupiter': [9, 12],
    'Saturn': [10, 11],
    'Rahu': [11],
    'Ketu': [8]
}
functional_roles = {
    1: {'benefics': ['Sun', 'Jupiter'], 'malefics': ['Saturn', 'Mercury', 'Venus'], 'neutrals': ['Mars', 'Moon']},
    2: {'benefics': ['Saturn', 'Sun'], 'malefics': ['Jupiter', 'Moon', 'Venus'], 'neutrals': ['Mars', 'Mercury']},
    3: {'benefics': ['Venus', 'Mercury'], 'malefics': ['Sun', 'Jupiter', 'Mars'], 'neutrals': ['Saturn', 'Moon']},
    4: {'benefics': ['Mars', 'Jupiter', 'Moon'], 'malefics': ['Venus', 'Mercury'], 'neutrals': ['Sun', 'Saturn']},
    5: {'benefics': ['Mars', 'Jupiter', 'Sun'], 'malefics': ['Saturn', 'Venus', 'Mercury'], 'neutrals': ['Moon']},
    6: {'benefics': ['Mercury', 'Venus'], 'malefics': ['Moon', 'Jupiter', 'Mars'], 'neutrals': [ 'Saturn', 'Sun']},
    7: {'benefics': ['Mercury', 'Saturn'], 'malefics': ['Sun', 'Jupiter', 'Mars'], 'neutrals': [ 'Moon', 'Venus']},
    8: {'benefics': ['Moon', 'Jupiter'], 'malefics': ['Venus', 'Mercury', 'Saturn'], 'neutrals': [ 'Sun', 'Mars']},
    9: {'benefics': ['Mars', 'Sun'], 'malefics': ['Venus'], 'neutrals': [ 'Mercury', 'Jupiter', 'Saturn', 'Moon']},
    10: {'benefics': ['Venus', 'Mercury'], 'malefics': ['Mars', 'Jupiter', 'Moon'], 'neutrals': ['Sun', 'Saturn']},
    11: {'benefics': ['Venus', 'Saturn'], 'malefics': ['Mars', 'Jupiter', 'Moon', 'Sun'], 'neutrals': ['Mercury']},
    12: {'benefics': ['Moon', 'Mars', 'Jupiter'], 'malefics': ['Mercury', 'Saturn', 'Venus', 'Sun'], 'neutrals': []}
}
planet_ids = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mercury': swe.MERCURY,
    'Venus': swe.VENUS,
    'Mars': swe.MARS,
    'Jupiter': swe.JUPITER,
    'Saturn': swe.SATURN,
    'Rahu': swe.MEAN_NODE,
}

# --- Main planetary data output using helpers ---
planetary_data = []
planet_positions = {}

for planet_name, pid in planet_ids.items():
    lon, lat, speed = swe.calc_ut(jd_ut, pid)[0][:3]
    sid_lon = (lon - ayanamsa) % 360
    sign = int(sid_lon // 30) + 1
    deg = sid_lon % 30
    if speed < 0:
        motion = "Retrograde"
    else:
        motion = "Direct"
    planet_positions[planet_name] = (sid_lon, sign, deg, motion)
    sign_name = get_sign_name(int(sid_lon // 30))
    nakshatra = get_nakshatra_name(sid_lon)
    nakshatra_lord = get_nakshatra_lord(nakshatra)
    deg_out, minute, sec = dms(sid_lon % 30)
    dms_formatted = format_dms(deg_out, minute, sec)
    output = format_output(
        planet_name, sign_name, nakshatra, nakshatra_lord, dms_formatted
    )
    planetary_data.append(output)

# Handle Ketu (the south node) - do NOT append to planetary_data to avoid duplicate output
rahu_sid_lon = planet_positions['Rahu'][0]
ketu_sid_lon = (rahu_sid_lon + 180) % 360
sign_name = get_sign_name(int(ketu_sid_lon // 30))
nakshatra = get_nakshatra_name(ketu_sid_lon)
nakshatra_lord = get_nakshatra_lord(nakshatra)
deg_out, minute, sec = dms(ketu_sid_lon % 30)
dms_formatted = format_dms(deg_out, minute, sec)
planet_positions['Ketu'] = (ketu_sid_lon, int(ketu_sid_lon // 30) + 1, ketu_sid_lon % 30, 'Retrograde')

houses, ascmc = swe.houses(jd_ut, latitude, longitude, b'A')
asc_tropical = ascmc[0]
asc_sidereal = (asc_tropical - ayanamsa) % 360
asc_sign = int(asc_sidereal // 30) + 1
asc_nakshatra, asc_pada = get_nakshatra_pada(asc_sidereal)
asc_navamsa_sign = get_navamsa_sign(asc_sign, asc_sidereal % 30)
asc_d7_sign = get_d7_sign(asc_sign, asc_sidereal % 30)

karaka_candidates = {
    name: lon for name, (lon, sign, deg, _) in planet_positions.items()
    if name not in ['Rahu', 'Ketu']
}
sorted_karakas = sorted(karaka_candidates.items(), key=lambda x: x[1], reverse=True)
karaka_names = ['Atmakaraka', 'Amatyakaraka', 'Bhratrikaraka', 'Matrikaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka']
karakas = dict(zip(karaka_names, sorted_karakas))
karaka_role_of = {planet: karaka for karaka, (planet, lon) in karakas.items()}

houses_dict = {i: [] for i in range(1, 13)}
for name, (lon, sign, deg, motion) in planet_positions.items():
    house = ((sign - asc_sign + 12) % 12) + 1
    houses_dict[house].append((name, sign, deg, motion))

print(f"\n🌀 Sidereal Whole Sign Chart — Lahiri (Swiss Ephemeris)")
print(f"UTC: {utc_dt.strftime('%Y-%m-%d %H:%M')}")
print(f"Location: {latitude}° N, {longitude}° E")
print(f"Ayanamsa: {ayanamsa:.4f}° (Lahiri)")
print(f"Ascendant: {asc_sidereal:.2f}° → {sign_names[asc_sign-1]}, Nakshatra: {asc_nakshatra} Pada {asc_pada}, Navamsa: {sign_names[asc_navamsa_sign-1]} (House 1), D7: {sign_names[asc_d7_sign-1]} (House 1)\n")

# Print outputs
print("LEGEND: [*] = chart-unique info, [~] = static info\n")

# ——— Per-planet detailed output ———
for name in planet_list + ["Ketu"]:
    if name not in planet_positions:
        continue
    lon, sign, deg, motion = planet_positions[name]
    combust = ''
    if name != 'Sun' and name in combustion_limits:
        planet_lon = lon
        # Use Sun's sidereal longitude for combustion check
        sun_sid_lon = planet_positions['Sun'][0]
        if is_combust(name, sun_sid_lon, planet_lon, motion):
            combust = ' (Combust)'
    navamsa_sign = get_navamsa_sign(sign, deg)
    d7_sign = get_d7_sign(sign, deg)
    navamsa_house = sign_to_house(navamsa_sign, asc_navamsa_sign)
    d7_house = sign_to_house(d7_sign, asc_d7_sign)
    lordships = get_lordships(name, asc_sign)
    lordship_str = ', '.join(f"{h}H" for h in lordships) if lordships else "—"
    role = get_functional_role(name, asc_sign)
    karaka_str = f", {karaka_role_of[name]}" if name in karaka_role_of else ""
    nakshatra, pada = get_nakshatra_pada(sign * 30 - 30 + deg)
    nakshatra_lord = nakshatra_lords[nakshatra]
    sign_lord = sign_lords[sign-1]
    # Compute house for this planet
    house = ((sign - asc_sign + 12) % 12) + 1
    relationships = []
    this_sign = sign
    for other in planet_list:
        if other == name: continue
        if other not in planet_positions: continue
        other_sign = planet_positions[other][1]
        nat = get_natural_relationship(name, other)
        temp = get_temporary_relationship(this_sign, other_sign)
        comp = get_compound_relationship(nat, temp)
        relationships.append(f"{other}: {comp} (nat: {nat}, temp: {temp})")
    relationships_str = "; ".join(relationships)
    print(
        f"{name} {deg:.1f}° {sign_names[sign-1]} (House {house}){combust}\n"
        f"    [*] Navamsa: {sign_names[navamsa_sign-1]} (H{navamsa_house}), "
        f"D7: {sign_names[d7_sign-1]} (H{d7_house}), Lord of: {lordship_str}, {role}{karaka_str}, {motion}\n"
        f"    [~] Sign lord: {sign_lord}, Nakshatra: {nakshatra} Pada {pada}, Nakshatra Lord: {nakshatra_lord}\n"
    )
print_relationship_table()
print_aspect_table(planet_positions)
