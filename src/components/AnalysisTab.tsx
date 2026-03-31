import { For, Show } from 'solid-js';
import type { ChartData } from '../types';
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
}

export default function AnalysisTab(props: Props) {
  const yogas = () => findParivartanaYogas(props.data);

  return (
    <div class="analysis-tab">
      <Show
        when={yogas().length > 0}
        fallback={
          <p class="analysis-empty">No Parivartana Yogas found in this chart.</p>
        }
      >
        <div class="yoga-list">
          <For each={yogas()}>
            {(yoga) => (
              <div class="yoga-card">
                <div class="yoga-header">
                  <span class={`badge yoga-badge yoga-badge-${yoga.type.toLowerCase()}`}>
                    {yoga.type} Yoga
                  </span>
                  <span class="yoga-houses">
                    Houses {yoga.houseA} ↔ {yoga.houseB}
                  </span>
                  <span class="yoga-planets">
                    {yoga.planetA} ↔ {yoga.planetB}
                  </span>
                </div>
                <p class="yoga-interpretation">
                  {YOGA_INTERPRETATIONS[yoga.type]}
                </p>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
