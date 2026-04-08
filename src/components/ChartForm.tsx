import { createEffect, createMemo, createSignal, Show, For, onCleanup, type JSX } from 'solid-js';
import type { ChartData, GulikaConfig, UpagrahaFormValues } from '../types';
import { buildChartData } from '../astrology';
import { defaultGulikaConfig } from '../upagraha';

interface Props {
  onGenerate: (
    data: ChartData,
    utcStr: string,
    lat: number,
    lon: number,
    cityName: string,
    upagraha: UpagrahaFormValues,
  ) => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface TimezoneLookupResult {
  timezone: string;
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

const TZ_OPTION_VALUES = new Set(TZ_OPTIONS.map((opt) => opt.value));

function toUtcDetails(dateVal: string, timeVal: string, tzVal: number) {
  const utcDate = toAbsoluteDate(dateVal, timeVal, tzVal);

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

function toAbsoluteDate(dateVal: string, timeVal: string, tzVal: number) {
  const [yearStr, monStr, dayStr] = dateVal.split('-');
  const [hrStr, minStr, secStr = '0'] = timeVal.split(':');
  return new Date(
    Date.UTC(
      parseInt(yearStr),
      parseInt(monStr) - 1,
      parseInt(dayStr),
      parseInt(hrStr),
      parseInt(minStr),
      parseInt(secStr),
    ) - tzVal * 3600000,
  );
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
  const [cityLookupError, setCityLookupError] = createSignal('');
  const [hasSearchedCity, setHasSearchedCity] = createSignal(false);
  const [isResolvingTimezone, setIsResolvingTimezone] = createSignal(false);
  const [timezoneLookupError, setTimezoneLookupError] = createSignal('');
  const [resolvedTimezone, setResolvedTimezone] = createSignal<ResolvedTimezone | null>(null);
  const [tzTouched, setTzTouched] = createSignal(false);
  const [sunriseTime, setSunriseTime] = createSignal('');
  const [sunsetTime, setSunsetTime] = createSignal('');
  const [gulikaConfig, setGulikaConfig] = createSignal<GulikaConfig>(defaultGulikaConfig);

  let cityDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  let timezoneDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  let cityAbortController: AbortController | undefined;
  let timezoneAbortController: AbortController | undefined;
  let latestCityQuery = '';

  onCleanup(() => {
    clearTimeout(cityDebounceTimer);
    clearTimeout(timezoneDebounceTimer);
    cityAbortController?.abort();
    timezoneAbortController?.abort();
  });

  const suggestedTimezoneValue = createMemo(() => {
    const zone = resolvedTimezone();
    if (!zone) return null;

    try {
      return snapToTzOption(resolveTimezoneOffsetHours(date(), time(), zone.name), TZ_OPTIONS);
    } catch {
      return null;
    }
  });

  const timezoneMismatch = createMemo(() => {
    const suggested = suggestedTimezoneValue();
    return suggested !== null && tz() !== suggested;
  });

  const timezoneSummary = createMemo(() => {
    const zone = resolvedTimezone();
    const suggested = suggestedTimezoneValue();
    if (!zone || !suggested) return '';
    return `${zone.name} (${formatTzLabel(suggested)})`;
  });

  createEffect(() => {
    const suggested = suggestedTimezoneValue();
    if (suggested !== null && !tzTouched()) setTz(suggested);
  });

  async function lookupTimezone(latNum: number, lonNum: number, forceApply = false) {
    timezoneAbortController?.abort();
    const controller = new AbortController();
    timezoneAbortController = controller;

    setIsResolvingTimezone(true);
    setTimezoneLookupError('');

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}&current=temperature_2m&timezone=auto&forecast_days=1`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Timezone lookup failed (${res.status})`);

      const payload = await res.json() as TimezoneLookupResult;
      if (!payload.timezone) throw new Error('Timezone lookup returned no timezone');

      setResolvedTimezone({ name: payload.timezone });
      const offsetValue = snapToTzOption(resolveTimezoneOffsetHours(date(), time(), payload.timezone), TZ_OPTIONS);
      if (forceApply || !tzTouched()) setTz(offsetValue);
    } catch (err) {
      if (controller.signal.aborted) return;
      setResolvedTimezone(null);
      setTimezoneLookupError('Could not validate the timezone for these coordinates right now.');
      console.error(err);
    } finally {
      if (timezoneAbortController === controller) {
        setIsResolvingTimezone(false);
      }
    }
  }

  function scheduleTimezoneLookup(forceApply = false) {
    clearTimeout(timezoneDebounceTimer);
    const latNum = parseFloat(lat());
    const lonNum = parseFloat(lon());

    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      setResolvedTimezone(null);
      setTimezoneLookupError('');
      return;
    }

    timezoneDebounceTimer = setTimeout(() => {
      void lookupTimezone(latNum, lonNum, forceApply);
    }, forceApply ? 0 : 350);
  }

  async function lookupCity(query: string) {
    const trimmed = query.trim();
    latestCityQuery = trimmed;

    if (!trimmed) {
      cityAbortController?.abort();
      setCityResults([]);
      setCityLookupError('');
      setHasSearchedCity(false);
      return;
    }

    cityAbortController?.abort();
    const controller = new AbortController();
    cityAbortController = controller;

    setIsSearching(true);
    setCityLookupError('');
    setHasSearchedCity(false);

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1&email=astroslop%40example.com`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AstroSlop/1.0' },
        signal: controller.signal,
      });
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
      setCityLookupError('City lookup is unavailable right now. Check your connection or try Manual Coords.');
      console.error(err);
    } finally {
      if (cityAbortController === controller) {
        setIsSearching(false);
      }
    }
  }

  function handleCityInput(value: string) {
    setCity(value);
    setSelectedCity('');
    setResolvedTimezone(null);
    setTimezoneLookupError('');
    setCityLookupError('');
    setHasSearchedCity(false);
    clearTimeout(cityDebounceTimer);
    cityDebounceTimer = setTimeout(() => void lookupCity(value), 300);
  }

  function handleTimezoneChange(value: string) {
    setTz(value);
    setTzTouched(true);
  }

  function handleLatInput(value: string) {
    setLat(value);
    if (manualMode()) {
      setSelectedCity('');
      scheduleTimezoneLookup(false);
    }
  }

  function handleLonInput(value: string) {
    setLon(value);
    if (manualMode()) {
      setSelectedCity('');
      scheduleTimezoneLookup(false);
    }
  }

  function selectCityResult(result: NominatimResult) {
    const latNum = parseFloat(result.lat);
    const lonNum = parseFloat(result.lon);
    setLat(latNum.toFixed(4));
    setLon(lonNum.toFixed(4));
    setTzTouched(false);
    setSelectedCity(result.display_name);
    setCity(result.display_name);
    setCityResults([]);
    setCityLookupError('');
    setHasSearchedCity(true);
    void lookupTimezone(latNum, lonNum, true);
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
    if (!manualMode() && !selectedCity()) {
      setError('Choose a location from the city lookup results, or switch to Manual Coords.');
      return;
    }
    if (Number.isNaN(latVal) || latVal < -90 || latVal > 90) {
      setError('Latitude must be between -90 and +90.');
      return;
    }
    if (Number.isNaN(lonVal) || lonVal < -180 || lonVal > 180) {
      setError('Longitude must be between -180 and +180.');
      return;
    }
    if (Number.isNaN(tzVal) || !TZ_OPTION_VALUES.has(tz())) {
      setError('Please select a valid UTC offset.');
      return;
    }
    if (timezoneMismatch()) {
      setError(`Selected UTC offset does not match the resolved timezone for this location: ${timezoneSummary()}.`);
      return;
    }

    try {
      const utc = toUtcDetails(dateVal, timeVal, tzVal);
      const data = buildChartData({ ...utc, lat: latVal, lon: lonVal });
      props.onGenerate(
        data,
        utc.utcStr,
        latVal,
        lonVal,
        manualMode() ? '' : selectedCity(),
        {
          eventDate: toAbsoluteDate(dateVal, timeVal, tzVal),
          sunrise: sunriseTime() ? toAbsoluteDate(dateVal, sunriseTime(), tzVal) : null,
          sunset: sunsetTime() ? toAbsoluteDate(dateVal, sunsetTime(), tzVal) : null,
          gulikaConfig: gulikaConfig(),
        },
      );
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
            onClick={() => {
              setManualMode(false);
              if (!selectedCity()) {
                setResolvedTimezone(null);
                setTimezoneLookupError('');
              }
              setError('');
            }}
            aria-pressed={!manualMode()}
          >
            {'\uD83D\uDD0D'} City Lookup
          </button>
          <button
            type="button"
            class={`toggle-btn${manualMode() ? ' active' : ''}`}
            onClick={() => {
              setManualMode(true);
              setSelectedCity('');
              setCityResults([]);
              setCityLookupError('');
              setError('');
              scheduleTimezoneLookup(false);
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

            <Show when={hasSearchedCity() && cityLookupError()}>
              <div class="location-message error" role="alert">
                <span>{cityLookupError()}</span>
                <Show when={latestCityQuery !== '' && !isSearching()}>
                  <button
                    type="button"
                    class="location-action"
                    onClick={() => void lookupCity(latestCityQuery)}
                  >
                    Retry
                  </button>
                </Show>
              </div>
            </Show>

            <Show when={selectedCity() !== ''}>
              <div class="coords-display">
                <span class="coords-label">Coordinates:</span>
                {` ${Math.abs(parseFloat(lat())).toFixed(4)}° ${parseFloat(lat()) >= 0 ? 'N' : 'S'}, ${Math.abs(parseFloat(lon())).toFixed(4)}° ${parseFloat(lon()) >= 0 ? 'E' : 'W'} `}
                <span class="coords-tz">{formatTzLabel(tz())}</span>
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
              onInput={(e) => setDate(e.currentTarget.value)}
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
              onInput={(e) => setTime(e.currentTarget.value)}
            />
          </Field>

          <Field id="tz" label="UTC Offset (hours)">
            <select
              id="tz"
              name="tz"
              value={tz()}
              onChange={(e) => handleTimezoneChange(e.currentTarget.value)}
            >
              <For each={TZ_OPTIONS}>
                {(opt) => <option value={opt.value}>{opt.label}</option>}
              </For>
            </select>
          </Field>

          <Show when={manualMode()}>
            <Field id="lat" label="Latitude (deg N positive)">
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
                onInput={(e) => handleLatInput(e.currentTarget.value)}
              />
            </Field>

            <Field id="lon" label="Longitude (deg E positive)">
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
                onInput={(e) => handleLonInput(e.currentTarget.value)}
              />
            </Field>
          </Show>
        </div>

        <div class="settings-panel">
          <h3 class="settings-title">Upagraha Diagnostics</h3>
          <p class="settings-note">
            Optional. Enter local sunrise and sunset for the event date to enable Gulika/Mandi tracing.
            These values should come from a reliable sunrise/sunset source for the birth location.
          </p>

          <div class="form-grid">
            <Field id="sunrise-time" label="Sunrise (local)">
              <input
                type="time"
                id="sunrise-time"
                name="sunrise-time"
                step="60"
                value={sunriseTime()}
                onInput={(e) => setSunriseTime(e.currentTarget.value)}
              />
            </Field>

            <Field id="sunset-time" label="Sunset (local)">
              <input
                type="time"
                id="sunset-time"
                name="sunset-time"
                step="60"
                value={sunsetTime()}
                onInput={(e) => setSunsetTime(e.currentTarget.value)}
              />
            </Field>

            <Field id="gulika-time-division" label="Time Division">
              <select
                id="gulika-time-division"
                name="gulika-time-division"
                value={gulikaConfig().timeDivision}
                onChange={(e) => setGulikaConfig({
                  ...gulikaConfig(),
                  timeDivision: e.currentTarget.value as GulikaConfig['timeDivision'],
                })}
              >
                <option value="day-night-8-parts">Day / Night in 8 Parts</option>
              </select>
            </Field>

            <Field id="gulika-start-lord-mode" label="Night Start Lord">
              <select
                id="gulika-start-lord-mode"
                name="gulika-start-lord-mode"
                value={gulikaConfig().startLordMode}
                onChange={(e) => setGulikaConfig({
                  ...gulikaConfig(),
                  startLordMode: e.currentTarget.value as GulikaConfig['startLordMode'],
                })}
              >
                <option value="weekday">Weekday Lord</option>
                <option value="fifth-from-weekday">5th From Weekday</option>
              </select>
            </Field>

            <Field id="gulika-identity-mode" label="Gulika / Mandi Identity">
              <select
                id="gulika-identity-mode"
                name="gulika-identity-mode"
                value={gulikaConfig().identityMode}
                onChange={(e) => setGulikaConfig({
                  ...gulikaConfig(),
                  identityMode: e.currentTarget.value as GulikaConfig['identityMode'],
                })}
              >
                <option value="start-vs-end">Gulika Start / Mandi End</option>
                <option value="same">Same Point</option>
                <option value="separate">Separate (Reserved)</option>
              </select>
            </Field>
          </div>
        </div>

        <Show when={isResolvingTimezone()}>
          <div class="location-message info" aria-live="polite">
            Validating timezone from coordinates...
          </div>
        </Show>

        <Show when={!isResolvingTimezone() && timezoneLookupError()}>
          <div class="location-message warning" aria-live="polite">
            {timezoneLookupError()}
          </div>
        </Show>

        <Show when={!isResolvingTimezone() && timezoneSummary() !== ''}>
          <div class={`location-message${timezoneMismatch() ? ' warning' : ' success'}`} aria-live="polite">
            <span>Resolved timezone: {timezoneSummary()}</span>
            <Show when={timezoneMismatch()}>
              <span>{` Selected: ${formatTzLabel(tz())}`}</span>
            </Show>
          </div>
        </Show>

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
