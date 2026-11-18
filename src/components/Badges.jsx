const TONES = {
  neutral: 'bg-stone-100 text-ink-soft',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-sky-50 text-sky-700',
  slate: 'bg-slate-100 text-slate-600',
};

const STATUS_MAP = {
  // assignment
  assigned: ['Assigned', 'blue'],
  in_progress: ['In progress', 'amber'],
  completed: ['Completed', 'green'],
  cancelled: ['Cancelled', 'slate'],
  // assessment
  draft: ['Draft', 'amber'],
  published: ['Published', 'green'],
  archived: ['Archived', 'slate'],
  // patient / account
  active: ['Active', 'green'],
  inactive: ['Inactive', 'slate'],
  invited: ['Invite pending', 'blue'],
  disabled: ['Disabled', 'slate'],
  // review
  flagged: ['Needs review', 'red'],
  reviewed: ['Reviewed', 'green'],
  none: ['No review needed', 'neutral'],
  // reports
  generating: ['Generating…', 'amber'],
  ready: ['Ready', 'green'],
  failed: ['Failed', 'red'],
  // results
  scored: ['Scored', 'green'],
  not_configured: ['Scoring awaiting configuration', 'slate'],
  incomplete: ['Incomplete', 'amber'],
};

export const Badge = ({ tone = 'neutral', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}>
    {children}
  </span>
);

export const StatusBadge = ({ status }) => {
  const [label, tone] = STATUS_MAP[status] || [status, 'neutral'];
  return <Badge tone={tone}>{label}</Badge>;
};

const RISK = { low: ['Low', 'green'], moderate: ['Moderate', 'amber'], high: ['High', 'red'] };
export const RiskBadge = ({ level }) => {
  if (!level) return <Badge tone="neutral">No risk band</Badge>;
  const [label, tone] = RISK[level];
  return <Badge tone={tone}>{label} risk</Badge>;
};

export const DemoTag = ({ show }) =>
  show ? (
    <span title="Fictional demonstration record" className="rounded border border-dashed border-brand-200 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-brand-600">
      Demo
    </span>
  ) : null;
