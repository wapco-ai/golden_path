import React, { useState, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import advancedDeadReckoningService from '../../services/AdvancedDeadReckoningService';
import useIMUSensors from '../../hooks/useIMUSensors';
import './DeadReckoningControls.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DeadReckoningControls = ({ currentLocation }) => {
  const [isActive, setIsActive] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [strideLength, setStrideLength] = useState(0.75);
  const [kalmanState, setKalmanState] = useState(null);
  const [stepCountErrorShown, setStepCountErrorShown] = useState(false);
  const intl = useIntl();

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
      if (data.isActive && !data.isCalibrating && data.stepCount === 0 && !stepCountErrorShown) {
        toast.error(intl.formatMessage({ id: 'drStepWarning' }));
        setStepCountErrorShown(true);
      }

      // اگر گام ثبت شده، خطا را غیرفعال کن  
      if (data.stepCount > 0) {
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
        toast.error(intl.formatMessage({ id: 'drSensorsUnsupported' }));
        return;
      }

      if (!checkPermissions()) {
        const ok = await requestPermission();
        if (!ok) { toast.error(intl.formatMessage({ id: 'drPermissionNeeded' })); return; }
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
        <div className="calibrating-status">
          <FormattedMessage id="drCalibrating" />
        </div>
      )}

      <div className="dr-button-group">
        <button
          className={`dr-button dr-button-start ${isActive ? 'active' : ''}`}
          onClick={handleToggle}
          disabled={!isSupported || (!isActive && !hasPermission && typeof DeviceMotionEvent.requestPermission === 'function')}
        >
          {isActive ? (
            <FormattedMessage id="drStopTracking" />
          ) : (
            <FormattedMessage id="drStartTracking" />
          )}
        </button>

        <button
          className="dr-button dr-button-reset"
          onClick={handleReset}
          disabled={!isActive}
        >
          <FormattedMessage id="drReset" />
        </button>

        <button
          className="dr-button dr-button-export"
          onClick={handleExport}
          disabled={stepCount === 0 && !kalmanState}
        >
          <FormattedMessage id="drExportLog" />
        </button>
      </div>

      <div className="dr-step-count">
        <FormattedMessage id="drStepCount" /> {stepCount}
      </div>

      <div className="dr-stride-control">
        <label className="dr-stride-label">
          <FormattedMessage id="drStrideLength" />
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
          <p><FormattedMessage id="drRelPosition" /> ({kalmanState.x.toFixed(2)}, {kalmanState.y.toFixed(2)}) <FormattedMessage id="meters" /></p>
          <p><FormattedMessage id="drHeading" /> {(kalmanState.theta * 180 / Math.PI).toFixed(2)}</p>
          <p><FormattedMessage id="drLinearSpeed" /> {kalmanState.v.toFixed(2)} <FormattedMessage id="metersPerSecond" /></p>
          <p><FormattedMessage id="drAngularSpeed" /> {(kalmanState.w * 180 / Math.PI).toFixed(2)} <FormattedMessage id="degreesPerSecond" /></p>
          <p><FormattedMessage id="drEstimatedStride" /> {kalmanState.stride.toFixed(2)} <FormattedMessage id="meters" /></p>
        </div>
      )}
      {isActive && (
        <div className="debug-panel">
          <div className="debug-item">
            <span>Heading:</span> {kalmanState?.theta ? ((kalmanState.theta * 180 / Math.PI) + 360) % 360 : 0}°
          </div>
          <div className="debug-item">
            <span>Position:</span> x: {kalmanState?.x.toFixed(2)}m, y: {kalmanState?.y.toFixed(2)}m
          </div>
          <div className="debug-item">
            <span>Gyro:</span> α: {rotationRate?.alpha.toFixed(2)}°/s, β: {rotationRate?.beta.toFixed(2)}°/s
          </div>
          <div className="debug-item">
            <span>Accel:</span> {acceleration ? Math.sqrt(
              Math.pow(acceleration.x, 2) +
              Math.pow(acceleration.y, 2) +
              Math.pow(acceleration.z, 2)
            ).toFixed(2) : 0} m/s²
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadReckoningControls;  