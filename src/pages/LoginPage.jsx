import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { FormattedMessage, useIntl } from 'react-intl';
import logo from '../assets/images/logo.png';

const LoginPage = () => {
  const intl = useIntl();
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-container">
          <img src={logo} alt="لوگو نرم افزار" className="login-logo" />
        </div>
        
        <div className="login-text-content">
          <h1 className="login-title">
            <FormattedMessage id="loginTitle" />
          </h1>
          <p
            className="login-description"
            dangerouslySetInnerHTML={{
              __html: intl.formatMessage({ id: 'enterPhone' })
            }}
          />
        </div>

        <LoginForm />

        <div className="login-terms">
          <p
            dangerouslySetInnerHTML={{
              __html: intl.formatMessage({ id: 'terms' })
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;