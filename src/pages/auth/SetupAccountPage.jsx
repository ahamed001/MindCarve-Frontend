import { useEffect, useState } from 'react';
import { ErrorMessage, Form, Formik } from 'formik';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AuthLayout from '../../layouts/AuthLayout';
import { CheckboxField, FormInput } from '../../components/FormFields';
import * as Yup from 'yup';
import { Loader } from '../../components/Feedback';
import { acceptInvitation, verifyInvitation } from '../../redux/thunks/authThunks';
import { passwordSchema } from './passwordSchema';

const SetupAccountPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [invite, setInvite] = useState({ status: 'loading', data: null, error: '' });
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!token) {
      setInvite({ status: 'failed', error: 'This link is invalid or has expired.' });
      return;
    }
    dispatch(verifyInvitation(token))
      .unwrap()
      .then((data) => setInvite({ status: 'ready', data }))
      .catch((err) => setInvite({ status: 'failed', error: err.message }));
  }, [dispatch, token]);

  const schema = passwordSchema.shape({ declarationAccepted: Yup.boolean().oneOf([true], 'Please confirm the declaration to continue') });

  const onSubmit = async ({ password, declarationAccepted }) => {
    setSubmitError('');
    try {
      await dispatch(acceptInvitation({ token, password, declarationAccepted })).unwrap();
      navigate('/patient/quizzes', { replace: true });
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  if (invite.status === 'loading') return <Loader className="min-h-screen" label="Checking your invitation…" />;

  if (invite.status === 'failed') {
    return (
      <AuthLayout title="Link not valid" subtitle={invite.error}>
        <p className="text-sm text-muted">
          Invitation links can be used once and expire after a few days. Please contact Athma Mind Care Hospital to receive a new invitation.
        </p>
        <Link to="/login" className="btn-secondary mt-6 w-full">
          Go to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Set up your account" title={`Welcome, ${invite.data.name.split(' ')[0]}`} subtitle="Choose a password to access your assessments.">
      <div className="mb-5 rounded-xl bg-field px-4 py-3 text-sm">
        <span className="text-muted">Signing in as </span>
        <span className="font-semibold text-ink">{invite.data.email}</span>
      </div>
      <Formik initialValues={{ password: '', confirmPassword: '', declarationAccepted: false }} validationSchema={schema} onSubmit={onSubmit}>
        {({ isSubmitting }) => (
          <Form className="space-y-4" noValidate>
            {submitError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{submitError}</div>}
            <FormInput name="password" type="password" label="Password" autoComplete="new-password" hint="At least 8 characters with a letter and a number" required />
            <FormInput name="confirmPassword" type="password" label="Confirm password" autoComplete="new-password" required />
            <div className="rounded-xl border border-line bg-field p-4">
              <CheckboxField
                name="declarationAccepted"
                label="Declaration"
                description="I confirm that the information I provide is true and accurate to the best of my knowledge, and I consent to Athma Mind Care Hospital using it for my care."
              />
              <ErrorMessage name="declarationAccepted">{(m) => <p className="mt-1 text-xs text-risk-high">{m}</p>}</ErrorMessage>
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? 'Setting up…' : 'Create my account'}
            </button>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default SetupAccountPage;
