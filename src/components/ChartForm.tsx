import { createSignal, For, Show, type JSX } from 'solid-js';
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

type ValueTarget = HTMLInputElement | HTMLSelectElement;

function Field(props: { id: string; label: string; children: JSX.Element }) {
  return (
    <div class="form-group">
      <label for={props.id}>{props.label}</label>
      {props.children}
    </div>
  );
}

function snapToTzOption(offset: number, options: { value: string; label: string }[]) {
  let best = options[0];
  let minDiff = Math.abs(parseFloat(best.value) - offset);
  for (const opt of options) {
    const diff = Math.abs(parseFloat(opt.value) - offset);
    if (diff < minDiff) {
      best = opt;
      minDiff = diff;
    }
  }
  return best.value;
}

function formatTzLabel(value: string) {
  const offset = Math.abs(parseFloat(value));
  const hours = Math.floor(offset);
  const minutes = Math.round((offset - hours) * 60);
  return `UTC${value.startsWith('-') ? '-' : '+'}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`;
}

const TZ_OPTIONS = '-12 -11 -10 -9.5 -9 -8 -7 -6 -5 -4.5 -4 -3.5 -3 -2 -1 0 1 2 3 3.5 4 4.5 5 5.5 5.75 6 6.5 7 8 8.75 9 9.5 10 10.5 11 12 12.75 13 14'
  .split(' ')
  .map((value) => ({ value, label: formatTzLabel(value) }));

function toUtcDetails(dateVal: string, timeVal: string, tzVal: number) {
  const [yearStr, monStr, dayStr] = dateVal.split('-');
  const [hrStr, minStr, secStr = '0'] = timeVal.split(':');
  const utcDate = new Date(
    Date.UTC(
      parseInt(yearStr),
      parseInt(monStr) - 1,
      parseInt(dayStr),
      parseInt(hrStr),
      parseInt(minStr),
      parseInt(secStr),
    ) - tzVal * 3600000,
  );

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600,
    utcStr:
      `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}-${String(utcDate.getUTCDate()).padStart(2, '0')} `
      + `${String(utcDate.getUTCHours()).padStart(2, '0')}:`
      + `${String(utcDate.getUTCMinutes()).padStart(2, '0')}:`
      + `${String(utcDate.getUTCSeconds()).padStart(2, '0')} UTC`,
  };
}

export default function ChartForm(props: Props) {
  const [date, setDate] = createSignal('2002-10-06');
  const [time, setTime] = createSignal('20:10:00');
  const [tz, setTz] = createSignal('3');
  const [lat, setLat] = createSignal('40.3833');
  const [lon, setLon] = createSignal('23.4333');
  const [error, setError] = createSignal('');
  const [manualMode, setManualMode] = createSignal(false);
  const [city, setCity] = createSignal('');
  const [cityResults, setCityResults] = createSignal<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [selectedCity, setSelectedCity] = createSignal('');

  const bindValue = (setter: (value: string) => void) =>
    (e: Event & { currentTarget: ValueTarget }) => setter(e.currentTarget.value);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  async function lookupCity(query: string) {
    if (!query.trim()) {
      setCityResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&email=astroslop%40example.com`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AstroSlop/1.0' } });
      if (!res.ok) throw new Error('Geocoding request failed');
      setCityResults(await res.json());
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
    setLat(latNum.toFixed(4));
    setLon(lonNum.toFixed(4));
    setTz(snapToTzOption(Math.round(lonNum / 15), TZ_OPTIONS));
    setSelectedCity(result.display_name);
    setCity(result.display_name);
    setCityResults([]);
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    setError('');

    const dateVal = date();
    const timeVal = time();
    const tzVal = parseFloat(tz());
    const latVal = parseFloat(lat());
    const lonVal = parseFloat(lon());

    if (!dateVal || !timeVal) {
      setError('Please enter a valid date and time.');
      return;
    }
    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      setError('Latitude must be between \u221290 and +90.');
      return;
    }
    if (isNaN(lonVal) || lonVal < -180 || lonVal > 180) {
      setError('Longitude must be between \u2212180 and +180.');
      return;
    }
    if (isNaN(tzVal)) {
      setError('Please select a valid UTC offset.');
      return;
    }

    try {
      const utc = toUtcDetails(dateVal, timeVal, tzVal);
      const data = buildChartData({ ...utc, lat: latVal, lon: lonVal });
      props.onGenerate(data, utc.utcStr, latVal, lonVal, manualMode() ? '' : selectedCity());
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
            onClick={() => setManualMode(false)}
            aria-pressed={!manualMode()}
          >
            {'\uD83D\uDD0D'} City Lookup
          </button>
          <button
            type="button"
            class={`toggle-btn${manualMode() ? ' active' : ''}`}
            onClick={() => {
              setManualMode(true);
              setCityResults([]);
            }}
            aria-pressed={manualMode()}
          >
            {'\u270E'} Manual Coords
          </button>
        </div>

        <Show when={!manualMode()}>
          <div class="city-search">
            <Field id="city" label="City / Location">
              <div class="city-input-row">
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="e.g. Athens, Greece"
                  value={city()}
                  onInput={(e) => handleCityInput(e.currentTarget.value)}
                  autocomplete="off"
                />
                <Show when={isSearching()}>
                  <span class="city-searching">{'\u2026'}</span>
                </Show>
              </div>
            </Field>

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
                {` ${Math.abs(parseFloat(lat())).toFixed(4)}\u00B0 ${parseFloat(lat()) >= 0 ? 'N' : 'S'}, ${Math.abs(parseFloat(lon())).toFixed(4)}\u00B0 ${parseFloat(lon()) >= 0 ? 'E' : 'W'} \u2014 `}
                <span class="coords-tz">UTC{parseFloat(tz()) >= 0 ? '+' : ''}{tz()}</span>
              </div>
            </Show>
          </div>
        </Show>

        <div class="form-grid">
          <Field id="date" label="Date">
            <input
              type="date"
              id="date"
              name="date"
              required
              value={date()}
              onInput={bindValue(setDate)}
            />
          </Field>

          <Field id="time" label="Local Time">
            <input
              type="time"
              id="time"
              name="time"
              required
              step="1"
              value={time()}
              onInput={bindValue(setTime)}
            />
          </Field>

          <Field id="tz" label="UTC Offset (hours)">
            <select id="tz" name="tz" value={tz()} onChange={bindValue(setTz)}>
              <For each={TZ_OPTIONS}>
                {(opt) => <option value={opt.value}>{opt.label}</option>}
              </For>
            </select>
          </Field>

          <Show when={manualMode()}>
            <Field id="lat" label="Latitude (\u00B0N positive)">
              <input
                type="number"
                id="lat"
                name="lat"
                step="0.0001"
                min="-90"
                max="90"
                required
                placeholder="e.g. 40.3833"
                value={lat()}
                onInput={bindValue(setLat)}
              />
            </Field>

            <Field id="lon" label="Longitude (\u00B0E positive)">
              <input
                type="number"
                id="lon"
                name="lon"
                step="0.0001"
                min="-180"
                max="180"
                required
                placeholder="e.g. 23.4333"
                value={lon()}
                onInput={bindValue(setLon)}
              />
            </Field>
          </Show>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-generate">
            <span class="btn-icon">{'\u2726'}</span> Generate Chart
          </button>
        </div>

        <p id="form-error" class="form-error" role="alert" aria-live="polite">
          {error()}
        </p>
      </form>
    </section>
  );
}
