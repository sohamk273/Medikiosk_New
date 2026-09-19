import { Outlet } from 'react-router-dom';
import { KioskHeader } from './KioskHeader';
import { KioskBottomBar } from './KioskBottomBar';
import { KioskScreenProvider } from '@/context/KioskScreenContext';

export function KioskLayout() {
  return (
    <KioskScreenProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
        <KioskHeader />
        
        <main className="flex-1 overflow-y-auto pb-32">
          <Outlet />
        </main>

        <KioskBottomBar />
      </div>
    </KioskScreenProvider>
  );
}