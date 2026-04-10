import { describe, expect, it } from 'vitest';
import { computeAllUpagrahas } from '../src/allUpagrahas';

describe('computeAllUpagrahas', () => {
  it('returns unified solar and kala outputs with metadata and formatted values', () => {
    const result = computeAllUpagrahas({
      sunLongitude: 40,
      birthTime: new Date('2026-04-10T10:00:00.000Z'),
      sunrise: new Date('2026-04-10T06:00:00.000Z'),
      sunset: new Date('2026-04-10T18:00:00.000Z'),
      nextSunrise: new Date('2026-04-11T06:00:00.000Z'),
      lat: 40.7128,
      lon: -74.006,
      weekday: 5,
      options: {
        gulikaMode: 'start',
        mandiMode: 'same_as_gulika',
      },
    });

    expect(result.solar.dhooma.source).toBe('solar');
    expect(result.solar.upaketu.longitude).toBeCloseTo(10, 12);
    expect(typeof result.solar.dhooma.formatted.text).toBe('string');

    expect(result.kalaVelas.gulika.source).toBe('kala');
    expect(typeof result.kalaVelas.gulika.longitude).toBe('number');
    expect(typeof result.kalaVelas.gulika.formatted.text).toBe('string');
    expect(result.kalaVelas.mandi.calculationMode.includes('mandi:same_as_gulika')).toBe(true);
  });
});
