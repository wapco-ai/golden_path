// src/pages/Profile.jsx
import React from 'react';
<<<<<<< Updated upstream
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';

function Profile() {
  const navigate = useNavigate();

  return (
    <div className="profile-container">
      {/* Profile Header with Back Arrow */}
      <div className="profile-header">
        <button className="back-arrow" onClick={() => navigate('/')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M15 6l-6 6l6 6" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>

        <h1 className="profile-title">حساب کاربری</h1>
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4FC3F7"/>
                  <stop offset="100%" stopColor="#2196F3"/>
                </linearGradient>
                <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#64B5F6"/>
                  <stop offset="100%" stopColor="#1976D2"/>
                </linearGradient>
              </defs>
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" fill="url(#avatarGradient)"/>
              <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" fill="url(#avatarGradient)"/>
            </svg>
          </div>
        </div>
=======

function Profile() {
  return (
    <div className="profile-container" style={{ direction: 'rtl', fontFamily: 'Vazir, Tahoma, sans-serif' }}>
      {/* Profile Header */}
      <div className="profile-header">
        <h1 className="profile-title">حساب کاربری</h1>
>>>>>>> Stashed changes
        <div className="user-info">
          <p className="user-name">کاربر مسیربایی آستان قدس</p>
          <p className="user-phone">98-964879789+</p>
        </div>
<<<<<<< Updated upstream
        <button className="complete-profile-btn">
          تکمیل پروفایل
        </button>
=======
        <button className="complete-profile-btn">تکمیل پروفایل</button>
>>>>>>> Stashed changes
      </div>

      {/* Profile Sections */}
      <div className="profile-sections">
        {/* Account Section */}
        <div className="profile-section">
          <h2 className="section-title">حساب کاربری</h2>
          <div className="section-item">
<<<<<<< Updated upstream
            <span className="item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </span>
            <span className="item-text">اطلاعات حساب کاربری</span>
            <span className="item-arrow">›</span>
          </div>
          <div className="section-item">
            <span className="item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                <path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" />
                <path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" />
              </svg>
            </span>
            <span className="item-text">مسیرهای پیموده شده من</span>
            <span className="item-arrow">›</span>
          </div>
          <div className="section-item">
            <span className="item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                <path d="M12 4v7l2 -2l2 2v-7" />
              </svg>
            </span>
            <span className="item-text">مکان های ذخیره شده</span>
            <span className="item-arrow">›</span>
=======
            <span className="item-icon">8.</span>
            <span className="item-text">اطلاعات حساب کاربری</span>
          </div>
          <div className="section-item">
            <span className="item-icon">🔍</span>
            <span className="item-text">مسیرهای پیموده شده من</span>
          </div>
          <div className="section-item">
            <span className="item-icon">🔍</span>
            <span className="item-text">مکان های ذخیره شده</span>
>>>>>>> Stashed changes
          </div>
        </div>

        {/* Settings Section */}
        <div className="profile-section">
          <h2 className="section-title">تنظیمات</h2>
          <div className="section-item">
<<<<<<< Updated upstream
            <span className="item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 5h7" />
                <path d="M9 3v2c0 4.418 -2.239 8 -5 8" />
                <path d="M5 9c0 2.144 2.952 3.908 6.7 4" />
                <path d="M12 20l4 -9l4 9" />
                <path d="M19.1 18h-6.2" />
              </svg>
            </span>
            <span className="item-text">زبان نرم افزار</span>
            <span className="item-arrow">›</span>
          </div>
          <div className="section-item">
            <span className="item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
                <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
              </svg>
            </span>
            <span className="item-text">اطلاع رسانی</span>
            <span className="item-arrow">›</span>
=======
            <span className="item-icon">🔍</span>
            <span className="item-text">زبان نرم افزار</span>
          </div>
          <div className="section-item">
            <span className="item-icon">🔍</span>
            <span className="item-text">اطلاع رسانی</span>
>>>>>>> Stashed changes
          </div>
        </div>

        {/* Support Section */}
        <div className="profile-section">
          <h2 className="section-title">آستان قدس</h2>
          <div className="section-item">
<<<<<<< Updated upstream
            <span className="item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
              </svg>
            </span>
            <span className="item-text">پشتیبان</span>
            <span className="item-arrow">›</span>
          </div>
          <div className="section-item">
            <span className="item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.802 2.165l5.575 2.389c.48 .206 .863 .589 1.07 1.07l2.388 5.574c.22 .512 .22 1.092 0 1.604l-2.389 5.575c-.206 .48 -.589 .863 -1.07 1.07l-5.574 2.388c-.512 .22 -1.092 .22 -1.604 0l-5.575 -2.389a2.036 2.036 0 0 1 -1.07 -1.07l-2.388 -5.574a2.036 2.036 0 0 1 0 -1.604l2.389 -5.575c.206 -.48 .589 -.863 1.07 -1.07l5.574 -2.388a2.036 2.036 0 0 1 1.604 0z" />
                <path d="M12 16v.01" />
                <path d="M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />
              </svg>
            </span>
            <span className="item-text">سوالات متداول</span>
            <span className="item-arrow">›</span>
          </div>
          <div className="section-item">
            <span className="item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
              </svg>
            </span>
            <span className="item-text">قوانین و مقررات</span>
            <span className="item-arrow">›</span>
          </div>
          <div className="section-item">
            <span className="item-icon">
              <img src={logo} alt="لوگو" className="custom-logo-icon" />
            </span>
            <span className="item-text">درباره ما</span>
            <span className="item-arrow">›</span>
          </div>
          <div className="section-item">
            <span className="item-icon">
              <img src={logo} alt="لوگو" className="custom-logo-icon" />
            </span>
            <span className="item-text">تماس با ما</span>
            <span className="item-arrow">›</span>
=======
            <span className="item-icon">🔍</span>
            <span className="item-text">پشتیبان</span>
          </div>
          <div className="section-item">
            <span className="item-icon">🔍</span>
            <span className="item-text">سوالات متداول</span>
          </div>
          <div className="section-item">
            <span className="item-icon">🔍</span>
            <span className="item-text">قوانین و مقررات</span>
          </div>
          <div className="section-item">
            <span className="item-icon">🔍</span>
            <span className="item-text">درباره ما</span>
          </div>
          <div className="section-item">
            <span className="item-icon">🔍</span>
            <span className="item-text">تماس با ما</span>
>>>>>>> Stashed changes
          </div>
        </div>

        {/* Logout Section */}
<<<<<<< Updated upstream
        <div className="logout-section">
          <h3 className="logout-title">خروج</h3>
          <div className="logout-item">
            <span className="item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
                <path d="M9 12h12l-3 -3" />
                <path d="M18 15l3 -3" />
              </svg>
            </span>
            <span className="item-text">خروج از حساب کاربری</span>
            <span className="item-arrow">›</span>
          </div>
        </div>
=======
        <div className="section-item logout-item">
          <h3 className="logout-title">خروج</h3>
          <div className="logout-item">
              <span className="item-icon">🔍</span>
              <span className="item-text">خروج از حساب کاربری</span>
            </div>
          </div>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}

export default Profile;