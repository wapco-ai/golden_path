// src/components/DeadReckoning/DeadReckoning.jsx  

import React, { useEffect, useState } from 'react';  
import useIMUSensors from '../../hooks/useIMUSensors';  
import deadReckoningService from '../../services/DeadReckoningService';  
import './DeadReckoning.css';  

const DeadReckoning = ({ onPathUpdate, referencePosition }) => {  
  const [isActive, setIsActive] = useState(false);  
  const [isCalibrating, setIsCalibrating] = useState(false);  
  const [stepCount, setStepCount] = useState(0);  
  const [strideLength, setStrideLength] = useState(0.75);  
  const { accelerometer, gyroscope, isSupported, requestPermission } = useIMUSensors();  

  // اتصال به سرویس dead reckoning  
  useEffect(() => {  
    const removeListener = deadReckoningService.addListener((data) => {  
      setIsActive(data.isActive);  
      setIsCalibrating(data.isCalibrating);  
      setStepCount(data.stepCount);  
      
      // اطلاع‌رسانی به کامپوننت والد (مثلاً نقشه)  
      if (onPathUpdate) {  
        onPathUpdate(data.path, data.position);  
      }  
    });  
    
    return () => removeListener();  
  }, [onPathUpdate]);  

  // پردازش داده‌های IMU  
  useEffect(() => {  
    if (isActive && !isCalibrating) {  
      deadReckoningService.processImuData(accelerometer, gyroscope, Date.now());  
    }  
  }, [accelerometer, gyroscope, isActive, isCalibrating]);  

  // فعال/غیرفعال کردن dead reckoning  
  const handleToggle = async () => {  
    if (!isActive) {  
      // درخواست دسترسی به سنسورها (برای iOS)  
      const permissionGranted = await requestPermission();  
      if (!permissionGranted) {  
        alert('برای استفاده از این قابلیت، باید به سنسورها دسترسی بدهید.');  
        return;  
      }  
      
      // شروع dead reckoning  
      deadReckoningService.toggleActive(referencePosition ? { x: 0, y: 0 } : null);  
    } else {  
      // توقف dead reckoning  
      deadReckoningService.toggleActive();  
    }  
  };  

  // بازنشانی مسیر  
  const handleReset = () => {  
    deadReckoningService.reset(referencePosition ? { x: 0, y: 0 } : null);  
  };  

  // تغییر طول گام  
  const handleStrideLengthChange = (e) => {  
    const newValue = parseFloat(e.target.value);  
    setStrideLength(newValue);  
    deadReckoningService.setStrideLength(newValue);  
  };  

  // خروجی گرفتن از لاگ  
  const handleExportLog = () => {  
    deadReckoningService.exportLog(referencePosition);  
  };  

  return (  
    <div className="dead-reckoning-panel">  
      <h3>Dead Reckoning</h3>  
      
      {!isSupported && (  
        <div className="error-message">  
          سنسورهای IMU در این دستگاه پشتیبانی نمی‌شوند.  
        </div>  
      )}  
      
      <div className="controls">  
        <button   
          onClick={handleToggle}   
          disabled={!isSupported}  
          className={isActive ? 'active' : ''}  
        >  
          {isActive ? 'توقف ردیابی' : 'شروع ردیابی'}  
        </button>  
        
        <button   
          onClick={handleReset}   
          disabled={!isActive}  
        >  
          بازنشانی مسیر  
        </button>  
        
        <button   
          onClick={handleExportLog}   
          disabled={!stepCount}  
        >  
          خروجی لاگ  
        </button>  
      </div>  
      
      <div className="status">  
        {isCalibrating && <div className="calibrating">در حال کالیبراسیون...</div>}  
        <div>تعداد گام‌ها: {stepCount}</div>  
      </div>  
      
      <div className="settings">  
        <label>  
          طول گام (متر):  
          <input   
            type="range"   
            min="0.3"   
            max="1.2"   
            step="0.05"   
            value={strideLength}   
            onChange={handleStrideLengthChange}   
          />  
          <span>{strideLength}</span>  
        </label>  
      </div>  
    </div>  
  );  
};  

export default DeadReckoning;  