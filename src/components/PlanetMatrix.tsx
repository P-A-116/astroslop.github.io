import { For, type JSX } from 'solid-js';
import { PLANET_ICONS, PLANET_LIST } from '../constants';
import type { PlanetName } from '../types';

interface Props {
  id: string;
  cell: (row: PlanetName, col: PlanetName) => JSX.Element;
}

export default function PlanetMatrix(props: Props) {
  return (
    <table id={props.id} class="astro-table">
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
          {(row) => (
            <tr>
              <td>{PLANET_ICONS[row]} {row}</td>
              <For each={PLANET_LIST}>
                {(col) => row === col ? <td class="self">{'\u2014'}</td> : props.cell(row, col)}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}
