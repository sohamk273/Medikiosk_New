import { useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, User, Globe, ChevronDown } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { ttsService } from '@/services/voice/ttsService';
import { useTranslation } from '@/i18n';
import type { Language } from '@/i18n';
import { EmergencyHelpModal } from '@/components/kiosk/modals/EmergencyHelpModal';
import { ProfileSessionModal } from '@/components/kiosk/modals/ProfileSessionModal';

export function KioskHeader() {
  const { audioEnabled, setAudioEnabled } = usePatientSession();
  const { t, language, setLanguage } = useTranslation();

  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const toggleAudio = () => {
    if (audioEnabled) {
      ttsService.stop();
      setAudioEnabled(false);
    } else {
      setAudioEnabled(true);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setLangMenuOpen(false);
  };

  const currentLangLabel = 
    language === 'hi' ? 'हिन्दी (HI)' : language === 'mr' ? 'मराठी (MR)' : 'English (EN)';

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md">
            +
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary tracking-tight">
              MediKiosk OPD
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Self-Service Health Triage • OPD Room 4
            </p>
          </div>
        </div>

        {/* Right: Kiosk Global Controls */}
        <div className="flex items-center gap-4">
          {/* Emergency Alert Button */}
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-bold text-sm border border-red-200 transition-colors shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>{t('header.emergencyHelp')}</span>
          </button>

          {/* Audio ON / OFF Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-colors shadow-sm ${
              audioEnabled
                ? 'bg-[#E6FAF5] text-[#0D9488] border-[#A7F3D0] hover:bg-[#D1F4E8]'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-5 h-5 text-[#0D9488]" />
                <span>{t('header.audioOn')}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5 text-slate-500" />
                <span>{t('header.audioOff')}</span>
              </>
            )}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(prev => !prev)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm border border-slate-200 transition-colors shadow-sm"
            >
              <Globe className="w-5 h-5 text-primary" />
              <span>{currentLangLabel}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full text-left px-4 py-2.5 font-bold text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    language === 'en' ? 'text-[#0D9488] bg-[#E6FAF5]/50' : 'text-slate-700'
                  }`}
                >
                  <span>English</span>
                  <span className="text-xs text-slate-400">EN</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi')}
                  className={`w-full text-left px-4 py-2.5 font-bold text-sm flex items-center justify-between hover:bg-slate-50 transition-colors font-devanagari ${
                    language === 'hi' ? 'text-[#0D9488] bg-[#E6FAF5]/50' : 'text-slate-700'
                  }`}
                >
                  <span>हिन्दी</span>
                  <span className="text-xs text-slate-400">HI</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('mr')}
                  className={`w-full text-left px-4 py-2.5 font-bold text-sm flex items-center justify-between hover:bg-slate-50 transition-colors font-devanagari ${
                    language === 'mr' ? 'text-[#0D9488] bg-[#E6FAF5]/50' : 'text-slate-700'
                  }`}
                >
                  <span>मराठी</span>
                  <span className="text-xs text-slate-400">MR</span>
                </button>
              </div>
            )}
          </div>

          {/* Harmless Session Information Profile Icon */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            title={t('header.sessionProfile')}
            className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors shadow-sm"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Emergency Modal */}
      <EmergencyHelpModal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />

      {/* Harmless Session Info Modal */}
      <ProfileSessionModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}
