import React, { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";

export type Language = "pl" | "en" | "ru";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t: translate, i18n, ready } = useTranslation();
  
  const language = (i18n.language || 'pl') as Language;

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  // Simple t function that calls i18next translate
  const t = (key: string): string => {
    return translate(key);
  };

  // Don't render children until i18n is ready
  if (!ready) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
