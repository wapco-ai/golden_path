import React, { useState } from 'react';  

export const SettingsPage = () => {  
  const [settings, setSettings] = useState({  
    gpsHighAccuracy: true,  
    trackingInterval: 5,  
    saveLocationHistory: true,  
    darkMode: false,  
    mapTileProvider: 'openstreetmap',  
    language: 'fa'  
  });  

  const handleChange = (e) => {  
    const { name, value, type, checked } = e.target;  
    setSettings({  
      ...settings,  
      [name]: type === 'checkbox' ? checked : value  
    });  
  };  

  const handleSubmit = (e) => {  
    e.preventDefault();  
    // در اینجا می‌توانید تنظیمات را در store ذخیره کنید  
    console.log('Settings saved:', settings);  
    // نمایش پیام موفقیت  
    alert('تنظیمات با موفقیت ذخیره شد.');  
  };  

  return (  
    <div className="settings-page">  
      <h2>تنظیمات</h2>  
      
      <form onSubmit={handleSubmit} className="settings-form">  
        <div className="form-section">  
          <h3>تنظیمات GPS</h3>  
          
          <div className="form-group">  
            <label>  
              <input  
                type="checkbox"  
                name="gpsHighAccuracy"  
                checked={settings.gpsHighAccuracy}  
                onChange={handleChange}  
              />  
              استفاده از GPS با دقت بالا  
            </label>  
            <small>مصرف باتری بیشتر، دقت بالاتر</small>  
          </div>  
          
          <div className="form-group">  
            <label htmlFor="trackingInterval">فاصله زمانی ردیابی (ثانیه)</label>  
            <input  
              type="number"  
              id="trackingInterval"  
              name="trackingInterval"  
              min="1"  
              max="60"  
              value={settings.trackingInterval}  
              onChange={handleChange}  
            />  
          </div>  
        </div>  
        
        <div className="form-section">  
          <h3>تنظیمات داده</h3>  
          
          <div className="form-group">  
            <label>  
              <input  
                type="checkbox"  
                name="saveLocationHistory"  
                checked={settings.saveLocationHistory}  
                onChange={handleChange}  
              />  
              ذخیره تاریخچه موقعیت  
            </label>  
          </div>  
          
          <div className="form-group">  
            <button   
              type="button"   
              className="btn btn-danger"  
              onClick={() => {  
                if (window.confirm('آیا از پاک کردن تاریخچه اطمینان دارید؟')) {  
                  // پاک کردن تاریخچه  
                }  
              }}  
            >  
              پاک کردن تاریخچه موقعیت  
            </button>  
          </div>  
        </div>  
        
        <div className="form-section">  
          <h3>تنظیمات ظاهری</h3>  
          
          <div className="form-group">  
            <label>  
              <input  
                type="checkbox"  
                name="darkMode"  
                checked={settings.darkMode}  
                onChange={handleChange}  
              />  
              حالت تاریک  
            </label>  
          </div>  
          
          <div className="form-group">  
            <label htmlFor="mapTileProvider">ارائه‌دهنده نقشه</label>  
            <select  
              id="mapTileProvider"  
              name="mapTileProvider"  
              value={settings.mapTileProvider}  
              onChange={handleChange}  
            >  
              <option value="openstreetmap">OpenStreetMap</option>  
              <option value="carto">Carto</option>  
              <option value="terrain">Terrain</option>  
            </select>  
          </div>  
          
          <div className="form-group">  
            <label htmlFor="language">زبان</label>  
            <select  
              id="language"  
              name="language"  
              value={settings.language}  
              onChange={handleChange}  
            >  
              <option value="fa">فارسی</option>  
              <option value="en">English</option>  
              <option value="ar">العربية</option>  
            </select>  
          </div>  
        </div>  
        
        <div className="form-actions">  
          <button type="submit" className="btn btn-primary">  
            ذخیره تنظیمات  
          </button>  
          <button   
            type="button"   
            className="btn btn-secondary"  
            onClick={() => {  
              if (window.confirm('تنظیمات به حالت پیش‌فرض بازگردانده شود؟')) {  
                setSettings({  
                  gpsHighAccuracy: true,  
                  trackingInterval: 5,  
                  saveLocationHistory: true,  
                  darkMode: false,  
                  mapTileProvider: 'openstreetmap',  
                  language: 'fa'  
                });  
              }  
            }}  
          >  
            بازگشت به پیش‌فرض  
          </button>  
        </div>  
      </form>  
    </div>  
  );  
};  

// سطر زیر اضافه نشود - به جای آن از { SettingsPage } در import استفاده شود  
// export default SettingsPage;  