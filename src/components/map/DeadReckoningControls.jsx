import React, { useState, useEffect } from 'react';  
import deadReckoningService from '../../services/DeadReckoningService';  
import useIMUSensors from '../../hooks/useIMUSensors';  
import './DeadReckoningControls.css';  

const DeadReckoningControls = ({ currentLocation }) => {  
  const [isActive, setIsActive] = useState(false);  
  const [isCalibrating, setIsCalibrating] = useState(false);  
  const [stepCount, setStepCount] = useState(0);  
  const [strideLength, setStrideLength] = useState(0.75);  
  const [filteredHeading, setFilteredHeading] = useState(0); // جهت فیلتر شده  
  
  const {   
    acceleration,   
    rotationRate,   
    orientation,   
    isSupported,   
    hasPermission,  
    requestPermission,  
    checkPermissions  
  } = useIMUSensors();  

  useEffect(() => {  
    const removeListener = deadReckoningService.addListener((data) => {  
      setIsActive(data.isActive);  
      setIsCalibrating(data.isCalibrating);  
      setStepCount(data.stepCount);  
      // به‌روزرسانی جهت فیلتر شده  
      setFilteredHeading(data.filteredHeading || 0);   
    });  
    
    return () => removeListener();  
  }, []);  

  // پردازش داده‌های IMU هر زمان که isActive و داده‌های سنسور تغییر کنند  
  useEffect(() => {  
    if (isActive && hasPermission) {  
      const timestamp = Date.now();  
      deadReckoningService.processImuData(  
        acceleration,   
        rotationRate,   
        orientation,   
        timestamp  
      );  
    }  
  }, [isActive, hasPermission, acceleration, rotationRate, orientation]);  

  const handleToggle = async () => {  
    if (!isActive) {  
      if (!isSupported) {  
        alert('سنسورهای IMU در این دستگاه پشتیبانی نمی‌شوند.');  
        return;  
      }  
      
      // بررسی و درخواست مجوز  
      if (!checkPermissions()) {  
        const permissionGranted = await requestPermission();  
        if (!permissionGranted) {  
          alert('برای استفاده از Dead Reckoning، دسترسی به سنسورها را فعال کنید.');  
          return;  
        }  
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
        <h3>Dead Reckoning</h3>  
      </div>  
      
      {isCalibrating && (  
        <div className="calibrating-status">درحال کالیبراسیون...</div>  
      )}  
      
      <div className="dr-button-group">  
        <button   
          className={`dr-button dr-button-start ${isActive ? 'active' : ''}`}   
          onClick={handleToggle}  
          disabled={!isSupported || (!isActive && !hasPermission && typeof DeviceMotionEvent.requestPermission === 'function')}  
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
        <div className="dr-stride-value">{strideLength.toFixed(2)}</div>  
      </div>  
       {/* نمایش جهت فیلتر شده برای دیباگ */}  
       <div style={{ fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>  
          جهت (درجه): {(filteredHeading * 180 / Math.PI).toFixed(2)}  
       </div>  
    </div>  
  );  
};  

export default DeadReckoningControls;  