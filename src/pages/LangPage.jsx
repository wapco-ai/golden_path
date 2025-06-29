import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import logo from '../assets/images/logo.png';
import { useLangStore } from '../store/langStore';
import '../styles/LangPage.css';

const LangPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const navigate = useNavigate();

  const setLanguage = useLangStore((state) => state.setLanguage);
  const intl = useIntl();

  const languages = [
    { id: 1, name: 'فارسی', code: '(FA)', locale: 'fa' },
    { id: 2, name: 'اردو', code: '(Ur)', locale: 'ur' },
    { id: 3, name: 'العربیة', code: '(AR)', locale: 'ar' },
    { id: 4, name: 'English', code: '(EN)', locale: 'en' }
  ];

  const handleLogin = () => {
    if (selectedLanguage) {
      const selected = languages.find((l) => l.id === selectedLanguage);
      if (selected) setLanguage(selected.locale);
      navigate('/location');
    }
  };

  return (
    <div className="lang-page-container">
      <img src={logo} alt="Logo" className="lang-logo" />
      
      <div className="lang-welcome-text">
        <h1><FormattedMessage id="welcome" /></h1>
        <p
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage({ id: 'selectLanguage' })
          }}
        />
      </div>
      
      <div className="lang-options-list">
        {languages.map((lang) => (
          <div 
            key={lang.id}
            className={`lang-option ${selectedLanguage === lang.id ? 'selected' : ''}`}
            onClick={() => setSelectedLanguage(lang.id)}
          >
            <div className="selection-circle">
              {selectedLanguage === lang.id && <div className="inner-circle" />}
            </div>
            <div className="lang-text-container">
              <span className={`lang-code lang-code-${lang.code.replace(/[()]/g, '').toLowerCase()}`}>
                {lang.code}
              </span>
              <span className="lang-name">{lang.name}</span>
            </div>
          </div>
        ))}
      </div>
      
      <button
        className={`lang-login-btn ${!selectedLanguage ? 'disabled' : ''}`}
        disabled={!selectedLanguage}
        onClick={handleLogin}
      >
        <FormattedMessage id="loginButton" />
      </button>
    </div>
  );
};

export default LangPage;