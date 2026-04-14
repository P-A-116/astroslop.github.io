import { For, Show, createMemo, createSignal } from 'solid-js';
import type { DashaTimeline, DivisionalChart } from '../types';
import { SIGN_NAMES } from '../constants';
import { generateDashaTimelineFromMoonLongitude, getMahadashaBalance } from '../astrology';
import {
  computeAshtottariDasha,
  getPakshaFromLongitudes,
  getRahuHouseFromAsc,
  isAshtottariEligibleByPakshaAndTime,
  isDayBirth,
  isAshtottariEligibleByHouse,
  type AshtottariResult,
} from '../ashtottari';
import {
  computeShodsottariDasha,
  isShodsottariEligible,
  type ShodsottariResult,
} from '../shodsottari';
import {
  computeDwadashottariDasha,
  getDwadashottariStartNakshatra,
  isDwadashottariEligible,
  type DwadashottariResult,
} from '../dwadashottari';

interface Props {
  jd: number;
  moonLongitude: number;
  selectedChart: DivisionalChart;
  ascSign: number;
  rahuSign: number;
  sunLongitude: number;
  geoLatitude: number;
  geoLongitude: number;
  d2AscSign: number;
  d9AscSign: number;
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
type DashaSystem = 'Vimshottari' | 'Ashtottari' | 'Shodsottari' | 'Dwadashottari';

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
  const shodsottari = createMemo<ShodsottariResult>(() =>
    computeShodsottariDasha(props.jd, props.moonLongitude),
  );
  const dwadashottari = createMemo<DwadashottariResult>(() =>
    computeDwadashottariDasha(props.jd, props.moonLongitude),
  );
  const rahuHouse = createMemo(() => getRahuHouseFromAsc(props.ascSign, props.rahuSign));
  const paksha = createMemo(() => getPakshaFromLongitudes(props.sunLongitude, props.moonLongitude));
  const dayBirth = createMemo(() => isDayBirth(props.jd, props.geoLatitude, props.geoLongitude));
  const houseEligible = createMemo(() => isAshtottariEligibleByHouse(rahuHouse()));
  const pakshaTimeEligible = createMemo(() =>
    isAshtottariEligibleByPakshaAndTime(
      props.jd,
      props.geoLatitude,
      props.geoLongitude,
      props.sunLongitude,
      props.moonLongitude,
    ),
  );
  const ashtottariEligible = createMemo(() => houseEligible() && pakshaTimeEligible());
  const shodsottariEligible = createMemo(() => isShodsottariEligible(props.d2AscSign, paksha()));
  const dwadashottariEligible = createMemo(() => isDwadashottariEligible(props.d9AscSign));
  const janmaNakshatra = createMemo(() => getDwadashottariStartNakshatra(props.moonLongitude));
  const toggleMahadasha = (key: string) => {
    setExpandedMahadasha((current) => (current === key ? null : key));
  };

  return (
    <div class="dasha-tab">
      <div class="analysis-section">
        <h3 class="analysis-subtitle">{`Dasha System (${props.selectedChart})`}</h3>
        <Show when={system() === 'Ashtottari'}>
          <p class="analysis-empty">
            {ashtottariEligible()
              ? `Ashtottari condition: Met (Rahu house ${rahuHouse()} from Lagna; ${dayBirth() ? 'day' : 'night'} birth in ${paksha()} paksha).`
              : `Ashtottari condition: Not met (${!houseEligible() ? `Rahu in blocked house ${rahuHouse()} (1, 4, 5, 7, 9, 10)` : `requires day+Krishna or night+Shukla; got ${dayBirth() ? 'day' : 'night'}+${paksha()}`}).`}
          </p>
        </Show>
        <Show when={system() === 'Shodsottari'}>
          <p class="analysis-empty">
            {shodsottariEligible()
              ? `Shodsottari condition: Met (D2 Asc sign ${props.d2AscSign} with ${paksha()} Paksha).`
              : `Shodsottari condition: Not met (requires D2 Asc in Cancer with Krishna Paksha, or D2 Asc in Leo with Shukla Paksha; got D2 sign ${props.d2AscSign} with ${paksha()} Paksha).`}
          </p>
        </Show>
        <Show when={system() === 'Dwadashottari'}>
          <p class="analysis-empty">
            {dwadashottariEligible()
              ? `Dwadashottari condition: Met (D9 Asc in ${SIGN_NAMES[props.d9AscSign - 1]}). Janma Nakshatra ${janmaNakshatra()} counts to Revati for the opening dasha.`
              : `Dwadashottari condition: Not met (requires D9 Asc in Taurus or Libra; got ${SIGN_NAMES[props.d9AscSign - 1]}). Showing the computed sequence below for reference.`}
          </p>
        </Show>
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
          <button
            type="button"
            class={`toggle-btn ${system() === 'Shodsottari' ? 'active' : ''}`}
            onClick={() => setSystem('Shodsottari')}
          >
            Shodsottari
          </button>
          <button
            type="button"
            class={`toggle-btn ${system() === 'Dwadashottari' ? 'active' : ''}`}
            onClick={() => setSystem('Dwadashottari')}
          >
            Dwadashottari
          </button>
        </div>
        <Show
          when={system() === 'Vimshottari'}
          fallback={
            <Show
              when={system() === 'Ashtottari'}
              fallback={
                <Show
                  when={system() === 'Shodsottari'}
                  fallback={
                    <p class="analysis-empty">
                      {`Birth Mahadasha (Dwadashottari): ${dwadashottari().startPlanet} (Balance ${dwadashottari().balance.years}y ${dwadashottari().balance.months}m ${dwadashottari().balance.days}d)`}
                    </p>
                  }
                >
                  <p class="analysis-empty">
                    {`Birth Mahadasha (Shodsottari): ${shodsottari().startPlanet} (Balance ${shodsottari().balance.years}y ${shodsottari().balance.months}m ${shodsottari().balance.days}d)`}
                  </p>
                </Show>
              }
            >
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
                      <span
                        class={`dasha-chevron ${expandedMahadasha() === `${mahadasha.lord}-${index()}` ? 'expanded' : ''}`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
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
                  <button
                    type="button"
                    class="dasha-toggle"
                    onClick={() => toggleMahadasha(`ashtottari-${mahadasha.planet}-${index()}`)}
                    aria-expanded={expandedMahadasha() === `ashtottari-${mahadasha.planet}-${index()}`}
                  >
                    <div class="yoga-header">
                      <span class="badge badge-karaka">{`${mahadasha.planet} Mahadasha`}</span>
                      <span class="yoga-houses">{`${dateFmt.format(mahadasha.startDate)} \u2192 ${dateFmt.format(mahadasha.endDate)} UTC`}</span>
                      <span class="yoga-planets">{index() === 0 ? 'Birth balance' : 'Full mahadasha'}</span>
                      <span
                        class={`dasha-chevron ${expandedMahadasha() === `ashtottari-${mahadasha.planet}-${index()}` ? 'expanded' : ''}`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </div>
                  </button>
                  <Show when={expandedMahadasha() === `ashtottari-${mahadasha.planet}-${index()}`}>
                    <div class="dasha-antardashas">
                      <For each={mahadasha.antardashas}>
                        {(antardasha) => (
                          <div class="arudha-card">
                            <div class="arudha-label">{antardasha.planet}</div>
                            <div class="arudha-value dasha-date-range">
                              {`${dateFmt.format(antardasha.startDate)} \u2192 ${dateFmt.format(antardasha.endDate)} UTC`}
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
        <Show when={system() === 'Shodsottari'}>
          <div class="yoga-list">
            <For each={shodsottari().timeline}>
              {(mahadasha, index) => (
                <div class="yoga-card">
                  <button
                    type="button"
                    class="dasha-toggle"
                    onClick={() => toggleMahadasha(`shodsottari-${mahadasha.planet}-${index()}`)}
                    aria-expanded={expandedMahadasha() === `shodsottari-${mahadasha.planet}-${index()}`}
                  >
                    <div class="yoga-header">
                      <span class="badge badge-karaka">{`${mahadasha.planet} Mahadasha`}</span>
                      <span class="yoga-houses">{`${dateFmt.format(mahadasha.startDate)} \u2192 ${dateFmt.format(mahadasha.endDate)} UTC`}</span>
                      <span class="yoga-planets">{index() === 0 ? 'Birth balance' : 'Full mahadasha'}</span>
                      <span
                        class={`dasha-chevron ${expandedMahadasha() === `shodsottari-${mahadasha.planet}-${index()}` ? 'expanded' : ''}`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </div>
                  </button>
                  <Show when={expandedMahadasha() === `shodsottari-${mahadasha.planet}-${index()}`}>
                    <div class="dasha-antardashas">
                      <For each={mahadasha.antardashas}>
                        {(antardasha) => (
                          <div class="arudha-card">
                            <div class="arudha-label">{antardasha.planet}</div>
                            <div class="arudha-value dasha-date-range">
                              {`${dateFmt.format(antardasha.startDate)} \u2192 ${dateFmt.format(antardasha.endDate)} UTC`}
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
        <Show when={system() === 'Dwadashottari'}>
          <div class="yoga-list">
            <For each={dwadashottari().timeline}>
              {(mahadasha, index) => (
                <div class="yoga-card">
                  <button
                    type="button"
                    class="dasha-toggle"
                    onClick={() => toggleMahadasha(`dwadashottari-${mahadasha.planet}-${index()}`)}
                    aria-expanded={expandedMahadasha() === `dwadashottari-${mahadasha.planet}-${index()}`}
                  >
                    <div class="yoga-header">
                      <span class="badge badge-karaka">{`${mahadasha.planet} Mahadasha`}</span>
                      <span class="yoga-houses">{`${dateFmt.format(mahadasha.startDate)} \u2192 ${dateFmt.format(mahadasha.endDate)} UTC`}</span>
                      <span class="yoga-planets">{index() === 0 ? 'Birth balance' : 'Full mahadasha'}</span>
                      <span
                        class={`dasha-chevron ${expandedMahadasha() === `dwadashottari-${mahadasha.planet}-${index()}` ? 'expanded' : ''}`}
                        aria-hidden="true"
                      >
                        â–¾
                      </span>
                    </div>
                  </button>
                  <Show when={expandedMahadasha() === `dwadashottari-${mahadasha.planet}-${index()}`}>
                    <div class="dasha-antardashas">
                      <For each={mahadasha.antardashas}>
                        {(antardasha) => (
                          <div class="arudha-card">
                            <div class="arudha-label">{antardasha.planet}</div>
                            <div class="arudha-value dasha-date-range">
                              {`${dateFmt.format(antardasha.startDate)} \u2192 ${dateFmt.format(antardasha.endDate)} UTC`}
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
      </div>
    </div>
  );
}
