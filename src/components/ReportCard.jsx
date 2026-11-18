import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { formatBytes, formatDateTime } from '../utils/format';

/** Card matching the reference Reports screen: format tile, title, "period, size/status", download action. */
const ReportCard = ({ report, onDownload, onRetry, downloading }) => {
  const statusText =
    report.status === 'ready' ? formatBytes(report.sizeBytes) : report.status === 'failed' ? 'Failed' : 'Preparing';
  return (
    <div className="card flex items-center gap-4 p-6">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100/70 text-sm font-bold text-brand-600">
        {report.format.toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[16px] font-semibold text-ink">{report.title}</h3>
        <p className={`mt-0.5 text-sm ${report.status === 'failed' ? 'text-risk-high' : 'text-muted'}`}>
          {report.periodLabel}, {statusText}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          Requested {formatDateTime(report.createdAt)}
          {report.requestedBy?.name ? ` by ${report.requestedBy.name}` : ''}
        </p>
      </div>
      {report.status === 'failed' ? (
        <button type="button" className="btn-outline" onClick={onRetry}>
          <FiRefreshCw /> Retry
        </button>
      ) : (
        <button type="button" className="btn-outline" onClick={onDownload} disabled={report.status !== 'ready' || downloading} aria-busy={report.status === 'generating'}>
          {report.status === 'generating' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" /> : <FiDownload />}
          <span className="hidden sm:inline">{downloading ? 'Downloading…' : 'Download'}</span>
        </button>
      )}
    </div>
  );
};

export default ReportCard;
