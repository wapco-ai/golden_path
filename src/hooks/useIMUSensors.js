// src/hooks/useIMUSensors.js  

import { useState, useEffect } from 'react';  

const useIMUSensors = () => {  
  const [accelerometer, setAccelerometer] = useState({ x: 0, y: 0, z: 0 });  
  const [gyroscope, setGyroscope] = useState({ x: 0, y: 0, z: 0 });  
  const [isSupported, setIsSupported] = useState(false);  

  useEffect(() => {  
    if (window.DeviceMotionEvent) {  
      setIsSupported(true);  

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
          // تبدیل به رادیان بر ثانیه (اگر در درجه باشد)  
          setGyroscope({  
            x: (rot.beta || 0) * Math.PI / 180,  
            y: (rot.gamma || 0) * Math.PI / 180,  
            z: (rot.alpha || 0) * Math.PI / 180  
          });  
        }  
      };  

      window.addEventListener('devicemotion', handleMotion);  
      return () => {  
        window.removeEventListener('devicemotion', handleMotion);  
      };  
    }  
  }, []);  

  // تابع درخواست دسترسی (برای iOS)  
  const requestPermission = async () => {  
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {  
      try {  
        const permissionState = await DeviceMotionEvent.requestPermission();  
        return permissionState === 'granted';  
      } catch (error) {  
        console.error('Error requesting motion permission:', error);  
        return false;  
      }  
    }  
    return true; // اگر نیاز به درخواست دسترسی نباشد  
  };  

  return {  
    accelerometer,  
    gyroscope,  
    isSupported,  
    requestPermission  
  };  
};  

export default useIMUSensors;  