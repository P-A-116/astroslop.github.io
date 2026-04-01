import { For } from 'solid-js';
import type { PlanetData } from '../types';
import { PLANET_ICONS, SIGN_NAMES, SIGN_LORDS, NAKSHATRA_LORDS } from '../constants';
import { formatDms, signToHouse, getNakshatraPada, getLordships, getFunctionalRole } from '../astrology';

interface Props {
  planet: PlanetData;
  divSign: number;
  divAscSign: number;
  divLon: number;
  divKaraka: string | null;
}

export default function PlanetCard(props: Props) {
  const p = () => props.planet;

  const icon         = () => PLANET_ICONS[p().name] || '●';
  const divSignName  = () => SIGN_NAMES[props.divSign - 1];
  const divHouse     = () => signToHouse(props.divSign, props.divAscSign);
  const divSignLord  = () => SIGN_LORDS[props.divSign - 1];

  const divNakPada   = () => getNakshatraPada(props.divLon);
  const divNakLord   = () => NAKSHATRA_LORDS[divNakPada().nakshatra] || '—';

  const divLordships = () => getLordships(p().name, props.divAscSign);
  const divRole      = () => getFunctionalRole(p().name, props.divAscSign);

  const lordStr      = () => divLordships().length ? divLordships().map(h => `H${h}`).join(', ') : '—';

  const roleBadge   = () => `badge badge-${divRole().toLowerCase()}`;
  const motionBadge = () => p().motion === 'Retrograde'
    ? { cls: 'badge badge-retro', txt: '℞ Retro' }
    : { cls: 'badge badge-direct', txt: 'Direct' };

  const rows = (): [string, string | null][] => [
    ['Degree',       formatDms(p().deg)],
    ['Sign / House', `${divSignName()} / House ${divHouse()}`],
    ['Sign Lord',    divSignLord()],
    ['Nakshatra',    `${divNakPada().nakshatra} Pada ${divNakPada().pada}`],
    ['Nak. Lord',    divNakLord()],
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
          <div class="planet-position">{formatDms(p().deg)} {divSignName()}</div>
        </div>
        {p().combust && <span class="planet-combust">🔥 Combust</span>}
      </div>
      <div class="planet-card-body">
        <For each={rows()}>
          {([lbl, val], i) => (
            <div class="planet-row">
              <span class="planet-row-label">{lbl}</span>
              <span class="planet-row-value">
                {i() === 6 && (
                  <span class={roleBadge()}>{divRole()}</span>
                )}
                {i() === 7 && (
                  <span class={motionBadge().cls}>{motionBadge().txt}</span>
                )}
                {i() === 8 && (
                  props.divKaraka
                    ? <span class="badge badge-karaka">{props.divKaraka}</span>
                    : '—'
                )}
                {i() < 6 && val}
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
