import { SIGN_NAMES } from './constants';

export interface Upagrahas {
  dhooma: number;
  vyatipata: number;
  parivesha: number;
  chapa: number;
  upaketu: number;
}

export interface UpagrahasOptions {
  /**
   * Upagraha transformation tradition.
   * - classical_reflection: Vyatipata = 360deg - Dhooma, etc. (default)
   * - additive_chain: legacy additive chain.
   */
  scheme?: 'classical_reflection' | 'additive_chain';
  /**
   * Validation behavior when classical invariant fails.
   * - throw: throw an Error
   * - warn: emit console.warn only when debug=true
   */
  onValidationFailure?: 'throw' | 'warn';
  /**
   * Enables warnings for non-fatal validation mode.
   */
  debug?: boolean;
}

export interface FormattedLongitude {
  sign: string;
  degrees: number;
  minutes: number;
  text: string;
}

export interface FormattedUpagrahas {
  dhooma: FormattedLongitude;
  vyatipata: FormattedLongitude;
  parivesha: FormattedLongitude;
  chapa: FormattedLongitude;
  upaketu: FormattedLongitude;
}

const FULL_CIRCLE_DEGREES = 360;
const ARC_133_20 = 133 + (20 / 60);
const ARC_53_20 = 53 + (20 / 60);
const ARC_16_40 = 16 + (40 / 60);
const HALF_CIRCLE_DEGREES = 180;
const UPAKETU_TO_SUN_OFFSET = 30;
const VALIDATION_EPSILON = 1e-9;

/**
 * Proper modulo for zodiac longitude.
 * Ensures output in [0, 360), including for negative numbers.
 */
export function normalizeLongitude(value: number): number {
  return ((value % FULL_CIRCLE_DEGREES) + FULL_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES;
}

/**
 * Verifies the classical invariant:
 * Upaketu + 30deg == Sun (mod 360)
 */
export function verifyUpagrahas(sunLongitude: number, upaketuLongitude: number): boolean {
  const sun = normalizeLongitude(sunLongitude);
  const reconstructedSun = normalizeLongitude(upaketuLongitude + UPAKETU_TO_SUN_OFFSET);
  const diff = Math.abs(sun - reconstructedSun);
  return diff < VALIDATION_EPSILON || Math.abs(diff - FULL_CIRCLE_DEGREES) < VALIDATION_EPSILON;
}

/**
 * Computes Aprakasha Grahas (Upagrahas) from Sun's absolute longitude.
 * All steps are normalized to [0, 360) to avoid overflow/sign errors.
 */
export function computeUpagrahas(
  sunLongitude: number,
  options: UpagrahasOptions = {},
): Upagrahas {
  if (!Number.isFinite(sunLongitude)) {
    throw new TypeError('Sun longitude must be a finite number.');
  }

  const sun = normalizeLongitude(sunLongitude);
  const dhooma = normalizeLongitude(sun + ARC_133_20);
  const useAdditiveChain = options.scheme === 'additive_chain';
  const vyatipata = useAdditiveChain
    ? normalizeLongitude(dhooma + ARC_53_20)
    : normalizeLongitude(FULL_CIRCLE_DEGREES - dhooma);
  const parivesha = normalizeLongitude(vyatipata + HALF_CIRCLE_DEGREES);
  const chapa = useAdditiveChain
    ? normalizeLongitude(parivesha - ARC_53_20)
    : normalizeLongitude(FULL_CIRCLE_DEGREES - parivesha);
  const upaketu = normalizeLongitude(chapa + ARC_16_40);

  const result: Upagrahas = { dhooma, vyatipata, parivesha, chapa, upaketu };

  if (!verifyUpagrahas(sun, upaketu)) {
    const message = 'Upagraha validation failed: Upaketu + 30deg != Sun (mod 360).';
    if (options.onValidationFailure === 'warn') {
      if (options.debug) console.warn(message);
    } else {
      throw new Error(message);
    }
  }

  return result;
}

/**
 * Formats absolute longitude as sign + degree + minute.
 * Rounds only for display.
 */
export function formatLongitudeSignDegreesMinutes(longitude: number): FormattedLongitude {
  const normalized = normalizeLongitude(longitude);
  const signIndex = Math.floor(normalized / 30);
  const sign = SIGN_NAMES[signIndex];
  const degreeInSign = normalized - (signIndex * 30);

  let degrees = Math.floor(degreeInSign);
  let minutes = Math.round((degreeInSign - degrees) * 60);

  if (minutes === 60) {
    degrees += 1;
    minutes = 0;
  }

  // For edge formatting only; normalize sign rollover if display rounds to 30deg00'
  if (degrees === 30) {
    degrees = 0;
    const nextSign = SIGN_NAMES[(signIndex + 1) % SIGN_NAMES.length];
    return {
      sign: nextSign,
      degrees,
      minutes,
      text: `${nextSign} ${degrees}deg ${minutes}'`,
    };
  }

  return {
    sign,
    degrees,
    minutes,
    text: `${sign} ${degrees}deg ${minutes}'`,
  };
}

export function formatUpagrahas(upagrahas: Upagrahas): FormattedUpagrahas {
  return {
    dhooma: formatLongitudeSignDegreesMinutes(upagrahas.dhooma),
    vyatipata: formatLongitudeSignDegreesMinutes(upagrahas.vyatipata),
    parivesha: formatLongitudeSignDegreesMinutes(upagrahas.parivesha),
    chapa: formatLongitudeSignDegreesMinutes(upagrahas.chapa),
    upaketu: formatLongitudeSignDegreesMinutes(upagrahas.upaketu),
  };
}
