import { useState, useEffect } from 'react';  
import advancedDeadReckoningService from '../services/AdvancedDeadReckoningService';  

/**  
 * Hook برای کار با سنسورهای IMU  
 */  
const useIMUSensors = () => {  
  const [isSupported, setIsSupported]   = useState(false);  
  const [hasPermission, setHasPermission] = useState(false);  

  const [acceleration, setAcceleration]   = useState(null);  
  const [rotationRate, setRotationRate]   = useState(null);  
  const [orientation,  setOrientation]    = useState(null);  

  /* ───────────── بررسی پشتیبانی ───────────── */  
  useEffect(() => {  
    const hasMotion      = window.DeviceMotionEvent      !== undefined;  
    const hasOrientation = window.DeviceOrientationEvent !== undefined;  
    const supported      = hasMotion && hasOrientation;  
    setIsSupported(supported);  

    // در مرورگرهایی که متد requestPermission ندارند مجوز را پیشاپیش صادر کنیم  
    if (  
      supported &&  
      typeof DeviceMotionEvent.requestPermission      !== 'function' &&  
      typeof DeviceOrientationEvent.requestPermission !== 'function'  
    ) {  
      setHasPermission(true);  
    }  
  }, []);  

  /* ───────────── در اولین فرصت مجوز را بگیریم ───────────── */  
  useEffect(() => {  
    if (isSupported && !hasPermission) {  
      requestPermission();               // ❶ مجوزِ iOS به‌محض mount  
    }  
  }, [isSupported, hasPermission]);  

  /* ───────────── Listener های سنسورها ───────────── */  
  useEffect(() => {  
    if (!isSupported || !hasPermission) return;  

    const handleMotion = (e) => {  
      const ts = e.timeStamp || Date.now();  

      /* شتاب‌سنج */  
      const hasPureAcc = e.acceleration && e.acceleration.x !== null;  
      const rawAcc     = hasPureAcc ? e.acceleration : e.accelerationIncludingGravity;  
      if (rawAcc) {  
        const accel = {  
          x: rawAcc.x || 0,  
          y: rawAcc.y || 0,  
          z: rawAcc.z || 0,  
          includesGravity: !hasPureAcc,  
          timestamp: ts  
        };  
        setAcceleration(accel);  

        if (advancedDeadReckoningService.isActive) {  
          advancedDeadReckoningService.processAccelerometerData(accel, ts);  
        }  
      }  

      /* ژیروسکوپ */  
      if (e.rotationRate && e.rotationRate.alpha !== null) {  
        const gyro = {  
          alpha:   e.rotationRate.alpha  || 0,  
          beta:    e.rotationRate.beta   || 0,  
          gamma:   e.rotationRate.gamma  || 0,  
          timestamp: ts  
        };  
        setRotationRate(gyro);  

        if (advancedDeadReckoningService.isActive) {  
          advancedDeadReckoningService.processGyroscopeData(gyro, ts);  
        }  
      }  
    };  

    const handleOrientation = (e) => {  
      if (e.alpha === null) return;  
      const orient = {  
        alpha:     e.alpha  || 0,  
        beta:      e.beta   || 0,  
        gamma:     e.gamma  || 0,  
        absolute:  e.absolute || false,  
        timestamp: e.timeStamp || Date.now()  
      };  
      setOrientation(orient);  

      if (advancedDeadReckoningService.isActive) {  
        advancedDeadReckoningService.processOrientationData(orient, orient.timestamp);  
      }  
    };  

    /* اضافه کردن Listener ها */  
    const options = { frequency: 60 };  
    window.addEventListener('devicemotion',      handleMotion,      options);  
    window.addEventListener('deviceorientation', handleOrientation, options);  
    console.log('[IMU] listeners attached');  

    return () => {  
      window.removeEventListener('devicemotion',      handleMotion);  
      window.removeEventListener('deviceorientation', handleOrientation);  
    };  
  }, [isSupported, hasPermission]);           // ❷ دیگر نیازی به isActive در deps نیست  

  /* ───────────── متدهای مجوز ───────────── */  
  const requestPermission = async () => {  
    if (!isSupported) return false;  

    try {  
      if (typeof DeviceMotionEvent.requestPermission === 'function') {  
        const m = await DeviceMotionEvent.requestPermission();  
        const o = await DeviceOrientationEvent.requestPermission();  
        const granted = m === 'granted' && o === 'granted';  
        setHasPermission(granted);  
        return granted;  
      }  
      // مرورگرهای دسکتاپ  
      setHasPermission(true);  
      return true;  
    } catch (err) {  
      console.error('[IMU] permission error:', err);  
      return false;  
    }  
  };  

  const checkPermissions = () => hasPermission;  

  return {  
    acceleration,  
    rotationRate,  
    orientation,  
    isSupported,  
    hasPermission,  
    requestPermission,  
    checkPermissions  
  };  
};  

export default useIMUSensors;  