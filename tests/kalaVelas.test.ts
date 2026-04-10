import { describe, expect, it } from 'vitest';
import { computeKalaVelas, __internalKala } from '../src/kalaVelas';

const sunrise = new Date('2026-04-10T06:00:00.000Z');
const sunset = new Date('2026-04-10T18:00:00.000Z');
const nextSunrise = new Date('2026-04-11T06:00:00.000Z');

const ascendantResolver = (time: Date) => {
  const minutes = time.getUTCHours() * 60 + time.getUTCMinutes() + (time.getUTCSeconds() / 60);
  return ((minutes % 360) + 360) % 360;
};

describe('Kala Vela sequencing', () => {
  it('uses weekday lord as first segment for day birth', () => {
    const birthTime = new Date('2026-04-10T10:00:00.000Z'); // daytime
    const segments = __internalKala.computeSegmentAssignments(
      birthTime,
      sunrise,
      sunset,
      nextSunrise,
      3, // Wednesday -> Mercury
    );

    expect(segments[0].lord).toBe('Mercury');
    expect(segments[1].lord).toBe('Jupiter');
    expect(segments[2].lord).toBe('Venus');
    expect(segments[3].lord).toBe('Saturn');
    expect(segments[4].lord).toBeNull(); // lord-less slot after Saturn
    expect(segments[7].lord).toBe('Mars');
  });

  it('uses 5th-from-weekday lord as first segment for night birth', () => {
    const birthTime = new Date('2026-04-10T20:00:00.000Z'); // nighttime
    const segments = __internalKala.computeSegmentAssignments(
      birthTime,
      sunrise,
      sunset,
      nextSunrise,
      3, // Wednesday -> Mercury
    );

    // 5th from Mercury in weekday order is Sun.
    expect(segments[0].lord).toBe('Sun');
    expect(segments[1].lord).toBe('Moon');
  });
});

describe('computeKalaVelas', () => {
  it('identifies Saturn segment correctly for Gulika', () => {
    const birthTime = new Date('2026-04-10T10:00:00.000Z');
    const segments = __internalKala.computeSegmentAssignments(
      birthTime,
      sunrise,
      sunset,
      nextSunrise,
      3,
    );
    const saturnSegment = segments.find((segment) => segment.lord === 'Saturn');
    if (!saturnSegment) throw new Error('Saturn segment missing in test setup');

    const result = computeKalaVelas({
      birthTime,
      sunrise,
      sunset,
      nextSunrise,
      latitude: 0,
      longitude: 0,
      weekday: 3,
      options: {
        gulikaMode: 'midpoint',
        mandiMode: 'same_as_gulika',
        ascendantResolver,
      },
    });

    expect(result.gulika).toBeCloseTo(
      ascendantResolver(new Date((saturnSegment.start.getTime() + saturnSegment.end.getTime()) / 2)),
      12,
    );
  });

  it('supports midpoint Gulika and start-of-Saturn Mandi distinctly', () => {
    const birthTime = new Date('2026-04-10T10:00:00.000Z');

    const parashara = computeKalaVelas({
      birthTime,
      sunrise,
      sunset,
      nextSunrise,
      latitude: 0,
      longitude: 0,
      weekday: 5, // Friday
      options: {
        gulikaMode: 'midpoint',
        mandiMode: 'segment_start',
        ascendantResolver,
      },
    });

    const extended = computeKalaVelas({
      birthTime,
      sunrise,
      sunset,
      nextSunrise,
      latitude: 0,
      longitude: 0,
      weekday: 5,
      options: {
        gulikaMode: 'midpoint',
        mandiMode: 'segment_midpoint',
        ascendantResolver,
      },
    });

    expect(Math.abs(parashara.gulika - parashara.mandi)).toBeGreaterThan(1e-9);
    expect(extended.gulika).toBeCloseTo(extended.mandi, 12);
  });

  it('handles birth exactly at segment boundary without assigning 8th segment', () => {
    // Day segment size = 90 minutes. 07:30 is exactly the boundary between segment 1 and 2.
    const birthTime = new Date('2026-04-10T07:30:00.000Z');
    const segments = __internalKala.computeSegmentAssignments(
      birthTime,
      sunrise,
      sunset,
      nextSunrise,
      0, // Sunday
    );

    expect(segments[7].lord).toBeNull();

    const result = computeKalaVelas({
      birthTime,
      sunrise,
      sunset,
      nextSunrise,
      latitude: 0,
      longitude: 0,
      weekday: 0,
      options: {
        gulikaMode: 'midpoint',
        mandiMode: 'same_as_gulika',
        ascendantResolver,
      },
    });

    expect(result.gulika).toBeGreaterThanOrEqual(0);
    expect(result.gulika).toBeLessThan(360);
  });
});
