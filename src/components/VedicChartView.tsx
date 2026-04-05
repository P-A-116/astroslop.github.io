import { createSignal } from 'solid-js';
import { VedicChart, defaultStyles } from 'vedic-astrology-chart-solid';
import type { DivisionalChart, PlanetName } from '../types';

interface Props {
  longitudes: Record<PlanetName, number>;
  ascSign: number;
  ascSid: number;
  ayanamsa: number;
  selectedChart: DivisionalChart;
}

export default function VedicChartView(props: Props) {
  const [chartStyle, setChartStyle] = createSignal<'north' | 'south'>('north');
  const [displayMode, setDisplayMode] = createSignal<'symbols' | 'names'>('symbols');

  const ascendantDegrees = () => {
    if (props.selectedChart === 'D1') return props.ascSid;
    // For divisional charts, use the start of the ascendant sign (sign number 1-12 → 0°–330°)
    return (props.ascSign - 1) * 30;
  };

  return (
    <>
      <style>{defaultStyles}</style>
      <div class="chart-style-toggle">
        <button
          class={chartStyle() === 'north' ? 'active' : ''}
          onClick={() => setChartStyle('north')}
        >
          North Indian
        </button>
        <button
          class={chartStyle() === 'south' ? 'active' : ''}
          onClick={() => setChartStyle('south')}
        >
          South Indian
        </button>
        <button onClick={() => setDisplayMode(m => m === 'symbols' ? 'names' : 'symbols')}>
          {displayMode() === 'symbols' ? '☉ Symbols' : 'Abc Names'}
        </button>
      </div>
      <VedicChart
        planets={props.longitudes}
        ascendant={ascendantDegrees()}
        ayanamsa={props.ayanamsa}
        style={chartStyle()}
        width={500}
        height={500}
        showHouseLabels={true}
        planetDisplayMode={displayMode()}
      />
    </>
  );
}
