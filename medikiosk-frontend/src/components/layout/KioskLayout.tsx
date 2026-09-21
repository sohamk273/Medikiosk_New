import { Outlet, useLocation } from 'react-router-dom';
import { KioskHeader } from './KioskHeader';
import { KioskBottomBar } from './KioskBottomBar';
import { KioskScreenProvider } from '@/context/KioskScreenContext';
import { BackgroundWaves } from '@/components/illustrations/BackgroundWaves';
import { DemoModeBanner } from '@/demo/components/DemoModeBanner';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { EmergencyFastTrack } from '@/pages/patient/EmergencyFastTrack';
import { SahayakAssistProvider } from '@/features/sahayak/SahayakAssistContext';
import { SahayakPointer } from '@/components/sahayak/SahayakPointer';
import { SahayakTargetHighlight } from '@/components/sahayak/SahayakTargetHighlight';
import { SahayakGuidanceBar } from '@/components/sahayak/SahayakGuidanceBar';
import { SahayakAssistModal } from '@/components/sahayak/SahayakAssistModal';
import { SahayakExitModal } from '@/components/sahayak/SahayakExitModal';
import { SahayakCallModal } from '@/components/sahayak/SahayakCallModal';

export function KioskLayout() {
  const location = useLocation();
  const session = usePatientSession();
  const isLandingPage = location.pathname === '/' || location.pathname === '/patient' || location.pathname === '/patient/';

  if (session.priority === 'CRITICAL') {
    return (
      <KioskScreenProvider>
        <div className="relative h-screen max-h-screen flex flex-col font-sans select-none overflow-hidden bg-red-600">
          <DemoModeBanner />
          <EmergencyFastTrack />
        </div>
      </KioskScreenProvider>
    );
  }

  return (
    <SahayakAssistProvider>
      <KioskScreenProvider>
        <div className="relative h-screen max-h-screen flex flex-col font-sans select-none antialiased text-navy-900 overflow-hidden bg-gradient-to-br from-slate-50 via-[#f0fdf9] to-[#f0f9ff]">
          {/* Top Hackathon Demo Intelligence Mode Bar */}
          <DemoModeBanner />

          {/* Ambient Medical Wave Graphics */}
          {!isLandingPage && <BackgroundWaves />}

          {/* Global Header */}
          <KioskHeader />

          {/* Primary Kiosk Viewport Area */}
          <main className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col w-full custom-scrollbar">
            <div className={`w-full mx-auto flex flex-col ${isLandingPage ? 'h-full max-w-none' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 my-auto'}`}>
              <Outlet />
            </div>
          </main>

          {/* Sahayak Guided Assistance Bar */}
          {!isLandingPage && <SahayakGuidanceBar />}

          {/* Bottom Navigation & Action Bar */}
          {!isLandingPage && <KioskBottomBar />}

          {/* Visual Pointer & Target Highlight */}
          <SahayakPointer />
          <SahayakTargetHighlight />

          {/* Sahayak Modals */}
          <SahayakAssistModal />
          <SahayakExitModal />
          <SahayakCallModal />
        </div>
      </KioskScreenProvider>
    </SahayakAssistProvider>
  );
}