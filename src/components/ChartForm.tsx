import { createSignal, type JSX } from 'solid-js';
import { buildChartData } from '../astrology';
import type { ChartData } from '../types';

interface Props {
  onGenerate: (data: ChartData, utcStr: string, lat: number, lon: number) => void;
}

const TZ_OPTIONS = [
  ...Array.from({ length: 27 }, (_, i) => i - 12),
  -9.5, -4.5, -3.5, 3.5, 4.5, 5.5, 5.75, 6.5, 8.75, 9.5, 10.5, 12.75,
].sort((a, b) => a - b).map(String);

const pad2 = (n: number) => String(n).padStart(2, '0');
const onValue = (set: (value: string) => void) => (e: Event & { currentTarget: { value: string } }) => set(e.currentTarget.value);
const Field = (props: { id: string; label: string; children: JSX.Element }) => (
  <div class="form-group">
    <label for={props.id}>{props.label}</label>
    {props.children}
  </div>
);
const tzLabel = (value: string) => {
  const n = Number(value), abs = Math.abs(n), hour = Math.trunc(abs), min = Math.round((abs - hour) * 60);
  return `UTC${n >= 0 ? '+' : '-'}${hour}${min ? `:${pad2(min)}` : ''}`;
};

export default function ChartForm(props: Props) {
  const [date, setDate] = createSignal('2002-10-06');
  const [time, setTime] = createSignal('20:10');
  const [tz, setTz] = createSignal('3');
  const [lat, setLat] = createSignal('40.3833');
  const [lon, setLon] = createSignal('23.4333');
  const [error, setError] = createSignal('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    setError('');

    const dateVal = date(), timeVal = time(), tzVal = Number(tz()), latVal = Number(lat()), lonVal = Number(lon());
    if (!dateVal || !timeVal) return void setError('Please enter a valid date and time.');
    if (Number.isNaN(latVal) || latVal < -90 || latVal > 90) return void setError('Latitude must be between −90 and +90.');
    if (Number.isNaN(lonVal) || lonVal < -180 || lonVal > 180) return void setError('Longitude must be between −180 and +180.');
    if (Number.isNaN(tzVal)) return void setError('Please select a valid UTC offset.');

    const [year, month, day] = dateVal.split('-').map(Number);
    const [hours, minutes] = timeVal.split(':').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes) - tzVal * 3600000);
    const utcYear = utcDate.getUTCFullYear(), utcMonth = utcDate.getUTCMonth() + 1, utcDay = utcDate.getUTCDate();
    const hour = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60;
    const utcStr = `${utcYear}-${pad2(utcMonth)}-${pad2(utcDay)} ${pad2(utcDate.getUTCHours())}:${pad2(utcDate.getUTCMinutes())} UTC`;

    try {
      props.onGenerate(buildChartData({ year: utcYear, month: utcMonth, day: utcDay, hour, lat: latVal, lon: lonVal }), utcStr, latVal, lonVal);
    } catch (err) {
      setError(`Calculation error: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    }
  }

  return (
    <section class="form-section card" id="form-section">
      <h2 class="section-title">Birth / Event Details</h2>
      <form id="chart-form" novalidate onSubmit={handleSubmit}>
        <div class="form-grid">
          <Field id="date" label="Date">
            <input type="date" id="date" name="date" required value={date()} onInput={onValue(setDate)} />
          </Field>
          <Field id="time" label="Local Time">
            <input type="time" id="time" name="time" required value={time()} onInput={onValue(setTime)} />
          </Field>
          <Field id="tz" label="UTC Offset (hours)">
            <select id="tz" name="tz" value={tz()} onChange={onValue(setTz)}>
              {TZ_OPTIONS.map((value) => <option value={value} selected={value === tz()}>{tzLabel(value)}</option>)}
            </select>
          </Field>
          <Field id="lat" label="Latitude (°N positive)">
            <input
              type="number" id="lat" name="lat" step="0.0001" min="-90" max="90" required placeholder="e.g. 40.3833"
              value={lat()} onInput={onValue(setLat)}
            />
          </Field>
          <Field id="lon" label="Longitude (°E positive)">
            <input
              type="number" id="lon" name="lon" step="0.0001" min="-180" max="180" required placeholder="e.g. 23.4333"
              value={lon()} onInput={onValue(setLon)}
            />
          </Field>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-generate">
            <span class="btn-icon">✦</span> Generate Chart
          </button>
        </div>
        <p id="form-error" class="form-error" role="alert" aria-live="polite">{error()}</p>
      </form>
    </section>
  );
}
