import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Mic, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';
import { HistoryEntry } from '../types/kiosk';

interface SOCRATESSection {
  id: HistoryEntry['section'];
  title: string;
  question: string;
  options: string[];
}

export const AdaptiveHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, addHistoryEntry, historyEntries, playClickSound, speakText } = useKiosk();
  const t = TRANSLATIONS[language];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);

  const sections: SOCRATESSection[] = [
    {
      id: 'hpi',
      title: t.socratesSectionHPI,
      question: language === 'hi' ? 'यह तकलीफ कब शुरू हुई और दर्द की तीव्रता कितनी है?' : 'How long have you had this issue, and what is the severity?',
      options: [
        language === 'hi' ? 'आज सुबह से (हल्का दर्द 3/10)' : 'Since this morning (Mild 3/10)',
        language === 'hi' ? 'पिछले 2-3 दिनों से (मध्यम 6/10)' : 'Past 2-3 days (Moderate 6/10)',
        language === 'hi' ? '1 सप्ताह से अधिक (तीव्र 8/10)' : 'More than 1 week (Severe 8/10)',
        language === 'hi' ? 'अचानक शुरू हुआ (असहनीय 10/10)' : 'Sudden onset (Unbearable 10/10)',
      ],
    },
    {
      id: 'pmh',
      title: t.socratesSectionPMH,
      question: language === 'hi' ? 'क्या आपको पहले से कोई बीमारी है?' : 'Do you have any existing medical conditions?',
      options: [
        language === 'hi' ? 'उच्च रक्तचाप (High BP)' : 'High Blood Pressure (Hypertension)',
        language === 'hi' ? 'मधुमेह (Diabetes)' : 'Diabetes Mellitus',
        language === 'hi' ? 'अस्थमा / सांस की बीमारी' : 'Asthma / Respiratory issue',
        language === 'hi' ? 'कोई पुरानी बीमारी नहीं' : 'No prior medical conditions',
      ],
    },
    {
      id: 'drug_allergy',
      title: t.socratesSectionAllergies,
      question: language === 'hi' ? 'क्या आपको किसी दवा या भोजन से एलर्जी है?' : 'Do you have any known drug or food allergies?',
      options: [
        language === 'hi' ? 'पेनिसिलिन / एंटीबायोटिक एलर्जी' : 'Penicillin / Antibiotic Allergy',
        language === 'hi' ? 'पैरासिटामोल / पेनकिलर एलर्जी' : 'Paracetamol / Painkiller Allergy',
        language === 'hi' ? 'धूल / धूल-मिट्टी से एलर्जी' : 'Dust / Seasonal Pollen Allergy',
        language === 'hi' ? 'कोई एलर्जी नहीं है' : 'No Known Drug Allergies (NKDA)',
      ],
    },
    {
      id: 'family',
      title: t.socratesSectionFamily,
      question: language === 'hi' ? 'क्या परिवार में किसी को दिल की बीमारी या मधुमेह है?' : 'Does anyone in your family have heart disease or diabetes?',
      options: [
        language === 'hi' ? 'माता-पिता को मधुमेह है' : 'Parents have Diabetes',
        language === 'hi' ? 'परिवार में दिल का दौरा' : 'Family history of Heart Disease',
        language === 'hi' ? 'उच्च रक्तचाप की समस्या' : 'Family history of High BP',
        language === 'hi' ? 'कोई पारिवारिक इतिहास नहीं' : 'No major family illness',
      ],
    },
    {
      id: 'personal',
      title: t.socratesSectionPersonal,
      question: language === 'hi' ? 'आपकी जीवनशैली और आहार की आदतें क्या हैं?' : 'What are your lifestyle and dietary habits?',
      options: [
        language === 'hi' ? 'शाकाहारी आहार • नियमित नींद' : 'Vegetarian Diet • Regular Sleep',
        language === 'hi' ? 'मांसाहारी आहार' : 'Non-Vegetarian Diet',
        language === 'hi' ? 'धूम्रपान / तंबाकू का सेवन' : 'Tobacco / Smoking Habit',
        language === 'hi' ? 'अनियमित नींद और तनाव' : 'Irregular Sleep & High Stress',
      ],
    },
    {
      id: 'ros',
      title: t.socratesSectionROS,
      question: language === 'hi' ? 'क्या आपको कोई अन्य लक्षण जैसे चक्कर, उल्टी या ठंड लगना है?' : 'Any additional symptoms like dizziness, chills, or nausea?',
      options: [
        language === 'hi' ? 'ठंड लगकर बुखार आना' : 'Fever with Chills',
        language === 'hi' ? 'चक्कर आना और कमजोरी' : 'Dizziness & General Weakness',
        language === 'hi' ? 'भूख न लगना' : 'Loss of Appetite',
        language === 'hi' ? 'कोई अन्य लक्षण नहीं' : 'No additional symptoms',
      ],
    },
  ];

  const currentSection = sections[currentStepIndex];

  const handleSpeakQuestion = () => {
    playClickSound();
    speakText(`${currentSection.title}. ${currentSection.question}`);
  };

  const handleOptionClick = (opt: string) => {
    playClickSound();
    setSelectedAnswer(opt);
    speakText(opt);
  };

  const handleMicToggle = () => {
    playClickSound();
    if (!isRecording) {
      setIsRecording(true);
      speakText(t.ccListening);
      setTimeout(() => {
        const voiceRes = language === 'hi' ? 'मुझे 2 दिन से समस्या है।' : 'I have had this for 2 days.';
        setSelectedAnswer(voiceRes);
        setCustomText(voiceRes);
        setIsRecording(false);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const handleNextStep = () => {
    const finalAnswer = selectedAnswer || customText || currentSection.options[0];
    playClickSound();

    addHistoryEntry({
      id: `entry-${Date.now()}`,
      section: currentSection.id,
      fieldKey: currentSection.id,
      question: currentSection.question,
      answer: finalAnswer,
      confidence: 0.95,
    });

    if (currentStepIndex < sections.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setSelectedAnswer('');
      setCustomText('');
      const nextSec = sections[currentStepIndex + 1];
      speakText(`${nextSec.title}. ${nextSec.question}`);
    } else {
      // Completed all sections -> Navigate to AYUSH or Documents
      speakText('History section complete. Proceeding to document scanner.');
      setTimeout(() => {
        navigate('/history/ayush');
      }, 300);
    }
  };

  return (
    <KioskLayout
      showBack={true}
      backTo="/history/chief-complaint"
      audioText={`${t.socratesTitle}. Section ${currentStepIndex + 1} of ${sections.length}: ${currentSection.title}. ${currentSection.question}`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Progress Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-black text-mediblue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-mediblue-600" />
              Section {currentStepIndex + 1} of {sections.length}: {currentSection.title}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {Math.round(((currentStepIndex + 1) / sections.length) * 100)}% Completed
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-mediblue-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${((currentStepIndex + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Header Card */}
        <GlassCard className="p-6 md:p-8 mb-6 border-l-8 border-l-mediblue-600">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900 leading-tight mb-2">
                {currentSection.question}
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                {t.socratesVoiceOrTouch}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSpeakQuestion}
              className="w-12 h-12 rounded-2xl bg-blue-50 text-mediblue-600 hover:bg-blue-100 flex items-center justify-center shrink-0 transition-all border border-blue-200"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
        </GlassCard>

        {/* Options Touch Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {currentSection.options.map((opt, idx) => {
            const isSelected = selectedAnswer === opt;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleOptionClick(opt)}
                className={`p-5 rounded-2xl border-2 text-left font-bold text-lg md:text-xl transition-all flex items-center justify-between gap-3 active:scale-98 ${
                  isSelected
                    ? 'border-mediblue-600 bg-mediblue-50/90 text-navy-900 shadow-md ring-2 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <span>{opt}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-mediblue-600 text-white' : 'bg-slate-100 text-transparent'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Voice Input Alternative Bar */}
        <GlassCard className="p-4 mb-8 flex items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMicToggle}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all shadow-md ${
                isRecording ? 'bg-rose-600 animate-pulse' : 'bg-mediblue-600 hover:bg-mediblue-700'
              }`}
            >
              <Mic className="w-6 h-6" />
            </button>
            <div>
              <p className="font-extrabold text-navy-900 text-sm">
                {isRecording ? t.ccListening : 'Speak Custom Answer in Your Language'}
              </p>
              <p className="text-xs text-slate-500 font-medium">Bhashini ASR translates directly into structured history</p>
            </div>
          </div>

          {selectedAnswer && (
            <span className="text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
              Selected: "{selectedAnswer}"
            </span>
          )}
        </GlassCard>

        {/* Submit & Next Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full max-w-xl py-5 px-8 rounded-2xl bg-mediblue-600 hover:bg-mediblue-700 text-white font-extrabold text-2xl shadow-xl shadow-mediblue-600/30 flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[64px]"
          >
            <span>{currentStepIndex === sections.length - 1 ? 'Finish History & Continue' : t.socratesSubmitTurn}</span>
            <ArrowRight className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
