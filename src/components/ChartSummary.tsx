import { For, type JSX } from 'solid-js';
import type { ChartData, DivisionalChart } from '../types';
import { SIGN_NAMES } from '../constants';
import { formatDms, DIVISIONAL_CHARTS } from '../astrology';

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

  const ascItems = () =>
    DIVISIONAL_CHARTS
      .filter(({ chart }) => chart !== 'D1')
      .map(({ chart, label }) => [
        `Asc ${chart}${label.includes('(') ? ` (${label.match(/\(([^)]+)\)/)?.[1] ?? ''})` : ''}`,
        SIGN_NAMES[props.data.ascDivisional[chart] - 1],
      ] as [string, string]);

  const items = (): [string, string | JSX.Element][] => [
    ['UTC Date/Time', props.utcStr],
    ['Location', props.cityName
      ? `${props.cityName} (${latLabel()}, ${lonLabel()})`
      : `${latLabel()}, ${lonLabel()}`],
    ['Ayanamsa', `${props.data.ayanamsa.toFixed(4)}\u00B0 Lahiri`],
    ['Ascendant', <><span class="highlight">{SIGN_NAMES[props.data.ascSign - 1]}</span> {formatDms(props.data.ascDeg)}</>],
    ['Asc Nakshatra', `${props.data.ascNak} Pada ${props.data.ascPada}`],
    ...ascItems(),
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
