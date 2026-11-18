/** Pill-style segmented filter used on list pages (matches the reference "All / Signed / Pending" chips). */
const FilterChips = ({ value, onChange, options, label }) => (
  <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
    {options.map((o) => {
      const active = value === o.value;
      return (
        <button
          key={o.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
            active ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-line bg-white text-ink hover:border-brand-200'
          }`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export default FilterChips;
