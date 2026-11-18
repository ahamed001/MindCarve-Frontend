import { useField } from 'formik';

const FieldShell = ({ label, name, meta, hint, children, required }) => (
  <div>
    {label && (
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="text-brand-500"> *</span>}
      </label>
    )}
    {children}
    {meta.touched && meta.error ? (
      <p className="mt-1 text-xs text-risk-high" role="alert">
        {meta.error}
      </p>
    ) : (
      hint && <p className="mt-1 text-xs text-muted">{hint}</p>
    )}
  </div>
);

export const FormInput = ({ label, hint, required, ...props }) => {
  const [field, meta] = useField(props);
  return (
    <FieldShell label={label} name={props.name} meta={meta} hint={hint} required={required}>
      <input id={props.name} {...field} {...props} className={`input ${meta.touched && meta.error ? 'border-risk-high' : ''}`} aria-invalid={Boolean(meta.touched && meta.error)} />
    </FieldShell>
  );
};

export const TextAreaInput = ({ label, hint, required, rows = 3, ...props }) => {
  const [field, meta] = useField(props);
  return (
    <FieldShell label={label} name={props.name} meta={meta} hint={hint} required={required}>
      <textarea id={props.name} rows={rows} {...field} {...props} className={`input ${meta.touched && meta.error ? 'border-risk-high' : ''}`} />
    </FieldShell>
  );
};

export const SelectInput = ({ label, hint, required, options, ...props }) => {
  const [field, meta] = useField(props);
  return (
    <FieldShell label={label} name={props.name} meta={meta} hint={hint} required={required}>
      <select id={props.name} {...field} {...props} className={`input ${meta.touched && meta.error ? 'border-risk-high' : ''}`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
};

export const CheckboxField = ({ label, description, ...props }) => {
  const [field] = useField({ ...props, type: 'checkbox' });
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" {...field} {...props} className="mt-0.5 h-4 w-4 rounded border-line text-brand-500 accent-brand-500" />
      <span>
        <span className="font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
};
