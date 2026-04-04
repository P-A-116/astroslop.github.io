import { For, type JSX } from 'solid-js';
import { formatDms } from '../astrology';
import { PLANET_ICONS, SIGN_NAMES } from '../constants';
import type { PlanetData } from '../types';

interface Props {
  planet: PlanetData;
}

function Row(props: { label: string; value: JSX.Element }) {
  return (
    <div class="planet-row">
      <span class="planet-row-label">{props.label}</span>
      <span class="planet-row-value">{props.value}</span>
    </div>
  );
}

export default function PlanetCard({ planet }: Props) {
  const sign = SIGN_NAMES[planet.sign - 1];
  const motion = planet.motion === 'Retrograde'
    ? ['badge badge-retro', '℞ Retro']
    : ['badge badge-direct', 'Direct'];
  const rows: [string, JSX.Element][] = [
    ['Degree', formatDms(planet.deg)],
    ['Sign / House', `${sign} / House ${planet.house}`],
    ['Sign Lord', planet.signLord],
    ['Nakshatra', `${planet.nakshatra} Pada ${planet.pada}`],
    ['Nak. Lord', planet.nakLord],
    ['Navamsa', `${SIGN_NAMES[planet.navamsaSign - 1]} (H${planet.navamsaHouse})`],
    ['D7', `${SIGN_NAMES[planet.d7Sign - 1]} (H${planet.d7House})`],
    ['Lords Houses', planet.lordships.map((h) => `H${h}`).join(', ') || '—'],
    ['Func. Role', <span class={`badge badge-${planet.role.toLowerCase()}`}>{planet.role}</span>],
    ['Motion', <span class={motion[0]}>{motion[1]}</span>],
    ['Karaka', planet.karaka ? <span class="badge badge-karaka">{planet.karaka}</span> : '—'],
  ];

  return (
    <div class="planet-card">
      <div class="planet-card-header">
        <span class="planet-icon">{PLANET_ICONS[planet.name] ?? '●'}</span>
        <div>
          <div class="planet-name">{planet.name}</div>
          <div class="planet-position">{formatDms(planet.deg)} {sign}</div>
        </div>
        {planet.combust && <span class="planet-combust">🔥 Combust</span>}
      </div>
      <div class="planet-card-body">
        <For each={rows}>{([label, value]) => <Row label={label} value={value} />}</For>
      </div>
    </div>
  );
}
