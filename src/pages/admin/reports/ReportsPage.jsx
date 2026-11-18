import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus } from 'react-icons/fi';
import { PageHeader } from '../../../components/Layout';
import { AsyncContent, EmptyState } from '../../../components/Feedback';
import ReportCard from '../../../components/ReportCard';
import { downloadReport, fetchReport, fetchReports, generateReport } from '../../../redux/thunks/adminThunks';
import { useToast } from '../../../hooks/useToast';

const currentMonth = () => new Date().toISOString().slice(0, 7);

const ReportsPage = () => {
  const dispatch = useDispatch();
  const index = useSelector((s) => s.reports.index);
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [busyType, setBusyType] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const pollRef = useRef(null);

  const load = () => dispatch(fetchReports());
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll any report that is still generating; stop once all are ready/failed.
  const generatingIds = (index.data?.reports || []).filter((r) => r.status === 'generating').map((r) => r._id);
  const generatingKey = generatingIds.join(',');
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!generatingIds.length) return undefined;
    pollRef.current = setInterval(() => generatingIds.forEach((id) => dispatch(fetchReport(id))), 1500);
    return () => clearInterval(pollRef.current);
  }, [generatingKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async (type, forMonth = month) => {
    setBusyType(type);
    try {
      await dispatch(generateReport({ type, month: forMonth })).unwrap();
      toast.success('Report generation started');
    } catch (err) {
      toast.error(err);
    } finally {
      setBusyType(null);
    }
  };

  const download = async (id) => {
    setDownloadingId(id);
    try {
      await dispatch(downloadReport(id)).unwrap();
    } catch (err) {
      toast.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Download summaries for your team" />
      <AsyncContent resource={index} onRetry={load}>
        {({ definitions, reports }) => (
          <div className="space-y-8">
            <section className="card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Generate a report</h2>
                  <p className="mt-0.5 text-sm text-muted">Reports are built from stored records for the selected month. They contain patient data — share only with authorised staff.</p>
                </div>
                <label className="block sm:w-48">
                  <span className="label">Reporting month</span>
                  <input type="month" className="input" value={month} max={currentMonth()} onChange={(e) => setMonth(e.target.value)} />
                </label>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {definitions.map((d) => (
                  <button
                    key={d.type}
                    type="button"
                    onClick={() => generate(d.type)}
                    disabled={!month || busyType === d.type}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left transition hover:border-brand-200 hover:bg-brand-50 disabled:opacity-60"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100/70 text-[0.6875rem] font-bold text-brand-600">{d.format.toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{d.title}</span>
                      <span className="block text-xs text-muted">{d.description}</span>
                    </span>
                    <FiPlus className="text-brand-500" />
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold">Generated reports</h2>
              {reports.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {reports.map((r) => (
                    <ReportCard
                      key={r._id}
                      report={r}
                      downloading={downloadingId === r._id}
                      onDownload={() => download(r._id)}
                      onRetry={() => generate(r.type, new Date(r.periodStart).toISOString().slice(0, 7))}
                    />
                  ))}
                </div>
              ) : (
                <div className="card">
                  <EmptyState title="No reports generated yet" message="Choose a month and a report type above." />
                </div>
              )}
            </section>
          </div>
        )}
      </AsyncContent>
    </>
  );
};

export default ReportsPage;
