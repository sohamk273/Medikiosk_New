import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Volume2, CheckCircle2, ArrowRight, Activity, Mic, FileText, Share2 } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';

export const ConsentPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, consents, setConsents, playClickSound, speakText } = useKiosk();
  const t = TRANSLATIONS[language];

  const handleToggle = (key: keyof typeof consents, labelText: string) => {
    playClickSound();
    const newValue = !consents[key];
    setConsents(prev => ({ ...prev, [key]: newValue }));
    speakText(`${labelText} ${newValue ? 'Enabled' : 'Disabled'}`);
  };

  const handleAudioGuide = () => {
    playClickSound();
    const guideText = `${t.consentTitle}. ${t.consentSubtitle}. ${t.consentDataTitle}: ${t.consentDataDesc}. ${t.consentVoiceTitle}: ${t.consentVoiceDesc}. ${t.consentOcrTitle}: ${t.consentOcrDesc}. ${t.consentAbdmTitle}: ${t.consentAbdmDesc}.`;
    speakText(guideText);
  };

  const handleProceed = () => {
    playClickSound();
    speakText(t.consentAgreeBtn);
    setTimeout(() => {
      navigate('/history/chief-complaint');
    }, 300);
  };

  const consentItems = [
    {
      key: 'dataCollection' as const,
      icon: Activity,
      title: t.consentDataTitle,
      desc: t.consentDataDesc,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      key: 'voiceRecording' as const,
      icon: Mic,
      title: t.consentVoiceTitle,
      desc: t.consentVoiceDesc,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      key: 'documentOcr' as const,
      icon: FileText,
      title: t.consentOcrTitle,
      desc: t.consentOcrDesc,
      color: 'from-purple-500 to-violet-600',
    },
    {
      key: 'abdmShare' as const,
      icon: Share2,
      title: t.consentAbdmTitle,
      desc: t.consentAbdmDesc,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <KioskLayout
      showBack={true}
      backTo="/auth"
      audioText={`${t.consentTitle}. ${t.consentSubtitle}`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-mediblue-700 px-4 py-1.5 rounded-full font-bold text-sm mb-3 border border-blue-100">
            <ShieldCheck className="w-4 h-4" />
            <span>DPDP Compliant Patient Rights</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-2">
            {t.consentTitle}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-slate-500 max-w-2xl mx-auto">
            {t.consentSubtitle}
          </p>

          <button
            type="button"
            onClick={handleAudioGuide}
            className="mt-4 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border-2 border-mediblue-600 text-mediblue-700 font-extrabold text-sm shadow-sm hover:bg-blue-50 transition-all"
          >
            <Volume2 className="w-5 h-5 text-mediblue-600 animate-pulse" />
            <span>{t.consentAudioGuide}</span>
          </button>
        </div>

        {/* Consent Items Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {consentItems.map((item) => {
            const Icon = item.icon;
            const isChecked = consents[item.key];
            return (
              <GlassCard
                key={item.key}
                onClick={() => handleToggle(item.key, item.title)}
                className={`p-6 cursor-pointer border-2 transition-all flex items-start justify-between gap-4 ${
                  isChecked
                    ? 'border-mediblue-600 bg-white shadow-lg shadow-blue-500/10'
                    : 'border-slate-200 bg-white/60 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-navy-900 mb-1">{item.title}</h3>
                    <p className="text-sm font-semibold text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isChecked ? 'bg-medigreen-500 text-white shadow-sm' : 'bg-slate-200 text-transparent'
                }`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Proceed Action Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleProceed}
            className="w-full max-w-xl py-5 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-extrabold text-2xl shadow-xl shadow-mediblue-600/30 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[64px]"
          >
            <span>{t.consentAgreeBtn}</span>
            <ArrowRight className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
