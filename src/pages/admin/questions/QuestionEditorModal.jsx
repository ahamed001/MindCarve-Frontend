import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Modal } from '../../../components/Modal';
import { QUESTION_TYPE_LABELS } from '../../../utils/format';

const blankOptions = (type) => {
  if (type === 'yes_no') return [{ label: 'Yes', value: 'yes', score: 1 }, { label: 'No', value: 'no', score: 0 }];
  if (type === 'text') return [];
  return [1, 2, 3, 4, 5].map((n) => ({ label: '', value: String(n), score: n }));
};

const emptyQuestion = (type) => ({
  text: '',
  helpText: '',
  type,
  sectionKey: '',
  required: true,
  reverseScored: false,
  excludedFromScoring: false,
  sensitive: false,
  reviewTriggerValues: [],
  options: blankOptions(type),
});

/** Create or edit one question: wording, type, options with values and scores, and scoring flags. */
const QuestionEditorModal = ({ open, question, sections, defaultType, onSave, onClose, saving }) => {
  const [draft, setDraft] = useState(emptyQuestion(defaultType));
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(question ? { ...question, sectionKey: question.sectionKey || '', options: question.options.map((o) => ({ ...o })) } : emptyQuestion(defaultType || 'single_choice'));
      setError('');
    }
  }, [open, question, defaultType]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setOption = (i, patch) => set({ options: draft.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });
  const changeType = (type) => {
    const needsReset = type === 'text' || type === 'yes_no' || draft.type === 'yes_no' || draft.type === 'text';
    set({ type, ...(needsReset ? { options: blankOptions(type), reviewTriggerValues: [] } : {}) });
  };
  const toggleTrigger = (value) =>
    set({ reviewTriggerValues: draft.reviewTriggerValues.includes(value) ? draft.reviewTriggerValues.filter((v) => v !== value) : [...draft.reviewTriggerValues, value] });

  const submit = () => {
    if (!draft.text.trim()) return setError('Question text is required');
    if (draft.type !== 'text') {
      if (draft.options.length < 2) return setError('Add at least two options');
      if (draft.options.some((o) => !o.label.trim() || !String(o.value).trim())) return setError('Every option needs a label and a value');
      if (new Set(draft.options.map((o) => o.value)).size !== draft.options.length) return setError('Option values must be unique');
    }
    setError('');
    return onSave({
      text: draft.text,
      helpText: draft.helpText,
      type: draft.type,
      sectionKey: draft.sectionKey || null,
      required: draft.required,
      reverseScored: draft.reverseScored,
      excludedFromScoring: draft.excludedFromScoring,
      sensitive: draft.sensitive,
      reviewTriggerValues: draft.reviewTriggerValues,
      options: draft.options.map((o) => ({ label: o.label, value: String(o.value), score: o.score === '' || o.score === null ? null : Number(o.score), description: o.description })),
    });
  };

  const fixedCount = draft.type === 'yes_no';
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={question ? `Edit question ${question.order}` : 'Add question'}
      subtitle="Changes apply to future assignments after you publish a new version. Existing assignments keep their original snapshot."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save question'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
        <label className="block">
          <span className="label">Question wording *</span>
          <textarea className="input" rows={2} value={draft.text} onChange={(e) => set({ text: e.target.value })} maxLength={1000} />
        </label>
        <label className="block">
          <span className="label">Lead-in / help text</span>
          <input className="input" value={draft.helpText || ''} onChange={(e) => set({ helpText: e.target.value })} placeholder="e.g. I see myself as someone who ..." />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Response type</span>
            <select className="input" value={draft.type} onChange={(e) => changeType(e.target.value)}>
              {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Section</span>
            <select className="input" value={draft.sectionKey} onChange={(e) => set({ sectionKey: e.target.value })}>
              <option value="">No section</option>
              {sections.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {draft.type !== 'text' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Answer options</span>
              <span className="text-xs text-muted">Value = stored answer id · Score = number used by scoring · Review = flag for clinician</span>
            </div>
            <div className="space-y-2">
              {draft.options.map((o, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_70px_auto_auto] items-center gap-2">
                  <input className="input" placeholder="Label" value={o.label} onChange={(e) => setOption(i, { label: e.target.value })} aria-label={`Option ${i + 1} label`} />
                  <input className="input px-2" placeholder="Value" value={o.value} onChange={(e) => setOption(i, { value: e.target.value })} aria-label={`Option ${i + 1} value`} />
                  <input className="input px-2" type="number" step="any" placeholder="Score" value={o.score ?? ''} onChange={(e) => setOption(i, { score: e.target.value })} aria-label={`Option ${i + 1} score`} />
                  <label className="flex items-center gap-1 text-xs text-muted" title="Flag submission for clinical review when this answer is chosen">
                    <input type="checkbox" className="accent-brand-500" checked={draft.reviewTriggerValues.includes(o.value)} onChange={() => toggleTrigger(o.value)} />
                    Review
                  </label>
                  <button type="button" className="rounded-lg p-2 text-muted hover:text-risk-high disabled:opacity-30" disabled={fixedCount || draft.options.length <= 2} onClick={() => set({ options: draft.options.filter((_, idx) => idx !== i) })} aria-label="Remove option">
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
            {!fixedCount && (
              <button type="button" className="btn-ghost mt-2 px-2 py-1.5" onClick={() => set({ options: [...draft.options, { label: '', value: String(draft.options.length + 1), score: draft.options.length + 1 }] })}>
                <FiPlus /> Add option
              </button>
            )}
          </div>
        )}

        <div className="grid gap-3 rounded-xl bg-canvas p-4 sm:grid-cols-2">
          {[
            ['required', 'Required', 'Patient must answer before submitting'],
            ['reverseScored', 'Reverse-scored', 'Score = reverse constant − option score'],
            ['excludedFromScoring', 'Excluded from scoring', 'Stored, but not counted in totals'],
            ['sensitive', 'Sensitive content', 'Highlighted for clinicians in results'],
          ].map(([key, label, hint]) => (
            <label key={key} className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 accent-brand-500" checked={Boolean(draft[key])} onChange={(e) => set({ [key]: e.target.checked })} />
              <span>
                <span className="font-medium text-ink">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default QuestionEditorModal;
