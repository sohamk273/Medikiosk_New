import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { useDoctorAuth } from '@/features/auth/DoctorAuthContext';

export function EMRLayout() {
  const { isAuthenticated, isLoading } = useDoctorAuth();
  const location = useLocation();

  // Allow login page to render without sidebar navigation
  if (location.pathname === '/doctor/login') {
    return <Outlet />;
  }

  // Prevent flashing unauthenticated content or false redirect while checking backend /auth/me
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-semibold text-sm">Verifying doctor session...</p>
      </div>
    );
  }

  // Route guard: Redirect unauthenticated visits to doctor login
  if (!isAuthenticated) {
    return <Navigate to="/doctor/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <SidebarNav />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
