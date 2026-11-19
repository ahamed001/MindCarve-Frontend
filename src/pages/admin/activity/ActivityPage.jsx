import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PageHeader } from '../../../components/Layout';
import { EmptyState, ErrorState, Loader } from '../../../components/Feedback';
import { FilterDropdown } from '../../../components/Table';
import ActivityTimeline from '../../../components/ActivityTimeline';
import { fetchActivity } from '../../../redux/thunks/adminThunks';
import FilterChips from '../../../components/FilterChips';
import AuditLogPanel from './AuditLogPanel';

const CATEGORIES = [
  { value: '', label: 'All events' },
  { value: 'patient', label: 'Patients' },
  { value: 'assessment', label: 'Assessments' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'content', label: 'Content changes' },
  { value: 'system', label: 'System' },
];

const ActivityPage = () => {
  const dispatch = useDispatch();
  const feed = useSelector((s) => s.activity.feed);
  const [category, setCategory] = useState('');
  const isAdmin = useSelector((s) => s.auth.user?.role === 'admin');
  const [view, setView] = useState('activity');

  const load = (page = 1) => dispatch(fetchActivity({ page, limit: 20, ...(category ? { category } : {}) }));
  useEffect(() => {
    load(1);
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  const { items, pagination } = feed.data;
  return (
    <>
      <PageHeader title="Activity" subtitle="Recent events across the platform" />
      {isAdmin && (
        <div className="mb-4">
          <FilterChips
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'activity', label: 'Activity' },
              { value: 'audit', label: 'Audit log' },
            ]}
          />
        </div>
      )}
      {view === 'audit' && isAdmin ? (
        <AuditLogPanel />
      ) : (
      <section className="card p-6 sm:p-8">
        <div className="mb-6 flex justify-end">
          <div>
            <FilterDropdown label="Filter by category" value={category} onChange={setCategory} options={CATEGORIES} />
          </div>
        </div>
        {feed.status === 'failed' ? (
          <ErrorState message={feed.error} onRetry={() => load(1)} />
        ) : feed.status === 'loading' && !items.length ? (
          <Loader />
        ) : !items.length ? (
          <EmptyState title="No activity" message="Events appear here as patients and staff use the platform." />
        ) : (
          <>
            <ActivityTimeline items={items} />
            {pagination.page < pagination.totalPages && (
              <div className="mt-6 text-center">
                <button type="button" className="btn-outline" onClick={() => load(pagination.page + 1)} disabled={feed.status === 'loading'}>
                  {feed.status === 'loading' ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
      )}
    </>
  );
};

export default ActivityPage;
