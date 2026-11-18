const todayLabel = () =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date())
    .replace(/^(\w+) /, '$1, ');

export const DatePill = () => (
  <span className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-ink shadow-card">{todayLabel()}</span>
);

export const PageHeader = ({ title, subtitle, actions, eyebrow, showDate = true }) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
      <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {actions}
      {showDate && !actions && <DatePill />}
    </div>
  </div>
);

/** One KPI tile. Use inside <StatGroup> to get the joined three-column card from the design. */
export const StatCard = ({ label, value, hint, hintHighlight, hintTone = 'brand', compact = false }) => {
  const tones = { brand: 'text-brand-600', red: 'text-risk-high', green: 'text-risk-low', muted: 'text-muted' };
  if (compact) {
    return (
      <div className="px-5 py-4">
        <p className="text-xl font-semibold leading-none text-ink">{value}</p>
        <p className="mt-1.5 text-[0.6875rem] text-muted">{label}</p>
      </div>
    );
  }
  return (
    <div className="p-6">
      <p className="text-sm font-medium text-ink-soft">{label}</p>
      <p className="mt-2 text-3xl font-bold leading-none tracking-tight text-ink">{value}</p>
      {(hint || hintHighlight) && (
        <p className="mt-3 text-sm text-muted">
          {hintHighlight && <span className={`font-semibold ${tones[hintTone]}`}>{hintHighlight}</span>} {hint}
        </p>
      )}
    </div>
  );
};

export const StatGroup = ({ children }) => (
  <div className="card grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">{children}</div>
);

export const ChartCard = ({ title, subtitle, meta, action, children, className = '' }) => (
  <section className={`card ${className}`}>
    <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action || (meta && <span className="text-sm text-muted">{meta}</span>)}
    </div>
    <div className="p-6">{children}</div>
  </section>
);

export const Card = ({ title, action, children, className = '', bodyClassName = 'p-6' }) => (
  <section className={`card ${className}`}>
    {title && (
      <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export const InfoRow = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-2 text-sm">
    <span className="text-muted">{label}</span>
    <span className="text-right font-medium text-ink">{children}</span>
  </div>
);
