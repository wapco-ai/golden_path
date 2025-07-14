import { useState, useEffect } from 'react';
import advancedDeadReckoningService from '../services/AdvancedDeadReckoningService';

const useIMUSensors = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [acceleration, setAcceleration] = useState(null);
  const [rotationRate, setRotationRate] = useState(null);
  const [orientation, setOrientation] = useState(null);



  // بررسی پشتیبانی سنسورها  
  useEffect(() => {
    const checkSupport = () => {
      const hasMotion = window.DeviceMotionEvent !== undefined;
      const hasOrientation = window.DeviceOrientationEvent !== undefined;
      const supported = hasMotion && hasOrientation;
      setIsSupported(supported);

      console.log('Device motion support:', hasMotion);
      console.log('Device orientation support:', hasOrientation);

      // در برخی مرورگرها مانند کروم دسکتاپ، نیازی به مجوز نیست  
      if (supported &&
        !(typeof DeviceMotionEvent.requestPermission === 'function') &&
        !(typeof DeviceOrientationEvent.requestPermission === 'function')) {
        setHasPermission(true);
      }

      return supported;
    };

    if (checkSupport()) {
      console.log("IMU sensors are supported by this device");
    } else {
      console.warn("IMU sensors are NOT supported by this device");
    }
  }, []);

  // افزودن لیستنرهای سنسور  
  useEffect(() => {
    if (!isSupported || !hasPermission) {
      return;
    }

    console.log("Setting up sensor listeners");

    // لیستنر شتاب‌سنج  
    const handleMotion = (event) => {
      if (!event) return;

      // تشخیص نوع داده شتاب‌سنج
      if (event.acceleration && event.acceleration.x !== null) {
        // استفاده از شتاب خالص (بدون جاذبه)
        const accel = {
          x: event.acceleration.x || 0,
          y: event.acceleration.y || 0,
          z: event.acceleration.z || 0,
          timestamp: event.timeStamp || Date.now(),
          includesGravity: false
        };
        // console.log('[useIMUSensors] Accelerometer Raw Data:', accel);  

        setAcceleration(accel);

        // ارسال داده به سرویس در صورت فعال بودن  
        if (advancedDeadReckoningService.isActive) {
          advancedDeadReckoningService.processAccelerometerData(accel, accel.timestamp);
        }
      } else if (event.accelerationIncludingGravity && event.accelerationIncludingGravity.x !== null) {
        // شتاب با جاذبه  
        const accel = {
          x: event.accelerationIncludingGravity.x || 0,
          y: event.accelerationIncludingGravity.y || 0,
          z: event.accelerationIncludingGravity.z || 0,
          timestamp: event.timeStamp || Date.now(),
          includesGravity: true
        };
        setAcceleration(accel);


        // ارسال داده به سرویس در صورت فعال بودن  
        if (advancedDeadReckoningService.isActive) {
          advancedDeadReckoningService.processAccelerometerData(accel, accel.timestamp);
        }
      }

      // داده‌های ژیروسکوپ  
      if (event.rotationRate && event.rotationRate.alpha !== null) {
        const gyro = {
          alpha: event.rotationRate.alpha || 0,
          beta: event.rotationRate.beta || 0,
          gamma: event.rotationRate.gamma || 0,
          timestamp: event.timeStamp || Date.now()
        };
        setRotationRate(gyro);

        // ارسال داده به سرویس در صورت فعال بودن  
        if (advancedDeadReckoningService.isActive) {
          advancedDeadReckoningService.processGyroscopeData(gyro, gyro.timestamp);
        }
      }
    };

    // لیستنر جهت‌یابی  
    const handleOrientation = (event) => {
      const { alpha, beta, gamma } = event;
      const timestamp = event.timeStamp || Date.now();
      advancedDeadReckoningService.ingestSensor({
        type: 'orientation',
        data: { alpha, beta, gamma },
        timestamp
      });
    };

    // تنظیم نرخ نمونه‌برداری (در صورت امکان)  
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      // در iOS جدید  
      window.addEventListener('devicemotion', handleMotion, { frequency: 60 });
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      // سایر دستگاه‌ها  
      window.addEventListener('devicemotion', handleMotion);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    console.log("Sensor listeners added");

    // حذف لیستنرها در هنگام unmount  
    return () => {
      console.log("Removing sensor listeners");
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isSupported, hasPermission, advancedDeadReckoningService.isActive]);

  // درخواست مجوز دسترسی به سنسورها (برای iOS 13+)  
  const requestPermission = async () => {
    if (!isSupported) {
      console.warn("Sensors not supported, cannot request permission");
      return false;
    }

    try {
      // برای iOS 13+  
      if (typeof DeviceMotionEvent.requestPermission === 'function' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {

        console.log('Requesting permissions for iOS...');

        const motionPermission = await DeviceMotionEvent.requestPermission();
        const orientationPermission = await DeviceOrientationEvent.requestPermission();

        const granted = motionPermission === 'granted' && orientationPermission === 'granted';
        setHasPermission(granted);
        console.log(`Permission ${granted ? 'granted' : 'denied'}`);
        return granted;
      } else {
        // برای سایر دستگاه‌ها، فرض می‌کنیم مجوز داریم  
        console.log('No permission request needed for this device');
        setHasPermission(true);
        return true;
      }
    } catch (error) {
      console.error('Error requesting sensor permissions:', error);
      return false;
    }
  };

  // بررسی وضعیت مجوزها  
  const checkPermissions = async () => {
    if (!isSupported) return false;

    // در iOS نیاز به درخواست صریح است  
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      return hasPermission;
    }

    // در سایر دستگاه‌ها، فرض می‌کنیم مجوز داریم  
    setHasPermission(true);
    return true;
  };

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