import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowRight, FiCheckCircle, FiCheckSquare, FiHelpCircle, FiLogOut } from 'react-icons/fi';
import { EmptyState, ErrorState, Loader } from '../../../components/Feedback';
import { fetchMyQuizzes, startQuiz } from '../../../redux/thunks/portalThunks';
import { logout } from '../../../redux/thunks/authThunks';
import { useToast } from '../../../hooks/useToast';

/**
 * The whole card is clickable (unless the quiz is completed). On hover/focus it lifts slightly and an
 * orange 2px bar sweeps across the top edge from 0 to 100% width.
 */
const QuizCard = ({ quiz, onStart, starting }) => {
  const done = quiz.state === 'completed';
  const inProgress = quiz.state === 'in_progress' || quiz.state === 'assigned';
  const clickable = !(done && !inProgress);
  const Tag = clickable ? 'button' : 'article';

  return (
    <Tag
      {...(clickable ? { type: 'button', onClick: onStart, disabled: starting, 'aria-label': `${inProgress ? 'Continue' : 'Start'} ${quiz.name}` } : {})}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-line bg-white p-7 text-left shadow-[0_2px_10px_rgba(30,41,59,0.04)] transition duration-300 ease-out ${
        clickable
          ? 'cursor-pointer hover:-translate-y-1.5 hover:border-brand-100 hover:shadow-[0_16px_34px_rgba(232,87,31,0.14)] focus:outline-none focus-visible:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-wait'
          : ''
      }`}
    >
      {clickable && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-[2px] w-0 bg-gradient-to-r from-brand-500 to-[#F7894A] transition-[width] duration-500 ease-out group-hover:w-full group-focus-visible:w-full"
        />
      )}
      <div className="flex w-full items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-[#F7894A] text-white shadow-[0_6px_14px_rgba(232,87,31,0.3)]">
          <FiCheckSquare size={22} />
        </span>
        {quiz.category && <span className="rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1 text-[0.8125rem] font-medium text-brand-600">{quiz.category}</span>}
      </div>
      <h2 className="mt-6 text-[1.25rem] font-bold leading-snug text-ink">{quiz.name}</h2>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{quiz.description}</p>
      <div className="mt-auto flex w-full items-center justify-between border-t border-dashed border-line pt-5">
        <span className="inline-flex items-center gap-2 text-[0.9375rem] text-ink-soft">
          <FiHelpCircle className="text-muted" /> {quiz.questionCount} questions
        </span>
        {clickable ? (
          <span className="inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-brand-600 transition-all duration-300 group-hover:gap-3">
            {starting ? 'Opening…' : inProgress ? 'Continue' : 'Start'} <FiArrowRight />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-emerald-600">
            <FiCheckCircle /> Completed
          </span>
        )}
      </div>
    </Tag>
  );
};

const QuizListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const quizzes = useSelector((s) => s.portal.quizzes);
  const [starting, setStarting] = useState(null);

  const load = () => dispatch(fetchMyQuizzes());
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (quiz) => {
    setStarting(quiz.assessmentId);
    try {
      const { assignmentId } = await dispatch(startQuiz(quiz.assessmentId)).unwrap();
      navigate(`/patient/assessments/${assignmentId}`);
    } catch (err) {
      toast.error(err);
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF4EC] via-[#FFFAF6] to-[#FFFAF6]">
      <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-10 sm:px-8">
        <header className="mb-12 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100/80 px-4 py-1.5 text-sm font-medium uppercase tracking-wide text-brand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Assessments
            </span>
            <h1 className="mt-4 text-[2.75rem] font-extrabold leading-tight tracking-tight text-ink sm:text-[3.25rem]">
              Take a <span className="text-brand-500">Quiz</span>
            </h1>
            <p className="mt-3 text-[1.0625rem] text-muted">Choose an assessment below to begin. It only takes a few minutes.</p>
          </div>
          <button type="button" onClick={() => dispatch(logout())} className="mt-2 inline-flex shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-[0.9375rem] text-ink-soft hover:bg-field">
            <FiLogOut /> Log out
          </button>
        </header>

        {quizzes.status === 'failed' ? (
          <ErrorState message={quizzes.error} onRetry={load} />
        ) : quizzes.status !== 'succeeded' && !quizzes.data.length ? (
          <Loader />
        ) : !quizzes.data.length ? (
          <EmptyState title="No assessments available" message="Please check back later." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {quizzes.data.map((q) => (
              <QuizCard key={q.assessmentId} quiz={q} starting={starting === q.assessmentId} onStart={() => open(q)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizListPage;
