import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiAlertTriangle, FiCheckCircle, FiInbox, FiX } from 'react-icons/fi';
import { dismissToast } from '../redux/slices/uiSlice';

export const Loader = ({ label = 'Loading…', className = '' }) => (
  <div className={`flex items-center justify-center gap-3 py-12 text-sm text-muted ${className}`} role="status">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
    {label}
  </div>
);

export const EmptyState = ({ title = 'Nothing here yet', message, action, icon: Icon = FiInbox }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500">
      <Icon size={20} />
    </div>
    <p className="font-semibold text-ink">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message = 'Something went wrong.', onRetry }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-risk-high">
      <FiAlertTriangle size={20} />
    </div>
    <p className="font-semibold text-ink">Couldn’t load this</p>
    <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
    {onRetry && (
      <button type="button" className="btn-secondary mt-4" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

/** Renders loading / error / content for a { status, error } resource. */
export const AsyncContent = ({ resource, onRetry, children, loadingLabel }) => {
  if (resource.status === 'failed') return <ErrorState message={resource.error} onRetry={onRetry} />;
  if (!resource.data || (resource.status === 'loading' && !resource.data)) return <Loader label={loadingLabel} />;
  return children(resource.data);
};

const Toast = ({ toast }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    const id = setTimeout(() => dispatch(dismissToast(toast.id)), toast.tone === 'error' ? 6000 : 3500);
    return () => clearTimeout(id);
  }, [dispatch, toast]);
  const error = toast.tone === 'error';
  return (
    <div className={`card flex items-start gap-3 px-4 py-3 text-sm ${error ? 'border-red-200' : ''}`} role={error ? 'alert' : 'status'}>
      {error ? <FiAlertTriangle className="mt-0.5 shrink-0 text-risk-high" /> : <FiCheckCircle className="mt-0.5 shrink-0 text-risk-low" />}
      <span className="flex-1 text-ink">{toast.message}</span>
      <button type="button" onClick={() => dispatch(dismissToast(toast.id))} className="text-muted hover:text-ink" aria-label="Dismiss">
        <FiX />
      </button>
    </div>
  );
};

export const Toaster = () => {
  const toasts = useSelector((s) => s.ui.toasts);
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
};
