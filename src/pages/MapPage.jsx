// src/pages/MapPage.jsx  
import React, { useState, useEffect, useCallback } from 'react';  
import { Link } from 'react-router-dom';
import MapView from '../components/map/MapView';
import { useGPSNoiseDetection } from '../utils/useGPSNoiseDetection';
import { isValidGPSReading } from '../utils/gpsFilter';
import { LogStorageService } from '../services/LogStorageService';

export const MapPage = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackStartTime, setTrackStartTime] = useState(null);

  // استفاده از هوک تشخیص نویز  
  const {
    isJamming,
    isAccuracyLow,
    isSpeedUnrealistic,
    isPositionJumping,
    anomalyScore,
    noiseLevel
  } = useGPSNoiseDetection(locationHistory, currentLocation);

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
        console.log('موقعیت فعلی دریافت شد:', position);
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

        // ذخیره لاگ در دیتابیس لوکال  
        LogStorageService.saveGPSLog(newLocation, false);

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
    setTrackStartTime(Date.now());

    if (!navigator.geolocation) {
      setError('مرورگر شما از Geolocation پشتیبانی نمی‌کند');
      return;
    }

    // دریافت موقعیت اولیه  
    getCurrentPosition();

    // شروع ردیابی مداوم  
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log('دریافت موقعیت جدید از watchPosition:', position);
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

        setCurrentLocation(prevLocation => {
          // تشخیص نویز  
          const isNoisy = prevLocation && !isValidGPSReading(newLocation, prevLocation);

          // ذخیره لاگ در دیتابیس لوکال  
          LogStorageService.saveGPSLog(newLocation, isNoisy);

          // فیلتر کردن داده‌های نویزی (اختیاری)  
          if (!isNoisy) {
            // اضافه کردن به تاریخچه فقط اگر معتبر باشد  
            setLocationHistory(prevHistory => {
              const newHistory = [...prevHistory, newLocation];
              console.log('نقطه جدید به تاریخچه اضافه شد. تعداد نقاط:', newHistory.length);
              return newHistory;
            });
          } else {
            console.log('داده GPS نویزی فیلتر شد و به تاریخچه اضافه نشد');
          }

          // همیشه موقعیت فعلی را به‌روز می‌کنیم، حتی اگر به تاریخچه اضافه نشود  
          return newLocation;
        });

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
  const stopTracking = useCallback(() => {
    setIsTracking(false);

    if (window.geolocationWatchId !== undefined && navigator.geolocation) {
      navigator.geolocation.clearWatch(window.geolocationWatchId);
      window.geolocationWatchId = undefined;
      console.log('ردیابی GPS متوقف شد');

      // ذخیره تاریخچه مسیر در پایان ردیابی  
      if (trackStartTime && locationHistory.length > 0) {
        const endTime = Date.now();
        const trackName = prompt('نام این مسیر را وارد کنید:', `مسیر ${new Date().toLocaleDateString('fa-IR')}`);

        LogStorageService.saveTrackLog(
          locationHistory,
          trackStartTime,
          endTime,
          {
            name: trackName || `مسیر ${new Date().toLocaleDateString('fa-IR')}`,
            noiseScore: anomalyScore,
            quality: noiseLevel,
            length: locationHistory.length
          }
        );

        console.log('مسیر ذخیره شد');
      }
    }
  }, [locationHistory, trackStartTime, anomalyScore, noiseLevel]);

  // تغییر وضعیت ردیابی  
  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, stopTracking, startTracking]);

  // ذخیره موقعیت فعلی  
  const saveCurrentLocation = useCallback(() => {
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
  }, [currentLocation]);

  // اشتراک‌گذاری موقعیت فعلی  
  const shareCurrentLocation = useCallback(() => {
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
  }, [currentLocation]);

  // پاک کردن تاریخچه مسیر  
  const clearTrackHistory = useCallback(() => {
    if (locationHistory.length > 0) {
      if (window.confirm('آیا مطمئن هستید که می‌خواهید تاریخچه مسیر را پاک کنید؟')) {
        setLocationHistory([]);
        console.log('تاریخچه مسیر پاک شد');
      }
    } else {
      alert('تاریخچه مسیری برای پاک کردن وجود ندارد.');
    }
  }, [locationHistory.length]);

  // دریافت موقعیت اولیه هنگام بارگذاری صفحه  
  useEffect(() => {
    console.log('MapPage mounted - دریافت موقعیت اولیه');
    getCurrentPosition();

    return () => {
      // پاکسازی  
      if (window.geolocationWatchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(window.geolocationWatchId);
        console.log('ردیابی GPS پاکسازی شد (unmount)');
      }
    };
  }, [getCurrentPosition]);

  // نمایش اطلاعات نویز GPS در کنسول برای دیباگ  
  useEffect(() => {
    if (isJamming) {
      console.log('هشدار: احتمال اختلال در سیگنال GPS', {
        score: anomalyScore,
        isAccuracyLow,
        isSpeedUnrealistic,
        isPositionJumping
      });
    }
  }, [isJamming, anomalyScore, isAccuracyLow, isSpeedUnrealistic, isPositionJumping]);

  return (
    <div className="map-fullpage">
      {/* نوار ابزار بالای نقشه - روی نقشه قرار می‌گیرد */}
      <div className="map-toolbar">
        <Link to="/" className="back-button">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>بازگشت</span>
        </Link>

        {/* نشانگر کیفیت سیگنال در نوار بالا */}
        <div className={`signal-quality-pill ${anomalyScore < 20 ? 'good' :
            anomalyScore < 50 ? 'medium' : 'poor'
          }`}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12 L12 2 L22 12"></path>
            <path d="M5 15 L12 8 L19 15"></path>
            <path d="M8 18 L12 14 L16 18"></path>
          </svg>
          <span>GPS: {
            noiseLevel === 'کم' ? 'خوب' :
              noiseLevel === 'متوسط' ? 'متوسط' : 'ضعیف'
          }</span>
        </div>

        <button
          className={`tracking-button ${isTracking ? 'active' : ''}`}
          onClick={toggleTracking}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            {isTracking ? (
              <path d="M10 9v6l5-3-5-3z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path d="M12 8v4l3 3-1.5 1.5L9 12V8h3z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <span>{isTracking ? 'توقف ردیابی' : 'شروع ردیابی'}</span>
        </button>
      </div>

      {/* نقشه اصلی */}
      <MapView
        currentLocation={currentLocation}
        locationHistory={locationHistory}
        savedLocations={savedLocations}
        followUser={true}
        initialZoom={15}
      />

      {/* نوار ابزار پایین نقشه */}
      <div className="map-bottom-toolbar">
        <button
          className="action-button save-button"
          onClick={saveCurrentLocation}
          disabled={!currentLocation || isJamming}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>ذخیره موقعیت</span>
        </button>

        <button
          className="action-button share-button"
          onClick={shareCurrentLocation}
          disabled={!currentLocation}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span>اشتراک‌گذاری</span>
        </button>

        <button
          className="action-button map-clear-button" // تغییر از clear-button به map-clear-button  
          onClick={clearTrackHistory}
          disabled={locationHistory.length === 0}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
          </svg>
          <span>پاک کردن مسیر</span>
        </button>

        {/*        <Link to="/settings" className="action-button settings-button">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">  
            <circle cx="12" cy="12" r="3"></circle>  
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>  
          </svg>  
          <span>تنظیمات</span>  
        </Link>  */}
      </div>
      {/* سیستم نمایش هشدارها و خطاها */}
      <div className="alerts-container">
        {isJamming && (
          <div className="alert-toast warning-alert">
            <div className="alert-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div className="alert-content">
              <div className="alert-title">احتمال اختلال GPS</div>
              <div className="alert-details">
                {isPositionJumping && <span>پرش موقعیت</span>}
                {isSpeedUnrealistic && <span>سرعت غیرعادی</span>}
                {isAccuracyLow && <span>دقت پایین</span>}
              </div>
            </div>
            <button className="alert-close" onClick={() => {/* اینجا می‌توانید اختیاری هشدار را بی‌صدا کنید */ }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="alert-toast error-alert">
            <div className="alert-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="alert-content">
              <div className="alert-title">خطا</div>
              <div className="alert-message">{error}</div>
            </div>
            <button className="alert-close" onClick={() => setError(null)}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {loading && !currentLocation && (
          <div className="alert-toast info-alert">
            <div className="alert-icon spinning">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            </div>
            <div className="alert-content">
              <div className="alert-message">در حال یافتن موقعیت شما...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;  