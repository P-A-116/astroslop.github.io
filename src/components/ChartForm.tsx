import { createSignal } from 'solid-js';
import type { ChartData } from '../types';
import { buildChartData } from '../astrology';

interface Props {
  onGenerate: (data: ChartData, utcStr: string, lat: number, lon: number) => void;
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
    const [hrStr, minStr]           = timeVal.split(':');
    const localHour = parseInt(hrStr) + parseInt(minStr) / 60;

    const localDate = new Date(Date.UTC(
      parseInt(yearStr), parseInt(monStr) - 1, parseInt(dayStr),
      Math.floor(localHour), parseInt(minStr),
    ));
    const utcDate = new Date(localDate.getTime() - tzVal * 3600000);

    const year  = utcDate.getUTCFullYear();
    const month = utcDate.getUTCMonth() + 1;
    const day   = utcDate.getUTCDate();
    const hour  = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60;

    const utcStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} `
                 + `${String(utcDate.getUTCHours()).padStart(2, '0')}:`
                 + `${String(utcDate.getUTCMinutes()).padStart(2, '0')} UTC`;

    try {
      const data = buildChartData({ year, month, day, hour, lat: latVal, lon: lonVal });
      props.onGenerate(data, utcStr, latVal, lonVal);
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
              type="time" id="time" name="time" required
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
