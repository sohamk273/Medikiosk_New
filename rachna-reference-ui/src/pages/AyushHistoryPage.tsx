import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, Volume2, CheckCircle2, FastForward } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';
import { AyushEntry } from '../types/kiosk';

export const AyushHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setAyushEntries, playClickSound, speakText } = useKiosk();
  const t = TRANSLATIONS[language];

  const [nadi, setNadi] = useState('Vata-Pitta (Moderate)');
  const [mala, setMala] = useState('Normal (Regular)');
  const [mutra, setMutra] = useState('Normal (4-5 times/day)');
  const [jihva, setJihva] = useState('Clear / Normal Pink');
  const [prakriti, setPrakriti] = useState('Pitta-Kapha Dual');

  const ayushFields = [
    {
      key: 'nadi',
      label: t.ayushNadi,
      current: nadi,
      setter: setNadi,
      options: ['Vata Dominant (Fast)', 'Pitta Dominant (Jumping)', 'Kapha Dominant (Slow)', 'Vata-Pitta (Moderate)'],
    },
    {
      key: 'mala',
      label: t.ayushMala,
      current: mala,
      setter: setMala,
      options: ['Normal (Regular)', 'Constipated (Hard)', 'Loose Stools (Frequent)', 'Irregular'],
    },
    {
      key: 'mutra',
      label: t.ayushMutra,
      current: mutra,
      setter: setMutra,
      options: ['Normal (4-5 times/day)', 'Frequent Urination', 'Burning Sensation', 'Dark Yellow'],
    },
    {
      key: 'jihva',
      label: t.ayushJihva,
      current: jihva,
      setter: setJihva,
      options: ['Clear / Normal Pink', 'Coated (Samya)', 'Pale / Dry', 'Reddish Tint'],
    },
    {
      key: 'prakriti',
      label: t.ayushPrakriti,
      current: prakriti,
      setter: setPrakriti,
      options: ['Vata Dominant', 'Pitta Dominant', 'Kapha Dominant', 'Pitta-Kapha Dual'],
    },
  ];

  const handleSelect = (setter: (v: string) => void, val: string, label: string) => {
    playClickSound();
    setter(val);
    speakText(`${label}: ${val}`);
  };

  const handleSkip = () => {
    playClickSound();
    speakText('Skipping AYUSH module.');
    setTimeout(() => {
      navigate('/documents');
    }, 300);
  };

  const handleSave = () => {
    playClickSound();
    const entries: AyushEntry[] = [
      { fieldKey: 'nadi', label: t.ayushNadi, value: nadi },
      { fieldKey: 'mala', label: t.ayushMala, value: mala },
      { fieldKey: 'mutra', label: t.ayushMutra, value: mutra },
      { fieldKey: 'jihva', label: t.ayushJihva, value: jihva },
      { fieldKey: 'prakriti', label: t.ayushPrakriti, value: prakriti },
    ];
    setAyushEntries(entries);
    speakText(t.ayushSave);
    setTimeout(() => {
      navigate('/documents');
    }, 300);
  };

  return (
    <KioskLayout
      showBack={true}
      backTo="/history/socrates"
      audioText={`${t.ayushTitle}. ${t.ayushSubtitle}`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full font-bold text-sm mb-3 border border-emerald-200">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span>AYUSH Traditional OPD Assessment</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-2">
            {t.ayushTitle}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-slate-500 max-w-2xl mx-auto">
            {t.ayushSubtitle}
          </p>
        </div>

        {/* AYUSH Fields List */}
        <div className="space-y-4 mb-8">
          {ayushFields.map((field) => (
            <GlassCard key={field.key} className="p-5">
              <h3 className="text-lg font-extrabold text-navy-900 mb-3 flex items-center justify-between">
                <span>{field.label}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  {field.current}
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {field.options.map((opt, i) => {
                  const isSelected = field.current === opt;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(field.setter, opt, field.label)}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-left flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleSkip}
            className="py-4 px-6 rounded-2xl bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-lg flex items-center gap-2"
          >
            <FastForward className="w-5 h-5" />
            <span>{t.ayushSkip}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-5 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[64px]"
          >
            <span>{t.ayushSave}</span>
            <ArrowRight className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
