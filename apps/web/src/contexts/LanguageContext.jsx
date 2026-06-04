import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import ur from '../locales/ur.json';

const translations = { en, ur };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  useEffect(() => {
    // Persist language preference
    localStorage.setItem('language', language);
    
    // Switch document direction based on language
    const dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ur' : 'en');
  };

  const t = (key, variables = {}) => {
    let text = translations[language][key] || key;
    // Simple interpolation for variables
    for (const [varKey, varValue] of Object.entries(variables)) {
      text = text.replace(new RegExp(`{${varKey}}`, 'g'), varValue);
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
