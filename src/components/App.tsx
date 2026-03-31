import { createSignal } from 'solid-js';
import { Show } from 'solid-js';
import type { ChartData } from '../types';
import ChartForm from './ChartForm';
import ChartSummary from './ChartSummary';
import PlanetsGrid from './PlanetsGrid';
import RelationshipTable from './RelationshipTable';
import AspectTable from './AspectTable';
import AnalysisTab from './AnalysisTab';

export default function App() {
  const [chartData, setChartData] = createSignal<ChartData | null>(null);
  const [utcStr, setUtcStr] = createSignal('');
  const [latVal, setLatVal] = createSignal(0);
  const [lonVal, setLonVal] = createSignal(0);

  function handleChartGenerated(data: ChartData, utc: string, lat: number, lon: number) {
    setChartData(data);
    setUtcStr(utc);
    setLatVal(lat);
    setLonVal(lon);
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

              <section class="card fade-in" id="planets-section" style="animation-delay: 0.08s">
                <h2 class="section-title">Planetary Positions</h2>
                <PlanetsGrid planets={data().planetData} />
              </section>

              <section class="card fade-in" id="relationship-section" style="animation-delay: 0.16s">
                <h2 class="section-title">Planet Relationship Table</h2>
                <p class="table-note">Compound (Panchadha) relationships — Natural + Temporary</p>
                <div class="table-scroll">
                  <RelationshipTable data={data()} />
                </div>
              </section>

              <section class="card fade-in" id="aspect-section" style="animation-delay: 0.24s">
                <h2 class="section-title">Sphuta Drishti — Aspect Strengths (Virupas)</h2>
                <p class="table-note">Rows = Aspector · Columns = Aspected</p>
                <div class="table-scroll">
                  <AspectTable data={data()} />
                </div>
              </section>

              <section class="card fade-in" id="analysis-section" style="animation-delay: 0.32s">
                <h2 class="section-title">Analysis</h2>
                <AnalysisTab data={data()} />
              </section>
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
