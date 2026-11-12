/**
 * Language Management Utility
 * Supports Bengali (বাংলা - Default) and English
 */

export type Language = 'bn' | 'en';

const STORAGE_KEY = 'bd_tourism_lang';

export function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    if (saved === 'en' || saved === 'bn') return saved;
  } catch (e) {
    console.warn('localStorage not accessible for language preference', e);
  }
  return 'bn'; // Bengali is default as mandated
}

export function saveLanguagePreference(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    console.warn('Could not save language preference', e);
  }
}

// Convert English numerals (0-9) to Bengali numerals (০-৯)
export function toBengaliNumerals(input: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
}

// Format numbers according to active language
export function formatLocalizedNumber(num: number, lang: Language): string {
  if (lang === 'bn') {
    return toBengaliNumerals(num.toLocaleString());
  }
  return num.toLocaleString();
}
