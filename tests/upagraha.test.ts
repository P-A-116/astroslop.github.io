import { describe, expect, it } from 'vitest';
import { buildChartData } from '../src/astrology';
import {
  computeGulikaOrMandi,
  debugGulikaCalculation,
  defaultGulikaConfig,
  divideIntoEightSegments,
  findSaturnSegment,
  getDayOrNightPeriod,
  getSegmentLords,
  getStartingLord,
  segmentTimeToAscendant,
} from '../src/upagraha';

const athens = { lat: 37.9838, lon: 23.7275 };

describe('getDayOrNightPeriod', () => {
  it('returns the daytime interval when the event falls between sunrise and sunset', () => {
    const sunrise = new Date('2026-04-08T03:30:00.000Z');
    const sunset = new Date('2026-04-08T15:00:00.000Z');
    const event = new Date('2026-04-08T10:00:00.000Z');

    const result = getDayOrNightPeriod(event, athens, sunrise, sunset);
    expect(result.period).toBe('day');
    expect(result.start).toEqual(sunrise);
    expect(result.end).toEqual(sunset);
  });

  it('treats pre-sunrise events as part of the previous night', () => {
    const sunrise = new Date('2026-04-08T03:30:00.000Z');
    const sunset = new Date('2026-04-08T15:00:00.000Z');
    const event = new Date('2026-04-08T02:00:00.000Z');

    const result = getDayOrNightPeriod(event, athens, sunrise, sunset);
    expect(result.period).toBe('night');
    expect(result.start).toEqual(new Date('2026-04-07T15:00:00.000Z'));
    expect(result.end).toEqual(sunrise);
  });
});

describe('segment logic', () => {
  it('divides an interval into eight equal parts', () => {
    const segments = divideIntoEightSegments(
      new Date('2026-04-08T06:00:00.000Z'),
      new Date('2026-04-08T14:00:00.000Z'),
    );

    expect(segments).toHaveLength(8);
    expect(segments[0].start).toEqual(new Date('2026-04-08T06:00:00.000Z'));
    expect(segments[7].end).toEqual(new Date('2026-04-08T14:00:00.000Z'));
  });

  it('supports both night start-lord traditions', () => {
    expect(getStartingLord(6, false, 'weekday')).toBe('Saturn');
    expect(getStartingLord(6, true, 'weekday')).toBe('Saturn');
    expect(getStartingLord(6, true, 'fifth-from-weekday')).toBe('Mercury');
  });

  it('finds Saturn in the generated lord sequence', () => {
    const lords = getSegmentLords('Mercury');
    const segments = divideIntoEightSegments(
      new Date('2026-04-08T18:00:00.000Z'),
      new Date('2026-04-09T06:00:00.000Z'),
    );

    const result = findSaturnSegment(segments, lords);
    expect(result.idx).toBe(2);
    expect(lords[result.idx]).toBe('Saturn');
  });

  it('supports Gulika and Mandi identity modes', () => {
    const segment = {
      start: new Date('2026-04-08T06:00:00.000Z'),
      end: new Date('2026-04-08T07:30:00.000Z'),
      idx: 0,
    };

    expect(computeGulikaOrMandi(segment, 'same')).toEqual({
      gulikaTime: segment.start,
      mandiTime: segment.start,
    });
    expect(computeGulikaOrMandi(segment, 'start-vs-end')).toEqual({
      gulikaTime: segment.start,
      mandiTime: segment.end,
    });
  });
});

describe('segmentTimeToAscendant', () => {
  it('matches the chart ascendant pipeline for the same instant and location', () => {
    const when = new Date('2002-10-06T17:10:00.000Z');
    const fromUpagraha = segmentTimeToAscendant(when, { lat: 40.38, lon: 23.43 });
    const data = buildChartData({
      year: 2002,
      month: 10,
      day: 6,
      hour: 17 + 10 / 60,
      lat: 40.38,
      lon: 23.43,
    });

    expect(Math.abs(fromUpagraha - data.ascSid)).toBeLessThanOrEqual(0.05);
  });
});

describe('debugGulikaCalculation', () => {
  it('returns a traced Saturn segment and sidereal Gulika/Mandi positions', () => {
    const result = debugGulikaCalculation({
      date: new Date('2026-04-11T20:00:00.000Z'),
      location: athens,
      sunrise: new Date('2026-04-11T03:35:00.000Z'),
      sunset: new Date('2026-04-11T15:05:00.000Z'),
      gulikaConfig: {
        ...defaultGulikaConfig,
        startLordMode: 'fifth-from-weekday',
      },
    });

    expect(result.period).toBe('night');
    expect(result.startLord).toBe('Mercury');
    expect(result.gulikaSegment.lord).toBe('Saturn');
    expect(result.segments).toHaveLength(8);
    expect(result.gulikaSign).toBeGreaterThanOrEqual(1);
    expect(result.gulikaSign).toBeLessThanOrEqual(12);
    expect(result.mandiSign).toBeGreaterThanOrEqual(1);
    expect(result.mandiSign).toBeLessThanOrEqual(12);
  });
});
