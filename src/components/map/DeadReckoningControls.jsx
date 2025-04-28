// src/components/map/DeadReckoningControls.jsx  
import React, { useState, useEffect } from 'react';
import advancedDeadReckoningService from '../../services/AdvancedDeadReckoningService';
import useIMUSensors from '../../hooks/useIMUSensors';
import './Map.css';

const DeadReckoningControls = ({ currentLocation }) => {
  const [isActive, setIsActive] = useState(advancedDeadReckoningService.isActive);
  const [isCalibrating, setIsCalibrating] = useState(advancedDeadReckoningService.isCalibrating);
  const [stepCount, setStepCount] = useState(advancedDeadReckoningService.stepCount);
  const [strideLength, setStrideLength] = useState(advancedDeadReckoningService.strideLength);
  const [kalmanState, setKalmanState] = useState(null);

  const {
    acceleration,
    rotationRate,
    orientation,
    isSupported,
    hasPermission,
    requestPermission,
    checkPermissions
  } = useIMUSensors();

  // اضافه کردن listener به سرویس Dead Reckoning  
  useEffect(() => {
    const removeListener = advancedDeadReckoningService.addListener((data) => {
      // console.log('DR Control Event:', data);  

      setIsActive(data.isActive);
      setIsCalibrating(data.isCalibrating);
      setStepCount(data.stepCount);

      if (data.kalmanState) {
        setKalmanState(data.kalmanState);
      }
    });

    return () => removeListener();
  }, []);

  // ارسال داده‌های سنسور به سرویس Dead Reckoning  
  useEffect(() => {
    // ارسال داده‌ها فقط وقتی ردیابی فعال است و مجوزها داده شده‌اند  
    if (isActive && hasPermission) {
      const timestamp = Date.now();

      if (acceleration) {
        advancedDeadReckoningService.processAccelerometerData(acceleration, timestamp);
      }

      if (rotationRate) {
        advancedDeadReckoningService.processGyroscopeData(rotationRate, timestamp);
      }

      if (orientation) {
        advancedDeadReckoningService.processOrientationData(orientation, timestamp);
      }
    }
  }, [isActive, hasPermission, acceleration, rotationRate, orientation]);

  // فعال/غیرفعال کردن ردیابی  
  const handleToggle = async () => {
    if (!isActive) {
      // اگر می‌خواهیم فعال کنیم، ابتدا بررسی کنیم که سنسورها پشتیبانی می‌شوند  
      if (!isSupported) {
        alert('سنسورهای دستگاه پشتیبانی نمی‌شوند.');
        return;
      }

      // بررسی مجوزها  
      if (!hasPermission) {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) {
          alert('برای استفاده از سنسورها، لطفاً دسترسی لازم را فعال کنید.');
          return;
        }
      }

      // گرفتن موقعیت اولیه از GPS  
      let initialLatLng = null;
      if (currentLocation?.coords) {
        // بررسی معتبر بودن مقادیر  
        if (!isNaN(currentLocation.coords.lat) && !isNaN(currentLocation.coords.lng)) {
          initialLatLng = {
            lat: currentLocation.coords.lat,
            lng: currentLocation.coords.lng,
            accuracy: currentLocation.coords.accuracy
          };
          console.log('Using initial GPS position:', initialLatLng);
        } else {
          console.warn('Invalid GPS coordinates:', currentLocation.coords);
        }
      } else {
        console.warn('No current location available for initial position');
      }

      // شروع ردیابی با موقعیت اولیه  
      advancedDeadReckoningService.toggle(initialLatLng);
    } else {
      // توقف ردیابی  
      advancedDeadReckoningService.toggle();
    }
  };

  // بازنشانی سیستم  
  const handleReset = () => {
    advancedDeadReckoningService.reset();
  };

  // خروجی گرفتن از لاگ‌ها  
  const handleExport = () => {
    advancedDeadReckoningService.exportLog();
  };

  // تغییر طول گام  
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

      {/* نمایش وضعیت کالیبراسیون */}
      {isActive && isCalibrating && (
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

      {/* نمایش وضعیت فیلتر کالمن برای دیباگ */}
      {kalmanState && (
        <div style={{ fontSize: '12px', marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
          <p>موقعیت نسبی: ({kalmanState.x.toFixed(2)}, {kalmanState.y.toFixed(2)}) متر</p>
          <p>جهت: {(kalmanState.theta * 180 / Math.PI).toFixed(2)}°</p>
          <p>سرعت: {kalmanState.v.toFixed(2)} m/s</p>
          <p>سرعت زاویه‌ای: {(kalmanState.w * 180 / Math.PI).toFixed(2)}°/s</p>
        </div>
      )}
    </div>
  );
};

export default DeadReckoningControls;  