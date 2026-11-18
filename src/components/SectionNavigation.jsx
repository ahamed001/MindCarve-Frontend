/** Page/section pills for long assessments. Each page shows how many of its questions are answered. */
const SectionNavigation = ({ pages, current, onSelect }) => (
  <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Assessment sections">
    {pages.map((p, i) => {
      const complete = p.answered === p.total;
      const active = i === current;
      return (
        <button
          key={p.key}
          type="button"
          onClick={() => onSelect(i)}
          aria-current={active ? 'step' : undefined}
          className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition ${
            active ? 'border-brand-500 bg-brand-50' : 'border-line bg-white hover:border-brand-200'
          }`}
        >
          <div className={`max-w-[180px] truncate font-semibold ${active ? 'text-brand-700' : 'text-ink'}`}>{p.title}</div>
          <div className={complete ? 'text-risk-low' : 'text-muted'}>
            {p.answered}/{p.total} answered
          </div>
        </button>
      );
    })}
  </nav>
);

export default SectionNavigation;
