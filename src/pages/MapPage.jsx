import React, { useState, useEffect } from 'react';  
import MapView from '../components/map/MapView';  
import { useGPSStore } from '../store/gpsStore';  
import useGPS from '../hooks/useGPS';  
import useIMU from '../hooks/useIMU';  

const MapPage = () => {  
  const [mapMode, setMapMode] = useState('gps'); // 'gps', 'qr', 'imu'  
  const { currentLocation, isTracking, toggleTracking } = useGPSStore();  
  const [positionError, setPositionError] = useState(null);  
  
  const { position, error, loading, startWatching, stopWatching } = useGPS({  
    enableHighAccuracy: true,  
    watchPosition: true  
  });  
  
  const { stepCount, orientation, isCalibrating } = useIMU();  
  
  // مدیریت خطاهای GPS  
  useEffect(() => {  
    if (error) {  
      setPositionError(`خطا در دریافت موقعیت: ${error.message}`);  
    } else {  
      setPositionError(null);  
    }  
  }, [error]);  
  
  // آغاز/توقف ردیابی  
  const handleTrackingToggle = () => {  
    if (!isTracking) {  
      startWatching();  
    } else {  
      stopWatching();  
    }  
    toggleTracking();  
  };  
  
  return (  
    <div className="map-page">  
      <div className="map-controls">  
        <div className="mode-selector">  
          <button   
            className={mapMode === 'gps' ? 'active' : ''}   
            onClick={() => setMapMode('gps')}  
          >  
            GPS  
          </button>  
          <button   
            className={mapMode === 'qr' ? 'active' : ''}   
            onClick={() => setMapMode('qr')}  
          >  
            QR Code  
          </button>  
          <button   
            className={mapMode === 'imu' ? 'active' : ''}   
            onClick={() => setMapMode('imu')}  
          >  
            IMU (Dead Reckoning)  
          </button>  
        </div>  
        
        <button   
          className={`tracking-toggle ${isTracking ? 'active' : ''}`}  
          onClick={handleTrackingToggle}  
        >  
          {isTracking ? 'توقف ردیابی' : 'شروع ردیابی'}  
        </button>  
      </div>  
      
      {positionError && (  
        <div className="error-message">  
          {positionError}  
        </div>  
      )}  
      
      <div className="location-info">  
        {loading ? (  
          <div className="loading">در حال دریافت موقعیت...</div>  
        ) : currentLocation ? (  
          <div className="coordinates">  
            <div>عرض جغرافیایی: {currentLocation.coords.lat.toFixed(6)}</div>  
            <div>طول جغرافیایی: {currentLocation.coords.lng.toFixed(6)}</div>  
            <div>دقت: {currentLocation.coords.accuracy.toFixed(2)} متر</div>  
          </div>  
        ) : (  
          <div>موقعیت در دسترس نیست</div>  
        )}  
      </div>  
      
      {mapMode === 'imu' && (  
        <div className="imu-info">  
          <h3>اطلاعات IMU</h3>  
          {isCalibrating ? (  
            <div>در حال کالیبراسیون...</div>  
          ) : (  
            <>  
              <div>تعداد قدم‌ها: {stepCount}</div>  
              <div>جهت: {orientation.alpha?.toFixed(2)}°</div>  
            </>  
          )}  
        </div>  
      )}  
      
      <MapView height="70vh" trackUser={true} />  
      
      <div className="action-buttons">  
        <button className="save-location-btn">  
          ذخیره موقعیت فعلی  
        </button>  
        <button className="share-location-btn">  
          اشتراک‌گذاری موقعیت  
        </button>  
        <button className="navigation-btn">  
          مسیریابی  
        </button>  
      </div>  
    </div>  
  );  
};  

export default MapPage;  