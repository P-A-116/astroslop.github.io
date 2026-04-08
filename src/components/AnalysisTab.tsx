import { For, Show } from 'solid-js';
import type { ChartData, DivisionalChart, GulikaDebugResult, UpagrahaFormValues } from '../types';
import { PLANET_ICONS, SIGN_NAMES } from '../constants';
import { getArudhaPadas, getGrahaArudhas } from '../astrology';
import { findParivartanaYogas } from '../analysis';

const YOGA_INTERPRETATIONS = {
  Dainya:
    'The man born in Dainya Yoga will be a fool, will be reviling others and commit sinful actions. He will always be tormented by his enemies, will be unsteady in mind. Interruptions will arise to all his undertakings.',
  Khala:
    'The man born in Khala Yoga will at one time go astray, while at another time gentle in speech. Sometimes he will regain all kinds of prosperity, while at other times he will have to endure much distress, poverty, misery and the like.',
  Maha:
    'The person born in Maha Yoga will be repository of the blessings of the Deva Sri and will be a lord and wealthy. He will wear cloths of variegated colour and bedeck himself with gold ornaments. He will receive rich presents from his sovereign and certain powers (authority) also will be conferred on him. He will command vehicles, wealth and children.',
};

interface Props {
  data: ChartData;
  selectedChart: DivisionalChart;
  gulikaDebug: GulikaDebugResult | null;
  upagrahaValues: UpagrahaFormValues | null;
}

function formatUtcDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')} `
    + `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')} UTC`;
}

export default function AnalysisTab(props: Props) {
  const yogas = () => findParivartanaYogas(props.data, props.selectedChart);
  const arudhas = () => getArudhaPadas(props.data, props.selectedChart);
  const grahaArudhas = () => getGrahaArudhas(props.data, props.selectedChart);

  return (
    <div class="analysis-tab">
      <div class="analysis-section">
        <h3 class="analysis-subtitle">Arudha Padas</h3>
        <div class="arudha-grid">
          <For each={arudhas()}>
            {(sign, index) => (
              <div class="arudha-card">
                <div class="arudha-label">{`A${index() + 1}`}</div>
                <div class="arudha-value">{SIGN_NAMES[sign - 1]}</div>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="analysis-section">
        <h3 class="analysis-subtitle">Graha Arudhas</h3>
        <div class="arudha-grid">
          <For each={Object.entries(grahaArudhas())}>
            {([planet, signs]) => (
              <div class="arudha-card">
                <div class="arudha-label">{`${PLANET_ICONS[planet as keyof typeof PLANET_ICONS] || ''} ${planet}`}</div>
                <div class="arudha-value">
                  {signs?.length
                    ? signs.map((sign) => SIGN_NAMES[sign - 1]).join(' / ')
                    : '\u2014'}
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="analysis-section">
        <h3 class="analysis-subtitle">Gulika / Mandi Diagnostics</h3>
        <Show
          when={props.gulikaDebug}
          fallback={(
            <p class="analysis-empty">
              Enter sunrise and sunset in the form to enable Gulika / Mandi diagnostics.
              The result depends on accurate local sunrise/sunset input for the event date.
            </p>
          )}
        >
          {(debug) => (
            <>
              <div class="diagnostic-grid">
                <div class="summary-item">
                  <div class="summary-label">Period</div>
                  <div class="summary-value">{debug().period}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Night Start Lord</div>
                  <div class="summary-value">{props.upagrahaValues?.gulikaConfig.startLordMode ?? 'weekday'}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Identity Mode</div>
                  <div class="summary-value">{props.upagrahaValues?.gulikaConfig.identityMode ?? 'start-vs-end'}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Gulika Sign</div>
                  <div class="summary-value">{SIGN_NAMES[debug().gulikaSign - 1]}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Mandi Sign</div>
                  <div class="summary-value">{SIGN_NAMES[debug().mandiSign - 1]}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Start Lord</div>
                  <div class="summary-value">{debug().startLord}</div>
                </div>
              </div>

              <div class="upagraha-trace">
                <p class="upagraha-trace-line">{`Interval: ${formatUtcDate(debug().dayStart)} → ${formatUtcDate(debug().dayEnd)}`}</p>
                <p class="upagraha-trace-line">{`Gulika: ${formatUtcDate(debug().gulikaTime)} · ${debug().gulikaLongitude.toFixed(4)}° · ${SIGN_NAMES[debug().gulikaSign - 1]}`}</p>
                <p class="upagraha-trace-line">{`Mandi: ${formatUtcDate(debug().mandiTime)} · ${debug().mandiLongitude.toFixed(4)}° · ${SIGN_NAMES[debug().mandiSign - 1]}`}</p>
              </div>

              <div class="table-scroll">
                <table class="astro-table">
                  <thead>
                    <tr>
                      <th>Segment</th>
                      <th>Lord</th>
                      <th>Start</th>
                      <th>End</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={debug().segments}>
                      {(segment) => (
                        <tr class={segment.lord === 'Saturn' ? 'upagraha-highlight-row' : ''}>
                          <td>{segment.idx + 1}</td>
                          <td>{segment.lord}</td>
                          <td>{formatUtcDate(segment.start)}</td>
                          <td>{formatUtcDate(segment.end)}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Show>
      </div>

      <div class="analysis-section">
        <h3 class="analysis-subtitle">Parivartana Yogas</h3>
        <Show
          when={yogas().length > 0}
          fallback={<p class="analysis-empty">No Parivartana Yogas found in this chart.</p>}
        >
          <div class="yoga-list">
            <For each={yogas()}>
              {(yoga) => (
                <div class="yoga-card">
                  <div class="yoga-header">
                    <span class={`badge yoga-badge yoga-badge-${yoga.type.toLowerCase()}`}>
                      {yoga.type} Yoga
                    </span>
                    <span class="yoga-houses">{`Houses ${yoga.houseA} \u2194 ${yoga.houseB}`}</span>
                    <span class="yoga-planets">{`${yoga.planetA} \u2194 ${yoga.planetB}`}</span>
                  </div>
                  <p class="yoga-interpretation">{YOGA_INTERPRETATIONS[yoga.type]}</p>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
