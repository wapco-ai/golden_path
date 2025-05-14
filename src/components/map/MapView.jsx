// src/components/map/MapView.jsx  
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, ZoomControl } from 'react-leaflet';
import DeadReckoningControls from './DeadReckoningControls';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
// import AdvancedDeadReckoningControls from './DeadReckoningControls';
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

// آیکون Dead Reckoning (قرمز)  
const drLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2U1MzkzNSIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjgiLz48L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// اصلاح تابع headingArrowIcon برای نمایش بهتر  
const headingArrowIcon = (headingInDegrees) => new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">  
    <circle cx="12" cy="12" r="10" fill="rgba(255,0,0,0.2)" />  
    <path fill="red" stroke="white" stroke-width="0.5" transform="rotate(${headingInDegrees}, 12, 12)" d="M12,3L19,18H12L5,18L12,3Z"/>  
  </svg>`)}`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const DirectionIndicator = ({ position, heading }) => {
  const map = useMap();
  const [arrow, setArrow] = useState(null);

  useEffect(() => {
    if (!position) return;

    // Remove previous arrow
    if (arrow) {
      map.removeLayer(arrow);
    }

    // Create a new arrow icon
    const arrowIcon = L.divIcon({
      html: `<div style="transform: rotate(${heading}deg); transform-origin: center; width: 100%; height: 100%;">
               <svg width="30" height="30" viewBox="0 0 30 30">
                 <path d="M15 0 L30 30 L15 20 L0 30 Z" fill="#ff4500" />
               </svg>
             </div>`,
      className: 'direction-arrow',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    // Create new marker with arrow icon
    const newArrow = L.marker([position.lat, position.lng], { icon: arrowIcon }).addTo(map);
    setArrow(newArrow);

    return () => {
      if (arrow) map.removeLayer(arrow);
    };
  }, [map, position, heading]);

  return null;
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
      console.log('data.type: ', data.type);
      // if (data.type === 'stepDetected' || data.type === 'serviceStateChanged') {
      // به‌روزرسانی شمارنده گام  
      if (data.stepCount !== undefined && data.stepCount !== null) {
        setStepCount(data.stepCount);
      }

      // به‌روزرسانی وضعیت کالمن  
      // if (data.kalmanState) {
      //   setKalmanState(data.kalmanState);
      //   // محاسبه جهت به درجه  
      //   const headingRad = data.kalmanState.theta;
      //   setHeadingInDegrees(((headingRad * 180 / Math.PI) + 360) % 360);
      // }

      // به‌روزرسانی موقعیت تخمینی  
      if (data.geoPosition) {
        // بررسی اعتبار موقعیت  
        if (!isNaN(data.geoPosition.lat) && !isNaN(data.geoPosition.lng)) {
          // console.log('Updating DR position:', data.geoPosition);
          setDrPosition(data.geoPosition);
        }
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
      // }
    });

    return () => removeListener();
  }, []);

  // Add this useEffect for separate tracking of heading changes  
  useEffect(() => {
    if (kalmanState?.theta !== undefined) {
      const heading = kalmanState?.theta ?? 0;      // fallback = 0 rad
      // const degrees = ((kalmanState.theta * 180 / Math.PI) + 360) % 360;
      // console.log(`Updating heading: ${headingInDegrees.toFixed(1)}° → ${degrees.toFixed(1)}°`);
      setHeadingInDegrees(heading);

    }
  }, [kalmanState?.theta]);

  // Inside your component, add this useEffect to log state changes  
  useEffect(() => {
    console.log('Heading state updated:', headingInDegrees.toFixed(2), '°');
  }, [headingInDegrees]);
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

  // تبدیل جهت رادیان به درجه (برای نمایش فلش)  
  // headingInDegrees = kalmanState?.theta !== undefined
  //   ? ((kalmanState.theta * 180 / Math.PI) + 360) % 360
  //   : 0;

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
            {kalmanState?.theta !== undefined && drPosition && !isNaN(drPosition.lat) && !isNaN(drPosition.lng) && (
              <Marker
                key={`heading-${headingInDegrees.toFixed(1)}`} // Force re-render on heading change  
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

        {/* Add the new DirectionIndicator component here */}
        {drGeoPath.length > 0 && isDrActive && kalmanState && (
          <DirectionIndicator
            position={drGeoPath[drGeoPath.length - 1]}
            heading={headingInDegrees}
          />
        )}

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
        <button
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
        </button>
      </div>

      {/* پنل اطلاعات موقعیت */}
      {currentLocation?.coords && (

        <div className="location-panel">
          <div className="coordinates-display">
            <div>
              <span>عرض:</span> {currentLocation.coords.lat.toFixed(6)}
            </div>
            <div>
              <span>طول:</span> {currentLocation.coords.lng.toFixed(6)}
            </div>
            <div>
              <span>دقت:</span> {currentLocation.coords.accuracy.toFixed(1)} متر
            </div>
          </div>
        </div>
      )}

      {/* پنل کنترل‌های Dead Reckoning */}
      <DeadReckoningControls currentLocation={currentLocation} />
    </div>
  );
};

export default MapView;  