import React, { useEffect } from 'react';

import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl';
import { useLangStore } from './store/langStore';
import fa from './locales/fa.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import ur from './locales/ur.json';

const messages = { fa, en, ar, ur };

import { toPersianDigits } from './utils/digits';

const IntlProviderWrapper = ({ children }) => {
  const language = useLangStore((state) => state.language);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
  }, [language]);

  const cache = createIntlCache();
  const intl = createIntl({ locale: language, messages: messages[language], defaultLocale: 'fa' }, cache);

  const originalFormatMessage = intl.formatMessage;
  intl.formatMessage = (descriptor, values) => {
    let msg = originalFormatMessage(descriptor, values);
    if (['fa', 'ur', 'ar'].includes(language)) {
      msg = toPersianDigits(msg);
    }
    return msg;
  };

  return (
    <RawIntlProvider value={intl}>
      {children}
    </RawIntlProvider>
  );
};

export default IntlProviderWrapper;
