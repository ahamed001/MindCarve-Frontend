import { FiAlertCircle, FiChevronRight, FiClipboard, FiHelpCircle } from 'react-icons/fi';
import { Badge, StatusBadge } from './Badges';

/** Library card matching the reference: icon tile, category tag, title, description, question count + "Start". */
const AssessmentCard = ({ assessment, onOpen }) => (
  <button type="button" onClick={onOpen} className="card group flex h-full flex-col p-5 text-left transition hover:border-brand-200 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
        <FiClipboard size={18} />
      </span>
      <div className="flex flex-wrap justify-end gap-1.5">
        {assessment.status !== 'published' && <StatusBadge status={assessment.status} />}
        {assessment.category && <span className="rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-600">{assessment.category}</span>}
      </div>
    </div>
    <h3 className="mt-4 font-bold leading-snug text-ink">{assessment.name}</h3>
    <p className="mt-1 line-clamp-2 text-sm text-muted">{assessment.description}</p>
    <div className="mt-2 flex flex-wrap gap-1.5">
      {assessment.hasUnpublishedChanges && assessment.status === 'published' && <Badge tone="amber">Unpublished changes</Badge>}
      {assessment.scoring?.status === 'awaiting_configuration' && (
        <Badge tone="slate">
          <FiAlertCircle /> Scoring awaiting config
        </Badge>
      )}
    </div>
    <div className="mt-auto flex items-center justify-between border-t border-dashed border-line pt-4 text-sm">
      <span className="inline-flex items-center gap-1.5 text-ink-soft">
        <FiHelpCircle className="text-muted" /> {assessment.questionCount} questions
        {assessment.currentVersion > 0 && <span className="text-xs text-muted">· v{assessment.currentVersion}</span>}
      </span>
      <span className="inline-flex items-center gap-1 font-semibold text-brand-600 group-hover:gap-1.5">
        Start <FiChevronRight />
      </span>
    </div>
  </button>
);

export default AssessmentCard;
