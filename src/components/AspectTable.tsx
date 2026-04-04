import { sphutaDrishti } from '../astrology';
import type { ChartData } from '../types';
import PlanetMatrix from './PlanetMatrix';

interface Props {
  data: ChartData;
}

const aspectColor = (val: number | null) =>
  val === null ? '#2a3a5a' : val >= 50 ? '#d4a847' : val >= 30 ? '#7ab0e0' : val >= 15 ? '#5a7898' : val > 0 ? '#3a5070' : '#1e2a40';

const aspectClass = (val: number | null) =>
  val === null ? 'asp-none' : val >= 50 ? 'asp-strong' : val >= 25 ? 'asp-medium' : val > 0 ? 'asp-weak' : 'asp-none';

export default function AspectTable(props: Props) {
  const { positions } = props.data;

  return (
    <PlanetMatrix
      id="aspect-table"
      cell={(asp, aspected) => {
        const val = sphutaDrishti(asp, aspected, positions[asp].lon, positions[aspected].lon);
        const display = val === null ? '·' : Math.round(val * 10) / 10;
        return (
          <td
            class={aspectClass(val)}
            style={`background:${aspectColor(val)}`}
            title={`${asp}→${aspected}: ${val === null ? 'n/a' : display} virupas`}
          >
            {display}
          </td>
        );
      }}
    />
  );
}
