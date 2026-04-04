import { createMemo, createSignal, For, Show } from 'solid-js';
import type { ChartData, DivisionalChart } from '../types';
import ChartForm from './ChartForm';
import ChartSummary from './ChartSummary';
import RelationshipTable from './RelationshipTable';
import AspectTable from './AspectTable';
import AnalysisTab from './AnalysisTab';
import DivisionalChartTabs from './DivisionalChartTabs';
import PlanetCard from './PlanetCard';
import {
  getDivisionalSigns,
  getDivisionalLongitudes,
  getDivisionalCombustion,
  getAscSignForChart,
  getCharaKarakasFromLongitudes,
} from '../astrology';

export default function App() {
  const [chartData, setChartData] = createSignal<ChartData | null>(null);
  const [utcStr, setUtcStr] = createSignal('');
  const [latVal, setLatVal] = createSignal(0);
  const [lonVal, setLonVal] = createSignal(0);
  const [cityName, setCityName] = createSignal('');
  const [selectedChart, setSelectedChart] = createSignal<DivisionalChart>('D1');

  const divisionalData = createMemo(() => {
    const data = chartData();
    if (!data) return null;

    const chart = selectedChart();
    const signs = getDivisionalSigns(data.planetData, chart);
    const longitudes = getDivisionalLongitudes(data.planetData, chart);
    return {
      chart,
      data,
      signs,
      longitudes,
      ascSign: getAscSignForChart(data, chart),
      karakas: getCharaKarakasFromLongitudes(longitudes),
      combustion: getDivisionalCombustion(data.planetData, longitudes),
    };
  });

  function handleChartGenerated(
    data: ChartData,
    utc: string,
    lat: number,
    lon: number,
    city: string,
  ) {
    setChartData(data);
    setUtcStr(utc);
    setLatVal(lat);
    setLonVal(lon);
    setCityName(city);
    setSelectedChart('D1');
  }

  return (
    <>
      <div class="stars" aria-hidden="true"></div>

      <header class="site-header">
        <div class="header-inner">
          <div class="logo">
            <span class="logo-icon">{'\u2726'}</span>
            <span class="logo-text">Jyotish Chart</span>
          </div>
          <p class="subtitle">{`Sidereal Vedic Astrology \u00B7 Lahiri Ayanamsa`}</p>
        </div>
      </header>

      <main class="container">
        <ChartForm onGenerate={handleChartGenerated} />

        <Show when={divisionalData()}>
          {(view) => (
            <div id="output" class="output" aria-live="polite">
              <section class="card fade-in" id="chart-summary" style="animation-delay: 0s">
                <h2 class="section-title">Chart Summary</h2>
                <ChartSummary
                  data={view().data}
                  utcStr={utcStr()}
                  lat={latVal()}
                  lon={lonVal()}
                  cityName={cityName()}
                />
              </section>

              <div class="fade-in" style="animation-delay: 0.08s">
                <DivisionalChartTabs
                  selected={view().chart}
                  onSelect={setSelectedChart}
                />
              </div>

              <div id="divisional-tabpanel" role="tabpanel" aria-labelledby={`chart-tab-${view().chart}`}>
                <section class="card fade-in" id="planets-section" style="animation-delay: 0.12s">
                  <h2 class="section-title">Planetary Positions</h2>
                  <div class="planets-grid" id="planets-grid">
                    <For each={view().data.planetData}>
                      {(planet) => (
                        <PlanetCard
                          planet={planet}
                          divSign={view().signs[planet.name]}
                          divAscSign={view().ascSign}
                          divLon={view().longitudes[planet.name]}
                          divKaraka={view().karakas[planet.name] ?? null}
                          divCombust={view().combustion[planet.name]}
                          selectedChart={view().chart}
                        />
                      )}
                    </For>
                  </div>
                </section>

                <section class="card fade-in" id="divisional-tables-section" style="animation-delay: 0.16s">
                  <p class="table-note">{`Compound (Panchadha) relationships \u2014 Natural + Temporary`}</p>
                  <div class="table-scroll">
                    <RelationshipTable signs={view().signs} />
                  </div>
                  <p class="table-note" style="margin-top: 1.5rem">{`Sphuta Drishti \u2014 Aspect Strengths (Virupas) \u00B7 Rows = Aspector \u00B7 Columns = Aspected`}</p>
                  <div class="table-scroll">
                    <AspectTable longitudes={view().longitudes} />
                  </div>
                </section>

                <section class="card fade-in" id="analysis-section" style="animation-delay: 0.24s">
                  <h2 class="section-title">Analysis</h2>
                  <AnalysisTab data={view().data} selectedChart={view().chart} />
                </section>
              </div>
            </div>
          )}
        </Show>
      </main>

      <footer class="site-footer">
        <p>{`Sidereal positions computed with simplified VSOP87-based JS algorithms \u00B7 Lahiri Ayanamsa`}</p>
        <p class="footer-note">{`For reference only \u2014 not a substitute for professional astrological software`}</p>
      </footer>
    </>
  );
}
