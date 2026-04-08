import { computeAscendant, julianDay, lahiriAyanamsa } from './astronomy';
import type {
  GeoCoordinates,
  GulikaComputationTimes,
  GulikaConfig,
  GulikaDebugParams,
  GulikaDebugResult,
  GulikaPeriodResult,
  GulikaSegment,
  GulikaSegmentTrace,
  WeekdayPlanet,
} from './types';

export const defaultGulikaConfig: GulikaConfig = {
  timeDivision: 'day-night-8-parts',
  startLordMode: 'weekday',
  identityMode: 'start-vs-end',
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_LORDS: WeekdayPlanet[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
];
const SEGMENT_LORD_ORDER: WeekdayPlanet[] = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
];

const normalizeLongitude = (value: number) => ((value % 360) + 360) % 360;

/**
 * Determines whether the event occurred during the daytime or nighttime interval
 * using sunrise and sunset for the event's civil date. If the event occurs before
 * sunrise, the previous sunset is inferred by subtracting one day from the supplied sunset.
 */
export function getDayOrNightPeriod(
  date: Date,
  _location: GeoCoordinates,
  sunrise: Date,
  sunset: Date,
): GulikaPeriodResult {
  const time = date.getTime();
  const sunriseTime = sunrise.getTime();
  const sunsetTime = sunset.getTime();

  if (time >= sunriseTime && time < sunsetTime) {
    return { period: 'day', start: sunrise, end: sunset };
  }

  if (time < sunriseTime) {
    return {
      period: 'night',
      start: new Date(sunsetTime - MS_PER_DAY),
      end: sunrise,
    };
  }

  return {
    period: 'night',
    start: sunset,
    end: new Date(sunriseTime + MS_PER_DAY),
  };
}

/**
 * Divides a daytime or nighttime interval into eight equal segments.
 */
export function divideIntoEightSegments(start: Date, end: Date): GulikaSegment[] {
  const total = end.getTime() - start.getTime();
  const segmentMs = total / 8;

  return Array.from({ length: 8 }, (_, idx) => ({
    start: new Date(start.getTime() + segmentMs * idx),
    end: new Date(start.getTime() + segmentMs * (idx + 1)),
    idx,
  }));
}

/**
 * Resolves the starting lord for the sequence of eight segments.
 */
export function getStartingLord(
  weekday: number,
  isNight: boolean,
  mode: GulikaConfig['startLordMode'],
): WeekdayPlanet {
  const normalizedWeekday = ((weekday % 7) + 7) % 7;
  if (!isNight || mode === 'weekday') return WEEKDAY_LORDS[normalizedWeekday];
  return WEEKDAY_LORDS[(normalizedWeekday + 4) % 7];
}

/**
 * Generates the segment-lord sequence beginning from the configured start lord.
 */
export function getSegmentLords(startLord: WeekdayPlanet): WeekdayPlanet[] {
  const startIndex = SEGMENT_LORD_ORDER.indexOf(startLord);
  if (startIndex === -1) throw new Error(`Unknown weekday lord: ${startLord}`);

  return Array.from({ length: 8 }, (_, idx) => SEGMENT_LORD_ORDER[(startIndex + idx) % SEGMENT_LORD_ORDER.length]);
}

/**
 * Finds the segment assigned to Saturn within the eight-part sequence.
 */
export function findSaturnSegment(
  segments: GulikaSegment[],
  lords: WeekdayPlanet[],
): { segment: GulikaSegment; idx: number } {
  for (let idx = 0; idx < 8; idx += 1) {
    if (lords[idx] === 'Saturn') return { segment: segments[idx], idx };
  }
  throw new Error('No Saturn segment found.');
}

/**
 * Resolves the Gulika and Mandi timestamps from Saturn's segment according to the identity mode.
 */
export function computeGulikaOrMandi(
  segment: GulikaSegment,
  identityMode: GulikaConfig['identityMode'],
): GulikaComputationTimes {
  if (identityMode === 'same' || identityMode === 'separate') {
    return { gulikaTime: segment.start, mandiTime: segment.start };
  }

  return { gulikaTime: segment.start, mandiTime: segment.end };
}

/**
 * Converts a timestamp to the sidereal ascendant longitude used elsewhere in the app.
 */
export function segmentTimeToAscendant(
  date: Date,
  location: GeoCoordinates,
): number {
  const jd = julianDay(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600 + date.getUTCMilliseconds() / 3600000,
  );
  return normalizeLongitude(computeAscendant(jd, location.lat, location.lon) - lahiriAyanamsa(jd));
}

/**
 * Debugs and traces the configured Gulika/Mandi calculation, including segment lords
 * and the sidereal ascendants for the resolved Gulika and Mandi timestamps.
 */
export function debugGulikaCalculation(params: GulikaDebugParams): GulikaDebugResult {
  const {
    date,
    location,
    sunrise,
    sunset,
    gulikaConfig,
  } = params;

  if (gulikaConfig.timeDivision !== 'day-night-8-parts') {
    throw new Error(`Unsupported Gulika time division: ${gulikaConfig.timeDivision}`);
  }

  const { period, start, end } = getDayOrNightPeriod(date, location, sunrise, sunset);
  const segments = divideIntoEightSegments(start, end);
  const weekday = start.getDay();
  const startLord = getStartingLord(weekday, period === 'night', gulikaConfig.startLordMode);
  const lords = getSegmentLords(startLord);
  const { segment, idx } = findSaturnSegment(segments, lords);
  const traceSegments: GulikaSegmentTrace[] = segments.map((entry, entryIdx) => ({
    ...entry,
    lord: lords[entryIdx],
  }));
  const gulikaSegment = {
    ...segment,
    lord: lords[idx],
  };
  const { gulikaTime, mandiTime } = computeGulikaOrMandi(segment, gulikaConfig.identityMode);
  const gulikaLongitude = segmentTimeToAscendant(gulikaTime, location);
  const mandiLongitude = segmentTimeToAscendant(mandiTime, location);

  return {
    period,
    dayStart: start,
    dayEnd: end,
    weekday,
    startLord,
    lords,
    segments: traceSegments,
    gulikaSegment,
    gulikaTime,
    mandiTime,
    gulikaLongitude,
    mandiLongitude,
    gulikaSign: Math.floor(gulikaLongitude / 30) + 1,
    mandiSign: Math.floor(mandiLongitude / 30) + 1,
  };
}
