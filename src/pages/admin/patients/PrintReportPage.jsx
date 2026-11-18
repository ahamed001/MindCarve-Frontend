import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiPrinter } from 'react-icons/fi';
import { ErrorState, Loader } from '../../../components/Feedback';
import { fetchPatientReport } from '../../../redux/thunks/adminThunks';
import { formatDate, GENDER_LABELS } from '../../../utils/format';

// Printable report of ALL of a patient's assessments. Opened in a new tab from the patient page.
// Every value comes from GET /api/patients/:id/report (calculated on the server).
// The browser's print dialog opens automatically once the page has loaded.

const dash = (v) => (v === null || v === undefined || v === '' ? '-' : v);
const upperYesNo = (label) => (['yes', 'no'].includes(String(label).toLowerCase()) ? label.toUpperCase() : label);

const Field = ({ label, children }) => (
  <div>
    <p className="text-[0.8125rem] text-muted">{label}</p>
    <p className="mt-0.5 text-[0.9375rem] text-ink">{children}</p>
  </div>
);

const ScoresBox = ({ section }) => {
  const { score, state } = section;
  if (state !== 'completed') return <p className="mt-4 text-sm text-muted">In progress — scores are calculated once the assessment is submitted.</p>;
  if (!score || score.status !== 'scored') return <p className="mt-4 text-sm text-muted">{score?.notes?.[0] || 'Scores are not available for this assessment.'}</p>;
  return (
    <div className="print-avoid-break mt-4 rounded-xl border border-line p-5">
      <h3 className="text-[0.9375rem] font-semibold text-ink">Scores</h3>
      {score.total && (
        <p className="mt-3 text-[0.9375rem] text-ink">
          <span className="text-muted">Total score: </span>
          <span className="font-semibold">
            {score.total.score}
            {score.total.max !== null && ` / ${score.total.max}`}
          </span>
          {score.total.level?.label && <span className="ml-2 font-medium text-brand-600">· {score.total.level.label}</span>}
        </p>
      )}
      {score.total?.level?.detail && <p className="mt-1 text-xs text-muted">{score.total.level.detail}</p>}
      {score.outputs?.map((o) => (
        <p key={o.key} className="mt-2 text-[0.9375rem] text-ink">
          <span className="text-muted">{o.name}: </span>
          <span className="font-semibold">{o.label}</span>
        </p>
      ))}
      {score.subscales.length > 0 && (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[0.8125rem] text-muted">
              <th className="py-2 pr-4 font-medium">{score.groupLabel}</th>
              <th className="py-2 pr-4 font-medium">Score</th>
              {score.kind !== 'score' && <th className="py-2 font-medium">Level</th>}
            </tr>
          </thead>
          <tbody>
            {score.subscales.map((s) => (
              <tr key={s.key} className="border-b border-line last:border-0">
                <td className="py-2 pr-4 text-ink">{s.name}</td>
                <td className="py-2 pr-4 font-semibold text-ink">
                  {dash(s.score)}
                  {s.max !== null && <span className="font-normal text-muted"> / {s.max}</span>}
                </td>
                {score.kind !== 'score' && <td className="py-2 text-brand-600">{dash(s.level?.label)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {score.rangeNote && <p className="mt-3 text-xs text-muted">{score.rangeNote}</p>}
    </div>
  );
};

const AssessmentSection = ({ section, first }) => (
  // Each assessment after the first starts on a new printed page.
  <section className={`mt-8 ${first ? '' : 'print:break-before-page print:mt-0'}`}>
    <h2 className="border-b-2 border-brand-500 pb-2 text-lg font-semibold text-ink">{section.assessment.name}</h2>
    <p className="mt-3 text-sm text-muted">
      {section.summary.answered} answered · {section.summary.notAttended} not attended · {section.summary.questions} questions
      {section.assignment.completedAt && ` · completed ${formatDate(section.assignment.completedAt)}`}
    </p>
    <ScoresBox section={section} />
    <ol className="mt-4 border-t border-line">
      {section.questions.map((q) => (
        <li key={q.itemId} className="print-avoid-break flex gap-3 border-b border-line py-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-600">{q.number}</span>
          <div className="min-w-0">
            <p className="text-[0.9375rem] text-ink">
              {q.helpText && <span className="text-muted">{q.helpText} </span>}
              {q.text}
            </p>
            {q.answered ? (
              <p className="mt-1 flex flex-wrap items-center gap-2.5 text-[0.9375rem] font-medium text-brand-600">
                {upperYesNo(q.answerLabel)}
                {q.score !== null && (
                  <span className="rounded border border-brand-200 bg-brand-50 px-1.5 py-px text-xs font-medium text-brand-600">
                    Score {q.score}
                    {q.reversed ? ' (R)' : ''}
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">Not attended</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  </section>
);

const PrintReportPage = () => {
  const { patientId } = useParams();
  const dispatch = useDispatch();
  const report = useSelector((s) => s.patients.printReport);
  const printed = useRef(false);

  useEffect(() => {
    dispatch(fetchPatientReport(patientId));
  }, [dispatch, patientId]);

  const data = report.data?.patient?._id === patientId ? report.data : null;

  useEffect(() => {
    if (!data || printed.current) return undefined;
    printed.current = true;
    document.title = `${data.patient.fullName} – assessment report`;
    const timer = setTimeout(() => window.print(), 600); // let fonts and layout settle first
    return () => clearTimeout(timer);
  }, [data]);

  if (report.status === 'failed') return <ErrorState message={report.error} onRetry={() => dispatch(fetchPatientReport(patientId))} />;
  if (!data) return <Loader className="min-h-screen" label="Preparing report…" />;

  const { patient, sections, notStarted } = data;
  const ageGender = [patient.ageYears !== null && patient.ageYears !== undefined ? `${patient.ageYears} yrs` : null, patient.gender ? GENDER_LABELS[patient.gender] : null]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1100px] px-6 py-8 sm:px-10 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-bold text-ink">{patient.fullName}</h1>
            <p className="mt-1 text-[0.9375rem] text-muted">Assessment report · Generated on {formatDate(data.generatedAt)}</p>
          </div>
          <button type="button" onClick={() => window.print()} className="btn-primary print:hidden">
            <FiPrinter /> Print
          </button>
        </div>

        <section className="print-avoid-break grid gap-x-10 gap-y-4 rounded-xl border border-line p-5 sm:grid-cols-2 print:grid-cols-2">
          <Field label="Patient ID">{dash(patient.patientCode)}</Field>
          <Field label="Age / Gender">{dash(ageGender)}</Field>
          <Field label="Phone">{dash(patient.phone)}</Field>
          <Field label="Email">{dash(patient.email)}</Field>
          <Field label="Address">{dash(patient.address)}</Field>
          <Field label="Registered on">{formatDate(patient.registeredOn)}</Field>
        </section>

        {sections.length ? (
          sections.map((section, i) => <AssessmentSection key={section.assignment._id} section={section} first={i === 0} />)
        ) : (
          <p className="mt-8 text-sm text-muted">This patient has not started any assessments yet.</p>
        )}

        {notStarted.length > 0 && sections.length > 0 && <p className="mt-8 text-sm text-muted">Not started: {notStarted.join(', ')}.</p>}

        <p className="mt-6 text-xs text-muted">Assessment outputs support clinical judgement; they are not independent diagnoses.</p>
      </div>
    </div>
  );
};

export default PrintReportPage;
