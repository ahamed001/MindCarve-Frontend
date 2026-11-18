import { useState } from 'react';
import { Form, Formik } from 'formik';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AuthLayout from '../../layouts/AuthLayout';
import { FormInput } from '../../components/FormFields';
import { resetPassword } from '../../redux/thunks/authThunks';
import { passwordSchema } from './passwordSchema';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const dispatch = useDispatch();
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async ({ password }) => {
    setError('');
    try {
      await dispatch(resetPassword({ token, password })).unwrap();
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="All your previous sessions have been signed out.">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link to="/login" className="btn-primary">Patient sign in</Link>
          <Link to="/admin/login" className="btn-secondary">Staff sign in</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>}>
      {!token ? (
        <p className="text-sm text-red-700">This link is invalid or has expired.</p>
      ) : (
        <Formik initialValues={{ password: '', confirmPassword: '' }} validationSchema={passwordSchema} onSubmit={onSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-4" noValidate>
              {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
              <FormInput name="password" type="password" label="New password" autoComplete="new-password" hint="At least 8 characters with a letter and a number" required />
              <FormInput name="confirmPassword" type="password" label="Confirm password" autoComplete="new-password" required />
              <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Update password'}
              </button>
            </Form>
          )}
        </Formik>
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage;
