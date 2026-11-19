import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Modal } from '../../../components/Modal';
import { QUESTION_TYPE_LABELS } from '../../../utils/format';

// Ready-made answer sets so admins don't have to type common scales.
const PRESETS = {
  yes_no: [
    { label: 'Yes', value: 'yes', score: 1 },
    { label: 'No', value: 'no', score: 0 },
  ],
  rating_scale: ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree'].map((label, i) => ({ label, value: String(i + 1), score: i + 1 })),
  frequency_scale: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'].map((label, i) => ({ label, value: String(i), score: i })),
};
const defaultOptions = (type) => {
  if (type === 'text') return [];
  return (PRESETS[type] || ['Option 1', 'Option 2'].map((label, i) => ({ label, value: String(i + 1), score: i + 1 }))).map((o) => ({ ...o }));
};
const blank = (type) => ({ text: '', helpText: '', type, required: true, reverseScored: false, excludedFromScoring: false, sensitive: false, options: defaultOptions(type) });

/** Add or edit one question: wording, type, answer options with scores, and a few flags. */
const QuestionEditorModal = ({ open, question, defaultType, saving, onSave, onClose }) => {
  const [draft, setDraft] = useState(blank(defaultType || 'single_choice'));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraft(question ? { ...question, options: question.options.map((o) => ({ ...o })) } : blank(defaultType || 'single_choice'));
    setError('');
  }, [open, question, defaultType]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setOption = (i, patch) => set({ options: draft.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });
  // Switching type fills in that type's ready-made answers, unless the admin already typed their own.
  const sameOptions = (a, b) => JSON.stringify(a.map((o) => [o.label, String(o.score ?? '')])) === JSON.stringify(b.map((o) => [o.label, String(o.score ?? '')]));
  const changeType = (type) => {
    const untouched = sameOptions(draft.options, defaultOptions(draft.type));
    const mustReset = type === 'text' || type === 'yes_no' || draft.type === 'text' || draft.type === 'yes_no';
    set({ type, ...(untouched || mustReset ? { options: defaultOptions(type) } : {}) });
  };

  const save = () => {
    if (!draft.text.trim()) return setError('Question wording is required');
    if (draft.type !== 'text') {
      if (draft.options.length < 2) return setError('Add at least two answer options');
      if (draft.options.some((o) => !String(o.label).trim())) return setError('Every answer option needs a label');
    }
    setError('');
    return onSave({
      text: draft.text.trim(),
      helpText: draft.helpText || '',
      type: draft.type,
      required: draft.required,
      reverseScored: draft.reverseScored,
      excludedFromScoring: draft.excludedFromScoring,
      sensitive: draft.sensitive,
      // Values identify answers internally; keep existing ones, number new ones.
      options: draft.options.map((o, i) => ({ label: String(o.label).trim(), value: String(o.value ?? i + 1) || String(i + 1), score: o.score === '' || o.score === null || o.score === undefined ? null : Number(o.score) })),
    });
  };

  const fixedCount = draft.type === 'yes_no';
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={question ? `Edit question ${question.order}` : 'Add question'}
      subtitle="Saved to the draft. Patients see the change after you publish."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save question'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
        <label className="block">
          <span className="label">Question *</span>
          <textarea className="input" rows={2} maxLength={1000} value={draft.text} onChange={(e) => set({ text: e.target.value })} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Answer type</span>
            <select className="input" value={draft.type} onChange={(e) => changeType(e.target.value)}>
              {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Lead-in text (optional)</span>
            <input className="input" value={draft.helpText || ''} maxLength={500} onChange={(e) => set({ helpText: e.target.value })} placeholder="e.g. I see myself as someone who …" />
          </label>
        </div>

        {draft.type === 'text' ? (
          <p className="rounded-xl bg-canvas p-3 text-sm text-muted">Patients type a written answer. Written answers are stored and shown to staff but not scored.</p>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Answer options</span>
              <span className="text-xs text-muted">Score = points this answer adds to the total</span>
            </div>
            <div className="space-y-2">
              {draft.options.map((o, i) => (
                <div key={i} className="grid grid-cols-[1fr_90px_auto] items-center gap-2">
                  <input className="input" placeholder={`Option ${i + 1}`} value={o.label} onChange={(e) => setOption(i, { label: e.target.value })} aria-label={`Option ${i + 1} label`} />
                  <input className="input px-2" type="number" step="any" placeholder="Score" value={o.score ?? ''} onChange={(e) => setOption(i, { score: e.target.value })} aria-label={`Option ${i + 1} score`} />
                  <button
                    type="button"
                    className="rounded-lg p-2 text-muted hover:text-risk-high disabled:opacity-30"
                    disabled={fixedCount || draft.options.length <= 2}
                    onClick={() => set({ options: draft.options.filter((_, idx) => idx !== i) })}
                    aria-label={`Remove option ${i + 1}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
            {!fixedCount && (
              <button
                type="button"
                className="btn-ghost mt-2 px-2 py-1.5 text-xs"
                onClick={() => {
                  const nextValue = String(Math.max(0, ...draft.options.map((o) => Number(o.value) || 0)) + 1);
                  set({ options: [...draft.options, { label: '', value: nextValue, score: draft.options.length + 1 }] });
                }}
              >
                <FiPlus /> Add option
              </button>
            )}
          </div>
        )}

        <div className="grid gap-3 rounded-xl bg-canvas p-4 sm:grid-cols-2">
          {[
            ['required', 'Required', 'Patients must answer before submitting'],
            ['sensitive', 'Sensitive', 'Highlighted for staff in results (e.g. self-harm wording)'],
            ['excludedFromScoring', 'Not scored', 'Answer is stored but not added to the total'],
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
