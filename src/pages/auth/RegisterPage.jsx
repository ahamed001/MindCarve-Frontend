import { useState } from 'react';
import { Form, Formik, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from 'react-icons/fi';
import Logo from '../../components/Logo';
import { FormInput, SelectInput, TextAreaInput } from '../../components/FormFields';
import { registerPatient } from '../../redux/thunks/authThunks';
import StateCombobox from '../../components/StateCombobox';
import { INDIAN_STATES } from '../../utils/indianStates';

const GENDERS = [
  { value: '', label: 'Select' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
const MARITAL = [
  { value: '', label: 'Select' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const req = (field) => `The ${field} field is required.`;

// Messages follow the "The … field is required." style of the reference error banner.
const schema = Yup.object({
  fullName: Yup.string().trim().min(2, 'The full name must be at least 2 characters.').max(120).required(req('full name')),
  age: Yup.number().typeError('The age must be a number.').integer('The age must be a whole number.').min(1, 'The age must be at least 1.').max(120, 'The age may not be greater than 120.').required(req('age')),
  phone: Yup.string().required(req('phone')).matches(/^[+\d][\d\s-]{6,18}$/, 'The phone must be a valid phone number.'),
  email: Yup.string().required(req('email')).email('The email must be a valid email address.'),
  address: Yup.string().trim().required(req('full address')).min(3, 'The full address is too short.'),
  city: Yup.string().trim().required(req('city')),
  state: Yup.string().required(req('state')).oneOf(INDIAN_STATES, 'Please choose a state from the list.'),
  pincode: Yup.string().required(req('pincode')).matches(/^\d{6}$/, 'The pincode must be 6 digits.'),
  location: Yup.string().trim().required(req('location')),
  password: Yup.string()
    .required(req('password'))
    .min(8, 'The password must be at least 8 characters.')
    .matches(/[A-Za-z]/, 'The password must contain a letter.')
    .matches(/\d/, 'The password must contain a number.'),
  confirmPassword: Yup.string().required(req('confirm password')).oneOf([Yup.ref('password')], 'The password confirmation does not match.'),
  declarationAccepted: Yup.boolean().oneOf([true], 'Please accept the declaration to continue.'),
});

// Register stays disabled until every required field has something in it and the declaration is ticked.
// Format problems (e.g. a 5-digit pincode) are still explained in the banner when Register is pressed.
const allRequiredFilled = (v) => FIELD_ORDER.every((k) => (k === 'declarationAccepted' ? v[k] === true : String(v[k] ?? '').trim() !== ''));

const FIELD_ORDER = ['fullName', 'age', 'phone', 'email', 'address', 'city', 'state', 'pincode', 'location', 'password', 'confirmPassword', 'declarationAccepted'];

/** Banner shown after a submit attempt: first error message plus how many more remain (as in the reference). */
const ErrorSummary = ({ serverError }) => {
  const { errors, submitCount } = useFormikContext();
  const messages = submitCount > 0 ? FIELD_ORDER.filter((f) => errors[f]).map((f) => errors[f]) : [];
  if (serverError) messages.unshift(serverError);
  if (!messages.length) return null;
  const more = messages.length - 1;
  return (
    <div className="col-span-full rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700" role="alert">
      {messages[0]}
      {more > 0 && ` (and ${more} more error${more > 1 ? 's' : ''})`}
    </div>
  );
};

const INITIAL = {
  fullName: '',
  age: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  location: '',
  maritalStatus: '',
  education: '',
  occupation: '',
  referredBy: '',
  password: '',
  confirmPassword: '',
  declarationAccepted: false,
};

const Divider = ({ children }) => (
  <div className="col-span-full mt-1 flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
    {children}
    <span className="h-px flex-1 bg-line" />
  </div>
);

const PasswordField = ({ label, name, placeholder }) => {
  const [field, meta] = useField(name);
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={name} className="label">
        {label} <span className="text-brand-500">*</span>
      </label>
      <div className="relative">
        <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input id={name} type={show ? 'text' : 'password'} autoComplete="new-password" placeholder={placeholder} {...field} className={`input bg-field pl-10 pr-10 ${meta.touched && meta.error ? 'border-risk-high' : ''}`} />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
      {meta.touched && meta.error && <p className="mt-1 text-xs text-risk-high">{meta.error}</p>}
    </div>
  );
};

const Declaration = () => {
  const [field, meta] = useField({ name: 'declarationAccepted', type: 'checkbox' });
  return (
    <div className="col-span-full">
      <label className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-field p-4 text-[0.8125rem] leading-relaxed text-ink-soft ${meta.touched && meta.error ? 'border-risk-high' : 'border-line'}`}>
        <input type="checkbox" {...field} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500" />
        I confirm that the information provided above is true and accurate to the best of my knowledge, and I consent to Athma Mind Care Hospital using it for my care.
      </label>
      {meta.touched && meta.error && <p className="mt-1 text-xs text-risk-high">{meta.error}</p>}
    </div>
  );
};

const Success = ({ result }) => (
  <div className="text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
      <FiMail size={26} />
    </div>
    <h1 className="text-2xl font-extrabold text-navy">Check your email</h1>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted">
      Your account is ready. We’ve sent your login details and a sign-in link to <span className="font-semibold text-ink">{result.email}</span>.
    </p>
    <p className="mt-3 text-sm text-ink">
      Your Patient ID: <span className="font-bold text-brand-600">{result.patientCode}</span>
    </p>
    {result.emailStatus === 'failed' && <p className="mt-3 text-sm text-risk-high">We couldn’t send the email right now, but you can sign in below.</p>}
    {result.devLoginLink && (
      <p className="mx-auto mt-4 max-w-md rounded-xl border border-dashed border-brand-200 bg-brand-50 p-3 text-xs text-brand-700">
        <strong>Development only:</strong> SMTP is not configured, so the email was saved to <code>server/dev-mail</code>. Link from the email:{' '}
        <a href={result.devLoginLink} className="break-all font-semibold underline">
          {result.devLoginLink}
        </a>
      </p>
    )}
    <Link to={`/login?email=${encodeURIComponent(result.email)}`} className="btn-primary mt-6 px-8 py-3">
      Go to login <FiArrowRight />
    </Link>
  </div>
);

const RegisterPage = () => {
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const onSubmit = async ({ confirmPassword, ...values }) => {
    setError('');
    try {
      setResult(await dispatch(registerPatient({ ...values, age: Number(values.age) })).unwrap());
      window.scrollTo({ top: 0 });
    } catch (err) {
      const extra = (err.errors?.length || 1) - 1;
      setError(extra > 0 ? `${err.message} (and ${extra} more error${extra > 1 ? 's' : ''})` : err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9EEF9] via-white to-[#FFF1E8] px-4 pb-10 pt-4">
      <div className="mb-6 flex justify-center">
        <Logo className="h-14 w-auto" />
      </div>
      <div className="mx-auto w-full max-w-[880px] rounded-[26px] bg-white p-6 shadow-[0_12px_48px_rgba(30,41,59,0.08)] sm:p-12">
        {result ? (
          <Success result={result} />
        ) : (
          <>
            <h1 className="text-[1.75rem] font-extrabold tracking-tight text-navy">Let’s get you registered</h1>
            <p className="mt-1 text-sm text-muted">Takes about a minute. We’ll email your login details once you’re done.</p>
            <Formik initialValues={INITIAL} validationSchema={schema} onSubmit={onSubmit}>
              {({ isSubmitting, values }) => (
                <Form noValidate className="mt-7 grid gap-x-4 gap-y-5 sm:grid-cols-12">
                  <ErrorSummary serverError={error} />
                  <div className="sm:col-span-4"><FormInput name="fullName" label="Full name" placeholder="Full Name" required /></div>
                  <div className="sm:col-span-4"><FormInput name="age" type="number" label="Age" placeholder="Age" min={1} max={120} required /></div>
                  <div className="sm:col-span-4"><SelectInput name="gender" label="Gender" options={GENDERS} /></div>
                  <div className="sm:col-span-4"><FormInput name="phone" type="tel" label="Phone" placeholder="Phone Number" autoComplete="tel" required /></div>
                  <div className="sm:col-span-8"><FormInput name="email" type="email" label="Email" placeholder="Email" autoComplete="email" required /></div>
                  <div className="sm:col-span-12"><TextAreaInput name="address" label="Full Address" placeholder="House/Flat No., Street, Area, Landmark" rows={3} required /></div>
                  <div className="sm:col-span-3"><FormInput name="city" label="City" placeholder="City" required /></div>
                  <div className="sm:col-span-3"><StateCombobox name="state" label="State" placeholder="State" required /></div>
                  <div className="sm:col-span-3"><FormInput name="pincode" label="Pincode" placeholder="6-digit pincode" inputMode="numeric" maxLength={6} required /></div>
                  <div className="sm:col-span-3"><FormInput name="location" label="Location" placeholder="District/Area" required /></div>

                  <Divider>About you</Divider>
                  <div className="sm:col-span-3"><SelectInput name="maritalStatus" label="Marital status" options={MARITAL} /></div>
                  <div className="sm:col-span-3"><FormInput name="education" label="Education" placeholder="e.g. B.E, B.Sc, M.A" /></div>
                  <div className="sm:col-span-3"><FormInput name="occupation" label="Occupation" placeholder="e.g. Engineer, Student" /></div>
                  <div className="sm:col-span-3"><FormInput name="referredBy" label="Referred By (optional)" placeholder="Doctor/Clinic/Person" /></div>

                  <Divider>Account security</Divider>
                  <div className="sm:col-span-6"><PasswordField name="password" label="Password" placeholder="At least 8 characters" /></div>
                  <div className="sm:col-span-6"><PasswordField name="confirmPassword" label="Confirm password" placeholder="Re-enter your password" /></div>

                  <Declaration />

                  <div className="col-span-full mt-2 flex flex-col items-center gap-4">
                    <button type="submit" className="btn w-full max-w-[270px] bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-white shadow-[0_8px_20px_rgba(232,87,31,0.3)] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none" disabled={isSubmitting || !allRequiredFilled(values)}>
                      {isSubmitting ? 'Registering…' : 'Register'} <FiArrowRight />
                    </button>
                    <p className="text-sm text-muted">
                      Already have an account?{' '}
                      <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                        Log in
                      </Link>
                    </p>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        )}
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-muted">
        <FiShield className="shrink-0 text-emerald-600" /> Your details are shared only with your assigned doctor.
      </p>
    </div>
  );
};

export default RegisterPage;
