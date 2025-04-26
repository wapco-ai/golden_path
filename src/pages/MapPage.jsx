import React, { useState, useEffect, useCallback } from 'react';  
import MapView from '../components/map/MapView';  

export const MapPage = () => {  
  const [currentLocation, setCurrentLocation] = useState(null);  
  const [locationHistory, setLocationHistory] = useState([]);  
  const [savedLocations, setSavedLocations] = useState([]);  
  const [isTracking, setIsTracking] = useState(false);  
  const [error, setError] = useState(null);  
  const [loading, setLoading] = useState(true);  
  const [mapMode, setMapMode] = useState('gps'); // 'gps', 'qr', 'imu'  
  
  // دریافت موقعیت فعلی  
  const getCurrentPosition = useCallback(() => {  
    setLoading(true);  
    setError(null);  
    
    if (!navigator.geolocation) {  
      setError('مرورگر شما از Geolocation پشتیبانی نمی‌کند');  
      setLoading(false);  
      return;  
    }  
    
    navigator.geolocation.getCurrentPosition(  
      (position) => {  
        const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;  
        const newLocation = {  
          coords: {  
            lat: latitude,  
            lng: longitude,  
            accuracy,  
            altitude,  
            heading,  
            speed  
          },  
          timestamp: position.timestamp  
        };  
        
        setCurrentLocation(newLocation);  
        setLoading(false);  
      },  
      (error) => {  
        console.error('خطا در دریافت موقعیت:', error);  
        let errorMessage = 'خطا در دریافت موقعیت';  
        
        switch (error.code) {  
          case error.PERMISSION_DENIED:  
            errorMessage = 'دسترسی به موقعیت توسط کاربر رد شده است';  
            break;  
          case error.POSITION_UNAVAILABLE:  
            errorMessage = 'اطلاعات موقعیت در دسترس نیست';  
            break;  
          case error.TIMEOUT:  
            errorMessage = 'زمان درخواست موقعیت به پایان رسید';  
            break;  
          case error.UNKNOWN_ERROR:  
            errorMessage = 'خطای ناشناخته در دریافت موقعیت';  
            break;  
        }  
        
        setError(errorMessage);  
        setLoading(false);  
      },  
      {  
        enableHighAccuracy: true,  
        timeout: 10000,  
        maximumAge: 0  
      }  
    );  
  }, []);  
  
  // شروع ردیابی مداوم  
  const startTracking = useCallback(() => {  
    setIsTracking(true);  
    
    if (!navigator.geolocation) {  
      setError('مرورگر شما از Geolocation پشتیبانی نمی‌کند');  
      return;  
    }  
    
    // دریافت موقعیت اولیه  
    getCurrentPosition();  
    
    // شروع ردیابی مداوم  
    const watchId = navigator.geolocation.watchPosition(  
      (position) => {  
        const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;  
        const newLocation = {  
          coords: {  
            lat: latitude,  
            lng: longitude,  
            accuracy,  
            altitude,  
            heading,  
            speed  
          },  
          timestamp: position.timestamp,  
          id: Date.now() // شناسه یکتا برای هر موقعیت  
        };  
        
        setCurrentLocation(newLocation);  
        setLocationHistory(prevHistory => [...prevHistory, newLocation]);  
        setError(null);  
      },  
      (error) => {  
        console.error('خطا در ردیابی موقعیت:', error);  
        let errorMessage = 'خطا در ردیابی موقعیت';  
        
        switch (error.code) {  
          case error.PERMISSION_DENIED:  
            errorMessage = 'دسترسی به موقعیت توسط کاربر رد شده است';  
            break;  
          case error.POSITION_UNAVAILABLE:  
            errorMessage = 'اطلاعات موقعیت در دسترس نیست';  
            break;  
          case error.TIMEOUT:  
            errorMessage = 'زمان درخواست موقعیت به پایان رسید';  
            break;  
          case error.UNKNOWN_ERROR:  
            errorMessage = 'خطای ناشناخته در دریافت موقعیت';  
            break;  
        }  
        
        setError(errorMessage);  
      },  
      {  
        enableHighAccuracy: true,  
        timeout: 10000,  
        maximumAge: 0  
      }  
    );  
    
    // ذخیره ID مربوط به watchPosition برای پاکسازی بعدی  
    window.geolocationWatchId = watchId;  
  }, [getCurrentPosition]);  
  
  // توقف ردیابی  
  const stopTracking = () => {  
    setIsTracking(false);  
    
    if (window.geolocationWatchId !== undefined && navigator.geolocation) {  
      navigator.geolocation.clearWatch(window.geolocationWatchId);  
      window.geolocationWatchId = undefined;  
    }  
  };  
  
  // تغییر وضعیت ردیابی  
  const toggleTracking = () => {  
    if (isTracking) {  
      stopTracking();  
    } else {  
      startTracking();  
    }  
  };  
  
  // ذخیره موقعیت فعلی  
  const saveCurrentLocation = () => {  
    if (currentLocation) {  
      const locationName = prompt('نام این مکان را وارد کنید:', 'مکان جدید');  
      
      if (locationName) {  
        const savedLocation = {  
          ...currentLocation,  
          name: locationName,  
          id: Date.now()  
        };  
        
        setSavedLocations(prevLocations => [...prevLocations, savedLocation]);  
        alert(`موقعیت "${locationName}" با موفقیت ذخیره شد.`);  
      }  
    } else {  
      alert('موقعیتی برای ذخیره وجود ندارد.');  
    }  
  };  
  
  // اشتراک‌گذاری موقعیت فعلی  
  const shareCurrentLocation = () => {  
    if (!currentLocation) {  
      alert('موقعیتی برای اشتراک‌گذاری وجود ندارد.');  
      return;  
    }  
    
    const { lat, lng } = currentLocation.coords;  
    const googleMapsUrl = `https://maps.google.com/maps?q=${lat},${lng}`;  
    
    if (navigator.share) {  
      navigator.share({  
        title: 'موقعیت من',  
        text: `موقعیت من: ${lat}, ${lng}`,  
        url: googleMapsUrl  
      })  
      .then(() => console.log('موقعیت با موفقیت به اشتراک گذاشته شد'))  
      .catch((error) => console.error('خطا در اشتراک‌گذاری:', error));  
    } else {  
      // کپی لینک در کلیپ‌بورد  
      const textarea = document.createElement('textarea');  
      textarea.value = googleMapsUrl;  
      document.body.appendChild(textarea);  
      textarea.select();  
      document.execCommand('copy');  
      document.body.removeChild(textarea);  
      
      alert(`لینک موقعیت در کلیپ‌بورد کپی شد: ${googleMapsUrl}`);  
    }  
  };  
  
  // دریافت موقعیت اولیه هنگام بارگذاری صفحه  
  useEffect(() => {  
    getCurrentPosition();  
    
    return () => {  
      // پاکسازی  
      if (window.geolocationWatchId !== undefined && navigator.geolocation) {  
        navigator.geolocation.clearWatch(window.geolocationWatchId);  
      }  
    };  
  }, [getCurrentPosition]);  
  
  // کلیک روی نقشه  
  const handleMapClick = (e) => {  
    console.log('Map clicked at:', e.latlng);  
    // می‌توانید اینجا منطق اضافی مثل افزودن مارکر بگذارید  
  };  
  
  return (  
    <div className="map-page">  
      <div className="map-header">  
        <h2>نقشه موقعیت</h2>  
        
        <div className="map-controls">  
          <div className="mode-selector">  
            <button   
              className={`btn ${mapMode === 'gps' ? 'btn-primary' : 'btn-secondary'}`}  
              onClick={() => setMapMode('gps')}  
            >  
              GPS  
            </button>  
            <button   
              className={`btn ${mapMode === 'qr' ? 'btn-primary' : 'btn-secondary'}`}  
              onClick={() => setMapMode('qr')}  
            >  
              QR Code  
            </button>  
            <button   
              className={`btn ${mapMode === 'imu' ? 'btn-primary' : 'btn-secondary'}`}  
              onClick={() => setMapMode('imu')}  
            >  
              IMU  
            </button>  
          </div>  
          
          <button   
            className={`btn ${isTracking ? 'btn-danger' : 'btn-success'}`}  
            onClick={toggleTracking}  
          >  
            {isTracking ? 'توقف ردیابی' : 'شروع ردیابی'}  
          </button>  
        </div>  
      </div>  
      
      {error && (  
        <div className="error-message">  
          {error}  
        </div>  
      )}  
      
      <div className="location-info">  
        {loading && !currentLocation ? (  
          <div className="loading">در حال دریافت موقعیت...</div>  
        ) : currentLocation ? (  
          <div className="coordinates">  
            <div>عرض جغرافیایی: <strong>{currentLocation.coords.lat.toFixed(6)}</strong></div>  
            <div>طول جغرافیایی: <strong>{currentLocation.coords.lng.toFixed(6)}</strong></div>  
            <div>دقت: <strong>{currentLocation.coords.accuracy.toFixed(2)} متر</strong></div>  
            {currentLocation.coords.speed && (  
              <div>سرعت: <strong>{(currentLocation.coords.speed * 3.6).toFixed(2)} کیلومتر/ساعت</strong></div>  
            )}  
          </div>  
        ) : (  
          <div>موقعیت در دسترس نیست</div>  
        )}  
      </div>  
      
      <div className="map-wrapper">  
        <MapView   
          currentLocation={currentLocation}  
          locationHistory={locationHistory}  
          savedLocations={savedLocations}  
          height="60vh"  
          followUser={true}  
          initialZoom={15}  
          onMapClick={handleMapClick}  
        />  
      </div>  
      
      <div className="action-buttons">  
        <button   
          className="btn btn-primary"  
          onClick={saveCurrentLocation}  
          disabled={!currentLocation}  
        >  
          ذخیره موقعیت فعلی  
        </button>  
        <button   
          className="btn btn-info"  
          onClick={shareCurrentLocation}  
          disabled={!currentLocation}  
        >  
          اشتراک‌گذاری موقعیت  
        </button>  
        <button   
          className="btn btn-secondary"  
          onClick={() => setLocationHistory([])}  
          disabled={locationHistory.length === 0}  
        >  
          پاک کردن مسیر  
        </button>  
      </div>  
      
      <div className="info-panel">  
        <h3>آمار</h3>  
        <div className="stats">  
          <div className="stat-item">  
            <span className="stat-label">تعداد نقاط ثبت شده:</span>  
            <span className="stat-value">{locationHistory.length}</span>  
          </div>  
          {locationHistory.length > 0 && (  
            <div className="stat-item">  
              <span className="stat-label">زمان شروع ردیابی:</span>  
              <span className="stat-value">  
                {new Date(locationHistory[0].timestamp).toLocaleTimeString('fa-IR')}  
              </span>  
            </div>  
          )}  
          <div className="stat-item">  
            <span className="stat-label">مکان‌های ذخیره شده:</span>  
            <span className="stat-value">{savedLocations.length}</span>  
          </div>  
          {locationHistory.length > 1 && (  
            <div className="stat-item">  
              <span className="stat-label">مدت زمان ردیابی:</span>  
              <span className="stat-value">  
                {Math.floor((locationHistory[locationHistory.length - 1].timestamp - locationHistory[0].timestamp) / 60000)} دقیقه  
              </span>  
            </div>  
          )}  
        </div>  
      </div>  
    </div>  
  );  
};  

export default MapPage;  