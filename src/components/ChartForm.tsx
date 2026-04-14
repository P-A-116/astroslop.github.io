import { createEffect, createMemo, createSignal, Show, For, onCleanup, type JSX } from 'solid-js';
import type { ChartData } from '../types';
import { buildChartDataFromLocalInput } from '../astrology';

interface Props {
  onGenerate: (
    data: ChartData,
    utcStr: string,
    lat: number,
    lon: number,
    cityName: string,
  ) => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface TimezoneLookupResult {
  // timeapi.io GET /api/timezone/coordinate response shape (relevant fields only)
  timeZone: string;
}

interface ResolvedTimezone {
  name: string;
}

function Field(props: { id: string; label: string; children: JSX.Element }) {
  return (
    <div class="form-group">
      <label for={props.id}>{props.label}</label>
      {props.children}
    </div>
  );
}

function formatTzLabel(value: number) {
  const offset = Math.abs(value);
  const hours = Math.floor(offset);
  const minutes = Math.round((offset - hours) * 60);
  const sign = value < 0 ? '-' : '+';
  return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`;
}

const TZ_OPTIONS: { value: number; label: string }[] = (
  '-12 -11 -10 -9.5 -9 -8 -7 -6 -5 -4.5 -4 -3.5 -3 -2 -1 0 1 2 3 3.5 4 4.5 5 5.5 5.75 6 6.5 7 8 8.75 9 9.5 10 10.5 11 12 12.75 13 14'
    .split(' ')
    .map((s) => Number(s))
).map((value) => ({ value, label: formatTzLabel(value) }));

const TZ_OPTION_VALUES = new Set(TZ_OPTIONS.map((opt) => opt.value));

function snapToTzOption(offset: number): number {
  let best = TZ_OPTIONS[0].value;
  let minDiff = Math.abs(best - offset);
  for (const opt of TZ_OPTIONS) {
    const diff = Math.abs(opt.value - offset);
    if (diff < minDiff) {
      best = opt.value;
      minDiff = diff;
    }
  }
  return best;
}

function getZoneOffsetMinutes(timestamp: number, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  });
  const zonePart = formatter.formatToParts(new Date(timestamp)).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  if (zonePart === 'GMT' || zonePart === 'UTC') return 0;

  const match = zonePart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) throw new Error(`Unsupported timezone offset format: ${zonePart}`);

  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] ?? '0', 10);
  return sign * (hours * 60 + minutes);
}

function resolveTimezoneOffsetHours(dateVal: string, timeVal: string, timeZone: string) {
  const [year, month, day] = dateVal.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeVal.split(':').map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  let guess = localAsUtc;

  for (let i = 0; i < 3; i += 1) {
    const offsetMinutes = getZoneOffsetMinutes(guess, timeZone);
    const nextGuess = localAsUtc - offsetMinutes * 60000;
    if (Math.abs(nextGuess - guess) < 1000) return offsetMinutes / 60;
    guess = nextGuess;
  }

  return getZoneOffsetMinutes(guess, timeZone) / 60;
}

// ── City search hook ─────────────────────────────────────────────────

function createCitySearch() {
  const [city, setCity] = createSignal('');
  const [cityResults, setCityResults] = createSignal<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [selectedCity, setSelectedCity] = createSignal('');
  const [cityLookupError, setCityLookupError] = createSignal('');
  const [hasSearchedCity, setHasSearchedCity] = createSignal(false);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let abortController: AbortController | undefined;
  let latestQuery = '';

  function cleanup() {
    clearTimeout(debounceTimer);
    abortController?.abort();
  }

  async function lookup(query: string) {
    const trimmed = query.trim();
    latestQuery = trimmed;

    if (!trimmed) {
      abortController?.abort();
      setCityResults([]);
      setCityLookupError('');
      setHasSearchedCity(false);
      return;
    }

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    setIsSearching(true);
    setCityLookupError('');
    setHasSearchedCity(false);

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1&email=astroslop%40example.com`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AstroSlop/1.0' },
        signal: controller.signal,
      });
      if (res.status === 429) {
        throw new Error('Rate limited by geocoding service. Please wait a moment and try again.');
      }
      if (!res.ok) throw new Error(`Geocoding request failed (${res.status})`);

      const results = await res.json() as NominatimResult[];
      setCityResults(results);
      setHasSearchedCity(true);
      if (results.length === 0) {
        setCityLookupError('No matching locations found. Try a broader query or switch to Manual Coords.');
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setCityResults([]);
      setHasSearchedCity(true);
      const msg = err instanceof Error ? err.message : 'City lookup is unavailable right now. Check your connection or try Manual Coords.';
      setCityLookupError(msg);
      console.error(err);
    } finally {
      if (abortController === controller) setIsSearching(false);
    }
  }

  function handleInput(value: string) {
    setCity(value);
    setSelectedCity('');
    setCityLookupError('');
    setHasSearchedCity(false);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void lookup(value), 300);
  }

  function select(result: NominatimResult) {
    setSelectedCity(result.display_name);
    setCity(result.display_name);
    setCityResults([]);
    setCityLookupError('');
    setHasSearchedCity(true);
  }

  function reset() {
    setSelectedCity('');
    setCityResults([]);
    setCityLookupError('');
  }

  return {
    city, selectedCity, cityResults, isSearching, cityLookupError, hasSearchedCity,
    handleInput, select, reset, cleanup, retryLatest: () => void lookup(latestQuery),
    latestQuery: () => latestQuery,
  };
}

// ── Timezone resolver hook ───────────────────────────────────────────

function createTimezoneResolver() {
  const [isResolving, setIsResolving] = createSignal(false);
  const [lookupError, setLookupError] = createSignal('');
  const [resolved, setResolved] = createSignal<ResolvedTimezone | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let abortController: AbortController | undefined;

  function cleanup() {
    clearTimeout(debounceTimer);
    abortController?.abort();
  }

  async function lookup(latNum: number, lonNum: number, onResolved?: (tz: string) => void) {
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    setIsResolving(true);
    setLookupError('');

    try {
      // Dedicated timezone-by-coordinate endpoint — returns only timezone data,
      // not a weather payload.  No API key required; free tier is generous.
      const url = `https://timeapi.io/api/timezone/coordinate?latitude=${latNum}&longitude=${lonNum}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Timezone lookup failed (${res.status})`);

      const payload = await res.json() as TimezoneLookupResult;
      if (!payload.timeZone) throw new Error('Timezone lookup returned no timezone');

      setResolved({ name: payload.timeZone });
      onResolved?.(payload.timeZone);
    } catch (err) {
      if (controller.signal.aborted) return;
      setResolved(null);
      setLookupError('Could not validate the timezone for these coordinates right now.');
      console.error(err);
    } finally {
      if (abortController === controller) setIsResolving(false);
    }
  }

  function schedule(latNum: number, lonNum: number, immediate: boolean, onResolved?: (tz: string) => void) {
    clearTimeout(debounceTimer);
    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      setResolved(null);
      setLookupError('');
      return;
    }
    debounceTimer = setTimeout(() => void lookup(latNum, lonNum, onResolved), immediate ? 0 : 350);
  }

  function reset() {
    setResolved(null);
    setLookupError('');
  }

  return { isResolving, lookupError, resolved, schedule, reset, cleanup };
}

// ── Main form component ──────────────────────────────────────────────

export default function ChartForm(props: Props) {
  const [date, setDate] = createSignal('2002-10-06');
  const [time, setTime] = createSignal('20:10:00');
  // `tz` is stored as a number (hours) to match TZ_OPTIONS['value'] — no
  // parseFloat needed at call sites.
  const [tz, setTz] = createSignal<number>(3);
  const [lat, setLat] = createSignal('40.3833');
  const [lon, setLon] = createSignal('23.4333');
  const [error, setError] = createSignal('');
  const [manualMode, setManualMode] = createSignal(false);
  const [tzTouched, setTzTouched] = createSignal(false);

  const citySearch = createCitySearch();
  const tzResolver = createTimezoneResolver();

  onCleanup(() => {
    citySearch.cleanup();
    tzResolver.cleanup();
  });

  const suggestedTimezoneValue = createMemo((): number | null => {
    const zone = tzResolver.resolved();
    if (!zone) return null;
    try {
      return snapToTzOption(resolveTimezoneOffsetHours(date(), time(), zone.name));
    } catch {
      return null;
    }
  });

  const timezoneMismatch = createMemo(() => {
    const suggested = suggestedTimezoneValue();
    return suggested !== null && tz() !== suggested;
  });

  const timezoneSummary = createMemo(() => {
    const zone = tzResolver.resolved();
    const suggested = suggestedTimezoneValue();
    if (!zone || suggested === null) return '';
    return `${zone.name} (${formatTzLabel(suggested)})`;
  });

  createEffect(() => {
    const suggested = suggestedTimezoneValue();
    if (suggested !== null && !tzTouched()) setTz(suggested);
  });

  function applyTimezone(tzName: string) {
    const offsetValue = snapToTzOption(resolveTimezoneOffsetHours(date(), time(), tzName));
    if (!tzTouched()) setTz(offsetValue);
  }

  function scheduleTimezoneLookup(forceApply = false) {
    const latNum = parseFloat(lat());
    const lonNum = parseFloat(lon());
    tzResolver.schedule(latNum, lonNum, forceApply, forceApply
      ? (tzName) => setTz(snapToTzOption(resolveTimezoneOffsetHours(date(), time(), tzName)))
      : (tzName) => applyTimezone(tzName));
  }

  function handleCityInput(value: string) {
    citySearch.handleInput(value);
    tzResolver.reset();
  }

  function selectCityResult(result: NominatimResult) {
    const latNum = parseFloat(result.lat);
    const lonNum = parseFloat(result.lon);
    setLat(latNum.toFixed(4));
    setLon(lonNum.toFixed(4));
    setTzTouched(false);
    citySearch.select(result);
    tzResolver.schedule(latNum, lonNum, true, (tzName) => {
      setTz(snapToTzOption(resolveTimezoneOffsetHours(date(), time(), tzName)));
    });
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    setError('');

    const dateVal = date(), timeVal = time();
    const tzVal = tz(), latVal = parseFloat(lat()), lonVal = parseFloat(lon());

    if (!dateVal || !timeVal) { setError('Please enter a valid date and time.'); return; }
    if (!manualMode() && !citySearch.selectedCity()) { setError('Choose a location from the city lookup results, or switch to Manual Coords.'); return; }
    if (Number.isNaN(latVal) || latVal < -90 || latVal > 90) { setError('Latitude must be between -90 and +90.'); return; }
    if (Number.isNaN(lonVal) || lonVal < -180 || lonVal > 180) { setError('Longitude must be between -180 and +180.'); return; }
    if (!TZ_OPTION_VALUES.has(tzVal)) { setError('Please select a valid UTC offset.'); return; }
    if (timezoneMismatch()) { setError(`Selected UTC offset does not match the resolved timezone for this location: ${timezoneSummary()}.`); return; }

    try {
      const { data, utcStr } = buildChartDataFromLocalInput({ date: dateVal, time: timeVal, tzOffsetHours: tzVal, lat: latVal, lon: lonVal });
      props.onGenerate(data, utcStr, latVal, lonVal, manualMode() ? '' : citySearch.selectedCity());
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
          <button type="button" class={`toggle-btn${!manualMode() ? ' active' : ''}`}
            onClick={() => { setManualMode(false); if (!citySearch.selectedCity()) { tzResolver.reset(); } setError(''); }}
            aria-pressed={!manualMode()}>{'\uD83D\uDD0D'} City Lookup</button>
          <button type="button" class={`toggle-btn${manualMode() ? ' active' : ''}`}
            onClick={() => { setManualMode(true); citySearch.reset(); setError(''); scheduleTimezoneLookup(false); }}
            aria-pressed={manualMode()}>{'\u270E'} Manual Coords</button>
        </div>

        <Show when={!manualMode()}>
          <div class="city-search">
            <Field id="city" label="City / Location">
              <div class="city-input-row">
                <input type="text" id="city" name="city" placeholder="e.g. Athens, Greece"
                  value={citySearch.city()} onInput={(e) => handleCityInput(e.currentTarget.value)} autocomplete="off" />
                <Show when={citySearch.isSearching()}><span class="city-searching">{'\u2026'}</span></Show>
              </div>
            </Field>
            <Show when={citySearch.cityResults().length > 0}>
              <ul class="city-results" role="listbox">
                <For each={citySearch.cityResults()}>
                  {(result) => <li class="city-result-item" role="option" onClick={() => selectCityResult(result)}>{result.display_name}</li>}
                </For>
              </ul>
            </Show>
            <Show when={citySearch.hasSearchedCity() && citySearch.cityLookupError()}>
              <div class="location-message error" role="alert">
                <span>{citySearch.cityLookupError()}</span>
                <Show when={citySearch.latestQuery() !== '' && !citySearch.isSearching()}>
                  <button type="button" class="location-action" onClick={citySearch.retryLatest}>Retry</button>
                </Show>
              </div>
            </Show>
            <Show when={citySearch.selectedCity() !== ''}>
              <div class="coords-display">
                <span class="coords-label">Coordinates:</span>
                {` ${Math.abs(parseFloat(lat())).toFixed(4)}\u00b0 ${parseFloat(lat()) >= 0 ? 'N' : 'S'}, ${Math.abs(parseFloat(lon())).toFixed(4)}\u00b0 ${parseFloat(lon()) >= 0 ? 'E' : 'W'} `}
                <span class="coords-tz">{formatTzLabel(tz())}</span>
              </div>
            </Show>
          </div>
        </Show>

        <div class="form-grid">
          <Field id="date" label="Date"><input type="date" id="date" name="date" required value={date()} onInput={(e) => setDate(e.currentTarget.value)} /></Field>
          <Field id="time" label="Local Time"><input type="time" id="time" name="time" required step="1" value={time()} onInput={(e) => setTime(e.currentTarget.value)} /></Field>
          <Field id="tz" label="UTC Offset (hours)">
            {/* The select value is a number; reading e.currentTarget.value gives a
                string, so we convert once here rather than at every downstream call site. */}
            <select id="tz" name="tz" value={tz()} onChange={(e) => { setTz(Number(e.currentTarget.value)); setTzTouched(true); }}>
              <For each={TZ_OPTIONS}>{(opt) => <option value={opt.value}>{opt.label}</option>}</For>
            </select>
          </Field>
          <Show when={manualMode()}>
            <Field id="lat" label="Latitude (deg N positive)">
              <input type="number" id="lat" name="lat" step="0.0001" min="-90" max="90" required placeholder="e.g. 40.3833"
                value={lat()} onInput={(e) => { setLat(e.currentTarget.value); if (manualMode()) { citySearch.reset(); scheduleTimezoneLookup(false); } }} />
            </Field>
            <Field id="lon" label="Longitude (deg E positive)">
              <input type="number" id="lon" name="lon" step="0.0001" min="-180" max="180" required placeholder="e.g. 23.4333"
                value={lon()} onInput={(e) => { setLon(e.currentTarget.value); if (manualMode()) { citySearch.reset(); scheduleTimezoneLookup(false); } }} />
            </Field>
          </Show>
        </div>

        <Show when={tzResolver.isResolving()}><div class="location-message info" aria-live="polite">Validating timezone from coordinates...</div></Show>
        <Show when={!tzResolver.isResolving() && tzResolver.lookupError()}><div class="location-message warning" aria-live="polite">{tzResolver.lookupError()}</div></Show>
        <Show when={!tzResolver.isResolving() && timezoneSummary() !== ''}>
          <div class={`location-message${timezoneMismatch() ? ' warning' : ' success'}`} aria-live="polite">
            <span>Resolved timezone: {timezoneSummary()}</span>
            <Show when={timezoneMismatch()}><span>{` Selected: ${formatTzLabel(tz())}`}</span></Show>
          </div>
        </Show>

        <div class="form-actions"><button type="submit" class="btn-generate"><span class="btn-icon">{'\u2726'}</span> Generate Chart</button></div>
        <p id="form-error" class="form-error" role="alert" aria-live="polite">{error()}</p>
      </form>
    </section>
  );
}
