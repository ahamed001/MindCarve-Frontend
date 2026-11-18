import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataTable, FilterDropdown, Pagination, SearchBar } from '../../../components/Table';
import { fetchAudit } from '../../../redux/thunks/adminThunks';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDateTime } from '../../../utils/format';

const ROLE = { admin: 'Admin', clinician: 'Clinician', patient: 'Patient' };

/** Admin-only, read-only view of the append-only audit trail (GET /api/audit). */
const AuditLogPanel = () => {
  const dispatch = useDispatch();
  const audit = useSelector((s) => s.activity.audit);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [outcome, setOutcome] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  const load = () => dispatch(fetchAudit({ page, limit: 25, ...(debounced && { search: debounced }), ...(action && { action }), ...(outcome && { outcome }) }));
  useEffect(() => {
    load();
  }, [page, debounced, action, outcome]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [debounced, action, outcome]);

  const { items, pagination, actions } = audit.data;
  const columns = [
    { key: 'createdAt', header: 'When', render: (r) => <span className="whitespace-nowrap text-ink-soft">{formatDateTime(r.createdAt)}</span> },
    {
      key: 'actor',
      header: 'Who',
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{r.actorName || r.actorEmail || 'Unknown'}</div>
          <div className="text-[0.6875rem] text-muted">{[ROLE[r.actorRole], r.actorName && r.actorEmail].filter(Boolean).join(' · ')}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <div>
          <span className={r.outcome === 'failure' ? 'font-medium text-risk-high' : 'text-ink'}>{r.actionLabel}</span>
          {r.details && <div className="max-w-xs truncate text-[0.6875rem] text-muted" title={r.details}>{r.details}</div>}
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (r) =>
        r.patient ? (
          <Link to={`/admin/patients/${r.patient}`} className="hover:underline">
            <div className="text-ink">{r.patientName}</div>
            <div className="text-[0.6875rem] text-brand-600">{r.patientCode}</div>
          </Link>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { key: 'ip', header: 'IP address', hideBelow: 'lg', render: (r) => <span className="text-[0.6875rem] text-muted">{r.ip || '—'}</span> },
  ];

  return (
    <section className="card overflow-hidden">
      <div className="grid gap-3 border-b border-line p-4 md:grid-cols-[1fr_220px_160px]">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by staff, email, patient name or ID" />
        <FilterDropdown label="Action" value={action} onChange={setAction} options={[{ value: '', label: 'All actions' }, ...(actions || [])]} />
        <FilterDropdown
          label="Outcome"
          value={outcome}
          onChange={setOutcome}
          options={[
            { value: '', label: 'Any outcome' },
            { value: 'success', label: 'Succeeded' },
            { value: 'failure', label: 'Failed' },
          ]}
        />
      </div>
      <DataTable columns={columns} rows={items} status={audit.status} error={audit.error} onRetry={load} emptyTitle="No audit entries" emptyMessage="Entries appear as staff and patients use the platform." />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
      <p className="border-t border-line px-4 py-2.5 text-[0.6875rem] text-muted">The audit log is append-only: entries cannot be edited or deleted.</p>
    </section>
  );
};

export default AuditLogPanel;
