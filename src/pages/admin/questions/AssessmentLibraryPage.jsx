import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PageHeader, StatCard, StatGroup } from '../../../components/Layout';
import FilterChips from '../../../components/FilterChips';
import { EmptyState, ErrorState, Loader } from '../../../components/Feedback';
import { SearchBar } from '../../../components/Table';
import AssessmentCard from '../../../components/AssessmentCard';
import { fetchAssessments } from '../../../redux/thunks/adminThunks';
import { useDebounce } from '../../../hooks/useDebounce';

const AssessmentLibraryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const list = useSelector((s) => s.assessments.list);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounce(search);

  const load = () => dispatch(fetchAssessments({ ...(debounced && { search: debounced }), ...(status && { status }) }));
  useEffect(() => {
    load();
  }, [debounced, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = list.data || [];
  // Library totals (computed from the unfiltered list).
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!debounced && !status && list.status === 'succeeded') {
      setStats({ total: items.length, questions: items.reduce((n, a) => n + a.questionCount, 0), active: items.filter((a) => a.status === 'published').length });
    }
  }, [items, debounced, status, list.status]);
  return (
    <>
      <PageHeader
        title="Questions & Answers"
        subtitle="How patients respond to each assessment question"
      />
      {stats && !debounced && !status && (
        <div className="mb-6">
          <StatGroup>
            <StatCard compact value={stats.total} label="Quizzes" />
            <StatCard compact value={stats.questions} label="Total questions" />
            <StatCard compact value={stats.active} label="Active quizzes" />
          </StatGroup>
        </div>
      )}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, code or category" className="sm:w-80" />
        <FilterChips
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'All' },
            { value: 'published', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        <span className="text-xs text-muted sm:ml-auto">{items.length} quizzes</span>
      </div>
      {list.status === 'failed' ? (
        <div className="card">
          <ErrorState message={list.error} onRetry={load} />
        </div>
      ) : list.status === 'loading' && !items.length ? (
        <Loader />
      ) : !items.length ? (
        <div className="card">
          <EmptyState title="No assessments found" message="Try a different search." />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((a) => (
            <AssessmentCard key={a._id} assessment={a} onOpen={() => navigate(`/admin/questions/${a._id}`)} />
          ))}
        </div>
      )}
    </>
  );
};

export default AssessmentLibraryPage;
