import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useField } from 'formik';
import { FiChevronDown } from 'react-icons/fi';
import { INDIAN_STATES } from '../utils/indianStates';

/**
 * Typeable dropdown for Indian states/UTs (Formik field). Typing filters the list;
 * a value is only committed when an option is chosen, so the field always holds a valid state.
 */
const StateCombobox = ({ name, label, required, placeholder = 'Select state' }) => {
  const [field, meta, helpers] = useField(name);
  const [query, setQuery] = useState(field.value || '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) setQuery(field.value || '');
  }, [field.value, open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q === (field.value || '').toLowerCase()) return INDIAN_STATES;
    return INDIAN_STATES.filter((s) => s.toLowerCase().includes(q)).sort((a, b) => a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q));
  }, [query, field.value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (value) => {
    helpers.setValue(value);
    setQuery(value);
    setOpen(false);
  };

  // Leaving the field: accept an exact (case-insensitive) match, otherwise restore the last valid value.
  function close() {
    if (!open) return;
    const exact = INDIAN_STATES.find((s) => s.toLowerCase() === query.trim().toLowerCase());
    if (exact) helpers.setValue(exact);
    else setQuery(field.value || '');
    setOpen(false);
    helpers.setTouched(true);
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      if (matches[active]) choose(matches[active]);
    } else if (e.key === 'Escape') {
      close();
    } else if (e.key === 'Tab') {
      if (open && query.trim() && matches[0] && query !== field.value) choose(matches[active] || matches[0]);
      else close();
    }
  };

  const invalid = meta.touched && meta.error;
  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="text-brand-500"> *</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={Boolean(invalid)}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className={`input pr-9 ${invalid ? 'border-risk-high' : ''}`}
        />
        <FiChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <ul id={listId} ref={listRef} role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-lg">
          {matches.length ? (
            matches.map((s, i) => (
              <li
                key={s}
                role="option"
                aria-selected={s === field.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-3.5 py-2 text-sm ${i === active ? 'bg-brand-50 text-brand-700' : 'text-ink'} ${s === field.value ? 'font-semibold' : ''}`}
              >
                {s}
              </li>
            ))
          ) : (
            <li className="px-3.5 py-2 text-sm text-muted">No matching state</li>
          )}
        </ul>
      )}
      {invalid && <p className="mt-1 text-xs text-risk-high">{meta.error}</p>}
    </div>
  );
};

export default StateCombobox;
