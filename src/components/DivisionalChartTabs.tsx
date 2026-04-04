import type { DivisionalChart } from '../types';
import { DIVISIONAL_CHARTS } from '../astrology';

interface Props {
  selected: DivisionalChart;
  onSelect: (chart: DivisionalChart) => void;
}

export default function DivisionalChartTabs(props: Props) {
  return (
    <div class="chart-tabs" role="tablist" aria-label="Divisional chart selector">
      {DIVISIONAL_CHARTS.map((tab) => (
        <button
          id={`chart-tab-${tab.chart}`}
          role="tab"
          aria-selected={props.selected === tab.chart}
          aria-controls="divisional-tabpanel"
          class={`chart-tab${props.selected === tab.chart ? ' active' : ''}`}
          onClick={() => props.onSelect(tab.chart)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
