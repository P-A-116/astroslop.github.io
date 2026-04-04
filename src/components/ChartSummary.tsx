import { For } from 'solid-js';
import type { ChartData } from '../types';
import { SIGN_NAMES } from '../constants';
import { formatDms } from '../astrology';

const ASC_ITEMS = [
  ['Asc Navamsa', 'ascNavamsa'],
  ['Asc D7', 'ascD7'],
  ['Asc D2 (Hora)', 'ascD2'],
  ['Asc D3', 'ascD3'],
  ['Asc D4', 'ascD4'],
  ['Asc D10', 'ascD10'],
  ['Asc D12', 'ascD12'],
  ['Asc D16', 'ascD16'],
  ['Asc D20', 'ascD20'],
  ['Asc D27', 'ascD27'],
  ['Asc D30', 'ascD30'],
  ['Asc D40', 'ascD40'],
  ['Asc D45', 'ascD45'],
  ['Asc D60', 'ascD60'],
] as const;

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
      ? `${props.cityName} (${props.lat}Â° N, ${props.lon}Â° E)`
      : `${props.lat}Â° N, ${props.lon}Â° E`],
    ['Ayanamsa', `${props.data.ayanamsa.toFixed(4)}Â° Lahiri`],
    ['Ascendant', `<span class="highlight">${SIGN_NAMES[props.data.ascSign - 1]}</span> ${formatDms(props.data.ascDeg)}`],
    ['Asc Nakshatra', `${props.data.ascNak} Pada ${props.data.ascPada}`],
    ...ASC_ITEMS.map(([label, key]) => [label, SIGN_NAMES[props.data[key] - 1]] as [string, string]),
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
