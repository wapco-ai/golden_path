import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const PhoneIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="phone-icon"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
  </svg>
);

const LoginForm = () => {
  const intl = useIntl();
  const [phone, setPhone] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '']);

  const isValidIranianPhone = (phone) => {
    return /^09[0-9]{9}$/.test(phone);
  };

  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input.length <= 11) {
      setPhone(input);
    }
  };

  const handleCodeChange = (e, index) => {
    const newCode = [...verificationCode];
    newCode[index] = e.target.value;
    setVerificationCode(newCode);
    
    // Auto focus to next input
    if (e.target.value && index < 4) {
      document.getElementById(`code-input-${index + 1}`).focus();
    }
  };

  const handleSubmitPhone = (e) => {
    e.preventDefault();
    if (isValidIranianPhone(phone)) {
      const formatted = `+98-${phone.slice(1, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
      setFormattedPhone(formatted);
      setShowVerification(true);
    }
  };

  if (showVerification) {
    return (
      <div className="verification-container">
        <h2 className="verification-title">
          <FormattedMessage id="enterVerification" />
        </h2>
        <p className="verification-description">
          <FormattedMessage
            id="sentCode"
            values={{ phone: <span dir="ltr" style={{ display: 'inline-block' }}>{formattedPhone}</span> }}
          />
        </p>
        
        <div className="verification-edit">
          <span><FormattedMessage id="wrongPhone" /></span>
          <button
            type="button"
            className="edit-button"
            onClick={() => setShowVerification(false)}
          >
            <FormattedMessage id="edit" />
          </button>
        </div>
        
        <div className="verification-code-inputs">
          {verificationCode.map((digit, index) => (
            <input
              key={index}
              id={`code-input-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleCodeChange(e, index)}
              className="code-input"
              dir="ltr"
            />
          ))}
        </div>
        
        <div className="verification-resend">
          <span><FormattedMessage id="resendCode" /></span>
        </div>
      </div>
    );
  }

  return (
    <form className="login-form" onSubmit={handleSubmitPhone}>
      <div className="form-group">
        <div className="phone-input-container">
          <PhoneIcon />
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder={intl.formatMessage({ id: 'phonePlaceholder' })}
            dir="ltr"
            className="phone-input"
            maxLength="11"
          />
        </div>
      </div>
      <button
        type="submit"
        className={`login-button ${isValidIranianPhone(phone) ? 'active' : ''}`}
        disabled={!isValidIranianPhone(phone)}
      >
        <FormattedMessage id="loginButton" />
      </button>
    </form>
  );
};

export default LoginForm;