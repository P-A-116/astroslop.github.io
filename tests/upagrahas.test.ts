import { describe, expect, it } from 'vitest';
import {
  computeUpagrahas,
  formatUpagrahas,
  normalizeLongitude,
  verifyUpagrahas,
} from '../src/upagrahas';

const EPS = 1e-9;

describe('normalizeLongitude', () => {
  it('normalizes negative and overflow values into [0, 360)', () => {
    expect(normalizeLongitude(361)).toBeCloseTo(1, 12);
    expect(normalizeLongitude(-1)).toBeCloseTo(359, 12);
    expect(normalizeLongitude(-721)).toBeCloseTo(359, 12);
  });
});

describe('computeUpagrahas', () => {
  it('matches classical reflection values for Sun = 40deg', () => {
    const result = computeUpagrahas(40);

    // Expected:
    // Dhooma = 173deg20'
    // Vyatipata = 186deg40'
    // Parivesha = 6deg40'
    // Chapa = 353deg20'
    // Upaketu = 10deg00'
    expect(result.dhooma).toBeCloseTo(173 + (20 / 60), 12);
    expect(result.vyatipata).toBeCloseTo(186 + (40 / 60), 12);
    expect(result.parivesha).toBeCloseTo(6 + (40 / 60), 12);
    expect(result.chapa).toBeCloseTo(353 + (20 / 60), 12);
    expect(result.upaketu).toBeCloseTo(10, 12);
  });

  it('supports legacy additive chain when explicitly requested', () => {
    const result = computeUpagrahas(40, { scheme: 'additive_chain' });
    expect(result.vyatipata).toBeCloseTo(226 + (40 / 60), 12);
    expect(result.parivesha).toBeCloseTo(46 + (40 / 60), 12);
  });

  it('handles Sun near 360deg without overflow/sign errors', () => {
    const result = computeUpagrahas(359.9);

    expect(result.dhooma).toBeGreaterThanOrEqual(0);
    expect(result.vyatipata).toBeGreaterThanOrEqual(0);
    expect(result.parivesha).toBeGreaterThanOrEqual(0);
    expect(result.chapa).toBeGreaterThanOrEqual(0);
    expect(result.upaketu).toBeGreaterThanOrEqual(0);

    expect(result.dhooma).toBeLessThan(360);
    expect(result.vyatipata).toBeLessThan(360);
    expect(result.parivesha).toBeLessThan(360);
    expect(result.chapa).toBeLessThan(360);
    expect(result.upaketu).toBeLessThan(360);
  });

  it('enforces Upaketu + 30deg = Sun (mod 360)', () => {
    const result = computeUpagrahas(40);
    expect(verifyUpagrahas(40, result.upaketu)).toBe(true);
    expect(verifyUpagrahas(40, result.upaketu + 1)).toBe(false);
  });

  it('throws for invalid Sun longitude input', () => {
    expect(() => computeUpagrahas(Number.NaN)).toThrow(TypeError);
  });
});

describe('formatUpagrahas', () => {
  it('exposes sign-degree-minute formatting alongside raw degree output', () => {
    const result = computeUpagrahas(40);
    const formatted = formatUpagrahas(result);

    expect(formatted.dhooma.sign).toBe('Virgo');
    expect(formatted.dhooma.degrees).toBe(23);
    expect(Math.abs(result.dhooma - (173 + (20 / 60)))).toBeLessThan(EPS);
  });
});
