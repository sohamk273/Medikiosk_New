import { useState, useEffect, useRef } from 'react';
import { Mic, Hand, AlertCircle } from 'lucide-react';
import type { VoiceInputMethod } from '@/features/patient/PatientSessionContext';
import { VoiceWaveform } from './VoiceWaveform';
import { useTranslation } from '@/i18n';

interface TranscriptCardProps {
  inputMethod: VoiceInputMethod;
  transcript?: string;
  selectedOption?: string;
  englishTranslation?: string;
  isRedFlag: boolean;
  audioBlob?: Blob;
}

/**
 * TranscriptCard — displays what the system captured from the patient.
 */
export function TranscriptCard({
  inputMethod,
  transcript,
  selectedOption,
  englishTranslation,
  isRedFlag,
  audioBlob,
}: TranscriptCardProps) {
  const { language } = useTranslation();
  const isVoice = inputMethod === 'voice';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        audioRef.current = audio;

        const setAudioData = () => {
          setDuration(audio.duration);
        };

        const setAudioTime = () => {
          setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
          audio.removeEventListener('loadedmetadata', setAudioData);
          audio.removeEventListener('timeupdate', setAudioTime);
          audio.removeEventListener('ended', handleEnded);
          audio.pause();
          URL.revokeObjectURL(url);
        };
      }
    }, [audioBlob]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '00:00';
    const seconds = Math.floor(time);
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={`rounded-3xl border-2 p-6 space-y-4 ${
      isRedFlag ? 'border-destructive bg-red-50' : 'border-slate-200 bg-white'
    }`}>
      {/* Provenance header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isVoice
            ? <Mic className="w-5 h-5 text-[#0D9488]" />
            : <Hand className="w-5 h-5 text-[#2563EB]" />
          }
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {language === 'en' 
              ? 'PATIENT RESPONSE' 
              : isVoice 
                ? 'PATIENT VOICE INPUT / मरीज़ द्वारा बोला गया विवरण' 
                : 'PATIENT TOUCH SELECTION / मरीज़ द्वारा चुना गया विकल्प'}
          </span>
          {language !== 'en' && (
            <span className="bg-[#CCFBF1] text-[#0D9488] text-xs font-bold px-2 py-0.5 rounded-full">
              NOT A CLINICAL DIAGNOSIS
            </span>
          )}
        </div>
        {isRedFlag && (
          <span className="flex items-center gap-1 bg-destructive text-white text-xs font-bold px-3 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            NEEDS ATTENTION
          </span>
        )}
      </div>

      {/* Main captured content */}
      {isVoice && transcript ? (
        <div className="space-y-3">
          {/* Original spoken text */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            {language !== 'en' && (
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
                Original Spoken Dialect / मूल नोंदवलेली भाषा
              </p>
            )}
            <p className="text-xl font-bold text-primary leading-relaxed">
              "{transcript}"
            </p>
          </div>

          {/* English translation — clearly marked as AI-assisted */}
          {englishTranslation && englishTranslation !== transcript && language !== 'en' && (
            <div className="bg-[#EFF6FF] rounded-2xl p-4 border border-[#BFDBFE]">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">
                English Translation (AI Assisted) — Verify Below
              </p>
              <p className="text-lg text-slate-700 leading-relaxed italic">
                "{englishTranslation}"
              </p>
            </div>
          )}

          {/* Audio playback visual */}
          <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <button 
              onClick={togglePlay}
              disabled={!audioBlob}
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                audioBlob ? 'bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="text-lg">{isPlaying ? '⏸' : '▶'}</span>
            </button>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary">
                {language === 'en' ? 'Listen to Your Recording' : 'Listen to Your Recording / आवाज़ सुनें'}
              </p>
              <p className="text-xs text-slate-500">Tap play to review the captured response</p>
            </div>
            <VoiceWaveform active={isPlaying} />
            <span className="text-slate-400 text-sm font-mono">
              {formatTime(isPlaying ? currentTime : duration)}
            </span>
          </div>
        </div>
      ) : (
        /* Touch selection display */
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
            <Hand className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              {language === 'en' ? 'You Selected' : 'You Selected / आपने चुना'}
            </p>
            <p className="text-2xl font-bold text-primary">{transcript || selectedOption}</p>
          </div>
        </div>
      )}
    </div>
  );
}
