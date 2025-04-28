// src/hooks/useIMUSensors.js (نسخه کامل)  

import { useState, useEffect } from 'react';  

const useIMUSensors = () => {  
  // داده‌های خام سنسور  
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 }); // شتاب (بدون گرانش)  
  const [accelerationIncludingGravity, setAccelerationIncludingGravity] = useState({ x: 0, y: 0, z: 0 }); // شتاب با گرانش  
  const [rotationRate, setRotationRate] = useState({ x: 0, y: 0, z: 0 }); // سرعت چرخش (رادیان بر ثانیه)  
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 }); // زوایای اویلر (درجه)  
  const [magneticField, setMagneticField] = useState({ x: 0, y: 0, z: 0 }); // میدان مغناطیسی (اختیاری، اگر مرورگر پشتیبانی کند)  
  
  // وضعیت سنسورها و مجوزها  
  const [isSupported, setIsSupported] = useState(false);  
  const [hasPermission, setHasPermission] = useState(false);  

  useEffect(() => {  
    let deviceOrientationSupported = false;  
    let deviceMotionSupported = false;  

    if (window.DeviceMotionEvent) {  
      deviceMotionSupported = true;  
    }  
    
    // DeviceOrientationAbsoluteEvent برای جهت مطلق  
    if (window.DeviceOrientationEvent || window.DeviceOrientationAbsoluteEvent) {  
      deviceOrientationSupported = true;  
    }  

    setIsSupported(deviceMotionSupported && deviceOrientationSupported);  

    const handleMotion = (event) => {  
      if (event.accelerationIncludingGravity) {  
        setAccelerationIncludingGravity({  
          x: event.accelerationIncludingGravity.x || 0,  
          y: event.accelerationIncludingGravity.y || 0,  
          z: event.accelerationIncludingGravity.z || 0  
        });  
      }  
      
      if (event.acceleration) {  
        setAcceleration({  
          x: event.acceleration.x || 0,  
          y: event.acceleration.y || 0,  
          z: event.acceleration.z || 0  
        });  
      }  

      if (event.rotationRate) {  
        setRotationRate({  
          x: (event.rotationRate.beta || 0) * Math.PI / 180, // Pitch rate  
          y: (event.rotationRate.gamma || 0) * Math.PI / 180, // Roll rate  
          z: (event.rotationRate.alpha || 0) * Math.PI / 180 // Yaw rate  
        });  
      }  
    };  

    const handleOrientation = (event) => {  
      // تلاش برای استفاده از جهت مطلق در صورت وجود  
      if (event.absolute || event.webkitCompassHeading !== undefined) {  
         setOrientation({  
            alpha: event.alpha || 0, // Yaw in degrees (0-360)  
            beta: event.beta || 0,   // Pitch in degrees (-180 to 180)  
            gamma: event.gamma || 0  // Roll in degrees (-90 to 90)  
         });  
         
         // استفاده از webkitCompassHeading اگر در دسترس باشد (معمولاً در iOS)  
         if (event.webkitCompassHeading !== undefined) {  
             setOrientation(prev => ({ ...prev, alpha: event.webkitCompassHeading }));  
         }  
         
         // دسترسی به داده‌های خام مگنتومتر در رویداد DeviceOrientationEvent استاندارد نیست.  
         // در اینجا فرض می‌کنیم که برای پیاده‌سازی‌های پیچیده‌تر نیاز به این داده‌ها داریم   
         // و ممکن است نیاز به APIهای native داشته باشیم.  
         // setMagneticField({ x: ..., y: ..., z: ... });   
      } else {  
          // جهت نسبی  
           setOrientation({  
            alpha: event.alpha || 0, // Yaw in degrees (0-360)  
            beta: event.beta || 0,   // Pitch in degrees (-180 to 180)  
            gamma: event.gamma || 0  // Roll in degrees (-90 to 90)  
         });  
      }  
    };  
    
    // تلاش برای استفاده از DeviceOrientationAbsoluteEvent اگر پشتیبانی شود  
    if (deviceOrientationSupported) {  
       if (window.DeviceOrientationAbsoluteEvent) {  
         window.addEventListener('deviceorientationabsolute', handleOrientation);  
       } else {  
         window.addEventListener('deviceorientation', handleOrientation);  
       }  
    }  

    if (deviceMotionSupported) {  
      window.addEventListener('devicemotion', handleMotion);  
    }  

    return () => {  
      if (deviceMotionSupported) {  
        window.removeEventListener('devicemotion', handleMotion);  
      }  
       if (deviceOrientationSupported) {  
         if (window.DeviceOrientationAbsoluteEvent) {  
            window.removeEventListener('deviceorientationabsolute', handleOrientation);  
          } else {  
            window.removeEventListener('deviceorientation', handleOrientation);  
          }  
       }  
    };  
  }, [hasPermission]);  

  const requestPermission = async () => {  
    let granted = true;  
    
    if (typeof DeviceMotionEvent.requestPermission === 'function') {  
      try {  
        const motionState = await DeviceMotionEvent.requestPermission();  
        if (motionState === 'granted') {  
          setHasPermission(true);  
        } else {  
          granted = false;  
        }  
      } catch (error) {  
        console.error('Error requesting motion permission:', error);  
        granted = false;  
      }  
    }  
    
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {  
      try {  
        const orientationState = await DeviceOrientationEvent.requestPermission();  
        if (orientationState === 'granted') {  
          setHasPermission(true);  
        } else {  
          granted = false;  
        }  
      } catch (error) {  
        console.error('Error requesting orientation permission:', error);  
        granted = false;  
      }  
    } else {  
       // اگر نیازی به درخواست مجوز نیست، فرض کنید مجوز داده شده است  
       setHasPermission(true);  
    }  
    
    return granted;  
  };  

  const checkPermissions = () => {  
     if (typeof DeviceMotionEvent.requestPermission !== 'function' &&   
         typeof DeviceOrientationEvent.requestPermission !== 'function') {  
       setHasPermission(true);  
       return true;  
     }  
     return hasPermission;  
  };  

  return {  
    acceleration, // شتاب بدون گرانش (برای تشخیص گام)  
    accelerationIncludingGravity, // شتاب با گرانش (برای تخمین جهت با مگنتومتر - در پیاده‌سازی پیشرفته‌تر)  
    rotationRate, // سرعت چرخش (برای به‌روزرسانی جهت در EKF)  
    orientation, // زوایای اویلر (برای اندازه‌گیری جهت در EKF)  
    magneticField, // میدان مغناطیسی (اختیاری)  
    isSupported,  
    hasPermission,  
    requestPermission,  
    checkPermissions  
  };  
};  

export default useIMUSensors;  