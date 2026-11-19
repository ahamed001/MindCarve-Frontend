import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiChevronRight, FiUserPlus } from 'react-icons/fi';
import { PageHeader, StatCard, StatGroup } from '../../../components/Layout';
import { DataTable, FilterDropdown, Pagination, SearchBar } from '../../../components/Table';
import FilterChips from '../../../components/FilterChips';
import PatientFormModal from './PatientFormModal';
import InvitationResultModal from './InvitationResultModal';
import { fetchPatients } from '../../../redux/thunks/adminThunks';
import { useDebounce } from '../../../hooks/useDebounce';
import { ageGender, formatDate, initials } from '../../../utils/format';

const DeclarationPill = ({ signed }) =>
  signed ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-600">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Signed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Pending
    </span>
  );

const PatientsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const list = useSelector((s) => s.patients.list);
  const isAdmin = useSelector((s) => s.auth.user?.role === 'admin');
  const [search, setSearch] = useState('');
  const [declaration, setDeclaration] = useState('');
  const [completion, setCompletion] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [created, setCreated] = useState(null);
  const debounced = useDebounce(search);

  const load = () =>
    dispatch(fetchPatients({ page, limit: 15, ...(debounced && { search: debounced }), ...(declaration && { declaration }), ...(completion && { completion }) }));

  useEffect(() => {
    load();
  }, [page, debounced, declaration, completion]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [debounced, declaration, completion]);

  const { items, pagination, stats } = list.data;

  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100/70 text-[0.6875rem] font-bold text-brand-600">{initials(p.fullName)}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-medium text-ink">
              <span className="truncate">{p.fullName}</span>
              {p.status === 'inactive' && <span className="rounded bg-slate-100 px-1.5 text-[0.625rem] font-semibold uppercase text-slate-500">Inactive</span>}
            </div>
            <div className="text-[0.6875rem] text-muted">
              {ageGender(p)} · {p.patientCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      hideBelow: 'md',
      render: (p) => (
        <div>
          <div className="text-ink">{p.phone || '—'}</div>
          <div className="text-[0.6875rem] text-muted">{p.email}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'lg',
      render: (p) => (
        <div>
          <div className="text-ink">{p.city || '—'}</div>
          <div className="text-[0.6875rem] text-muted">{p.state}</div>
        </div>
      ),
    },
    { key: 'createdAt', header: 'Registered', hideBelow: 'md', render: (p) => <span className="text-ink">{formatDate(p.createdAt)}</span> },
    {
      key: 'assessments',
      header: 'Assessments',
      hideBelow: 'lg',
      render: (p) =>
        p.assignments.total ? (
          <span className="text-ink-soft">
            {p.assignments.completed}/{p.assignments.total} done
            <span className="block max-w-[160px] truncate text-[0.6875rem] text-muted">{p.assignments.codes.join(', ')}</span>
          </span>
        ) : (
          <span className="text-[0.6875rem] text-muted">None assigned</span>
        ),
    },
    { key: 'declaration', header: 'Declaration', render: (p) => <DeclarationPill signed={p.declaration?.accepted} /> },
    { key: 'go', header: '', className: 'w-8 text-muted', render: () => <FiChevronRight /> },
  ];

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle="Everyone registered on the platform"
        actions={
          isAdmin && (
            <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
              <FiUserPlus /> Register patient
            </button>
          )
        }
      />

      {stats && (
        <div className="mb-6">
          <StatGroup>
            <StatCard compact value={stats.registered} label="Registered patients" />
            <StatCard compact value={stats.declarationSigned} label="Declaration signed" />
            <StatCard compact value={stats.joinedLast7Days} label="Joined in the last 7 days" />
          </StatGroup>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, email or city" className="lg:w-80" />
        <FilterChips
          label="Declaration"
          value={declaration}
          onChange={setDeclaration}
          options={[
            { value: '', label: 'All' },
            { value: 'signed', label: 'Declaration signed' },
            { value: 'pending', label: 'Declaration pending' },
          ]}
        />
        <div>
          <FilterDropdown
            label="Assessment completion"
            value={completion}
            onChange={setCompletion}
            options={[
              { value: '', label: 'Any assessments' },
              { value: 'pending', label: 'Has pending' },
              { value: 'completed', label: 'All completed' },
              { value: 'none', label: 'None assigned' },
            ]}
          />
        </div>
        <span className="text-xs text-muted lg:ml-auto">
          {items.length} of {pagination.total ?? items.length} patients
        </span>
      </div>

      <section className="card overflow-hidden">
        <DataTable
          columns={columns}
          rows={items}
          status={list.status}
          error={list.error}
          onRetry={load}
          onRowClick={(p) => navigate(`/admin/patients/${p._id}`)}
          emptyTitle="No patients found"
          emptyMessage={search || declaration || completion ? 'Try a different search or filter.' : 'Patients appear here once they register or are registered by staff.'}
        />
        <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
      </section>

      <PatientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(result) => {
          setFormOpen(false);
          setCreated(result);
          load();
        }}
      />
      <InvitationResultModal result={created} onClose={() => setCreated(null)} onViewPatient={() => navigate(`/admin/patients/${created.patient._id}`)} />
    </>
  );
};

export default PatientsPage;
