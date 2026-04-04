import { For, type JSX } from 'solid-js';
import { formatDms } from '../astrology';
import { SIGN_NAMES } from '../constants';
import type { ChartData } from '../types';

interface Props {
  data: ChartData;
  utcStr: string;
  lat: number;
  lon: number;
}

export default function ChartSummary({ data, utcStr, lat, lon }: Props) {
  const items: [string, JSX.Element][] = [
    ['UTC Date/Time', utcStr],
    ['Location', `${lat}° N, ${lon}° E`],
    ['Ayanamsa', `${data.ayanamsa.toFixed(4)}° Lahiri`],
    ['Ascendant', <><span class="highlight">{SIGN_NAMES[data.ascSign - 1]}</span> {formatDms(data.ascDeg)}</>],
    ['Asc Nakshatra', `${data.ascNak} Pada ${data.ascPada}`],
    ['Asc Navamsa', SIGN_NAMES[data.ascNavamsa - 1]],
    ['Asc D7', SIGN_NAMES[data.ascD7 - 1]],
    ['Asc House', '1st (Whole Sign)'],
  ];

  return (
    <div class="summary-grid" id="summary-content">
      <For each={items}>
        {([label, value]) => (
          <div class="summary-item">
            <div class="summary-label">{label}</div>
            <div class="summary-value">{value}</div>
          </div>
        )}
      </For>
    </div>
  );
}
