import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiActivity, FiFileText, FiGrid, FiHelpCircle, FiLogOut, FiMenu, FiUsers, FiX } from 'react-icons/fi';
import Logo from './Logo';
import { logout } from '../redux/thunks/authThunks';

const NAV = [
  { to: '/admin/overview', label: 'Overview', icon: FiGrid },
  { to: '/admin/patients', label: 'Patients', icon: FiUsers },
  { to: '/admin/questions', label: 'Questions & Answers', icon: FiHelpCircle },
  { to: '/admin/reports', label: 'Reports', icon: FiFileText, adminOnly: true },
  { to: '/admin/activity', label: 'Activity', icon: FiActivity },
];

const NavItems = ({ role, onNavigate }) => (
  <nav className="flex flex-col gap-1.5" aria-label="Main">
    {NAV.filter((n) => !n.adminOnly || role === 'admin').map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          `relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-medium transition ${
            isActive ? 'bg-brand-100/70 font-semibold text-brand-600' : 'text-ink hover:bg-brand-50'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && <span className="absolute -left-5 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" aria-hidden="true" />}
            <Icon size={19} className={isActive ? 'text-brand-500' : 'text-ink-soft'} />
            {label}
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

const ProfileFooter = ({ user }) => {
  const dispatch = useDispatch();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/60 p-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-base font-bold text-white">
        {(user?.name || '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-ink">{user?.name}</div>
        <div className="truncate text-xs text-muted">{user?.email}</div>
      </div>
      <button type="button" onClick={() => dispatch(logout())} className="rounded-lg p-2 text-ink-soft hover:bg-white hover:text-ink" title="Sign out" aria-label="Sign out">
        <FiLogOut size={18} />
      </button>
    </div>
  );
};

const AdminSidebar = () => {
  const user = useSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Logo className="h-9 w-auto" />
        <button type="button" className="rounded-lg p-2 text-ink" onClick={() => setOpen(true)} aria-label="Open menu">
          <FiMenu size={20} />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-white px-5 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <button type="button" className="rounded-lg p-1.5 text-muted lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <FiX size={18} />
          </button>
        </div>
        <div className="mb-3 px-2 text-sm font-medium text-ink-soft">Menu</div>
        <NavItems role={user?.role} onNavigate={() => setOpen(false)} />
        <div className="mt-auto pt-6">
          <ProfileFooter user={user} />
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
