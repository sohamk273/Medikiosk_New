import { Outlet } from 'react-router-dom';
import { AdminSidebarNav } from './AdminSidebarNav';
import { AdminTopBar } from './AdminTopBar';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <div className="flex-1 flex min-h-0">
        <AdminSidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopBar />
          <main className="flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
