import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { en } from './translations/en';
import { hi } from './translations/hi';
import { mr } from './translations/mr';

export type Language = 'en' | 'hi' | 'mr';

const translations = {
  en,
  hi,
  mr,
};

export type TranslationKeys = typeof en;

function getNestedTranslation(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function useTranslation() {
  const { language, setLanguage } = usePatientSession();

  const currentLang = (language as Language) || 'en';

  const t = (key: string, params?: Record<string, string | number>): string => {
    const langDict = translations[currentLang] || translations.en;
    let translation = getNestedTranslation(langDict, key);

    if (!translation && currentLang !== 'en') {
      translation = getNestedTranslation(translations.en, key);
    }

    if (!translation) {
      return key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        translation = translation!.split('{' + paramKey + '}').join(String(paramVal));
      });
    }

    return translation;
  };

  return {
    t,
    language: currentLang,
    setLanguage,
  };
}
