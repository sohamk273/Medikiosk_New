import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useKiosk } from '../../context/KioskContext';
import { TRANSLATIONS } from '../../utils/translations';

interface AudioButtonProps {
  instructionText?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({ instructionText }) => {
  const { language, isPlayingAudio, speakText, stopAudio, playClickSound } = useKiosk();
  const t = TRANSLATIONS[language];

  const handleClick = () => {
    playClickSound();
    if (isPlayingAudio) {
      stopAudio();
    } else {
      const textToSpeak = instructionText || `${t.appName}. ${t.welcomeSubtitle}`;
      speakText(textToSpeak);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t.audioPrompt}
      className={`group relative flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl min-h-[58px] min-w-[58px] transition-all duration-200 border ${
        isPlayingAudio
          ? 'bg-mediblue-500 text-white border-mediblue-600 shadow-md shadow-mediblue-500/25 scale-105 ring-4 ring-mediblue-200'
          : 'bg-white/80 hover:bg-white text-mediblue-900 border-white/80 shadow-sm active:scale-95'
      }`}
    >
      <div className="relative">
        {isPlayingAudio ? (
          <VolumeX className="w-7 h-7 text-white animate-pulse" />
        ) : (
          <Volume2 className="w-7 h-7 text-mediblue-600 group-hover:scale-110 transition-transform" />
        )}
        {isPlayingAudio && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        )}
      </div>

      <span className="text-base font-semibold hidden md:inline tracking-tight">
        {isPlayingAudio ? (language === 'hi' ? 'रोकें' : 'Stop Audio') : (language === 'hi' ? 'आवाज़' : 'Audio')}
      </span>
    </button>
  );
};
