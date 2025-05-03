// src/pages/Profile.jsx
import React from 'react';

function Profile() {
  return (
    <div className="profile-container" style={{ direction: 'rtl', fontFamily: 'Vazir, Tahoma, sans-serif' }}>
      {/* Profile Header */}
      <div className="profile-header">
        <h1 className="profile-title">حساب کاربری</h1>
        <div className="user-info">
          <p className="user-name">کاربر مسیربایی آستان قدس</p>
          <p className="user-phone">98-964879789+</p>
        </div>
        <button className="complete-profile-btn">تکمیل پروفایل</button>
      </div>

      {/* Profile Sections */}
      <div className="profile-sections">
        {/* Account Section */}
        <div className="profile-section">
          <h2 className="section-title">حساب کاربری</h2>
          <div className="section-item">
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
          </div>
        </div>

        {/* Settings Section */}
        <div className="profile-section">
          <h2 className="section-title">تنظیمات</h2>
          <div className="section-item">
            <span className="item-icon">🔍</span>
            <span className="item-text">زبان نرم افزار</span>
          </div>
          <div className="section-item">
            <span className="item-icon">🔍</span>
            <span className="item-text">اطلاع رسانی</span>
          </div>
        </div>

        {/* Support Section */}
        <div className="profile-section">
          <h2 className="section-title">آستان قدس</h2>
          <div className="section-item">
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
          </div>
        </div>

        {/* Logout Section */}
        <div className="section-item logout-item">
          <h3 className="logout-title">خروج</h3>
          <div className="logout-item">
              <span className="item-icon">🔍</span>
              <span className="item-text">خروج از حساب کاربری</span>
            </div>
          </div>
      </div>
    </div>
  );
}

export default Profile;