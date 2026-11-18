import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiAlertTriangle, FiArrowLeft, FiCheckCircle, FiFlag, FiInfo } from 'react-icons/fi';
import { Card, PageHeader } from '../../../components/Layout';
import { AsyncContent } from '../../../components/Feedback';
import { Badge, RiskBadge, StatusBadge } from '../../../components/Badges';
import { fetchSubmission, updateReviewStatus } from '../../../redux/thunks/adminThunks';
import { useToast } from '../../../hooks/useToast';
import { formatDateTime } from '../../../utils/format';

const ResultPanel = ({ result, onReview, reviewing }) => (
  <Card
    title="Calculated result"
    action={<StatusBadge status={result.status} />}
  >
    {result.total && (
      <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="text-sm text-muted">{result.total.label}</p>
          <p className="text-4xl font-bold text-ink">{result.total.score}</p>
        </div>
        {result.total.band && (
          <div className="pb-1">
            <p className="font-semibold text-ink">{result.total.band.label}</p>
            {result.total.band.description && <p className="text-xs text-muted">{result.total.band.description}</p>}
          </div>
        )}
      </div>
    )}
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <RiskBadge level={result.riskLevel} />
      <StatusBadge status={result.reviewStatus} />
      {result.reviewedBy && (
        <span className="text-xs text-muted">
          by {result.reviewedBy.name} · {formatDateTime(result.reviewedAt)}
        </span>
      )}
    </div>

    {result.outputs?.map((o) => (
      <div key={o.key} className="mb-4 rounded-xl bg-canvas p-4 text-sm">
        <p className="font-semibold text-ink">{o.name}</p>
        <p className="mt-0.5 text-ink-soft">
          {o.value !== null && o.value !== undefined ? o.label : <span className="text-muted">{o.label}</span>} <span className="text-muted">(input {o.input})</span>
        </p>
        {o.note && <p className="mt-1 text-xs text-muted">{o.note}</p>}
      </div>
    ))}

    {result.subscales?.length > 0 && (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-3">Subscale</th>
              <th className="py-2 pr-3">Items</th>
              <th className="py-2 pr-3">Score</th>
              <th className="py-2">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {result.subscales.map((s) => (
              <tr key={s.key} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-3 font-medium text-ink">{s.name}</td>
                <td className="py-2.5 pr-3 text-xs text-muted">{s.itemIds.join(', ')}</td>
                <td className="py-2.5 pr-3 font-semibold text-ink">
                  {s.score}
                  {s.method === 'mean' && <span className="ml-1 text-xs font-normal text-muted">mean</span>}
                </td>
                <td className="py-2.5 text-ink-soft">
                  {s.band?.label}
                  {s.cutoff && (
                    <span className={s.meetsCutoff ? 'font-semibold text-risk-high' : 'text-muted'}>
                      {s.meetsCutoff ? `≥ ${s.cutoff.value}: ${s.cutoff.label}` : `Below cutoff (${s.cutoff.value})`}
                    </span>
                  )}
                  {!s.band && !s.cutoff && <span className="text-muted">Raw score</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {result.notes?.length > 0 && (
      <div className="mt-4 space-y-1.5">
        {result.notes.map((n) => (
          <p key={n} className="flex gap-2 text-xs text-muted">
            <FiInfo className="mt-0.5 shrink-0" /> {n}
          </p>
        ))}
      </div>
    )}
    <p className="mt-3 text-xs text-muted">Assessment outputs support clinical judgement; they are not independent diagnoses.</p>

    <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
      {result.reviewStatus !== 'reviewed' && (
        <button type="button" className="btn-primary" disabled={reviewing} onClick={() => onReview('reviewed')}>
          <FiCheckCircle /> Mark clinically reviewed
        </button>
      )}
      {result.reviewStatus !== 'flagged' && (
        <button type="button" className="btn-secondary" disabled={reviewing} onClick={() => onReview('flagged')}>
          <FiFlag /> Flag for review
        </button>
      )}
    </div>
  </Card>
);

const SubmissionPage = () => {
  const { assignmentId } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();
  const submission = useSelector((s) => s.patients.submission);
  const [reviewing, setReviewing] = useState(false);

  const load = () => dispatch(fetchSubmission(assignmentId));
  useEffect(() => {
    load();
  }, [assignmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const review = async (resultId, reviewStatus) => {
    setReviewing(true);
    try {
      await dispatch(updateReviewStatus({ resultId, reviewStatus })).unwrap();
      toast.success(reviewStatus === 'reviewed' ? 'Marked as reviewed' : 'Flagged for review');
      load();
    } catch (err) {
      toast.error(err);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <AsyncContent resource={submission} onRetry={load}>
      {({ assignment, version, response, result }) => {
        const answers = new Map((response?.answers || []).map((a) => [a.itemId, a]));
        const questions = [...version.questions].sort((a, b) => a.order - b.order);
        const sectionName = (key) => version.sections?.find((s) => s.key === key)?.name;
        const flags = result?.flags || [];
        let lastSection = null;
        return (
          <>
            <Link to={`/admin/patients/${assignment.patient._id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
              <FiArrowLeft /> {assignment.patient.fullName}
            </Link>
            <PageHeader
              title={version.name}
              eyebrow={
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-brand-600">{assignment.patient.patientCode}</span>
                  {assignment.attemptCode && <Badge tone="brand">Attempt {assignment.attemptCode}</Badge>}
                  <Badge tone="neutral">
                    {version.code} · version {version.version}
                  </Badge>
                </div>
              }
              subtitle={`Submitted ${formatDateTime(response?.submittedAt || assignment.completedAt)} · Respondent: ${version.respondent || '—'}`}
              showDate={false}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="order-2 space-y-6 xl:order-1">
                {flags.length > 0 && (
                  <section className="card border-red-200 p-5">
                    <h2 className="flex items-center gap-2 font-semibold text-red-700">
                      <FiAlertTriangle /> Items needing clinician attention
                    </h2>
                    <ul className="mt-3 space-y-2 text-sm">
                      {flags.map((f) => (
                        <li key={`${f.type}-${f.itemId}`} className="rounded-xl bg-red-50 p-3">
                          <span className="font-semibold">Q{f.questionNumber}.</span> {f.questionText}
                          <span className="block text-red-700">
                            Answer: {f.answerLabel} · {f.type === 'review_trigger' ? 'Matches a clinician-defined review trigger' : 'Sensitive item'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <Card title={`Responses (${answers.size}/${questions.length})`} bodyClassName="">
                  <ol className="divide-y divide-line">
                    {questions.map((q, i) => {
                      const a = answers.get(q.itemId);
                      const header = q.sectionKey && q.sectionKey !== lastSection ? sectionName(q.sectionKey) : null;
                      lastSection = q.sectionKey;
                      return (
                        <li key={q.itemId}>
                          {header && <div className="bg-brand-50 px-6 py-2 text-xs font-bold uppercase tracking-wide text-brand-700">{header}</div>}
                          <div className={`flex gap-4 px-6 py-3.5 ${q.sensitive ? 'bg-red-50/40' : ''}`}>
                            <span className="w-7 shrink-0 pt-0.5 text-sm font-semibold text-muted">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-ink">
                                {q.helpText && <span className="text-muted">{q.helpText} </span>}
                                {q.text}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-ink-soft">{a ? a.selectedLabel || a.text : <span className="font-normal text-muted">Not answered</span>}</p>
                            </div>
                            <div className="shrink-0 text-right text-xs text-muted">
                              {a?.score !== null && a?.score !== undefined && <div className="font-semibold text-ink">{a.score}</div>}
                              {q.reverseScored && <div>reverse</div>}
                              {q.excludedFromScoring && <div>excluded</div>}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              </div>
              <div className="order-1 space-y-6 xl:order-2">
                {result ? <ResultPanel result={result} reviewing={reviewing} onReview={(s) => review(result._id, s)} /> : <Card title="Result">Not calculated.</Card>}
                {version.discrepancies?.length > 0 && (
                  <Card title="Source discrepancies (awaiting confirmation)">
                    <ul className="list-disc space-y-2 pl-4 text-xs text-ink-soft">
                      {version.discrepancies.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            </div>
          </>
        );
      }}
    </AsyncContent>
  );
};

export default SubmissionPage;
