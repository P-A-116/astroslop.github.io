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
  computeDwadashottariDasha,
  getDwadashottariStartNakshatra,
  isDwadashottariEligible,
  isShodsottariEligible,
  type DwadashottariResult,
  type ShodsottariResult,
} from '../dashaVariants';

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

// ── Normalised shape shared by all four dasha systems ────────────────────────
// Each system stores dates in different field names (.start/.end vs
// .startDate/.endDate) and lords in different field names (.lord vs .planet).
// Normalising to this single shape lets DashaMahadashaList render all four
// systems without any per-system branching.

interface NormalisedAntardasha {
  planet: string;
  start: Date;
  end: Date;
}
interface NormalisedMahadasha {
  key: string;           // unique key for the expand/collapse toggle
  planet: string;
  start: Date;
  end: Date;
  yearLabel: string;
  antardashas: NormalisedAntardasha[];
}

interface DashaMahadashaListProps {
  entries: NormalisedMahadasha[];
  expandedKey: string | null;
  onToggle: (key: string) => void;
}

function DashaMahadashaList(props: DashaMahadashaListProps) {
  return (
    <div class="yoga-list">
      <For each={props.entries}>
        {(mahadasha) => (
          <div class="yoga-card">
            <button
              type="button"
              class="dasha-toggle"
              onClick={() => props.onToggle(mahadasha.key)}
              aria-expanded={props.expandedKey === mahadasha.key}
            >
              <div class="yoga-header">
                <span class="badge badge-karaka">{`${mahadasha.planet} Mahadasha`}</span>
                <span class="yoga-houses">{`${dateFmt.format(mahadasha.start)} \u2192 ${dateFmt.format(mahadasha.end)} UTC`}</span>
                <span class="yoga-planets">{mahadasha.yearLabel}</span>
                <span
                  class={`dasha-chevron ${props.expandedKey === mahadasha.key ? 'expanded' : ''}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </div>
            </button>
            <Show when={props.expandedKey === mahadasha.key}>
              <div class="dasha-antardashas">
                <For each={mahadasha.antardashas}>
                  {(antardasha) => (
                    <div class="arudha-card">
                      <div class="arudha-label">{antardasha.planet}</div>
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
  );
}

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

  // Normalise whichever system is active into a single NormalisedMahadasha[].
  const activeMahadashas = createMemo((): NormalisedMahadasha[] => {
    switch (system()) {
      case 'Vimshottari':
        return timeline().map((m, i) => ({
          key: `vimshottari-${m.lord}-${i}`,
          planet: m.lord,
          start: m.start,
          end: m.end,
          yearLabel: `Years: ${roundYear(i === 0 ? m.balanceYearsAtBirth : m.totalYears)}`,
          antardashas: m.antardashas.map((a) => ({ planet: a.lord, start: a.start, end: a.end })),
        }));
      case 'Ashtottari':
        if (!ashtottariEligible()) return [];
        return ashtottari().timeline.map((m, i) => ({
          key: `ashtottari-${m.planet}-${i}`,
          planet: m.planet,
          start: m.startDate,
          end: m.endDate,
          yearLabel: i === 0 ? 'Birth balance' : 'Full mahadasha',
          antardashas: m.antardashas.map((a) => ({ planet: a.planet, start: a.startDate, end: a.endDate })),
        }));
      case 'Shodsottari':
        return shodsottari().timeline.map((m, i) => ({
          key: `shodsottari-${m.planet}-${i}`,
          planet: m.planet,
          start: m.startDate,
          end: m.endDate,
          yearLabel: i === 0 ? 'Birth balance' : 'Full mahadasha',
          antardashas: m.antardashas.map((a) => ({ planet: a.planet, start: a.startDate, end: a.endDate })),
        }));
      case 'Dwadashottari':
        return dwadashottari().timeline.map((m, i) => ({
          key: `dwadashottari-${m.planet}-${i}`,
          planet: m.planet,
          start: m.startDate,
          end: m.endDate,
          yearLabel: i === 0 ? 'Birth balance' : 'Full mahadasha',
          antardashas: m.antardashas.map((a) => ({ planet: a.planet, start: a.startDate, end: a.endDate })),
        }));
    }
  });

  // Flat summary string for the birth-balance line — avoids a 3-deep nested Show.
  const birthBalanceSummary = createMemo((): string => {
    const fmt = (b: { years: number; months: number; days: number }) =>
      `${b.years}y ${b.months}m ${b.days}d`;
    switch (system()) {
      case 'Vimshottari': {
        const b = birthBalance();
        return `Birth Mahadasha: ${b.lord} (${roundYear(b.balance)} / ${b.totalYears} years remaining)`;
      }
      case 'Ashtottari':
        return ashtottariEligible()
          ? `Birth Mahadasha: ${ashtottari().startPlanet} (Balance ${fmt(ashtottari().balance)})`
          : `Ashtottari not applicable: Rahu is in house ${rahuHouse()} from Lagna (1/4/5/7/9/10 are ineligible).`;
      case 'Shodsottari':
        return `Birth Mahadasha (Shodsottari): ${shodsottari().startPlanet} (Balance ${fmt(shodsottari().balance)})`;
      case 'Dwadashottari':
        return `Birth Mahadasha (Dwadashottari): ${dwadashottari().startPlanet} (Balance ${fmt(dwadashottari().balance)})`;
    }
  });

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
        <p class="analysis-empty">{birthBalanceSummary()}</p>
      </div>

      <div class="analysis-section">
        <h3 class="analysis-subtitle">Mahadashas</h3>
        <DashaMahadashaList
          entries={activeMahadashas()}
          expandedKey={expandedMahadasha()}
          onToggle={toggleMahadasha}
        />
      </div>
    </div>
  );
}
