// src/pages/Alogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Alogin.css';
import logo from '../assets/images/logo3.png';

const Alogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();

  // Sample data for the pie chart
  const [commentStats] = useState({
    total: 152,
    approved: 89,
    rejected: 46
  });

  const unknownComments = commentStats.total - commentStats.approved - commentStats.rejected;
  const approvedDegrees = (commentStats.approved / commentStats.total) * 360;
  const rejectedDegrees = (commentStats.rejected / commentStats.total) * 360;
  const unknownDegrees = (unknownComments / commentStats.total) * 360;

  const handleLogin = (e) => {
    e.preventDefault();

    // Reset errors
    setUsernameError('');
    setPasswordError('');

    // Simple validation for demo purposes
    if (!username.trim()) {
      setUsernameError('نام کاربری را وارد کنید');
      return;
    }

    if (!password.trim()) {
      setPasswordError('رمز عبور را وارد کنید');
      return;
    }

    // For demo purposes, any non-empty credentials will work
    // In real app, you would validate against backend
    if (username.trim() && password.trim()) {
      navigate('/Amain');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % 3);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + 3) % 3);
  };

  return (
    <div className="login-container4">
      <div className="login-content4">
        {/* Right Section - Login Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="logo-section">
              <img src={logo} alt="Logo" className="login-logo" />
            </div>

            <div className="form-header">
              <h1>ورود به داشبورد مدیریتی</h1>
              <p>برای ورود به داشبورد مدیریتی فاوا رضوی (مسیریابی حرم مطهر)<br />نام کاربری و رمز عبور خودتان را وارد نمایید.</p>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label className={`input-wrapper5 ${usernameError ? 'error' : ''}`}>
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.0001 1.04163C7.81395 1.04163 6.04175 2.81383 6.04175 4.99996C6.04175 7.18609 7.81395 8.95829 10.0001 8.95829C12.1862 8.95829 13.9584 7.18609 13.9584 4.99996C13.9584 2.81383 12.1862 1.04163 10.0001 1.04163ZM7.29175 4.99996C7.29175 3.50419 8.50431 2.29163 10.0001 2.29163C11.4959 2.29163 12.7084 3.50419 12.7084 4.99996C12.7084 6.49573 11.4959 7.70829 10.0001 7.70829C8.50431 7.70829 7.29175 6.49573 7.29175 4.99996Z" fill="#1E2023" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.0001 10.2083C8.30064 10.2083 6.73135 10.6006 5.56521 11.267C4.41675 11.9232 3.54175 12.9251 3.54175 14.1666C3.54175 15.4082 4.41675 16.41 5.56521 17.0663C6.73135 17.7327 8.30064 18.125 10.0001 18.125C11.6995 18.125 13.2688 17.7327 14.435 17.0663C15.5834 16.41 16.4584 15.4082 16.4584 14.1666C16.4584 12.9251 15.5834 11.9232 14.435 11.267C13.2688 10.6006 11.6995 10.2083 10.0001 10.2083ZM4.79175 14.1666C4.79175 13.5672 5.22259 12.9024 6.18538 12.3523C7.13049 11.8122 8.47787 11.4583 10.0001 11.4583C11.5223 11.4583 12.8697 11.8122 13.8148 12.3523C14.7776 12.9024 15.2084 13.5672 15.2084 14.1666C15.2084 14.766 14.7776 15.4308 13.8148 15.981C12.8697 16.5211 11.5223 16.875 10.0001 16.875C8.47787 16.875 7.13049 16.5211 6.18538 15.981C5.22259 15.4308 4.79175 14.766 4.79175 14.1666Z" fill="#1E2023" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="نام کاربری"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                  />
                </label>
                {usernameError && <div className="error-message">{usernameError}</div>}
              </div>

              <div className="form-group">
                <label className={`input-wrapper5 ${passwordError ? 'error' : ''}`}>
                  <span className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.70842 13.3333C7.70842 12.0676 8.73443 11.0416 10.0001 11.0416C11.2657 11.0416 12.2917 12.0676 12.2917 13.3333C12.2917 14.5989 11.2657 15.625 10.0001 15.625C8.73443 15.625 7.70842 14.5989 7.70842 13.3333ZM10.0001 12.2916C9.42479 12.2916 8.95842 12.758 8.95842 13.3333C8.95842 13.9086 9.42479 14.375 10.0001 14.375C10.5754 14.375 11.0417 13.9086 11.0417 13.3333C11.0417 12.758 10.5754 12.2916 10.0001 12.2916Z" fill="#1E2023" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M4.37508 7.75227V6.66663C4.37508 3.56002 6.89348 1.04163 10.0001 1.04163C13.1067 1.04163 15.6251 3.56002 15.6251 6.66663V7.75227C15.8141 7.76556 15.9923 7.78286 16.1599 7.8054C16.91 7.90624 17.5415 8.12199 18.0431 8.62358C18.5447 9.12518 18.7605 9.75674 18.8613 10.5068C18.9584 11.2293 18.9584 12.1479 18.9584 13.2876V13.379C18.9584 14.5187 18.9584 15.4373 18.8613 16.1598C18.7605 16.9098 18.5447 17.5414 18.0431 18.043C17.5415 18.5446 16.91 18.7603 16.1599 18.8612C15.4374 18.9583 14.5188 18.9583 13.3791 18.9583H6.62102C5.48136 18.9583 4.56276 18.9583 3.84029 18.8612C3.0902 18.7603 2.45864 18.5446 1.95704 18.043C1.45544 17.5414 1.2397 16.9098 1.13885 16.1598C1.04172 15.4373 1.04173 14.5187 1.04175 13.379V13.2876C1.04173 12.1479 1.04172 11.2293 1.13885 10.5068C1.2397 9.75674 1.45544 9.12518 1.95704 8.62358C2.45864 8.12199 3.0902 7.90624 3.84029 7.8054C4.00789 7.78286 4.18606 7.76556 4.37508 7.75227ZM5.62508 6.66663C5.62508 4.25038 7.58384 2.29163 10.0001 2.29163C12.4163 2.29163 14.3751 4.25038 14.3751 6.66663V7.71116C14.0638 7.70828 13.7321 7.70829 13.3791 7.70829H6.62102C6.26809 7.70829 5.93636 7.70828 5.62508 7.71116V6.66663ZM4.00685 9.04425C3.39537 9.12646 3.07156 9.27683 2.84092 9.50747C2.61029 9.7381 2.45992 10.0619 2.37771 10.6734C2.29308 11.3029 2.29175 12.1371 2.29175 13.3333C2.29175 14.5295 2.29308 15.3637 2.37771 15.9932C2.45992 16.6047 2.61029 16.9285 2.84092 17.1591C3.07156 17.3898 3.39537 17.5401 4.00685 17.6223C4.63631 17.707 5.47057 17.7083 6.66675 17.7083H13.3334C14.5296 17.7083 15.3639 17.707 15.9933 17.6223C16.6048 17.5401 16.9286 17.3898 17.1592 17.1591C17.3899 16.9285 17.5402 16.6047 17.6225 15.9932C17.7071 15.3637 17.7084 14.5295 17.7084 13.3333C17.7084 12.1371 17.7071 11.3029 17.6225 10.6734C17.5402 10.0619 17.3899 9.7381 17.1592 9.50747C16.9286 9.27683 16.6048 9.12646 15.9933 9.04425C15.3639 8.95962 14.5296 8.95829 13.3334 8.95829H6.66675C5.47057 8.95829 4.63631 8.95962 4.00685 9.04425Z" fill="#1E2023" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="رمز عبور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onMouseDown={togglePasswordVisibility}
                    onMouseUp={togglePasswordVisibility}
                    onMouseLeave={() => setShowPassword(false)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M9.99984 6.87504C8.27395 6.87504 6.87484 8.27415 6.87484 10C6.87484 11.7259 8.27395 13.125 9.99984 13.125C11.7257 13.125 13.1248 11.7259 13.1248 10C13.1248 8.27415 11.7257 6.87504 9.99984 6.87504ZM8.12484 10C8.12484 8.96451 8.9643 8.12504 9.99984 8.12504C11.0354 8.12504 11.8748 8.96451 11.8748 10C11.8748 11.0356 11.0354 11.875 9.99984 11.875C8.9643 11.875 8.12484 11.0356 8.12484 10Z" fill="#1E2023" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M9.99984 2.70837C6.23806 2.70837 3.70425 4.96187 2.23364 6.87243L2.20712 6.90687C1.87454 7.33882 1.56822 7.73664 1.36041 8.20704C1.13787 8.71077 1.0415 9.25978 1.0415 10C1.0415 10.7403 1.13787 11.2893 1.36041 11.793C1.56822 12.2634 1.87454 12.6613 2.20713 13.0932L2.23364 13.1277C3.70425 15.0382 6.23806 17.2917 9.99984 17.2917C13.7616 17.2917 16.2954 15.0382 17.766 13.1277L17.7925 13.0932C18.1251 12.6613 18.4314 12.2634 18.6393 11.793C18.8618 11.2893 18.9582 10.7403 18.9582 10C18.9582 9.25978 18.8618 8.71077 18.6393 8.20704C18.4314 7.73663 18.1251 7.33881 17.7925 6.90685L17.766 6.87243C16.2954 4.96187 13.7616 2.70837 9.99984 2.70837ZM3.22419 7.63487C4.58203 5.87081 6.7918 3.95837 9.99984 3.95837C13.2079 3.95837 15.4176 5.87081 16.7755 7.63487C17.141 8.1097 17.3551 8.39342 17.4959 8.71216C17.6275 9.01005 17.7082 9.37415 17.7082 10C17.7082 10.6259 17.6275 10.99 17.4959 11.2879C17.3551 11.6067 17.141 11.8904 16.7755 12.3652C15.4176 14.1293 13.2079 16.0417 9.99984 16.0417C6.7918 16.0417 4.58204 14.1293 3.22419 12.3652C2.8587 11.8904 2.64462 11.6067 2.5038 11.2879C2.3722 10.99 2.2915 10.6259 2.2915 10C2.2915 9.37415 2.3722 9.01005 2.5038 8.71216C2.64462 8.39342 2.8587 8.1097 3.22419 7.63487Z" fill="#1E2023" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6.94739C10.8108 6.9474 11.578 7.26365 12.1572 7.8429C12.1709 7.85655 12.1777 7.8741 12.1777 7.89172C12.1777 7.90935 12.1709 7.92689 12.1572 7.94055L7.94043 12.1573C7.93109 12.1667 7.92293 12.1706 7.91699 12.173C7.91055 12.1755 7.90233 12.1779 7.8916 12.1779C7.88088 12.1779 7.87265 12.1755 7.86621 12.173C7.86027 12.1706 7.85211 12.1667 7.84277 12.1573C7.26352 11.5781 6.94728 10.8109 6.94727 10.0001C6.94727 8.31528 8.31516 6.94739 10 6.94739ZM10 7.08606C8.39318 7.08606 7.08594 8.3933 7.08594 10.0001C7.08595 10.5137 7.21996 11.0088 7.46777 11.4425L7.82812 12.0743L12.0742 7.82825L11.4424 7.4679C11.0087 7.22008 10.5136 7.08607 10 7.08606Z" fill="#1E2023" stroke="#1E2023" stroke-width="1.11111" />
                        <path d="M10.0002 3.03894C11.7025 3.03897 13.3952 3.62625 14.8909 4.75183C14.9257 4.77909 14.9259 4.82287 14.9075 4.84753C14.8802 4.88356 14.8357 4.88396 14.8108 4.86511H14.8098C13.3558 3.76579 11.6902 3.17764 10.0002 3.17761C7.07195 3.17761 4.3397 4.93523 2.46606 7.87488C2.08089 8.47574 1.90943 9.25736 1.90942 9.99988C1.90942 10.7424 2.08088 11.524 2.46606 12.1249C3.0351 13.0125 3.68086 13.7999 4.3938 14.4667L4.70337 14.746C4.73244 14.773 4.73693 14.8176 4.70923 14.8505L4.70435 14.8553C4.7024 14.8576 4.69836 14.8611 4.69165 14.8641C4.68438 14.8674 4.6757 14.869 4.66724 14.869C4.66091 14.869 4.65107 14.8678 4.64087 14.8641C4.6312 14.8607 4.62427 14.8567 4.62036 14.8534L4.61841 14.8514L4.30493 14.5741C3.58371 13.9082 2.92753 13.1135 2.35376 12.204L2.35083 12.2001L2.21899 11.9725C1.93136 11.4218 1.77661 10.7238 1.77661 10.0028C1.77665 9.17877 1.97925 8.38214 2.35181 7.79871C4.30818 4.73602 7.10732 3.03894 10.0002 3.03894Z" fill="#1E2023" stroke="#1E2023" stroke-width="1.11111" />
                        <path d="M9.99989 17.5167C8.89156 17.5167 7.80822 17.2917 6.76656 16.85C6.44989 16.7167 6.29989 16.35 6.43322 16.0334C6.56656 15.7167 6.93322 15.5667 7.24989 15.7C8.13322 16.075 9.05822 16.2667 9.99156 16.2667C12.6832 16.2667 15.2582 14.65 17.0582 11.825C17.6832 10.85 17.6832 9.15004 17.0582 8.17504C16.7999 7.76671 16.5166 7.37504 16.2166 7.00837C15.9999 6.74171 16.0416 6.35004 16.3082 6.12504C16.5749 5.90837 16.9666 5.94171 17.1916 6.21671C17.5166 6.61671 17.8332 7.05004 18.1166 7.50004C18.9999 8.87504 18.9999 11.1167 18.1166 12.5C16.0832 15.6834 13.1249 17.5167 9.99989 17.5167Z" fill="#1E2023" />
                        <path d="M10.5749 13.5584C10.2832 13.5584 10.0166 13.35 9.95824 13.05C9.89157 12.7084 10.1166 12.3834 10.4582 12.325C11.3749 12.1584 12.1416 11.3917 12.3082 10.475C12.3749 10.1334 12.6999 9.91671 13.0416 9.97504C13.3832 10.0417 13.6082 10.3667 13.5416 10.7084C13.2749 12.15 12.1249 13.2917 10.6916 13.5584C10.6499 13.55 10.6166 13.5584 10.5749 13.5584Z" fill="#1E2023" />
                        <path d="M1.66662 18.9583C1.50828 18.9583 1.34995 18.8999 1.22495 18.7749C0.983285 18.5333 0.983285 18.1333 1.22495 17.8916L7.44995 11.6666C7.69162 11.4249 8.09162 11.4249 8.33329 11.6666C8.57495 11.9083 8.57495 12.3083 8.33329 12.5499L2.10828 18.7749C1.98328 18.8999 1.82495 18.9583 1.66662 18.9583Z" fill="#1E2023" />
                        <path d="M12.1083 8.51674C11.9499 8.51674 11.7916 8.45841 11.6666 8.33341C11.4249 8.09174 11.4249 7.69174 11.6666 7.45007L17.8916 1.22507C18.1333 0.983407 18.5333 0.983407 18.7749 1.22507C19.0166 1.46674 19.0166 1.86674 18.7749 2.10841L12.5499 8.33341C12.4249 8.45841 12.2666 8.51674 12.1083 8.51674Z" fill="#1E2023" />
                      </svg>

                    )}
                  </button>
                </label>
                {passwordError && <div className="error-message">{passwordError}</div>}
              </div>

              <div className="forgot-password">
                <a href="#" className="forgot-link">رمز عبورتان را فراموش کرده‌اید؟ بازیابی رمز عبور</a>
              </div>

              <button type="submit" className="login-button">
                ورود
              </button>
            </form>

            <div className="privacy-notice">
              ورود شما به معنای پذیرش شرایط فاوا رضوی و قوانین حریم‌خصوصی است
            </div>
          </div>
        </div>

        {/* Left Section - Stats & Info */}
        <div className="login-left">
          <div className="slides-container4">
            <div className="slides-wrapper" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {/* Slide 1 - Chart */}
              <div className="slide">
                <div className="chart-section">
                  <div className="chart-header-with-filter">
                    <h3>نظرات ثبت شده</h3>
                    <div className="time-filter">
                      <span>ماه اخیر</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3.64645 5.64645C3.84171 5.45118 4.15829 5.45118 4.35355 5.64645L8 9.29289L11.6464 5.64645C11.8417 5.45118 12.1583 5.45118 12.3536 5.64645C12.5488 5.84171 12.5488 6.15829 12.3536 6.35355L8.35355 10.3536C8.15829 10.5488 7.84171 10.5488 7.64645 10.3536L3.64645 6.35355C3.45118 6.15829 3.45118 5.84171 3.64645 5.64645Z" fill="#1E2023" />
                      </svg>
                    </div>
                  </div>

                  <div className="pie-chart-wrapper2">
                    <div className="pie-chart-main2">
                      <div className="pie-chart-visual2" style={{
                        background: `conic-gradient(#0F71EF 0deg ${approvedDegrees}deg, white ${approvedDegrees}deg ${approvedDegrees + 2}deg, #F44336 ${approvedDegrees + 2}deg ${approvedDegrees + rejectedDegrees + 2}deg, white ${approvedDegrees + rejectedDegrees + 2}deg ${approvedDegrees + rejectedDegrees + 4}deg, #F2F2F2 ${approvedDegrees + rejectedDegrees + 4}deg 360deg)`
                      }}>
                        <div className="pie-center2"></div>
                      </div>
                    </div>
                  </div>

                  <div className="table-header">
                    <span>نظرات و حالت ها</span>
                    <span>تعداد</span>
                  </div>
                  <div className="comments-table">
                    <div className="table-row2">
                      <span>کل نظرات ثبت شده (مرداد)</span>
                      <span className="count-value">{commentStats.total}</span>
                    </div>

                    <div className="table-row">
                      <div className="stat-info">
                        <div className="stat-color approved"></div>
                        <span>تایید و انتشار</span>
                      </div>
                      <div className="count-value">{commentStats.approved}</div>
                    </div>
                    <div className="table-row">
                      <div className="stat-info">
                        <div className="stat-color rejected"></div>
                        <span>رد شده</span>
                      </div>
                      <div className="count-value">{commentStats.rejected}</div>
                    </div>
                  </div>
                </div>

                {/* User Stats Card Overlay */}
                <div className="user-stats-overlay">
                  <div className="user-stat-card">
                    <div className="stat-card-icon">
                      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="4" width="48" height="48" rx="24" fill="#0F71EF" />
                        <rect x="4" y="4" width="48" height="48" rx="24" stroke="#F5F6FF" strokeWidth="8" />
                        <path d="M28.1705 36.6377C27.2957 36.6377 26.4289 36.3809 25.7468 35.8753L22.2957 33.299C21.3808 32.6169 20.6665 31.1963 20.6665 30.0567V24.0936C20.6665 22.8576 21.5734 21.5414 22.7371 21.108L26.7419 19.6072C27.5365 19.3103 28.7885 19.3103 29.583 19.6072L33.5959 21.108C34.7596 21.5414 35.6665 22.8576 35.6665 24.0936V30.0567C35.6665 31.1963 34.9522 32.6169 34.0373 33.299L30.5862 35.8753C29.9121 36.3809 29.0453 36.6377 28.1705 36.6377ZM27.1673 20.7308L23.1625 22.2316C22.4723 22.4885 21.8704 23.3552 21.8704 24.0936V30.0567C21.8704 30.8191 22.4081 31.8865 23.01 32.336L26.461 34.9122C27.384 35.6024 28.949 35.6024 29.872 34.9122L33.323 32.336C33.933 31.8785 34.4627 30.8111 34.4627 30.0567V24.0936C34.4627 23.3633 33.8607 22.4965 33.1705 22.2316L29.1657 20.7308C28.636 20.5302 27.705 20.5302 27.1673 20.7308Z" fill="white" />
                        <path d="M27.1673 20.7308L23.1625 22.2316C22.4723 22.4885 21.8704 23.3552 21.8704 24.0936V30.0567C21.8704 30.8191 22.4081 31.8865 23.01 32.336L26.461 34.9122C27.384 35.6024 28.949 35.6024 29.872 34.9122L33.323 32.336C33.933 31.8785 34.4627 30.8111 34.4627 30.0567V24.0936C34.4627 23.3633 33.8607 22.4965 33.1705 22.2316L29.1657 20.7308C28.636 20.5302 27.705 20.5302 27.1673 20.7308Z" fill="white" />
                        <path d="M28.1707 27.7373H28.1145C26.9508 27.7052 26.1001 26.8143 26.1001 25.7309C26.1001 24.6233 27.007 23.7164 28.1145 23.7164C29.2221 23.7164 30.129 24.6233 30.129 25.7309C30.1285 26.2526 29.926 26.7539 29.5638 27.1295C29.2017 27.5051 28.7081 27.7258 28.1868 27.7453C28.1787 27.7373 28.1787 27.7373 28.1707 27.7373ZM28.1145 24.9203C27.6651 24.9203 27.3039 25.2814 27.3039 25.7309C27.3039 26.1723 27.649 26.5254 28.0824 26.5415H28.1707C28.3765 26.5291 28.5697 26.438 28.7101 26.2871C28.8506 26.1362 28.9276 25.937 28.9251 25.7309C28.9262 25.6241 28.906 25.5182 28.8656 25.4194C28.8253 25.3206 28.7656 25.2308 28.6901 25.1553C28.6146 25.0798 28.5248 25.0202 28.426 24.9798C28.3272 24.9394 28.2213 24.9192 28.1145 24.9203ZM28.1707 32.2959C27.4805 32.2959 26.7823 32.1113 26.2446 31.7501C25.7068 31.397 25.4019 30.8761 25.4019 30.3224C25.4019 29.7686 25.7068 29.2469 26.2446 28.8858C27.328 28.1635 29.0214 28.1715 30.0969 28.8858C30.6346 29.2389 30.9396 29.7606 30.9396 30.3143C30.9396 30.8681 30.6346 31.3898 30.0969 31.7509C29.5592 32.1121 28.8609 32.2959 28.1707 32.2959ZM26.9107 29.8802C26.71 30.0086 26.5977 30.1691 26.6057 30.3135C26.6057 30.458 26.7181 30.6185 26.9107 30.7469C27.5848 31.1964 28.7566 31.1964 29.4307 30.7469C29.6314 30.6185 29.7437 30.458 29.7437 30.3135C29.7437 30.1691 29.6314 30.0086 29.4388 29.8802C28.7646 29.4387 27.5848 29.4387 26.9107 29.8802Z" fill="#0F71EF" />
                      </svg>
                    </div>
                    <div className="user-stat-content">
                      <div className="user-stat-title">تعداد کاربران</div>
                      <div className="user-stat-value">۱,۴۵۶,۰۰۳</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>مدیریت آمار نظرات و کاربران</h3>
                <p>
                  لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز
                  لورم ایپسوم متن ساختگی با تولید.
                </p>
              </div>

              {/* Slide 2 - Info */}
              <div className="slide">
              </div>

              {/* Slide 3 - Additional Stats */}
              <div className="slide">
                <div className="additional-stats">
                  <h3>آمار کلی سیستم</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-number">۱,۴۵۶,۰۰۳</div>
                      <div className="stat-label">کاربران فعال</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">۷۲۸,۱۰۵</div>
                      <div className="stat-label">مسیریابی موفق</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">۱۵۶</div>
                      <div className="stat-label">مراکز فرهنگی</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Controls */}
          <div className="slide-controls">
            <button className="slide-arrow prev" onClick={prevSlide}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="#858585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="slide-dots">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  className={`slide-dot ${activeSlide === index ? 'active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>

            <button className="slide-arrow next" onClick={nextSlide}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4L10 8L6 12" stroke="#858585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alogin;