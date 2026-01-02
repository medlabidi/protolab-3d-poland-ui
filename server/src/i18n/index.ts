/**
 * Server-side internationalization for emails
 * Supports: Polish (pl), English (en), Russian (ru)
 */

import pl from './locales/pl.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

export type SupportedLanguage = 'pl' | 'en' | 'ru';

const translations: Record<SupportedLanguage, typeof pl> = {
  pl,
  en,
  ru,
};

export const supportedLanguages: SupportedLanguage[] = ['pl', 'en', 'ru'];
export const defaultLanguage: SupportedLanguage = 'pl';

/**
 * Get a nested translation value by dot-notation key
 * @param lang - Language code ('pl', 'en', 'ru')
 * @param key - Dot-notation key (e.g., 'email.registration.subject')
 * @param params - Optional parameters for interpolation (e.g., { name: 'John' })
 * @returns Translated string with interpolated values
 */
export function t(
  lang: SupportedLanguage | string,
  key: string,
  params?: Record<string, string | number>
): string {
  // Validate language, fallback to default
  const language = supportedLanguages.includes(lang as SupportedLanguage)
    ? (lang as SupportedLanguage)
    : defaultLanguage;

  const translation = translations[language];
  
  // Navigate to the nested key
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Key not found, try fallback language
      if (language !== defaultLanguage) {
        return t(defaultLanguage, key, params);
      }
      // Return key if not found even in fallback
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  // If value is not a string, return the key
  if (typeof value !== 'string') {
    console.warn(`Translation key returned non-string: ${key}`);
    return key;
  }

  // Interpolate parameters
  if (params) {
    return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
      return str.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue));
    }, value);
  }

  return value;
}

/**
 * Get all email translations for a specific language
 * @param lang - Language code
 * @returns Email translations object
 */
export function getEmailTranslations(lang: SupportedLanguage | string) {
  const language = supportedLanguages.includes(lang as SupportedLanguage)
    ? (lang as SupportedLanguage)
    : defaultLanguage;
  
  return translations[language].email;
}

/**
 * Validate if a language is supported
 * @param lang - Language code to validate
 * @returns true if supported, false otherwise
 */
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return supportedLanguages.includes(lang as SupportedLanguage);
}

/**
 * Helper function to create email translation getter for a specific language
 * @param lang - Language code
 * @returns Function that gets translations for that language
 */
export function createTranslator(lang: SupportedLanguage | string) {
  const language = isValidLanguage(lang) ? lang : defaultLanguage;
  return (key: string, params?: Record<string, string | number>) => t(language, key, params);
}

export default { t, getEmailTranslations, isValidLanguage, createTranslator, supportedLanguages, defaultLanguage };
