import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import logo from '../assets/images/logo.png';
import '../styles/Login.css';

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
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
  </svg>
);

const LoginPage = () => {
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
    const value = e.target.value.replace(/\D/g, '');
    const newCode = [...verificationCode];

    if (value.length <= 1) {
      newCode[index] = value;
      setVerificationCode(newCode);

      // Auto focus to next input if value entered
      if (value && index < 4) {
        document.getElementById(`code-input-${index + 1}`).focus();
      }
      // Auto focus to previous input if backspace pressed and current is empty
      else if (e.nativeEvent.inputType === 'deleteContentBackward' && !value && index > 0) {
        document.getElementById(`code-input-${index - 1}`).focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle left arrow key
    if (e.key === 'ArrowLeft' && index > 0) {
      document.getElementById(`code-input-${index - 1}`).focus();
    }
    // Handle right arrow key
    else if (e.key === 'ArrowRight' && index < 4) {
      document.getElementById(`code-input-${index + 1}`).focus();
    }
  };

  const handleSubmitPhone = (e) => {
    e.preventDefault();
    if (isValidIranianPhone(phone)) {
      // Format phone number in Persian style: ۰۹۱۲۳۴۵۶۷۸۹
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      const formatted = phone.split('').map(d => persianDigits[parseInt(d)]).join('');
      setFormattedPhone(formatted);
      setShowVerification(true);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-container">
          <img
            src={logo}
            alt={intl.formatMessage({ id: 'logoAlt' })}
            className="login-logo"
          />
        </div>

        <div className="login-text-content">
          <h1 className="login-title">
            {showVerification ? (
              <FormattedMessage id="enterVerification" />
            ) : (
              <FormattedMessage id="loginTitle" />
            )}
          </h1>
          {showVerification ? (
            <div className="verification-message">
              <p>
                <FormattedMessage
                  id="sentCode"
                  values={{
                    phone: <span dir="ltr" className="phone-number">{formattedPhone}</span>
                  }}
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
            </div>
          ) : (
            <p className="login-description">
              <FormattedMessage id="enterPhone" />
            </p>
          )}
        </div>

        {showVerification ? (
          <div className="verification-container" dir="ltr">
            <div className="verification-code-inputs">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="code-input"
                  dir="ltr"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="verification-resend">
              <span>
                <FormattedMessage id="resendCode" values={{ seconds: 50 }} />
              </span>
            </div>
          </div>
        ) : (
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
        )}

        {!showVerification && (
          <div className="login-terms">
            <p
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({ id: 'terms' })
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;