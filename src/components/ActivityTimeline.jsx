import { Link } from 'react-router-dom';
import { DemoTag } from './Badges';
import { initials, relativeTime } from '../utils/format';

// Visual language from the reference design: green = completed/registered, red = risk, blue = everything else.
const TONE_BY_ACTION = {
  'patient.registered': 'green',
  'patient.invitation_accepted': 'green',
  'assessment.completed': 'green',
  'clinical.review_completed': 'green',
  'clinical.flagged_for_review': 'red',
};
const DOT = {
  green: 'bg-emerald-100 [&>span]:bg-emerald-600',
  red: 'bg-red-100 [&>span]:bg-red-600',
  blue: 'bg-blue-100 [&>span]:bg-blue-600',
};

const PILL_BY_ACTION = {
  'assessment.completed': ['Completed', 'bg-brand-100 text-brand-700'],
  'clinical.flagged_for_review': ['High risk', 'bg-red-50 text-red-600'],
  'clinical.review_completed': ['Reviewed', 'bg-emerald-50 text-emerald-700'],
  'clinical.note_added': ['Notes', 'bg-blue-50 text-blue-700'],
  'assessment.started': ['In progress', 'bg-blue-50 text-blue-700'],
  'assessment.assigned': ['Assigned', 'bg-slate-100 text-slate-600'],
  'patient.registered': ['New patient', 'bg-emerald-50 text-emerald-700'],
  'patient.invitation_sent': ['Invitation', 'bg-slate-100 text-slate-600'],
  'patient.invitation_accepted': ['Account set up', 'bg-emerald-50 text-emerald-700'],
};

const toneOf = (item) => TONE_BY_ACTION[item.action] || 'blue';

/** Bold the leading person name (patient or actor) when the message starts with it. */
export const ActivityMessage = ({ item }) => {
  const name = [item.patient?.fullName, item.actorName].find((n) => n && item.message.startsWith(n));
  if (!name) return <>{item.message}</>;
  return (
    <>
      <strong className="font-semibold text-ink">{name}</strong>
      {item.message.slice(name.length)}
    </>
  );
};

const subjectName = (item) => item.patient?.fullName || item.actorName || 'System';

/** Vertical timeline (Activity page). */
const ActivityTimeline = ({ items }) => (
  <ol>
    {items.map((item, i) => (
      <li key={item._id} className="relative flex gap-4 pb-7 last:pb-0">
        {i < items.length - 1 && <span className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 bg-brand-100" aria-hidden="true" />}
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${DOT[toneOf(item)]}`}>
          <span className="h-3 w-3 rounded-full" />
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[15px] text-ink-soft">
            <ActivityMessage item={item} /> <DemoTag show={item.isDemo} />
          </p>
          <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-muted">
            <time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
            {item.patient?._id && (
              <Link to={`/admin/patients/${item.patient._id}`} className="font-medium text-brand-600 hover:underline">
                {item.patient.patientCode}
              </Link>
            )}
          </p>
        </div>
      </li>
    ))}
  </ol>
);

/** Row list with initials avatar and status pill (Overview "Latest activity"). */
export const ActivityList = ({ items }) => (
  <ul className="divide-y divide-line">
    {items.map((item) => {
      const pill = PILL_BY_ACTION[item.action];
      return (
        <li key={item._id} className="flex items-center gap-4 px-6 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-sm font-semibold text-ink-soft">
            {initials(subjectName(item)) || '•'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] text-ink-soft">
              <ActivityMessage item={item} /> <DemoTag show={item.isDemo} />
            </p>
            <p className="text-sm text-muted">{relativeTime(item.createdAt)}</p>
          </div>
          {pill && <span className={`hidden whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold sm:inline ${pill[1]}`}>{pill[0]}</span>}
        </li>
      );
    })}
  </ul>
);

export default ActivityTimeline;
