import { For } from 'solid-js';
import type { ChartData, PlanetName } from '../types';
import { PLANET_LIST, PLANET_ICONS } from '../constants';
import { sphutaDrishti } from '../astrology';

interface Props {
  data: ChartData;
  divisionalLongitudes?: Record<PlanetName, number>;
}

function aspectColor(val: number | null): string {
  if (val === null) return '#2a3a5a';
  if (val >= 50)    return '#d4a847';
  if (val >= 30)    return '#7ab0e0';
  if (val >= 15)    return '#5a7898';
  if (val > 0)      return '#3a5070';
  return '#1e2a40';
}

function aspectClass(val: number | null): string {
  if (val === null) return 'asp-none';
  if (val >= 50)    return 'asp-strong';
  if (val >= 25)    return 'asp-medium';
  if (val > 0)      return 'asp-weak';
  return 'asp-none';
}

export default function AspectTable(props: Props) {
  return (
    <table id="aspect-table" class="astro-table">
      <thead>
        <tr>
          <th></th>
          <For each={PLANET_LIST}>
            {(p) => <th title={p}>{PLANET_ICONS[p]} {p}</th>}
          </For>
        </tr>
      </thead>
      <tbody>
        <For each={PLANET_LIST}>
          {(asp) => (
            <tr>
              <td>{PLANET_ICONS[asp]} {asp}</td>
              <For each={PLANET_LIST}>
                {(aspected) => {
                  if (asp === aspected) return <td class="self">—</td>;
                  const aspLon      = props.divisionalLongitudes
                    ? props.divisionalLongitudes[asp as PlanetName]
                    : props.data.positions[asp].lon;
                  const aspectedLon = props.divisionalLongitudes
                    ? props.divisionalLongitudes[aspected as PlanetName]
                    : props.data.positions[aspected].lon;
                  const val = sphutaDrishti(asp, aspected, aspLon, aspectedLon);
                  const display = val === null ? '·' : Math.round(val * 10) / 10;
                  const bg  = aspectColor(val);
                  const cls = aspectClass(val);
                  return (
                    <td
                      class={cls}
                      style={`background:${bg}`}
                      title={`${asp}→${aspected}: ${val === null ? 'n/a' : display} virupas`}
                    >
                      {display}
                    </td>
                  );
                }}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}
