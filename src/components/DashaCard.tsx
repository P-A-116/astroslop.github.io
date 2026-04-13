import { For, createMemo } from 'solid-js';
import type { DashaTimeline, DivisionalChart } from '../types';
import { generateDashaTimelineFromMoonLongitude, getMahadashaBalance } from '../astrology';

interface Props {
  jd: number;
  moonLongitude: number;
  selectedChart: DivisionalChart;
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

export default function DashaCard(props: Props) {
  const timeline = createMemo<DashaTimeline>(() =>
    generateDashaTimelineFromMoonLongitude(props.jd, props.moonLongitude),
  );
  const birthBalance = createMemo(() => getMahadashaBalance(props.moonLongitude));

  return (
    <div class="dasha-tab">
      <div class="analysis-section">
        <h3 class="analysis-subtitle">{`Vimshottari (${props.selectedChart})`}</h3>
        <p class="analysis-empty">{`Birth Mahadasha: ${birthBalance().lord} (${roundYear(birthBalance().balance)} / ${birthBalance().totalYears} years remaining)`}</p>
      </div>

      <div class="analysis-section">
        <h3 class="analysis-subtitle">Mahadashas</h3>
        <div class="yoga-list">
          <For each={timeline()}>
            {(mahadasha, index) => (
              <div class="yoga-card">
                <div class="yoga-header">
                  <span class="badge badge-karaka">{`${mahadasha.lord} Mahadasha`}</span>
                  <span class="yoga-houses">{`${dateFmt.format(mahadasha.start)} \u2192 ${dateFmt.format(mahadasha.end)} UTC`}</span>
                  <span class="yoga-planets">{`Years: ${roundYear(index() === 0 ? mahadasha.balanceYearsAtBirth : mahadasha.totalYears)}`}</span>
                </div>
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
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
