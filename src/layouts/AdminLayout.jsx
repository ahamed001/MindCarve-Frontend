import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminLayout = () => (
  <div className="min-h-screen bg-canvas lg:flex">
    <AdminSidebar />
    <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <Outlet />
      </div>
    </main>
  </div>
);

export default AdminLayout;
