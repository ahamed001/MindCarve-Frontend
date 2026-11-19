import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiAlertTriangle,
  FiArrowDown,
  FiArrowRight,
  FiArrowUp,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiClipboard,
  FiFileText,
  FiList,
  FiMail,
  FiMapPin,
  FiMinusCircle,
  FiMoreHorizontal,
  FiPhone,
  FiTarget,
  FiUser,
  FiUsers,
  FiSliders,
  FiZap,
  FiActivity,
} from 'react-icons/fi';
import { DatePill } from '../../../components/Layout';
import { AsyncContent, EmptyState, Loader } from '../../../components/Feedback';
import { ConfirmationDialog } from '../../../components/Modal';
import PatientFormModal from './PatientFormModal';
import InvitationResultModal from './InvitationResultModal';
import { addClinicianNote, fetchAttemptReport, fetchPatientDetail, resendInvitation, setPatientStatus } from '../../../redux/thunks/adminThunks';
import { clearPatientDetail } from '../../../redux/slices/adminSlices';
import { useToast } from '../../../hooks/useToast';
import { formatDate, formatDateTime, GENDER_LABELS, initials } from '../../../utils/format';
import { useLiveEvent } from '../../../hooks/useLiveEvent';

// Every number on this page (scores, maxima, levels, counts, percentages, age) comes from the API.
// The browser only formats and displays it.

const MARITAL = { single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed', separated: 'Separated', prefer_not_to_say: 'Prefer not to say' };
const dash = (v) => (v === null || v === undefined || v === '' ? '-' : v);

// Visual style per tone. The server decides the tone; the browser only maps it to colours.
const TONE = {
  high: { text: 'text-brand-600', badge: 'border-brand-200 bg-brand-50 text-brand-600', bar: 'bg-brand-600', top: 'border-t-brand-600', icon: 'bg-brand-50 text-brand-600', Icon: FiArrowUp },
  mid: { text: 'text-emerald-700', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-600', top: 'border-t-emerald-600', icon: 'bg-emerald-50 text-emerald-600', Icon: FiCheckCircle },
  low: { text: 'text-navy', badge: 'border-blue-200 bg-blue-50 text-navy', bar: 'bg-navy', top: 'border-t-navy', icon: 'bg-blue-50 text-navy', Icon: FiArrowDown },
  alert: { text: 'text-red-600', badge: 'border-red-200 bg-red-50 text-red-600', bar: 'bg-red-600', top: 'border-t-red-600', icon: 'bg-red-50 text-red-600', Icon: FiAlertTriangle },
  warn: { text: 'text-amber-700', badge: 'border-amber-200 bg-amber-50 text-amber-700', bar: 'bg-amber-500', top: 'border-t-amber-500', icon: 'bg-amber-50 text-amber-600', Icon: FiAlertTriangle },
  ok: { text: 'text-emerald-700', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-600', top: 'border-t-emerald-600', icon: 'bg-emerald-50 text-emerald-600', Icon: FiCheckCircle },
  neutral: { text: 'text-ink', badge: 'border-line bg-white text-ink', bar: 'bg-stone-400', top: 'border-t-ink-soft', icon: 'bg-stone-100 text-ink-soft', Icon: FiArrowRight },
};
// Segment keys map to tones: screening cutoff "meets" = alert, "below" = ok, otherwise the key itself.
const segmentTone = (key) => (key === 'meets' ? 'alert' : key === 'below' ? 'ok' : key);
const SUBSCALE_ICONS = [FiUser, FiUsers, FiSliders, FiSliders, FiZap, FiActivity, FiTarget];

const Chip = ({ children, tone = 'plain' }) => (
  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone === 'brand' ? 'border-brand-100 bg-brand-50 text-brand-600' : tone === 'muted' ? 'border-line bg-stone-50 text-muted' : 'border-line bg-white text-ink'}`}>
    {children}
  </span>
);

const LevelBadge = ({ level }) => {
  if (!level?.label) return null;
  const style = TONE[level.tone] || TONE.neutral;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.badge}`} title={level.detail}>
      <style.Icon size={12} className="shrink-0" /> {level.label}
    </span>
  );
};

// ---------------------------------------------------------------- header + profile

const MoreMenu = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink-soft hover:bg-field" aria-label="More actions" aria-expanded={open}>
        <FiMoreHorizontal />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-line bg-white py-1 shadow-lg">
          {items.filter(Boolean).map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-field ${it.danger ? 'text-risk-high' : 'text-ink'}`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const InfoSection = ({ icon: Icon, title, rows }) => (
  <section className="border-b border-line py-4 first:pt-0 last:border-0 last:pb-0">
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
      <Icon className="text-navy" /> {title}
    </h3>
    <div className="space-y-2.5">
      {rows.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs text-muted">{label}</p>
          {value === null || value === undefined || value === '' ? (
            <p className="text-sm italic text-muted/80">Not filled</p>
          ) : (
            <p className="whitespace-pre-line break-words text-sm text-ink">{value}</p>
          )}
        </div>
      ))}
    </div>
  </section>
);

const ProfileCard = ({ patient }) => {
  const fullAddress = [patient.address, patient.city, patient.state, patient.pincode].filter(Boolean).join(', ');
  return (
    <aside className="card h-fit p-5">
      <InfoSection icon={FiPhone} title="Contact" rows={[['Phone', patient.phone], ['Email', patient.email]]} />
      <InfoSection
        icon={FiBriefcase}
        title="Background"
        rows={[
          ['Marital status', MARITAL[patient.maritalStatus]],
          ['Education', patient.education],
          ['Occupation', patient.occupation],
          ['Parent / guardian', patient.guardianName],
          ['Relevant information', patient.relevantInfo],
        ]}
      />
      <InfoSection icon={FiMapPin} title="Address" rows={[['Full address', fullAddress]]} />
      <InfoSection
        icon={FiCalendar}
        title="Registration"
        rows={[
          ['Registered on', formatDate(patient.createdAt)],
          ['Referred by', patient.referredBy],
        ]}
      />
    </aside>
  );
};

/** Staff-only notes about the patient. Adding one records an activity entry and an audit entry on the server. */
const NotesCard = ({ patientId, notes }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const add = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await dispatch(addClinicianNote({ id: patientId, body: body.trim() })).unwrap();
      setBody('');
      toast.success('Note added');
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <FiFileText className="text-navy" /> Notes
      </h3>
      <form onSubmit={add}>
        <label htmlFor="patient-note" className="sr-only">
          New note
        </label>
        <textarea id="patient-note" rows={3} maxLength={5000} className="input text-sm" placeholder="Add a note (visible to staff only)…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="mt-2 flex justify-end">
          <button type="submit" className="btn-primary px-3 py-1.5 text-xs" disabled={busy || !body.trim()}>
            {busy ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </form>
      {notes?.length > 0 && (
        <ul className="mt-3 space-y-2.5">
          {notes.map((n) => (
            <li key={n._id} className="rounded-xl bg-canvas p-3">
              <p className="whitespace-pre-wrap text-sm text-ink">{n.body}</p>
              <p className="mt-1.5 text-[0.6875rem] text-muted">
                {n.author?.name}
                {n.author?.role ? ` (${n.author.role})` : ''} · {formatDateTime(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// ---------------------------------------------------------------- score summary

const SubscaleCard = ({ subscale, index, kind, segments }) => {
  const { level } = subscale;
  const style = TONE[level?.tone] || TONE.neutral;
  const Icon = kind === 'cutoff' ? FiActivity : SUBSCALE_ICONS[index % SUBSCALE_ICONS.length];
  const scoreOnly = kind === 'score';
  return (
    <div className={`rounded-xl border border-line border-t-[3px] bg-white p-4 ${scoreOnly ? 'border-t-ink-soft' : style.top}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${scoreOnly ? TONE.neutral.icon : style.icon}`}>
          <Icon />
        </span>
        <p className={`text-sm font-medium leading-snug text-ink ${scoreOnly ? 'uppercase' : ''}`}>{subscale.name}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xl font-bold leading-none text-ink">
          {dash(subscale.score)}
          {kind === 'bands' && subscale.max !== null && <span className="ml-0.5 text-xs font-normal text-muted">/{subscale.max}</span>}
        </p>
        {!scoreOnly && <LevelBadge level={level} />}
      </div>
      {segments.length > 0 && (
        <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}>
          {segments.map((seg) => {
            const active = level?.position === seg.key;
            const segStyle = TONE[segmentTone(seg.key)] || TONE.neutral;
            return (
              <div key={seg.key}>
                <div className={`h-1.5 rounded-full ${active ? segStyle.bar : 'bg-stone-200'}`} />
                <p className={`mt-1 text-center text-[0.6875rem] ${active ? `font-semibold ${segStyle.text}` : 'text-muted'}`}>{seg.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ScoreSummary = ({ report }) => {
  const { score, assessment, assignment } = report;
  const notScored = !score || score.status !== 'scored';
  return (
    <section className="card relative overflow-hidden p-5">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-navy to-emerald-500" aria-hidden="true" />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <FiClipboard size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Score Summary</h2>
            <p className="text-xs text-muted">
              {assessment.name}
            </p>
          </div>
        </div>
      </div>

      {assignment.status !== 'completed' ? (
        <p className="pt-4 text-sm text-muted">This assessment is still in progress. Scores are calculated once it is submitted.</p>
      ) : notScored ? (
        <p className="pt-4 text-sm text-muted">{score?.notes?.[0] || 'Scores are not available for this assessment.'}</p>
      ) : (
        <>
          {score.total && (
            <div className="mt-4 inline-flex max-w-full flex-wrap items-center gap-3 rounded-xl bg-blue-50/70 px-4 py-3">
              <FiTarget className="shrink-0 text-navy" size={18} />
              <div>
                <p className="text-xs text-ink-soft">Total score</p>
                <p className="text-2xl font-bold leading-none text-navy">
                  {score.total.score}
                  {score.total.max !== null && <span className="ml-1 text-sm font-medium text-muted">/ {score.total.max}</span>}
                </p>
              </div>
              <LevelBadge level={score.total.level} />
            </div>
          )}
          {score.total?.level?.detail && <p className="mt-2 text-xs text-muted">{score.total.level.detail}</p>}
          {score.outputs?.map((o) => (
            <p key={o.key} className="mt-2 text-sm text-ink-soft">
              {o.name}: <span className={`font-semibold ${o.value === null ? 'text-muted' : 'text-ink'}`}>{o.label}</span>
            </p>
          ))}

          {score.subscales.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              {score.chips.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-ink-soft">{score.groupLabel}</span>
                  {score.chips.map((chip) => {
                    const style = TONE[chip.tone] || TONE.neutral;
                    return (
                      <span key={chip.key} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
                        <style.Icon size={12} /> {chip.count} {chip.label}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {score.subscales.map((sub, i) => (
                  <SubscaleCard key={sub.key} subscale={sub} index={i} kind={score.kind} segments={score.segments} />
                ))}
              </div>
            </div>
          )}

          {score.rangeNote && <p className="mt-4 text-xs text-muted">{score.rangeNote}</p>}
        </>
      )}
    </section>
  );
};

// ---------------------------------------------------------------- responses

const Stat = ({ icon: Icon, value, label, tone }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2">
    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
      <Icon />
    </span>
    <div>
      <p className="text-base font-semibold leading-none text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  </div>
);

const ResponsesCard = ({ report }) => {
  const [filter, setFilter] = useState('all');
  const { summary, questions, assessment } = report;
  const shown = questions.filter((q) => filter === 'all' || (filter === 'answered' ? q.answered : !q.answered));
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold text-ink">{assessment.name}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <Stat icon={FiCheckCircle} value={summary.answered} label="Answered" tone="bg-emerald-50 text-emerald-600" />
        <Stat icon={FiMinusCircle} value={summary.notAttended} label="Not attended" tone="bg-stone-100 text-muted" />
        <Stat icon={FiList} value={summary.questions} label="Questions" tone="bg-blue-50 text-navy" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-y border-line py-3">
        {[
          ['all', 'All'],
          ['answered', 'Answered'],
          ['not', 'Not attended'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${filter === key ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-line bg-white text-ink hover:border-brand-200'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {shown.length ? (
        <ol className="divide-y divide-line">
          {shown.map((q) => (
            <li key={q.itemId} className="flex gap-3 py-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-600">{q.number}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  {q.helpText && <span className="text-muted">{q.helpText} </span>}
                  {q.text}
                </p>
                {q.answered ? (
                  <span className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-sm text-emerald-700">
                    <FiCheckCircle /> {['yes', 'no'].includes(String(q.answerLabel).toLowerCase()) ? q.answerLabel.toUpperCase() : q.answerLabel}
                    {q.score !== null && (
                      <span className="rounded-md border border-blue-200 bg-white px-2 py-0.5 text-xs font-medium text-navy" title={q.reversed ? 'Reverse-scored item' : undefined}>
                        Score {q.score}
                        {q.reversed ? ' (R)' : ''}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="mt-2 inline-flex items-center gap-2 rounded-lg border border-line bg-stone-50 px-2.5 py-1.5 text-xs text-muted">
                    <FiMinusCircle /> Not attended
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="Nothing to show" />
      )}
    </section>
  );
};

// ---------------------------------------------------------------- assessments list

const ProgressRing = ({ percent }) => {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#FDE4D8" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E8571F" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * percent) / 100} />
      </svg>
      <span className="text-[0.625rem] font-semibold text-ink">{percent}%</span>
    </span>
  );
};

/** One row per published assessment (from the API), with this patient's latest attempt and progress. */
const AssessmentsCard = ({ rows, completedCount, selectedKey, onSelect, onReport }) => {
  const anyStarted = rows.some((r) => r.attempt);
  const STATE_TEXT = { completed: 'Completed', in_progress: 'In progress', not_started: 'Not started' };
  return (
    <aside className="card h-fit p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FiFileText className="text-navy" /> Assessments
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {completedCount} {completedCount === 1 ? 'quiz' : 'quizzes'} attended
          </p>
        </div>
        <button type="button" className="btn-primary px-3 py-1.5 text-xs" disabled={!anyStarted} onClick={onReport} title="Open a printable report of all this patient's assessments">
          <FiFileText /> Report
        </button>
      </div>
      <ul className="space-y-2.5">
        {rows.map((r) => {
          const active = r.assessmentId === selectedKey;
          const progress = r.attempt?.progress;
          return (
            <li key={r.assessmentId}>
              <button
                type="button"
                onClick={() => onSelect(r.assessmentId)}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? 'border-brand-500 bg-brand-50/60' : 'border-line bg-white hover:border-brand-200'}`}
              >
                <ProgressRing percent={progress?.percentAnswered ?? 0} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug text-ink">{r.name}</span>
                  {r.archived && <span className="mt-0.5 inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase text-muted">Archived</span>}
                  <span className="mt-0.5 block text-xs text-muted">
                    {progress ? `${progress.answeredCount} of ${progress.questionCount} answered` : STATE_TEXT.not_started}
                    {r.state !== 'completed' && progress && ` · ${STATE_TEXT[r.state].toLowerCase()}`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

// ---------------------------------------------------------------- page

const PatientDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();
  const detail = useSelector((s) => s.patients.detail);
  const report = useSelector((s) => s.patients.report);
  const isAdmin = useSelector((s) => s.auth.user?.role === 'admin');
  const [selectedKey, setSelectedKey] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const load = () => dispatch(fetchPatientDetail(id));
  // Live: while staff look at this patient, answers appear as the patient clicks them.
  const refreshLive = () => {
    load();
    if (attemptIdRef.current) dispatch(fetchAttemptReport(attemptIdRef.current));
  };
  const attemptIdRef = useRef(null);
  useLiveEvent('quiz:progress', (p) => p.patient === id && refreshLive(), { delay: 600 });
  useLiveEvent('activity:new', (a) => a.patient === id && refreshLive(), { delay: 600 });
  useEffect(() => {
    load();
    return () => dispatch(clearPatientDetail());
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = detail.data?.assessments || [];
  const selectedRow = rows.find((r) => r.assessmentId === selectedKey);
  const attemptId = selectedRow?.attempt?._id || null;
  attemptIdRef.current = attemptId;

  // Default selection: the first completed assessment, otherwise the first one in progress, otherwise the first card.
  useEffect(() => {
    if (!rows.length || rows.some((r) => r.assessmentId === selectedKey)) return;
    const first = rows.find((r) => r.state === 'completed') || rows.find((r) => r.state === 'in_progress') || rows[0];
    setSelectedKey(first.assessmentId);
  }, [rows, selectedKey]);

  useEffect(() => {
    if (attemptId) dispatch(fetchAttemptReport(attemptId));
  }, [attemptId, dispatch]);

  const runConfirm = async () => {
    setBusy(true);
    try {
      await confirm.action();
      setConfirm(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink">Patients</h1>
          <p className="mt-1 text-sm text-muted">Everyone registered on the platform</p>
        </div>
        <DatePill />
      </div>
      <Link to="/admin/patients" className="mb-4 inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-brand-200">
        <FiChevronLeft /> All patients
      </Link>

      <AsyncContent resource={detail} onRetry={load}>
        {({ patient }) => {
          const invitePending = patient.accountStatus === 'invited';
          return (
            <>
              <section className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100/70 text-base font-semibold text-brand-600">{initials(patient.fullName)}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-ink">{patient.fullName}</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip>Patient ID {patient.patientCode}</Chip>
                    {patient.ageYears !== null && patient.ageYears !== undefined && <Chip>{patient.ageYears} yrs</Chip>}
                    {patient.gender && <Chip>{GENDER_LABELS[patient.gender]}</Chip>}
                    {patient.city && <Chip>{patient.city}</Chip>}
                    <Chip tone={patient.declaration?.accepted ? 'brand' : 'muted'}>{patient.declaration?.accepted ? 'Declaration signed' : 'Declaration pending'}</Chip>
                    <Chip tone={patient.status === 'active' ? 'brand' : 'muted'}>{patient.status === 'active' ? 'Active' : 'Inactive'}</Chip>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {patient.phone && (
                    <a href={`tel:${patient.phone.replace(/\s/g, '')}`} className="btn-primary px-4 py-2">
                      <FiPhone /> Call
                    </a>
                  )}
                  <a href={`mailto:${patient.email}`} className="btn-secondary px-4 py-2">
                    <FiMail /> Email
                  </a>
                  {isAdmin && (
                    <MoreMenu
                      items={[
                        { label: 'Edit details', onClick: () => setEditOpen(true) },
                        invitePending &&
                          patient.status === 'active' && {
                            label: 'Resend invitation',
                            onClick: async () => {
                              try {
                                setInviteResult(await dispatch(resendInvitation(patient._id)).unwrap());
                              } catch (err) {
                                toast.error(err);
                              }
                            },
                          },
                        {
                          label: patient.status === 'active' ? 'Deactivate patient' : 'Reactivate patient',
                          danger: patient.status === 'active',
                          onClick: () =>
                            setConfirm({
                              title: patient.status === 'active' ? 'Deactivate patient?' : 'Reactivate patient?',
                              message: patient.status === 'active' ? 'The patient will be signed out and unable to sign in. Records are kept.' : 'The patient will be able to sign in again.',
                              label: patient.status === 'active' ? 'Deactivate' : 'Reactivate',
                              danger: patient.status === 'active',
                              action: async () => {
                                await dispatch(setPatientStatus({ id: patient._id, status: patient.status === 'active' ? 'inactive' : 'active' })).unwrap();
                                toast.success('Patient status updated');
                              },
                            }),
                        },
                      ]}
                    />
                  )}
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[270px_minmax(0,1fr)_300px]">
                {/* Left column sticks while the middle scrolls. Below 2xl it also holds the assessments list. */}
                <div className="space-y-5 lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:self-start lg:overflow-y-auto">
                  <div className="2xl:hidden">
                    <AssessmentsCard rows={rows} completedCount={detail.data.completedCount} selectedKey={selectedKey} onSelect={setSelectedKey} onReport={() => window.open(`/admin/print/${detail.data.patient._id}`, '_blank', 'noopener')} />
                  </div>
                  <ProfileCard patient={patient} />
                  <NotesCard patientId={patient._id} notes={detail.data.notes} />
                </div>
                <div className="min-w-0 space-y-5">
                  {!selectedRow ? (
                    <Loader />
                  ) : !attemptId ? (
                    <section className="card">
                      <EmptyState title={`${selectedRow.name} — not started`} message="Scores and answers appear here once the patient starts this quiz." />
                    </section>
                  ) : report.status === 'failed' ? (
                    <section className="card p-6 text-sm text-risk-high">{report.error}</section>
                  ) : !report.data || report.data.assignment._id !== attemptId ? (
                    <Loader />
                  ) : (
                    <>
                      <ScoreSummary report={report.data} />
                      <ResponsesCard key={attemptId} report={report.data} />
                    </>
                  )}
                </div>
                <div className="hidden 2xl:sticky 2xl:top-5 2xl:block 2xl:max-h-[calc(100vh-2.5rem)] 2xl:self-start 2xl:overflow-y-auto">
                  <AssessmentsCard rows={rows} completedCount={detail.data.completedCount} selectedKey={selectedKey} onSelect={setSelectedKey} onReport={() => window.open(`/admin/print/${detail.data.patient._id}`, '_blank', 'noopener')} />
                </div>
              </div>

              <PatientFormModal open={editOpen} patient={patient} onClose={() => setEditOpen(false)} />
            </>
          );
        }}
      </AsyncContent>
      <ConfirmationDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        tone={confirm?.danger ? 'danger' : 'primary'}
        busy={busy}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
      <InvitationResultModal result={inviteResult} onClose={() => setInviteResult(null)} />
    </>
  );
};

export default PatientDetailPage;
