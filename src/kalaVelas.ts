import { computeAllPositions, julianDay } from './astronomy';
import { formatLongitudeSignDegreesMinutes, normalizeLongitude } from './upagrahas';

type WeekdayLord = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
type SegmentLord = WeekdayLord;

export interface KalaVelas {
  gulika: number;
  mandi: number;
  kala: number;
  mrityu: number;
  ardhaprahara: number;
  yamaghantaka: number;
}

export interface KalaVelaOptions {
  gulikaMode: 'start' | 'midpoint';
  mandiMode: 'same_as_gulika' | 'segment_start' | 'segment_midpoint' | 'classical_offset';
  weekdayBoundary?: 'civil_midnight' | 'sunrise';
  /**
   * Optional timestamp for separate Mandi in classical_offset mode.
   * If omitted in classical_offset mode, the function throws.
   */
  mandiClassicalTime?: Date;
  /**
   * Testability/advanced override for Lagna lookup.
   */
  ascendantResolver?: (time: Date, latitude: number, longitude: number) => number;
}

function getWeekdayForSequence(
  birthTime: Date,
  sunrise: Date,
  weekday: number,
  boundary: KalaVelaOptions['weekdayBoundary'],
): number {
  if (boundary === 'civil_midnight') return weekday;
  return birthTime.getTime() < sunrise.getTime() ? (weekday + 6) % 7 : weekday;
}

interface SegmentAssignment {
  start: Date;
  end: Date;
  lord: SegmentLord | null;
}

const WEEKDAY_LORDS: readonly WeekdayLord[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
];

// Classical weekday sequence with explicit lord-less slot after Saturn.
const KALA_SEQUENCE_WITH_LORDLESS: readonly (SegmentLord | null)[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  null,
];

const DAY_OR_NIGHT_PARTS = 8;
const NIGHT_START_OFFSET_FROM_WEEKDAY = 4; // 5th from weekday lord, inclusive counting.

function getWeekdayLord(weekday: number): WeekdayLord {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new RangeError('weekday must be an integer from 0 (Sunday) to 6 (Saturday).');
  }
  return WEEKDAY_LORDS[weekday];
}

function shiftedPlanet(start: SegmentLord, offset: number): SegmentLord {
  const idx = WEEKDAY_LORDS.indexOf(start);
  if (idx < 0) throw new Error(`Unknown sequence planet: ${start}`);
  return WEEKDAY_LORDS[(idx + offset) % WEEKDAY_LORDS.length];
}

function shiftedSequenceLord(start: SegmentLord, offset: number): SegmentLord | null {
  const idx = KALA_SEQUENCE_WITH_LORDLESS.indexOf(start);
  if (idx < 0) throw new Error(`Unknown sequence planet: ${start}`);
  return KALA_SEQUENCE_WITH_LORDLESS[(idx + offset) % KALA_SEQUENCE_WITH_LORDLESS.length];
}

function dateDiffMs(later: Date, earlier: Date): number {
  return later.getTime() - earlier.getTime();
}

function addMs(time: Date, ms: number): Date {
  return new Date(time.getTime() + ms);
}

function isDayBirth(birthTime: Date, sunrise: Date, sunset: Date): boolean {
  const t = birthTime.getTime();
  return t >= sunrise.getTime() && t < sunset.getTime();
}

function computeSegmentAssignments(
  birthTime: Date,
  sunrise: Date,
  sunset: Date,
  nextSunrise: Date,
  weekday: number,
): SegmentAssignment[] {
  const dayBirth = isDayBirth(birthTime, sunrise, sunset);
  const start = dayBirth ? sunrise : sunset;
  const end = dayBirth ? sunset : nextSunrise;
  const durationMs = dateDiffMs(end, start);

  if (durationMs <= 0) throw new Error('Invalid sunrise/sunset/nextSunrise ordering.');

  const segmentMs = durationMs / DAY_OR_NIGHT_PARTS;
  const weekdayLord = getWeekdayLord(weekday);
  const startLord = dayBirth
    ? weekdayLord
    : shiftedPlanet(weekdayLord, NIGHT_START_OFFSET_FROM_WEEKDAY);

  return Array.from({ length: DAY_OR_NIGHT_PARTS }, (_, index) => ({
    start: addMs(start, segmentMs * index),
    end: addMs(start, segmentMs * (index + 1)),
    lord: shiftedSequenceLord(startLord, index),
  }));
}

function getAscendantLongitudeAtTime(
  time: Date,
  latitude: number,
  longitude: number,
  resolver?: (time: Date, latitude: number, longitude: number) => number,
): number {
  if (resolver) return normalizeLongitude(resolver(time, latitude, longitude));

  const hour = time.getUTCHours()
    + (time.getUTCMinutes() / 60)
    + (time.getUTCSeconds() / 3600)
    + (time.getUTCMilliseconds() / 3600000);
  const jd = julianDay(time.getUTCFullYear(), time.getUTCMonth() + 1, time.getUTCDate(), hour);
  return normalizeLongitude(computeAllPositions(jd, latitude, longitude).ascSid);
}

function segmentMoment(segment: SegmentAssignment, mode: 'start' | 'midpoint'): Date {
  if (mode === 'start') return segment.start;
  return new Date((segment.start.getTime() + segment.end.getTime()) / 2);
}

function findSegmentByLord(segments: SegmentAssignment[], lord: SegmentLord): SegmentAssignment {
  const segment = segments.find((s) => s.lord === lord);
  if (!segment) throw new Error(`No segment found for ${lord}.`);
  return segment;
}

export function computeKalaVelas(input: {
  birthTime: Date;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  latitude: number;
  longitude: number;
  weekday: number;
  options: KalaVelaOptions;
}): KalaVelas {
  const { birthTime, sunrise, sunset, nextSunrise, latitude, longitude, weekday, options } = input;
  const weekdayForSequence = getWeekdayForSequence(
    birthTime,
    sunrise,
    weekday,
    options.weekdayBoundary,
  );
  const segments = computeSegmentAssignments(
    birthTime,
    sunrise,
    sunset,
    nextSunrise,
    weekdayForSequence,
  );
  const saturnSegment = findSegmentByLord(segments, 'Saturn');

  const segmentLongitudes = {} as Partial<Record<SegmentLord, number>>;
  for (const segment of segments) {
    if (!segment.lord) continue; // 8th segment is lordless by definition.
    const when = segmentMoment(segment, options.gulikaMode);
    segmentLongitudes[segment.lord] = getAscendantLongitudeAtTime(
      when,
      latitude,
      longitude,
      options.ascendantResolver,
    );
  }

  const gulika = segmentLongitudes.Saturn as number;
  const kala = segmentLongitudes.Sun as number;
  const mrityu = segmentLongitudes.Mars as number;
  const ardhaprahara = segmentLongitudes.Mercury as number;
  const yamaghantaka = segmentLongitudes.Jupiter as number;

  if ([gulika, kala, mrityu, ardhaprahara, yamaghantaka].some((v) => !Number.isFinite(v))) {
    throw new Error('Failed to compute one or more Kala Vela longitudes.');
  }

  let mandi: number;
  if (options.mandiMode === 'same_as_gulika') {
    mandi = gulika;
  } else if (options.mandiMode === 'segment_start') {
    mandi = getAscendantLongitudeAtTime(
      segmentMoment(saturnSegment, 'start'),
      latitude,
      longitude,
      options.ascendantResolver,
    );
  } else if (options.mandiMode === 'segment_midpoint') {
    mandi = getAscendantLongitudeAtTime(
      segmentMoment(saturnSegment, 'midpoint'),
      latitude,
      longitude,
      options.ascendantResolver,
    );
  } else {
    if (!options.mandiClassicalTime) {
      throw new Error('mandiClassicalTime is required when mandiMode is classical_offset.');
    }
    mandi = getAscendantLongitudeAtTime(
      options.mandiClassicalTime,
      latitude,
      longitude,
      options.ascendantResolver,
    );
  }

  return { gulika, mandi, kala, mrityu, ardhaprahara, yamaghantaka };
}

export interface UpagrahaPoint {
  longitude: number;
  formatted: ReturnType<typeof formatLongitudeSignDegreesMinutes>;
  source: 'solar' | 'kala';
  calculationMode: string;
  segmentLongitudeRange?: {
    start: number;
    end: number;
  };
}

export interface KalaVelasDetailed {
  gulika: UpagrahaPoint;
  mandi: UpagrahaPoint;
  kala: UpagrahaPoint;
  mrityu: UpagrahaPoint;
  ardhaprahara: UpagrahaPoint;
  yamaghantaka: UpagrahaPoint;
}

export function computeKalaVelasDetailed(input: {
  birthTime: Date;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  latitude: number;
  longitude: number;
  weekday: number;
  options: KalaVelaOptions;
}): KalaVelasDetailed {
  const result = computeKalaVelas(input);
  const mode = `gulika:${input.options.gulikaMode}; mandi:${input.options.mandiMode}`;
  const weekdayForSequence = getWeekdayForSequence(
    input.birthTime,
    input.sunrise,
    input.weekday,
    input.options.weekdayBoundary,
  );
  const segments = computeSegmentAssignments(
    input.birthTime,
    input.sunrise,
    input.sunset,
    input.nextSunrise,
    weekdayForSequence,
  );
  const segmentRange = (lord: SegmentLord) => {
    const segment = findSegmentByLord(segments, lord);
    return {
      start: getAscendantLongitudeAtTime(
        segment.start,
        input.latitude,
        input.longitude,
        input.options.ascendantResolver,
      ),
      end: getAscendantLongitudeAtTime(
        segment.end,
        input.latitude,
        input.longitude,
        input.options.ascendantResolver,
      ),
    };
  };

  return {
    gulika: { longitude: result.gulika, formatted: formatLongitudeSignDegreesMinutes(result.gulika), source: 'kala', calculationMode: mode, segmentLongitudeRange: segmentRange('Saturn') },
    mandi: { longitude: result.mandi, formatted: formatLongitudeSignDegreesMinutes(result.mandi), source: 'kala', calculationMode: mode, segmentLongitudeRange: segmentRange('Saturn') },
    kala: { longitude: result.kala, formatted: formatLongitudeSignDegreesMinutes(result.kala), source: 'kala', calculationMode: mode, segmentLongitudeRange: segmentRange('Sun') },
    mrityu: { longitude: result.mrityu, formatted: formatLongitudeSignDegreesMinutes(result.mrityu), source: 'kala', calculationMode: mode, segmentLongitudeRange: segmentRange('Mars') },
    ardhaprahara: { longitude: result.ardhaprahara, formatted: formatLongitudeSignDegreesMinutes(result.ardhaprahara), source: 'kala', calculationMode: mode, segmentLongitudeRange: segmentRange('Mercury') },
    yamaghantaka: { longitude: result.yamaghantaka, formatted: formatLongitudeSignDegreesMinutes(result.yamaghantaka), source: 'kala', calculationMode: mode, segmentLongitudeRange: segmentRange('Jupiter') },
  };
}

// Exported for deterministic testing of classical sequencing logic.
export const __internalKala = {
  computeSegmentAssignments,
  getWeekdayLord,
};
