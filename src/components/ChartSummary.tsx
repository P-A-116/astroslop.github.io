import { For } from 'solid-js';
import type { ChartData } from '../types';
import { SIGN_NAMES } from '../constants';
import { formatDms } from '../astrology';

interface Props {
  data: ChartData;
  utcStr: string;
  lat: number;
  lon: number;
  cityName?: string;
}

export default function ChartSummary(props: Props) {
  const items = () => [
    ['UTC Date/Time', props.utcStr],
    ['Location', props.cityName
      ? `${props.cityName} (${props.lat}° N, ${props.lon}° E)`
      : `${props.lat}° N, ${props.lon}° E`],
    ['Ayanamsa', `${props.data.ayanamsa.toFixed(4)}° Lahiri`],
    ['Ascendant', `<span class="highlight">${SIGN_NAMES[props.data.ascSign - 1]}</span> ${formatDms(props.data.ascDeg)}`],
    ['Asc Nakshatra', `${props.data.ascNak} Pada ${props.data.ascPada}`],
    ['Asc Navamsa', SIGN_NAMES[props.data.ascNavamsa - 1]],
    ['Asc D7', SIGN_NAMES[props.data.ascD7 - 1]],
    ['Asc D2 (Hora)', SIGN_NAMES[props.data.ascD2 - 1]],
    ['Asc D3', SIGN_NAMES[props.data.ascD3 - 1]],
    ['Asc D4', SIGN_NAMES[props.data.ascD4 - 1]],
    ['Asc D10', SIGN_NAMES[props.data.ascD10 - 1]],
    ['Asc D12', SIGN_NAMES[props.data.ascD12 - 1]],
    ['Asc D16', SIGN_NAMES[props.data.ascD16 - 1]],
    ['Asc D20', SIGN_NAMES[props.data.ascD20 - 1]],
    ['Asc House', '1st (Whole Sign)'],
  ] as [string, string][];

  return (
    <div class="summary-grid" id="summary-content">
      <For each={items()}>
        {([label, val]) => (
          <div class="summary-item">
            <div class="summary-label">{label}</div>
            <div class="summary-value" innerHTML={val}></div>
          </div>
        )}
      </For>
    </div>
  );
}
