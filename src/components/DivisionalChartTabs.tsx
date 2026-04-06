import { createSignal, For } from 'solid-js';
import type { DivisionalChart } from '../types';
import { DIVISIONAL_CHARTS } from '../astrology';

interface Props {
  selected: DivisionalChart;
  onSelect: (chart: DivisionalChart) => void;
}

function chartName(label: string) {
  const match = label.match(/\(([^)]+)\)/);
  return match?.[1] ?? label;
}

export default function DivisionalChartTabs(props: Props) {
  const [labelMode, setLabelMode] = createSignal<'number' | 'name'>('number');

  return (
    <section class="chart-tabs-shell" aria-label="Divisional chart selector">
      <div class="chart-tab-toolbar">
        <h2 class="section-title chart-tabs-title">Varga Charts</h2>
        <div class="chart-tab-display-toggle" role="group" aria-label="Varga label mode">
          <button
            type="button"
            class={`toggle-btn${labelMode() === 'number' ? ' active' : ''}`}
            onClick={() => setLabelMode('number')}
            aria-pressed={labelMode() === 'number'}
          >
            D Number
          </button>
          <button
            type="button"
            class={`toggle-btn${labelMode() === 'name' ? ' active' : ''}`}
            onClick={() => setLabelMode('name')}
            aria-pressed={labelMode() === 'name'}
          >
            Name
          </button>
        </div>
      </div>

      <div class="chart-tabs" role="tablist" aria-label="Divisional chart selector">
        <For each={DIVISIONAL_CHARTS}>
          {(tab) => (
            <button
              type="button"
              id={`chart-tab-${tab.chart}`}
              role="tab"
              aria-selected={props.selected === tab.chart}
              aria-controls="divisional-tabpanel"
              class={`chart-tab${props.selected === tab.chart ? ' active' : ''}`}
              onClick={() => props.onSelect(tab.chart)}
            >
              {labelMode() === 'number' ? tab.chart : chartName(tab.label)}
            </button>
          )}
        </For>
      </div>
    </section>
  );
}
