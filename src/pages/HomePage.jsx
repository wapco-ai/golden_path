import React from 'react';  
import { Link } from 'react-router-dom';  

export const HomePage = () => {  
  return (  
    <div className="home-page">  
      <section className="hero">  
        <h1>به اپلیکیشن مسیر طلایی خوش آمدید</h1>  
        <p>ردیابی دقیق موقعیت و ناوبری حتی در شرایط سخت</p>  
        
        <div className="hero-buttons">  
          <Link to="/map" className="btn btn-primary">  
            شروع ناوبری  
          </Link>  
          <Link to="/qr-scan" className="btn btn-secondary">  
            اسکن QR کد  
          </Link>  
        </div>  
      </section>  
      
      <section className="features">  
        <h2>امکانات اصلی</h2>  
        
        <div className="feature-cards">  
          <div className="feature-card">  
            <div className="feature-icon">🛰️</div>  
            <h3>ردیابی دقیق GPS</h3>  
            <p>دریافت موقعیت با دقت بالا و نمایش روی نقشه</p>  
          </div>  
          
          <div className="feature-card">  
            <div className="feature-icon">📱</div>  
            <h3>Dead Reckoning</h3>  
            <p>ردیابی حرکت حتی در شرایط بدون GPS با استفاده از سنسورهای دستگاه</p>  
          </div>  
          
          <div className="feature-card">  
            <div className="feature-icon">📷</div>  
            <h3>اسکن QR کد</h3>  
            <p>دریافت موقعیت و اطلاعات از طریق اسکن QR کد</p>  
          </div>  
          
          <div className="feature-card">  
            <div className="feature-icon">🔄</div>  
            <h3>کارکرد آفلاین</h3>  
            <p>قابلیت استفاده از اپلیکیشن بدون نیاز به اینترنت</p>  
          </div>  
        </div>  
      </section>  
      
      <section className="how-to-use">  
        <h2>نحوه استفاده</h2>  
        
        <div className="steps">  
          <div className="step">  
            <div className="step-number">1</div>  
            <h3>دسترسی به موقعیت</h3>  
            <p>به اپلیکیشن اجازه دسترسی به موقعیت دستگاه خود را بدهید</p>  
          </div>  
          
          <div className="step">  
            <div className="step-number">2</div>  
            <h3>انتخاب حالت ناوبری</h3>  
            <p>از بین گزینه‌های GPS، QR کد یا Dead Reckoning انتخاب کنید</p>  
          </div>  
          
          <div className="step">  
            <div className="step-number">3</div>  
            <h3>شروع ردیابی</h3>  
            <p>دکمه شروع ردیابی را فشار دهید و مسیر خود را ثبت کنید</p>  
          </div>  
        </div>  
      </section>  
    </div>  
  );  
};  

// سطر زیر اضافه نشود - به جای آن از { HomePage } در import استفاده شود  
// export default HomePage;  