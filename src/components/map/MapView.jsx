// src/components/map/MapView.jsx  
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, ZoomControl } from 'react-leaflet';
import DeadReckoningControls from './DeadReckoningControls';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import advancedDeadReckoningService from '../../services/AdvancedDeadReckoningService';

// حل مشکل آیکون‌های Leaflet  
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// آیکون موقعیت فعلی GPS (آبی)  
const currentLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwODVmZiIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjgiLz48L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// آیکون موقعیت تخمینی Dead Reckoning (قرمز)  
const drLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2U1MzkzNSIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjgiLz48L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// آیکون فلش جهت (با زاویه پویا)  
const headingArrowIcon = (headingInDegrees) => {
  console.log('Creating arrow icon with heading:', headingInDegrees);
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">  
      <circle cx="12" cy="12" r="10" fill="rgba(255,0,0,0.2)" />  
      <path fill="red" stroke="white" stroke-width="0.5" transform="rotate(${headingInDegrees}, 12, 12)" d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z"/>  
    </svg>`)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// کامپوننت کنترل خودکار مرکز نقشه  
const AutoCenterMap = ({ position, follow }) => {
  const map = useMap();

  useEffect(() => {
    if (position && follow) {
      map.setView(position, map.getZoom());
    }
  }, [position, follow, map]);

  return null;
};

const MapView = ({
  currentLocation,
  locationHistory = [],
  savedLocations = [],
  followUser = true,
  initialZoom = 15
}) => {
  const [map, setMap] = useState(null);
  const [isFollowing, setIsFollowing] = useState(followUser);
  const [isDrActive, setIsDrActive] = useState(advancedDeadReckoningService.isActive);
  const [drGeoPath, setDrGeoPath] = useState([]);
  const [kalmanState, setKalmanState] = useState(null);
  const [drPosition, setDrPosition] = useState(null);
  const [stepCount, setStepCount] = useState(0);
  const [headingInDegrees, setHeadingInDegrees] = useState(0);

  // موقعیت مرکز نقشه (یا موقعیت فعلی GPS یا موقعیت DR)  
  const centerPosition = drPosition && isFollowing && isDrActive
    ? [drPosition.lat, drPosition.lng]
    : currentLocation?.coords
      ? [currentLocation.coords.lat, currentLocation.coords.lng]
      : null;

  // مسیر GPS طی شده  
  const pathPoints = locationHistory
    .filter(loc => loc?.coords?.lat && loc?.coords?.lng)
    .map(loc => [loc.coords.lat, loc.coords.lng]);

  // اضافه کردن listener برای Advanced Dead Reckoning Service  
  useEffect(() => {
    const removeListener = advancedDeadReckoningService.addListener((data) => {
      // به‌روزرسانی وضعیت فعال بودن سرویس  
      setIsDrActive(data.isActive);

      // به‌روزرسانی تعداد گام‌ها  
      if (data.stepCount !== undefined) {
        setStepCount(data.stepCount);
      }

      // به‌روزرسانی وضعیت فیلتر کالمن  
      // در بخش به‌روزرسانی کالمن  
      if (data.kalmanState) {
        try {
          setKalmanState(data.kalmanState);

          // محاسبه زاویه جهت به درجه - با validation  
          if (data.kalmanState.theta !== undefined && isFinite(data.kalmanState.theta)) {
            const degreeAngle = ((data.kalmanState.theta * 180 / Math.PI) + 360) % 360;
            setHeadingInDegrees(degreeAngle);
            console.log('MapView heading updated (degrees):', degreeAngle.toFixed(2));
          } else {
            console.warn('Invalid theta value in kalmanState:', data.kalmanState.theta);
          }
        } catch (error) {
          console.error('Error processing kalmanState:', error);
        }
      }

      // به‌روزرسانی موقعیت تخمینی  
      if (data.currentPosition) {
        setDrPosition(data.currentPosition);
      }

      // به‌روزرسانی مسیر جغرافیایی Dead Reckoning  
      if (data.geoPath && data.geoPath.length > 0) {
        const formattedPath = data.geoPath.map(point => {
          if (isNaN(point.lat) || isNaN(point.lng)) {
            return null;
          }
          return [point.lat, point.lng];
        }).filter(point => point !== null);

        setDrGeoPath(formattedPath);
      }
    });

    return () => removeListener();
  }, []);

  // ارسال داده‌های GPS به سرویس  
  useEffect(() => {
    if (isDrActive && currentLocation?.coords) {
      advancedDeadReckoningService.processGpsData(
        { lat: currentLocation.coords.lat, lng: currentLocation.coords.lng },
        currentLocation.coords.accuracy,
        Date.now()
      );
    }
  }, [isDrActive, currentLocation]);

  // تغییر وضعیت تعقیب کاربر  
  const toggleFollow = () => {
    setIsFollowing(prev => !prev);
    if (!isFollowing && centerPosition && map) {
      map.setView(centerPosition, map.getZoom() || initialZoom);
    }
  };

  // محاسبه مرکز اولیه نقشه  
  const getInitialCenter = () => {
    if (currentLocation?.coords) {
      return [currentLocation.coords.lat, currentLocation.coords.lng];
    }
    if (locationHistory.length > 0 && locationHistory[0]?.coords) {
      return [locationHistory[0].coords.lat, locationHistory[0].coords.lng];
    }
    // مرکز پیش‌فرض - تهران  
    return [35.6892, 51.3890];
  };

  // اضافه کردن کامپوننت تست زاویه  
  const DebugRotationTester = ({ onTestRotation }) => {
    const [testDegree, setTestDegree] = useState(45);

    return (
      <div className="debug-rotation-tester">
        <input
          type="range"
          min="0"
          max="359"
          value={testDegree}
          onChange={(e) => setTestDegree(parseInt(e.target.value))}
        />
        <span>{testDegree}°</span>
        <button onClick={() => onTestRotation(testDegree)}>
          Set Heading
        </button>
      </div>
    );
  };

  // و استفاده از آن در کامپوننت اصلی:  
  {
    process.env.NODE_ENV === 'development' && (
      <div className="debug-panel">
        <DebugRotationTester
          onTestRotation={(degrees) => {
            if (typeof advancedDeadReckoningService.forceRotation === 'function') {
              advancedDeadReckoningService.forceRotation(degrees);
            }
          }}
        />
      </div>
    )
  }

  // اضافه کردن useEffect برای مانیتورینگ تغییرات جهت  
  useEffect(() => {
    if (kalmanState?.theta !== undefined) {
      const degrees = ((kalmanState.theta * 180 / Math.PI) + 360) % 360;
      console.log('Current heading (degrees):', degrees.toFixed(2));
    }
  }, [kalmanState?.theta]);

  return (
    <div className="map-fullscreen">
      <MapContainer
        center={getInitialCenter()}
        zoom={initialZoom}
        className="map-container"
        whenCreated={setMap}
        zoomControl={false}
      >
        <ZoomControl position="topright" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* نمایش موقعیت فعلی کاربر (از GPS) */}
        {currentLocation?.coords && (
          <>
            <Marker
              position={[currentLocation.coords.lat, currentLocation.coords.lng]}
              icon={currentLocationIcon}
              zIndexOffset={500}
            >
              <Popup>
                <div>
                  <h3>موقعیت GPS</h3>
                  <p>طول جغرافیایی: {currentLocation.coords.lng.toFixed(6)}</p>
                  <p>عرض جغرافیایی: {currentLocation.coords.lat.toFixed(6)}</p>
                  <p>دقت: {currentLocation.coords.accuracy.toFixed(1)} متر</p>
                </div>
              </Popup>
            </Marker>

            {/* دایره دقت GPS */}
            <Circle
              center={[currentLocation.coords.lat, currentLocation.coords.lng]}
              radius={currentLocation.coords.accuracy}
              color="#0085ff"
              fillColor="#0085ff"
              fillOpacity={0.1}
              weight={1}
            />
          </>
        )}

        {/* نمایش موقعیت تخمینی Dead Reckoning */}
        {isDrActive && drPosition && !isNaN(drPosition.lat) && !isNaN(drPosition.lng) && (
          <>
            <Marker
              position={[drPosition.lat, drPosition.lng]}
              icon={drLocationIcon}
              zIndexOffset={600}
            >
              <Popup>
                <div>
                  <h3>موقعیت تخمینی (DR)</h3>
                  <p>طول جغرافیایی: {drPosition.lng.toFixed(6)}</p>
                  <p>عرض جغرافیایی: {drPosition.lat.toFixed(6)}</p>
                  {kalmanState && (
                    <>
                      <p>جهت (درجه): {headingInDegrees.toFixed(2)}</p>
                      <p>سرعت: {kalmanState.v.toFixed(2)} متر بر ثانیه</p>
                      <p>طول گام: {kalmanState.stride.toFixed(2)} متر</p>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* فلش جهت‌دار */}
            {kalmanState?.theta !== undefined && (
              <Marker
                position={[drPosition.lat, drPosition.lng]}
                icon={headingArrowIcon(headingInDegrees)}
                zIndexOffset={1000}
              />
            )}
          </>
        )}

        {/* مسیر GPS طی شده */}
        {pathPoints.length > 1 && (
          <Polyline
            positions={pathPoints}
            color="#0085ff"
            weight={3}
            opacity={0.7}
          />
        )}

        {/* مسیر Dead Reckoning */}
        {isDrActive && drGeoPath.length > 1 && (
          <Polyline
            positions={drGeoPath.filter(point =>
              !isNaN(point[0]) && !isNaN(point[1])
            )}
            color="#e53935"
            weight={3}
            opacity={0.7}
          />
        )}

        {/* نقاط ذخیره شده */}
        {savedLocations.map((location, index) => (
          <Marker
            key={location.id || index}
            position={[location.coords.lat, location.coords.lng]}
          >
            <Popup>
              <div>
                <h3>{location.name || `نقطه ${index + 1}`}</h3>
                <p>طول جغرافیایی: {location.coords.lng.toFixed(6)}</p>
                <p>عرض جغرافیایی: {location.coords.lat.toFixed(6)}</p>
                {location.timestamp && <p>زمان: {new Date(location.timestamp).toLocaleString()}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* تنظیم خودکار مرکز نقشه */}
        {centerPosition && <AutoCenterMap position={centerPosition} follow={isFollowing} />}
      </MapContainer>





      {/* دکمه‌های کنترل نقشه */}
      <div className="map-controls-overlay">
        {/* دکمه تعقیب موقعیت */}
        <button
          className={`map-control-button ${isFollowing ? 'active' : ''}`}
          onClick={toggleFollow}
          title={isFollowing ? 'توقف تعقیب موقعیت' : 'تعقیب موقعیت'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>

        {/* دکمه مرکز به موقعیت فعلی */}
        {/* <button
          className="map-control-button"
          onClick={() => {
            if (centerPosition && map) {
              map.setView(centerPosition, map.getZoom());
              setIsFollowing(true);
            }
          }}
          title="مرکز به موقعیت فعلی"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <circle cx="12" cy="12" r="4"></circle>
          </svg>
        </button> */}
      </div>

      {/* کنترل‌های Dead Reckoning */}
      <DeadReckoningControls
        isActive={isDrActive}
        onToggle={() => {
          if (isDrActive) {
            advancedDeadReckoningService.stop();
          } else {
            if (currentLocation?.coords) {
              advancedDeadReckoningService.start({
                lat: currentLocation.coords.lat,
                lng: currentLocation.coords.lng
              });
            }
          }
        }}
        stepCount={stepCount}
        kalmanState={kalmanState}
        heading={headingInDegrees}
        onReset={() => {
          if (isDrActive && currentLocation?.coords) {
            advancedDeadReckoningService.resetToPosition({
              lat: currentLocation.coords.lat,
              lng: currentLocation.coords.lng
            });
          }
        }}
        // اضافه کردن تست چرخش برای دیباگ  
        onTestRotation={(degrees) => {
          if (advancedDeadReckoningService.forceRotation) {
            advancedDeadReckoningService.forceRotation(degrees);
          } else {
            console.warn('forceRotation method not available');
          }
        }}
      />
    </div>
  );
};

export default MapView;  