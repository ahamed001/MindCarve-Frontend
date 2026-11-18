import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader } from '../components/Feedback';

export const homeFor = (user) => (user?.role === 'patient' ? '/patient/quizzes' : '/admin/overview');

/** UX-level guard only; the API enforces every permission independently. */
export const ProtectedRoute = ({ roles, loginPath }) => {
  const { user, status } = useSelector((s) => s.auth);
  const location = useLocation();
  if (status === 'checking') return <Loader label="Checking your session…" className="min-h-screen" />;
  if (!user) return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
};

export const GuestRoute = ({ children }) => {
  const { user, status } = useSelector((s) => s.auth);
  if (status === 'checking') return <Loader label="Checking your session…" className="min-h-screen" />;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return children;
};
