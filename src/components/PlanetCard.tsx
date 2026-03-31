import { For } from 'solid-js';
import type { PlanetData } from '../types';
import { PLANET_ICONS, SIGN_NAMES } from '../constants';
import { formatDms } from '../astrology';

interface Props {
  planet: PlanetData;
}

export default function PlanetCard(props: Props) {
  const p = () => props.planet;

  const icon      = () => PLANET_ICONS[p().name] || '●';
  const signName  = () => SIGN_NAMES[p().sign - 1];
  const lordStr   = () => p().lordships.length ? p().lordships.map(h => `H${h}`).join(', ') : '—';

  const roleBadge   = () => `badge badge-${p().role.toLowerCase()}`;
  const motionBadge = () => p().motion === 'Retrograde'
    ? { cls: 'badge badge-retro', txt: '℞ Retro' }
    : { cls: 'badge badge-direct', txt: 'Direct' };

  const rows = (): [string, string | null][] => [
    ['Degree',       formatDms(p().deg)],
    ['Sign / House', `${signName()} / House ${p().house}`],
    ['Sign Lord',    p().signLord],
    ['Nakshatra',    `${p().nakshatra} Pada ${p().pada}`],
    ['Nak. Lord',    p().nakLord],
    ['Navamsa',      `${SIGN_NAMES[p().navamsaSign - 1]} (H${p().navamsaHouse})`],
    ['D7',           `${SIGN_NAMES[p().d7Sign - 1]} (H${p().d7House})`],
    ['Lords Houses', lordStr()],
    ['Func. Role',   null],   // rendered specially
    ['Motion',       null],   // rendered specially
    ['Karaka',       null],   // rendered specially
  ];

  return (
    <div class="planet-card">
      <div class="planet-card-header">
        <span class="planet-icon">{icon()}</span>
        <div>
          <div class="planet-name">{p().name}</div>
          <div class="planet-position">{formatDms(p().deg)} {signName()}</div>
        </div>
        {p().combust && <span class="planet-combust">🔥 Combust</span>}
      </div>
      <div class="planet-card-body">
        <For each={rows()}>
          {([lbl, val], i) => (
            <div class="planet-row">
              <span class="planet-row-label">{lbl}</span>
              <span class="planet-row-value">
                {i() === 8 && (
                  <span class={roleBadge()}>{p().role}</span>
                )}
                {i() === 9 && (
                  <span class={motionBadge().cls}>{motionBadge().txt}</span>
                )}
                {i() === 10 && (
                  p().karaka
                    ? <span class="badge badge-karaka">{p().karaka}</span>
                    : '—'
                )}
                {i() < 8 && val}
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
