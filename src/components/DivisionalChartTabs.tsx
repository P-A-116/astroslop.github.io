import { For } from 'solid-js';
import type { DivisionalChart } from '../types';

interface Tab {
  key: DivisionalChart;
  label: string;
}

const TABS: Tab[] = [
  { key: 'D1',  label: 'D1 (Rasi)'         },
  { key: 'D2',  label: 'D2 (Hora)'         },
  { key: 'D3',  label: 'D3 (Drekkana)'     },
  { key: 'D4',  label: 'D4 (Chaturthamsa)' },
  { key: 'D7',  label: 'D7 (Saptamsa)'     },
  { key: 'D9',  label: 'D9 (Navamsa)'      },
  { key: 'D10', label: 'D10 (Dasamsa)'     },
  { key: 'D12', label: 'D12 (Dvadasamsa)'  },
  { key: 'D16', label: 'D16 (Shodasamsa)'  },
  { key: 'D20', label: 'D20 (Vimsamsa)'   },
  { key: 'D27', label: 'D27 (Bhamsa)'     },
  { key: 'D30', label: 'D30 (Trimsamsa)'  },
  { key: 'D40', label: 'D40 (Khavedamsa)' },
  { key: 'D45', label: 'D45 (Akshavedamsa)' },
  { key: 'D60', label: 'D60 (Shashtiamsa)' },
];

interface Props {
  selected: DivisionalChart;
  onSelect: (chart: DivisionalChart) => void;
}

export default function DivisionalChartTabs(props: Props) {
  return (
    <div class="chart-tabs" role="tablist" aria-label="Divisional chart selector">
      <For each={TABS}>
        {(tab) => (
          <button
            id={`chart-tab-${tab.key}`}
            role="tab"
            aria-selected={props.selected === tab.key}
            aria-controls="divisional-tabpanel"
            class={`chart-tab${props.selected === tab.key ? ' active' : ''}`}
            onClick={() => props.onSelect(tab.key)}
          >
            {tab.label}
          </button>
        )}
      </For>
    </div>
  );
}
