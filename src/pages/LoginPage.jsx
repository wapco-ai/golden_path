import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import logo from '../assets/images/logo.png';

const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-container">
          <img src={logo} alt="لوگو نرم افزار" className="login-logo" />
        </div>
        
        <div className="login-text-content">
          <h1 className="login-title">ورود به نرم افزار!</h1>
          <p className="login-description">
            برای ورود و استفاده از امکانات بیشتر نرم افزار،
            شماره موبایل خود را وارد کنید.
          </p>
        </div>

        <LoginForm />

        <div className="login-terms">
          <p>ورود شما به معنی پذیرش <a href="/terms">قوانین</a> و <a href="/privacy">شرایط خصوصی</a> است</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;