import React, { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { useLangStore } from './store/langStore';
import fa from './locales/fa.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import ur from './locales/ur.json';

const messages = { fa, en, ar, ur };

const IntlProviderWrapper = ({ children }) => {
  const language = useLangStore((state) => state.language);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
  }, [language]);
  return (
    <IntlProvider locale={language} messages={messages[language]} defaultLocale="fa">
      {children}
    </IntlProvider>
  );
};

export default IntlProviderWrapper;
