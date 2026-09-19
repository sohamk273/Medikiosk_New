import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, AlertTriangle, ArrowRight, Volume2, Sparkles, Activity } from 'lucide-react';
import { KioskLayout } from '../components/layout/KioskLayout';
import { ScreenTransition } from '../components/ui/ScreenTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { useKiosk } from '../context/KioskContext';
import { TRANSLATIONS } from '../utils/translations';

export const ChiefComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, chiefComplaint, setChiefComplaint, triggerRedFlag, playClickSound, speakText } = useKiosk();
  const t = TRANSLATIONS[language];

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(chiefComplaint || '');

  const commonChips = [
    { text: t.ccChipFever, value: 'High Fever', isDanger: false },
    { text: t.ccChipChestPain, value: 'Sudden Chest Pain and Tightness', isDanger: true },
    { text: t.ccChipCough, value: 'Severe Persistent Cough', isDanger: false },
    { text: t.ccChipHeadache, value: 'Bad Headache', isDanger: false },
    { text: t.ccChipStomach, value: 'Stomach Pain', isDanger: false },
    { text: t.ccChipBreathing, value: 'Breathing Difficulty and Dyspnea', isDanger: true },
    { text: t.ccChipJointPain, value: 'Joint and Body Pain', isDanger: false },
    { text: t.ccChipVomiting, value: 'Nausea and Vomiting', isDanger: false },
    { text: t.ccChipRash, value: 'Skin Rash and Itching', isDanger: false },
    { text: t.ccChipDizziness, value: 'Dizziness and Weakness', isDanger: false },
  ];

  const handleChipSelect = (chip: typeof commonChips[0]) => {
    playClickSound();
    setTranscript(chip.text);
    setChiefComplaint(chip.value);
    speakText(chip.text);

    // If severe red-flag symptom chosen, trigger red flag alert right away
    if (chip.isDanger) {
      triggerRedFlag({
        triggered: true,
        symptom: chip.value,
        severity: 'critical',
        rule: 'RED_FLAG_CHEST_PAIN_DYSPNEA_RULE',
        triageRoom: 'Room 102 (Emergency Triage Desk)',
      });
    }
  };

  const toggleMic = () => {
    playClickSound();
    if (!isRecording) {
      setIsRecording(true);
      speakText(t.ccListening);
      // Simulate live Speech-to-Text transcript
      setTimeout(() => {
        const sampleVoiceText = language === 'hi' ? 'मुझे पिछले दो दिनों से तेज़ बुख़ार और शरीर में दर्द है।' : 'I have high fever and body ache since yesterday.';
        setTranscript(sampleVoiceText);
        setChiefComplaint(sampleVoiceText);
        setIsRecording(false);
      }, 3200);
    } else {
      setIsRecording(false);
    }
  };

  const handleNext = () => {
    playClickSound();

    // Check if current text has red flag keywords
    const lowerText = transcript.toLowerCase();
    const isRedFlagDetected = lowerText.includes('chest pain') || lowerText.includes('breathing') || lowerText.includes('छाती') || lowerText.includes('सांस');

    if (isRedFlagDetected) {
      triggerRedFlag({
        triggered: true,
        symptom: transcript || 'Severe Symptom Detected',
        severity: 'critical',
        rule: 'RED_FLAG_EMERGENCY_DETECTED',
        triageRoom: 'Room 102 (Emergency Triage Desk)',
      });
      speakText('Emergency symptom detected. Redirecting to Triage immediately.');
      setTimeout(() => {
        navigate('/triage-alert');
      }, 400);
    } else {
      speakText(t.ccContinue);
      setTimeout(() => {
        navigate('/history/socrates');
      }, 300);
    }
  };

  return (
    <KioskLayout
      showBack={true}
      backTo="/consent"
      audioText={`${t.ccTitle}. ${t.ccSubtitle}`}
    >
      <ScreenTransition className="max-w-5xl mx-auto py-2">
        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-mediblue-700 px-4 py-1.5 rounded-full font-bold text-sm mb-3 border border-blue-100">
            <Sparkles className="w-4 h-4 text-mediblue-600" />
            <span>Voice-First AI Intake • Bhashini ASR Enabled</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 tracking-tight mb-2">
            {t.ccTitle}
          </h1>
          <p className="text-lg md:text-xl font-semibold text-slate-500">
            {t.ccSubtitle}
          </p>
        </div>

        {/* Voice Input Card */}
        <GlassCard className="p-6 md:p-8 mb-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Microphone Action Button */}
          <div className="relative mb-6">
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-mediblue-500/30 animate-ping" />
            )}
            <button
              type="button"
              onClick={toggleMic}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all active:scale-95 z-10 relative ${
                isRecording
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 scale-105 shadow-rose-500/40'
                  : 'bg-gradient-to-r from-mediblue-600 to-indigo-600 hover:scale-105 shadow-mediblue-600/40'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-12 h-12 mb-1 animate-bounce" />
              ) : (
                <Mic className="w-12 h-12 mb-1" />
              )}
              <span className="text-xs font-black uppercase tracking-wider">
                {isRecording ? 'Stop' : 'Speak'}
              </span>
            </button>
          </div>

          {/* Soundwave Animation or Status */}
          {isRecording ? (
            <div className="flex items-center gap-1.5 mb-4 h-8">
              {[40, 70, 100, 60, 90, 50, 80, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-mediblue-600 rounded-full animate-pulse"
                  style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm font-extrabold text-slate-400 mb-4 uppercase tracking-wider">
              {t.ccTapToSpeak}
            </p>
          )}

          {/* Captured Transcript Box */}
          <div className="w-full max-w-2xl bg-white/90 rounded-2xl p-4 md:p-5 border-2 border-slate-200 shadow-inner min-h-[90px] flex items-center justify-center text-center">
            {transcript ? (
              <p className="text-xl font-bold text-navy-900 leading-relaxed">
                "{transcript}"
              </p>
            ) : (
              <p className="text-base font-semibold text-slate-400 italic">
                {t.ccVoiceInstruction}
              </p>
            )}
          </div>
        </GlassCard>

        {/* Quick Select Common Touch Chips */}
        <div className="mb-8">
          <h3 className="text-base font-extrabold text-navy-900 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-mediblue-600" />
            {t.ccCommonChipHeader}
          </h3>
          <div className="flex flex-wrap gap-3">
            {commonChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipSelect(chip)}
                className={`px-5 py-3.5 rounded-2xl font-bold text-base md:text-lg border-2 transition-all flex items-center gap-2 active:scale-95 ${
                  transcript === chip.text
                    ? 'bg-navy-900 text-white border-navy-900 shadow-md'
                    : chip.isDanger
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-mediblue-400 hover:bg-blue-50/50'
                }`}
              >
                {chip.isDanger && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                <span>{chip.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Continue Action */}
        <div className="flex justify-center">
          <button
            type="button"
            disabled={!transcript}
            onClick={handleNext}
            className={`w-full max-w-xl py-5 px-8 rounded-2xl font-extrabold text-2xl flex items-center justify-center gap-3 shadow-xl transition-all min-h-[64px] ${
              transcript
                ? 'bg-mediblue-600 hover:bg-mediblue-700 text-white shadow-mediblue-600/30 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>{t.ccContinue}</span>
            <ArrowRight className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      </ScreenTransition>
    </KioskLayout>
  );
};
