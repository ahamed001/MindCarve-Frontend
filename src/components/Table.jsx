import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import { EmptyState, ErrorState, Loader } from './Feedback';

export const SearchBar = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <label className={`relative block ${className}`}>
    <span className="sr-only">{placeholder}</span>
    <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
    <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input py-2 pl-10 text-[0.8125rem]" />
  </label>
);

export const FilterDropdown = ({ label, value, onChange, options }) => (
  <label className="inline-block">
    <span className="sr-only">{label}</span>
    {/* Same size as the filter chips next to it. */}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`cursor-pointer rounded-lg border bg-white py-1.5 pl-3 pr-7 text-[0.6875rem] font-semibold outline-none transition hover:border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${value ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-line text-ink'}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

export const Pagination = ({ page, totalPages, total, onChange }) => {
  if (!totalPages || totalPages <= 1) return total ? <p className="px-5 py-3 text-xs text-muted">{total} record(s)</p> : null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs">
      <span className="text-muted">
        Page {page} of {totalPages} · {total} records
      </span>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary px-3 py-1.5" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <FiChevronLeft />
        </button>
        <button type="button" className="btn-secondary px-3 py-1.5" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

/**
 * columns: [{ key, header, render?(row), className?, hideBelow?: 'md' | 'lg' }]
 */
export const DataTable = ({ columns, rows, status, error, onRetry, onRowClick, emptyTitle, emptyMessage, rowKey = (r) => r._id }) => {
  if (status === 'failed') return <ErrorState message={error} onRetry={onRetry} />;
  if (status === 'loading' && !rows.length) return <Loader />;
  if (!rows.length) return <EmptyState title={emptyTitle} message={emptyMessage} />;
  const hide = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };
  return (
    <div className={`overflow-x-auto ${status === 'loading' ? 'opacity-60' : ''}`}>
      <table className="w-full text-left text-[0.8125rem]">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th key={c.key} className={`whitespace-nowrap px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted ${c.hideBelow ? hide[c.hideBelow] : ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={`border-b border-line last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-canvas/70 focus:bg-canvas focus:outline-none' : ''}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 align-middle ${c.className || ''} ${c.hideBelow ? hide[c.hideBelow] : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
