import { For } from 'solid-js';
import type { PlanetData } from '../types';
import PlanetCard from './PlanetCard';

interface Props {
  planets: PlanetData[];
}

export default function PlanetsGrid(props: Props) {
  return (
    <div class="planets-grid" id="planets-grid">
      <For each={props.planets}>
        {(planet) => <PlanetCard planet={planet} />}
      </For>
    </div>
  );
}
