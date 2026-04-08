import { For, type JSX } from 'solid-js';
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
  ['Asc D24', 'ascD24'],
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
  const latLabel = () => `${Math.abs(props.lat)}\u00B0 ${props.lat >= 0 ? 'N' : 'S'}`;
  const lonLabel = () => `${Math.abs(props.lon)}\u00B0 ${props.lon >= 0 ? 'E' : 'W'}`;

  const items = (): [string, string | JSX.Element][] => [
    ['UTC Date/Time', props.utcStr],
    ['Location', props.cityName
      ? `${props.cityName} (${latLabel()}, ${lonLabel()})`
      : `${latLabel()}, ${lonLabel()}`],
    ['Ayanamsa', `${props.data.ayanamsa.toFixed(4)}\u00B0 Lahiri`],
    ['Ascendant', <><span class="highlight">{SIGN_NAMES[props.data.ascSign - 1]}</span> {formatDms(props.data.ascDeg)}</>],
    ['Arudha Lagna (A1)', SIGN_NAMES[props.data.arudhaLagna - 1]],
    ['Asc Nakshatra', `${props.data.ascNak} Pada ${props.data.ascPada}`],
    ...ASC_ITEMS.map(([label, key]) => [label, SIGN_NAMES[props.data[key] - 1]] as [string, string]),
  ];

  return (
    <div class="summary-grid" id="summary-content">
      <For each={items()}>
        {([label, val]) => (
          <div class="summary-item">
            <div class="summary-label">{label}</div>
            <div class="summary-value">{val}</div>
          </div>
        )}
      </For>
    </div>
  );
}
