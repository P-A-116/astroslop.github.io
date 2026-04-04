import { For, Show, createSignal, type JSX } from 'solid-js';
import type { ChartData } from '../types';
import AnalysisTab from './AnalysisTab';
import AspectTable from './AspectTable';
import ChartForm from './ChartForm';
import ChartSummary from './ChartSummary';
import PlanetCard from './PlanetCard';
import RelationshipTable from './RelationshipTable';

interface Result {
  data: ChartData;
  utcStr: string;
  lat: number;
  lon: number;
}

function Section(props: {
  id: string;
  title: string;
  delay: string;
  note?: string;
  scroll?: boolean;
  children: JSX.Element;
}) {
  return (
    <section class="card fade-in" id={props.id} style={`animation-delay:${props.delay}`}>
      <h2 class="section-title">{props.title}</h2>
      {props.note && <p class="table-note">{props.note}</p>}
      {props.scroll ? <div class="table-scroll">{props.children}</div> : props.children}
    </section>
  );
}

export default function App() {
  const [result, setResult] = createSignal<Result | null>(null);

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
        <ChartForm onGenerate={(data, utcStr, lat, lon) => setResult({ data, utcStr, lat, lon })} />

        <Show when={result()}>
          {(result) => {
            const { data, utcStr, lat, lon } = result();
            return (
              <div id="output" class="output" aria-live="polite">
                <Section id="chart-summary" title="Chart Summary" delay="0s">
                  <ChartSummary data={data} utcStr={utcStr} lat={lat} lon={lon} />
                </Section>

                <Section id="planets-section" title="Planetary Positions" delay="0.08s">
                  <div class="planets-grid" id="planets-grid">
                    <For each={data.planetData}>{(planet) => <PlanetCard planet={planet} />}</For>
                  </div>
                </Section>

                <Section
                  id="relationship-section"
                  title="Planet Relationship Table"
                  delay="0.16s"
                  note="Compound (Panchadha) relationships — Natural + Temporary"
                  scroll
                >
                  <RelationshipTable data={data} />
                </Section>

                <Section
                  id="aspect-section"
                  title="Sphuta Drishti — Aspect Strengths (Virupas)"
                  delay="0.24s"
                  note="Rows = Aspector · Columns = Aspected"
                  scroll
                >
                  <AspectTable data={data} />
                </Section>

                <Section id="analysis-section" title="Analysis" delay="0.32s">
                  <AnalysisTab data={data} />
                </Section>
              </div>
            );
          }}
        </Show>
      </main>

      <footer class="site-footer">
        <p>Sidereal positions computed with simplified VSOP87-based JS algorithms · Lahiri Ayanamsa</p>
        <p class="footer-note">For reference only — not a substitute for professional astrological software</p>
      </footer>
    </>
  );
}
