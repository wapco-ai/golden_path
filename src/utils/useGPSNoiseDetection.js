// src/utils/useGPSNoiseDetection.js  
import { useState, useEffect } from 'react';  
import { calculateDistance } from './gpsFilter';  

// محاسبه زاویه بین دو نقطه (برای تشخیص تغییر جهت)  
const calculateBearing = (lat1, lon1, lat2, lon2) => {  
  const φ1 = lat1 * Math.PI / 180;  
  const φ2 = lat2 * Math.PI / 180;  
  const Δλ = (lon2 - lon1) * Math.PI / 180;  

  const y = Math.sin(Δλ) * Math.cos(φ2);  
  const x = Math.cos(φ1) * Math.sin(φ2) -  
          Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);  

  return Math.atan2(y, x) * 180 / Math.PI;  
};  

// تشخیص تغییر جهت ناگهانی  
const isSharpTurn = (bearing1, bearing2) => {  
  let diff = Math.abs(bearing2 - bearing1);  
  if (diff > 180) diff = 360 - diff;  
  return diff > 120; // تغییر بیش از 120 درجه  
};  

export const useGPSNoiseDetection = (locationHistory, currentLocation) => {  
  // وضعیت‌های مختلف  
  const [isJamming, setIsJamming] = useState(false);  
  const [isAccuracyLow, setIsAccuracyLow] = useState(false);  
  const [isSpeedUnrealistic, setIsSpeedUnrealistic] = useState(false);  
  const [isPositionJumping, setIsPositionJumping] = useState(false);  
  const [anomalyScore, setAnomalyScore] = useState(0); // امتیاز نویز بین 0 تا 100  
  
  // تنظیمات و آستانه‌ها  
  const UNREALISTIC_SPEED_THRESHOLD = 5; // متر بر ثانیه (18 کیلومتر بر ساعت)  
  const POSITION_JUMP_THRESHOLD = 50; // متر  
  const LOW_ACCURACY_THRESHOLD = 50; // متر  
  const MEASUREMENT_WINDOW = 5; // تعداد نقاط برای تحلیل  

  useEffect(() => {  
    // بررسی وجود داده‌های کافی برای تحلیل  
    if (!locationHistory || !Array.isArray(locationHistory) || locationHistory.length < 1 || !currentLocation) {  
      console.log('داده‌های کافی برای تحلیل وجود ندارد', {   
        hasHistory: !!locationHistory,   
        historyLength: locationHistory?.length || 0,   
        hasCurrent: !!currentLocation   
      });  
      return;  
    }  

    // نمایش اطلاعات اولیه برای دیباگ  
    console.log('تحلیل کیفیت GPS با', locationHistory.length, 'نقطه در تاریخچه');  
    
    // بررسی آخرین نقطه با نقطه قبلی  
    let jumpDetected = false;  
    let unrealisticSpeedDetected = false;  
    let lowAccuracyDetected = false;  
    let score = 0;  

    // بررسی دقت موقعیت فعلی  
    if (currentLocation.coords && currentLocation.coords.accuracy) {  
      if (currentLocation.coords.accuracy > LOW_ACCURACY_THRESHOLD) {  
        lowAccuracyDetected = true;  
        score += 20;  
        console.log(`دقت پایین: ${currentLocation.coords.accuracy.toFixed(2)} متر`);  
      }  
    }  

    // اگر بیش از یک نقطه در تاریخچه داریم، می‌توانیم سرعت و پرش را محاسبه کنیم  
    if (locationHistory.length > 0) {  
      const previous = locationHistory[locationHistory.length - 1];  
      
      if (previous && previous.coords && currentLocation && currentLocation.coords) {  
        // بررسی وجود مختصات معتبر  
        if (previous.coords.lat && previous.coords.lng &&   
            currentLocation.coords.lat && currentLocation.coords.lng) {  
          
          // محاسبه فاصله  
          const distance = calculateDistance(  
            previous.coords.lat, previous.coords.lng,  
            currentLocation.coords.lat, currentLocation.coords.lng  
          );  

          // محاسبه زمان (به ثانیه)  
          const timeDiff = (currentLocation.timestamp - previous.timestamp) / 1000;  
          
          // فقط اگر زمان معتبر است محاسبه کنیم  
          if (timeDiff > 0) {  
            // محاسبه سرعت (متر بر ثانیه)  
            const speed = distance / timeDiff;  
            
            console.log(`فاصله: ${distance.toFixed(2)}m, زمان: ${timeDiff.toFixed(2)}s, سرعت: ${speed.toFixed(2)}m/s`);  

            // بررسی پرش موقعیت  
            if (distance > POSITION_JUMP_THRESHOLD && timeDiff < 5) {  
              jumpDetected = true;  
              score += 30;  
              console.log('پرش موقعیت شناسایی شد');  
            }  

            // بررسی سرعت غیرعادی  
            if (speed > UNREALISTIC_SPEED_THRESHOLD) {  
              unrealisticSpeedDetected = true;  
              score += 30;  
              console.log('سرعت غیرمعقول شناسایی شد');  
            }  

            // محاسبه جهت برای تشخیص تغییر ناگهانی (اگر بیشتر از 2 نقطه داریم)  
            if (locationHistory.length > 1) {  
              const beforePrevious = locationHistory[locationHistory.length - 2];  
              if (beforePrevious && beforePrevious.coords &&   
                  beforePrevious.coords.lat && beforePrevious.coords.lng) {  
                
                const previousBearing = calculateBearing(  
                  beforePrevious.coords.lat, beforePrevious.coords.lng,  
                  previous.coords.lat, previous.coords.lng  
                );  
                
                const currentBearing = calculateBearing(  
                  previous.coords.lat, previous.coords.lng,  
                  currentLocation.coords.lat, currentLocation.coords.lng  
                );  
                
                if (isSharpTurn(previousBearing, currentBearing) && distance > 5) {  
                  score += 20;  
                  console.log('تغییر جهت ناگهانی شناسایی شد');  
                }  
              }  
            }  
          } else {  
            console.log('فاصله زمانی نامعتبر:', timeDiff);  
          }  
        } else {  
          console.log('مختصات ناقص در نقاط:', {   
            prevLat: previous.coords.lat,   
            prevLng: previous.coords.lng,  
            currLat: currentLocation.coords.lat,   
            currLng: currentLocation.coords.lng   
          });  
        }  
      } else {  
        console.log('ساختار داده نقاط ناقص است');  
      }  
    }  

    // محدود کردن امتیاز به حداکثر 100  
    score = Math.min(score, 100);  
    console.log('امتیاز نویز GPS:', score);  
    
    // به‌روزرسانی وضعیت‌ها  
    setIsPositionJumping(jumpDetected);  
    setIsSpeedUnrealistic(unrealisticSpeedDetected);  
    setIsAccuracyLow(lowAccuracyDetected);  
    
    // اگر امتیاز بالای 50 باشد، احتمالاً جمر است  
    setIsJamming(score > 50);  
    setAnomalyScore(score);  

  }, [locationHistory, currentLocation]);  

  return {  
    isJamming,  
    isAccuracyLow,  
    isSpeedUnrealistic,  
    isPositionJumping,  
    anomalyScore,  
    noiseLevel: anomalyScore < 20 ? 'کم' : anomalyScore < 50 ? 'متوسط' : 'زیاد'  
  };  
};  