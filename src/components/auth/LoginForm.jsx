import React, { useState } from 'react';
import { useIntl } from 'react-intl';

const LoginForm = ({ onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formatMessage } = useIntl();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="phone">شماره موبایل</label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="09xxxxxxxxx"
          pattern="09[0-9]{9}"
          required
          dir="ltr" // LTR for numbers
          className="phone-input"
        />
      </div>

      <button 
        type="submit" 
        className="submit-btn"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'در حال ارسال...' : 'دریافت کد تایید'}
      </button>
    </form>
  );
};

export default LoginForm;