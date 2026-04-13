import { For, Show, createMemo, createSignal } from 'solid-js';
import type { DashaTimeline, DivisionalChart } from '../types';
import { generateDashaTimelineFromMoonLongitude, getMahadashaBalance } from '../astrology';
import {
  computeAshtottariDasha,
  getRahuHouseFromAsc,
  isAshtottariEligibleByHouse,
  type AshtottariResult,
} from '../ashtottari';

interface Props {
  jd: number;
  moonLongitude: number;
  selectedChart: DivisionalChart;
  ascSign: number;
  rahuSign: number;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const roundYear = (value: number) => value.toFixed(6);
type DashaSystem = 'Vimshottari' | 'Ashtottari';

export default function DashaCard(props: Props) {
  const [system, setSystem] = createSignal<DashaSystem>('Vimshottari');
  const [expandedMahadasha, setExpandedMahadasha] = createSignal<string | null>(null);
  const timeline = createMemo<DashaTimeline>(() =>
    generateDashaTimelineFromMoonLongitude(props.jd, props.moonLongitude),
  );
  const birthBalance = createMemo(() => getMahadashaBalance(props.moonLongitude));
  const ashtottari = createMemo<AshtottariResult>(() =>
    computeAshtottariDasha(props.jd, props.moonLongitude),
  );
  const rahuHouse = createMemo(() => getRahuHouseFromAsc(props.ascSign, props.rahuSign));
  const ashtottariEligible = createMemo(() => isAshtottariEligibleByHouse(rahuHouse()));
  const toggleMahadasha = (key: string) => {
    setExpandedMahadasha((current) => (current === key ? null : key));
  };

  return (
    <div class="dasha-tab">
      <div class="analysis-section">
        <h3 class="analysis-subtitle">{`Dasha System (${props.selectedChart})`}</h3>
        <p class="analysis-empty">
          {ashtottariEligible()
            ? `Ashtottari condition: Met (Rahu is in house ${rahuHouse()} from Lagna).`
            : `Ashtottari condition: Not met (Rahu is in house ${rahuHouse()} from Lagna; blocked houses: 1, 4, 5, 7, 9, 10).`}
        </p>
        <div class="mode-toggle">
          <button
            type="button"
            class={`toggle-btn ${system() === 'Vimshottari' ? 'active' : ''}`}
            onClick={() => setSystem('Vimshottari')}
          >
            Vimshottari
          </button>
          <button
            type="button"
            class={`toggle-btn ${system() === 'Ashtottari' ? 'active' : ''}`}
            onClick={() => setSystem('Ashtottari')}
          >
            Ashtottari
          </button>
        </div>
        <Show
          when={system() === 'Vimshottari'}
          fallback={
            <Show
              when={ashtottariEligible()}
              fallback={
                <p class="analysis-empty">{`Ashtottari not applicable: Rahu is in house ${rahuHouse()} from Lagna (1/4/5/7/9/10 are ineligible).`}</p>
              }
            >
              <p class="analysis-empty">
                {`Birth Mahadasha: ${ashtottari().startPlanet} (Balance ${ashtottari().balance.years}y ${ashtottari().balance.months}m ${ashtottari().balance.days}d)`}
              </p>
            </Show>
          }
        >
          <p class="analysis-empty">{`Birth Mahadasha: ${birthBalance().lord} (${roundYear(birthBalance().balance)} / ${birthBalance().totalYears} years remaining)`}</p>
        </Show>
      </div>

      <div class="analysis-section">
        <h3 class="analysis-subtitle">Mahadashas</h3>
        <Show when={system() === 'Vimshottari'}>
          <div class="yoga-list">
            <For each={timeline()}>
              {(mahadasha, index) => (
                <div class="yoga-card">
                  <button
                    type="button"
                    class="dasha-toggle"
                    onClick={() => toggleMahadasha(`${mahadasha.lord}-${index()}`)}
                    aria-expanded={expandedMahadasha() === `${mahadasha.lord}-${index()}`}
                  >
                    <div class="yoga-header">
                      <span class="badge badge-karaka">{`${mahadasha.lord} Mahadasha`}</span>
                      <span class="yoga-houses">{`${dateFmt.format(mahadasha.start)} \u2192 ${dateFmt.format(mahadasha.end)} UTC`}</span>
                      <span class="yoga-planets">{`Years: ${roundYear(index() === 0 ? mahadasha.balanceYearsAtBirth : mahadasha.totalYears)}`}</span>
                    </div>
                  </button>
                  <Show when={expandedMahadasha() === `${mahadasha.lord}-${index()}`}>
                    <div class="dasha-antardashas">
                      <For each={mahadasha.antardashas}>
                        {(antardasha) => (
                          <div class="arudha-card">
                            <div class="arudha-label">{antardasha.lord}</div>
                            <div class="arudha-value dasha-date-range">
                              {`${dateFmt.format(antardasha.start)} \u2192 ${dateFmt.format(antardasha.end)} UTC`}
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
        <Show when={system() === 'Ashtottari' && ashtottariEligible()}>
          <div class="yoga-list">
            <For each={ashtottari().timeline}>
              {(mahadasha, index) => (
                <div class="yoga-card">
                  <div class="yoga-header">
                    <span class="badge badge-karaka">{`${mahadasha.planet} Mahadasha`}</span>
                    <span class="yoga-houses">{`${dateFmt.format(mahadasha.startDate)} \u2192 ${dateFmt.format(mahadasha.endDate)} UTC`}</span>
                    <span class="yoga-planets">{index() === 0 ? 'Birth balance' : 'Full mahadasha'}</span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
