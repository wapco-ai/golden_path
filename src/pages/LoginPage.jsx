import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import logo from '../assets/images/logo.png'; // Path adjusted for pages folder

const Login = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/verify'); // Redirect to OTP verification
  };

  return (
    <div className="login-page"> {/* Changed class name for specificity */}
      <div className="login-header">
        <img src={logo} alt="لوگو نرم افزار" className="login-logo" />
      </div>

      <div className="login-card">
        <h1>ورود به نرم افزار</h1>
        <p className="login-instruction">
          برای ورود و استفاده از امکانات بیشتر نرم افزار، شماره موبایل خود را وارد کنید.
        </p>

        <LoginForm onSuccess={handleLoginSuccess} />

        <div className="login-footer">
          <p>
            ورود شما به معنی پذیرش <a href="/terms">قوانین</a> و{' '}
            <a href="/privacy">شرایط خصوصی</a> است
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;