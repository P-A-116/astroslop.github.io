import { For, Show } from 'solid-js';
import type { ChartData, DivisionalChart } from '../types';
import { PLANET_ICONS, SIGN_NAMES } from '../constants';
import { formatDms, getArudhaPadas, getGrahaArudhas } from '../astrology';
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
}

export default function AnalysisTab(props: Props) {
  const yogas = () => findParivartanaYogas(props.data, props.selectedChart);
  const arudhas = () => getArudhaPadas(props.data, props.selectedChart);
  const grahaArudhas = () => getGrahaArudhas(props.data, props.selectedChart);
  const formatSignedDms = (longitude: number) => {
    const normalized = ((longitude % 360) + 360) % 360;
    const sign = SIGN_NAMES[Math.floor(normalized / 30)];
    return `${sign} ${formatDms(normalized % 30)}`;
  };
  const upagrahaItems = () => ([
    ['Dhooma', props.data.upagrahas.dhooma],
    ['Vyatipata', props.data.upagrahas.vyatipata],
    ['Parivesha', props.data.upagrahas.parivesha],
    ['Chapa (Indra Dhanus)', props.data.upagrahas.chapa],
    ['Upaketu (Sikhi)', props.data.upagrahas.upaketu],
  ] as const);

  return (
    <div class="analysis-tab">
      <div class="analysis-section">
        <h3 class="analysis-subtitle">Solar Upagrahas</h3>
        <div class="arudha-grid">
          <For each={upagrahaItems()}>
            {([name, longitude]) => (
              <div class="arudha-card">
                <div class="arudha-label">{name}</div>
                <div class="arudha-value">{formatSignedDms(longitude)}</div>
              </div>
            )}
          </For>
        </div>
      </div>

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
