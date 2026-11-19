import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArchive, FiArrowDown, FiArrowUp, FiCheck, FiChevronLeft, FiEdit2, FiPlus, FiRotateCcw, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { DatePill } from '../../../components/Layout';
import { AsyncContent, EmptyState } from '../../../components/Feedback';
import { Badge, StatusBadge } from '../../../components/Badges';
import { ConfirmationDialog } from '../../../components/Modal';
import { SearchBar } from '../../../components/Table';
import QuestionEditorModal from './QuestionEditorModal';
import AssessmentFormModal from './AssessmentFormModal';
import * as t from '../../../redux/thunks/adminThunks';
import { useToast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/format';

const TYPE_TAG = {
  yes_no: 'Yes / No',
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  rating_scale: 'Likert',
  frequency_scale: 'Frequency',
  percentage_scale: 'Percentage',
  text: 'Text',
};

const Detail = ({ label, children }) => (
  <div>
    <p className="text-xs text-muted">{label}</p>
    <div className="text-sm text-ink">{children}</div>
  </div>
);

/** Left column: "About this quiz" + recent patient reports (real completed submissions). */
const AboutPanel = ({ assessment }) => {
  const dispatch = useDispatch();
  const submissions = useSelector((s) => s.assessments.submissions);
  useEffect(() => {
    dispatch(t.fetchAssessmentSubmissions(assessment._id));
  }, [dispatch, assessment._id]);

  return (
    <aside className="card h-fit space-y-5 p-5">
      <div>
        <h3 className="text-sm font-semibold text-ink">About this quiz</h3>
        <div className="mt-3 space-y-3">
          <Detail label="Description">{assessment.description || '—'}</Detail>
          {assessment.instructions && <Detail label="Instructions">{assessment.instructions}</Detail>}
        </div>
      </div>
      <div className="space-y-3 border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-ink">Details</h3>
        <Detail label="Category">{assessment.category || '—'}</Detail>
        <Detail label="Status">
          <span className="mt-0.5 inline-block">
            <StatusBadge status={assessment.status} />
          </span>
        </Detail>
        <Detail label="Questions">{assessment.questions.length}</Detail>
        <Detail label="Respondent">{assessment.respondent || '—'}</Detail>
        {assessment.timeframe && <Detail label="Time period">{assessment.timeframe}</Detail>}
        <Detail label="Added on">{formatDate(assessment.createdAt)}</Detail>
        <Detail label="Published version">{assessment.currentVersion ? `v${assessment.currentVersion}` : 'Not published'}</Detail>
      </div>
      <div className="border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-ink">Patient Reports</h3>
        <p className="mt-0.5 text-xs text-muted">Recent completed submissions with calculated scores.</p>
        {submissions.status === 'loading' && !submissions.data.length ? (
          <p className="mt-3 text-xs text-muted">Loading…</p>
        ) : submissions.data.length ? (
          <ul className="mt-3 space-y-2">
            {submissions.data.map((s) => (
              <li key={s._id}>
                <Link to={`/admin/submissions/${s._id}`} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm hover:border-brand-200 hover:bg-brand-50">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{s.patient?.fullName}</span>
                    <span className="text-xs text-muted">
                      {s.patient?.patientCode} · {formatDate(s.completedAt)}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-brand-600">View</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted">No completed submissions yet.</p>
        )}
      </div>
    </aside>
  );
};

const QuestionsTab = ({ assessment, editable, onEdit, onDelete, onMove }) => {
  const [query, setQuery] = useState('');
  const subscalesFor = (itemId) => assessment.scoring.subscales.filter((s) => s.itemIds.includes(itemId)).map((s) => s.name);
  const sectionName = (key) => assessment.sections.find((s) => s.key === key)?.name;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assessment.questions.map((question, index) => ({ question, index })).filter(({ question }) => !q || question.text.toLowerCase().includes(q));
  }, [assessment.questions, query]);

  let lastSection = null;
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <AboutPanel assessment={assessment} />
      <div className="min-w-0 space-y-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search questions" />
        <section className="card px-5 py-2">
          {!assessment.questions.length ? (
            <EmptyState title="No questions yet" message="Add the first question to this assessment." />
          ) : !visible.length ? (
            <EmptyState title="No matching questions" />
          ) : (
            <ol className="divide-y divide-line">
              {visible.map(({ question: q, index: i }) => {
                const header = !query && q.sectionKey && q.sectionKey !== lastSection ? sectionName(q.sectionKey) : null;
                lastSection = q.sectionKey;
                const subs = subscalesFor(q.itemId);
                return (
                  <li key={q._id}>
                    {header && <div className="-mx-5 mt-2 bg-brand-50 px-5 py-2 text-xs font-bold uppercase tracking-wide text-brand-700">{header}</div>}
                    <div className="group flex gap-3 py-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100/70 text-xs font-bold text-brand-600">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {q.helpText && <span className="font-normal text-muted">{q.helpText} </span>}
                          {q.text}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded bg-stone-100 px-2 py-0.5 text-[0.6875rem] font-medium text-ink-soft">{TYPE_TAG[q.type]}</span>
                          {q.reverseScored && <Badge tone="blue">Reverse-scored</Badge>}
                          {q.excludedFromScoring && <Badge tone="slate">Excluded</Badge>}
                          {q.sensitive && <Badge tone="red">Sensitive</Badge>}
                          {q.reviewTriggerValues?.length > 0 && <Badge tone="red">Review trigger</Badge>}
                          {!q.required && <Badge tone="amber">Optional</Badge>}
                          {subs.map((s) => (
                            <Badge key={s} tone="brand">
                              {s}
                            </Badge>
                          ))}
                        </div>
                        {q.options.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {q.options.map((o) => {
                              // Yes/No items: highlight the answer that scores a point (e.g. GDS answers indicating depression).
                              const keyed = q.type === 'yes_no' && o.score > 0;
                              return (
                                <span
                                  key={o.value}
                                  className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs ${keyed ? 'border-brand-500 bg-brand-50 font-semibold text-brand-600' : 'border-line bg-white text-ink'} ${q.type === 'yes_no' ? 'uppercase' : ''}`}
                                  title={keyed ? 'Scores 1 point' : o.description}
                                >
                                  <span className={`rounded px-1 ${keyed ? 'bg-white' : 'bg-stone-100 text-muted'}`}>{o.score ?? '–'}</span>
                                  {o.label}
                                  {o.description && <span className="normal-case text-muted">({o.description})</span>}
                                  {keyed && <FiCheck aria-hidden="true" />}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {editable && (
                        <div className="flex shrink-0 items-start gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                          <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink disabled:opacity-30" disabled={i === 0 || Boolean(query)} onClick={() => onMove(i, -1)} aria-label="Move up">
                            <FiArrowUp />
                          </button>
                          <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink disabled:opacity-30" disabled={i === assessment.questions.length - 1 || Boolean(query)} onClick={() => onMove(i, 1)} aria-label="Move down">
                            <FiArrowDown />
                          </button>
                          <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink" onClick={() => onEdit(q)} aria-label="Edit question">
                            <FiEdit2 />
                          </button>
                          <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-risk-high" onClick={() => onDelete(q, subs)} aria-label="Delete question">
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
};

const AssessmentBuilderPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const current = useSelector((s) => s.assessments.current);
  const isAdmin = useSelector((s) => s.auth.user?.role === 'admin');
  const toast = useToast();
  const [editor, setEditor] = useState({ open: false, question: null });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => dispatch(t.fetchAssessment(id));
  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Runs a thunk with a busy flag and a toast; returns true on success. */
  const run = async (action, successMessage) => {
    setSaving(true);
    try {
      const res = await dispatch(action).unwrap();
      toast.success(successMessage || res?.__message || 'Saved');
      return true;
    } catch (err) {
      toast.error(err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink">Questions &amp; Answers</h1>
          <p className="mt-1 text-sm text-muted">How patients respond to each assessment question</p>
        </div>
        <DatePill />
      </div>
      <Link to="/admin/questions" className="mb-4 inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-brand-200">
        <FiChevronLeft /> All quizzes
      </Link>

      <AsyncContent resource={current} onRetry={load}>
        {(a) => {
          if (a._id !== id) return null;
          const archived = a.status === 'archived';
          const editable = isAdmin && !archived;
          const canPublish = !archived && a.questions.length > 0 && (a.hasUnpublishedChanges || !a.currentVersion);
          const nextVersion = (a.currentVersion || 0) + 1;

          const move = (index, dir) => {
            const ids = a.questions.map((q) => q._id);
            [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
            run(t.reorderQuestions({ id: a._id, orderedIds: ids }), 'Order saved');
          };
          const saveQuestion = async (data) => {
            const ok = editor.question
              ? await run(t.updateQuestion({ questionId: editor.question._id, data }), 'Question saved')
              : await run(t.addQuestion({ id: a._id, data }), 'Question added');
            if (ok) setEditor({ open: false, question: null });
          };

          return (
            <>
              <section className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.category && <span className="rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-600">{a.category}</span>}
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[0.6875rem] font-bold text-ink-soft">{a.code}</span>
                    {a.status !== 'published' && <StatusBadge status={a.status} />}
                    {a.currentVersion > 0 && a.hasUnpublishedChanges && !archived && <Badge tone="amber">Unpublished changes</Badge>}
                    {a.scoring.status === 'awaiting_configuration' && <Badge tone="slate">Scoring awaiting configuration</Badge>}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-ink">{a.name}</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {a.questions.length} questions, added {formatDate(a.createdAt)}
                    {a.currentVersion > 0 ? ` · live version v${a.currentVersion}` : ' · not published yet'}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2">
                    {archived ? (
                      <button type="button" className="btn-secondary px-3 py-2 text-xs" disabled={saving} onClick={() => run(t.restoreAssessment(a._id), 'Assessment restored')}>
                        <FiRotateCcw /> Restore
                      </button>
                    ) : (
                      <>
                        <button type="button" className="btn-ghost px-3 py-2 text-xs" onClick={() => setDetailsOpen(true)}>
                          <FiEdit2 /> Edit details
                        </button>
                        <button
                          type="button"
                          className="btn-ghost px-3 py-2 text-xs"
                          onClick={() =>
                            setConfirm({
                              title: 'Archive this assessment?',
                              message: 'Patients will no longer see it on their Take a Quiz screen. Existing attempts and results are kept, and you can restore it any time.',
                              label: 'Archive',
                              danger: true,
                              action: () => run(t.archiveAssessment(a._id), 'Assessment archived'),
                            })
                          }
                        >
                          <FiArchive /> Archive
                        </button>
                        <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setEditor({ open: true, question: null })}>
                          <FiPlus /> Add question
                        </button>
                        <button
                          type="button"
                          className="btn-primary px-3 py-2 text-xs"
                          disabled={saving || !canPublish}
                          title={!a.questions.length ? 'Add at least one question first' : !canPublish ? 'No changes to publish' : undefined}
                          onClick={() =>
                            setConfirm({
                              title: `Publish version ${nextVersion}?`,
                              message:
                                nextVersion === 1
                                  ? 'Patients will see this assessment on their Take a Quiz screen.'
                                  : `New attempts will use version ${nextVersion}. Attempts already started or completed stay on the version they began with, so their answers and scores don’t change.`,
                              label: `Publish v${nextVersion}`,
                              action: () => run(t.publishAssessment(a._id), `Published as version ${nextVersion}`),
                            })
                          }
                        >
                          <FiUploadCloud /> Publish
                        </button>
                      </>
                    )}
                  </div>
                )}
              </section>

              <QuestionsTab
                assessment={a}
                editable={editable}
                onMove={move}
                onEdit={(q) => setEditor({ open: true, question: q })}
                onDelete={(q, subs) =>
                  subs.length
                    ? toast.error({ message: `This question is used by the scoring of ${subs.join(', ')}, so it can’t be deleted.` })
                    : setConfirm({
                        title: 'Delete this question?',
                        message: `“${q.text}” will be removed from the draft. Patients keep seeing it until you publish, and past answers are not affected.`,
                        label: 'Delete',
                        danger: true,
                        action: () => run(t.deleteQuestion(q._id), 'Question deleted'),
                      })
                }
              />

              <QuestionEditorModal
                open={editor.open}
                question={editor.question}
                defaultType={a.primaryQuestionType}
                saving={saving}
                onSave={saveQuestion}
                onClose={() => setEditor({ open: false, question: null })}
              />
              <AssessmentFormModal
                open={detailsOpen}
                assessment={a}
                saving={saving}
                onSubmit={async (values) => {
                  if (await run(t.updateAssessment({ id: a._id, data: values }), 'Details saved')) setDetailsOpen(false);
                }}
                onClose={() => setDetailsOpen(false)}
              />
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
        busy={saving}
        onConfirm={async () => {
          await confirm.action();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
};

export default AssessmentBuilderPage;
