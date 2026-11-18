import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiCheckCircle, FiCheckSquare, FiChevronDown, FiClock, FiHelpCircle } from 'react-icons/fi';
import { ErrorState, Loader } from '../../../components/Feedback';
import { fetchMyAssignment, fetchMyQuizzes, saveProgress, startQuiz, submitAssessment } from '../../../redux/thunks/portalThunks';
import { resetSession } from '../../../redux/slices/portalSlice';
import { useToast } from '../../../hooks/useToast';
import { QUESTION_TYPE_LABELS } from '../../../utils/format';

// Choice answers save immediately on click; free-text answers save after the user pauses typing.
const TEXT_SAVE_MS = 800;
const BLOCK_SIZE = 10;

const isAnswered = (q, a) => {
  if (!a) return false;
  if (q.type === 'text') return Boolean(a.text?.trim());
  if (q.type === 'multiple_choice') return Boolean(a.values?.length);
  return Boolean(a.value);
};

/** ~20 seconds per question, shown as a range like "3-4 mins". */
const estimate = (n) => {
  const lo = Math.max(1, Math.round((n * 20) / 60));
  return `${lo}-${lo + 1} mins`;
};

/** Question blocks: one per section when the assessment has sections, otherwise groups of 10. */
const buildBlocks = (assessment) => {
  const qs = assessment.questions;
  if (assessment.sections?.length && qs.some((q) => q.sectionKey)) {
    return [...assessment.sections]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ key: s.key, title: s.name, questions: qs.filter((q) => q.sectionKey === s.key) }))
      .filter((b) => b.questions.length);
  }
  const blocks = [];
  for (let i = 0; i < qs.length; i += BLOCK_SIZE) blocks.push({ key: `b${i}`, title: null, questions: qs.slice(i, i + BLOCK_SIZE) });
  return blocks;
};

const scrollToQuestion = (itemId) => document.getElementById(`question-${itemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

// ---------------------------------------------------------------- question card

const OptionPill = ({ option, selected, onClick, disabled }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    disabled={disabled}
    onClick={onClick}
    className={`rounded-full border px-6 py-3 text-[0.9375rem] font-medium transition ${
      selected ? 'border-teal-600 bg-teal-600 text-white shadow-[0_6px_14px_rgba(13,148,136,0.3)]' : 'border-line bg-white text-ink hover:border-teal-300 hover:bg-teal-50/50'
    }`}
  >
    {option.label}
    {option.description && <span className={`ml-1.5 text-xs ${selected ? 'text-white/80' : 'text-muted'}`}>({option.description})</span>}
  </button>
);

const SAVE_CHIP = {
  saving: ['Saving…', 'bg-stone-100 text-ink-soft'],
  saved: ['✓ Saved', 'bg-emerald-50 text-emerald-700'],
  error: ['Not saved', 'bg-red-50 text-red-700'],
};

const QuestionCard = ({ question, answer, onAnswer, disabled, saveStatus }) => {
  const toggle = (value) => {
    const values = answer?.values || [];
    onAnswer({ itemId: question.itemId, values: values.includes(value) ? values.filter((v) => v !== value) : [...values, value] });
  };
  return (
    <article id={`question-${question.itemId}`} className={`relative scroll-mt-32 rounded-[18px] border bg-white px-6 pb-8 pt-12 text-center shadow-[0_2px_10px_rgba(30,41,59,0.03)] transition sm:px-10 ${isAnswered(question, answer) ? 'border-teal-300' : 'border-line'}`}>
      {saveStatus && (
        <span className={`absolute right-4 top-4 rounded-md px-2 py-0.5 text-xs font-semibold ${SAVE_CHIP[saveStatus][1]}`} aria-live="polite">
          {SAVE_CHIP[saveStatus][0]}
        </span>
      )}
      <span className="absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-[#F7894A] text-sm font-bold text-white shadow-[0_4px_12px_rgba(232,87,31,0.35)] ring-4 ring-white">
        {question.number}
      </span>
      {question.helpText && <p className="mb-1 text-sm text-muted">{question.helpText}</p>}
      <h3 className="text-[1.0625rem] font-medium leading-relaxed text-ink">{question.text}</h3>
      <div className="mx-auto my-5 h-px max-w-xl bg-line" />
      {question.type === 'text' ? (
        <textarea
          className="input min-h-[110px] text-left"
          value={answer?.text || ''}
          maxLength={5000}
          disabled={disabled}
          onChange={(e) => onAnswer({ itemId: question.itemId, text: e.target.value })}
          aria-label={`Answer to question ${question.number}`}
        />
      ) : (
        <div className="flex flex-wrap justify-center gap-3" role={question.type === 'multiple_choice' ? 'group' : 'radiogroup'}>
          {question.options.map((o) => (
            <OptionPill
              key={o.value}
              option={o}
              disabled={disabled}
              selected={question.type === 'multiple_choice' ? (answer?.values || []).includes(o.value) : answer?.value === o.value}
              onClick={() => (question.type === 'multiple_choice' ? toggle(o.value) : onAnswer({ itemId: question.itemId, value: o.value }))}
            />
          ))}
        </div>
      )}
    </article>
  );
};

// ---------------------------------------------------------------- side panels

const InfoPanel = ({ assessment, answered, total, upNext }) => {
  const pct = total ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Assessment info</p>
      <div className="rounded-2xl border border-teal-300 bg-gradient-to-b from-teal-50/60 to-white p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-ink-soft">
          <FiHelpCircle size={18} />
        </span>
        <h2 className="mt-5 text-lg font-extrabold uppercase leading-snug text-ink">{assessment.name}</h2>
        {assessment.description && <p className="mt-1.5 text-sm text-ink-soft">{assessment.description}</p>}
        {assessment.instructions && (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-line bg-white p-3.5 text-xs leading-relaxed text-ink-soft">
            <FiCheckSquare className="mt-0.5 shrink-0 text-emerald-600" />
            <span>{assessment.instructions}</span>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-medium text-ink">
          <span className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
            <FiHelpCircle className="text-muted" /> {total} Questions
          </span>
          <span className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
            <FiClock className="text-muted" /> {estimate(total)}
          </span>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-soft">Overall progress</span>
          <span className="font-semibold text-ink">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-ink-soft">Answered</span>
          <span className="font-semibold text-ink">
            {answered} / {total}
          </span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-ink-soft">Remaining</span>
          <span className="font-semibold text-risk-high">{total - answered}</span>
        </div>
      </div>

      {upNext && (
        <div className="rounded-2xl border border-teal-300 bg-teal-50/40 px-4 py-3.5">
          <p className="text-xs font-bold uppercase tracking-wide text-ink">Up next</p>
          <p className="mt-1.5 uppercase text-ink-soft">{upNext.name}</p>
        </div>
      )}
    </div>
  );
};

const SaveStatus = () => (
  <div className="flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-xs text-ink-soft">
    <FiCheckCircle className="text-emerald-600" /> Answers are saved automatically
  </div>
);

const BlocksPanel = ({ blocks, answers }) => {
  const [open, setOpen] = useState(0);
  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-soft">Question blocks</p>
      <div className="space-y-3">
        {blocks.map((b, i) => {
          const first = b.questions[0].number;
          const last = b.questions[b.questions.length - 1].number;
          const done = b.questions.filter((q) => isAnswered(q, answers[q.itemId])).length;
          const expanded = open === i;
          return (
            <div key={b.key} className={`rounded-2xl border ${expanded ? 'border-teal-300 bg-teal-50/30' : 'border-line bg-white'}`}>
              <button type="button" onClick={() => setOpen(expanded ? -1 : i)} className="flex w-full items-center gap-4 px-5 py-4 text-left" aria-expanded={expanded}>
                <span className="w-4 text-sm text-ink">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-medium text-ink">
                    Q {first} - {last}
                  </span>
                  <span className="block truncate text-xs text-muted">{b.title || `${b.questions.length} questions`}</span>
                </span>
                <span className={`text-xs ${done === b.questions.length ? 'font-semibold text-emerald-600' : 'text-muted'}`}>
                  {done}/{b.questions.length}
                </span>
                <FiChevronDown className={`text-muted transition ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {expanded && (
                <div className="grid grid-cols-5 gap-2 px-5 pb-4">
                  {b.questions.map((q) => {
                    const answered = isAnswered(q, answers[q.itemId]);
                    return (
                      <button
                        key={q.itemId}
                        type="button"
                        onClick={() => scrollToQuestion(q.itemId)}
                        className={`h-9 rounded-lg text-xs font-semibold ${answered ? 'bg-teal-500 text-white' : 'border border-line bg-white text-ink-soft hover:border-teal-300'}`}
                        aria-label={`Go to question ${q.number}${answered ? ' (answered)' : ''}`}
                      >
                        {q.number}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- runner

const QuizRunner = ({ session, upNext }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { assignment, assessment } = session;

  const [answers, setAnswers] = useState(() => Object.fromEntries(session.answers.map((a) => [a.itemId, a])));
  // Per-question save status: 'saving' | 'saved' | 'error'. Answers loaded from the server start as saved.
  const [saveStatus, setSaveStatus] = useState(() => Object.fromEntries(session.answers.map((a) => [a.itemId, 'saved'])));
  const saveChain = useRef(Promise.resolve());
  const textTimers = useRef({});
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const blocks = useMemo(() => buildBlocks(assessment), [assessment]);
  const total = assessment.questions.length;
  const answered = assessment.questions.filter((q) => isAnswered(q, answers[q.itemId])).length;
  const missing = assessment.questions.filter((q) => q.required && !isAnswered(q, answers[q.itemId]));
  const complete = missing.length === 0;

  // When the last unanswered question gets answered (wherever the patient is on the page),
  // glide down to "Submit answers". Only on that transition — not when reopening a finished quiz.
  const submitRef = useRef(null);
  const wasComplete = useRef(complete);
  useEffect(() => {
    if (complete && !wasComplete.current) {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      // Small delay so the patient sees their final selection register before the page moves.
      const timer = setTimeout(() => submitRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }), 350);
      wasComplete.current = complete;
      return () => clearTimeout(timer);
    }
    wasComplete.current = complete;
    return undefined;
  }, [complete]);
  const typeLabel = QUESTION_TYPE_LABELS[assessment.questions[0]?.type] || '';

  /** Saves one answer. Requests are chained so a fast double-click on the same question keeps its final value. */
  const saveAnswer = useCallback(
    (itemId) => {
      setSaveStatus((st) => ({ ...st, [itemId]: 'saving' }));
      const run = async () => {
        const answer = answersRef.current[itemId];
        try {
          await dispatch(saveProgress({ id: assignment._id, answers: [answer] })).unwrap();
          // Only mark saved if the answer didn't change again while this request was in flight.
          if (answersRef.current[itemId] === answer) setSaveStatus((st) => ({ ...st, [itemId]: 'saved' }));
          return true;
        } catch (err) {
          setSaveStatus((st) => ({ ...st, [itemId]: 'error' }));
          toast.error(err);
          return false;
        }
      };
      saveChain.current = saveChain.current.then(run, run);
      return saveChain.current;
    },
    [dispatch, assignment._id, toast],
  );

  /** Waits for in-flight saves (and flushes pending text edits) before leaving or submitting. */
  const flush = useCallback(async () => {
    Object.entries(textTimers.current).forEach(([itemId, timer]) => {
      clearTimeout(timer);
      saveAnswer(itemId);
    });
    textTimers.current = {};
    await saveChain.current;
    return !Object.values(saveStatusRef.current).includes('error');
  }, [saveAnswer]);

  const saveStatusRef = useRef(saveStatus);
  saveStatusRef.current = saveStatus;

  useEffect(() => () => {
    flush();
  }, [flush]);

  const onAnswer = (answer) => {
    const next = { ...answersRef.current[answer.itemId], ...answer };
    answersRef.current = { ...answersRef.current, [answer.itemId]: next };
    setAnswers(answersRef.current);
    const question = assessment.questions.find((q) => q.itemId === answer.itemId);
    if (question?.type === 'text') {
      clearTimeout(textTimers.current[answer.itemId]);
      textTimers.current[answer.itemId] = setTimeout(() => {
        delete textTimers.current[answer.itemId];
        saveAnswer(answer.itemId);
      }, TEXT_SAVE_MS);
    } else {
      saveAnswer(answer.itemId);
    }
  };

  // One click: wait for pending saves, submit, then go straight to the next quiz (no confirmation pop-up).
  const submit = async () => {
    if (!complete || submitting) return;
    setSubmitting(true);
    try {
      if (!(await flush())) return;
      await dispatch(submitAssessment({ id: assignment._id, answers: Object.values(answersRef.current) })).unwrap();
      if (upNext) {
        const { assignmentId } = await dispatch(startQuiz(upNext.assessmentId)).unwrap();
        toast.success(`Answers submitted. Next: ${upNext.name}`);
        navigate(`/patient/assessments/${assignmentId}`, { replace: true });
      } else {
        toast.success('Answers submitted. Thank you!');
        navigate('/patient/quizzes', { replace: true });
      }
    } catch (err) {
      toast.error(err);
      if (err.status === 409) navigate('/patient/quizzes', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-white px-4 py-3 shadow-[0_2px_8px_rgba(30,41,59,0.04)] sm:px-6">
        <button
          type="button"
          onClick={async () => {
            await flush();
            navigate('/patient/quizzes');
          }}
          className="inline-flex items-center gap-2 text-[0.9375rem] text-ink-soft hover:text-ink"
        >
          <FiArrowLeft /> Back to Categories
        </button>
        <div className="text-right">
          <p className="truncate text-sm font-semibold text-teal-600">{assessment.name}</p>
          {typeLabel && <span className="mt-1 inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-ink">{typeLabel}</span>}
        </div>
      </header>

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)_360px]">
        <aside className="border-b border-line bg-[#FAFAFA] p-6 lg:sticky lg:top-[3.8125rem] lg:h-[calc(100vh-3.8125rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <InfoPanel assessment={assessment} answered={answered} total={total} upNext={upNext} />
          <div className="mt-5">
            <SaveStatus />
          </div>
          <p className="mt-8 text-center text-sm font-medium text-ink">Take your time, we’re here with you</p>
        </aside>

        <main className="bg-[#FCFCFC] px-4 py-10 sm:px-8">
          <div className="mx-auto max-w-[680px] space-y-10">
            {assessment.questions.map((q) => (
              <QuestionCard key={q.itemId} question={q} answer={answers[q.itemId]} onAnswer={onAnswer} disabled={submitting} saveStatus={saveStatus[q.itemId]} />
            ))}

            <div ref={submitRef} className="flex scroll-mb-24 flex-col items-center gap-2 pb-6 pt-2">
              <button
                type="button"
                onClick={submit}
                disabled={!complete || submitting}
                className="btn bg-brand-500 px-7 py-3.5 text-base text-white shadow-[0_10px_24px_rgba(232,87,31,0.28)] hover:bg-brand-600 disabled:bg-brand-200 disabled:opacity-100 disabled:shadow-none"
              >
                {submitting ? 'Submitting…' : 'Submit answers'}
              </button>
              {!complete && <p className="text-sm text-muted">{total - answered} question{total - answered === 1 ? '' : 's'} remaining</p>}
            </div>
          </div>
        </main>

        <aside className="hidden border-l border-line bg-white p-6 xl:sticky xl:top-[3.8125rem] xl:block xl:h-[calc(100vh-3.8125rem)] xl:overflow-y-auto">
          <BlocksPanel blocks={blocks} answers={answers} />
        </aside>
      </div>

    </div>
  );
};

const TakeAssessmentPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const session = useSelector((s) => s.portal.session);
  const quizzes = useSelector((s) => s.portal.quizzes);

  useEffect(() => {
    dispatch(fetchMyAssignment(id));
    dispatch(fetchMyQuizzes());
    return () => dispatch(resetSession());
  }, [dispatch, id]);

  // Next card in display order (wrapping round) that the patient hasn't completed yet.
  const upNext = useMemo(() => {
    const current = session.data?.assessment.assessmentId;
    const list = quizzes.data || [];
    const idx = list.findIndex((q) => q.assessmentId === current);
    if (idx < 0) return null;
    const ordered = [...list.slice(idx + 1), ...list.slice(0, idx)];
    return ordered.find((q) => q.state !== 'completed') || null;
  }, [quizzes.data, session.data]);

  if (session.status === 'failed') return <ErrorState message={session.error} onRetry={() => dispatch(fetchMyAssignment(id))} />;
  if (!session.data) return <Loader className="min-h-screen" label="Loading your assessment…" />;
  if (session.data.assignment.status === 'completed') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
        <FiCheckCircle size={40} className="text-emerald-600" />
        <h1 className="text-2xl font-bold text-ink">This assessment has been submitted</h1>
        <Link to="/patient/quizzes" className="btn-primary">
          Back to Categories
        </Link>
      </div>
    );
  }
  return <QuizRunner key={session.data.assignment._id} session={session.data} upNext={upNext} />;
};

export default TakeAssessmentPage;
