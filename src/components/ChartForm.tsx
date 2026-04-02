import { createSignal, Show, For } from 'solid-js';
import type { ChartData } from '../types';
import { buildChartData } from '../astrology';

interface Props {
  onGenerate: (data: ChartData, utcStr: string, lat: number, lon: number, cityName: string) => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const TZ_OPTIONS = [
  { value: '-12',   label: 'UTC-12' },
  { value: '-11',   label: 'UTC-11' },
  { value: '-10',   label: 'UTC-10' },
  { value: '-9.5',  label: 'UTC-9:30' },
  { value: '-9',    label: 'UTC-9' },
  { value: '-8',    label: 'UTC-8' },
  { value: '-7',    label: 'UTC-7' },
  { value: '-6',    label: 'UTC-6' },
  { value: '-5',    label: 'UTC-5' },
  { value: '-4.5',  label: 'UTC-4:30' },
  { value: '-4',    label: 'UTC-4' },
  { value: '-3.5',  label: 'UTC-3:30' },
  { value: '-3',    label: 'UTC-3' },
  { value: '-2',    label: 'UTC-2' },
  { value: '-1',    label: 'UTC-1' },
  { value: '0',     label: 'UTC+0' },
  { value: '1',     label: 'UTC+1' },
  { value: '2',     label: 'UTC+2' },
  { value: '3',     label: 'UTC+3' },
  { value: '3.5',   label: 'UTC+3:30' },
  { value: '4',     label: 'UTC+4' },
  { value: '4.5',   label: 'UTC+4:30' },
  { value: '5',     label: 'UTC+5' },
  { value: '5.5',   label: 'UTC+5:30' },
  { value: '5.75',  label: 'UTC+5:45' },
  { value: '6',     label: 'UTC+6' },
  { value: '6.5',   label: 'UTC+6:30' },
  { value: '7',     label: 'UTC+7' },
  { value: '8',     label: 'UTC+8' },
  { value: '8.75',  label: 'UTC+8:45' },
  { value: '9',     label: 'UTC+9' },
  { value: '9.5',   label: 'UTC+9:30' },
  { value: '10',    label: 'UTC+10' },
  { value: '10.5',  label: 'UTC+10:30' },
  { value: '11',    label: 'UTC+11' },
  { value: '12',    label: 'UTC+12' },
  { value: '12.75', label: 'UTC+12:45' },
  { value: '13',    label: 'UTC+13' },
  { value: '14',    label: 'UTC+14' },
];

function snapToTzOption(offset: number): string {
  let best = TZ_OPTIONS[0];
  let minDiff = Math.abs(parseFloat(TZ_OPTIONS[0].value) - offset);
  for (const opt of TZ_OPTIONS) {
    const diff = Math.abs(parseFloat(opt.value) - offset);
    if (diff < minDiff) { minDiff = diff; best = opt; }
  }
  return best.value;
}

export default function ChartForm(props: Props) {
  const [date, setDate] = createSignal('2002-10-06');
  const [time, setTime] = createSignal('20:10:00');
  const [tz, setTz] = createSignal('3');
  const [lat, setLat] = createSignal('40.3833');
  const [lon, setLon] = createSignal('23.4333');
  const [error, setError] = createSignal('');

  // City lookup state
  const [manualMode, setManualMode] = createSignal(false);
  const [city, setCity] = createSignal('');
  const [cityResults, setCityResults] = createSignal<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [selectedCity, setSelectedCity] = createSignal('');

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  async function lookupCity(query: string) {
    if (!query.trim()) { setCityResults([]); return; }
    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&email=astroslop%40example.com`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AstroSlop/1.0' } });
      if (!res.ok) throw new Error('Geocoding request failed');
      const results: NominatimResult[] = await res.json();
      setCityResults(results);
    } catch {
      setCityResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleCityInput(value: string) {
    setCity(value);
    setSelectedCity('');
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => lookupCity(value), 300);
  }

  function selectCityResult(result: NominatimResult) {
    const latNum = parseFloat(result.lat);
    const lonNum = parseFloat(result.lon);
    const tzOffset = Math.round(lonNum / 15);
    setLat(latNum.toFixed(4));
    setLon(lonNum.toFixed(4));
    setTz(snapToTzOption(tzOffset));
    setSelectedCity(result.display_name);
    setCity(result.display_name);
    setCityResults([]);
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    setError('');

    const dateVal = date();
    const timeVal = time();
    const tzVal   = parseFloat(tz());
    const latVal  = parseFloat(lat());
    const lonVal  = parseFloat(lon());

    if (!dateVal || !timeVal) {
      setError('Please enter a valid date and time.');
      return;
    }
    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      setError('Latitude must be between −90 and +90.');
      return;
    }
    if (isNaN(lonVal) || lonVal < -180 || lonVal > 180) {
      setError('Longitude must be between −180 and +180.');
      return;
    }
    if (isNaN(tzVal)) {
      setError('Please select a valid UTC offset.');
      return;
    }

    const [yearStr, monStr, dayStr] = dateVal.split('-');
    const [hrStr, minStr, secStr]   = timeVal.split(':');
    const seconds = secStr ? parseInt(secStr) : 0;
    const localHour = parseInt(hrStr) + parseInt(minStr) / 60 + seconds / 3600;

    const localDate = new Date(Date.UTC(
      parseInt(yearStr), parseInt(monStr) - 1, parseInt(dayStr),
      Math.floor(localHour), parseInt(minStr), seconds,
    ));
    const utcDate = new Date(localDate.getTime() - tzVal * 3600000);

    const year  = utcDate.getUTCFullYear();
    const month = utcDate.getUTCMonth() + 1;
    const day   = utcDate.getUTCDate();
    const hour  = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600;

    const utcStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} `
                 + `${String(utcDate.getUTCHours()).padStart(2, '0')}:`
                 + `${String(utcDate.getUTCMinutes()).padStart(2, '0')}:`
                 + `${String(utcDate.getUTCSeconds()).padStart(2, '0')} UTC`;

    try {
      const data = buildChartData({ year, month, day, hour, lat: latVal, lon: lonVal });
      props.onGenerate(data, utcStr, latVal, lonVal, manualMode() ? '' : selectedCity());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Calculation error: ${msg}`);
      console.error(err);
    }
  }

  return (
    <section class="form-section card" id="form-section">
      <h2 class="section-title">Birth / Event Details</h2>
      <form id="chart-form" novalidate onSubmit={handleSubmit}>
        <div class="mode-toggle">
          <button
            type="button"
            class={`toggle-btn${!manualMode() ? ' active' : ''}`}
            onClick={() => { setManualMode(false); }}
            aria-pressed={!manualMode()}
          >
            🔍 City Lookup
          </button>
          <button
            type="button"
            class={`toggle-btn${manualMode() ? ' active' : ''}`}
            onClick={() => { setManualMode(true); setCityResults([]); }}
            aria-pressed={manualMode()}
          >
            ✎ Manual Coords
          </button>
        </div>

        <Show when={!manualMode()}>
          <div class="city-search">
            <div class="form-group">
              <label for="city">City / Location</label>
              <div class="city-input-row">
                <input
                  type="text" id="city" name="city"
                  placeholder="e.g. Athens, Greece"
                  value={city()}
                  onInput={(e) => handleCityInput(e.currentTarget.value)}
                  autocomplete="off"
                />
                <Show when={isSearching()}>
                  <span class="city-searching">…</span>
                </Show>
              </div>
            </div>
            <Show when={cityResults().length > 0}>
              <ul class="city-results" role="listbox">
                <For each={cityResults()}>
                  {(result) => (
                    <li
                      class="city-result-item"
                      role="option"
                      onClick={() => selectCityResult(result)}
                    >
                      {result.display_name}
                    </li>
                  )}
                </For>
              </ul>
            </Show>
            <Show when={selectedCity() !== ''}>
              <div class="coords-display">
                <span class="coords-label">Coordinates:</span>
                {' '}{lat()}° N, {lon()}° E — <span class="coords-tz">UTC{parseFloat(tz()) >= 0 ? '+' : ''}{tz()}</span>
              </div>
            </Show>
          </div>
        </Show>

        <div class="form-grid">
          <div class="form-group">
            <label for="date">Date</label>
            <input
              type="date" id="date" name="date" required
              value={date()} onInput={(e) => setDate(e.currentTarget.value)}
            />
          </div>
          <div class="form-group">
            <label for="time">Local Time</label>
            <input
              type="time" id="time" name="time" required step="1"
              value={time()} onInput={(e) => setTime(e.currentTarget.value)}
            />
          </div>
          <div class="form-group">
            <label for="tz">UTC Offset (hours)</label>
            <select id="tz" name="tz" value={tz()} onChange={(e) => setTz(e.currentTarget.value)}>
              {TZ_OPTIONS.map(opt => (
                <option value={opt.value} selected={opt.value === tz()}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Show when={manualMode()}>
            <div class="form-group">
              <label for="lat">Latitude (°N positive)</label>
              <input
                type="number" id="lat" name="lat" step="0.0001" min="-90" max="90"
                required placeholder="e.g. 40.3833"
                value={lat()} onInput={(e) => setLat(e.currentTarget.value)}
              />
            </div>
            <div class="form-group">
              <label for="lon">Longitude (°E positive)</label>
              <input
                type="number" id="lon" name="lon" step="0.0001" min="-180" max="180"
                required placeholder="e.g. 23.4333"
                value={lon()} onInput={(e) => setLon(e.currentTarget.value)}
              />
            </div>
          </Show>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-generate">
            <span class="btn-icon">✦</span> Generate Chart
          </button>
        </div>
        <p id="form-error" class="form-error" role="alert" aria-live="polite">
          {error()}
        </p>
      </form>
    </section>
  );
}
