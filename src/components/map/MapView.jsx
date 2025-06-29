// src/components/map/MapView.jsx  
import React, { useEffect, useState } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeadReckoningControls from './DeadReckoningControls';
import osmStyle from '../../services/osmStyle';
import GeoJsonOverlay from './GeoJsonOverlay';


import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';
import advancedDeadReckoningService from '../../services/AdvancedDeadReckoningService';

// حل مشکل آیکون‌های Leaflet  
// Custom icons implemented as simple divs for MapLibre markers
const currentLocationIcon = (
  <div style={{
    width: 20,
    height: 20,
    backgroundColor: '#0085ff',
    borderRadius: '50%',
    border: '3px solid white'
  }} />
);

const drLocationIcon = (
  <div style={{
    width: 20,
    height: 20,
    backgroundColor: '#e53935',
    borderRadius: '50%',
    border: '3px solid white'
  }} />
);

const DirectionIndicator = ({ position, heading }) => (
  <Marker longitude={position.lng} latitude={position.lat} anchor="center">
    {headingArrowIcon(heading)}
  </Marker>
);

const headingArrowIcon = (headingInDegrees) => (
  <div style={{
    transform: `rotate(${headingInDegrees}deg)`
  }}>
    <svg width="30" height="30" viewBox="0 0 30 30">
      <path d="M15 0 L30 30 L15 20 L0 30 Z" fill="#ff4500" />
    </svg>
  </div>
);




const MapView = ({
  currentLocation,
  locationHistory = [],
  savedLocations = [],
  followUser = true,
  initialZoom = 15
}) => {
  const [isFollowing, setIsFollowing] = useState(followUser);
  const [isDrActive, setIsDrActive] = useState(advancedDeadReckoningService.isActive);
  const [drGeoPath, setDrGeoPath] = useState([]);
  const [kalmanState, setKalmanState] = useState(null);
  const [drPosition, setDrPosition] = useState(null);
  const [stepCount, setStepCount] = useState(0);
  const [headingInDegrees, setHeadingInDegrees] = useState(0);

  const getInitialCenter = () => {
    if (currentLocation?.coords) {
      return [currentLocation.coords.lat, currentLocation.coords.lng];
    }
    if (locationHistory.length > 0 && locationHistory[0]?.coords) {
      return [locationHistory[0].coords.lat, locationHistory[0].coords.lng];
    }
    return [35.6892, 51.3890];
  };

  const [viewState, setViewState] = useState({
    latitude: getInitialCenter()[0],
    longitude: getInitialCenter()[1],
    zoom: initialZoom
  });

  const handleMove = React.useCallback((evt) => {
    const ns = evt.viewState;
    setViewState((v) =>
      v.latitude === ns.latitude && v.longitude === ns.longitude && v.zoom === ns.zoom
        ? v
        : ns
    );
  }, []);

  useEffect(() => {
    if (centerPosition && isFollowing) {
      setViewState(v => ({ ...v, latitude: centerPosition[0], longitude: centerPosition[1] }));
    }
  }, [centerPosition, isFollowing]);


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
    if (!isFollowing && centerPosition) {
      setViewState(v => ({ ...v, latitude: centerPosition[0], longitude: centerPosition[1] }));
    }
  };

  // محاسبه مرکز اولیه نقشه  

  // تبدیل جهت رادیان به درجه (برای نمایش فلش)  
  // headingInDegrees = kalmanState?.theta !== undefined
  //   ? ((kalmanState.theta * 180 / Math.PI) + 360) % 360
  //   : 0;

  return (
    <div className="map-fullscreen">
      <Map
        mapLib={maplibregl}
        mapStyle={osmStyle}
        style={{ width: '100%', height: '100%' }}
        viewState={viewState}
        onMove={handleMove}
      >
        {currentLocation?.coords && (
          <Marker longitude={currentLocation.coords.lng} latitude={currentLocation.coords.lat} anchor="center">
            {currentLocationIcon}
          </Marker>
        )}

        {isDrActive && drPosition && !isNaN(drPosition.lat) && !isNaN(drPosition.lng) && (
          <>
            <Marker longitude={drPosition.lng} latitude={drPosition.lat} anchor="center">
              {drLocationIcon}
            </Marker>
            {kalmanState?.theta !== undefined && (
              <DirectionIndicator position={drPosition} heading={headingInDegrees} />
            )}
          </>
        )}

        {pathPoints.length > 1 && (
          <Source
            id="gps-path"
            type="geojson"
            data={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: pathPoints.map(p => [p[1], p[0]])
              }
            }}
          >
            <Layer id="gps-line" type="line" paint={{ 'line-color': '#0085ff', 'line-width': 3, 'line-opacity': 0.7 }} />
          </Source>
        )}

        {isDrActive && drGeoPath.length > 1 && (
          <Source
            id="dr-path"
            type="geojson"
            data={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: drGeoPath.map(p => [p[1], p[0]])
              }
            }}
          >
            <Layer id="dr-line" type="line" paint={{ 'line-color': '#e53935', 'line-width': 3, 'line-opacity': 0.7 }} />
          </Source>
        )}

        <GeoJsonOverlay />

        {savedLocations.map((location, index) => (
          <Marker key={location.id || index} longitude={location.coords.lng} latitude={location.coords.lat} anchor="bottom">
            <div className="saved-marker" />
          </Marker>
        ))}
      </Map>

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
            if (centerPosition) {
              setViewState(v => ({ ...v, latitude: centerPosition[0], longitude: centerPosition[1] }));
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