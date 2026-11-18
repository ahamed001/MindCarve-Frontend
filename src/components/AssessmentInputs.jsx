import { FiCheck } from 'react-icons/fi';

export const ProgressBar = ({ value, max, label, className = '' }) => {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className={className}>
      {label !== false && (
        <div className="mb-1.5 flex justify-between text-xs font-medium text-muted">
          <span>{label || `${value} of ${max} answered`}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/** Vertical list of large, tappable single-choice options. */
export const RadioOptions = ({ name, options, value, onChange, disabled }) => (
  <div className="grid gap-2" role="radiogroup">
    {options.map((o) => {
      const selected = value === o.value;
      return (
        <label
          key={o.value}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
            selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200' : 'border-line bg-white hover:border-brand-200'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <input type="radio" name={name} value={o.value} checked={selected} onChange={() => onChange(o.value)} disabled={disabled} className="sr-only" />
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-brand-500 bg-brand-500' : 'border-stone-300'}`}>
            {selected && <span className="h-2 w-2 rounded-full bg-white" />}
          </span>
          <span className="flex-1 text-ink">{o.label}</span>
          {o.description && <span className="text-xs text-muted">{o.description}</span>}
        </label>
      );
    })}
  </div>
);

export const CheckboxOptions = ({ options, values = [], onChange, disabled }) => (
  <div className="grid gap-2">
    {options.map((o) => {
      const selected = values.includes(o.value);
      const toggle = () => onChange(selected ? values.filter((v) => v !== o.value) : [...values, o.value]);
      return (
        <label
          key={o.value}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${selected ? 'border-brand-500 bg-brand-50' : 'border-line bg-white hover:border-brand-200'}`}
        >
          <input type="checkbox" checked={selected} onChange={toggle} disabled={disabled} className="sr-only" />
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300'}`}>
            {selected && <FiCheck size={13} />}
          </span>
          <span className="text-ink">{o.label}</span>
        </label>
      );
    })}
  </div>
);

/** Horizontal scale (e.g. 1–5 agree/disagree). Collapses to a vertical list on small screens. */
export const RatingScale = ({ name, options, value, onChange, disabled }) => (
  <div>
    <div className="sm:hidden">
      <RadioOptions name={name} options={options} value={value} onChange={onChange} disabled={disabled} />
    </div>
    <div role="radiogroup" className="hidden gap-2 sm:grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o, i) => {
        const selected = value === o.value;
        return (
          <button
            type="button"
            key={o.value}
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center transition ${
              selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200' : 'border-line bg-white hover:border-brand-200'
            }`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${selected ? 'bg-brand-500 text-white' : 'bg-stone-100 text-ink-soft'}`}>{/^\d+$/.test(o.value) ? o.value : i + 1}</span>
            <span className="text-xs font-medium leading-snug text-ink-soft">{o.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);
