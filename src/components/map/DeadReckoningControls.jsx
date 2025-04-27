// src/components/DeadReckoningControls/DeadReckoningControls.jsx  
import React, { useState, useEffect } from 'react';  
import deadReckoningService from '../../services/DeadReckoningService';  
import useIMUSensors from '../../hooks/useIMUSensors';  
import './DeadReckoningControls.css';   

const DeadReckoningControls = ({ currentLocation }) => {  
  const [isActive, setIsActive] = useState(false);  
  const [isCalibrating, setIsCalibrating] = useState(false);  
  const [stepCount, setStepCount] = useState(0);  
  const [strideLength, setStrideLength] = useState(0.75);  
  const { accelerometer, gyroscope, isSupported, requestPermission } = useIMUSensors();  

  useEffect(() => {  
    const removeListener = deadReckoningService.addListener((data) => {  
      setIsActive(data.isActive);  
      setIsCalibrating(data.isCalibrating);  
      setStepCount(data.stepCount);  
    });  
    
    return () => removeListener();  
  }, []);  

  useEffect(() => {  
    if (isActive) {  
      const timestamp = Date.now();  
      deadReckoningService.processImuData(accelerometer, gyroscope, timestamp);  
    }  
  }, [accelerometer, gyroscope, isActive]);  

  const handleToggle = async () => {  
    if (!isActive) {  
      if (!isSupported) {  
        alert('سنسورهای IMU در این دستگاه پشتیبانی نمی‌شوند.');  
        return;  
      }  
      
      const permissionGranted = await requestPermission();  
      if (!permissionGranted) {  
        alert('برای استفاده از Dead Reckoning، دسترسی به سنسورها را فعال کنید.');  
        return;  
      }  
      
      const initialLatLng = currentLocation?.coords ? {  
        lat: currentLocation.coords.lat,  
        lng: currentLocation.coords.lng  
      } : null;  
      
      deadReckoningService.toggle(initialLatLng);  
    } else {  
      deadReckoningService.toggle();  
    }  
  };  

  const handleReset = () => {  
    deadReckoningService.reset();  
  };  

  const handleStrideLengthChange = (e) => {  
    const newValue = parseFloat(e.target.value);  
    setStrideLength(newValue);  
    deadReckoningService.setStrideLength(newValue);  
  };  

  const handleExport = () => {  
    deadReckoningService.exportLog();  
  };  

  return (  
    <div className="dead-reckoning-controls">  
      <div className="dr-header">  
        <h3>Dead Reckoning</h3>  
        {isCalibrating && <span className="calibrating-badge">درحال کالیبراسیون...</span>}  
      </div>  
      
      <div className="dr-controls">  
        <button   
          className={`dr-button ${isActive ? 'active' : ''}`}   
          onClick={handleToggle}  
          disabled={!currentLocation}  
        >  
          {isActive ? 'توقف ردیابی' : 'شروع ردیابی'}  
        </button>  
        
        <button   
          className="dr-button"   
          onClick={handleReset}  
          disabled={!isActive}  
        >  
          بازنشانی مسیر  
        </button>  
        
        <button   
          className="dr-button"   
          onClick={handleExport}  
          disabled={stepCount === 0}  
        >  
          خروجی لاگ  
        </button>  
      </div>  
      
      <div className="dr-info">  
        <div className="step-count">تعداد گام‌ها: {stepCount}</div>  
        
        <div className="stride-setting">  
          <label>طول گام (متر):</label>  
          <input   
            type="range"   
            min="0.3"   
            max="1.2"   
            step="0.05"   
            value={strideLength}   
            onChange={handleStrideLengthChange}   
            disabled={!isActive}  
          />  
          <span className="stride-value">{strideLength}</span>  
        </div>  
      </div>  
    </div>  
  );  
};  

export default DeadReckoningControls;  