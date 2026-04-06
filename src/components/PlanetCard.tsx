import { For, type JSX } from 'solid-js';
import type { PlanetData, DivisionalChart } from '../types';
import { PLANET_ICONS, SIGN_NAMES, SIGN_LORDS, NAKSHATRA_LORDS } from '../constants';
import { formatDms, signToHouse, getNakshatraPada, getLordships, getFunctionalRole, getDivisionalDeity } from '../astrology';

interface Props {
  planet: PlanetData;
  divSign: number;
  divAscSign: number;
  divLon: number;
  divKaraka: string | null;
  divCombust: boolean;
  selectedChart: DivisionalChart;
}

const DASH = '\u2014';

export default function PlanetCard(props: Props) {
  const showShashtiamsa = () => props.selectedChart === 'D60';

  const rows = (): [string, JSX.Element | string][] => {
    const { planet, divSign, divAscSign, divLon, divKaraka } = props;
    const nak = getNakshatraPada(divLon);
    const lordships = getLordships(planet.name, divAscSign);
    const role = getFunctionalRole(planet.name, divAscSign);
    const deity = getDivisionalDeity(props.selectedChart, divSign, divLon);
    const motion = planet.motion === 'Retrograde'
      ? { cls: 'badge badge-retro', txt: '\u211E Retro' }
      : { cls: 'badge badge-direct', txt: 'Direct' };

    return [
      ['Degree', formatDms(divLon % 30)],
      ['Sign / House', `${SIGN_NAMES[divSign - 1]} / House ${signToHouse(divSign, divAscSign)}`],
      ['Sign Lord', SIGN_LORDS[divSign - 1]],
      ['Divisional Deity', deity || DASH],
      ['Nakshatra', `${nak.nakshatra} Pada ${nak.pada}`],
      ['Nak. Lord', NAKSHATRA_LORDS[nak.nakshatra] || DASH],
      ['Lords Houses', lordships.length ? lordships.map((house) => `H${house}`).join(', ') : DASH],
      ['Func. Role', <span class={`badge badge-${role.toLowerCase()}`}>{role}</span>],
      ['Motion', <span class={motion.cls}>{motion.txt}</span>],
      ['Karaka', divKaraka ? <span class="badge badge-karaka">{divKaraka}</span> : DASH],
    ];
  };

  const shashtiamsa = () => props.planet.d60Shashtiamsa;
  const shashtiamsaNatureLabel = () => shashtiamsa().nature === 'B' ? 'Benefic' : 'Malefic';
  const shashtiamsaBadge = () => shashtiamsa().nature === 'B' ? 'badge badge-benefic' : 'badge badge-malefic';

  return (
    <div class="planet-card">
      <div class="planet-card-header">
        <span class="planet-icon">{PLANET_ICONS[props.planet.name] || '\u25CF'}</span>
        <div>
          <div class="planet-name">{props.planet.name}</div>
          <div class="planet-position">{formatDms(props.divLon % 30)} {SIGN_NAMES[props.divSign - 1]}</div>
        </div>
        {props.divCombust && <span class="planet-combust">{'\uD83D\uDD25'} Combust</span>}
      </div>
      <div class="planet-card-body">
        <For each={rows()}>
          {([label, value]) => (
            <div class="planet-row">
              <span class="planet-row-label">{label}</span>
              <span class="planet-row-value">{value}</span>
            </div>
          )}
        </For>
        <For each={showShashtiamsa() ? [shashtiamsa()] : []}>
          {(entry) => (
            <div class="planet-row shashtiamsa-row">
              <span class="planet-row-label">Shashtiamsa</span>
              <span class="planet-row-value shashtiamsa-value">
                <span class="shashtiamsa-name">{entry.name}</span>
                <span class={shashtiamsaBadge()}>{shashtiamsaNatureLabel()}</span>
                <span class="shashtiamsa-desc">{entry.description}</span>
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
