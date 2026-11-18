import { useState } from 'react';
import { Form, Formik, useField } from 'formik';
import * as Yup from 'yup';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from 'react-icons/fi';
import Logo from '../../components/Logo';
import { login } from '../../redux/thunks/authThunks';
import { homeFor } from '../../routes/ProtectedRoute';

const schema = Yup.object({
  email: Yup.string().required('The email field is required.').email('The email must be a valid email address.'),
  password: Yup.string().required('The password field is required.'),
});

const COPY = {
  patient: {
    panelTitle: 'Good to see you again',
    panelText: 'Pick up right where you left off, at your own pace.',
    title: 'Welcome back',
    subtitle: 'Log in with your registered email and password.',
  },
  staff: {
    panelTitle: 'Athma care team',
    panelText: 'Sign in to manage patients, assessments and reports.',
    title: 'Staff sign in',
    subtitle: 'Admin and clinician access to the Athma workspace.',
  },
};

const IconInput = ({ name, label, icon: Icon, type = 'text', ...props }) => {
  const [field, meta] = useField(name);
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const invalid = meta.touched && meta.error;
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          id={name}
          type={isPassword && !show ? 'password' : isPassword ? 'text' : type}
          {...field}
          {...props}
          aria-invalid={Boolean(invalid)}
          className={`w-full rounded-xl border bg-field py-3.5 pl-12 pr-12 text-[0.9375rem] text-ink placeholder:text-muted/70 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 ${
            invalid ? 'border-risk-high' : 'border-line'
          }`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
      {invalid && <p className="mt-1.5 text-xs text-risk-high">{meta.error}</p>}
    </div>
  );
};

const BrandPanel = ({ copy }) => (
  <div className="relative hidden overflow-hidden bg-navy p-10 text-white md:flex md:w-[42%] md:flex-col">
    <span className="absolute -right-24 -top-16 h-80 w-80 rounded-full bg-white/[0.07]" aria-hidden="true" />
    <span className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-brand-500/20" aria-hidden="true" />
    <div className="relative w-fit rounded-2xl bg-white px-4 py-3">
      <Logo className="h-11 w-auto" />
    </div>
    <div className="relative mt-auto pt-16">
      <h2 className="text-[2rem] text-white font-bold leading-tight">{copy.panelTitle}</h2>
      <p className="mt-3 max-w-xs text-[0.9375rem] leading-relaxed text-white/80">{copy.panelText}</p>
    </div>
    <div className="relative mt-auto flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500">
        <FiShield size={18} />
      </span>
      <div>
        <p className="text-sm font-semibold">Private and confidential</p>
        <p className="mt-0.5 text-sm text-white/75">Your details are only used for your care.</p>
      </div>
    </div>
  </div>
);

const LoginPage = ({ portal }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const copy = COPY[portal];
  const isPatient = portal === 'patient';

  const onSubmit = async (values) => {
    setError('');
    try {
      const { user } = await dispatch(login({ ...values, portal })).unwrap();
      navigate(location.state?.from || homeFor(user), { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#E9EEF9] via-[#F4F6FB] to-[#FFF3EC] px-4 py-8">
      <div className="flex w-full max-w-[1300px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(30,41,59,0.10)] md:min-h-[660px]">
        <BrandPanel copy={copy} />

        <div className="flex flex-1 flex-col px-6 py-8 sm:px-14 sm:py-12">
          <div className="mb-8 flex items-center justify-between gap-3 md:justify-end">
            <Logo className="h-9 w-auto md:hidden" />
            <p className="text-sm text-muted">
              {isPatient ? (
                <>
                  New here?{' '}
                  <Link to="/register" className="font-semibold text-brand-600 hover:underline">
                    Create account
                  </Link>
                </>
              ) : (
                <>
                  Patient?{' '}
                  <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                    Patient login
                  </Link>
                </>
              )}
            </p>
          </div>

          <div className="my-auto w-full">
            <h1 className="text-[2.125rem] font-bold leading-tight text-navy sm:text-[2.375rem]">{copy.title}</h1>
            <p className="mt-2 text-[0.9375rem] text-muted">{copy.subtitle}</p>

            <Formik initialValues={{ email: params.get('email') || '', password: '' }} validationSchema={schema} onSubmit={onSubmit}>
              {({ isSubmitting }) => (
                <Form noValidate className="mt-8 space-y-6">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700" role="alert">
                      {error}
                    </div>
                  )}
                  <IconInput name="email" type="email" label="Email" icon={FiMail} placeholder="you@example.com" autoComplete="email" />
                  <div>
                    <IconInput name="password" type="password" label="Password" icon={FiLock} placeholder="Enter your password" autoComplete="current-password" />
                    <div className="mt-2 text-right">
                      <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn w-full bg-brand-500 py-4 text-base text-white shadow-[0_10px_24px_rgba(232,87,31,0.28)] hover:bg-brand-600"
                  >
                    {isSubmitting ? 'Logging in…' : 'Log in'} <FiArrowRight />
                  </button>
                  {isPatient && (
                    <>
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
                      </div>
                      <Link to="/register" className="btn w-full border border-line bg-white py-4 text-base text-navy hover:bg-field">
                        Create a new account
                      </Link>
                    </>
                  )}
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
