import { useState, useEffect } from 'react';  

const useIMUSensors = () => {  
  const [accelerometer, setAccelerometer] = useState({ x: 0, y: 0, z: 0 });  
  const [gyroscope, setGyroscope] = useState({ x: 0, y: 0, z: 0 });  
  const [magnetometer, setMagnetometer] = useState({ x: 0, y: 0, z: 0 });  
  const [heading, setHeading] = useState(0); // جهت به درجه  
  const [isSupported, setIsSupported] = useState(false);  
  const [hasPermission, setHasPermission] = useState(false);  

  useEffect(() => {  
    let deviceOrientationSupported = false;  
    let deviceMotionSupported = false;  

    if (window.DeviceMotionEvent) {  
      deviceMotionSupported = true;  
    }  
    
    if (window.DeviceOrientationEvent || window.DeviceOrientationAbsoluteEvent) {  
      deviceOrientationSupported = true;  
    }  

    setIsSupported(deviceMotionSupported && deviceOrientationSupported);  

    // رویداد حرکت دستگاه برای شتاب‌سنج و ژیروسکوپ  
    const handleMotion = (event) => {  
      const acc = event.accelerationIncludingGravity || event.acceleration;  
      if (acc) {  
        setAccelerometer({  
          x: acc.x || 0,  
          y: acc.y || 0,  
          z: acc.z || 0  
        });  
      }  

      const rot = event.rotationRate;  
      if (rot) {  
        setGyroscope({  
          x: (rot.beta || 0) * Math.PI / 180,  
          y: (rot.gamma || 0) * Math.PI / 180,  
          z: (rot.alpha || 0) * Math.PI / 180  
        });  
      }  
    };  

    // تلاش برای استفاده از جهت مطلق (نسبت به شمال)  
    const handleAbsoluteOrientation = (event) => {  
      if (event.absolute || event.webkitCompassHeading) {  
        // iOS و برخی مرورگرها از webkitCompassHeading استفاده می‌کنند  
        // که به درجه است و 0 شمال است و در جهت ساعتگرد افزایش می‌یابد  
        let compassHeading;  
        
        if (event.webkitCompassHeading) {  
          compassHeading = event.webkitCompassHeading;  
        } else {  
          // در Android، alpha از 0 درجه (شمال) در جهت ساعتگرد افزایش می‌یابد  
          compassHeading = event.alpha;  
        }  
        
        setHeading(compassHeading);  
        
        // ذخیره داده‌های مگنتومتر  
        setMagnetometer({  
          x: Math.sin(event.gamma * Math.PI / 180) * Math.cos(event.beta * Math.PI / 180),  
          y: Math.sin(event.beta * Math.PI / 180),  
          z: Math.cos(event.gamma * Math.PI / 180) * Math.cos(event.beta * Math.PI / 180)  
        });  
      }  
    };  

    // ترتیب رویدادها مهم است - اول تلاش برای استفاده از مطلق  
    if (deviceOrientationSupported) {  
      if (window.DeviceOrientationAbsoluteEvent) {  
        window.addEventListener('deviceorientationabsolute', handleAbsoluteOrientation);  
      } else {  
        window.addEventListener('deviceorientation', handleAbsoluteOrientation);  
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
          window.removeEventListener('deviceorientationabsolute', handleAbsoluteOrientation);  
        } else {  
          window.removeEventListener('deviceorientation', handleAbsoluteOrientation);  
        }  
      }  
    };  
  }, [hasPermission]);  

  // درخواست دسترسی به سنسورها (برای iOS)  
  const requestPermission = async () => {  
    let granted = true;  
    
    // در iOS، باید دسترسی به سنسورها درخواست شود  
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
      // اگر نیازی به درخواست دسترسی نباشد، مستقیماً مجوز بدهید  
      setHasPermission(true);  
    }  
    
    return granted;  
  };  

  // افزودن تابع کمکی برای تشخیص دسترسی‌ها  
  const checkPermissions = () => {  
    // در مرورگرهای دسکتاپ، معمولاً نیازی به مجوز نیست  
    if (typeof DeviceMotionEvent.requestPermission !== 'function' &&   
        typeof DeviceOrientationEvent.requestPermission !== 'function') {  
      setHasPermission(true);  
      return true;  
    }  
    
    return hasPermission;  
  };  

  // تبدیل جهت از درجه به رادیان  
  const getHeadingInRadians = () => {  
    return heading * Math.PI / 180;  
  };  

  // تبدیل داده‌های سنسور به فرمت‌های مفید برای dead reckoning  
  const getNormalizedAcceleration = () => {  
    // محاسبه بزرگی شتاب (با احتساب شتاب جاذبه)  
    const magnitude = Math.sqrt(  
      accelerometer.x * accelerometer.x +   
      accelerometer.y * accelerometer.y +   
      accelerometer.z * accelerometer.z  
    );  
    
    // نرمال‌سازی بردار شتاب  
    if (magnitude > 0) {  
      return {  
        x: accelerometer.x / magnitude,  
        y: accelerometer.y / magnitude,  
        z: accelerometer.z / magnitude  
      };  
    }  
    
    return { x: 0, y: 0, z: 0 };  
  };  

  return {  
    accelerometer,  
    gyroscope,  
    magnetometer,  
    heading, // جهت به درجه  
    getHeadingInRadians, // تابع کمکی برای تبدیل به رادیان  
    getNormalizedAcceleration, // شتاب نرمال‌سازی شده  
    isSupported,  
    hasPermission,  
    requestPermission,  
    checkPermissions  
  };  
};  

export default useIMUSensors;  