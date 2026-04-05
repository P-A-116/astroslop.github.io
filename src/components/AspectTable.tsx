import type { PlanetName } from '../types';
import { sphutaDrishti } from '../astrology';
import PlanetMatrix from './PlanetMatrix';

interface Props {
  longitudes: Record<PlanetName, number>;
}

function aspectMeta(val: number | null) {
  if (val === null) return { cls: 'asp-none', color: '#2a3a5a', display: '\u00B7' };
  if (val >= 50) return { cls: 'asp-strong', color: '#d4a847', display: Math.round(val * 10) / 10 };
  if (val >= 25) return { cls: 'asp-medium', color: '#7ab0e0', display: Math.round(val * 10) / 10 };
  if (val > 0) return { cls: 'asp-weak', color: '#3a5070', display: Math.round(val * 10) / 10 };
  return { cls: 'asp-none', color: '#1e2a40', display: 0 };
}

export default function AspectTable(props: Props) {
  return (
    <PlanetMatrix
      id="aspect-table"
      caption="Sphuta Drishti (Aspect Strengths in Virupas)"
      cell={(asp, aspected) => {
        const value = sphutaDrishti(
          asp,
          aspected,
          props.longitudes[asp],
          props.longitudes[aspected],
        );
        const meta = aspectMeta(value);
        return (
          <td
            class={meta.cls}
            title={`${asp}\u2192${aspected}: ${value === null ? 'n/a' : meta.display} virupas`}
          >
            {meta.display}
          </td>
        );
      }}
    />
  );
}
