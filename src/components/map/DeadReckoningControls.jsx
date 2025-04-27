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

  const handleExport = () => {  
    deadReckoningService.exportLog();  
  };  

  const handleStrideLengthChange = (e) => {  
    const newValue = parseFloat(e.target.value);  
    setStrideLength(newValue);  
    deadReckoningService.setStrideLength(newValue);  
  };  

  return (  
    <div className="dead-reckoning-panel">  
      <div className="dr-header">  
        <h3>ردیابی آفلاین</h3>  
      </div>  
      
      {isCalibrating && (  
        <div className="calibrating-status">درحال کالیبراسیون...</div>  
      )}  
      
      <div className="dr-button-group">  
        <button   
          className={`dr-button dr-button-start ${isActive ? 'active' : ''}`}   
          onClick={handleToggle}  
          disabled={!currentLocation}  
        >  
          {isActive ? 'توقف ردیابی' : 'شروع ردیابی'}  
        </button>  
        
        <button   
          className="dr-button dr-button-reset"   
          onClick={handleReset}  
          disabled={!isActive}  
        >  
          بازنشانی مسیر  
        </button>  
        
        <button   
          className="dr-button dr-button-export"   
          onClick={handleExport}  
          disabled={stepCount === 0}  
        >  
          خروجی لاگ  
        </button>  
      </div>  
      
      <div className="dr-step-count">  
        تعداد گام‌ها: {stepCount}  
      </div>  
      
      <div className="dr-stride-control">  
        <label className="dr-stride-label">  
          طول گام (متر):  
        </label>  
        <input   
          type="range"   
          min="0.3"   
          max="1.2"   
          step="0.05"   
          value={strideLength}   
          onChange={handleStrideLengthChange}   
          className="dr-stride-slider"  
          disabled={!isActive}  
        />  
        <div className="dr-stride-value">{strideLength}</div>  
      </div>  
    </div>  
  );  
};  

export default DeadReckoningControls;  