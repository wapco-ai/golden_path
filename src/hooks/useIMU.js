import { useState, useEffect, useRef } from 'react';  

const useIMU = (options = {}) => {  
  const {   
    calibrationSteps = 50,  
    stepThreshold = 1.1  
  } = options;  
  
  const [isCalibrating, setIsCalibrating] = useState(true);  
  const [stepCount, setStepCount] = useState(0);  
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });  
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });  
  
  const calibrationData = useRef([]);  
  const lastAcceleration = useRef(null);  
  const peakDetected = useRef(false);  
  
  // مدیریت داده‌های شتاب‌سنج  
  const handleAcceleration = (event) => {  
    const { x, y, z } = event.accelerationIncludingGravity || event.acceleration || { x: 0, y: 0, z: 0 };  
    
    // محاسبه بزرگی شتاب  
    const magnitude = Math.sqrt(x * x + y * y + z * z);  
    
    setAcceleration({ x, y, z, magnitude });  
    
    // کالیبراسیون  
    if (isCalibrating) {  
      calibrationData.current.push(magnitude);  
      
      if (calibrationData.current.length >= calibrationSteps) {  
        finishCalibration();  
      }  
      return;  
    }  
    
    // شناسایی قدم بر اساس تغییرات شتاب  
    detectStep(magnitude);  
  };  
  
  // تشخیص قدم  
  const detectStep = (magnitude) => {  
    if (!lastAcceleration.current) {  
      lastAcceleration.current = magnitude;  
      return;  
    }  
    
    const threshold = lastAcceleration.current.threshold || stepThreshold;  
    
    // الگوریتم ساده تشخیص قدم - بهبود این الگوریتم برای دقت بیشتر ضروری است  
    if (!peakDetected.current && magnitude > threshold) {  
      peakDetected.current = true;  
    } else if (peakDetected.current && magnitude < threshold) {  
      peakDetected.current = false;  
      setStepCount(prev => prev + 1);  
    }  
    
    lastAcceleration.current = magnitude;  
  };  
  
  // اتمام مرحله کالیبراسیون  
  const finishCalibration = () => {  
    // محاسبه آستانه تشخیص قدم بر اساس داده‌های کالیبراسیون  
    const sum = calibrationData.current.reduce((acc, val) => acc + val, 0);  
    const avg = sum / calibrationData.current.length;  
    
    // آستانه دینامیک برای تشخیص قدم  
    const threshold = avg * 1.2; // ضریب 1.2 می‌تواند تنظیم شود  
    
    lastAcceleration.current = { magnitude: avg, threshold };  
    setIsCalibrating(false);  
  };  
  
  // مدیریت داده‌های جهت‌سنج  
  const handleOrientation = (event) => {  
    const { alpha, beta, gamma } = event;  
    setOrientation({ alpha, beta, gamma });  
  };  
  
  // ریست  
  const reset = () => {  
    setStepCount(0);  
    setIsCalibrating(true);  
    calibrationData.current = [];  
    lastAcceleration.current = null;  
    peakDetected.current = false;  
  };  
  
  useEffect(() => {  
    // دسترسی به سنسور شتاب‌سنج  
    if (window.DeviceMotionEvent) {  
      window.addEventListener('devicemotion', handleAcceleration);  
    }  
    
    // دسترسی به سنسور جهت‌سنج  
    if (window.DeviceOrientationEvent) {  
      window.addEventListener('deviceorientation', handleOrientation);  
    }  
    
    return () => {  
      if (window.DeviceMotionEvent) {  
        window.removeEventListener('devicemotion', handleAcceleration);  
      }  
      
      if (window.DeviceOrientationEvent) {  
        window.removeEventListener('deviceorientation', handleOrientation);  
      }  
    };  
  }, [isCalibrating]);  
  
  return {  
    isCalibrating,  
    stepCount,  
    orientation,  
    acceleration,  
    reset  
  };  
};  

export default useIMU;  