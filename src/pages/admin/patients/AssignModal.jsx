import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from '../../../components/Modal';
import { Loader } from '../../../components/Feedback';
import { assignAssessments, fetchAssessments } from '../../../redux/thunks/adminThunks';
import { useToast } from '../../../hooks/useToast';
import { toDateInput } from '../../../utils/format';

const AssignModal = ({ open, patient, activeAssessmentIds, onClose, onAssigned }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const list = useSelector((s) => s.assessments.list);
  const [selected, setSelected] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setDueDate('');
      dispatch(fetchAssessments({ status: 'published' }));
    }
  }, [open, dispatch]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async () => {
    setBusy(true);
    try {
      const res = await dispatch(assignAssessments({ id: patient._id, assessmentIds: selected, ...(dueDate && { dueDate }) })).unwrap();
      toast.success(res.created ? `${res.created} assessment(s) assigned` : 'Nothing new was assigned');
      if (res.skipped?.length) toast.error({ message: `Skipped: ${res.skipped.map((s) => `${s.code} (${s.reason})`).join(', ')}` });
      onAssigned();
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const published = (list.data || []).filter((a) => a.status === 'published');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign assessments"
      subtitle={`${patient.fullName} · the currently published version of each assessment is assigned`}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={submit} disabled={busy || !selected.length}>
            {busy ? 'Assigning…' : `Assign ${selected.length || ''}`}
          </button>
        </>
      }
    >
      {list.status === 'loading' && !published.length ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2">
            {published.map((a) => {
              const active = activeAssessmentIds.includes(a._id);
              const checked = selected.includes(a._id);
              return (
                <label
                  key={a._id}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${active ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${checked ? 'border-brand-500 bg-brand-50' : 'border-line'}`}
                >
                  <input type="checkbox" className="mt-0.5 accent-brand-500" disabled={active} checked={checked} onChange={() => toggle(a._id)} />
                  <span className="flex-1">
                    <span className="font-semibold text-ink">{a.code}</span> <span className="text-muted">v{a.currentVersion}</span>
                    <span className="block text-xs text-muted">{a.name}</span>
                  </span>
                  {active && <span className="text-xs text-muted">Already assigned</span>}
                </label>
              );
            })}
          </div>
          <label className="block sm:w-56">
            <span className="label">Due date (optional)</span>
            <input type="date" className="input" value={dueDate} min={toDateInput(new Date())} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
      )}
    </Modal>
  );
};

export default AssignModal;
