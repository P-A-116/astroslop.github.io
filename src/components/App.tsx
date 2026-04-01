import { createSignal, createMemo } from 'solid-js';
import { Show } from 'solid-js';
import type { ChartData, DivisionalChart, PlanetName } from '../types';
import ChartForm from './ChartForm';
import ChartSummary from './ChartSummary';
import PlanetsGrid from './PlanetsGrid';
import RelationshipTable from './RelationshipTable';
import AspectTable from './AspectTable';
import AnalysisTab from './AnalysisTab';
import DivisionalChartTabs from './DivisionalChartTabs';
import { getDivisionalSigns, getDivisionalLongitudes, getAscSignForChart, getCharaKarakasFromLongitudes } from '../astrology';

export default function App() {
  const [chartData, setChartData] = createSignal<ChartData | null>(null);
  const [utcStr, setUtcStr] = createSignal('');
  const [latVal, setLatVal] = createSignal(0);
  const [lonVal, setLonVal] = createSignal(0);
  const [selectedChart, setSelectedChart] = createSignal<DivisionalChart>('D1');

  const divLons = createMemo((): Record<PlanetName, number> => {
    const d = chartData();
    if (!d) return {} as Record<PlanetName, number>;
    return getDivisionalLongitudes(d.planetData, selectedChart());
  });

  function handleChartGenerated(data: ChartData, utc: string, lat: number, lon: number) {
    setChartData(data);
    setUtcStr(utc);
    setLatVal(lat);
    setLonVal(lon);
    setSelectedChart('D1');
  }

  return (
    <>
      <div class="stars" aria-hidden="true"></div>

      <header class="site-header">
        <div class="header-inner">
          <div class="logo">
            <span class="logo-icon">✦</span>
            <span class="logo-text">Jyotish Chart</span>
          </div>
          <p class="subtitle">Sidereal Vedic Astrology · Lahiri Ayanamsa</p>
        </div>
      </header>

      <main class="container">
        <ChartForm onGenerate={handleChartGenerated} />

        <Show when={chartData()}>
          {(data) => (
            <div id="output" class="output" aria-live="polite">
              <section class="card fade-in" id="chart-summary" style="animation-delay: 0s">
                <h2 class="section-title">Chart Summary</h2>
                <ChartSummary data={data()} utcStr={utcStr()} lat={latVal()} lon={lonVal()} />
              </section>

              <div class="fade-in" style="animation-delay: 0.08s">
                <DivisionalChartTabs
                  selected={selectedChart()}
                  onSelect={setSelectedChart}
                />
              </div>

              <div id="divisional-tabpanel" role="tabpanel" aria-labelledby={`chart-tab-${selectedChart()}`}>
                <section class="card fade-in" id="planets-section" style="animation-delay: 0.12s">
                  <h2 class="section-title">Planetary Positions</h2>
                  <PlanetsGrid
                    planets={data().planetData}
                    divisionalSigns={getDivisionalSigns(data().planetData, selectedChart())}
                    divAscSign={getAscSignForChart(data(), selectedChart())}
                    divisionalLongitudes={divLons()}
                    divKarakas={getCharaKarakasFromLongitudes(divLons())}
                  />
                </section>

                <section class="card fade-in" id="divisional-tables-section" style="animation-delay: 0.16s">
                  <p class="table-note">Compound (Panchadha) relationships — Natural + Temporary</p>
                  <div class="table-scroll">
                    <RelationshipTable
                      data={data()}
                      divisionalSigns={getDivisionalSigns(data().planetData, selectedChart())}
                    />
                  </div>
                  <p class="table-note" style="margin-top: 1.5rem">Sphuta Drishti — Aspect Strengths (Virupas) · Rows = Aspector · Columns = Aspected</p>
                  <div class="table-scroll">
                    <AspectTable
                      data={data()}
                      divisionalLongitudes={divLons()}
                    />
                  </div>
                </section>

                <section class="card fade-in" id="analysis-section" style="animation-delay: 0.24s">
                  <h2 class="section-title">Analysis</h2>
                  <AnalysisTab data={data()} selectedChart={selectedChart()} />
                </section>
              </div>
            </div>
          )}
        </Show>
      </main>

      <footer class="site-footer">
        <p>Sidereal positions computed with simplified VSOP87-based JS algorithms · Lahiri Ayanamsa</p>
        <p class="footer-note">For reference only — not a substitute for professional astrological software</p>
      </footer>
    </>
  );
}
