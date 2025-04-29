import React, { useState, useEffect } from 'react';  
import advancedDeadReckoningService from '../../services/AdvancedDeadReckoningService';  
import useIMUSensors from '../../hooks/useIMUSensors';  
import './DeadReckoningControls.css';  

const DeadReckoningControls = ({ currentLocation }) => {  
  const [isActive, setIsActive] = useState(false);  
  const [isCalibrating, setIsCalibrating] = useState(false);  
  const [stepCount, setStepCount] = useState(0);  
  const [strideLength, setStrideLength] = useState(0.75);  
  const [kalmanState, setKalmanState] = useState(null);   
  const [stepCountErrorShown, setStepCountErrorShown] = useState(false);  

  const {   
    acceleration,   
    rotationRate,   
    orientation,   
    isSupported,   
    hasPermission,  
    requestPermission,  
    checkPermissions  
  } = useIMUSensors();  

  // اضافه کردن listener به سرویس جدید  
  useEffect(() => {  
    const removeListener = advancedDeadReckoningService.addListener((data) => {  
      setIsActive(data.isActive);  
      setIsCalibrating(data.isCalibrating);  
      setStepCount(data.stepCount);  
      setKalmanState(data.kalmanState);  
      
      // اگر در حالت فعال سرویس و کالیبراسیون نیستیم ولی گام نرفته، alert بده  
      if(data.isActive && !data.isCalibrating && data.stepCount === 0 && !stepCountErrorShown){  
        alert('توجه: گام برداری ثبت نمی‌شود. مطمئن شوید دستگاه حرکت دارد و سنسورها فعال هستند.');  
        setStepCountErrorShown(true);  
      }  

      // اگر گام ثبت شده، خطا را غیرفعال کن  
      if(data.stepCount > 0){  
        setStepCountErrorShown(false);  
      }  
    });  
    
    return () => removeListener();  
  }, [stepCountErrorShown]);  

  // ارسال داده‌های سنسور به سرویس  
  useEffect(() => {  
    if (isActive && hasPermission) {  
      const timestamp = Date.now();  
      if (acceleration) advancedDeadReckoningService.processAccelerometerData(acceleration, timestamp);  
      if (rotationRate) advancedDeadReckoningService.processGyroscopeData(rotationRate, timestamp);  
      if (orientation) advancedDeadReckoningService.processOrientationData(orientation, timestamp);  
    }  
  }, [isActive, hasPermission, acceleration, rotationRate, orientation]);  

  // ارسال داده‌های GPS به سرویس  
  useEffect(() => {  
    if (isActive && currentLocation?.coords) {  
      advancedDeadReckoningService.processGpsData(  
        { lat: currentLocation.coords.lat, lng: currentLocation.coords.lng },  
        currentLocation.coords.accuracy,  
        Date.now()  
      );  
    }  
  }, [isActive, currentLocation]);  

  const handleToggle = async () => {  
    if (!isActive) {  
      if (!isSupported) {  
        alert('سنسورهای دستگاه پشتیبانی نمی‌شوند.');  
        return;  
      }  
      
      if (!checkPermissions()) {  
        const permissionGranted = await requestPermission();  
        if (!permissionGranted) {  
          alert('برای استفاده، دسترسی به سنسورها را فعال کنید.');  
          return;  
        }  
      }  
      
      const initialLatLng = currentLocation?.coords ? {  
        lat: currentLocation.coords.lat,  
        lng: currentLocation.coords.lng  
      } : null;  
      
      advancedDeadReckoningService.toggle(initialLatLng);  
    } else {  
      advancedDeadReckoningService.toggle();  
    }  
  };  

  const handleReset = () => {  
    advancedDeadReckoningService.reset();  
  };  

  const handleExport = () => {  
    advancedDeadReckoningService.exportLog();  
  };  

  const handleStrideLengthChange = (e) => {  
    const newValue = parseFloat(e.target.value);  
    setStrideLength(newValue);  
    advancedDeadReckoningService.setStrideLength(newValue);  
  };  

  return (  
    <div className="dead-reckoning-panel">  
      <div className="dr-header">  
        <h3>Advanced Dead Reckoning</h3>  
      </div>  
      
      {isCalibrating && (  
        <div className="calibrating-status">درحال کالیبراسیون سنسورها...</div>  
      )}  
      
      <div className="dr-button-group">  
        <button   
          className={`dr-button dr-button-start ${isActive ? 'active' : ''}`}   
          onClick={handleToggle}  
          disabled={!isSupported || (!isActive && !hasPermission && typeof DeviceMotionEvent.requestPermission === 'function')}  
        >  
          {isActive ? 'توقف ردیابی پیشرفته' : 'شروع ردیابی پیشرفته'}  
        </button>  
        
        <button   
          className="dr-button dr-button-reset"   
          onClick={handleReset}  
          disabled={!isActive}  
        >  
          بازنشانی سیستم  
        </button>  
        
        <button   
          className="dr-button dr-button-export"   
          onClick={handleExport}  
          disabled={stepCount === 0 && !kalmanState}  
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
       {/* نمایش وضعیت فیلتر کالمن برای دیباگ */}  
       {kalmanState && (  
           <div style={{ fontSize: '12px', marginTop: '10px' }}>  
               <p>موقعیت نسبی: ({kalmanState.x.toFixed(2)}, {kalmanState.y.toFixed(2)}) متر</p>  
               <p>جهت (درجه): {(kalmanState.theta * 180 / Math.PI).toFixed(2)}</p>  
               <p>سرعت خطی: {kalmanState.v.toFixed(2)} متر بر ثانیه</p>  
               <p>سرعت زاویه‌ای: {(kalmanState.w * 180 / Math.PI).toFixed(2)} درجه بر ثانیه</p>  
               <p>طول گام تخمینی: {kalmanState.stride.toFixed(2)} متر</p>  
           </div>  
       )}  
    </div>  
  );  
};  

export default DeadReckoningControls;  