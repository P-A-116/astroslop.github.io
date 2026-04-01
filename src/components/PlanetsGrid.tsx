import { For } from 'solid-js';
import type { PlanetData, PlanetName } from '../types';
import PlanetCard from './PlanetCard';

interface Props {
  planets: PlanetData[];
  divisionalSigns: Record<PlanetName, number>;
  divAscSign: number;
  divisionalLongitudes: Record<PlanetName, number>;
  divKarakas: Partial<Record<PlanetName, string>>;
}

export default function PlanetsGrid(props: Props) {
  return (
    <div class="planets-grid" id="planets-grid">
      <For each={props.planets}>
        {(planet) => (
          <PlanetCard
            planet={planet}
            divSign={props.divisionalSigns[planet.name]}
            divAscSign={props.divAscSign}
            divLon={props.divisionalLongitudes[planet.name]}
            divKaraka={props.divKarakas[planet.name] ?? null}
          />
        )}
      </For>
    </div>
  );
}
