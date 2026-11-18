import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GuestRoute, ProtectedRoute, homeFor } from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import { Loader } from '../components/Feedback';

import LoginPage from '../pages/auth/LoginPage';
import SetupAccountPage from '../pages/auth/SetupAccountPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

import OverviewPage from '../pages/admin/overview/OverviewPage';
import PatientsPage from '../pages/admin/patients/PatientsPage';
import PatientDetailPage from '../pages/admin/patients/PatientDetailPage';
import SubmissionPage from '../pages/admin/patients/SubmissionPage';
import AssessmentLibraryPage from '../pages/admin/questions/AssessmentLibraryPage';
import AssessmentBuilderPage from '../pages/admin/questions/AssessmentBuilderPage';
import ReportsPage from '../pages/admin/reports/ReportsPage';
import ActivityPage from '../pages/admin/activity/ActivityPage';

import QuizListPage from '../pages/patient/quizzes/QuizListPage';
import TakeAssessmentPage from '../pages/patient/assessments/TakeAssessmentPage';

const RootRedirect = () => {
  const { user, status } = useSelector((s) => s.auth);
  if (status === 'checking') return <Loader className="min-h-screen" />;
  return <Navigate to={user ? homeFor(user) : '/login'} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />

    <Route path="/login" element={<GuestRoute><LoginPage portal="patient" /></GuestRoute>} />
    <Route path="/admin/login" element={<GuestRoute><LoginPage portal="staff" /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
    <Route path="/setup-account" element={<SetupAccountPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    <Route element={<ProtectedRoute roles={['admin', 'clinician']} loginPath="/admin/login" />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="submissions/:assignmentId" element={<SubmissionPage />} />
        <Route path="questions" element={<AssessmentLibraryPage />} />
        <Route path="questions/:id" element={<AssessmentBuilderPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route element={<ProtectedRoute roles={['admin']} loginPath="/admin/login" />}>
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>
    </Route>

    <Route element={<ProtectedRoute roles={['patient']} loginPath="/login" />}>
      <Route path="/patient" element={<Navigate to="/patient/quizzes" replace />} />
      <Route path="/patient/quizzes" element={<QuizListPage />} />
      <Route path="/patient/assessments/:id" element={<TakeAssessmentPage />} />
      <Route path="/patient/*" element={<Navigate to="/patient/quizzes" replace />} />
    </Route>

    <Route path="*" element={<RootRedirect />} />
  </Routes>
);

export default AppRoutes;
