import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import { EmptyState, ErrorState, Loader } from './Feedback';

export const SearchBar = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <label className={`relative block ${className}`}>
    <span className="sr-only">{placeholder}</span>
    <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
    <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-10" />
  </label>
);

export const FilterDropdown = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="sr-only">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input pr-8" aria-label={label}>
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
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
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
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th key={c.key} className={`whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${c.hideBelow ? hide[c.hideBelow] : ''}`}>
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
                <td key={c.key} className={`px-5 py-3.5 align-middle ${c.className || ''} ${c.hideBelow ? hide[c.hideBelow] : ''}`}>
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
