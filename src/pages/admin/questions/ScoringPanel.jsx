import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const RISK_OPTIONS = [
  ['', 'No risk level'],
  ['low', 'Low'],
  ['moderate', 'Moderate'],
  ['high', 'High'],
];

const BandsEditor = ({ bands = [], onChange, withValue }) => {
  const update = (i, patch) => onChange(bands.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  return (
    <div className="space-y-2">
      {bands.map((b, i) => (
        <div key={i} className={`grid items-center gap-2 ${withValue ? 'grid-cols-[70px_70px_1fr_70px_120px_auto]' : 'grid-cols-[70px_70px_1fr_120px_auto]'}`}>
          <input className="input px-2" type="number" step="any" placeholder="min" value={b.min ?? ''} onChange={(e) => update(i, { min: num(e.target.value) })} aria-label="Minimum" />
          <input className="input px-2" type="number" step="any" placeholder="max" value={b.max ?? ''} onChange={(e) => update(i, { max: num(e.target.value) })} aria-label="Maximum" />
          <input className="input" placeholder="Label" value={b.label} onChange={(e) => update(i, { label: e.target.value })} aria-label="Band label" />
          {withValue && <input className="input px-2" placeholder="value" value={b.value ?? ''} onChange={(e) => update(i, { value: num(e.target.value) })} aria-label="Output value" />}
          <select className="input px-2" value={b.riskLevel || ''} onChange={(e) => update(i, { riskLevel: e.target.value || null })} aria-label="Risk level">
            {RISK_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button type="button" className="rounded-lg p-2 text-muted hover:text-risk-high" onClick={() => onChange(bands.filter((_, idx) => idx !== i))} aria-label="Remove band">
            <FiTrash2 />
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost px-2 py-1.5 text-xs" onClick={() => onChange([...bands, { min: null, max: null, label: '', riskLevel: null }])}>
        <FiPlus /> Add band
      </button>
      <p className="text-xs text-muted">Min and max are inclusive; leave blank for open-ended. Risk levels drive the dashboard and high-risk follow-ups.</p>
    </div>
  );
};

/** Structured editor for the assessment's scoring configuration. Items are entered by question number. */
const ScoringPanel = ({ assessment, readOnly, saving, onSave }) => {
  const [scoring, setScoring] = useState(assessment.scoring);
  const [itemText, setItemText] = useState({});
  const [error, setError] = useState('');

  const numberById = useMemo(() => new Map(assessment.questions.map((q, i) => [q.itemId, i + 1])), [assessment.questions]);
  const idByNumber = useMemo(() => new Map(assessment.questions.map((q, i) => [i + 1, q.itemId])), [assessment.questions]);

  useEffect(() => {
    setScoring(assessment.scoring);
    setItemText(Object.fromEntries((assessment.scoring.subscales || []).map((s, i) => [i, s.itemIds.map((id) => numberById.get(id) ?? `?${id}`).join(', ')])));
  }, [assessment.scoring, numberById]);

  const set = (patch) => setScoring((s) => ({ ...s, ...patch }));
  const setTotal = (patch) => set({ total: { ...scoring.total, ...patch } });
  const setSub = (i, patch) => set({ subscales: scoring.subscales.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const setOutput = (i, patch) => set({ outputs: scoring.outputs.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });

  const save = () => {
    try {
      const subscales = scoring.subscales.map((s, i) => {
        const numbers = (itemText[i] ?? '').split(/[\s,]+/).filter(Boolean).map(Number);
        const ids = numbers.map((n) => {
          if (!idByNumber.has(n)) throw new Error(`Subscale "${s.name}": question ${n} does not exist`);
          return idByNumber.get(n);
        });
        return { ...s, itemIds: ids };
      });
      setError('');
      onSave({ ...scoring, subscales, reverseConstant: num(scoring.reverseConstant) });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <fieldset disabled={readOnly} className="space-y-6">
      {error && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <section className="card space-y-4 p-6">
        <h3 className="font-semibold">General</h3>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 accent-brand-500" checked={scoring.enabled} onChange={(e) => set({ enabled: e.target.checked, status: e.target.checked ? 'configured' : 'awaiting_configuration' })} />
          <span>
            <span className="font-medium text-ink">Automated scoring enabled</span>
            <span className="block text-xs text-muted">When off, responses are stored and results show “awaiting clinician configuration”.</span>
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Reverse-score constant</span>
            <input className="input" type="number" value={scoring.reverseConstant ?? ''} onChange={(e) => set({ reverseConstant: e.target.value })} placeholder="e.g. 6 for a 1–5 scale" />
            <span className="mt-1 block text-xs text-muted">Reversed score = constant − option score</span>
          </label>
        </div>
        <label className="block">
          <span className="label">Interpretation note (shown with results)</span>
          <textarea className="input" rows={2} value={scoring.interpretationNote || ''} onChange={(e) => set({ interpretationNote: e.target.value })} />
        </label>
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Total score</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand-500" checked={scoring.total?.enabled !== false} onChange={(e) => setTotal({ enabled: e.target.checked })} /> Calculate total
          </label>
        </div>
        {scoring.total?.enabled !== false && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Label</span>
                <input className="input" value={scoring.total?.label || ''} onChange={(e) => setTotal({ label: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Method</span>
                <select className="input" value={scoring.total?.method || 'sum'} onChange={(e) => setTotal({ method: e.target.value })}>
                  <option value="sum">Sum</option>
                  <option value="mean">Average</option>
                </select>
              </label>
            </div>
            <BandsEditor bands={scoring.total?.bands} onChange={(bands) => setTotal({ bands })} />
          </>
        )}
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Subscales / domains ({scoring.subscales.length})</h3>
          <button
            type="button"
            className="btn-ghost px-2 py-1.5 text-sm"
            onClick={() => {
              set({ subscales: [...scoring.subscales, { key: `subscale_${scoring.subscales.length + 1}`, name: 'New subscale', method: 'sum', itemIds: [], bands: [] }] });
              setItemText((t) => ({ ...t, [scoring.subscales.length]: '' }));
            }}
          >
            <FiPlus /> Add subscale
          </button>
        </div>
        {scoring.subscales.map((s, i) => (
          <details key={s.key + i} className="rounded-xl border border-line p-4" open={i === scoring.subscales.length - 1 && s.name === 'New subscale'}>
            <summary className="cursor-pointer text-sm">
              <span className="font-semibold text-ink">{s.name}</span>
              <span className="ml-2 text-muted">
                {s.method} · items {itemText[i] || '—'}
                {s.cutoff?.value !== undefined && s.cutoff?.value !== null ? ` · cutoff ≥ ${s.cutoff.value}` : ''}
              </span>
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Name</span>
                <input className="input" value={s.name} onChange={(e) => setSub(i, { name: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Key</span>
                <input className="input" value={s.key} onChange={(e) => setSub(i, { key: e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase() })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Question numbers (comma separated)</span>
                <input className="input" value={itemText[i] ?? ''} onChange={(e) => setItemText((t) => ({ ...t, [i]: e.target.value }))} placeholder="e.g. 1, 6" />
              </label>
              <label className="block">
                <span className="label">Method</span>
                <select className="input" value={s.method} onChange={(e) => setSub(i, { method: e.target.value })}>
                  <option value="sum">Sum</option>
                  <option value="mean">Average</option>
                </select>
              </label>
              <label className="block">
                <span className="label">Cutoff (score ≥ value)</span>
                <input
                  className="input"
                  type="number"
                  value={s.cutoff?.value ?? ''}
                  onChange={(e) => setSub(i, { cutoff: e.target.value === '' ? undefined : { ...(s.cutoff || {}), value: Number(e.target.value), operator: 'gte' } })}
                />
              </label>
              {s.cutoff?.value !== undefined && s.cutoff?.value !== null && (
                <label className="block sm:col-span-2">
                  <span className="label">Cutoff label</span>
                  <input className="input" value={s.cutoff?.label || ''} onChange={(e) => setSub(i, { cutoff: { ...s.cutoff, label: e.target.value } })} />
                </label>
              )}
              <div className="sm:col-span-2">
                <span className="label">Bands</span>
                <BandsEditor bands={s.bands} onChange={(bands) => setSub(i, { bands })} />
              </div>
            </div>
            <button
              type="button"
              className="btn-ghost mt-3 px-2 py-1.5 text-xs text-risk-high"
              onClick={() => {
                set({ subscales: scoring.subscales.filter((_, idx) => idx !== i) });
                setItemText((t) => Object.fromEntries(Object.entries(t).filter(([k]) => Number(k) !== i).map(([k, v]) => [Number(k) > i ? Number(k) - 1 : k, v])));
              }}
            >
              <FiTrash2 /> Remove subscale
            </button>
          </details>
        ))}
      </section>

      {scoring.outputs?.length > 0 && (
        <section className="card space-y-4 p-6">
          <h3 className="font-semibold">Additional outputs</h3>
          {scoring.outputs.map((o, i) => (
            <div key={o.key} className="rounded-xl border border-line p-4">
              <p className="font-medium text-ink">{o.name}</p>
              <p className="mb-3 text-xs text-muted">
                Source: {o.source} · {o.note}
              </p>
              <BandsEditor withValue bands={o.bands} onChange={(bands) => setOutput(i, { bands })} />
            </div>
          ))}
        </section>
      )}

      {!readOnly && (
        <div className="sticky bottom-4 flex justify-end">
          <button type="button" className="btn-primary shadow-lg" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save scoring'}
          </button>
        </div>
      )}
    </fieldset>
  );
};

export default ScoringPanel;
