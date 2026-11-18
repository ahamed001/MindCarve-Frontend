import { CheckboxOptions, RadioOptions, RatingScale } from './AssessmentInputs';

const isAnswered = (question, answer) => {
  if (!answer) return false;
  if (question.type === 'text') return Boolean(answer.text?.trim());
  if (question.type === 'multiple_choice') return Boolean(answer.values?.length);
  return Boolean(answer.value);
};

/** Renders any supported question type from its stored configuration. */
const QuestionCard = ({ question, answer, onAnswer, disabled, highlightMissing }) => {
  const answered = isAnswered(question, answer);
  const name = `q-${question.itemId}`;
  const setValue = (value) => onAnswer({ itemId: question.itemId, value });

  let input;
  switch (question.type) {
    case 'rating_scale':
      input = <RatingScale name={name} options={question.options} value={answer?.value} onChange={setValue} disabled={disabled} />;
      break;
    case 'multiple_choice':
      input = (
        <CheckboxOptions options={question.options} values={answer?.values || []} onChange={(values) => onAnswer({ itemId: question.itemId, values })} disabled={disabled} />
      );
      break;
    case 'text':
      input = (
        <textarea
          className="input min-h-[110px]"
          value={answer?.text || ''}
          maxLength={5000}
          onChange={(e) => onAnswer({ itemId: question.itemId, text: e.target.value })}
          disabled={disabled}
          aria-label={`Answer to question ${question.number}`}
        />
      );
      break;
    case 'yes_no':
      input = (
        <div className="grid max-w-sm grid-cols-2 gap-2">
          <RadioOptions name={name} options={question.options.slice(0, 1)} value={answer?.value} onChange={setValue} disabled={disabled} />
          <RadioOptions name={name} options={question.options.slice(1, 2)} value={answer?.value} onChange={setValue} disabled={disabled} />
        </div>
      );
      break;
    default: // single_choice, frequency_scale, percentage_scale
      input = <RadioOptions name={name} options={question.options} value={answer?.value} onChange={setValue} disabled={disabled} />;
  }

  return (
    <article id={`question-${question.itemId}`} className={`card scroll-mt-28 p-5 sm:p-6 ${highlightMissing && !answered && question.required ? 'border-risk-high/60' : ''}`}>
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${answered ? 'bg-brand-500 text-white' : 'bg-stone-100 text-ink-soft'}`}
          aria-label={answered ? 'Answered' : 'Not answered'}
        >
          {question.number}
        </span>
        <div className="pt-1">
          {question.helpText && <p className="mb-0.5 text-sm text-muted">{question.helpText}</p>}
          <h3 className="text-[1.0625rem] font-semibold leading-snug text-ink">{question.text}</h3>
          {highlightMissing && !answered && question.required && <p className="mt-1 text-xs font-medium text-risk-high">Please answer this question</p>}
        </div>
      </div>
      {input}
    </article>
  );
};

export { isAnswered };
export default QuestionCard;
