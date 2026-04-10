import { computeUpagrahas, formatLongitudeSignDegreesMinutes } from './upagrahas';
import { computeKalaVelasDetailed } from './kalaVelas';
import type { KalaVelaOptions } from './kalaVelas';

export function computeAllUpagrahas(input: {
  sunLongitude: number;
  birthTime: Date;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  lat: number;
  lon: number;
  weekday: number;
  options: KalaVelaOptions;
}) {
  const solarRaw = computeUpagrahas(input.sunLongitude);

  const solar = {
    dhooma: {
      longitude: solarRaw.dhooma,
      formatted: formatLongitudeSignDegreesMinutes(solarRaw.dhooma),
      source: 'solar' as const,
      calculationMode: 'dhooma_chain',
    },
    vyatipata: {
      longitude: solarRaw.vyatipata,
      formatted: formatLongitudeSignDegreesMinutes(solarRaw.vyatipata),
      source: 'solar' as const,
      calculationMode: 'dhooma_chain',
    },
    parivesha: {
      longitude: solarRaw.parivesha,
      formatted: formatLongitudeSignDegreesMinutes(solarRaw.parivesha),
      source: 'solar' as const,
      calculationMode: 'dhooma_chain',
    },
    chapa: {
      longitude: solarRaw.chapa,
      formatted: formatLongitudeSignDegreesMinutes(solarRaw.chapa),
      source: 'solar' as const,
      calculationMode: 'dhooma_chain',
    },
    upaketu: {
      longitude: solarRaw.upaketu,
      formatted: formatLongitudeSignDegreesMinutes(solarRaw.upaketu),
      source: 'solar' as const,
      calculationMode: 'dhooma_chain',
    },
  };

  const kalaVelas = computeKalaVelasDetailed({
    birthTime: input.birthTime,
    sunrise: input.sunrise,
    sunset: input.sunset,
    nextSunrise: input.nextSunrise,
    latitude: input.lat,
    longitude: input.lon,
    weekday: input.weekday,
    options: input.options,
  });

  return { solar, kalaVelas };
}
