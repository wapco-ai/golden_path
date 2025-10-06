import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLangStore } from '../store/langStore';
import '../styles/Plang.css';

const Plang = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(1); // Set default to 1 (Persian)
  const navigate = useNavigate();

  const setLanguage = useLangStore((state) => state.setLanguage);
  const intl = useIntl();

  const languages = [
    { id: 1, name: 'فارسی', code: '(FA)', locale: 'fa', englishName: 'Persian' },
    { id: 2, name: 'اردو', code: '(Ur)', locale: 'ur', englishName: 'Urdu' },
    { id: 3, name: 'العربية', code: '(AR)', locale: 'ar', englishName: 'Arabic' },
    { id: 4, name: 'English', code: '(EN)', locale: 'en', englishName: 'English' }
  ];

  const handleConfirm = () => {
    if (selectedLanguage) {
      const selected = languages.find((l) => l.id === selectedLanguage);
      if (selected) {
        setLanguage(selected.locale);
      }
      // Navigate back to profile page
      navigate('/profile');
    }
  };

  return (
    <div className="plang-container">
      {/* Back Button */}
      <div className="plang-back-button" onClick={() => navigate(-1)}>
        <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.33301 10H16.6663M16.6663 10L11.6663 5M16.6663 10L11.6663 15" stroke="#1E2023" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      {/* Header Text */}
      <div className="plang-header">
        <h1 className="plang-heading"> <FormattedMessage id="plang.title" /> </h1>
        <div className="plang-description">
          <p>
            <h2> <FormattedMessage id="plang.subtitle" /> </h2>
            <FormattedMessage id="plang.description" />
          </p>
        </div>
      </div>

      {/* Language Options */}
      <div className="lang-options-list2">
        {languages.map((lang) => (
          <div
            key={lang.id}
            className={`lang-option ${selectedLanguage === lang.id ? 'selected' : ''}`}
            onClick={() => setSelectedLanguage(lang.id)}
          >
            <div className="selection-circle">
              {selectedLanguage === lang.id && <div className="inner-circle" />}
            </div>
            <div className="lang-text-container2">
              <span className={`lang-code lang-code-${lang.code.replace(/[()]/g, '').toLowerCase()}`}>
                {lang.code}
              </span>
              <span className={`lang-name ${lang.locale === 'en' ? 'force-rtl' : ''}`}>
                {intl.locale === 'en' ? lang.englishName : lang.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Button */}
      <button
        id="confirmContinue"
        className={`plang-confirm-btn ${!selectedLanguage ? 'disabled' : ''}`}
        disabled={!selectedLanguage}
        onClick={handleConfirm}
      >
        <FormattedMessage id="confirmContinue" />
      </button>
    </div>
  );
};

export default Plang;