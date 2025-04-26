import React, { useState, useEffect, useCallback } from 'react';  
import MapView from '../components/map/MapView';  

export const MapPage = () => {  
  const [currentLocation, setCurrentLocation] = useState(null);  
  const [locationHistory, setLocationHistory] = useState([]);  
  const [savedLocations, setSavedLocations] = useState([]);  
  const [isTracking, setIsTracking] = useState(false);  
  const [error, setError] = useState(null);  
  const [loading, setLoading] = useState(true);  
  
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
          id: Date.now()  
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
  
  return (  
    <div className="map-fullpage">  
      {/* نوار ابزار بالای نقشه - روی نقشه قرار می‌گیرد */}  
      <div className="map-toolbar">  
        <button   
          className={`tracking-button ${isTracking ? 'active' : ''}`}  
          onClick={toggleTracking}  
        >  
          {isTracking ? 'توقف ردیابی' : 'شروع ردیابی'}  
        </button>  
        
        {error && <div className="error-indicator">{error}</div>}  
        
        {loading && !currentLocation && <div className="loading-indicator">در حال یافتن موقعیت...</div>}  
      </div>  
      
      {/* نقشه اصلی - فضای کامل صفحه را می‌گیرد */}  
      <MapView   
        currentLocation={currentLocation}  
        locationHistory={locationHistory}  
        savedLocations={savedLocations}  
        followUser={true}  
        initialZoom={15}  
      />  
      
      {/* نوار ابزار پایین نقشه - روی نقشه قرار می‌گیرد */}  
      <div className="map-bottom-toolbar">  
        <button   
          className="action-button save-button"  
          onClick={saveCurrentLocation}  
          disabled={!currentLocation}  
        >  
          ذخیره موقعیت  
        </button>  
        
        <button   
          className="action-button share-button"  
          onClick={shareCurrentLocation}  
          disabled={!currentLocation}  
        >  
          اشتراک‌گذاری  
        </button>  
        
        <button   
          className="action-button clear-button"  
          onClick={() => setLocationHistory([])}  
          disabled={locationHistory.length === 0}  
        >  
          پاک کردن مسیر  
        </button>  
      </div>  
    </div>  
  );  
};  

export default MapPage;  