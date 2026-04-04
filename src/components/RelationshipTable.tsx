import { For } from 'solid-js';
import type { ChartData, PlanetName } from '../types';
import { PLANET_LIST, PLANET_ICONS, REL_CSS, REL_ABBR } from '../constants';
import {
  getNaturalRelationship,
  getTemporaryRelationship,
  getCompoundRelationship,
} from '../astrology';

interface Props {
  data: ChartData;
  divisionalSigns?: Record<PlanetName, number>;
}

export default function RelationshipTable(props: Props) {
  const signs = () => {
    if (props.divisionalSigns) return props.divisionalSigns;
    const s: Record<string, number> = {};
    PLANET_LIST.forEach(p => { s[p] = props.data.positions[p].sign; });
    return s;
  };

  return (
    <table id="relationship-table" class="astro-table">
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
          {(a) => (
            <tr>
              <td>{PLANET_ICONS[a]} {a}</td>
              <For each={PLANET_LIST}>
                {(b) => {
                  if (a === b) return <td class="self">—</td>;
                  const nat  = () => getNaturalRelationship(a, b);
                  const temp = () => getTemporaryRelationship(signs()[a], signs()[b]);
                  const comp = () => getCompoundRelationship(nat(), temp());
                  const cls  = () => REL_CSS[comp()] || 'rel-nu';
                  const abbr = () => REL_ABBR[comp()] || comp();
                  return (
                    <td class={cls()} title={`${comp()} (nat: ${nat()}, temp: ${temp()})`}>
                      {abbr()}
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
