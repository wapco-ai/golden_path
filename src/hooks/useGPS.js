import { useState, useEffect, useRef } from 'react';  
import { useGPSStore } from '../store/gpsStore';  

// Hook برای کار با GPS و دریافت موقعیت  
const useGPS = (options = {}) => {  
  const {   
    enableHighAccuracy = true,   
    timeout = 5000,   
    maximumAge = 0,  
    watchPosition = true  
  } = options;  
  
  const [position, setPosition] = useState(null);  
  const [error, setError] = useState(null);  
  const [loading, setLoading] = useState(true);  
  const watchIdRef = useRef(null);  
  
  const { updateCurrentLocation, addLocationToHistory } = useGPSStore();  
  
  // تبدیل داده خام GPS به فرمت مناسب  
  const processPosition = (pos) => {  
    const { latitude, longitude, accuracy, altitude, heading, speed } = pos.coords;  
    const timestamp = pos.timestamp;  
    
    const formattedPosition = {  
      coords: {  
        lat: latitude,  
        lng: longitude,  
        accuracy,  
        altitude,  
        heading,  
        speed  
      },  
      timestamp  
    };  
    
    setPosition(formattedPosition);  
    setLoading(false);  
    
    // به‌روزرسانی store  
    updateCurrentLocation(formattedPosition);  
    addLocationToHistory(formattedPosition);  
    
    return formattedPosition;  
  };  
  
  // مدیریت خطاها  
  const handleError = (err) => {  
    setError(err);  
    setLoading(false);  
    console.error('GPS Error:', err.message);  
  };  

  // دریافت موقعیت فعلی  
  const getCurrentPosition = () => {  
    setLoading(true);  
    
    if (!navigator.geolocation) {  
      setError(new Error('Geolocation is not supported by this browser'));  
      setLoading(false);  
      return Promise.reject('Geolocation not supported');  
    }  
    
    return new Promise((resolve, reject) => {  
      navigator.geolocation.getCurrentPosition(  
        (pos) => {  
          const formattedPos = processPosition(pos);  
          resolve(formattedPos);  
        },  
        (err) => {  
          handleError(err);  
          reject(err);  
        },  
        { enableHighAccuracy, timeout, maximumAge }  
      );  
    });  
  };  
  
  // شروع tracking موقعیت  
  const startWatching = () => {  
    if (!navigator.geolocation) {  
      setError(new Error('Geolocation is not supported by this browser'));  
      setLoading(false);  
      return;  
    }  
    
    watchIdRef.current = navigator.geolocation.watchPosition(  
      processPosition,  
      handleError,  
      { enableHighAccuracy, timeout, maximumAge }  
    );  
    
    return watchIdRef.current;  
  };  
  
  // توقف tracking موقعیت  
  const stopWatching = () => {  
    if (watchIdRef.current && navigator.geolocation) {  
      navigator.geolocation.clearWatch(watchIdRef.current);  
      watchIdRef.current = null;  
    }  
  };  
  
  useEffect(() => {  
    if (watchPosition) {  
      startWatching();  
    } else {  
      getCurrentPosition();  
    }  
    
    return () => {  
      stopWatching();  
    };  
  }, []);  
  
  return {  
    position,  
    error,  
    loading,  
    getCurrentPosition,  
    startWatching,  
    stopWatching  
  };  
};  

export default useGPS;  