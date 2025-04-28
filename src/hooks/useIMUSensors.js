import { useState, useEffect } from 'react';  

const useIMUSensors = () => {  
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 }); // شتاب (بدون گرانش)  
  const [accelerationIncludingGravity, setAccelerationIncludingGravity] = useState({ x: 0, y: 0, z: 0 }); // شتاب با گرانش  
  const [rotationRate, setRotationRate] = useState({ x: 0, y: 0, z: 0 }); // سرعت چرخش  
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 }); // زوایای اویلر  
  const [magneticField, setMagneticField] = useState({ x: 0, y: 0, z: 0 }); // میدان مغناطیسی  
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
          x: (event.rotationRate.beta || 0) * Math.PI / 180, // Pitch rate in radians/sec  
          y: (event.rotationRate.gamma || 0) * Math.PI / 180, // Roll rate in radians/sec  
          z: (event.rotationRate.alpha || 0) * Math.PI / 180 // Yaw rate in radians/sec  
        });  
      }  
    };  

    const handleOrientation = (event) => {  
      // استفاده از جهت مطلق در صورت وجود  
      if (event.absolute || event.webkitCompassHeading) {  
         setOrientation({  
            alpha: event.alpha || 0, // Yaw in degrees (0-360)  
            beta: event.beta || 0,   // Pitch in degrees (-180 to 180)  
            gamma: event.gamma || 0  // Roll in degrees (-90 to 90)  
         });  
         
         // Note: Getting raw magnetic field data directly from DeviceOrientationEvent is not standard.  
         // We might need to infer it or use a separate sensor API if available.  
         // For simplicity here, we'll rely on the heading provided by DeviceOrientationEvent.  
      } else {  
          // جهت نسبی  
           setOrientation({  
            alpha: event.alpha || 0, // Yaw in degrees (0-360)  
            beta: event.beta || 0,   // Pitch in degrees (-180 to 180)  
            gamma: event.gamma || 0  // Roll in degrees (-90 to 90)  
         });  
      }  
      
      // اگر webkitCompassHeading وجود دارد، از آن برای جهت دقیق استفاده کنید  
      if (event.webkitCompassHeading !== undefined) {  
          setOrientation(prev => ({ ...prev, alpha: event.webkitCompassHeading }));  
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
    acceleration,  
    accelerationIncludingGravity,  
    rotationRate,  
    orientation, // زوایای اویلر (heading, pitch, roll)  
    magneticField, // ممکن است در آینده پیاده‌سازی شود  
    isSupported,  
    hasPermission,  
    requestPermission,  
    checkPermissions  
  };  
};  

export default useIMUSensors;  