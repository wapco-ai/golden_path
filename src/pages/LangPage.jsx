import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import '../styles/LangPage.css';

const LangPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const navigate = useNavigate();
  
  const languages = [
    { id: 1, name:  'فارسی', code: '(FA)' },
    { id: 2, name: 'اردو', code: '(Ur)' },
    { id: 3, name: 'العربیة', code: '(AR)' },
    { id: 4, name: 'English', code: '(EN)' }
  ];

  const handleLogin = () => {
    if (selectedLanguage) {
      navigate('/location');
    }
  };

  return (
    <div className="lang-page-container">
      <img src={logo} alt="Logo" className="lang-logo" />
      
      <div className="lang-welcome-text">
        <h1>خوش آمدید!</h1>
        <p>
          برای ورود به نرم افزار مسیرپایی حرم مطهر رضوی ابتدا<br />
          زبان برنامه را انتخاب کنید و وارد برنامه شوید.
        </p>
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
              <span className="lang-code">{lang.code}</span>
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
        ورود به برنامه
      </button>
    </div>
  );
};

export default LangPage;