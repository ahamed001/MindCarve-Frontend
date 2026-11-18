import { useState } from 'react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AuthLayout from '../../layouts/AuthLayout';
import { FormInput } from '../../components/FormFields';
import { forgotPassword } from '../../redux/thunks/authThunks';

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onSubmit = async (values) => {
    setError('');
    try {
      setResult(await dispatch(forgotPassword(values)).unwrap());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We’ll email you a secure link to choose a new password." footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>}>
      {result ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
            {result.__message}
          </div>
          {result.devLink && (
            <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50 px-4 py-3 text-xs text-brand-700">
              <strong>Development only:</strong> SMTP is not configured, so the link is shown here.{' '}
              <a className="break-all font-semibold underline" href={result.devLink}>
                Open reset link
              </a>
            </div>
          )}
        </div>
      ) : (
        <Formik initialValues={{ email: '' }} validationSchema={Yup.object({ email: Yup.string().email('Enter a valid email').required('Email is required') })} onSubmit={onSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-4" noValidate>
              {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
              <FormInput name="email" type="email" label="Email" autoComplete="email" required />
              <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </Form>
          )}
        </Formik>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
