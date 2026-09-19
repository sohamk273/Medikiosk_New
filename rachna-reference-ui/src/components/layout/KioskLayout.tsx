import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackgroundWaves } from '../illustrations/BackgroundWaves';

interface KioskLayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
  onBack?: () => void;
  audioText?: string;
  bottomMessage?: string;
}

export const KioskLayout: React.FC<KioskLayoutProps> = ({
  children,
  showBack = false,
  backTo,
  onBack,
  audioText,
  bottomMessage,
}) => {
  return (
    <div className="relative w-screen h-screen min-h-screen overflow-hidden flex flex-col justify-between select-none bg-[#F4F8FC]">
      {/* Subtle healthcare flowing waves & line art watermark */}
      <BackgroundWaves />

      {/* Top Header */}
      <Header showBack={showBack} backTo={backTo} onBack={onBack} />

      {/* Main Kiosk Content Area (Centered, 16:9 optimized max-width container) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-2 w-full max-w-7xl mx-auto overflow-y-auto">
        {children}
      </main>

      {/* Bottom Footer */}
      <Footer
        customInstructionText={audioText}
        customBottomMessage={bottomMessage}
      />
    </div>
  );
};
