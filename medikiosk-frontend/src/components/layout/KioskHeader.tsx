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
      <header className="relative z-30 h-[88px] shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-10 flex items-center justify-between shadow-sm">
        {/* Left: Branding & Hospital Identity */}
        <div className="flex items-center gap-4 lg:gap-6">
          
          {/* Logo Group */}
          <div className="flex items-center gap-3">
            <div className="flex items-center h-[52px]">
              <img 
                src="/logo.png" 
                alt="Swasthya Sahayak Logo" 
                className="h-full w-auto object-contain drop-shadow-sm"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[20px] sm:text-2xl font-black tracking-tight text-navy-900 leading-none flex items-center gap-1 whitespace-nowrap">
                Swasthya <span className="text-medigreen-700">Sahayak</span><sup className="text-[10px] text-slate-400 font-bold -mt-3">™</sup>
              </h1>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wide mt-1 whitespace-nowrap">
                Powered by <span className="font-bold text-navy-800">MediKiosk</span>
              </p>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-slate-200 mx-1 lg:mx-2 shrink-0"></div>

          {/* Ministry / Program Info */}
          <div className="hidden md:flex flex-col justify-center gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider shadow-sm whitespace-nowrap">
                Smart OPD
              </span>
              <p className="text-[11px] lg:text-xs font-bold text-navy-900 whitespace-nowrap">National Health Triage Platform</p>
            </div>
            <p className="text-[10px] lg:text-[11px] text-slate-500 font-medium whitespace-nowrap">
              Ministry of Ayush, Govt. of India
            </p>
          </div>
        </div>

        {/* Right: Kiosk Global Controls */}
        <div className="flex items-center gap-3">
          {/* Emergency Alert Button */}
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 active:scale-95 px-5 py-2.5 rounded-full font-bold text-sm border border-rose-200 transition-all shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{t('header.emergencyHelp')}</span>
          </button>

          {/* Audio ON / OFF Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            aria-label="Toggle voice guidance"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm border transition-all active:scale-95 shadow-sm ${audioEnabled
                ? 'bg-medigreen-50 text-medigreen-700 border-medigreen-300 hover:bg-medigreen-100'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-medigreen-600" />
                <span>{t('header.audioOn')}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>{t('header.audioOff')}</span>
              </>
            )}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(prev => !prev)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-navy-900 px-5 py-2.5 rounded-full font-bold text-sm border border-slate-300 transition-all active:scale-95 shadow-sm"
            >
              <Globe className="w-4 h-4 text-mediblue-600" />
              <span>{currentLangLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full text-left px-4 py-2.5 font-bold text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${language === 'en' ? 'text-medigreen-700 bg-medigreen-50/70 font-extrabold' : 'text-slate-700'
                    }`}
                >
                  <span>English</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">EN</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi')}
                  className={`w-full text-left px-4 py-2.5 font-bold text-sm flex items-center justify-between hover:bg-slate-50 transition-colors font-devanagari ${language === 'hi' ? 'text-medigreen-700 bg-medigreen-50/70 font-extrabold' : 'text-slate-700'
                    }`}
                >
                  <span>हिन्दी</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">HI</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('mr')}
                  className={`w-full text-left px-4 py-2.5 font-bold text-sm flex items-center justify-between hover:bg-slate-50 transition-colors font-devanagari ${language === 'mr' ? 'text-medigreen-700 bg-medigreen-50/70 font-extrabold' : 'text-slate-700'
                    }`}
                >
                  <span>मराठी</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">MR</span>
                </button>
              </div>
            )}
          </div>

          {/* Harmless Session Information Profile Icon */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            title={t('header.sessionProfile')}
            className="w-[42px] h-[42px] rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center justify-center transition-all active:scale-95 shadow-sm"
          >
            <User className="w-4 h-4 text-slate-600" />
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