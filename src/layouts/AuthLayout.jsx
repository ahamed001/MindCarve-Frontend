import Logo from '../components/Logo';

const AuthLayout = ({ title, subtitle, children, footer, eyebrow }) => (
  <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-gradient-to-br from-[#EEF2FA] via-white to-[#FFF3EC] px-4 py-8 sm:items-center">
    <div className="w-full max-w-md">
      <div className="mb-6 flex justify-center">
        <Logo className="h-12 w-auto" />
      </div>
      <div className="rounded-[22px] border border-white bg-white p-6 shadow-[0_10px_40px_rgba(30,41,59,0.08)] sm:p-8">
        {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">{eyebrow}</div>}
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
    </div>
  </div>
);

export default AuthLayout;
