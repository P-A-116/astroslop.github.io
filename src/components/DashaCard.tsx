import { For, Show, createMemo, createSignal } from 'solid-js';
import type { ChartData, DashaTimeline, DivisionalChart, PlanetName } from '../types';
import { SIGN_LORDS, SIGN_NAMES } from '../constants';
import {
  generateDashaTimelineFromMoonLongitude,
  getMahadashaBalance,
  houseToSign,
  signToHouse,
} from '../astrology';
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
  computeChaturasitiDasha,
  computeDwadashottariDasha,
  computeDwisaptatiDasha,
  computePanchottariDasha,
  computeShastihayaniDasha,
  computeShatTrimshatDasha,
  computeShatabdikaDasha,
  computeShodsottariDasha,
  getVariantJanmaNakshatra,
  isChaturasitiEligible,
  isDwadashottariEligible,
  isDwisaptatiEligible,
  isPanchottariEligible,
  isShastihayaniEligible,
  isShatTrimshatEligible,
  isShatabdikaEligible,
  isShodsottariEligible,
  type ChaturasitiResult,
  type DwadashottariResult,
  type DwisaptatiResult,
  type PanchottariResult,
  type ShastihayaniResult,
  type ShatTrimshatResult,
  type ShatabdikaResult,
  type ShodsottariResult,
} from '../dashaVariants';

interface Props {
  data: ChartData;
  moonLongitude: number;
  selectedChart: DivisionalChart;
  ascSign: number;
  signs: Record<PlanetName, number>;
  sunLongitude: number;
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

const DASHA_SYSTEMS = [
  { key: 'Vimshottari', label: 'Vimshottari' },
  { key: 'Ashtottari', label: 'Ashtottari' },
  { key: 'Shodsottari', label: 'Shodsottari' },
  { key: 'Dwadashottari', label: 'Dwadashottari' },
  { key: 'Panchottari', label: 'Panchottari' },
  { key: 'Shatabdika', label: 'Shatabdika' },
  { key: 'Chaturasiti', label: 'Chaturasiti' },
  { key: 'Dwisaptati', label: 'Dwisaptati' },
  { key: 'Shastihayani', label: 'Shastihayani' },
  { key: 'ShatTrimshat', label: 'Shat-trimshat' },
] as const;

type DashaSystem = (typeof DASHA_SYSTEMS)[number]['key'];

interface NormalisedAntardasha {
  planet: string;
  start: Date;
  end: Date;
}

interface NormalisedMahadasha {
  key: string;
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

type VariantTimelineLike = {
  planet: string;
  startDate: Date;
  endDate: Date;
  antardashas: {
    planet: string;
    startDate: Date;
    endDate: Date;
  }[];
}[];

function normaliseVariantTimeline(prefix: string, timeline: VariantTimelineLike): NormalisedMahadasha[] {
  return timeline.map((mahadasha, index) => ({
    key: `${prefix}-${mahadasha.planet}-${index}`,
    planet: mahadasha.planet,
    start: mahadasha.startDate,
    end: mahadasha.endDate,
    yearLabel: index === 0 ? 'Birth balance' : 'Full mahadasha',
    antardashas: mahadasha.antardashas.map((antardasha) => ({
      planet: antardasha.planet,
      start: antardasha.startDate,
      end: antardasha.endDate,
    })),
  }));
}

function formatDuration(balance: { years: number; months: number; days: number }) {
  return `${balance.years}y ${balance.months}m ${balance.days}d`;
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
                  &#9662;
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

  const selectSystem = (next: DashaSystem) => {
    setSystem(next);
    setExpandedMahadasha(null);
  };

  const timeline = createMemo<DashaTimeline>(() =>
    generateDashaTimelineFromMoonLongitude(props.data.jd, props.moonLongitude),
  );
  const birthBalance = createMemo(() => getMahadashaBalance(props.moonLongitude));
  const ashtottari = createMemo<AshtottariResult>(() =>
    computeAshtottariDasha(props.data.jd, props.moonLongitude),
  );
  const shodsottari = createMemo<ShodsottariResult>(() =>
    computeShodsottariDasha(props.data.jd, props.moonLongitude),
  );
  const dwadashottari = createMemo<DwadashottariResult>(() =>
    computeDwadashottariDasha(props.data.jd, props.moonLongitude),
  );
  const panchottari = createMemo<PanchottariResult>(() =>
    computePanchottariDasha(props.data.jd, props.moonLongitude),
  );
  const shatabdika = createMemo<ShatabdikaResult>(() =>
    computeShatabdikaDasha(props.data.jd, props.moonLongitude),
  );
  const chaturasiti = createMemo<ChaturasitiResult>(() =>
    computeChaturasitiDasha(props.data.jd, props.moonLongitude),
  );
  const dwisaptati = createMemo<DwisaptatiResult>(() =>
    computeDwisaptatiDasha(props.data.jd, props.moonLongitude),
  );
  const shastihayani = createMemo<ShastihayaniResult>(() =>
    computeShastihayaniDasha(props.data.jd, props.moonLongitude),
  );
  const shatTrimshat = createMemo<ShatTrimshatResult>(() =>
    computeShatTrimshatDasha(props.data.jd, props.moonLongitude),
  );

  const rahuHouse = createMemo(() => getRahuHouseFromAsc(props.ascSign, props.signs.Rahu));
  const paksha = createMemo(() => getPakshaFromLongitudes(props.sunLongitude, props.moonLongitude));
  const dayBirth = createMemo(() => isDayBirth(props.data.jd, props.data.lat, props.data.lon));
  const houseEligible = createMemo(() => isAshtottariEligibleByHouse(rahuHouse()));
  const pakshaTimeEligible = createMemo(() =>
    isAshtottariEligibleByPakshaAndTime(
      props.data.jd,
      props.data.lat,
      props.data.lon,
      props.sunLongitude,
      props.moonLongitude,
    ),
  );
  const ashtottariEligible = createMemo(() => houseEligible() && pakshaTimeEligible());
  const shodsottariEligible = createMemo(() =>
    isShodsottariEligible(props.data.ascDivisional.D2, paksha()),
  );
  const dwadashottariEligible = createMemo(() =>
    isDwadashottariEligible(props.data.ascDivisional.D9),
  );
  const panchottariEligible = createMemo(() =>
    isPanchottariEligible(props.data.ascSign, props.data.ascDivisional.D12),
  );
  const shatabdikaEligible = createMemo(() =>
    isShatabdikaEligible(props.data.ascSign, props.data.ascDivisional.D9),
  );

  const janmaNakshatra = createMemo(() => getVariantJanmaNakshatra(props.moonLongitude));
  const tenthSign = createMemo(() => houseToSign(10, props.ascSign));
  const tenthLord = createMemo<PlanetName>(() => SIGN_LORDS[tenthSign() - 1]);
  const tenthLordHouse = createMemo(() => signToHouse(props.signs[tenthLord()], props.ascSign));
  const chaturasitiEligible = createMemo(() => isChaturasitiEligible(tenthLordHouse()));
  const lagnaLord = createMemo<PlanetName>(() => SIGN_LORDS[props.ascSign - 1]);
  const lagnaLordHouse = createMemo(() => signToHouse(props.signs[lagnaLord()], props.ascSign));
  const dwisaptatiEligible = createMemo(() => isDwisaptatiEligible(lagnaLordHouse()));
  const sunHouse = createMemo(() => signToHouse(props.signs.Sun, props.ascSign));
  const shastihayaniEligible = createMemo(() => isShastihayaniEligible(sunHouse()));
  const shatTrimshatEligible = createMemo(() =>
    isShatTrimshatEligible(props.data.ascDivisional.D2, dayBirth()),
  );

  const activeMahadashas = createMemo((): NormalisedMahadasha[] => {
    switch (system()) {
      case 'Vimshottari':
        return timeline().map((mahadasha, index) => ({
          key: `vimshottari-${mahadasha.lord}-${index}`,
          planet: mahadasha.lord,
          start: mahadasha.start,
          end: mahadasha.end,
          yearLabel: `Years: ${roundYear(index === 0 ? mahadasha.balanceYearsAtBirth : mahadasha.totalYears)}`,
          antardashas: mahadasha.antardashas.map((antardasha) => ({
            planet: antardasha.lord,
            start: antardasha.start,
            end: antardasha.end,
          })),
        }));
      case 'Ashtottari':
        if (!ashtottariEligible()) return [];
        return normaliseVariantTimeline('ashtottari', ashtottari().timeline);
      case 'Shodsottari':
        return normaliseVariantTimeline('shodsottari', shodsottari().timeline);
      case 'Dwadashottari':
        return normaliseVariantTimeline('dwadashottari', dwadashottari().timeline);
      case 'Panchottari':
        return normaliseVariantTimeline('panchottari', panchottari().timeline);
      case 'Shatabdika':
        return normaliseVariantTimeline('shatabdika', shatabdika().timeline);
      case 'Chaturasiti':
        return normaliseVariantTimeline('chaturasiti', chaturasiti().timeline);
      case 'Dwisaptati':
        return normaliseVariantTimeline('dwisaptati', dwisaptati().timeline);
      case 'Shastihayani':
        return normaliseVariantTimeline('shastihayani', shastihayani().timeline);
      case 'ShatTrimshat':
        return normaliseVariantTimeline('shat-trimshat', shatTrimshat().timeline);
    }
  });

  const systemNotice = createMemo((): string | null => {
    switch (system()) {
      case 'Vimshottari':
        return null;
      case 'Ashtottari':
        return ashtottariEligible()
          ? `Ashtottari condition: Met (Rahu house ${rahuHouse()} from Lagna; ${dayBirth() ? 'day' : 'night'} birth in ${paksha()} paksha).`
          : `Ashtottari condition: Not met (${!houseEligible() ? `Rahu in blocked house ${rahuHouse()} (1, 4, 5, 7, 9, 10)` : `requires day+Krishna or night+Shukla; got ${dayBirth() ? 'day' : 'night'}+${paksha()}`}).`;
      case 'Shodsottari':
        return shodsottariEligible()
          ? `Shodsottari condition: Met (D2 Asc in ${SIGN_NAMES[props.data.ascDivisional.D2 - 1]} with ${paksha()} Paksha).`
          : `Shodsottari condition: Not met (requires D2 Asc in Cancer with Krishna Paksha, or D2 Asc in Leo with Shukla Paksha; got ${SIGN_NAMES[props.data.ascDivisional.D2 - 1]} with ${paksha()} Paksha). Showing the computed sequence below for reference.`;
      case 'Dwadashottari':
        return dwadashottariEligible()
          ? `Dwadashottari condition: Met (D9 Asc in ${SIGN_NAMES[props.data.ascDivisional.D9 - 1]}). Janma Nakshatra ${janmaNakshatra()} counts to Revati for the opening dasha.`
          : `Dwadashottari condition: Not met (requires D9 Asc in Taurus or Libra; got ${SIGN_NAMES[props.data.ascDivisional.D9 - 1]}). Showing the computed sequence below for reference.`;
      case 'Panchottari':
        return panchottariEligible()
          ? `Panchottari condition: Met (D1 Asc ${SIGN_NAMES[props.data.ascSign - 1]} and D12 Asc ${SIGN_NAMES[props.data.ascDivisional.D12 - 1]}). Janma Nakshatra ${janmaNakshatra()} counts from Anuradha by 7 for the opening dasha.`
          : `Panchottari condition: Not met (requires Cancer Ascendant with Cancer D12; got D1 ${SIGN_NAMES[props.data.ascSign - 1]} and D12 ${SIGN_NAMES[props.data.ascDivisional.D12 - 1]}). Showing the computed sequence below for reference.`;
      case 'Shatabdika':
        return shatabdikaEligible()
          ? `Shatabdika condition: Met (Vargottama Lagna: D1 and D9 are both ${SIGN_NAMES[props.data.ascSign - 1]}). Janma Nakshatra ${janmaNakshatra()} counts from Revati by 7 for the opening dasha.`
          : `Shatabdika condition: Not met (requires D1 Lagna = D9 Lagna; got D1 ${SIGN_NAMES[props.data.ascSign - 1]} and D9 ${SIGN_NAMES[props.data.ascDivisional.D9 - 1]}). Showing the computed sequence below for reference.`;
      case 'Chaturasiti':
        return chaturasitiEligible()
          ? `Chaturasiti Sama condition: Met (${tenthLord()} rules the 10th house and is placed in house 10 in ${props.selectedChart}). Janma Nakshatra ${janmaNakshatra()} counts from Swati by 7 for the opening dasha.`
          : `Chaturasiti Sama condition: Not met (${tenthLord()}, lord of the 10th house, is in house ${tenthLordHouse()} in ${props.selectedChart}; it must be in house 10). Showing the computed sequence below for reference.`;
      case 'Dwisaptati':
        return dwisaptatiEligible()
          ? `Dwisaptati Sama condition: Met (${lagnaLord()}, lord of Lagna, is in house ${lagnaLordHouse()} in ${props.selectedChart}). Janma Nakshatra ${janmaNakshatra()} counts from Mula by 8 for the opening dasha.`
          : `Dwisaptati Sama condition: Not met (${lagnaLord()}, lord of Lagna, is in house ${lagnaLordHouse()} in ${props.selectedChart}; it must be in house 1 or 7). Showing the computed sequence below for reference.`;
      case 'Shastihayani':
        return shastihayaniEligible()
          ? `Shastihayani condition: Met (Sun is in house 1 in ${props.selectedChart}). Janma Nakshatra ${janmaNakshatra()} counts from Ardra by 8 for the opening dasha. The supplied year pattern sums to 69 years (13,13,13,6,6,6,6,6), and the timeline follows that configured total.`
          : `Shastihayani condition: Not met (Sun is in house ${sunHouse()} in ${props.selectedChart}; it must be in house 1)..`;
      case 'ShatTrimshat':
        return shatTrimshatEligible()
          ? `Shat-trimshat Sama condition: Met (${dayBirth() ? 'day' : 'night'} birth with D2 Asc in ${SIGN_NAMES[props.data.ascDivisional.D2 - 1]}). Janma Nakshatra ${janmaNakshatra()} counts from Shravana by 8 for the opening dasha.`
          : `Shat-trimshat Sama condition: Not met (requires day birth with Leo D2, or night birth with Cancer D2; got ${dayBirth() ? 'day' : 'night'} birth with D2 ${SIGN_NAMES[props.data.ascDivisional.D2 - 1]}). Showing the computed sequence below for reference.`;
    }
  });

  const birthBalanceSummary = createMemo((): string => {
    switch (system()) {
      case 'Vimshottari': {
        const balance = birthBalance();
        return `Birth Mahadasha: ${balance.lord} (${roundYear(balance.balance)} / ${balance.totalYears} years remaining)`;
      }
      case 'Ashtottari':
        return ashtottariEligible()
          ? `Birth Mahadasha: ${ashtottari().startPlanet} (Balance ${formatDuration(ashtottari().balance)})`
          : !houseEligible()
            ? `Ashtottari not applicable: Rahu is in house ${rahuHouse()} from Lagna (houses 1, 4, 5, 7, 9, 10 are ineligible).`
            : `Ashtottari not applicable: requires day birth in Krishna paksha or night birth in Shukla paksha; got ${dayBirth() ? 'day' : 'night'} birth in ${paksha()} paksha.`;
      case 'Shodsottari':
        return `Birth Mahadasha (Shodsottari): ${shodsottari().startPlanet} (Balance ${formatDuration(shodsottari().balance)})`;
      case 'Dwadashottari':
        return `Birth Mahadasha (Dwadashottari): ${dwadashottari().startPlanet} (Balance ${formatDuration(dwadashottari().balance)})`;
      case 'Panchottari':
        return `Birth Mahadasha (Panchottari): ${panchottari().startPlanet} (Balance ${formatDuration(panchottari().balance)})`;
      case 'Shatabdika':
        return `Birth Mahadasha (Shatabdika): ${shatabdika().startPlanet} (Balance ${formatDuration(shatabdika().balance)})`;
      case 'Chaturasiti':
        return `Birth Mahadasha (Chaturasiti Sama): ${chaturasiti().startPlanet} (Balance ${formatDuration(chaturasiti().balance)})`;
      case 'Dwisaptati':
        return `Birth Mahadasha (Dwisaptati Sama): ${dwisaptati().startPlanet} (Balance ${formatDuration(dwisaptati().balance)})`;
      case 'Shastihayani':
        return `Birth Mahadasha (Shastihayani): ${shastihayani().startPlanet} (Balance ${formatDuration(shastihayani().balance)})`;
      case 'ShatTrimshat':
        return `Birth Mahadasha (Shat-trimshat Sama): ${shatTrimshat().startPlanet} (Balance ${formatDuration(shatTrimshat().balance)})`;
    }
  });

  const toggleMahadasha = (key: string) => {
    setExpandedMahadasha((current) => (current === key ? null : key));
  };

  return (
    <div class="dasha-tab">
      <div class="analysis-section">
        <h3 class="analysis-subtitle">{`Dasha System (${props.selectedChart})`}</h3>
        <Show when={systemNotice()}>
          {(notice) => <p class="analysis-empty">{notice()}</p>}
        </Show>
        <div class="mode-toggle-dasha">
          <button
            type="button"
            class={`toggle-btn toggle-btn-vimshottari ${system() === 'Vimshottari' ? 'active' : ''}`}
            onClick={() => selectSystem('Vimshottari')}
          >
            Vimshottari
          </button>
          <div class="mode-toggle-dasha-grid">
            <For each={DASHA_SYSTEMS.filter(e => e.key !== 'Vimshottari')}>
              {(entry) => (
                <button
                  type="button"
                  class={`toggle-btn ${system() === entry.key ? 'active' : ''}`}
                  onClick={() => selectSystem(entry.key)}
                >
                  {entry.label}
                </button>
              )}
            </For>
          </div>
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
