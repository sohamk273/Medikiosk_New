import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Thermometer, Wind, Zap, Droplets, Bone, HelpCircle, CheckCircle2, PlusCircle } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { AudioGuidanceBanner } from '@/components/kiosk/AudioGuidanceBanner';

interface Symptom {
  id: string;
  icon: React.ReactNode;
  hindi: string;
  english: string;
  subtext: string;
}

const SYMPTOMS: Symptom[] = [
  {
    id: 'pain',
    icon: <span className="text-3xl">✕</span>,
    hindi: 'दर्द',
    english: 'Pain',
    subtext: 'पेट, सिर या सीने में दर्द',
  },
  {
    id: 'fever',
    icon: <Thermometer className="w-7 h-7" />,
    hindi: 'बुखार',
    english: 'Fever',
    subtext: 'तापमान, कंपकपी, पसीना',
  },
  {
    id: 'cough',
    icon: <Wind className="w-7 h-7" />,
    hindi: 'खांसी-जुकाम',
    english: 'Cough, Cold & Flu',
    subtext: '',
  },
  {
    id: 'stomach',
    icon: <Droplets className="w-7 h-7" />,
    hindi: 'पेट / पाचन',
    english: 'Stomach / Digestion',
    subtext: '',
  },
  {
    id: 'weakness',
    icon: <Zap className="w-7 h-7" />,
    hindi: 'कमजोरी / थकान',
    english: 'Weakness / Dizziness',
    subtext: '',
  },
  {
    id: 'skin',
    icon: <span className="text-3xl">⬇</span>,
    hindi: 'त्वचा की समस्या',
    english: 'Skin, Allergy, Rash',
    subtext: '',
  },
  {
    id: 'joints',
    icon: <Bone className="w-7 h-7" />,
    hindi: 'जोड़ों में दर्द',
    english: 'Joints & Body Ache',
    subtext: '',
  },
  {
    id: 'other',
    icon: <HelpCircle className="w-7 h-7" />,
    hindi: 'अन्य समस्या',
    english: 'Other Condition',
    subtext: '',
  },
];

export default function ChiefComplaint() {
  const navigate = useNavigate();
  const { chiefComplaint, setChiefComplaint } = usePatientSession();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (chiefComplaint.primaryComplaint) {
      return chiefComplaint.primaryComplaint.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  });

  const toggleSymptom = (id: string) => {
    const next = selectedIds.includes(id) 
      ? selectedIds.filter(s => s !== id) 
      : [...selectedIds, id];
    setSelectedIds(next);
    const labels = next.map(sid => {
      const s = SYMPTOMS.find(sy => sy.id === sid);
      return s ? `${s.hindi} (${s.english})` : sid;
    });
    setChiefComplaint({ primaryComplaint: labels.join(', ') });
  };

  const selectedLabels = selectedIds.map(sid => {
    const s = SYMPTOMS.find(sy => sy.id === sid);
    return s ? `${s.hindi} (${s.english})` : sid;
  });

  return (
    <div className="w-full max-w-7xl mx-auto pt-6 px-4 pb-32">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="text-4xl font-bold text-primary mb-1 font-devanagari">
          आज आप अस्पताल किस समस्या के लिए आए हैं?
        </h2>
        <p className="text-xl text-slate-600">What brings you to the hospital today?</p>
      </div>

      <AudioGuidanceBanner
        englishText="Tap the microphone to speak, or select a common symptom card below."
        regionalText="बोलकर बताएं या नीचे दिए गए विकल्पों में से चुनें।"
      />

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-[340px_1fr] gap-6">

        {/* LEFT: Voice AI Panel */}
        <button
          onClick={() => navigate('/patient/voice')}
          className="relative bg-[#E6FAF5] rounded-3xl p-6 flex flex-col items-center justify-between min-h-[380px] border border-[#A7F3D0] hover:bg-[#D1F4E8] hover:border-[#0D9488] transition-all duration-300 w-full text-left focus:outline-none focus:ring-4 focus:ring-[#0D9488]/30 cursor-pointer shadow-sm hover:shadow-md"
          aria-label="Tap to Speak Your Issue"
        >
          {/* VOICE AI MODE badge */}
          <div className="absolute top-4 left-4 bg-white text-primary text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            VOICE AI MODE
          </div>
          {/* Translation icon top-right */}
          <div className="absolute top-4 right-4 text-slate-400 text-xl">𝑨</div>

          {/* Mic orb */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-8">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="w-48 h-48 rounded-full bg-[#B2F5E0]/40 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full bg-[#5EEAD4]/30 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-[#0D9488] flex items-center justify-center shadow-lg">
                    <Mic className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary font-devanagari">बोलकर बताएं</p>
              <p className="text-slate-500 text-sm">Tap to Speak Your Issue</p>
            </div>
          </div>

          {/* Language hint */}
          <div className="w-full bg-white/70 rounded-2xl p-3 border border-[#A7F3D0] mt-2">
            <p className="text-slate-500 text-xs flex items-center gap-2">
              <span className="text-[#0D9488]">ℹ</span>
              Hindi • Marathi • English
            </p>
            <p className="text-slate-600 text-xs font-devanagari mt-1">
              "जैसे: मुझे कल शाम से पेट में तेज जलन हो रही है!"
            </p>
          </div>

          {/* Waveform */}
          <div className="mt-3 flex items-end gap-1">
            {[3, 6, 9, 14, 10, 16, 11, 7, 4, 8, 12, 5, 9, 13, 6].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#0D9488] rounded-full opacity-60"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </button>

        {/* RIGHT: Symptom Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-bold text-primary flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              या सामान्य कारण चुनें / Or Choose an Option
            </p>
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wide">
              SINGLE OR MULTI-SELECT
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {SYMPTOMS.map(symptom => {
              const isSelected = selectedIds.includes(symptom.id);
              return (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`relative rounded-2xl p-4 text-left border-2 transition-all duration-150 flex flex-col gap-2 min-h-[140px] ${
                    isSelected
                      ? 'border-[#0D9488] bg-[#F0FDF9] shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Top row: icon + select indicator */}
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-[#0D9488] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {symptom.icon}
                    </div>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? 'text-[#0D9488]' : 'text-slate-300'
                    }`}>
                      {isSelected
                        ? <CheckCircle2 className="w-7 h-7 fill-[#0D9488] text-white" />
                        : <PlusCircle className="w-7 h-7" />
                      }
                    </div>
                  </div>

                  {/* Labels */}
                  <div>
                    <p className={`text-base font-bold leading-tight font-devanagari ${isSelected ? 'text-[#0D9488]' : 'text-primary'}`}>
                      {symptom.hindi}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">{symptom.english}</p>
                    {symptom.subtext && (
                      <p className="text-slate-400 text-xs font-devanagari mt-1">{symptom.subtext}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selection summary bar */}
          {selectedIds.length > 0 && (
            <div className="mt-4 bg-[#F0FDF9] border border-[#A7F3D0] rounded-2xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0D9488] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 fill-[#0D9488] text-white shrink-0" />
                <span>
                  Selected for OPD Intake:{' '}
                  <span className="font-devanagari">{selectedLabels.join(' • ')}</span>
                </span>
              </div>
              <span className="text-[#0D9488] text-xs font-bold whitespace-nowrap">
                Ayurveda Dosha Mapping Linked
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
