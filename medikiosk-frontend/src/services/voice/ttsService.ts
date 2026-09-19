export type SupportedTTSLanguage = 'en' | 'hi' | 'mr';

export interface TTSProvider {
  speak(text: string, language: SupportedTTSLanguage): Promise<void>;
  stop(): void;
  isSpeaking(): boolean;
}

export class BrowserTTSProvider implements TTSProvider {
  public speak(text: string, language: SupportedTTSLanguage): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis is not supported in this browser.');
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      if (!text || text.trim() === '') {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      const langMap: Record<SupportedTTSLanguage, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
      };

      utterance.lang = langMap[language] || 'en-IN';
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(langMap[language]) || v.lang.startsWith(language));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('TTS utterance error:', e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    if (!('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }
}

class TTSService {
  private static instance: TTSService;
  private provider: TTSProvider;

  private constructor() {
    this.provider = new BrowserTTSProvider();
  }

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  public setProvider(provider: TTSProvider): void {
    this.provider.stop();
    this.provider = provider;
  }

  public speak(text: string, language: SupportedTTSLanguage): Promise<void> {
    return this.provider.speak(text, language);
  }

  public stop(): void {
    this.provider.stop();
  }

  public isSpeaking(): boolean {
    return this.provider.isSpeaking();
  }
}

export const ttsService = TTSService.getInstance();
