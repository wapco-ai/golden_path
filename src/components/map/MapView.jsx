// src/components/map/MapView.jsx  
import React, { useEffect, useState } from 'react';  
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, ZoomControl } from 'react-leaflet';  
import L from 'leaflet';  
import 'leaflet/dist/leaflet.css';  
import './Map.css';  
import AdvancedDeadReckoningControls from './DeadReckoningControls';   
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

/// آیکون جهت‌دار برای نمایش heading Dead Reckoning  
const headingArrowIcon = (headingInDegrees) => new L.Icon({  
  iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">  
    <path fill="red" transform="rotate(${headingInDegrees}, 12, 12)" d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z"/>  
  </svg>`)}`,  
  iconSize: [32, 32],  
  iconAnchor: [16, 16],  
  popupAnchor: [0, -16],  
});  

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
      // console.log('DR Service Event:', data);  
      
      // به‌روزرسانی وضعیت فعال بودن سرویس  
      setIsDrActive(data.isActive);  
      
      // به‌روزرسانی مسیر جغرافیایی Dead Reckoning  
      if (data.geoPath && data.geoPath.length > 0) {  
        const formattedPath = data.geoPath.map(point => [point.lat, point.lng]);  
        setDrGeoPath(formattedPath);  
      }  
      
      // به‌روزرسانی وضعیت کالمن  
      if (data.kalmanState) {  
        setKalmanState(data.kalmanState);  
        
        // اگر نقطه مرجع موجود است، موقعیت جغرافیایی را محاسبه کنید  
        if (advancedDeadReckoningService.referencePosition && data.kalmanState.x !== undefined && data.kalmanState.y !== undefined) {  
          const geoPosition = advancedDeadReckoningService._calculateNewLatLng(  
            advancedDeadReckoningService.referencePosition.lat,  
            advancedDeadReckoningService.referencePosition.lng,  
            data.kalmanState.x,  
            data.kalmanState.y  
          );  
          
          setDrPosition(geoPosition);  
        }  
      }  
      
      // اگر سرویس ریست شده است، مسیر را پاک کنید  
      if (data.type === 'serviceReset') {  
        setDrGeoPath([]);  
        // نقطه اول را اضافه کنید اگر موجود است  
        if (data.geoPath && data.geoPath.length > 0) {  
          setDrGeoPath([[data.geoPath[0].lat, data.geoPath[0].lng]]);  
        }  
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

  // تبدیل جهت رادیان به درجه (برای نمایش فلش)  
  const headingInDegrees = kalmanState?.theta !== undefined   
    ? ((kalmanState.theta * 180 / Math.PI) + 360) % 360   
    : 0;  

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
        {isDrActive && drPosition && (  
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
            positions={drGeoPath}  
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
      <AdvancedDeadReckoningControls currentLocation={currentLocation} />  
    </div>  
  );  
};  

export default MapView;  